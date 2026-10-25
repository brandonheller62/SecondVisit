// Scenario assumptions, not predictions. Every number here is a knob the
// research team can change in the Assumptions panel. None of them has been
// validated against real dropout data; check them against a past trial before
// any real use.

import type { BarrierKey, SupportKey } from "./types";

export interface Assumptions {
  /**
   * Per-visit weight w_k for each barrier term. Friction compounds across
   * visits (P(complete) = product of (1 - f)), so per-visit weights are small:
   * a barrier that hits all 8 visits of a trial at w = 0.06 alone gives
   * risk = 1 - 0.94^8 = 0.39. Tuned so a 4-8 visit trial gives retention in the
   * range trials usually report; more visits means more exposure and higher risk.
   */
  weights: Record<BarrierKey, number>;
  /** Off by default: past missed appointments can encode poverty, shift work and transit gaps rather than intent. */
  missedPriorEnabled: boolean;
  /** Exposure x for "medium" sub-conditions (e.g. 40-60 minute bus commute). "High" is always 1. */
  mediumLevel: number;
  tiers: { high: number; medium: number };
  unitCosts: {
    /** Miami-Dade Transit full fare per ride. */
    busFareOneWay: number;
    /** IRS 2025 standard mileage rate, used as the cost of driving. */
    mileageRatePerMile: number;
    /** Average door-to-door driving speed, to turn commute minutes into miles. */
    avgDrivingMph: number;
    /** Typical hospital/clinic garage parking in Miami-Dade. */
    parkingPerVisit: number;
    rideshareBaseFare: number;
    ridesharePerMinute: number;
    /** Florida minimum wage from 30 Sep 2026 ($15/h); a floor for hourly workers' lost pay. */
    hourlyWage: number;
    /** Out-of-pocket per visit for uninsured people (non-study care, pharmacy). */
    uninsuredOutOfPocket: number;
    /** What a household can spend on one visit before it becomes a real barrier. */
    discretionaryBudgetPerVisit: number;
  };
  /** The data has no paid-leave column; assume hourly workers lose pay for daytime visits. */
  assumeNoPaidLeave: boolean;
  /** Share of daytime visits that land on an irregular-schedule worker's shift. */
  irregularShiftOverlap: number;
  /** Languages the trial offers consent and materials in, used when the trial text does not say. */
  defaultMaterialsLanguages: string[];
  unknowns: {
    /** Visits whose in-person status is unknown are scored as in-person (over-supporting is safer than missing someone). */
    treatUnknownInPersonAsInPerson: boolean;
    /** Duration used for cost and lost wages when a visit's length is unknown. */
    durationMinutes: number;
  };
  storm: {
    /** Trial week the simulated closure hits; null = the week of the middle scored visit. */
    closureWeek: number | null;
    /** Reschedule penalty x for people without a car (bus routes cut, rides scarce after a storm). */
    noCarPenalty: number;
    /** Reschedule penalty x for people with their own car. */
    carPenalty: number;
    /** Share of the storm penalty left when a storm contingency plan is in place. */
    contingencyResidual: number;
  };
  supportCosts: {
    /** Round-trip ride voucher per visit. */
    rideVoucherPerVisit: number;
    /** Extra staff time per patient-visit for an evening slot. */
    eveningVisitPerVisit: number;
    childcarePerVisit: number;
    /** Medical interpreter per visit (in-person or video). */
    interpreterPerVisit: number;
    /** One-time translation of consent and materials, per missing language. */
    translationPerLanguage: number;
    /** Flexible rescheduling plus a backup ride, per affected patient. */
    stormContingencyPerPatient: number;
  };
  /** Cost to recruit and onboard a replacement participant. Placeholder: set from your own site budget. */
  replacementCostPerParticipant: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  weights: {
    // Visit timing is the barrier participants name most often in retention
    // studies; a morning fasting visit after a night shift is the sharpest case.
    scheduleClash: 0.06,
    // Long transit trips repeat every visit; weighted a bit lower than a clash
    // because people can sometimes borrow a ride.
    transport: 0.04,
    // Out-of-pocket cost relative to budget; fares and lost pay add up per visit.
    cost: 0.04,
    // No childcare for under-6s makes multi-hour visits hard to attend at all.
    childcare: 0.04,
    // A materials gap in the trial (not a trait of the person): consent forms,
    // questionnaires and reminders the person cannot read.
    languageAccess: 0.03,
    // Hits only the visit in the closure week, so it can be large.
    storm: 0.3,
    // Kept small and off by default because it can encode socioeconomic bias.
    missedPrior: 0.01,
  },
  missedPriorEnabled: false,
  mediumLevel: 0.5,
  tiers: { high: 0.35, medium: 0.15 },
  unitCosts: {
    busFareOneWay: 2.25,
    mileageRatePerMile: 0.7,
    avgDrivingMph: 22,
    parkingPerVisit: 12,
    rideshareBaseFare: 5,
    ridesharePerMinute: 0.55,
    hourlyWage: 15,
    uninsuredOutOfPocket: 25,
    discretionaryBudgetPerVisit: 120,
  },
  assumeNoPaidLeave: true,
  irregularShiftOverlap: 0.5,
  defaultMaterialsLanguages: ["English"],
  unknowns: { treatUnknownInPersonAsInPerson: true, durationMinutes: 120 },
  storm: { closureWeek: null, noCarPenalty: 1, carPenalty: 0.5, contingencyResidual: 0.3 },
  supportCosts: {
    rideVoucherPerVisit: 40,
    eveningVisitPerVisit: 60,
    childcarePerVisit: 50,
    interpreterPerVisit: 75,
    translationPerLanguage: 1200,
    stormContingencyPerPatient: 35,
  },
  replacementCostPerParticipant: 20000,
};

export const BARRIER_LABELS: Record<BarrierKey, { label: string; icon: string }> = {
  scheduleClash: { label: "Schedule clash", icon: "⏰" },
  transport: { label: "Transport", icon: "🚌" },
  cost: { label: "Cost", icon: "$" },
  childcare: { label: "Childcare", icon: "👶" },
  languageAccess: { label: "Language access gap", icon: "文" },
  storm: { label: "Storm closure", icon: "⛈" },
  missedPrior: { label: "Missed appointments", icon: "↺" },
};

export const SUPPORT_LABELS: Record<SupportKey, { label: string; fixes: BarrierKey[] }> = {
  eveningVisits: { label: "Evening visits", fixes: ["scheduleClash"] },
  rideVouchers: { label: "Ride vouchers", fixes: ["transport", "cost"] },
  childcareStipend: { label: "Childcare stipend", fixes: ["childcare"] },
  interpreter: { label: "Interpreter + translated materials", fixes: ["languageAccess"] },
  wageReimbursement: { label: "Wage & expense reimbursement", fixes: ["cost"] },
  stormContingency: { label: "Storm plan", fixes: ["storm"] },
};

export const cloneAssumptions = (a: Assumptions = DEFAULT_ASSUMPTIONS): Assumptions => structuredClone(a);
