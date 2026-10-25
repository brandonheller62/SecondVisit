"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtPct } from "@/lib/format";
import type { SimulationRun } from "@/lib/scoring/simulate";
import type { Tier } from "@/lib/types";
import { Card, useThemeColors } from "@/components/shell/ui";


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
      return { name: `${g.name} (${members.length})`, before: Math.round(b * 100), after: Math.round(a * 100) };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);
  const r = sim.result;
  const c = useThemeColors();
  const afterLabel = "With support";

  return (
    <Card title="Who finishes the trial">
      <dl className="mb-2 flex flex-wrap gap-x-10 gap-y-2">
        <div>
          <dt className="text-sm text-muted">Without support</dt>
          <dd className="text-4xl font-semibold tracking-tight">{fmtPct(r.completionBefore)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">With support</dt>
          <dd className="text-4xl font-semibold tracking-tight">{fmtPct(r.completionAfter)}</dd>
        </div>
      </dl>
      <p className="mb-5 text-sm text-muted">
        About {Math.round(r.expectedCompletersBefore)} of {sim.before.patients.length} patients finish without support, {Math.round(r.expectedCompletersAfter)} with. Turn supports on or off below.
      </p>
      {children}
      <figure className="mt-6">
        {/* Tiny legend outside the plot, so it never collides with a bar label. */}
        <div aria-hidden className="mb-2 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-baseline" /> Without support</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> With support</span>
        </div>
        <div style={{ height: 320 }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid stroke={c["surface-2"]} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: c.muted, fontSize: 13 }} axisLine={{ stroke: c.border }} tickLine={false} interval={0} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: c.muted, fontSize: 13 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                cursor={{ fill: c["surface-2"] }}
                formatter={(v) => `${v}%`}
                contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 6, color: c.text }}
              />
              <Bar dataKey="before" name="Without support" fill={c.baseline} radius={[2, 2, 0, 0]}>
                <LabelList dataKey="before" position="top" fill={c.muted} fontSize={12} formatter={(v) => `${v}%`} />
              </Bar>
              <Bar dataKey="after" name={afterLabel} fill={c.primary} radius={[2, 2, 0, 0]}>
                <LabelList dataKey="after" position="top" fill={c.text} fontSize={12} formatter={(v) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>Expected completion without and with supports</caption>
          <thead>
            <tr><th>Group</th><th>Without support</th><th>{afterLabel}</th></tr>
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
