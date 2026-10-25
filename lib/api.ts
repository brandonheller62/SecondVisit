import type {
  AgentStep,
  Assumptions,
  BarrierResult,
  Draft,
  FalseExclusionPoint,
  FrictionCategory,
  FunnelResult,
  Persona,
  RankedBarrier,
  Scenario,
  Trial,
} from "@/lib/types";
import { buildAgentRun } from "@/lib/mock/agent";
import { buildDrafts } from "@/lib/mock/drafts";
import { falseExclusionCurves } from "@/lib/mock/fidelity";
import { personas } from "@/lib/mock/personas";
import { defaultAssumptions, simulateBarriers, simulateFunnel } from "@/lib/mock/simulate";
import { trials } from "@/lib/mock/trials";

// The only door to data. Every function is async and returns mock data today;
// swap the bodies for fetch() calls when the backend exists. Components must
// not import from /lib/mock directly.

const delay = <T,>(value: T, ms = 0) => new Promise<T>((r) => setTimeout(() => r(value), ms));

export const DEFAULT_SCENARIO: Scenario = { eveningVisits: false, rideVouchers: false, stormWeek: false };

export async function listDemoTrials(): Promise<Trial[]> {
  return delay(trials);
}

/** Returns null for IDs that are not in the demo cache. */
export async function getTrial(nctId: string): Promise<Trial | null> {
  const id = nctId.trim().toUpperCase();
  return delay(trials.find((t) => t.id === id) ?? null);
}

export async function getAgentRun(trialId: string): Promise<AgentStep[]> {
  const trial = trials.find((t) => t.id === trialId);
  return delay(trial ? buildAgentRun(trial) : []);
}

export async function getPersonas(): Promise<Persona[]> {
  return delay(personas);
}

export async function getDefaultAssumptions(): Promise<Assumptions> {
  return delay(structuredClone(defaultAssumptions));
}

export async function getFunnel(trialId: string, scenario: Scenario, assumptions: Assumptions): Promise<FunnelResult | null> {
  const trial = trials.find((t) => t.id === trialId);
  return delay(trial ? simulateFunnel(trial, scenario, assumptions) : null);
}

export async function getBarriers(trialId: string, scenario: Scenario, assumptions: Assumptions): Promise<BarrierResult[]> {
  const trial = trials.find((t) => t.id === trialId);
  return delay(trial ? simulateBarriers(trial, scenario, assumptions) : []);
}

const fixes: Record<FrictionCategory, string> = {
  schedule: "Offer an evening or weekend option",
  fasting: "Allow a daytime fast with a late-afternoon visit",
  transport: "Ride vouchers paid up front",
  childcare: "On-site childcare or shorter visit blocks",
  cost: "Pay for time on the day of the visit",
  language: "Consent and forms in the person's language",
  closure: "Wide rescheduling window or home visit",
};

/** Visits ranked by how much friction they put on the practice participants. */
export async function getRankedBarriers(trialId: string, scenario: Scenario, assumptions: Assumptions): Promise<RankedBarrier[]> {
  const trial = trials.find((t) => t.id === trialId);
  if (!trial) return delay([]);
  const cells = simulateBarriers(trial, scenario, assumptions);
  const ranked = trial.visits
    .map((v) => {
      const hit = cells.filter((c) => c.visitId === v.id && c.friction >= 0.4).sort((a, b) => b.friction - a.friction);
      const worst = hit[0];
      return {
        id: `rb-${v.id}`,
        visitId: v.id,
        label: `Visit ${v.number}: ${v.name} (${v.startTime}${v.fasting ? ", fasting" : ""})`,
        reason: worst?.reason ?? "",
        personaIds: hit.map((c) => c.personaId),
        maxFriction: worst?.friction ?? 0,
        suggestedFix: worst?.categories[0] ? fixes[worst.categories[0]] : "",
        load: hit.reduce((s, c) => s + c.friction, 0),
      };
    })
    .filter((r) => r.personaIds.length > 0)
    .sort((a, b) => b.load - a.load)
    .map((r): RankedBarrier => ({ id: r.id, visitId: r.visitId, label: r.label, reason: r.reason, personaIds: r.personaIds, maxFriction: r.maxFriction, suggestedFix: r.suggestedFix }));
  return delay(ranked);
}

export async function getFalseExclusionCurve(trialId: string): Promise<FalseExclusionPoint[]> {
  return delay(falseExclusionCurves[trialId] ?? []);
}

export async function getDrafts(trialId: string): Promise<Draft[]> {
  return delay(buildDrafts(trialId));
}

/** Mock approval. A real backend would record the reviewer server-side. */
export async function approveDraft(draft: Draft, approvedBy: string): Promise<Draft> {
  return delay({ ...draft, status: "approved", approvedBy, approvedAt: new Date().toISOString() });
}
