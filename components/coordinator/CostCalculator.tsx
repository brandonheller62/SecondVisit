"use client";

import { useState } from "react";
import { fmtMoney } from "@/lib/format";
import { Badge, Card } from "@/components/shell/ui";

const fields = [
  { key: "visits", label: "Screening visits / year", step: 10, min: 0 },
  { key: "costPerVisit", label: "Cost per screening visit ($)", step: 25, min: 0 },
  { key: "shareAvoided", label: "Share of visits avoided (%)", step: 1, min: 0, max: 100 },
  { key: "retained", label: "Dropouts retained / year", step: 1, min: 0 },
  { key: "recruitCost", label: "Cost to recruit one participant ($)", step: 250, min: 0 },
] as const;

type Inputs = Record<(typeof fields)[number]["key"], number>;

export function CostCalculator() {
  const [v, setV] = useState<Inputs>({ visits: 400, costPerVisit: 650, shareAvoided: 35, retained: 12, recruitCost: 8500 });
  const screening = v.visits * v.costPerVisit * (v.shareAvoided / 100);
  const retention = v.retained * v.recruitCost;
  const total = screening + retention;

  return (
    <Card
      title="What could this save?"
      subtitle="Edit any input. Numbers update live."
      actions={<Badge tone="warn">Scenario, not a result</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-sm text-muted">{f.label}</span>
              <input
                type="number"
                inputMode="decimal"
                min={f.min}
                max={"max" in f ? f.max : undefined}
                step={f.step}
                value={v[f.key]}
                onChange={(e) => setV({ ...v, [f.key]: Math.max(0, Number(e.target.value) || 0) })}
                className="rounded-lg border border-line bg-bg px-3 py-2 text-lg tabular-nums"
              />
            </label>
          ))}
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <div className="text-sm text-muted">Estimated savings per year</div>
          <div className="text-5xl font-bold tabular-nums text-accent" aria-live="polite">{fmtMoney(total)}</div>
          <div className="mt-4 space-y-2 font-mono text-sm leading-relaxed">
            <p>
              <span className="text-muted">screening =</span> {v.visits} × {fmtMoney(v.costPerVisit)} × {v.shareAvoided}% ={" "}
              <b>{fmtMoney(screening)}</b>
            </p>
            <p>
              <span className="text-muted">retention =</span> {v.retained} × {fmtMoney(v.recruitCost)} = <b>{fmtMoney(retention)}</b>
            </p>
            <p className="border-t border-line pt-2">
              <span className="text-muted">savings =</span> screening + retention = <b>{fmtMoney(total)}</b>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
