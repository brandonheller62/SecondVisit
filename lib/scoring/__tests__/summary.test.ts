import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "../../assumptions";
import type { Patient, Visit, VisitSchedule } from "../../types";
import { simulateSupports } from "../simulate";
import { buildSummary, hardestVisit, SUMMARY_LABEL, unknownVisitFields, visitsDistinguishable } from "../summary";

const visit = (id: string, over: Partial<Visit> = {}): Visit => ({
  id,
  label: id,
  week: 0,
  durationMinutes: 90,
  fasting: false,
  timeOfDay: "any",
  procedures: [],
  inPerson: true,
  ...over,
});

const known: VisitSchedule = {
  visits: [visit("Screening", { week: -2 }), visit("Week 12", { week: 12, fasting: true, timeOfDay: "morning" })],
  materialsLanguages: ["English", "Spanish"],
  scheduleFound: true,
  notes: "",
  source: "pasted",
};

// What a registry record usually gives: time points and nothing else.
const allUnknown: VisitSchedule = {
  ...known,
  visits: [
    visit("Baseline", { durationMinutes: "unknown", fasting: "unknown", timeOfDay: "unknown", inPerson: "unknown" }),
    visit("Week 24", { week: 24, durationMinutes: "unknown", fasting: "unknown", timeOfDay: "unknown", inPerson: "unknown" }),
  ],
  source: "registry",
};

const nightWorker: Patient = {
  id: "NIGHT",
  age: 40,
  neighborhood: "Hialeah",
  preferredLanguage: "Spanish",
  occupation: "warehouse",
  workSchedule: "night shift",
  transport: "bus/Metrorail only",
  commuteMinutes: 50,
  insurance: "employer",
  childrenUnder6: 0,
  childcareAvailable: "n/a",
  canTakeUnpaidTimeOff: "yes",
  missedAppointments: 0,
};
// Cost is this person's only barrier.
const rideshareRetiree: Patient = { ...nightWorker, id: "RIDE", workSchedule: "none", transport: "rideshare", commuteMinutes: 60, canTakeUnpaidTimeOff: "n/a" };

describe("visit unknowns", () => {
  it("lists unknown visit fields in plain words", () => {
    expect(unknownVisitFields(known.visits)).toEqual([]);
    expect(unknownVisitFields(allUnknown.visits)).toEqual(["visit length", "fasting", "time of day", "whether visits are in person"]);
  });

  it("cannot name a hardest visit when every visit scores the same", () => {
    const sim = simulateSupports(allUnknown, [nightWorker], DEFAULT_ASSUMPTIONS, []);
    expect(visitsDistinguishable(sim.before)).toBe(false);
    expect(hardestVisit(sim.before)).toBeNull();
    expect(buildSummary(sim, DEFAULT_ASSUMPTIONS).sentences[1]).toContain("Visits cannot be told apart yet.");
  });

  it("names the hardest visit when visits differ", () => {
    const sim = simulateSupports(known, [nightWorker], DEFAULT_ASSUMPTIONS, []);
    expect(visitsDistinguishable(sim.before)).toBe(true);
    expect(hardestVisit(sim.before)?.visit.label).toBe("Week 12");
    expect(buildSummary(sim, DEFAULT_ASSUMPTIONS).sentences[1]).toContain("The hardest visit is Week 12 (week 12).");
  });
});

describe("buildSummary", () => {
  it("counts support need and states the scenario change with the label", () => {
    const sim = simulateSupports(known, [nightWorker, rideshareRetiree], DEFAULT_ASSUMPTIONS, ["eveningVisits"]);
    const s = buildSummary(sim, DEFAULT_ASSUMPTIONS);
    expect(s.sentences[0]).toMatch(/^Of 2 patients, \d+ have high support need, \d+ medium and \d+ low\.$/);
    expect(s.sentences[2]).toMatch(/high need goes from \d+ patients? to \d+ patients?\./);
    expect(s.label).toBe(SUMMARY_LABEL);
  });

  it("never leads with cost while compensation is unknown, and gives the caveat", () => {
    const sim = simulateSupports(known, [rideshareRetiree], DEFAULT_ASSUMPTIONS, []);
    const s = buildSummary(sim, DEFAULT_ASSUMPTIONS).sentences[1];
    expect(s).not.toContain("biggest barrier is cost");
    expect(s).toContain("cost may be overstated");
  });

  it("can lead with cost once compensation is known", () => {
    const a = { ...DEFAULT_ASSUMPTIONS, participantCompensation: { kind: "none" as const, stipendPerVisit: null } };
    const sim = simulateSupports(known, [rideshareRetiree], a, []);
    expect(buildSummary(sim, a).sentences[1]).toContain("The biggest barrier is cost");
  });
});
