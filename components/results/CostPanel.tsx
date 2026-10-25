"use client";

import { SUPPORT_LABELS, type Assumptions } from "@/lib/assumptions";
import { fmtMoney } from "@/lib/format";
import type { SimulationResult } from "@/lib/types";
import { Badge, Card } from "@/components/shell/ui";
import { NumberField } from "./NumberField";

/** Support cost vs the cost of losing participants. Scenario, not a result. */
export function CostPanel({ result, assumptions, onAssumptions }: { result: SimulationResult; assumptions: Assumptions; onAssumptions: (a: Assumptions) => void }) {
  const sc = assumptions.supportCosts;
  const setCost = (k: keyof Assumptions["supportCosts"], v: number) => onAssumptions({ ...assumptions, supportCosts: { ...sc, [k]: v } });
  const avoided = Math.max(0, result.expectedCompletersAfter - result.expectedCompletersBefore);
  const lossAvoided = avoided * assumptions.replacementCostPerParticipant;
  const net = lossAvoided - result.totalSupportCost;

  return (
    <Card title="Cost" subtitle="What the selected supports cost compared with replacing people who leave." actions={<Badge tone="warn">Scenario, not a result</Badge>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <table className="w-full text-left">
            <caption className="sr-only">Cost per support</caption>
            <thead className="text-sm text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3 font-medium">Support</th>
                <th scope="col" className="py-2 pr-3 font-medium">People helped</th>
                <th scope="col" className="py-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {result.costs.length === 0 && (
                <tr><td colSpan={3} className="py-3 text-muted">Turn on a support above to see its cost.</td></tr>
              )}
              {result.costs.map((c) => (
                <tr key={c.support} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-3 font-medium">{SUPPORT_LABELS[c.support].label}</th>
                  <td className="py-2 pr-3 tabular-nums">{c.patientsHelped}</td>
                  <td className="py-2 text-right tabular-nums">{fmtMoney(c.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-bg p-3">
              <dt className="text-sm text-muted">Total support cost</dt>
              <dd className="text-2xl font-bold tabular-nums">{fmtMoney(result.totalSupportCost)}</dd>
            </div>
            <div className="rounded-lg bg-bg p-3">
              <dt className="text-sm text-muted">Dropouts avoided</dt>
              <dd className="text-2xl font-bold tabular-nums">{avoided.toFixed(1)}</dd>
            </div>
            <div className="rounded-lg bg-bg p-3">
              <dt className="text-sm text-muted">Replacement cost avoided</dt>
              <dd className="text-2xl font-bold tabular-nums">{fmtMoney(lossAvoided)}</dd>
            </div>
            <div className="rounded-lg bg-bg p-3">
              <dt className="text-sm text-muted">Difference</dt>
              <dd className={`text-2xl font-bold tabular-nums ${net >= 0 ? "text-accent" : "text-warn"}`}>
                {net >= 0 ? "+" : "−"}
                {fmtMoney(Math.abs(net))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-4 content-start">
          <NumberField label="Replacement cost per participant" prefix="$" step={500} value={assumptions.replacementCostPerParticipant} onChange={(v) => onAssumptions({ ...assumptions, replacementCostPerParticipant: v })} hint="Placeholder. Use your site's own figure." />
          <NumberField label="Ride voucher per visit" prefix="$" value={sc.rideVoucherPerVisit} onChange={(v) => setCost("rideVoucherPerVisit", v)} />
          <NumberField label="Evening slot per visit" prefix="$" value={sc.eveningVisitPerVisit} onChange={(v) => setCost("eveningVisitPerVisit", v)} />
          <NumberField label="Childcare per visit" prefix="$" value={sc.childcarePerVisit} onChange={(v) => setCost("childcarePerVisit", v)} />
          <NumberField label="Interpreter per visit" prefix="$" value={sc.interpreterPerVisit} onChange={(v) => setCost("interpreterPerVisit", v)} />
          <NumberField label="Translation per language" prefix="$" step={100} value={sc.translationPerLanguage} onChange={(v) => setCost("translationPerLanguage", v)} />
          <NumberField label="Storm plan per person" prefix="$" value={sc.stormContingencyPerPatient} onChange={(v) => setCost("stormContingencyPerPatient", v)} />
          <NumberField label="Hourly wage (lost pay)" prefix="$" value={assumptions.unitCosts.hourlyWage} onChange={(v) => onAssumptions({ ...assumptions, unitCosts: { ...assumptions.unitCosts, hourlyWage: v } })} />
        </div>
      </div>
    </Card>
  );
}
