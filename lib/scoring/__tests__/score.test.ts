import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS, type Assumptions } from "../../assumptions";
import type { ParticipantCompensation, Patient, Visit, VisitSchedule } from "../../types";
import { parsePatients } from "../parsePatients";
import { allSupports, scorePatients } from "../score";
import { MIN_GROUP_SIZE, simulateSupports, summarizeGroups } from "../simulate";

const visit = (id: string, week: number, over: Partial<Visit> = {}): Visit => ({
  id,
  label: id,
  week,
  durationMinutes: 90,
  fasting: false,
  timeOfDay: "any",
  procedures: [],
  inPerson: true,
  ...over,
});

const schedule: VisitSchedule = {
  visits: [
    visit("screening", 0),
    visit("baseline", 2, { fasting: true, timeOfDay: "morning" }),
    visit("w12", 12, { fasting: true, timeOfDay: "morning" }),
    visit("w24", 24, { fasting: true, timeOfDay: "morning" }),
  ],
  materialsLanguages: ["English", "Spanish"],
  scheduleFound: true,
  notes: "",
  source: "registry",
};

const base: Patient = {
  id: "T-1",
  age: 45,
  neighborhood: "Hialeah",
  preferredLanguage: "Spanish",
  occupation: "hotel/hospitality",
  workSchedule: "day shift",
  transport: "own car",
  commuteMinutes: 20,
  insurance: "employer",
  childrenUnder6: 0,
  childcareAvailable: "n/a",
  canTakeUnpaidTimeOff: "yes",
  missedAppointments: 0,
};

const nightWorker: Patient = { ...base, id: "NIGHT", workSchedule: "night shift", transport: "bus/Metrorail only", commuteMinutes: 50 };
const retiree: Patient = { ...base, id: "RETIREE", age: 70, occupation: "retired", workSchedule: "none", insurance: "Medicare", canTakeUnpaidTimeOff: "n/a" };

const riskOf = (id: string, r: ReturnType<typeof scorePatients>) => r.patients.find((p) => p.patientId === id)!.risk;

describe("scorePatients", () => {
  it("scores a patient the same when only neighborhood changes", () => {
    const a = { ...base, id: "A", neighborhood: "Little Haiti" };
    const b = { ...base, id: "B", neighborhood: "Miami Beach" };
    const r = scorePatients(schedule, [a, b], DEFAULT_ASSUMPTIONS);
    expect(riskOf("A", r)).toBe(riskOf("B", r));
  });

  it("scores a night-shift worker with morning fasting visits higher than a day-shift retiree", () => {
    const r = scorePatients(schedule, [nightWorker, retiree], DEFAULT_ASSUMPTIONS);
    expect(riskOf("NIGHT", r)).toBeGreaterThan(riskOf("RETIREE", r));
    expect(r.patients[0].patientId).toBe("NIGHT");
  });

  it("lowers the night-shift worker's score when evening visits are on", () => {
    const before = scorePatients(schedule, [nightWorker], DEFAULT_ASSUMPTIONS);
    const after = scorePatients(schedule, [nightWorker], DEFAULT_ASSUMPTIONS, { supports: allSupports(["eveningVisits"]) });
    expect(riskOf("NIGHT", after)).toBeLessThan(riskOf("NIGHT", before));
  });

  it("uses language only through the trial's materials gap", () => {
    const creole = { ...base, id: "HT", preferredLanguage: "Haitian Creole" };
    const spanish = { ...base, id: "ES", preferredLanguage: "Spanish" };
    const gap = scorePatients(schedule, [creole, spanish], DEFAULT_ASSUMPTIONS);
    expect(riskOf("HT", gap)).toBeGreaterThan(riskOf("ES", gap));
    const covered = scorePatients({ ...schedule, materialsLanguages: ["English", "Spanish", "Haitian Creole"] }, [creole, spanish], DEFAULT_ASSUMPTIONS);
    expect(riskOf("HT", covered)).toBe(riskOf("ES", covered));
  });

  it("ignores missed appointments unless turned on", () => {
    const missed = { ...base, id: "M", missedAppointments: 4 };
    const r = scorePatients(schedule, [base, missed], DEFAULT_ASSUMPTIONS);
    expect(riskOf("M", r)).toBe(riskOf("T-1", r));
  });

  it("does not guess unknown visit fields", () => {
    const unknown: VisitSchedule = { ...schedule, visits: [visit("v1", 4, { timeOfDay: "unknown", fasting: "unknown", durationMinutes: "unknown" })] };
    const r = scorePatients(unknown, [nightWorker], DEFAULT_ASSUMPTIONS);
    expect(r.matrix[0].terms.find((t) => t.key === "scheduleClash")).toBeUndefined();
    expect(r.unknownNotes.length).toBeGreaterThan(0);
  });
});

describe("per-patient costs", () => {
  it("cost parts add up per visit", () => {
    const r = parsePatients(readFileSync("data/synthetic_patients.csv", "utf8"));
    if (!r.ok) throw new Error(r.error);
    const sim = simulateSupports(schedule, r.patients, DEFAULT_ASSUMPTIONS, ["eveningVisits", "rideVouchers", "childcareStipend", "wageReimbursement"]);
    for (const p of sim.before.patients) {
      const b = p.visitCostBreakdown;
      expect(b.travel + b.lostWages + b.outOfPocket - b.compensation).toBeCloseTo(p.costPerVisit, 2);
    }
  });
});

describe("participant compensation", () => {
  const withComp = (kind: ParticipantCompensation["kind"], stipendPerVisit: number | null = null): Assumptions => ({
    ...DEFAULT_ASSUMPTIONS,
    participantCompensation: { kind, stipendPerVisit },
  });
  const costContribution = (r: ReturnType<typeof scorePatients>, id: string) =>
    r.matrix.filter((c) => c.patientId === id).reduce((s, c) => s + (c.terms.find((t) => t.key === "cost")?.contribution ?? 0), 0);
  // Long rideshare trips and no job: cost is all travel, so the cost barrier calls for ride vouchers.
  const rideshareRetiree: Patient = { ...retiree, id: "RIDE", transport: "rideshare", commuteMinutes: 60 };

  it("defaults to unknown", () => {
    expect(DEFAULT_ASSUMPTIONS.participantCompensation).toEqual({ kind: "unknown", stipendPerVisit: null });
  });

  it("gives the same score for unknown and none", () => {
    const r = parsePatients(readFileSync("data/synthetic_patients.csv", "utf8"));
    if (!r.ok) throw new Error(r.error);
    expect(scorePatients(schedule, r.patients, withComp("none")).patients).toEqual(scorePatients(schedule, r.patients, withComp("unknown")).patients);
  });

  it("lowers cost-term contributions with a stipend", () => {
    const people = [nightWorker, base, rideshareRetiree];
    const without = scorePatients(schedule, people, withComp("none"));
    const withStipend = scorePatients(schedule, people, withComp("stipend", 20));
    for (const p of people) {
      expect(costContribution(withStipend, p.id)).toBeLessThan(costContribution(without, p.id));
      expect(riskOf(p.id, withStipend)).toBeLessThanOrEqual(riskOf(p.id, without));
    }
  });

  it("subtracts nothing when the stipend amount is not entered", () => {
    expect(scorePatients(schedule, [base], withComp("stipend", null)).patients).toEqual(scorePatients(schedule, [base], withComp("none")).patients);
  });

  it("does not recommend ride vouchers for cost when the trial reimburses travel", () => {
    const before = scorePatients(schedule, [rideshareRetiree], withComp("none")).patients[0];
    expect(before.recommendedSupports).toContain("rideVouchers");
    const after = scorePatients(schedule, [rideshareRetiree], withComp("travelReimbursed")).patients[0];
    expect(after.recommendedSupports).not.toContain("rideVouchers");
    expect(after.visitCostBreakdown.compensation).toBeCloseTo(after.visitCostBreakdown.travel, 2);
  });

  // Drives an hour each way and loses a day shift's pay: cost calls for wage & expense reimbursement.
  const dayWorker: Patient = { ...base, id: "DAY", commuteMinutes: 60 };

  it("does not recommend wage reimbursement when the stipend already covers the cost", () => {
    expect(scorePatients(schedule, [dayWorker], withComp("none")).patients[0].recommendedSupports).toContain("wageReimbursement");
    const covered = scorePatients(schedule, [dayWorker], withComp("stipendAndTravel", 1000)).patients[0];
    expect(covered.recommendedSupports).not.toContain("wageReimbursement");
    expect(covered.costPerVisit).toBe(0);
  });

  it("does not charge for wage reimbursement the trial already pays", () => {
    const people = [dayWorker];
    const full = simulateSupports(schedule, people, withComp("none"), ["wageReimbursement"]).result.totalSupportCost;
    const part = simulateSupports(schedule, people, withComp("stipend", 20), ["wageReimbursement"]).result.totalSupportCost;
    expect(part).toBeLessThan(full);
  });
});

describe("evening visits", () => {
  it("are simulated and costed from eveningVisitPerVisit", () => {
    const sim = simulateSupports(schedule, [nightWorker], DEFAULT_ASSUMPTIONS, ["eveningVisits"]);
    const c = sim.result.costs.find((x) => x.support === "eveningVisits")!;
    expect(c.patientsHelped).toBe(1);
    expect(c.cost).toBe(schedule.visits.length * DEFAULT_ASSUMPTIONS.supportCosts.eveningVisitPerVisit);
    expect(sim.result.completionAfter).toBeGreaterThan(sim.result.completionBefore);
  });
});

describe("parsePatients", () => {
  it("rejects files with identifying columns", () => {
    const r = parsePatients("patient_id,first_name,age\nSYN-1,Ana,40\n");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockedColumns.join()).toMatch(/first_name/);
    expect(parsePatients("patient_id,phone,age\nx,1,2\n").ok).toBe(false);
    expect(parsePatients("patient_id,DOB\nx,1\n").ok).toBe(false);
    expect(parsePatients("MRN,age\nx,1\n").ok).toBe(false);
  });

  it("parses the bundled synthetic file", () => {
    const r = parsePatients(readFileSync("data/synthetic_patients.csv", "utf8"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patients).toHaveLength(120);
      expect(r.quality.rejectedRows).toHaveLength(0);
      expect(r.quality.ignoredColumns).toEqual(["diagnosis_group", "a1c"]);
    }
  });
});

describe("groups", () => {
  it(`suppresses groups under ${MIN_GROUP_SIZE}`, () => {
    const r = parsePatients(readFileSync("data/synthetic_patients.csv", "utf8"));
    if (!r.ok) throw new Error(r.error);
    const sim = simulateSupports(schedule, r.patients, DEFAULT_ASSUMPTIONS, ["eveningVisits"]);
    const g = summarizeGroups(r.patients, sim.before, sim.after, "preferredLanguage");
    const pt = g.rows.find((row) => row.group === "Portuguese")!;
    expect(pt.suppressed).toBe(true);
    expect(pt.completionBefore).toBeNull();
    expect(sim.result.completionAfter).toBeGreaterThan(sim.result.completionBefore);
  });
});
