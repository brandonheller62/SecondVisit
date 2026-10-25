"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";
import type { Assumptions } from "@/lib/assumptions";
import { simulateSupports, summarizeGroups } from "@/lib/scoring/simulate";
import { buildSummary } from "@/lib/scoring/summary";
import type { GroupBy, GroupSummary, Patient, Scenario, TrialInfo, VisitSchedule } from "@/lib/types";
import { GROUP_BYS, SUPPORT_KEYS } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Card } from "@/components/shell/ui";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { CostPanel } from "./CostPanel";
import { GroupTable } from "./GroupTable";
import { LimitationsBox } from "./LimitationsBox";
import { SummaryCard } from "./SummaryCard";
import { SupportList } from "./SupportList";
import { SupportToggles } from "./SupportToggles";

/**
 * Everything here is recomputed in the browser with the same pure scoring code
 * the agent used, so edits to supports and assumptions update instantly.
 */
export function ResultsView({ trial, schedule, patients, assumptions, onAssumptions, scenario, onScenario, exampleSchedule, replay }: {
  trial: TrialInfo | null;
  schedule: VisitSchedule;
  patients: Patient[];
  assumptions: Assumptions;
  onAssumptions: (a: Assumptions) => void;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  /** The schedule came from the team-written example on Start, not the registry. */
  exampleSchedule: boolean;
  replay: boolean;
}) {
  const supportsOn = SUPPORT_KEYS.filter((k) => scenario.supports[k]);
  const sim = useMemo(
    () => simulateSupports(schedule, patients, assumptions, supportsOn),
    // supportsOn is derived from scenario
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule, patients, assumptions, scenario],
  );
  const groups = useMemo(
    () => Object.fromEntries(GROUP_BYS.map((by) => [by, summarizeGroups(patients, sim.before, sim.after, by)])) as Record<GroupBy, GroupSummary>,
    [patients, sim],
  );
  const summary = useMemo(() => buildSummary(sim, assumptions), [sim, assumptions]);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Results</h1>
        <p className="mt-1 text-muted">
          {patients.length} synthetic patients, {sim.before.scoredVisits.length} visits{trial ? ` (${trial.nctId})` : ""}. Numbers are estimates from adjustable guesses, not predictions.
          {replay && " Replay of a previous run."}
          {exampleSchedule && " Uses an example schedule, not the registry's."}
        </p>
      </div>

      <SummaryCard summary={summary} />

      <SupportList patients={sim.before.patients} visitCount={sim.before.scoredVisits.length} />

      <Card title="Supports" subtitle="Turn on the supports you can offer. The group table and costs update.">
        <SupportToggles scenario={scenario} onScenario={onScenario} />
        <p className="mt-4">
          High need: {sim.result.tiersBefore.High} patient{sim.result.tiersBefore.High === 1 ? "" : "s"} without support, {sim.result.tiersAfter.High} with.
        </p>
      </Card>

      <GroupTable groups={groups} />

      <LimitationsBox />

      <details className="group border-t border-border pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xl font-semibold [&::-webkit-details-marker]:hidden">
          <CaretRight {...ico} className={`${ico.className} transition-transform group-open:rotate-90`} />
          Advanced
          <span className="text-sm font-normal text-muted">Assumptions and costs</span>
        </summary>
        <div className="mt-4 space-y-8">
          {sim.before.unknownNotes.length > 0 && (
            <Card title="How unknowns were handled">
              <ul className="list-disc space-y-1 pl-5">
                {sim.before.unknownNotes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </Card>
          )}
          <AssumptionsPanel assumptions={assumptions} onAssumptions={onAssumptions} materialsFromTrial={schedule.materialsLanguages} />
          <CostPanel result={sim.result} assumptions={assumptions} onAssumptions={onAssumptions} />
        </div>
      </details>
    </div>
  );
}
