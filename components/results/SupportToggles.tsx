"use client";

import { SUPPORT_LABELS } from "@/lib/assumptions";
import type { Scenario } from "@/lib/types";
import { SUPPORT_KEYS } from "@/lib/types";
import { Toggle } from "@/components/shell/ui";

export function SupportToggles({ scenario, onScenario, stormWeek }: { scenario: Scenario; onScenario: (s: Scenario) => void; stormWeek: number | null }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {SUPPORT_KEYS.map((k) => (
        <Toggle
          key={k}
          checked={scenario.supports[k]}
          onChange={(v) => onScenario({ ...scenario, supports: { ...scenario.supports, [k]: v } })}
          label={SUPPORT_LABELS[k].label}
        />
      ))}
      <Toggle
        checked={scenario.stormWeek}
        onChange={(v) => onScenario({ ...scenario, stormWeek: v })}
        label="⛈ Storm closure week"
        hint={stormWeek === null ? "No follow-up visit has a known week" : `Clinic closed in week ${stormWeek}`}
      />
    </div>
  );
}
