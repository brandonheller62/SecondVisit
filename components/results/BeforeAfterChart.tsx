"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimulationRun } from "@/lib/scoring/simulate";
import type { Tier } from "@/lib/types";
import { Card, useThemeColors } from "@/components/shell/ui";

const TIERS: Tier[] = ["High", "Medium", "Low"];

/** How many patients sit at each need level without and with the selected supports. */
export function BeforeAfterChart({ sim, children }: { sim: SimulationRun; children?: React.ReactNode }) {
  const r = sim.result;
  const c = useThemeColors();
  const data = TIERS.map((t) => ({ name: `${t} need`, before: r.tiersBefore[t], after: r.tiersAfter[t] }));
  const n = sim.before.patients.length;
  const people = (k: number) => `${k} patient${k === 1 ? "" : "s"}`;

  return (
    <Card title="Patients by need level">
      <dl className="mb-2 flex flex-wrap gap-x-10 gap-y-2">
        <div>
          <dt className="text-sm text-muted">High need without support</dt>
          <dd className="text-4xl font-semibold tracking-tight">{r.tiersBefore.High}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">High need with support</dt>
          <dd className="text-4xl font-semibold tracking-tight">{r.tiersAfter.High}</dd>
        </div>
      </dl>
      <p className="mb-5 text-sm text-muted">
        Of {n} patients. Average need score {r.averagePointsBefore.toFixed(1)} without support, {r.averagePointsAfter.toFixed(1)} with. Turn supports on or off below.
      </p>
      {children}
      <figure className="mt-6">
        {/* Tiny legend outside the plot, so it never collides with a bar label. */}
        <div aria-hidden className="mb-2 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-baseline" /> Without support</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> With support</span>
        </div>
        <div style={{ height: 300 }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid stroke={c["surface-2"]} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: c.muted, fontSize: 13 }} axisLine={{ stroke: c.border }} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: c.muted, fontSize: 13 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                cursor={{ fill: c["surface-2"] }}
                formatter={(v) => people(Number(v))}
                contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 6, color: c.text }}
              />
              <Bar dataKey="before" name="Without support" fill={c.baseline} radius={[2, 2, 0, 0]}>
                <LabelList dataKey="before" position="top" fill={c.muted} fontSize={12} />
              </Bar>
              <Bar dataKey="after" name="With support" fill={c.primary} radius={[2, 2, 0, 0]}>
                <LabelList dataKey="after" position="top" fill={c.text} fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>Patients at each need level without and with supports</caption>
          <thead>
            <tr><th>Need level</th><th>Without support</th><th>With support</th></tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{people(d.before)}</td><td>{people(d.after)}</td></tr>
            ))}
          </tbody>
        </table>
      </figure>
    </Card>
  );
}
