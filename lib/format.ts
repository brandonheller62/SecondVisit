// Display helpers shared by every screen.

import type { MaybeUnknown, Tier } from "./types";

export const TOO_SMALL = "Too small to report";

export const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 10 ? 2 : 0 });

/** "unknown" stays visible as the word unknown; never blanked or guessed. */
export function fmtMaybe<T>(v: MaybeUnknown<T>, show: (t: T) => string = String): string {
  return v === "unknown" ? "unknown" : show(v);
}

export type FrictionLevel = "none" | "low" | "some" | "high";

/** Per-visit friction bands for the heatmap. */
export function frictionLevel(f: number): FrictionLevel {
  if (f >= 0.2) return "high";
  if (f >= 0.1) return "some";
  if (f > 0) return "low";
  return "none";
}

/** Icon + word so color is never the only signal. */
export const frictionLabel: Record<FrictionLevel, { icon: string; word: string; cls: string }> = {
  none: { icon: "·", word: "None", cls: "border-line text-muted" },
  low: { icon: "✓", word: "Low", cls: "border-ok/40 bg-ok/10 text-ok" },
  some: { icon: "▲", word: "Some", cls: "border-warn/50 bg-warn/15 text-warn" },
  high: { icon: "✕", word: "High", cls: "border-bad bg-bad/25 text-bad" },
};

export const tierStyle: Record<Tier, { icon: string; tone: "bad" | "warn" | "ok" }> = {
  High: { icon: "▲▲", tone: "bad" },
  Medium: { icon: "▲", tone: "warn" },
  Low: { icon: "○", tone: "ok" },
};
