"use client";

import { useState } from "react";
import { TOO_SMALL } from "@/lib/format";
import { MIN_GROUP_SIZE } from "@/lib/scoring/simulate";
import type { GroupBy, GroupSummary } from "@/lib/types";
import { GROUP_BYS } from "@/lib/types";
import { Card, Chip } from "@/components/shell/ui";

const LABEL: Record<GroupBy, string> = {
  preferredLanguage: "Language",
  neighborhood: "Neighborhood",
  transport: "Transport",
  insurance: "Insurance",
};

function signedPts(delta: number) {
  const pts = Math.round(delta * 10) / 10;
  return `${pts > 0 ? "+" : pts < 0 ? "−" : "±"}${Math.abs(pts).toFixed(1)}`;
}

/** Group reporting only. Neighborhood and language never feed the score. */
export function GroupTable({ groups }: { groups: Record<GroupBy, GroupSummary> }) {
  const [by, setBy] = useState<GroupBy>("preferredLanguage");
  const g = groups[by];
  return (
    <Card
      title="By group"
      subtitle={`Average need score (points). Groups under ${MIN_GROUP_SIZE} people are hidden.`}
      actions={
        <div role="group" aria-label="Group by" className="flex flex-wrap gap-1">
          {GROUP_BYS.map((k) => (
            <Chip key={k} pressed={by === k} onClick={() => setBy(k)}>
              {LABEL[k]}
            </Chip>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Completion by {LABEL[by].toLowerCase()}</caption>
          <thead className="text-sm text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3 font-medium">{LABEL[by]}</th>
              <th scope="col" className="py-2 pr-3 font-medium">People</th>
              <th scope="col" className="py-2 pr-3 font-medium">Without support</th>
              <th scope="col" className="py-2 pr-3 font-medium">With support</th>
              <th scope="col" className="py-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r.group} className="border-b border-border/60">
                <th scope="row" className="py-2 pr-3 font-medium">{r.group}</th>
                {r.suppressed ? (
                  <td colSpan={4} className="py-2 italic text-muted">{TOO_SMALL}</td>
                ) : (
                  <>
                    <td className="py-2 pr-3 tabular-nums">{r.n}</td>
                    <td className="py-2 pr-3 tabular-nums">{r.averagePointsBefore!.toFixed(1)}</td>
                    <td className="py-2 pr-3 tabular-nums font-semibold">{r.averagePointsAfter!.toFixed(1)}</td>
                    <td className="py-2 tabular-nums">{signedPts(r.averagePointsAfter! - r.averagePointsBefore!)}</td>
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
