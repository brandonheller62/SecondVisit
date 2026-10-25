// Before/after simulation and group summaries. PURE CODE, no LLM.

import type { Assumptions } from "../assumptions";
import type { GroupBy, GroupSummary, Patient, ScoreResult, SimulationResult, SupportCost, SupportKey, Tier, VisitSchedule } from "../types";
import { SUPPORT_KEYS } from "../types";
import { allSupports, materialsLanguages, NO_SUPPORTS, scorePatients, supportCostFor } from "./score";

/** Groups smaller than this are reported as "Too small to report". */
export const MIN_GROUP_SIZE = 10;

export interface SimulationRun {
  before: ScoreResult;
  after: ScoreResult;
  result: SimulationResult;
}

type Schedule = Pick<VisitSchedule, "visits" | "materialsLanguages">;

export function simulateSupports(schedule: Schedule, patients: Patient[], a: Assumptions, supports: SupportKey[]): SimulationRun {
  const before = scorePatients(schedule, patients, a, { supports: NO_SUPPORTS });
  const after = scorePatients(schedule, patients, a, { supports: allSupports(supports) });
  const n = patients.length || 1;
  const tiers = (r: ScoreResult) => {
    const t: Record<Tier, number> = { High: 0, Medium: 0, Low: 0 };
    for (const p of r.patients) t[p.tier]++;
    return t;
  };
  const avg = (r: ScoreResult) => round1(r.patients.reduce((s, p) => s + p.points, 0) / n);
  const costs = supportCosts(schedule, patients, a, before, supports);
  return {
    before,
    after,
    result: {
      supports,
      tiersBefore: tiers(before),
      tiersAfter: tiers(after),
      averagePointsBefore: avg(before),
      averagePointsAfter: avg(after),
      costs,
      totalSupportCost: Math.round(costs.reduce((s, c) => s + c.cost, 0)),
    },
  };
}

/** Cost of offering each support to the patients whose baseline barriers call for it. */
export function supportCosts(schedule: Schedule, patients: Patient[], a: Assumptions, before: ScoreResult, supports: SupportKey[]): SupportCost[] {
  const visits = before.scoredVisits;
  const byId = new Map(patients.map((p) => [p.id, p]));
  const sc = a.supportCosts;
  const langs = materialsLanguages(schedule, a).map((l) => l.toLowerCase());

  return SUPPORT_KEYS.filter((k) => supports.includes(k)).map((k) => {
    const helped = before.patients.filter((s) => s.recommendedSupports.includes(k)).map((s) => byId.get(s.patientId)!);
    let cost = helped.reduce((sum, p) => sum + supportCostFor(p, k, visits, a), 0);
    if (k === "interpreter") {
      const missing = new Set(helped.map((p) => p.preferredLanguage.toLowerCase()).filter((l) => !langs.includes(l)));
      cost += missing.size * sc.translationPerLanguage;
    }
    return { support: k, patientsHelped: helped.length, cost: Math.round(cost) };
  });
}

const GROUP_FIELD: Record<GroupBy, (p: Patient) => string> = {
  preferredLanguage: (p) => p.preferredLanguage,
  neighborhood: (p) => p.neighborhood,
  transport: (p) => p.transport,
  insurance: (p) => p.insurance,
};

export function summarizeGroups(patients: Patient[], before: ScoreResult, after: ScoreResult, by: GroupBy): GroupSummary {
  const pb = new Map(before.patients.map((s) => [s.patientId, s.points]));
  const pa = new Map(after.patients.map((s) => [s.patientId, s.points]));
  const groups = new Map<string, Patient[]>();
  for (const p of patients) {
    const g = GROUP_FIELD[by](p);
    groups.set(g, [...(groups.get(g) ?? []), p]);
  }
  const rows = [...groups.entries()]
    .map(([group, members]) => {
      const suppressed = members.length < MIN_GROUP_SIZE;
      const mean = (m: Map<string, number>) => round1(members.reduce((s, p) => s + (m.get(p.id) ?? 0), 0) / members.length);
      return { group, n: members.length, suppressed, averagePointsBefore: suppressed ? null : mean(pb), averagePointsAfter: suppressed ? null : mean(pa) };
    })
    .sort((x, y) => Number(x.suppressed) - Number(y.suppressed) || y.n - x.n);
  return { by, rows };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
