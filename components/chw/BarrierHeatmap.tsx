"use client";

import { useState } from "react";
import { frictionLabel, frictionLevel } from "@/lib/format";
import type { BarrierResult, Persona, Trial } from "@/lib/types";

const cellStyle = {
  low: "bg-ok/15 text-ok border-ok/40",
  medium: "bg-warn/20 text-warn border-warn/50",
  barrier: "bg-bad/30 text-bad border-bad",
};

export function BarrierHeatmap({ trial, personas, barriers, threshold }: {
  trial: Trial;
  personas: Persona[];
  barriers: BarrierResult[];
  threshold: number;
}) {
  const [focus, setFocus] = useState<BarrierResult | null>(null);
  const cell = (pid: string, vid: string) => barriers.find((b) => b.personaId === pid && b.visitId === vid);
  const focused = focus && barriers.find((b) => b.personaId === focus.personaId && b.visitId === focus.visitId);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-1">
          <caption className="sr-only">Friction score per practice participant and visit</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left text-sm font-medium text-muted">Practice participant</th>
              {trial.visits.map((v) => (
                <th key={v.id} scope="col" className="text-center text-sm font-medium">
                  V{v.number}
                  <span className="block text-xs font-normal text-muted">
                    {v.startTime}
                    {v.fasting && " · fast"}
                    {v.id === trial.stormVisitId && " · ☈"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.id}>
                <th scope="row" className="pr-2 text-left text-sm font-medium">
                  {p.label}
                  <span className="block text-xs font-normal text-info">◆ SYNTHETIC</span>
                </th>
                {trial.visits.map((v) => {
                  const c = cell(p.id, v.id);
                  if (!c) return <td key={v.id} />;
                  const level = frictionLevel(c.friction, threshold);
                  const { icon, word } = frictionLabel[level];
                  const isFocus = focused === c;
                  return (
                    <td key={v.id} className="p-0">
                      <button
                        type="button"
                        onClick={() => setFocus(c)}
                        onFocus={() => setFocus(c)}
                        onMouseEnter={() => setFocus(c)}
                        aria-label={`${p.label}, visit ${v.number}: ${word} friction ${c.friction.toFixed(2)}. ${c.reason}`}
                        className={`flex h-14 w-full flex-col items-center justify-center rounded-md border text-sm font-semibold transition-colors duration-500 ${cellStyle[level]} ${
                          isFocus ? "ring-2 ring-ink" : ""
                        }`}
                      >
                        <span aria-hidden className="text-base leading-none">{icon}</span>
                        <span className="tabular-nums">{c.friction.toFixed(2)}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        {(["low", "medium", "barrier"] as const).map((l) => (
          <span key={l} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded border ${cellStyle[l]}`} aria-hidden>
              {frictionLabel[l].icon}
            </span>
            {l === "low" ? "Low (< 0.40)" : l === "medium" ? `Some friction (0.40–${(threshold - 0.01).toFixed(2)})` : `Barrier: drops out (≥ ${threshold.toFixed(2)})`}
          </span>
        ))}
      </div>

      <p className="mt-3 min-h-12 rounded-lg bg-bg p-3" aria-live="polite">
        {focused ? (
          <>
            <b>{personas.find((p) => p.id === focused.personaId)?.label}</b>, Visit{" "}
            {trial.visits.find((v) => v.id === focused.visitId)?.number}: {focused.reason}
          </>
        ) : (
          <span className="text-muted">Hover or tab to a cell to see why.</span>
        )}
      </p>
    </div>
  );
}
