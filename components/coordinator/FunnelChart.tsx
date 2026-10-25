"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCount, isReportable } from "@/lib/format";
import type { FunnelResult } from "@/lib/types";

const BEFORE = "#7d8ea3";
const AFTER = "#5eead4";

/** Before vs after accommodations, one pair of bars per funnel stage. */
export function FunnelChart({ before, after, afterLabel, height = 340 }: {
  before: FunnelResult;
  after: FunnelResult;
  afterLabel: string;
  height?: number;
}) {
  // Population is shown as text; as a bar it would dwarf every other stage.
  const population = before.stages[0];
  const data = before.stages.slice(1).map((s, i) => ({
    stage: s.label,
    before: isReportable(s.count) ? s.count : 0,
    after: isReportable(after.stages[i + 1].count) ? after.stages[i + 1].count : 0,
    beforeLabel: fmtCount(s.count),
    afterLabel: fmtCount(after.stages[i + 1].count),
  }));

  return (
    <figure>
      <figcaption className="mb-2 text-muted">
        Starting from <b className="text-ink">{fmtCount(population.count)}</b> {population.label.toLowerCase()}
      </figcaption>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 28, right: 8, left: 8, bottom: 0 }} barGap={6}>
            <CartesianGrid stroke="#2c3a4c" vertical={false} />
            <XAxis dataKey="stage" tick={{ fill: "#eef3f8", fontSize: 15 }} axisLine={{ stroke: "#2c3a4c" }} tickLine={false} />
            <YAxis tick={{ fill: "#b3c0cf", fontSize: 13 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#1a2330", border: "1px solid #2c3a4c", borderRadius: 8, color: "#eef3f8" }}
            />
            <Legend wrapperStyle={{ color: "#eef3f8", fontSize: 15 }} />
            <Bar dataKey="before" name="Before accommodations" fill={BEFORE} radius={[4, 4, 0, 0]} isAnimationActive>
              <LabelList dataKey="beforeLabel" position="top" fill="#eef3f8" fontSize={14} />
            </Bar>
            <Bar dataKey="after" name={afterLabel} fill={AFTER} radius={[4, 4, 0, 0]} isAnimationActive>
              <LabelList dataKey="afterLabel" position="top" fill="#eef3f8" fontSize={14} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader version of the same numbers. */}
      <table className="sr-only">
        <caption>Funnel before and after accommodations, from {fmtCount(population.count)} synthetic adults</caption>
        <thead>
          <tr><th>Stage</th><th>Before</th><th>{afterLabel}</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.stage}><td>{d.stage}</td><td>{d.beforeLabel}</td><td>{d.afterLabel}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
