// Claude calls that are not the main loop: schedule extraction and drafting.
// Server-only. Model id and key come from env (ANTHROPIC_MODEL, ANTHROPIC_API_KEY).

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Draft, Visit, VisitSchedule } from "../types";
import { DRAFT_SYSTEM, EXTRACT_SYSTEM } from "./prompts";

export function getModel(): string {
  const model = process.env.ANTHROPIC_MODEL?.trim();
  if (!model) throw new Error("ANTHROPIC_MODEL is not set. Copy .env.example to .env.local and set it.");
  return model;
}

let client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and set it.");
  client ??= new Anthropic();
  return client;
}

const unknownOr = <T extends z.ZodTypeAny>(t: T) => z.union([t, z.literal("unknown")]);

const ExtractedSchedule = z.object({
  scheduleFound: z.boolean().describe("true only if the text states at least one specific visit or assessment time point"),
  visits: z.array(
    z.object({
      label: z.string(),
      week: unknownOr(z.number()).describe("Trial week of the visit (baseline/day 1 = 0); 'unknown' if not stated"),
      durationMinutes: unknownOr(z.number()),
      fasting: unknownOr(z.boolean()),
      timeOfDay: z.enum(["morning", "any", "unknown"]),
      procedures: z.array(z.string()),
      inPerson: unknownOr(z.boolean()),
      evidence: z.string().describe("Short quote from the text that this visit is based on"),
    }),
  ),
  materialsLanguages: unknownOr(z.array(z.string())).describe("Languages consent/materials are offered in, only if stated"),
  notes: z.string().describe("What was missing or ambiguous, in one or two plain sentences"),
});

export async function extractVisitSchedule(text: string, source: VisitSchedule["source"]): Promise<VisitSchedule & { evidence: string[] }> {
  const res = await getClient().messages.parse({
    model: getModel(),
    max_tokens: 16000,
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content: `<trial_text source="${source}">\n${text}\n</trial_text>` }],
    output_config: { format: zodOutputFormat(ExtractedSchedule) },
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined to extract a schedule from this text.");
  const out = res.parsed_output;
  if (!out) throw new Error("Schedule extraction returned no parseable result.");
  const visits: Visit[] = out.visits.map((v, i) => ({
    id: `v${i + 1}`,
    label: v.label,
    week: v.week,
    durationMinutes: v.durationMinutes,
    fasting: v.fasting,
    timeOfDay: v.timeOfDay,
    procedures: v.procedures,
    inPerson: v.inPerson,
  }));
  return {
    visits,
    materialsLanguages: out.materialsLanguages,
    scheduleFound: out.scheduleFound && visits.length > 0,
    notes: out.notes,
    source,
    evidence: out.visits.map((v) => v.evidence),
  };
}

const Drafts = z.object({
  barrierReport: z.string(),
  questionsForResearchTeam: z.string(),
  accommodationRequest: z.string(),
  participantSummaryEnglish: z.string(),
  participantSummarySpanish: z.string(),
  participantSummaryHaitianCreole: z.string(),
});

/** Claude only ever receives aggregates and patient IDs here, never patient rows. */
export async function draftDocuments(findings: unknown): Promise<Draft[]> {
  const res = await getClient().messages.parse({
    model: getModel(),
    max_tokens: 16000,
    system: DRAFT_SYSTEM,
    messages: [{ role: "user", content: `<findings>\n${JSON.stringify(findings, null, 2)}\n</findings>` }],
    output_config: { format: zodOutputFormat(Drafts) },
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined to draft documents.");
  const d = res.parsed_output;
  if (!d) throw new Error("Drafting returned no parseable result.");
  const mk = (id: string, kind: Draft["kind"], language: Draft["language"], title: string, text: string, needsNativeReview = false): Draft => ({
    id,
    kind,
    language,
    title,
    text,
    needsNativeReview,
  });
  return [
    mk("barrier-report", "barrierReport", "en", "Barrier report for the research team", d.barrierReport),
    mk("questions", "questions", "en", "Questions to ask the research team", d.questionsForResearchTeam),
    mk("accommodation", "accommodationRequest", "en", "Accommodation & reimbursement request", d.accommodationRequest),
    mk("summary-en", "participantSummary", "en", "Participant summary (English)", d.participantSummaryEnglish),
    mk("summary-es", "participantSummary", "es", "Resumen para participantes (Español)", d.participantSummarySpanish, true),
    mk("summary-ht", "participantSummary", "ht", "Rezime pou patisipan yo (Kreyòl ayisyen)", d.participantSummaryHaitianCreole, true),
  ];
}
