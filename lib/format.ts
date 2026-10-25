// Display helpers shared by every screen.

import type { Tier } from "./types";

export const TOO_SMALL = "Too small to report";

export const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

/** Dollars and cents, for small amounts that have to add up exactly on screen. */
export const fmtCents = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 10 ? 2 : 0 });

/** Tier badge tone. The icon (components/shell/icons.tsx) and word carry the tier too, so color is never alone. */
export const tierStyle: Record<Tier, { tone: "bad" | "warn" | "ok" }> = {
  High: { tone: "bad" },
  Medium: { tone: "warn" },
  Low: { tone: "ok" },
};
