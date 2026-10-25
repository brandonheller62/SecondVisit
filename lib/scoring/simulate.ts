// Before/after simulation and group summaries. PURE CODE, no LLM.

import type { Assumptions } from "../assumptions";
import type { GroupBy, GroupSummary, Patient, ScoreResult, SimulationResult, SupportCost, SupportKey, VisitSchedule } from "../types";
import { SUPPORT_KEYS } from "../types";
import { allSupports, materialsLanguages, NO_SUPPORTS, scorePatients, visitCost } from "./score";

/** Groups smaller than this are reported as "Too small to report". */
export const MIN_GROUP_SIZE = 10;

export interface SimulationRun {
  before: ScoreResult;
  after: ScoreResult;
  result: SimulationResult;
}

type Schedule = Pick<VisitSchedule, "visits" | "materialsLanguages">;

export function simulateSupports(schedule: Schedule, patients: Patient[], a: Assumptions, supports: SupportKey[], stormWeek: boolean): SimulationRun {
  const before = scorePatients(schedule, patients, a, { supports: NO_SUPPORTS, stormWeek });
  const after = scorePatients(schedule, patients, a, { supports: allSupports(supports), stormWeek });
  const sum = (r: ScoreResult) => r.patients.reduce((s, p) => s + p.pComplete, 0);
  const n = patients.length || 1;
  const costs = supportCosts(schedule, patients, a, before, supports);
  return {
    before,
    after,
    result: {
      supports,
      stormWeek,
      expectedCompletersBefore: round1(sum(before)),
      expectedCompletersAfter: round1(sum(after)),
      completionBefore: round3(sum(before) / n),
      completionAfter: round3(sum(after) / n),
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
    let cost = 0;
    switch (k) {
      case "rideVouchers":
        cost = helped.length * visits.length * sc.rideVoucherPerVisit;
        break;
      case "eveningVisits":
        cost = helped.length * visits.length * sc.eveningVisitPerVisit;
        break;
      case "childcareStipend":
        cost = helped.length * visits.length * sc.childcarePerVisit;
        break;
      case "interpreter": {
        const missing = new Set(helped.map((p) => p.preferredLanguage.toLowerCase()).filter((l) => !langs.includes(l)));
        cost = helped.length * visits.length * sc.interpreterPerVisit + missing.size * sc.translationPerLanguage;
        break;
      }
      case "wageReimbursement":
        for (const p of helped) {
          for (const v of visits) {
            const c = visitCost(p, v, a, NO_SUPPORTS);
            cost += c.lostWages + c.outOfPocket + (p.transport === "own car" ? c.travel : 0);
          }
        }
        break;
      case "stormContingency":
        cost = helped.length * sc.stormContingencyPerPatient;
        break;
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
  const pb = new Map(before.patients.map((s) => [s.patientId, s.pComplete]));
  const pa = new Map(after.patients.map((s) => [s.patientId, s.pComplete]));
  const groups = new Map<string, Patient[]>();
  for (const p of patients) {
    const g = GROUP_FIELD[by](p);
    groups.set(g, [...(groups.get(g) ?? []), p]);
  }
  const rows = [...groups.entries()]
    .map(([group, members]) => {
      const suppressed = members.length < MIN_GROUP_SIZE;
      const mean = (m: Map<string, number>) => round3(members.reduce((s, p) => s + (m.get(p.id) ?? 0), 0) / members.length);
      return { group, n: members.length, suppressed, completionBefore: suppressed ? null : mean(pb), completionAfter: suppressed ? null : mean(pa) };
    })
    .sort((x, y) => Number(x.suppressed) - Number(y.suppressed) || y.n - x.n);
  return { by, rows };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
