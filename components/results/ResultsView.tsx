"use client";

import { useMemo } from "react";
import type { Assumptions } from "@/lib/assumptions";
import { simulateSupports, summarizeGroups } from "@/lib/scoring/simulate";
import type { GroupBy, GroupSummary, Patient, Scenario, TrialInfo, VisitSchedule } from "@/lib/types";
import { GROUP_BYS, SUPPORT_KEYS } from "@/lib/types";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { BarrierHeatmap } from "./BarrierHeatmap";
import { BeforeAfterChart } from "./BeforeAfterChart";
import { CostPanel } from "./CostPanel";
import { GroupTable } from "./GroupTable";
import { LimitationsBox } from "./LimitationsBox";
import { ScheduleCard } from "./ScheduleCard";
import { SupportList } from "./SupportList";
import { SupportToggles } from "./SupportToggles";

/**
 * Everything here is recomputed in the browser with the same pure scoring code
 * the agent used, so edits to supports and assumptions update instantly.
 */
export function ResultsView({ trial, schedule, patients, assumptions, onAssumptions, scenario, onScenario }: {
  trial: TrialInfo | null;
  schedule: VisitSchedule;
  patients: Patient[];
  assumptions: Assumptions;
  onAssumptions: (a: Assumptions) => void;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
}) {
  const supportsOn = SUPPORT_KEYS.filter((k) => scenario.supports[k]);
  const sim = useMemo(
    () => simulateSupports(schedule, patients, assumptions, supportsOn, scenario.stormWeek),
    // supportsOn is derived from scenario
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule, patients, assumptions, scenario],
  );
  const groups = useMemo(
    () => Object.fromEntries(GROUP_BYS.map((by) => [by, summarizeGroups(patients, sim.before, sim.after, by)])) as Record<GroupBy, GroupSummary>,
    [patients, sim],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Results</h1>
        <p className="mt-1 text-lg text-muted">
          {trial ? `${trial.nctId} · ${trial.title}` : ""} · {patients.length} synthetic patients · {sim.before.scoredVisits.length} scored visits
        </p>
      </div>

      <ScheduleCard schedule={schedule} unknownNotes={sim.before.unknownNotes} />

      <BeforeAfterChart sim={sim}>
        <SupportToggles scenario={scenario} onScenario={onScenario} stormWeek={sim.before.stormWeekUsed} />
      </BeforeAfterChart>

      <SupportList patients={sim.before.patients} />
      <BarrierHeatmap score={sim.before} />

      <div className="grid gap-6 xl:grid-cols-2">
        <GroupTable groups={groups} />
        <LimitationsBox />
      </div>

      <CostPanel result={sim.result} assumptions={assumptions} onAssumptions={onAssumptions} />
      <AssumptionsPanel assumptions={assumptions} onAssumptions={onAssumptions} visits={sim.before.scoredVisits} materialsFromTrial={schedule.materialsLanguages} />
    </div>
  );
}
