"use client";

import { useEffect, useState } from "react";
import { getBarriers, getDrafts, getFunnel, getPersonas, getRankedBarriers } from "@/lib/api";
import { fmtCount } from "@/lib/format";
import type { Assumptions, Draft, Scenario, Trial } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Card } from "@/components/shell/ui";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { BarrierHeatmap } from "./BarrierHeatmap";
import { AccommodationDraft, PlainSummary } from "./DraftPanels";
import { PersonaCards } from "./PersonaCards";
import { PersonaWalk } from "./PersonaWalk";
import { RankedBarriers, ResearchQuestions } from "./RankedBarriers";
import { ScenarioToggles } from "./ScenarioToggles";

export function ChwView({ trial, scenario, onScenario, assumptions, onAssumptions, defaultAssumptions }: {
  trial: Trial;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  assumptions: Assumptions;
  onAssumptions: (a: Assumptions) => void;
  defaultAssumptions: Assumptions;
}) {
  const deps = [trial.id, JSON.stringify(scenario), assumptions];
  const personas = useApi(getPersonas, []);
  const barriers = useApi(() => getBarriers(trial.id, scenario, assumptions), deps);
  const ranked = useApi(() => getRankedBarriers(trial.id, scenario, assumptions), deps);
  const funnel = useApi(() => getFunnel(trial.id, scenario, assumptions), deps);
  const baseline = useApi(() => getFunnel(trial.id, { eveningVisits: false, rideVouchers: false, stormWeek: false }, assumptions), [trial.id, assumptions]);

  const [selected, setSelected] = useState<string>("p-nightshift");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  useEffect(() => {
    getDrafts(trial.id).then(setDrafts);
  }, [trial.id]);
  const updateDraft = (d: Draft) => setDrafts((all) => all.map((x) => (x.id === d.id ? d : x)));

  if (!personas || !barriers || !ranked) return null;
  const persona = personas.find((p) => p.id === selected)!;
  const completes = funnel?.stages.at(-1)?.count ?? 0;
  const baseCompletes = baseline?.stages.at(-1)?.count ?? 0;
  const delta = completes - baseCompletes;
  const approvedCount = drafts.filter((d) => d.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CHW review</h1>
          <p className="mt-1 text-lg text-muted">
            Practice participants walking through {trial.id}. Drafts approved: {approvedCount} of {drafts.length}.
          </p>
        </div>
      </div>

      <Card title="What if…" subtitle="Toggles re-run the practice participants and the coordinator funnel.">
        <ScenarioToggles scenario={scenario} onChange={onScenario} />
        <p className="mt-4 text-lg" aria-live="polite">
          Synthetic people who stay to the end: <b className="text-accent tabular-nums">{fmtCount(completes)}</b>
          {delta !== 0 && (
            <span className={delta > 0 ? "text-ok" : "text-bad"}>
              {" "}({delta > 0 ? "▲ +" : "▼ "}{delta} vs. no changes)
            </span>
          )}
        </p>
      </Card>

      <Card title="Practice participants" subtitle="Pick one to walk them through every visit.">
        <PersonaCards personas={personas} barriers={barriers} selectedId={selected} onSelect={setSelected} />
        <div className="mt-5">
          <PersonaWalk persona={persona} trial={trial} barriers={barriers} threshold={assumptions.dropoutThreshold} />
        </div>
      </Card>

      <Card title="Barrier heatmap" subtitle="Friction score for each practice participant at each visit.">
        <BarrierHeatmap trial={trial} personas={personas} barriers={barriers} threshold={assumptions.dropoutThreshold} />
      </Card>

      <AssumptionsPanel value={assumptions} defaults={defaultAssumptions} onChange={onAssumptions} />

      <div className="grid gap-6 xl:grid-cols-2">
        <RankedBarriers ranked={ranked} personas={personas} threshold={assumptions.dropoutThreshold} />
        <ResearchQuestions trial={trial} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PlainSummary drafts={drafts} onChange={updateDraft} />
        <AccommodationDraft drafts={drafts} onChange={updateDraft} />
      </div>
    </div>
  );
}
