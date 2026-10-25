"use client";

import { useState } from "react";
import { AgentRunTimeline } from "@/components/agent/AgentRunTimeline";
import { ChwView } from "@/components/chw/ChwView";
import { CoordinatorView } from "@/components/coordinator/CoordinatorView";
import { SafetyBanner } from "@/components/shell/SafetyBanner";
import { TopNav, type Tab } from "@/components/shell/TopNav";
import { TrialPicker } from "@/components/shell/TrialPicker";
import { DEFAULT_SCENARIO, getDefaultAssumptions } from "@/lib/api";
import type { Assumptions, Scenario, Trial } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function Home() {
  const [tab, setTab] = useState<Tab>("trial");
  const [trial, setTrial] = useState<Trial | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const defaults = useApi(getDefaultAssumptions, []);
  const [edited, setEdited] = useState<Assumptions | null>(null);
  const assumptions = edited ?? defaults;

  function analyze(t: Trial) {
    if (t.id !== trial?.id) setScenario(DEFAULT_SCENARIO);
    setTrial(t);
    setRunKey((k) => k + 1);
    setTab("run");
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30">
        <SafetyBanner />
        <TopNav tab={tab} onTab={setTab} trial={trial} />
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Views stay mounted (just hidden) so CHW edits survive tab switches. */}
        <div hidden={tab !== "trial"}>
          <TrialPicker selected={trial} onAnalyze={analyze} />
        </div>
        {trial && assumptions && (
          <>
            <div hidden={tab !== "run"}>
              <AgentRunTimeline trial={trial} runKey={runKey} onOpen={setTab} />
            </div>
            <div hidden={tab !== "coordinator"}>
              <CoordinatorView trial={trial} scenario={scenario} assumptions={assumptions} />
            </div>
            <div hidden={tab !== "chw"}>
              <ChwView
                key={trial.id}
                trial={trial}
                scenario={scenario}
                onScenario={setScenario}
                assumptions={assumptions}
                onAssumptions={setEdited}
                defaultAssumptions={defaults!}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
