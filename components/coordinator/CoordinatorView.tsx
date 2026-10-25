"use client";

import { getFunnel } from "@/lib/api";
import type { Assumptions, Scenario, Trial } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Card } from "@/components/shell/ui";
import { CostCalculator } from "./CostCalculator";
import { FalseExclusionCard } from "./FalseExclusionCard";
import { FunnelChart } from "./FunnelChart";
import { LanguageFunnel } from "./LanguageFunnel";
import { PrescreenTable } from "./PrescreenTable";

/**
 * "After" uses whatever accommodations the CHW has switched on. If none are on,
 * show the full package so the comparison is still meaningful.
 */
export function afterScenario(s: Scenario): { scenario: Scenario; label: string } {
  const any = s.eveningVisits || s.rideVouchers;
  const scenario = any ? s : { ...s, eveningVisits: true, rideVouchers: true };
  const parts = [scenario.eveningVisits && "evening visits", scenario.rideVouchers && "ride vouchers"].filter(Boolean);
  return { scenario, label: `With ${parts.join(" + ")}` };
}

export function CoordinatorView({ trial, scenario, assumptions }: { trial: Trial; scenario: Scenario; assumptions: Assumptions }) {
  const baseScenario = { ...scenario, eveningVisits: false, rideVouchers: false };
  const after = afterScenario(scenario);
  const before = useApi(() => getFunnel(trial.id, baseScenario, assumptions), [trial.id, scenario.stormWeek, assumptions]);
  const afterFunnel = useApi(() => getFunnel(trial.id, after.scenario, assumptions), [trial.id, JSON.stringify(after.scenario), assumptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coordinator view</h1>
        <p className="mt-1 text-lg text-muted">
          {trial.site} · {trial.neighborhood} · target {trial.enrollmentTarget} participants
          {scenario.stormWeek && <span className="text-warn"> · Storm closure week is ON</span>}
        </p>
      </div>

      {before && afterFunnel && (
        <>
          <Card
            title="Recruitment funnel"
            subtitle={`5,000 synthetic Miami adults. No accommodations vs. ${after.label.toLowerCase()}. Change accommodations on the CHW tab.`}
          >
            <FunnelChart before={before} after={afterFunnel} afterLabel={after.label} />
          </Card>
          <Card title="Funnel by language group" subtitle="Groups under 10 people are suppressed.">
            <LanguageFunnel before={before} after={afterFunnel} />
          </Card>
        </>
      )}

      <Card title="Prescreen order" subtitle="Run the cheap checks that rule out the most people first. Expensive tests go last.">
        <PrescreenTable trial={trial} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <FalseExclusionCard trialId={trial.id} />
        <CostCalculator />
      </div>
    </div>
  );
}
