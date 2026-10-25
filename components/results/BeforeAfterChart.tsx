"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SUPPORT_LABELS } from "@/lib/assumptions";
import { fmtPct } from "@/lib/format";
import type { SimulationRun } from "@/lib/scoring/simulate";
import type { Tier } from "@/lib/types";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ico } from "@/components/shell/icons";
import { Card, ScenarioBadge, useThemeColors } from "@/components/shell/ui";


/** Expected completion with and without the selected supports, overall and by baseline support need. */
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
  const c = useThemeColors();
  const afterLabel = r.supports.length ? "With selected supports" : "With supports (none selected)";

  return (
    <Card
      title={<>Completion with and without support<ScenarioBadge /></>}
      subtitle="Expected share who finish the trial under the scenario assumptions. Turn supports on or off to compare."
    >
      <div className="mb-4 flex flex-wrap gap-6">
        <div>
          <div className="text-sm text-muted">Expected to finish<ScenarioBadge /></div>
          <div className="flex items-center gap-2 text-3xl font-bold tabular-nums">
            {r.expectedCompletersBefore}
            <ArrowRight {...ico} className={`${ico.className} text-muted`} />
            <span className="sr-only">to</span>
            <span className="text-primary">{r.expectedCompletersAfter}</span>
          </div>
          <div className="text-sm text-muted">
            of {sim.before.patients.length} patients ({fmtPct(r.completionBefore)} without, {fmtPct(r.completionAfter)} with supports)
          </div>
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
              <CartesianGrid stroke={c.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: c.text, fontSize: 14 }} axisLine={{ stroke: c.border }} tickLine={false} interval={0} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: c.muted, fontSize: 13 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                cursor={{ fill: c["surface-2"] }}
                formatter={(v) => `${v}%`}
                contentStyle={{ background: c["surface-2"], border: `1px solid ${c.border}`, borderRadius: 8, color: c.text }}
              />
              <Legend wrapperStyle={{ color: c.text, fontSize: 15 }} />
              <Bar dataKey="before" name="Without supports" fill={c.baseline} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="before" position="top" fill={c.text} fontSize={14} formatter={(v) => `${v}%`} />
              </Bar>
              <Bar dataKey="after" name={afterLabel} fill={c.primary} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="after" position="top" fill={c.text} fontSize={14} formatter={(v) => `${v}%`} />
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
