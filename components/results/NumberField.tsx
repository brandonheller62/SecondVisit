"use client";

import { useId } from "react";
import { AssumptionTag } from "@/components/shell/ui";

/** Labeled number input that never emits NaN. */
export function NumberField({ label, value, onChange, step = 1, min = 0, max, prefix, suffix, hint, assumption = false }: {
  label: string;
  /** Show the "assumption" tag: the number has no source in the repo. */
  assumption?: boolean;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {assumption && <AssumptionTag />}
      </label>
      <div className="mt-1 flex items-center gap-2">
        {prefix && <span className="text-muted">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n)) onChange(Math.max(min, max === undefined ? n : Math.min(max, n)));
          }}
          className="w-28 rounded-md border border-border bg-bg px-3 py-2 tabular-nums"
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {suffix && <span className="text-muted">{suffix}</span>}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
