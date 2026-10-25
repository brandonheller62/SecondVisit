import type {
  Assumptions,
  BarrierResult,
  FrictionCategory,
  FunnelResult,
  FunnelStage,
  LanguageGroup,
  Persona,
  Scenario,
  Trial,
  Visit,
} from "@/lib/types";
import { personas, segmentWeights } from "./personas";

// Mock "simulation engine". A real backend would run this against a full
// synthetic population; here each persona stands in for a segment and the
// rules below are hand-tuned so the demo story holds.

export const defaultAssumptions: Assumptions = {
  weights: { schedule: 1, transport: 1, fasting: 1, childcare: 1, cost: 1, language: 1, closure: 1 },
  dropoutThreshold: 0.7,
  dropProbAtBarrier: 0.65,
  baselineDropProb: 0.02,
  reachProbability: { Spanish: 0.62, "Haitian Creole": 0.45, English: 0.7, Portuguese: 0.5 },
};

export const languageGroups: LanguageGroup[] = ["Spanish", "Haitian Creole", "English", "Portuguese"];

const population: Record<LanguageGroup, number> = {
  Spanish: 2350,
  "Haitian Creole": 980,
  English: 1520,
  Portuguese: 150,
};

const eligibleRate: Record<string, Record<LanguageGroup, number>> = {
  NCT90000001: { Spanish: 0.19, "Haitian Creole": 0.17, English: 0.16, Portuguese: 0.2 },
  NCT90000002: { Spanish: 0.24, "Haitian Creole": 0.29, English: 0.22, Portuguese: 0.18 },
};

type Severity = Partial<Record<FrictionCategory, { value: number; reason: string }>>;

const startHour = (v: Visit) => {
  const [hm, ampm] = v.startTime.split(" ");
  const [h, m] = hm.split(":").map(Number);
  return (h % 12) + (ampm === "PM" ? 12 : 0) + m / 60;
};

const hasForms = (v: Visit) => v.procedures.some((p) => /consent|questionnaire/i.test(p));

/** Raw friction sources for one persona at one visit, before weights. */
function severities(persona: Persona, visit: Visit, trial: Trial, scenario: Scenario): Severity {
  const s: Severity = {};
  const early = visit.time === "morning" && startHour(visit) < 9;
  const long = visit.durationHours >= 2.5;
  const evening = visit.time === "evening";

  switch (persona.id) {
    case "p-nightshift":
      if (early) s.schedule = { value: 0.55, reason: `${visit.startTime} is right after a shift that ends at 7 AM` };
      else if (visit.time === "morning") s.schedule = { value: 0.3, reason: "Morning visit cuts into sleep after night shift" };
      else s.schedule = { value: evening ? 0.05 : 0.1, reason: "Visit time works around the night shift" };
      if (visit.fasting) {
        s.fasting = evening
          ? { value: 0.1, reason: "Daytime fast fits the sleep schedule" }
          : { value: 0.3, reason: "10-hour fast overlaps the whole shift, including the 4 AM meal" };
      }
      s.transport = { value: 0.15 + (long ? 0.1 : 0), reason: "Two buses each way" };
      break;
    case "p-retiree":
      s.transport = { value: 0.3, reason: "No car; daughter can only drive on weekends" };
      if (hasForms(visit)) s.language = { value: 0.2, reason: "Forms and questionnaires only in English" };
      if (visit.fasting) s.fasting = { value: 0.15, reason: "Worried about low blood sugar while fasting" };
      if (visit.durationHours >= 3) s.schedule = { value: 0.1, reason: "3-hour visit is tiring" };
      break;
    case "p-parent": {
      const end = startHour(visit) + visit.durationHours;
      s.transport = { value: 0.1 + (long ? 0.05 : 0), reason: "Bus with two small children" };
      s.childcare = long
        ? { value: 0.2, reason: `${visit.durationHours}-hour visit and no childcare` }
        : { value: 0.1, reason: "Has to bring kids along" };
      if (!evening && end > 15 && startHour(visit) < 15.5) s.schedule = { value: 0.2, reason: "Visit runs past 3 PM school pickup" };
      else if (early) s.schedule = { value: 0.15, reason: "Clashes with school drop-off" };
      if (hasForms(visit)) s.language = { value: 0.1, reason: "No Creole consent form listed" };
      break;
    }
    case "p-cruise": {
      const atSea = (visit.week >= 7 && visit.week <= 9) || (visit.week >= 19 && visit.week <= 21);
      s.schedule = atSea
        ? { value: 0.9, reason: `At sea in week ${visit.week}; no visit window wide enough` }
        : { value: 0.05, reason: "In port this week" };
      if (hasForms(visit)) s.language = { value: 0.15, reason: "No Portuguese materials" };
      s.cost = { value: 0.05, reason: "Parking" };
      break;
    }
    case "p-driver":
      s.cost = { value: 0.12 * visit.durationHours + 0.05, reason: `${visit.durationHours} hours unpaid plus parking` };
      if (early) s.schedule = { value: 0.15, reason: "Misses the morning rush, the best-paid hours" };
      else if (evening) s.schedule = { value: 0.15, reason: "Misses the evening rush" };
      if (visit.fasting) s.fasting = { value: 0.1, reason: "Fasting while driving is unsafe" };
      break;
  }

  if (scenario.rideVouchers && s.transport) {
    s.transport = { value: s.transport.value * 0.3, reason: `${s.transport.reason} (ride voucher covers it)` };
  }
  if (scenario.stormWeek && visit.id === trial.stormVisitId) {
    s.closure = { value: 0.5, reason: `Clinic closed for a storm in week ${trial.stormWeek}; visit must be rescheduled` };
    if (persona.person.commute === "bus" && !scenario.rideVouchers) {
      s.transport = { value: (s.transport?.value ?? 0) + 0.15, reason: "Bus routes cut after the storm" };
    }
  }
  return s;
}

function score(s: Severity, a: Assumptions): { friction: number; reason: string; categories: FrictionCategory[] } {
  const parts = (Object.entries(s) as [FrictionCategory, { value: number; reason: string }][])
    .map(([cat, v]) => ({ cat, weighted: v.value * a.weights[cat], reason: v.reason }))
    .sort((x, y) => y.weighted - x.weighted);
  const friction = Math.min(1, parts.reduce((sum, p) => sum + p.weighted, 0));
  const top = parts.filter((p) => p.weighted >= 0.1).slice(0, 2);
  return {
    friction: Math.round(friction * 100) / 100,
    reason: top.length ? top.map((p) => p.reason).join("; ") : "No major friction",
    categories: top.map((p) => p.cat),
  };
}

/** Evening visits are offered as an option: each person picks whichever slot is easier. */
function eveningVersion(v: Visit): Visit {
  return { ...v, time: "evening", startTime: "5:30 PM" };
}

export function simulateBarriers(trial: Trial, scenario: Scenario, a: Assumptions): BarrierResult[] {
  const out: BarrierResult[] = [];
  for (const p of personas) {
    let droppedAlready = false;
    for (const v of trial.visits) {
      let best = score(severities(p, v, trial, scenario), a);
      if (scenario.eveningVisits && v.time === "morning") {
        const eve = score(severities(p, eveningVersion(v), trial, scenario), a);
        if (eve.friction < best.friction) best = { ...eve, reason: `Evening option: ${eve.reason}` };
      }
      const dropsOut = !droppedAlready && best.friction >= a.dropoutThreshold;
      if (dropsOut) droppedAlready = true;
      out.push({ personaId: p.id, visitId: v.id, ...best, dropsOut });
    }
  }
  return out;
}

function stages(pop: number, eligible: number, reachable: number, completes: number): FunnelStage[] {
  return [
    { key: "population", label: "Synthetic population", count: Math.round(pop) },
    { key: "eligible", label: "Eligible", count: Math.round(eligible) },
    { key: "reachable", label: "Reachable", count: Math.round(reachable) },
    { key: "completes", label: "Stays to the end", count: Math.round(completes) },
  ];
}

export function simulateFunnel(trial: Trial, scenario: Scenario, a: Assumptions): FunnelResult {
  const barriers = simulateBarriers(trial, scenario, a);
  const completion = (personaId: string) =>
    barriers
      .filter((b) => b.personaId === personaId)
      .reduce((keep, b) => {
        const p = b.friction >= a.dropoutThreshold ? a.dropProbAtBarrier : a.baselineDropProb + 0.12 * b.friction;
        return keep * (1 - p);
      }, 1);

  const byLanguage = languageGroups.map((language) => {
    const pop = population[language];
    const eligible = pop * (eligibleRate[trial.id]?.[language] ?? 0.2);
    const reachable = eligible * a.reachProbability[language];
    const retention = Object.entries(segmentWeights[language]).reduce(
      (sum, [pid, w]) => sum + (w ?? 0) * completion(pid),
      0,
    );
    return { language, stages: stages(pop, eligible, reachable, reachable * retention) };
  });

  const total = byLanguage[0].stages.map((st, i) => ({
    ...st,
    count: byLanguage.reduce((sum, g) => sum + g.stages[i].count, 0),
  }));

  return { trialId: trial.id, scenario, stages: total, byLanguage };
}
