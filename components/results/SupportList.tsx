"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Fragment, useState } from "react";
import { BARRIER_LABELS, SUPPORT_LABELS } from "@/lib/assumptions";
import { fmtCents, fmtMoney } from "@/lib/format";
import type { PatientBarrier, PatientScore, SupportKey, Tier } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Card, Chip } from "@/components/shell/ui";

const FILTERS: (Tier | "All")[] = ["All", "High", "Medium", "Low"];
const TOP = 10;
const MAX_BARRIERS = 2;

/** Color plus the word, so need never relies on color alone. */
const tierDot: Record<Tier, string> = { High: "bg-bad", Medium: "bg-warn", Low: "bg-muted" };

/** A short version of a barrier's reason for the collapsed row, e.g. "91-minute bus trip each way". */
function shortReason(reason: string): string {
  return reason
    .split(" (")[0]
    .replace(/\/Metrorail/g, "")
    .replace(/ with no time off allowed$/, "")
    .replace(/ and no childcare$/, "");
}

/** The visit most barriers happen at, so rows only name the visit when it differs. */
function commonVisit(patients: PatientScore[]): string | null {
  const counts = new Map<string, number>();
  let total = 0;
  for (const p of patients) {
    for (const b of p.topBarriers) {
      counts.set(b.visitLabel, (counts.get(b.visitLabel) ?? 0) + 1);
      total++;
    }
  }
  const [label, n] = [...counts.entries()].sort((x, y) => y[1] - x[1])[0] ?? [null, 0];
  return label && n / Math.max(total, 1) > 0.5 ? label : null;
}

/** Supports recommended for more than half of the listed patients: said once above the table. */
function commonSupports(patients: PatientScore[]): SupportKey[] {
  const counts = new Map<SupportKey, number>();
  for (const p of patients) for (const s of p.recommendedSupports) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n > patients.length / 2).map(([s]) => s);
}

const supportList = (keys: SupportKey[]) => {
  const names = keys.map((k) => SUPPORT_LABELS[k].label.toLowerCase());
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

function BarrierLine({ b, visit, full }: { b: PatientBarrier; visit: string | null; full?: boolean }) {
  return (
    <>
      <span className="font-medium">{BARRIER_LABELS[b.key].label}</span>
      {b.visitLabel !== visit && <span className="text-muted"> at {b.visitLabel}</span>}
      <span className="text-muted">: {full ? b.reason : shortReason(b.reason)}</span>
      {full && <span className="text-muted"> (+{b.points})</span>}
    </>
  );
}

/** Everything the collapsed row leaves out: all barriers, the cost breakdown and the full support list. */
function Details({ p, visit, visits }: { p: PatientScore; visit: string | null; visits: number }) {
  const c = p.visitCostBreakdown;
  const parts = [
    { label: "Travel", amount: c.travel },
    { label: "Lost pay", amount: c.lostWages },
    { label: "Uninsured costs", amount: c.outOfPocket },
    { label: "Trial pays back", amount: -c.compensation },
  ].filter((r) => r.amount !== 0);
  return (
    <div className="grid gap-6 py-3 pl-8 md:grid-cols-3">
      <div>
        <h3 className="text-sm font-medium text-muted">Barriers and points ({p.points} of {p.maxPoints})</h3>
        <ul className="mt-1 space-y-1">
          {p.topBarriers.length === 0 && <li className="text-muted">None found</li>}
          {p.topBarriers.map((b) => (
            <li key={b.key}><BarrierLine b={b} visit={visit} full /></li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted">What visits cost them</h3>
        {parts.length === 0 || p.costPerVisit === 0 ? (
          <p className="mt-1 text-muted">No out-of-pocket cost</p>
        ) : (
          <dl className="mt-1 grid max-w-60 grid-cols-[1fr_auto] gap-x-4">
            {parts.map((r) => (
              <Fragment key={r.label}>
                <dt className="text-muted">{r.label}</dt>
                <dd className="text-right">{fmtCents(r.amount)}</dd>
              </Fragment>
            ))}
            <dt className="mt-1 border-t border-border pt-1 font-medium">Per visit</dt>
            <dd className="mt-1 border-t border-border pt-1 text-right font-medium">{fmtCents(p.costPerVisit)}</dd>
            <dt className="text-muted">All {visits} visits</dt>
            <dd className="text-right text-muted">{fmtCents(p.totalCost)}</dd>
          </dl>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted">Recommended supports</h3>
        <p className="mt-1">{p.recommendedSupports.length ? supportList(p.recommendedSupports) : "Standard reminders"}</p>
      </div>
    </div>
  );
}

/** Ranked by need for support. The order decides who is offered help first, never who is excluded. */
export function SupportList({ patients, visitCount }: { patients: PatientScore[]; visitCount: number }) {
  const [filter, setFilter] = useState<Tier | "All">("All");
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const rows = filter === "All" ? patients : patients.filter((p) => p.tier === filter);
  const counts = { All: patients.length, High: 0, Medium: 0, Low: 0 } as Record<Tier | "All", number>;
  for (const p of patients) counts[p.tier]++;
  const rank = new Map(patients.map((p, i) => [p.patientId, i + 1]));
  const visible = showAll ? rows : rows.slice(0, TOP);
  // Worked out from the rows on screen, so "most people listed" means the people you can see.
  const visit = commonVisit(visible);
  const common = commonSupports(visible);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card
      title={<span className="text-text">Ranked support list</span>}
      actions={
        <div role="group" aria-label="Filter by support need" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Chip
              key={f}
              pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setShowAll(false);
              }}
            >
              {f} ({counts[f]})
            </Chip>
          ))}
        </div>
      }
    >
      <div className="mb-3 max-w-[75ch] space-y-1 text-muted">
        {common.length > 0 && <p>Recommended for most people listed: {supportList(common)}.</p>}
        {visit && <p>Barriers are at the {visit} visit unless noted.</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <caption className="sr-only">Patients ranked by need for support to stay in the trial. Select a patient for details.</caption>
          <thead className="text-sm text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3 font-medium">Rank and patient</th>
              <th scope="col" className="py-2 pr-3 font-medium">Need · score</th>
              <th scope="col" className="py-2 pr-3 font-medium">Main barriers</th>
              <th scope="col" className="py-2 text-right font-medium">Cost per visit</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const isOpen = open.has(p.patientId);
              const extra = p.recommendedSupports.filter((s) => !common.includes(s));
              const detailsId = `support-details-${p.patientId}`;
              return (
                <Fragment key={p.patientId}>
                  <tr className={`cursor-pointer align-top hover:bg-surface-2 ${isOpen ? "" : "border-b border-border"}`} onClick={() => toggle(p.patientId)}>
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={detailsId}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(p.patientId);
                        }}
                        className="flex items-center gap-2 whitespace-nowrap rounded-md text-left"
                      >
                        <CaretRight {...ico} className={`${ico.className} text-muted transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`} />
                        <span className="w-6 text-right text-muted">{rank.get(p.patientId)}</span>
                        <span className="font-mono font-medium">{p.patientId}</span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className={`h-2 w-2 rounded-full ${tierDot[p.tier]}`} />
                        {p.tier}
                      </span>
                      <span className="ml-3 text-muted">{p.points} of {p.maxPoints}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {p.topBarriers.length === 0 ? (
                        <span className="text-muted">None found</span>
                      ) : (
                        <ul>
                          {p.topBarriers.slice(0, MAX_BARRIERS).map((b) => (
                            <li key={b.key}><BarrierLine b={b} visit={visit} /></li>
                          ))}
                        </ul>
                      )}
                      {extra.length > 0 && <p className="text-sm text-muted">+ {supportList(extra)}</p>}
                    </td>
                    <td className="py-2.5 text-right" title={`Travel ${fmtCents(p.visitCostBreakdown.travel)}, lost pay ${fmtCents(p.visitCostBreakdown.lostWages)}`}>
                      {p.costPerVisit === 0 ? <span className="text-muted">None</span> : fmtMoney(Math.round(p.costPerVisit))}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr id={detailsId} className="border-b border-border bg-surface-2/50">
                      <td colSpan={4}>
                        <Details p={p} visit={visit} visits={visitCount} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        {rows.length > TOP ? (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="min-h-11 font-medium text-text underline underline-offset-4 hover:text-muted">
            {showAll ? `Show top ${TOP}` : `Show all ${rows.length}`}
          </button>
        ) : <span />}
        <p className="text-muted">The order is for offering help first. It is never used to exclude anyone.</p>
      </div>
    </Card>
  );
}
