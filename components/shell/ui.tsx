import { Flask, Info } from "@phosphor-icons/react/dist/ssr";
import { useId, type ReactNode } from "react";
import { ico } from "./icons";

// Radius rule: controls and inputs rounded-md (6px), selectable options rounded-lg (8px), badges and switches pill.
// Sections are separated by spacing and a thin top divider, never a box, so nothing nests card-in-card.

// Small shared building blocks. Keep these dumb; feature logic lives in the
// coordinator/chw/agent folders.

/**
 * The pale blue wall band each screen opens on: title in the sign face, a breeze-block
 * screen on the right. Full-bleed, so it sits outside the page container.
 */
export function WallBand({ title, lede, actions, size = "md" }: {
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  size?: "lg" | "md";
}) {
  return (
    <header className="relative overflow-hidden bg-wall">
      <div aria-hidden className="breeze absolute inset-y-0 right-0 w-full opacity-60 [mask-image:linear-gradient(to_left,black_15%,transparent_75%)] md:w-[55%] md:opacity-100" />
      <div className={`relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-5 sm:px-8 ${size === "lg" ? "pb-10 pt-12 sm:pb-12 sm:pt-14" : "pb-8 pt-10"}`}>
        <div className="max-w-[46rem]">
          <h1 className={`font-sign text-balance ${size === "lg" ? "text-[clamp(2.1rem,4.6vw,3.5rem)] leading-[1.02]" : "text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.05]"}`}>
            {title}
          </h1>
          {lede && <div className={`mt-3 max-w-[60ch] ${size === "lg" ? "text-xl" : "text-lg"}`}>{lede}</div>}
        </div>
        {actions}
      </div>
    </header>
  );
}

/** Page container below a WallBand. */
export function Floor({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-5 sm:px-8 py-10 ${className}`}>{children}</div>;
}

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
            {title && <h2 className="font-sign text-xl">{title}</h2>}
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
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 ${
        checked ? "border-primary bg-surface-2" : "border-border bg-surface hover:border-muted"
      }`}
    >
      <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-border"}`}>
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
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.98] ${
        pressed ? "border-text bg-text text-surface" : "border-border bg-surface hover:border-muted"
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
      : "border border-border bg-surface text-text hover:border-text";
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 font-semibold transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
