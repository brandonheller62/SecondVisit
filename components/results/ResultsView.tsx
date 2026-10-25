"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";
import { COMPENSATION_LABELS, type Assumptions } from "@/lib/assumptions";
import { simulateSupports, summarizeGroups } from "@/lib/scoring/simulate";
import { buildSummary, unknownVisitFields, visitsDistinguishable } from "@/lib/scoring/summary";
import type { GroupBy, GroupSummary, Patient, Scenario, TrialInfo, VisitSchedule } from "@/lib/types";
import { GROUP_BYS, SUPPORT_KEYS } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Badge, Card } from "@/components/shell/ui";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { BeforeAfterChart } from "./BeforeAfterChart";
import { CostPanel } from "./CostPanel";
import { GroupTable } from "./GroupTable";
import { LimitationsBox } from "./LimitationsBox";
import { SummaryCard } from "./SummaryCard";
import { SupportList } from "./SupportList";
import { SupportToggles } from "./SupportToggles";
import { UnknownsBanner } from "./UnknownsBanner";

/**
 * Everything here is recomputed in the browser with the same pure scoring code
 * the agent used, so edits to supports and assumptions update instantly.
 */
export function ResultsView({ trial, schedule, patients, assumptions, onAssumptions, scenario, onScenario, onPasteSchedule, exampleSchedule, replay }: {
  trial: TrialInfo | null;
  schedule: VisitSchedule;
  patients: Patient[];
  assumptions: Assumptions;
  onAssumptions: (a: Assumptions) => void;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  onPasteSchedule: () => void;
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
  const unknownFields = unknownVisitFields(sim.before.scoredVisits);
  const distinguishable = visitsDistinguishable(sim.before);
  const costUnknown = assumptions.participantCompensation.kind === "unknown";

  return (
    <div className="space-y-6">
      {unknownFields.length > 0 && <UnknownsBanner fields={unknownFields} distinguishable={distinguishable} source={schedule.source} onPasteSchedule={onPasteSchedule} />}

      <div>
        <h1 className="text-3xl font-bold">Results</h1>
        {trial && <p className="mt-1 max-w-[75ch] text-lg text-muted">{trial.nctId}: {trial.title}</p>}
        <p className="mt-1 text-muted">
          {patients.length} synthetic patients, {sim.before.scoredVisits.length} scored visits. Trial pays participants: {COMPENSATION_LABELS[assumptions.participantCompensation.kind].toLowerCase()}.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {replay && <Badge tone="info">Replay of a previous run</Badge>}
          {exampleSchedule && <Badge tone="warn">Example schedule written by the team, not from the registry</Badge>}
        </div>
      </div>

      <SummaryCard summary={summary} />

      <SupportList patients={sim.before.patients} visitCount={sim.before.scoredVisits.length} costUnknown={costUnknown} />

      <BeforeAfterChart sim={sim}>
        <SupportToggles scenario={scenario} onScenario={onScenario} />
      </BeforeAfterChart>

      <GroupTable groups={groups} />

      <LimitationsBox />

      <details className="group rounded-xl border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-5 py-4 text-xl font-semibold [&::-webkit-details-marker]:hidden">
          <CaretRight {...ico} className={`${ico.className} transition-transform group-open:rotate-90`} />
          Advanced
          <span className="text-sm font-normal text-muted">Assumptions, costs, and how unknowns were handled</span>
        </summary>
        <div className="space-y-6 border-t border-line p-5">
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
