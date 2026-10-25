"use client";

export type Tab = "start" | "run" | "results" | "drafts";

const tabs: { id: Tab; label: string }[] = [
  { id: "start", label: "1. Start" },
  { id: "run", label: "2. Agent run" },
  { id: "results", label: "3. Results" },
  { id: "drafts", label: "4. Drafts" },
];

export function TopNav({ tab, onTab, enabled, subtitle }: {
  tab: Tab;
  onTab: (t: Tab) => void;
  enabled: Record<Tab, boolean>;
  subtitle?: string;
}) {
  return (
    <nav aria-label="Main" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="mr-auto flex min-w-0 items-baseline gap-3">
          <span className="text-2xl font-bold tracking-tight">
            Trial <span className="text-accent">Mirror</span>
          </span>
          {subtitle && <span className="hidden truncate text-sm text-muted md:inline">{subtitle}</span>}
        </div>
        <ul className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!enabled[t.id]}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onTab(t.id)}
                  className={`rounded-lg px-3 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active ? "bg-accent text-accent-ink" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
