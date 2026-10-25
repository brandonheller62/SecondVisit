"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { getFalseExclusionCurve } from "@/lib/api";
import { fmtPct } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { Card } from "@/components/shell/ui";

export function FalseExclusionCard({ trialId }: { trialId: string }) {
  const curve = useApi(() => getFalseExclusionCurve(trialId), [trialId]);
  const [missing, setMissing] = useState(20);
  if (!curve?.length) return null;

  // Linear interpolation between the 5% steps of the mock curve.
  const i = Math.min(curve.length - 2, Math.floor(missing / 5));
  const t = (missing - curve[i].missingPct) / 5;
  const lerp = (k: "falseExclusionRate" | "uncertainRate") => curve[i][k] + t * (curve[i + 1][k] - curve[i][k]);
  const fer = lerp("falseExclusionRate");
  const uncertain = lerp("uncertainRate");

  return (
    <Card title="Fidelity: false exclusions" subtitle="How often the rules wrongly rule someone out as records get less complete.">
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div>
          <div className="text-5xl font-bold tabular-nums text-accent">{fmtPct(fer, 1)}</div>
          <div className="mt-1 text-muted">false-exclusion rate</div>
          <div className="mt-4 text-2xl font-semibold tabular-nums">{fmtPct(uncertain)}</div>
          <div className="text-muted">sent to human check (uncertain)</div>
        </div>
        <div className="h-44" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2c3a4c" vertical={false} />
              <XAxis dataKey="missingPct" tickFormatter={(v) => `${v}%`} tick={{ fill: "#b3c0cf", fontSize: 13 }} />
              <YAxis tickFormatter={(v) => fmtPct(v)} tick={{ fill: "#b3c0cf", fontSize: 13 }} width={44} />
              <Line type="monotone" dataKey="falseExclusionRate" stroke="#5eead4" strokeWidth={3} dot={false} isAnimationActive={false} />
              <ReferenceDot x={Math.round(missing / 5) * 5} y={curve[Math.round(missing / 5)].falseExclusionRate} r={7} fill="#5eead4" stroke="#0a0e13" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <label className="mt-4 block">
        <span className="flex justify-between text-sm">
          <span>% of fields missing</span>
          <span className="font-semibold tabular-nums">{missing}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={60}
          step={1}
          value={missing}
          onChange={(e) => setMissing(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </label>
      <p className="mt-2 text-sm text-muted">Mock curve. Scenario, not a measured result.</p>
    </Card>
  );
}
