"use client";

import { useEffect, useState } from "react";
import { frictionLabel, frictionLevel } from "@/lib/format";
import type { BarrierResult, Persona, Trial } from "@/lib/types";
import { Badge, Button, SyntheticTag } from "@/components/shell/ui";

const STEP_MS = 700;

const levelStyle = {
  low: "border-ok text-ok",
  medium: "border-warn text-warn",
  barrier: "border-bad bg-bad/20 text-bad",
};

/** Walks one persona visit by visit and stops where they would drop out. */
export function PersonaWalk({ persona, trial, barriers, threshold }: {
  persona: Persona;
  trial: Trial;
  barriers: BarrierResult[];
  threshold: number;
}) {
  const cells = trial.visits.map((v) => barriers.find((b) => b.personaId === persona.id && b.visitId === v.id)!);
  const stopAt = cells.findIndex((c) => c?.dropsOut);
  const last = stopAt === -1 ? cells.length - 1 : stopAt;

  const [pos, setPos] = useState(0);
  // Restart the walk whenever the persona or the outcome changes.
  const signature = `${persona.id}:${cells.map((c) => c?.friction).join(",")}`;
  useEffect(() => setPos(0), [signature]);
  useEffect(() => {
    if (pos >= last) return;
    const t = setTimeout(() => setPos((p) => p + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [pos, last]);

  const done = pos >= last;
  const failed = done && stopAt !== -1;
  const current = cells[pos];
  const visit = trial.visits[pos];

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <SyntheticTag />
        <h3 className="text-xl font-semibold">{persona.label}</h3>
        <span className="text-muted">{persona.summary}</span>
        <Button className="ml-auto" onClick={() => setPos(0)}>↺ Replay</Button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm text-muted">
        {persona.constraints.map((c) => <li key={c} className="rounded bg-bg px-2 py-0.5">{c}</li>)}
      </ul>

      <div className="mt-5 overflow-x-auto pb-2">
        <ol className="relative grid min-w-[640px] gap-2" style={{ gridTemplateColumns: `repeat(${trial.visits.length}, minmax(0, 1fr))` }}>
          <span aria-hidden className="absolute left-[7%] right-[7%] top-6 h-0.5 bg-line" />
          {trial.visits.map((v, i) => {
            const c = cells[i];
            const reached = i <= pos;
            const level = frictionLevel(c.friction, threshold);
            const here = i === pos;
            return (
              <li key={v.id} className="relative flex flex-col items-center text-center">
                <span
                  className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-surface text-lg font-bold transition-all duration-300 ${
                    reached ? levelStyle[level] : "border-line text-muted"
                  } ${here ? "scale-110 ring-4 ring-accent/40" : ""}`}
                >
                  {reached ? frictionLabel[level].icon : v.number}
                </span>
                <span aria-hidden className="mt-1 flex h-8 items-center text-2xl">
                  {here && <span className="animate-[fadein_300ms_ease-out]">🚶</span>}
                </span>
                <span className="text-sm font-semibold">Visit {v.number}</span>
                <span className="text-xs text-muted">Wk {v.week} · {v.startTime}</span>
                {v.fasting && <span className="text-xs text-warn">Fasting</span>}
              </li>
            );
          })}
        </ol>
      </div>

      <div aria-live="polite" className="mt-4 min-h-20 rounded-lg border border-line bg-bg p-4">
        {failed ? (
          <>
            <Badge tone="bad">✕ Drops out at Visit {visit.number}</Badge>
            <p className="mt-2 text-lg">
              <b>{visit.name}</b> ({visit.startTime}{visit.fasting ? ", fasting" : ""}): {current.reason}.
            </p>
          </>
        ) : done ? (
          <>
            <Badge tone="ok">✓ Finishes all {trial.visits.length} visits</Badge>
            <p className="mt-2 text-muted">Hardest stop: {hardest(cells, trial)}</p>
          </>
        ) : (
          <p className="text-muted">
            Visit {visit.number}: {visit.name}… <span className="text-ink">{current.reason}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function hardest(cells: BarrierResult[], trial: Trial) {
  const i = cells.reduce((best, c, idx) => (c.friction > cells[best].friction ? idx : best), 0);
  return `Visit ${trial.visits[i].number}: ${cells[i].reason}`;
}
