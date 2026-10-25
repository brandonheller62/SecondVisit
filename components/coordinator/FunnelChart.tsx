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
  const data = before.stages.map((s, i) => ({
    stage: s.label,
    before: isReportable(s.count) ? s.count : 0,
    after: isReportable(after.stages[i].count) ? after.stages[i].count : 0,
    beforeLabel: fmtCount(s.count),
    afterLabel: fmtCount(after.stages[i].count),
  }));

  return (
    <figure>
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
        <caption>Funnel before and after accommodations</caption>
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
