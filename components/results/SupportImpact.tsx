"use client";

import { ArrowDown, ArrowUp, Minus } from "@phosphor-icons/react/dist/ssr";
import { SUPPORT_LABELS } from "@/lib/assumptions";
import type { SupportKey } from "@/lib/types";
import { ico } from "@/components/shell/icons";

/** The last support switched and how many patients it moved across the high-need line. */
export interface SupportChange {
  key: SupportKey;
  on: boolean;
  /** High-need count before the switch minus after it: positive means fewer people at high need. */
  delta: number;
  /** Bumps on every switch so the same sentence still replays. */
  n: number;
}

const people = (n: number) => `${n} patient${n === 1 ? "" : "s"}`;

function sentence(c: SupportChange): string {
  const name = SUPPORT_LABELS[c.key].label.toLowerCase();
  const moved = Math.abs(c.delta);
  if (c.delta === 0) return c.on ? `Adding ${name} doesn't move anyone out of high need on its own.` : `Removing ${name} doesn't change who is at high need.`;
  if (c.delta > 0) return `${c.on ? "Adding" : "Removing"} ${name} moves ${people(moved)} out of high need.`;
  return `${c.on ? "With" : "Without"} ${name}, ${moved} more patient${moved === 1 ? " is" : "s are"} at high need.`;
}

/**
 * Answers each support switch with what it did for the people at high need.
 * The "with" count ticks to its new value; the sentence names the support and the shift.
 */
export function SupportImpact({ before, after, change }: { before: number; after: number; change: SupportChange | null }) {
  const Icon = !change || change.delta === 0 ? Minus : change.delta > 0 ? ArrowDown : ArrowUp;
  const tone = !change || change.delta === 0 ? "text-muted" : change.delta > 0 ? "text-ok" : "text-warn";
  return (
    <div className="mt-4 space-y-1">
      <p className="text-lg">
        High need: <span className="font-semibold">{people(before)}</span> without support,{" "}
        <span className="inline-flex overflow-hidden align-bottom">
          <span key={after} className="tm-tick font-semibold">{after}</span>
        </span>{" "}
        with.
      </p>
      <p aria-live="polite" className="min-h-[1.5em]">
        {change && (
          <span key={change.n} className={`tm-fade inline-flex items-center gap-1.5 ${tone}`}>
            <Icon {...ico} /> {sentence(change)}
          </span>
        )}
      </p>
    </div>
  );
}
