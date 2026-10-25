// Display helpers shared by every screen.

import type { Tier } from "./types";

export const TOO_SMALL = "Too small to report";

export const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 10 ? 2 : 0 });

export const tierStyle: Record<Tier, { icon: string; tone: "bad" | "warn" | "ok" }> = {
  High: { icon: "▲▲", tone: "bad" },
  Medium: { icon: "▲", tone: "warn" },
  Low: { icon: "○", tone: "ok" },
};
