import { Flask, Info } from "@phosphor-icons/react/dist/ssr";
import { useId, useSyncExternalStore, type ReactNode } from "react";
import { ico } from "./icons";

// Radius rule: controls and inputs rounded-md (6px), selectable options rounded-lg (8px), badges and switches pill.
// Sections are separated by spacing and a thin top divider, never a box, so nothing nests card-in-card.

const TOKENS = ["primary", "baseline", "text", "muted", "border", "surface", "surface-2"] as const;
type Token = (typeof TOKENS)[number];
let tokenCache: Record<Token, string> | null = null;

function readTokens(): Record<Token, string> {
  if (!tokenCache) {
    const css = getComputedStyle(document.documentElement);
    tokenCache = Object.fromEntries(TOKENS.map((t) => [t, css.getPropertyValue(`--color-${t}`).trim()])) as Record<Token, string>;
  }
  return tokenCache;
}

const noTokens = Object.fromEntries(TOKENS.map((t) => [t, "currentColor"])) as Record<Token, string>;

/** Theme colors for chart libraries that need literal values instead of classes. */
export function useThemeColors(): Record<Token, string> {
  return useSyncExternalStore(() => () => {}, readTokens, () => noTokens);
}

// Small shared building blocks. Keep these dumb; feature logic lives in the
// coordinator/chw/agent folders.

export function Card({ title, subtitle, children, className = "", actions }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`border-t border-border pt-6 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

const badgeTones = {
  neutral: "border-border text-muted",
  primary: "border-text/40 text-text",
  info: "border-border text-muted",
  ok: "border-ok/60 text-ok",
  warn: "border-warn/60 text-warn",
  bad: "border-bad/60 text-bad",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

/** Required on every synthetic person shown in the UI. */
export function SyntheticTag() {
  return (
    <Badge tone="info">
      <Flask {...ico} /> Synthetic
    </Badge>
  );
}

/** Small info icon that reveals detail on hover, focus or tap, for fine print that would otherwise be a paragraph. */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={label} aria-describedby={id} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:text-text">
        <Info {...ico} />
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-72 -translate-x-1/2 rounded-md border border-border bg-surface p-3 text-sm font-normal text-text opacity-0 shadow-md transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

/** On/off switch. State shows in the knob position and track fill, and aria-checked for screen readers. */
export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
        checked ? "border-text/50" : "border-border hover:border-muted"
      }`}
    >
      <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-text" : "bg-border"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm ring-1 ring-border transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </button>
  );
}

/** Small pressed/unpressed filter button. 44px tall so it works as a touch target. */
export function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-md border px-3 text-sm font-medium transition active:scale-[0.98] ${
        pressed ? "border-text bg-text text-surface" : "border-border hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function Button({ children, variant = "secondary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-on-primary enabled:hover:bg-primary-hover enabled:active:bg-primary-hover"
      : "border border-border bg-surface text-text hover:border-muted";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
