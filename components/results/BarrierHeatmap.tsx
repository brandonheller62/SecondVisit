"use client";

import { useState } from "react";
import { BARRIER_LABELS } from "@/lib/assumptions";
import { fmtMaybe, frictionLabel, frictionLevel } from "@/lib/format";
import type { Cell, ScoreResult } from "@/lib/types";
import { Card } from "@/components/shell/ui";

const TOP_N = 25;

/** Top 25 patients by need x scored visits. Each cell has an icon and number, so color is never the only signal. */
export function BarrierHeatmap({ score }: { score: ScoreResult }) {
  const [focus, setFocus] = useState<Cell | null>(null);
  const top = score.patients.slice(0, TOP_N);
  const visits = score.scoredVisits;
  const cells = new Map(score.matrix.map((c) => [`${c.patientId}|${c.visitId}`, c]));

  return (
    <Card title="Barrier heatmap" subtitle={`Friction at each visit for the ${top.length} patients who need the most support. Icon shows the main barrier.`}>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <caption className="sr-only">Friction per patient and visit</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface pr-2 text-left text-sm font-medium text-muted">Patient</th>
              {visits.map((v) => (
                <th key={v.id} scope="col" className="min-w-16 px-1 text-center text-xs font-medium">
                  <span className="block max-w-24 truncate" title={v.label}>{v.label}</span>
                  <span className="block font-normal text-muted">
                    wk {fmtMaybe(v.week)}
                    {v.fasting === true && " · fast"}
                    {v.timeOfDay === "morning" && " · AM"}
                    {score.stormWeekUsed !== null && v.week === score.stormWeekUsed && " · ⛈"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((p) => (
              <tr key={p.patientId}>
                <th scope="row" className="sticky left-0 z-10 bg-surface pr-2 text-left text-sm font-medium">
                  <span className="font-mono">{p.patientId}</span>
                  <span className="block text-xs font-normal text-info">◆ SYNTHETIC</span>
                </th>
                {visits.map((v) => {
                  const c = cells.get(`${p.patientId}|${v.id}`);
                  if (!c) return <td key={v.id} />;
                  const level = frictionLevel(c.friction);
                  const lab = frictionLabel[level];
                  const main = c.dominant ? BARRIER_LABELS[c.dominant] : null;
                  return (
                    <td key={v.id} className="p-0">
                      <button
                        type="button"
                        onClick={() => setFocus(c)}
                        onFocus={() => setFocus(c)}
                        onMouseEnter={() => setFocus(c)}
                        aria-label={`${p.patientId}, ${v.label}: ${lab.word} friction ${c.friction.toFixed(2)}${main ? `, mainly ${main.label}` : ""}`}
                        className={`flex h-12 w-full min-w-16 flex-col items-center justify-center rounded-md border text-xs font-semibold ${lab.cls} ${focus === c ? "ring-2 ring-ink" : ""}`}
                      >
                        <span aria-hidden className="text-sm leading-none">{main ? main.icon : lab.icon}</span>
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
        {(["low", "some", "high"] as const).map((l) => (
          <span key={l} className="flex items-center gap-2">
            <span aria-hidden className={`flex h-6 w-6 items-center justify-center rounded border ${frictionLabel[l].cls}`}>{frictionLabel[l].icon}</span>
            {frictionLabel[l].word} {l === "low" ? "(under 0.10)" : l === "some" ? "(0.10–0.19)" : "(0.20+)"}
          </span>
        ))}
        <span className="text-muted">
          Icons: {Object.values(BARRIER_LABELS).map((b) => `${b.icon} ${b.label}`).join(" · ")}
        </span>
      </div>

      <div className="mt-3 min-h-14 rounded-lg bg-bg p-3" aria-live="polite">
        {focus ? (
          <>
            <b className="font-mono">{focus.patientId}</b>, {visits.find((v) => v.id === focus.visitId)?.label}: friction {focus.friction.toFixed(2)}
            {focus.terms.length === 0 ? (
              <span className="text-muted"> (no barriers found)</span>
            ) : (
              <ul className="mt-1 text-sm">
                {focus.terms
                  .slice()
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((t) => (
                    <li key={t.key}>
                      {BARRIER_LABELS[t.key].icon} {BARRIER_LABELS[t.key].label}: {t.reason} <span className="text-muted">(+{t.contribution.toFixed(3)})</span>
                    </li>
                  ))}
              </ul>
            )}
          </>
        ) : (
          <span className="text-muted">Hover, tap or tab to a cell to see why.</span>
        )}
      </div>
    </Card>
  );
}
