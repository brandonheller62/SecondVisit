"use client";

import { useState } from "react";
import { BARRIER_LABELS, SUPPORT_LABELS } from "@/lib/assumptions";
import { fmtCents, fmtPct } from "@/lib/format";
import type { PatientScore, Tier } from "@/lib/types";
import { BarrierIcon, TierIcon } from "@/components/shell/icons";
import { Badge, Button, Card, Chip } from "@/components/shell/ui";

const FILTERS: (Tier | "All")[] = ["All", "High", "Medium", "Low"];
const PAGE = 15;

/** Label/amount rows with a total line; amounts right-aligned so they scan as a column. */
function CostLines({ rows, total, fmt }: { rows: { label: string; amount: number }[]; total: { label: string; amount: number }; fmt: (n: number) => string }) {
  return (
    <dl className="grid min-w-52 grid-cols-[1fr_auto] gap-x-4 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-muted">{r.label}</dt>
          <dd className="text-right tabular-nums">{fmt(r.amount)}</dd>
        </div>
      ))}
      <div className="contents font-semibold">
        <dt className="mt-1 border-t border-border pt-1">{total.label}</dt>
        <dd className="mt-1 border-t border-border pt-1 text-right tabular-nums">{fmt(total.amount)}</dd>
      </div>
    </dl>
  );
}

/** The patient's own out-of-pocket cost: per visit by component, then across all visits. */
function PatientCost({ p, visits }: { p: PatientScore; visits: number }) {
  const b = p.visitCostBreakdown;
  const parts = [
    { label: "Travel", amount: b.travel },
    { label: "Lost pay", amount: b.lostWages },
    { label: "Uninsured costs", amount: b.outOfPocket },
    { label: "Trial pays back", amount: -b.compensation },
  ].filter((r) => r.amount !== 0);
  if (!parts.length || p.costPerVisit === 0) return <span className="text-muted">No out-of-pocket cost</span>;
  return (
    <div className="space-y-2">
      <CostLines rows={parts} total={{ label: "Per visit", amount: p.costPerVisit }} fmt={fmtCents} />
      <p className="text-sm text-muted">
        {fmtCents(p.totalCost)} across {visits} visit{visits === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Ranked by need for support. The order decides who is offered help first, never who is excluded. */
export function SupportList({ patients, visitCount }: { patients: PatientScore[]; visitCount: number }) {
  const [filter, setFilter] = useState<Tier | "All">("All");
  const [shown, setShown] = useState(PAGE);
  const rows = filter === "All" ? patients : patients.filter((p) => p.tier === filter);
  const counts = { All: patients.length, High: 0, Medium: 0, Low: 0 } as Record<Tier | "All", number>;
  for (const p of patients) counts[p.tier]++;
  const rank = new Map(patients.map((p, i) => [p.patientId, i + 1]));

  return (
    <Card
      title="Ranked support list"
      subtitle="Who to offer help first. Never used to exclude anyone."
      actions={
        <div role="group" aria-label="Filter by support need" className="flex flex-wrap gap-1">
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
        <table className="w-full min-w-[1040px] text-left">
          <caption className="sr-only">Patients ranked by need for support to stay in the trial</caption>
          <thead className="text-sm text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3 font-medium">#</th>
              <th scope="col" className="py-2 pr-3 font-medium">Patient</th>
              <th scope="col" className="py-2 pr-3 font-medium">Support need</th>
              <th scope="col" className="py-2 pr-3 font-medium">Top barriers (visit)</th>
              <th scope="col" className="py-2 pr-8 font-medium">What visits cost them</th>
              <th scope="col" className="py-2 font-medium">Recommended supports</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((p) => (
              <tr key={p.patientId} className="border-b border-border/60 align-top">
                <td className="py-3 pr-3 tabular-nums text-muted">{rank.get(p.patientId)}</td>
                <td className="py-3 pr-3">
                  <div className="whitespace-nowrap font-mono font-semibold">{p.patientId}</div>
                </td>
                <td className="py-3 pr-3">
                  <Badge>
                    <TierIcon tier={p.tier} /> {p.tier}
                  </Badge>
                  <div className="mt-1 text-sm text-muted">
                    {fmtPct(p.risk)} chance of needing help to stay
                  </div>
                </td>
                <td className="py-3 pr-3">
                  {p.topBarriers.length === 0 ? (
                    <span className="text-muted">None found</span>
                  ) : (
                    <ul className="space-y-1">
                      {p.topBarriers.map((b) => (
                        <li key={b.key}>
                          <BarrierIcon barrier={b.key} className="mr-1.5 text-muted" />
                          <b>{BARRIER_LABELS[b.key].label}</b> <span className="text-muted">({b.visitLabel})</span>
                          <div className="text-sm text-muted">{b.reason}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-3 pr-8">
                  <PatientCost p={p} visits={visitCount} />
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.recommendedSupports.length === 0 && <span className="text-muted">Standard reminders</span>}
                    {p.recommendedSupports.map((s) => (
                      <Badge key={s}>{SUPPORT_LABELS[s].label}</Badge>
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
