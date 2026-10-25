// Friction scoring. PURE CODE, no LLM, no I/O.
//
// For patient p and visit v:
//   f(p,v) = 1 - prod_k (1 - w_k * x_k)       x_k in 0..1
//   P(complete) = prod_v (1 - f(p,v))
//   risk of leaving without support = 1 - P(complete)
//
// Fairness rules enforced here: ethnicity, race and immigration status are
// not inputs at all; neighborhood is never read; preferred language is only
// compared with the TRIAL's materials languages (a gap in the trial).

import type { Assumptions } from "../assumptions";
import type {
  BarrierKey,
  Cell,
  CellTerm,
  Patient,
  PatientBarrier,
  PatientScore,
  Scenario,
  ScoreResult,
  SupportKey,
  SupportSet,
  Tier,
  Visit,
  VisitSchedule,
} from "../types";
import { isKnown, SUPPORT_KEYS } from "../types";

export const NO_SUPPORTS: SupportSet = {
  eveningVisits: false,
  rideVouchers: false,
  childcareStipend: false,
  interpreter: false,
  wageReimbursement: false,
};

export const BASELINE: Scenario = { supports: NO_SUPPORTS };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const money = (n: number) => `$${Math.round(n)}`;

/** Visits that count toward the score: in-person, or unknown when the assumption says so. */
export function scoredVisits(visits: Visit[], a: Assumptions): Visit[] {
  return visits.filter((v) => v.inPerson === true || (v.inPerson === "unknown" && a.unknowns.treatUnknownInPersonAsInPerson));
}

export function materialsLanguages(schedule: Pick<VisitSchedule, "materialsLanguages">, a: Assumptions): string[] {
  return isKnown(schedule.materialsLanguages) && schedule.materialsLanguages.length ? schedule.materialsLanguages : a.defaultMaterialsLanguages;
}

const isWorking = (p: Patient) => p.workSchedule !== "none";
const durationOf = (v: Visit, a: Assumptions) => (isKnown(v.durationMinutes) ? v.durationMinutes : a.unknowns.durationMinutes);

/** Itemised out-of-pocket cost for one visit, after the supports that pay for parts of it. */
export function visitCost(p: Patient, v: Visit, a: Assumptions, s: SupportSet) {
  const u = a.unitCosts;
  const roundTripMin = p.commuteMinutes * 2;
  let travel = 0;
  if (p.transport === "bus/Metrorail only") travel = u.busFareOneWay * 2;
  else if (p.transport === "own car") travel = (p.commuteMinutes / 60) * u.avgDrivingMph * 2 * u.mileageRatePerMile + u.parkingPerVisit;
  else if (p.transport === "rideshare") travel = (u.rideshareBaseFare + u.ridesharePerMinute * p.commuteMinutes) * 2;
  // family ride: no fare, the cost is reliability (transport term).

  let lostWages = 0;
  if (a.assumeNoPaidLeave && isWorking(p) && !s.eveningVisits) {
    const hours = (durationOf(v, a) + roundTripMin) / 60;
    const overlap = p.workSchedule === "day shift" ? 1 : p.workSchedule === "irregular" ? a.irregularShiftOverlap : 0;
    lostWages = hours * u.hourlyWage * overlap;
  }
  const outOfPocket = p.insurance === "uninsured" ? u.uninsuredOutOfPocket : 0;

  if (s.rideVouchers) travel = 0;
  if (s.wageReimbursement) {
    lostWages = 0;
    travel = p.transport === "own car" ? 0 : travel; // mileage and parking reimbursed
  }
  return { travel, lostWages, outOfPocket, total: travel + lostWages + outOfPocket };
}

interface TermContext {
  a: Assumptions;
  s: Scenario;
  langs: string[];
}

/** Barrier terms for one patient at one visit, each with its exposure x and a plain reason. */
export function visitTerms(p: Patient, v: Visit, ctx: TermContext): CellTerm[] {
  const { a, s } = ctx;
  const sup = s.supports;
  const med = a.mediumLevel;
  const terms: CellTerm[] = [];
  const add = (key: BarrierKey, x: number, reason: string) => {
    if (key === "missedPrior" && !a.missedPriorEnabled) return;
    const xx = clamp01(x);
    if (xx > 0) terms.push({ key, x: xx, contribution: a.weights[key] * xx, reason });
  };

  // schedule_clash: take the strongest sub-condition.
  const morningOrFasting = v.timeOfDay === "morning" || v.fasting === true;
  const clashes: [number, string][] = [];
  if (!sup.eveningVisits) {
    if (morningOrFasting && (p.workSchedule === "night shift" || p.workSchedule === "irregular")) {
      clashes.push([1, `${v.fasting === true ? "Fasting" : "Morning"} visit right after a ${p.workSchedule === "night shift" ? "night shift" : "shift that changes week to week"}`]);
    }
    if (p.workSchedule === "day shift" && p.canTakeUnpaidTimeOff === "no") {
      clashes.push([1, "Daytime visit during a day shift with no time off allowed"]);
    }
  }
  const dur = v.durationMinutes;
  if (isKnown(dur) && dur > 180) clashes.push([med, `${Math.round(dur / 60)}-hour visit`]);
  if (clashes.length) {
    const [x, reason] = clashes.sort((m, n) => n[0] - m[0])[0];
    add("scheduleClash", x, reason);
  }

  // transport: long transit trips. Rideshare money goes to cost, not here.
  if (!sup.rideVouchers) {
    if (p.transport === "bus/Metrorail only") {
      if (p.commuteMinutes > 60) add("transport", 1, `${p.commuteMinutes}-minute bus/Metrorail trip each way`);
      else if (p.commuteMinutes >= 40) add("transport", med, `${p.commuteMinutes}-minute bus/Metrorail trip each way`);
    } else if (p.transport === "family ride" && p.commuteMinutes > 60) {
      // Assumption: a long family ride depends on someone else's day off.
      add("transport", med, `Depends on a family member for a ${p.commuteMinutes}-minute ride`);
    }
  }

  // cost: out-of-pocket per visit relative to a household's spare budget.
  const c = visitCost(p, v, a, sup);
  if (c.total > 0) {
    const parts = [c.travel && `${money(c.travel)} travel`, c.lostWages && `${money(c.lostWages)} lost pay`, c.outOfPocket && `${money(c.outOfPocket)} uninsured costs`].filter(Boolean);
    add("cost", c.total / a.unitCosts.discretionaryBudgetPerVisit, `About ${money(c.total)} per visit (${parts.join(", ")})`);
  }

  // childcare
  if (!sup.childcareStipend && p.childrenUnder6 > 0 && p.childcareAvailable === "no") {
    add("childcare", 1, `${p.childrenUnder6} child${p.childrenUnder6 > 1 ? "ren" : ""} under 6 and no childcare`);
  }

  // language access: a gap in the TRIAL's materials, not a trait of the person.
  if (!sup.interpreter && !ctx.langs.some((l) => l.toLowerCase() === p.preferredLanguage.toLowerCase())) {
    add("languageAccess", 1, `Trial materials not offered in ${p.preferredLanguage}`);
  }

  // missed_prior: off by default.
  if (p.missedAppointments > 0) add("missedPrior", p.missedAppointments / 4, `${p.missedAppointments} missed appointments last year`);

  return terms;
}

export function combine(terms: CellTerm[]): number {
  return 1 - terms.reduce((keep, t) => keep * (1 - t.contribution), 1);
}

export function tierFor(risk: number, a: Assumptions): Tier {
  return risk >= a.tiers.high ? "High" : risk >= a.tiers.medium ? "Medium" : "Low";
}

const BARRIER_TO_SUPPORT: Partial<Record<BarrierKey, SupportKey>> = {
  scheduleClash: "eveningVisits",
  transport: "rideVouchers",
  childcare: "childcareStipend",
  languageAccess: "interpreter",
};

/** Which supports address a patient's barriers, strongest first. */
function recommend(p: Patient, best: Map<BarrierKey, PatientBarrier>, visits: Visit[], a: Assumptions): SupportKey[] {
  const ranked = [...best.values()].sort((x, y) => y.contribution - x.contribution);
  const out: SupportKey[] = [];
  const push = (k: SupportKey) => !out.includes(k) && out.push(k);
  for (const b of ranked) {
    if (b.contribution < 0.02) continue;
    if (b.key === "cost") {
      // Pick the support that pays for the biggest part of the cost.
      const c = visitCost(p, visits.find((v) => v.id === b.visitId)!, a, NO_SUPPORTS);
      if (c.travel >= c.lostWages + c.outOfPocket && p.transport !== "own car") push("rideVouchers");
      else push("wageReimbursement");
    } else {
      const s = BARRIER_TO_SUPPORT[b.key];
      if (s) push(s);
    }
  }
  return out;
}

export function scorePatients(schedule: Pick<VisitSchedule, "visits" | "materialsLanguages">, patients: Patient[], a: Assumptions, s: Scenario = BASELINE): ScoreResult {
  const visits = scoredVisits(schedule.visits, a);
  const ctx: TermContext = { a, s, langs: materialsLanguages(schedule, a) };
  const matrix: Cell[] = [];
  const scores: PatientScore[] = [];

  for (const p of patients) {
    let pComplete = 1;
    const best = new Map<BarrierKey, PatientBarrier>();
    for (const v of visits) {
      const terms = visitTerms(p, v, ctx);
      const friction = combine(terms);
      pComplete *= 1 - friction;
      const dominant = terms.length ? terms.reduce((m, t) => (t.contribution > m.contribution ? t : m)).key : null;
      matrix.push({ patientId: p.id, visitId: v.id, friction: round(friction), dominant, terms });
      for (const t of terms) {
        const prev = best.get(t.key);
        if (!prev || t.contribution > prev.contribution) {
          best.set(t.key, { key: t.key, visitId: v.id, visitLabel: v.label, contribution: round(t.contribution), reason: t.reason });
        }
      }
    }
    const risk = 1 - pComplete;
    const visitCosts = visits.map((v) => visitCost(p, v, a, NO_SUPPORTS).total);
    scores.push({
      patientId: p.id,
      pComplete: round(pComplete),
      risk: round(risk),
      tier: tierFor(risk, a),
      topBarriers: [...best.values()].sort((x, y) => y.contribution - x.contribution).slice(0, 3),
      recommendedSupports: recommend(p, best, visits, a),
      costPerVisit: visitCosts.length ? Math.round(visitCosts.reduce((x, y) => x + y, 0) / visitCosts.length) : 0,
    });
  }

  scores.sort((x, y) => y.risk - x.risk || x.patientId.localeCompare(y.patientId));
  return { patients: scores, matrix, scoredVisits: visits, unknownNotes: unknownNotes(schedule, visits, a) };
}

function unknownNotes(schedule: Pick<VisitSchedule, "visits" | "materialsLanguages">, visits: Visit[], a: Assumptions): string[] {
  const notes: string[] = [];
  const count = (pred: (v: Visit) => boolean) => visits.filter(pred).length;
  const n = (k: number) => `${k} of ${visits.length} visit${visits.length === 1 ? "" : "s"}`;
  const tod = count((v) => v.timeOfDay === "unknown");
  if (tod) notes.push(`Time of day is unknown for ${n(tod)}; morning clashes are not counted there, so need may be understated.`);
  const fast = count((v) => v.fasting === "unknown");
  if (fast) notes.push(`Fasting is unknown for ${n(fast)}; scored as non-fasting.`);
  const dur = count((v) => v.durationMinutes === "unknown");
  if (dur) notes.push(`Duration is unknown for ${n(dur)}; ${a.unknowns.durationMinutes} minutes assumed for cost and lost pay.`);
  const inp = count((v) => v.inPerson === "unknown");
  if (inp) notes.push(`In-person status is unknown for ${n(inp)}; scored as in-person.`);
  if (!isKnown(schedule.materialsLanguages)) notes.push(`The trial text does not list consent/material languages; assumed: ${a.defaultMaterialsLanguages.join(", ")}.`);
  return notes;
}

export const allSupports = (on: SupportKey[]): SupportSet =>
  Object.fromEntries(SUPPORT_KEYS.map((k) => [k, on.includes(k)])) as SupportSet;
