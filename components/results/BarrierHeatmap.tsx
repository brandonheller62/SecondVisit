"use client";

import { useState } from "react";
import { BARRIER_LABELS, COST_UNKNOWN_CAVEAT } from "@/lib/assumptions";
import type { ScoreResult, Visit } from "@/lib/types";
import { BarrierIcon } from "@/components/shell/icons";
import { Card, SyntheticTag } from "@/components/shell/ui";

type Level = "low" | "some" | "high";

// Bands for the 0-1 per-visit score f(p,v). Display only; the score itself is unchanged.
const levelOf = (f: number): Level => (f >= 0.2 ? "high" : f >= 0.1 ? "some" : "low");

const LEVELS: Record<Level, { word: string; range: string; cls: string }> = {
  low: { word: "Easier", range: "under 0.10", cls: "border-line bg-surface-2" },
  some: { word: "Harder", range: "0.10 to 0.19", cls: "border-warn/60 bg-warn/15" },
  high: { word: "Hardest", range: "0.20 or more", cls: "border-bad/70 bg-bad/20" },
};

const weekText = (v: Visit) => (typeof v.week === "number" ? `wk ${v.week}` : "wk unknown");

/**
 * How hard each visit is for each patient. Each cell shows a number and the main
 * barrier's icon, so color is never the only signal. Callers must not render this
 * when visits cannot be told apart.
 */
export function BarrierHeatmap({ score, limit, title, costUnknown }: { score: ScoreResult; limit?: number; title: string; costUnknown: boolean }) {
  // Keyed, not the Cell object: every toggle or assumption change rebuilds the matrix.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const rows = limit ? score.patients.slice(0, limit) : score.patients;
  const visits = score.scoredVisits;
  const cells = new Map(score.matrix.map((c) => [`${c.patientId}|${c.visitId}`, c]));
  const focus = focusKey ? cells.get(focusKey) ?? null : null;

  return (
    <Card
      title={title}
      subtitle={`How hard each visit is (0 to 1) for ${limit ? `the ${rows.length} patients who need the most support` : `all ${rows.length} patients`}. The icon is the main barrier at that visit.`}
    >
      <div className={`overflow-auto ${limit ? "" : "max-h-[36rem]"}`}>
        <table className="border-separate border-spacing-1">
          <caption className="sr-only">How hard each visit is, per patient</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 top-0 z-20 bg-surface pr-2 text-left text-sm font-medium text-muted">Patient</th>
              {visits.map((v) => (
                <th key={v.id} scope="col" className="sticky top-0 z-10 min-w-16 bg-surface px-1 text-center text-xs font-medium">
                  <span className="block max-w-24 truncate" title={v.label}>{v.label}</span>
                  <span className="block font-normal text-muted">
                    {weekText(v)}
                    {v.fasting === true && ", fasting"}
                    {v.timeOfDay === "morning" && ", AM"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.patientId}>
                <th scope="row" className="sticky left-0 z-10 bg-surface pr-2 text-left text-sm font-medium">
                  <span className="block font-mono">{p.patientId}</span>
                  {limit && <SyntheticTag />}
                </th>
                {visits.map((v) => {
                  const key = `${p.patientId}|${v.id}`;
                  const c = cells.get(key);
                  if (!c) return <td key={v.id} />;
                  const lv = LEVELS[levelOf(c.friction)];
                  return (
                    <td key={v.id} className="p-0">
                      <button
                        type="button"
                        onClick={() => setFocusKey(key)}
                        onFocus={() => setFocusKey(key)}
                        onMouseEnter={() => setFocusKey(key)}
                        aria-label={`${p.patientId}, ${v.label}: ${lv.word}, ${c.friction.toFixed(2)}${c.dominant ? `, mainly ${BARRIER_LABELS[c.dominant].label}` : ""}`}
                        className={`flex h-12 w-full min-w-16 flex-col items-center justify-center rounded-md border text-xs font-semibold ${lv.cls} ${focusKey === key ? "ring-2 ring-ink" : ""}`}
                      >
                        {c.dominant ? <BarrierIcon barrier={c.dominant} /> : <span aria-hidden>–</span>}
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
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <span key={l} className="flex items-center gap-2">
            <span aria-hidden className={`h-5 w-5 rounded border ${LEVELS[l].cls}`} />
            {LEVELS[l].word} ({LEVELS[l].range})
          </span>
        ))}
        <span className="flex flex-wrap gap-3 text-muted">
          {Object.entries(BARRIER_LABELS).map(([k, b]) => (
            <span key={k}>
              <BarrierIcon barrier={k as keyof typeof BARRIER_LABELS} className="mr-1" />
              {b.label}
            </span>
          ))}
        </span>
      </div>

      <div className="mt-3 min-h-14 rounded-lg bg-bg p-3" aria-live="polite">
        {focus ? (
          <>
            <b className="font-mono">{focus.patientId}</b>, {visits.find((v) => v.id === focus.visitId)?.label}: {focus.friction.toFixed(2)}
            {focus.terms.length === 0 ? (
              <span className="text-muted"> (no barriers found)</span>
            ) : (
              <ul className="mt-1 text-sm">
                {focus.terms
                  .slice()
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((t) => (
                    <li key={t.key}>
                      <BarrierIcon barrier={t.key} className="mr-1.5 text-muted" />
                      {BARRIER_LABELS[t.key].label}: {t.reason} <span className="text-muted">(+{t.contribution.toFixed(3)})</span>
                      {t.key === "cost" && costUnknown && <span className="block text-warn">{COST_UNKNOWN_CAVEAT}</span>}
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
