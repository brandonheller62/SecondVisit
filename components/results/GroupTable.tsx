"use client";

import { useState } from "react";
import { fmtPct, TOO_SMALL } from "@/lib/format";
import { MIN_GROUP_SIZE } from "@/lib/scoring/simulate";
import type { GroupBy, GroupSummary } from "@/lib/types";
import { GROUP_BYS } from "@/lib/types";
import { Card } from "@/components/shell/ui";

const LABEL: Record<GroupBy, string> = {
  preferredLanguage: "Language",
  neighborhood: "Neighborhood",
  transport: "Transport",
  insurance: "Insurance",
};

/** Group reporting only. Neighborhood and language never feed the score. */
export function GroupTable({ groups }: { groups: Record<GroupBy, GroupSummary> }) {
  const [by, setBy] = useState<GroupBy>("preferredLanguage");
  const g = groups[by];
  return (
    <Card
      title="By group"
      subtitle={`Expected completion without and with the selected supports. Groups under ${MIN_GROUP_SIZE} people are not shown.`}
      actions={
        <div role="tablist" aria-label="Group by" className="flex flex-wrap gap-1">
          {GROUP_BYS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={by === k}
              onClick={() => setBy(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${by === k ? "bg-accent text-accent-ink" : "border border-line bg-surface-2 hover:border-muted"}`}
            >
              {LABEL[k]}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto" role="tabpanel">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Completion by {LABEL[by].toLowerCase()}</caption>
          <thead className="text-sm text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-medium">{LABEL[by]}</th>
              <th scope="col" className="py-2 pr-3 font-medium">People</th>
              <th scope="col" className="py-2 pr-3 font-medium">Without supports</th>
              <th scope="col" className="py-2 pr-3 font-medium">With supports</th>
              <th scope="col" className="py-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r.group} className="border-b border-line/60">
                <th scope="row" className="py-2 pr-3 font-medium">{r.group}</th>
                {r.suppressed ? (
                  <td colSpan={4} className="py-2 italic text-muted">{TOO_SMALL}</td>
                ) : (
                  <>
                    <td className="py-2 pr-3 tabular-nums">{r.n}</td>
                    <td className="py-2 pr-3 tabular-nums">{fmtPct(r.completionBefore!)}</td>
                    <td className="py-2 pr-3 tabular-nums text-accent">{fmtPct(r.completionAfter!)}</td>
                    <td className="py-2 tabular-nums">+{Math.round((r.completionAfter! - r.completionBefore!) * 100)} pts</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
