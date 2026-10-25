"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentRunTimeline } from "@/components/agent/AgentRunTimeline";
import { useAgentRun } from "@/components/agent/useAgentRun";
import { DraftsView } from "@/components/drafts/DraftsView";
import { ResultsView } from "@/components/results/ResultsView";
import { SafetyNote } from "@/components/shell/SafetyNote";
import { TopNav, type Tab } from "@/components/shell/TopNav";
import { StartPanel, type PatientFile } from "@/components/start/StartPanel";
import { cloneAssumptions, type Assumptions } from "@/lib/assumptions";
import { NCT_PATTERN } from "@/lib/nct";
import { parsePatients } from "@/lib/scoring/parsePatients";
import { allSupports, BASELINE, scorePatients } from "@/lib/scoring/score";
import type { Approval, Draft, Scenario } from "@/lib/types";

export default function Home() {
  const [tab, setTab] = useState<Tab>("start");
  const [nctId, setNctId] = useState("");
  const [file, setFile] = useState<PatientFile | null>(null);
  const [protocolText, setProtocolText] = useState("");
  const [showProtocol, setShowProtocol] = useState(false);
  const [assumptions, setAssumptions] = useState<Assumptions>(() => cloneAssumptions());
  const [scenario, setScenario] = useState<Scenario>(BASELINE);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const { state: run, start, cancel } = useAgentRun();

  const nctValid = NCT_PATTERN.test(nctId.trim().toUpperCase());
  const patients = file?.parse.ok ? file.parse.patients : null;
  const schedule = run.schedule?.scheduleFound ? run.schedule : null;

  // Adopt what the agent chose, so the results open on the agent's simulation.
  useEffect(() => {
    if (run.simulation) setScenario({ supports: allSupports(run.simulation.supports) });
  }, [run.simulation]);
  useEffect(() => {
    setDrafts(run.drafts);
    setApproval(null);
  }, [run.drafts]);
  useEffect(() => {
    if (run.stop?.reason === "needs_schedule") setShowProtocol(true);
  }, [run.stop]);

  const ranked = useMemo(
    () => (schedule && patients ? scorePatients(schedule, patients, assumptions, BASELINE).patients : []),
    [schedule, patients, assumptions],
  );

  async function loadSample() {
    const csv = await fetch("/api/sample-patients").then((r) => r.text());
    setFile({ name: "synthetic_patients.csv (sample)", csv, parse: parsePatients(csv) });
  }

  async function upload(f: File) {
    const csv = await f.text();
    setFile({ name: f.name, csv, parse: parsePatients(csv) });
  }

  function runAgent() {
    if (!file?.parse.ok) return;
    setScenario(BASELINE);
    start({ nctId: nctId.trim().toUpperCase(), csv: file.csv, protocolText: showProtocol && protocolText.trim() ? protocolText : undefined });
    setTab("run");
  }

  const enabled: Record<Tab, boolean> = {
    start: true,
    run: run.status !== "idle",
    results: Boolean(schedule && patients),
    drafts: Boolean(drafts),
  };

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">
        Skip to content
      </a>
      <div className="sticky top-0 z-30">
        <TopNav tab={tab} onTab={setTab} enabled={enabled} subtitle={run.trial ? `${run.trial.nctId}: ${run.trial.title}` : undefined} />
      </div>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        {tab === "start" && (
          <StartPanel
            nctId={nctId}
            onNctId={setNctId}
            nctValid={nctValid}
            file={file}
            onSample={loadSample}
            onUpload={upload}
            protocolText={protocolText}
            onProtocolText={setProtocolText}
            showProtocol={showProtocol}
            onRun={runAgent}
            running={run.status === "running"}
          />
        )}
        {tab === "run" && <AgentRunTimeline run={run} onCancel={cancel} onOpen={setTab} onPasteSchedule={() => setTab("start")} />}
        {tab === "results" && schedule && patients && (
          <ResultsView
            trial={run.trial}
            schedule={schedule}
            patients={patients}
            assumptions={assumptions}
            onAssumptions={setAssumptions}
            scenario={scenario}
            onScenario={setScenario}
          />
        )}
        {tab === "drafts" && drafts && <DraftsView drafts={drafts} onDrafts={setDrafts} approval={approval} onApproval={setApproval} ranked={ranked} />}
      </main>
      <SafetyNote />
    </div>
  );
}
