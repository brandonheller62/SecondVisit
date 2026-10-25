"use client";

import { useState } from "react";
import { getTrial, listDemoTrials } from "@/lib/api";
import type { Trial } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Badge, Button, Card } from "./ui";

export function TrialPicker({ selected, onAnalyze }: { selected: Trial | null; onAnalyze: (t: Trial) => void }) {
  const demoTrials = useApi(listDemoTrials, []);
  const [nctId, setNctId] = useState("");
  const [picked, setPicked] = useState<Trial | null>(selected);
  const [error, setError] = useState<string | null>(null);

  async function lookUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^NCT\d{8}$/i.test(nctId.trim())) {
      setError("Enter an ID like NCT12345678.");
      return;
    }
    const trial = await getTrial(nctId);
    if (trial) setPicked(trial);
    else setError("Live lookup isn't connected in this demo. Pick one of the cached trials below.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Which trial should we test?</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted">
          Trial Mirror runs a recruiting trial against a synthetic Miami population. It finds who could be ruled out
          cheaply, then walks practice participants through every visit to see where they would drop out.
        </p>
      </div>

      <Card title="Look up by ClinicalTrials.gov ID">
        <form onSubmit={lookUp} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">NCT number</span>
            <input
              value={nctId}
              onChange={(e) => setNctId(e.target.value)}
              placeholder="NCT90000001"
              className="w-64 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-lg"
              aria-describedby={error ? "nct-error" : undefined}
            />
          </label>
          <Button type="submit">Look up</Button>
        </form>
        {error && (
          <p id="nct-error" role="alert" className="mt-3 text-warn">
            {error}
          </p>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-semibold">Pre-cached demo trials</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {demoTrials?.map((t) => {
            const active = picked?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPicked(t)}
                aria-pressed={active}
                className={`rounded-xl border-2 bg-surface p-5 text-left transition ${
                  active ? "border-accent" : "border-line hover:border-muted"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-muted">{t.id}</span>
                  <Badge tone="accent">{t.phase}</Badge>
                  <Badge>Demo cache</Badge>
                  {active && <Badge tone="ok">✓ Selected</Badge>}
                </div>
                <h3 className="mt-2 text-xl font-semibold">{t.shortTitle}</h3>
                <p className="mt-1 text-muted">{t.title}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-muted">Site</dt><dd>{t.neighborhood}</dd></div>
                  <div><dt className="text-muted">Visits</dt><dd>{t.visits.length} over {t.durationWeeks} wks</dd></div>
                  <div><dt className="text-muted">Fasting visits</dt><dd>{t.visits.filter((v) => v.fasting).length}</dd></div>
                </dl>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="primary" className="px-6 py-3 text-lg" disabled={!picked} onClick={() => picked && onAnalyze(picked)}>
          Analyze trial →
        </Button>
        {!picked && <span className="text-muted">Pick a trial first.</span>}
      </div>
    </div>
  );
}
