"use client";

import { BARRIER_LABELS, DEFAULT_ASSUMPTIONS, cloneAssumptions, type Assumptions } from "@/lib/assumptions";
import type { BarrierKey, MaybeUnknown } from "@/lib/types";
import { BARRIER_KEYS, isKnown } from "@/lib/types";
import { BarrierIcon } from "@/components/shell/icons";
import { Badge, Button, Card, Toggle } from "@/components/shell/ui";
import { NumberField } from "./NumberField";

const LANGUAGE_OPTIONS = ["English", "Spanish", "Haitian Creole", "Portuguese"];

const WEIGHT_NOTES: Record<BarrierKey, string> = {
  scheduleClash: "Morning/fasting visit after a night or irregular shift; daytime visit with no time off; visits over 3 hours",
  transport: "Bus/Metrorail only and over 40 minutes each way",
  cost: "Travel, lost pay and uninsured costs vs a household's spare budget",
  childcare: "Children under 6 and no childcare",
  languageAccess: "Trial materials not in the person's language (a gap in the trial)",
  missedPrior: "Past missed appointments. Off by default: can encode socioeconomic bias",
};

export function AssumptionsPanel({ assumptions, onAssumptions, materialsFromTrial }: {
  assumptions: Assumptions;
  onAssumptions: (a: Assumptions) => void;
  materialsFromTrial: MaybeUnknown<string[]>;
}) {
  const a = assumptions;
  const set = (patch: Partial<Assumptions>) => onAssumptions({ ...a, ...patch });
  const changed = JSON.stringify(a) !== JSON.stringify(DEFAULT_ASSUMPTIONS);

  return (
    <Card
      title="Assumptions"
      subtitle="Every number here is a guess you can change. None has been checked against real dropout data."
      actions={
        <div className="flex items-center gap-3">
          {changed && <Badge>Edited</Badge>}
          <Button disabled={!changed} onClick={() => onAssumptions(cloneAssumptions())}>Reset to defaults</Button>
        </div>
      }
    >
      <h3 className="text-lg font-semibold">Barrier weights (per visit)</h3>
      <p className="text-sm text-muted">How hard a visit is = 1 − product of (1 − weight × exposure). It adds up across visits.</p>
      <div className="mt-3 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {BARRIER_KEYS.map((k) => (
          <div key={k}>
            <label htmlFor={`w-${k}`} className="flex items-center justify-between gap-2 font-medium">
              <span>
                <BarrierIcon barrier={k} className="mr-1.5 text-muted" />
                {BARRIER_LABELS[k].label}
              </span>
              <span className="tabular-nums">{a.weights[k].toFixed(2)}</span>
            </label>
            <input
              id={`w-${k}`}
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={a.weights[k]}
              disabled={k === "missedPrior" && !a.missedPriorEnabled}
              onChange={(e) => set({ weights: { ...a.weights, [k]: Number(e.target.value) } })}
              className="mt-2 w-full disabled:opacity-40"
            />
            <p className="mt-1 text-xs text-muted">{WEIGHT_NOTES[k]}</p>
            {k === "missedPrior" && (
              <div className="mt-2">
                <Toggle checked={a.missedPriorEnabled} onChange={(v) => set({ missedPriorEnabled: v })} label="Use missed appointments" hint="Off by default" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">Support need levels</h3>
          <div className="mt-2 grid gap-3">
            <NumberField label="High when chance of needing help to stay ≥" step={0.05} max={1} value={a.tiers.high} onChange={(v) => set({ tiers: { ...a.tiers, high: Math.max(v, a.tiers.medium) } })} />
            <NumberField label="Medium when chance of needing help to stay ≥" step={0.05} max={1} value={a.tiers.medium} onChange={(v) => set({ tiers: { ...a.tiers, medium: Math.min(v, a.tiers.high) } })} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Trial materials languages</h3>
          {isKnown(materialsFromTrial) && materialsFromTrial.length ? (
            <p className="mt-2">From the trial text: <b>{materialsFromTrial.join(", ")}</b></p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">The trial text does not say (unknown). Set what the site actually offers:</p>
              <fieldset className="mt-2 space-y-2">
                <legend className="sr-only">Languages the trial offers materials in</legend>
                {LANGUAGE_OPTIONS.map((l) => (
                  <label key={l} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={a.defaultMaterialsLanguages.includes(l)}
                      onChange={(e) => set({ defaultMaterialsLanguages: e.target.checked ? [...a.defaultMaterialsLanguages, l] : a.defaultMaterialsLanguages.filter((x) => x !== l) })}
                    />
                    {l}
                  </label>
                ))}
              </fieldset>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold">Costs and unknowns</h3>
          <div className="mt-2 grid gap-3">
            <NumberField label="Spare budget per visit" prefix="$" step={10} value={a.unitCosts.discretionaryBudgetPerVisit} onChange={(v) => set({ unitCosts: { ...a.unitCosts, discretionaryBudgetPerVisit: Math.max(1, v) } })} />
            <NumberField label="Unknown visit length" suffix="min" step={15} value={a.unknowns.durationMinutes} onChange={(v) => set({ unknowns: { ...a.unknowns, durationMinutes: v } })} />
          </div>
        </div>
      </div>
    </Card>
  );
}
