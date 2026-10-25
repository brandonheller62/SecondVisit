import { fmtMoney, fmtPct } from "@/lib/format";
import type { Trial } from "@/lib/types";
import { Badge } from "@/components/shell/ui";

/** Cheapest, highest-yield checks first: rank by share ruled out per dollar. */
export function PrescreenTable({ trial }: { trial: Trial }) {
  const rows = [...trial.rules].sort(
    (a, b) => b.shareIneligibleRuledOut / b.costPerCheck - a.shareIneligibleRuledOut / a.costPerCheck,
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead className="border-b border-line text-sm text-muted">
          <tr>
            <th scope="col" className="py-2 pr-3">#</th>
            <th scope="col" className="py-2 pr-3">Check</th>
            <th scope="col" className="py-2 pr-3">How</th>
            <th scope="col" className="py-2 pr-3 text-right">Cost / check</th>
            <th scope="col" className="py-2 pr-3 text-right">Ineligible ruled out</th>
            <th scope="col" className="py-2 text-right">Uncertain (missing data)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-line/60">
              <td className="py-3 pr-3 font-mono text-muted">{i + 1}</td>
              <td className="py-3 pr-3">
                <div className="font-medium">{r.criterion}</div>
                <Badge tone={r.kind === "inclusion" ? "info" : "warn"}>{r.kind}</Badge>
              </td>
              <td className="py-3 pr-3 text-muted">{r.check}</td>
              <td className="py-3 pr-3 text-right tabular-nums">{fmtMoney(r.costPerCheck)}</td>
              <td className="py-3 pr-3 text-right tabular-nums">{fmtPct(r.shareIneligibleRuledOut)}</td>
              <td className={`py-3 text-right tabular-nums ${r.uncertainShare >= 0.3 ? "text-warn" : ""}`}>
                {r.uncertainShare >= 0.3 && <span aria-hidden>▲ </span>}
                {fmtPct(r.uncertainShare)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-muted">
        Uncertain people are never ruled out by missing data; they go to a human check.
      </p>
    </div>
  );
}
