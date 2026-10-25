// Display helpers shared by every screen.


export const TOO_SMALL = "Too small to report";

export const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

/** Dollars and cents, for small amounts that have to add up exactly on screen. */
export const fmtCents = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 10 ? 2 : 0 });

/**
 * Registry titles arrive in odd casing ("patiEnts", "EmpaGliflozin"). Lowercase
 * every word except true acronyms and codes (all capitals, like NASH, SGLT2,
 * NCT05232071), then capitalize the first letter.
 */
export function sentenceCase(title: string): string {
  const out = title.replace(/[A-Za-z][A-Za-z0-9]*/g, (w) => (w.length > 1 && w === w.toUpperCase() ? w : w.toLowerCase()));
  return out.charAt(0).toUpperCase() + out.slice(1);
}
