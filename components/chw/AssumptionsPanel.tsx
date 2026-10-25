"use client";

import type { Assumptions, FrictionCategory, LanguageGroup } from "@/lib/types";
import { Badge, Button } from "@/components/shell/ui";

const weightLabels: Record<FrictionCategory, string> = {
  schedule: "Schedule conflicts",
  transport: "Transportation",
  fasting: "Fasting",
  childcare: "Childcare",
  cost: "Lost income / cost",
  language: "Language access",
  closure: "Storm closure",
};

function Slider({ label, value, min, max, step, onChange, fmt = (v: number) => v.toFixed(2) }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function AssumptionsPanel({ value, defaults, onChange }: {
  value: Assumptions;
  defaults: Assumptions;
  onChange: (a: Assumptions) => void;
}) {
  return (
    <details className="rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-5">
        <span className="text-xl font-semibold">Assumptions</span>
        <Badge tone="info">Adjustable scenarios, never predictions</Badge>
        <span className="text-sm text-muted">Click to adjust friction weights and probabilities</span>
      </summary>
      <div className="grid gap-8 border-t border-line p-5 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="font-semibold">Friction weights (×)</h3>
          {(Object.keys(weightLabels) as FrictionCategory[]).map((k) => (
            <Slider
              key={k}
              label={weightLabels[k]}
              value={value.weights[k]}
              min={0}
              max={2}
              step={0.1}
              fmt={(v) => `×${v.toFixed(1)}`}
              onChange={(v) => onChange({ ...value, weights: { ...value.weights, [k]: v } })}
            />
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Dropout</h3>
          <Slider label="Barrier threshold (friction)" value={value.dropoutThreshold} min={0.5} max={0.95} step={0.05} onChange={(v) => onChange({ ...value, dropoutThreshold: v })} />
          <Slider label="Chance of leaving at a barrier" value={value.dropProbAtBarrier} min={0.1} max={1} step={0.05} fmt={pct} onChange={(v) => onChange({ ...value, dropProbAtBarrier: v })} />
          <Slider label="Chance of leaving at any visit" value={value.baselineDropProb} min={0} max={0.1} step={0.01} fmt={pct} onChange={(v) => onChange({ ...value, baselineDropProb: v })} />
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Outreach reaches an eligible person</h3>
          {(Object.keys(value.reachProbability) as LanguageGroup[]).map((g) => (
            <Slider
              key={g}
              label={g}
              value={value.reachProbability[g]}
              min={0.1}
              max={1}
              step={0.05}
              fmt={pct}
              onChange={(v) => onChange({ ...value, reachProbability: { ...value.reachProbability, [g]: v } })}
            />
          ))}
          <Button className="mt-4" onClick={() => onChange(structuredClone(defaults))}>Reset to defaults</Button>
        </div>
      </div>
    </details>
  );
}
