// Tool definitions and executors for the agent loop. Deterministic tools are
// plain TypeScript; only extract_visit_schedule calls Claude.
// Patient rows stay in RunContext on the server and never go into a tool result.

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { COST_UNKNOWN_CAVEAT, DEFAULT_ASSUMPTIONS, SUPPORT_LABELS, type Assumptions } from "../assumptions";
import { parsePatients } from "../scoring/parsePatients";
import { scorePatients } from "../scoring/score";
import { simulateSupports, summarizeGroups, type SimulationRun } from "../scoring/simulate";
import type { GroupBy, GroupSummary, ParticipantCompensation, Patient, ScoreResult, SupportKey, ToolName, TrialInfo, VisitSchedule } from "../types";
import { GROUP_BYS, SUPPORT_KEYS } from "../types";
import { extractVisitSchedule } from "./llm";
import { fetchTrial, trialText } from "./trial";

export interface RunContext {
  csv: string;
  protocolText?: string;
  assumptions: Assumptions;
  trial?: TrialInfo;
  schedule?: VisitSchedule;
  patients?: Patient[];
  score?: ScoreResult;
  sim?: SimulationRun;
  groups: Partial<Record<GroupBy, GroupSummary>>;
}

export const newContext = (csv: string, protocolText?: string, participantCompensation?: ParticipantCompensation): RunContext => ({
  csv,
  protocolText: protocolText?.trim() || undefined,
  assumptions: participantCompensation ? { ...DEFAULT_ASSUMPTIONS, participantCompensation } : DEFAULT_ASSUMPTIONS,
  groups: {},
});

const noInput = { type: "object" as const, properties: {}, additionalProperties: false };

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "fetch_trial",
    description: "Fetch a trial from ClinicalTrials.gov (API v2). Falls back to a bundled cached copy if the live call fails, and says so. Returns title, conditions, status and Miami-Dade site count.",
    input_schema: {
      type: "object",
      properties: { nct_id: { type: "string", description: "NCT ID, e.g. NCT05232071" } },
      required: ["nct_id"],
      additionalProperties: false,
    },
  },
  {
    name: "extract_visit_schedule",
    description: "Read the fetched trial text (or the protocol text the user pasted, if any) and return the structured visit schedule. Fields not stated come back as \"unknown\". Requires fetch_trial first.",
    input_schema: noInput,
  },
  {
    name: "parse_patients",
    description: "Validate the uploaded de-identified patient CSV against the schema. Rejects files with identifying columns. Returns only a patient count and data-quality summary.",
    input_schema: noInput,
  },
  {
    name: "score_patients",
    description: "Pure code. Score each patient's friction at each visit and their risk of leaving without support. Returns tier counts, the most common barriers, the hardest visits, recommended-support counts and the top patient IDs by need.",
    input_schema: noInput,
  },
  {
    name: "simulate_supports",
    description: "Pure code. Re-score with the chosen supports turned on and return completion before/after and the cost of each support under the scenario assumptions.",
    input_schema: {
      type: "object",
      properties: {
        supports: { type: "array", items: { type: "string", enum: [...SUPPORT_KEYS] }, description: "Supports to turn on" },
      },
      required: ["supports"],
      additionalProperties: false,
    },
  },
  {
    name: "summarize_groups",
    description: "Pure code. Completion before/after the simulated supports, by group. Groups under 10 patients are returned as \"Too small to report\". Requires simulate_supports first.",
    input_schema: {
      type: "object",
      properties: { group_by: { type: "string", enum: [...GROUP_BYS] } },
      required: ["group_by"],
      additionalProperties: false,
    },
  },
];

const inputs = {
  fetch_trial: z.object({ nct_id: z.string() }),
  extract_visit_schedule: z.object({}).passthrough(),
  parse_patients: z.object({}).passthrough(),
  score_patients: z.object({}).passthrough(),
  simulate_supports: z.object({ supports: z.array(z.enum(SUPPORT_KEYS)) }),
  summarize_groups: z.object({ group_by: z.enum(GROUP_BYS) }),
} satisfies Record<ToolName, z.ZodTypeAny>;

export const isToolName = (n: string): n is ToolName => n in inputs;

export interface ToolOutcome {
  /** What Claude sees (aggregates and IDs only). */
  forModel: unknown;
  /** One line for the UI timeline. */
  summary: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

function countBy<T>(items: T[], key: (t: T) => string | string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) for (const k of ([] as string[]).concat(key(it))) out[k] = (out[k] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
}

function requireStep<T>(value: T | undefined, msg: string): T {
  if (value === undefined) throw new Error(msg);
  return value;
}

export async function runTool(name: ToolName, rawInput: unknown, ctx: RunContext): Promise<ToolOutcome> {
  const parsed = inputs[name].safeParse(rawInput ?? {});
  if (!parsed.success) throw new Error(`Invalid input for ${name}: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  const input = parsed.data as Record<string, unknown>;

  switch (name) {
    case "fetch_trial": {
      const t = await fetchTrial(String(input.nct_id));
      ctx.trial = t;
      const miami = t.locations.filter((l) => /miami|hialeah|doral|homestead|kendall|coral gables|aventura|miami beach/i.test(l.city));
      return {
        summary: `${t.nctId}: ${t.title.slice(0, 90)}${t.title.length > 90 ? "…" : ""} (${t.source === "live" ? "live" : "cached copy"})`,
        forModel: {
          nctId: t.nctId,
          title: t.title,
          conditions: t.conditions,
          overallStatus: t.overallStatus,
          source: t.source,
          sourceNote: t.sourceNote,
          totalSites: t.locations.length,
          miamiDadeSites: miami.map((l) => `${l.facility}, ${l.city}`),
          outcomeTimeFrames: t.outcomeTimeFrames.slice(0, 8),
        },
      };
    }

    case "extract_visit_schedule": {
      const trial = requireStep(ctx.trial, "No trial fetched yet. Call fetch_trial first.");
      const pasted = ctx.protocolText;
      const s = await extractVisitSchedule(pasted ? `${trialText(trial)}\n\nProtocol / visit schedule text pasted by the research team:\n${pasted}` : trialText(trial), pasted ? "pasted" : "registry");
      ctx.schedule = s;
      const unknownFields = s.visits.reduce((n, v) => n + [v.week, v.durationMinutes, v.fasting, v.timeOfDay, v.inPerson].filter((x) => x === "unknown").length, 0);
      return {
        summary: s.scheduleFound ? `${s.visits.length} visits found; ${unknownFields} fields not stated (marked unknown)` : "No visit schedule in this text; paste the protocol schedule to continue",
        forModel: { scheduleFound: s.scheduleFound, visits: s.visits, materialsLanguages: s.materialsLanguages, notes: s.notes, evidence: s.evidence },
      };
    }

    case "parse_patients": {
      const r = parsePatients(ctx.csv);
      if (!r.ok) throw new Error(r.error);
      ctx.patients = r.patients;
      return {
        summary: `${r.quality.accepted} of ${r.quality.rows} rows accepted${r.quality.ignoredColumns.length ? `; ignored ${r.quality.ignoredColumns.join(", ")}` : ""}`,
        forModel: {
          patientCount: r.quality.accepted,
          rowsInFile: r.quality.rows,
          rejectedRows: r.quality.rejectedRows.length,
          rejectedReasons: countBy(r.quality.rejectedRows, (x) => x.reason.replace(/".*?"/g, "…")),
          ignoredColumns: r.quality.ignoredColumns,
          note: "Clinical columns are ignored: medical eligibility is decided by the research team.",
        },
      };
    }

    case "score_patients": {
      const schedule = requireStep(ctx.schedule, "No visit schedule yet. Call extract_visit_schedule first.");
      if (!schedule.scheduleFound) throw new Error("The schedule has no visits, so there is nothing to score. Ask the user to paste the visit schedule.");
      const patients = requireStep(ctx.patients, "No patients yet. Call parse_patients first.");
      const r = scorePatients(schedule, patients, ctx.assumptions);
      ctx.score = r;
      const tiers = countBy(r.patients, (p) => p.tier);
      const visitLoad = r.scoredVisits
        .map((v) => {
          const cells = r.matrix.filter((c) => c.visitId === v.id);
          return { visit: v.label, meanFriction: Math.round((cells.reduce((s, c) => s + c.friction, 0) / (cells.length || 1)) * 1000) / 1000 };
        })
        .sort((a, b) => b.meanFriction - a.meanFriction);
      return {
        summary: `${tiers.High ?? 0} high, ${tiers.Medium ?? 0} medium, ${tiers.Low ?? 0} low support need across ${r.scoredVisits.length} scored visits`,
        forModel: {
          patients: patients.length,
          scoredVisits: r.scoredVisits.length,
          tierCounts: tiers,
          meanRiskOfLeavingWithoutSupport: Math.round((r.patients.reduce((s, p) => s + p.risk, 0) / (r.patients.length || 1)) * 1000) / 1000,
          patientsWithBarrierInTop3: countBy(r.patients, (p) => p.topBarriers.map((b) => b.key)),
          recommendedSupportCounts: countBy(r.patients, (p) => p.recommendedSupports),
          visitsByMeanFriction: visitLoad,
          top10PatientIdsByNeed: r.patients.slice(0, 10).map((p) => ({ id: p.patientId, tier: p.tier })),
          unknownNotes: r.unknownNotes,
          participantCompensation: ctx.assumptions.participantCompensation,
          ...(ctx.assumptions.participantCompensation.kind === "unknown" && { costCaveat: COST_UNKNOWN_CAVEAT }),
        },
      };
    }

    case "simulate_supports": {
      const schedule = requireStep(ctx.schedule, "No visit schedule yet.");
      const patients = requireStep(ctx.patients, "No patients yet. Call parse_patients first.");
      if (!ctx.score) throw new Error("Call score_patients before simulate_supports.");
      const supports = input.supports as SupportKey[];
      const sim = simulateSupports(schedule, patients, ctx.assumptions, supports);
      ctx.sim = sim;
      const r = sim.result;
      return {
        summary: `${supports.map((s) => SUPPORT_LABELS[s].label).join(", ") || "No supports"}: completion ${pct(r.completionBefore)} without, ${pct(r.completionAfter)} with, for about $${r.totalSupportCost.toLocaleString("en-US")}`,
        forModel: { ...r, note: "Scenario estimate from unvalidated assumptions, not a prediction." },
      };
    }

    case "summarize_groups": {
      const sim = requireStep(ctx.sim, "Call simulate_supports before summarize_groups.");
      const by = input.group_by as GroupBy;
      const g = summarizeGroups(requireStep(ctx.patients, "No patients."), sim.before, sim.after, by);
      ctx.groups[by] = g;
      const hidden = g.rows.filter((r) => r.suppressed).length;
      return {
        summary: `By ${by}: ${g.rows.length - hidden} groups reported, ${hidden} too small to report`,
        forModel: {
          by,
          rows: g.rows.map((r) => (r.suppressed ? { group: r.group, result: "Too small to report" } : { group: r.group, n: r.n, completionBefore: r.completionBefore, completionAfter: r.completionAfter })),
        },
      };
    }
  }
}
