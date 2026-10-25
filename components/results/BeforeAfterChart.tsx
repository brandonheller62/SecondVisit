"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SUPPORT_LABELS } from "@/lib/assumptions";
import { fmtPct } from "@/lib/format";
import type { SimulationRun } from "@/lib/scoring/simulate";
import type { Tier } from "@/lib/types";
import { Card } from "@/components/shell/ui";

const BEFORE = "#7d8ea3";
const AFTER = "#5eead4";

/** Expected completion with and without the selected supports, overall and by baseline tier. */
export function BeforeAfterChart({ sim, children }: { sim: SimulationRun; children?: React.ReactNode }) {
  const after = new Map(sim.after.patients.map((p) => [p.patientId, p.pComplete]));
  const groups: { name: string; filter: (t: Tier) => boolean }[] = [
    { name: "All patients", filter: () => true },
    { name: "High need", filter: (t) => t === "High" },
    { name: "Medium need", filter: (t) => t === "Medium" },
    { name: "Low need", filter: (t) => t === "Low" },
  ];
  const data = groups
    .map((g) => {
      const members = sim.before.patients.filter((p) => g.filter(p.tier));
      if (!members.length) return null;
      const b = members.reduce((s, p) => s + p.pComplete, 0) / members.length;
      const a = members.reduce((s, p) => s + (after.get(p.patientId) ?? 0), 0) / members.length;
      return { name: `${g.name} (${members.length})`, before: Math.round(b * 1000) / 10, after: Math.round(a * 1000) / 10 };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);
  const r = sim.result;
  const afterLabel = r.supports.length ? "With selected supports" : "With supports (none selected)";

  return (
    <Card
      title="Completion with and without support"
      subtitle={`Expected share who finish the trial. Scenario estimate, not a prediction.${r.stormWeek ? " Storm closure week is on." : ""}`}
    >
      <div className="mb-4 flex flex-wrap gap-6">
        <div>
          <div className="text-sm text-muted">Expected to finish</div>
          <div className="text-3xl font-bold tabular-nums">
            {r.expectedCompletersBefore} <span className="text-muted">→</span> <span className="text-accent">{r.expectedCompletersAfter}</span>
          </div>
          <div className="text-sm text-muted">of {sim.before.patients.length} patients ({fmtPct(r.completionBefore)} → {fmtPct(r.completionAfter)})</div>
        </div>
        <div>
          <div className="text-sm text-muted">Supports on</div>
          <div className="text-lg">{r.supports.map((s) => SUPPORT_LABELS[s].label).join(", ") || "None"}</div>
        </div>
      </div>
      {children}
      <figure className="mt-4">
        <div style={{ height: 320 }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid stroke="#2c3a4c" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#eef3f8", fontSize: 14 }} axisLine={{ stroke: "#2c3a4c" }} tickLine={false} interval={0} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#b3c0cf", fontSize: 13 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                formatter={(v) => `${v}%`}
                contentStyle={{ background: "#1a2330", border: "1px solid #2c3a4c", borderRadius: 8, color: "#eef3f8" }}
              />
              <Legend wrapperStyle={{ color: "#eef3f8", fontSize: 15 }} />
              <Bar dataKey="before" name="Without supports" fill={BEFORE} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="before" position="top" fill="#eef3f8" fontSize={14} formatter={(v) => `${v}%`} />
              </Bar>
              <Bar dataKey="after" name={afterLabel} fill={AFTER} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="after" position="top" fill="#eef3f8" fontSize={14} formatter={(v) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>Expected completion without and with supports</caption>
          <thead>
            <tr><th>Group</th><th>Without supports</th><th>{afterLabel}</th></tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{d.before}%</td><td>{d.after}%</td></tr>
            ))}
          </tbody>
        </table>
      </figure>
    </Card>
  );
}
