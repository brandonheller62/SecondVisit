// One icon family (Phosphor, bold weight) for the whole app. The /ssr entry
// needs no context provider, so these work in server and client components.
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";
import { ArrowCounterClockwise, Baby, Bus, CaretDoubleUp, CaretUp, Clock, CurrencyDollar, Minus, Translate } from "@phosphor-icons/react/dist/ssr";
import type { BarrierKey, Tier } from "@/lib/types";

export type { PhosphorIcon };

/** Shared size and weight; icons are decorative next to text, so hidden from screen readers. */
export const ico: IconProps = { size: "1.1em", weight: "bold", "aria-hidden": true, className: "inline-block shrink-0 align-[-0.15em]" };

export const BARRIER_ICONS: Record<BarrierKey, PhosphorIcon> = {
  scheduleClash: Clock,
  transport: Bus,
  cost: CurrencyDollar,
  childcare: Baby,
  languageAccess: Translate,
  missedPrior: ArrowCounterClockwise,
};

export const TIER_ICONS: Record<Tier, PhosphorIcon> = {
  High: CaretDoubleUp,
  Medium: CaretUp,
  Low: Minus,
};

export function BarrierIcon({ barrier, className = "" }: { barrier: BarrierKey; className?: string }) {
  const Icon = BARRIER_ICONS[barrier];
  return <Icon {...ico} className={`${ico.className} ${className}`} />;
}

export function TierIcon({ tier }: { tier: Tier }) {
  const Icon = TIER_ICONS[tier];
  return <Icon {...ico} />;
}
