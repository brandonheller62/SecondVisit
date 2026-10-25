"use client";

import { SUPPORT_LABELS } from "@/lib/assumptions";
import type { Scenario } from "@/lib/types";
import { SUPPORT_KEYS } from "@/lib/types";
import { Toggle } from "@/components/shell/ui";

export function SupportToggles({ scenario, onScenario }: { scenario: Scenario; onScenario: (s: Scenario) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {SUPPORT_KEYS.map((k) => (
        <Toggle
          key={k}
          checked={scenario.supports[k]}
          onChange={(v) => onScenario({ ...scenario, supports: { ...scenario.supports, [k]: v } })}
          label={SUPPORT_LABELS[k].label}
        />
      ))}
    </div>
  );
}
