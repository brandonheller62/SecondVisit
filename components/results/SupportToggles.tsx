"use client";

import { SUPPORT_LABELS } from "@/lib/assumptions";
import type { Scenario, SupportKey } from "@/lib/types";
import { SUPPORT_KEYS } from "@/lib/types";
import { Toggle } from "@/components/shell/ui";

export function SupportToggles({ scenario, onToggle }: { scenario: Scenario; onToggle: (key: SupportKey, on: boolean) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {SUPPORT_KEYS.map((k) => (
        <Toggle
          key={k}
          checked={scenario.supports[k]}
          onChange={(v) => onToggle(k, v)}
          label={SUPPORT_LABELS[k].label}
        />
      ))}
    </div>
  );
}
