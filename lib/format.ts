// Display helpers shared by every screen.

/** Groups smaller than this are never shown (small-cell suppression). */
export const MIN_REPORTABLE = 10;

export const isReportable = (n: number) => n >= MIN_REPORTABLE;

export const TOO_SMALL = "Too small to report";

export const fmtCount = (n: number) => (isReportable(n) ? n.toLocaleString("en-US") : TOO_SMALL);

export const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 10 ? 2 : 0 });

export type FrictionLevel = "low" | "medium" | "barrier";

export function frictionLevel(f: number, threshold: number): FrictionLevel {
  if (f >= threshold) return "barrier";
  if (f >= 0.4) return "medium";
  return "low";
}

/** Icon + word so color is never the only signal. */
export const frictionLabel: Record<FrictionLevel, { icon: string; word: string }> = {
  low: { icon: "✓", word: "Low" },
  medium: { icon: "▲", word: "Some" },
  barrier: { icon: "✕", word: "Barrier" },
};
