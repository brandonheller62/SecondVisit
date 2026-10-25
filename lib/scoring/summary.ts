// Plain-language summary of a scoring run. PURE CODE, built from the numbers,
// never by the LLM, so every sentence can be traced back to the score.

import { BARRIER_LABELS, COST_UNKNOWN_CAVEAT, SUPPORT_LABELS, type Assumptions } from "../assumptions";
import type { BarrierKey, PatientScore, ScoreResult, Visit } from "../types";
import type { SimulationRun } from "./simulate";


export const VISIT_FIELD_LABELS = {
  week: "visit weeks",
  durationMinutes: "visit length",
  fasting: "fasting",
  timeOfDay: "time of day",
  inPerson: "whether visits are in person",
} as const satisfies Partial<Record<keyof Visit, string>>;

/** Plain names of the visit fields that are "unknown" for at least one visit. */
export function unknownVisitFields(visits: Visit[]): string[] {
  return (Object.keys(VISIT_FIELD_LABELS) as (keyof typeof VISIT_FIELD_LABELS)[])
    .filter((f) => visits.some((v) => v[f] === "unknown"))
    .map((f) => VISIT_FIELD_LABELS[f]);
}

/** False when every patient scores the same at every visit, so no visit can be called the hardest. */
export function visitsDistinguishable(score: Pick<ScoreResult, "matrix">): boolean {
  const byPatient = new Map<string, number>();
  for (const c of score.matrix) {
    const first = byPatient.get(c.patientId);
    if (first === undefined) byPatient.set(c.patientId, c.points);
    else if (Math.abs(first - c.points) > 1e-9) return true;
  }
  return false;
}

/** The visit with the highest mean score across patients, or null when visits cannot be told apart. */
export function hardestVisit(score: Pick<ScoreResult, "matrix" | "scoredVisits">): { visit: Visit; mean: number } | null {
  if (!visitsDistinguishable(score)) return null;
  let best: { visit: Visit; mean: number } | null = null;
  for (const v of score.scoredVisits) {
    const cells = score.matrix.filter((c) => c.visitId === v.id);
    const mean = cells.reduce((s, c) => s + c.points, 0) / (cells.length || 1);
    if (!best || mean > best.mean) best = { visit: v, mean };
  }
  return best;
}

/** How many patients have each barrier in their top three, most common first. */
export function barrierCounts(patients: PatientScore[]): [BarrierKey, number][] {
  const counts = new Map<BarrierKey, number>();
  for (const p of patients) for (const b of p.topBarriers) counts.set(b.key, (counts.get(b.key) ?? 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1]);
}

export interface ResultsSummary {
  sentences: [string, string, string];
  /** Always shown under the sentences. */
  label: string;
}

export const SUMMARY_LABEL = "Best-case estimate from unvalidated assumptions.";

export function buildSummary(sim: SimulationRun, a: Assumptions): ResultsSummary {
  const ps = sim.before.patients;
  const n = (t: PatientScore["tier"]) => ps.filter((p) => p.tier === t).length;
  const first = `Of ${ps.length} patients, ${n("High")} have high support need, ${n("Medium")} medium and ${n("Low")} low.`;

  // Biggest barrier. With compensation unknown, cost may be overstated, so it never leads.
  const counts = barrierCounts(ps);
  const costUnknown = a.participantCompensation.kind === "unknown";
  const leader = counts.find(([k]) => !(costUnknown && k === "cost"));
  const costCount = counts.find(([k]) => k === "cost")?.[1] ?? 0;
  const parts: string[] = [];
  if (leader) parts.push(`The biggest barrier is ${BARRIER_LABELS[leader[0]].label.toLowerCase()}: it is in the top three for ${leader[1]} patient${leader[1] === 1 ? "" : "s"}.`);
  else if (!costCount) parts.push("No barriers were found for these patients.");
  if (costUnknown && costCount) {
    parts.push(`Cost is in the top three for ${costCount} patient${costCount === 1 ? "" : "s"}, but ${COST_UNKNOWN_CAVEAT.charAt(0).toLowerCase()}${COST_UNKNOWN_CAVEAT.slice(1)}`);
  }
  const hard = hardestVisit(sim.before);
  parts.push(hard ? `The hardest visit is ${hard.visit.label}${typeof hard.visit.week === "number" ? ` (week ${hard.visit.week})` : ""}.` : "Visits cannot be told apart yet.");
  const second = parts.join(" ");

  const r = sim.result;
  const high = (n: number) => `${n} patient${n === 1 ? "" : "s"}`;
  const third = r.supports.length
    ? `With ${r.supports.map((s) => SUPPORT_LABELS[s].label.toLowerCase()).join(", ")}, high need goes from ${high(r.tiersBefore.High)} to ${high(r.tiersAfter.High)}.`
    : `No supports are selected, so ${high(r.tiersBefore.High)} stay at high need.`;

  return { sentences: [first, second, third], label: SUMMARY_LABEL };
}
