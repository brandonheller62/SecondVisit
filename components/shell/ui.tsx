import type { ReactNode } from "react";

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
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
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
  neutral: "border-line text-muted",
  accent: "border-accent/60 text-accent",
  info: "border-info/60 text-info",
  ok: "border-ok/60 text-ok",
  warn: "border-warn/60 text-warn",
  bad: "border-bad/60 text-bad",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

/** Required on every synthetic person shown in the UI. */
export function SyntheticTag() {
  return (
    <Badge tone="info">
      <span aria-hidden>◆</span> Synthetic
    </Badge>
  );
}

/** On/off switch with a visible state word, so state never relies on color. */
export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
        checked ? "border-accent bg-accent/10" : "border-line bg-surface-2 hover:border-muted"
      }`}
    >
      <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-accent" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <span className={`text-xs font-bold uppercase ${checked ? "text-accent" : "text-muted"}`}>{checked ? "On" : "Off"}</span>
    </button>
  );
}

export function Button({ children, variant = "secondary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-ink hover:brightness-110"
      : "border border-line bg-surface-2 text-ink hover:border-muted";
  return (
    <button
      type="button"
      className={`rounded-lg px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
