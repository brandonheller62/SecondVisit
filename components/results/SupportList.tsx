"use client";

import { useState } from "react";
import { BARRIER_LABELS, SUPPORT_LABELS } from "@/lib/assumptions";
import { fmtMoney, fmtPct, tierStyle } from "@/lib/format";
import type { PatientScore, Tier } from "@/lib/types";
import { Badge, Button, Card, Chip, SyntheticTag } from "@/components/shell/ui";

const FILTERS: (Tier | "All")[] = ["All", "High", "Medium", "Low"];
const PAGE = 15;

/** Ranked by need for support. The order decides who is offered help first, never who is excluded. */
export function SupportList({ patients }: { patients: PatientScore[] }) {
  const [filter, setFilter] = useState<Tier | "All">("All");
  const [shown, setShown] = useState(PAGE);
  const rows = filter === "All" ? patients : patients.filter((p) => p.tier === filter);
  const counts = { All: patients.length, High: 0, Medium: 0, Low: 0 } as Record<Tier | "All", number>;
  for (const p of patients) counts[p.tier]++;
  const rank = new Map(patients.map((p, i) => [p.patientId, i + 1]));

  return (
    <Card
      title="Ranked support list"
      subtitle="Who to offer support first. This order is never used to exclude, deprioritize or reject anyone."
      actions={
        <div role="group" aria-label="Filter by tier" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Chip
              key={f}
              pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setShown(PAGE);
              }}
            >
              {f} ({counts[f]})
            </Chip>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <caption className="sr-only">Patients ranked by need for support to stay in the trial</caption>
          <thead className="text-sm text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-medium">#</th>
              <th scope="col" className="py-2 pr-3 font-medium">Patient</th>
              <th scope="col" className="py-2 pr-3 font-medium">Support need</th>
              <th scope="col" className="py-2 pr-3 font-medium">Top barriers (visit)</th>
              <th scope="col" className="py-2 font-medium">Recommended supports</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((p) => (
              <tr key={p.patientId} className="border-b border-line/60 align-top">
                <td className="py-3 pr-3 tabular-nums text-muted">{rank.get(p.patientId)}</td>
                <td className="py-3 pr-3">
                  <div className="font-mono font-semibold">{p.patientId}</div>
                  <SyntheticTag />
                </td>
                <td className="py-3 pr-3">
                  <Badge tone={tierStyle[p.tier].tone}>
                    <span aria-hidden>{tierStyle[p.tier].icon}</span> {p.tier}
                  </Badge>
                  <div className="mt-1 text-sm text-muted">
                    {fmtPct(p.risk)} risk of leaving without support
                  </div>
                  <div className="text-sm text-muted">~{fmtMoney(p.costPerVisit)} per visit</div>
                </td>
                <td className="py-3 pr-3">
                  {p.topBarriers.length === 0 ? (
                    <span className="text-muted">None found</span>
                  ) : (
                    <ul className="space-y-1">
                      {p.topBarriers.map((b) => (
                        <li key={b.key}>
                          <span aria-hidden>{BARRIER_LABELS[b.key].icon} </span>
                          <b>{BARRIER_LABELS[b.key].label}</b> <span className="text-muted">({b.visitLabel})</span>
                          <div className="text-sm text-muted">{b.reason}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.recommendedSupports.length === 0 && <span className="text-muted">Standard reminders</span>}
                    {p.recommendedSupports.map((s) => (
                      <Badge key={s} tone="accent">{SUPPORT_LABELS[s].label}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > shown && (
        <div className="mt-4">
          <Button onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, rows.length - shown)} more of {rows.length - shown}</Button>
        </div>
      )}
    </Card>
  );
}
