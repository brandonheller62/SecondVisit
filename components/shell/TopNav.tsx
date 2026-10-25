"use client";

export type Tab = "start" | "run" | "results";

const tabs: { id: Tab; label: string; short: string }[] = [
  { id: "start", label: "1. Start", short: "Start" },
  { id: "run", label: "2. Agent run", short: "Run" },
  { id: "results", label: "3. Results", short: "Results" },
];

export function TopNav({ tab, onTab, enabled, subtitle }: {
  tab: Tab;
  onTab: (t: Tab) => void;
  enabled: Record<Tab, boolean>;
  subtitle?: string;
}) {
  return (
    <nav aria-label="Main" className="border-b border-line bg-surface">
      {/* One row at every width: the brand never wraps and the trial title truncates, so the sticky header stays short. */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 sm:gap-6 sm:py-2">
        <div className="flex shrink-0 items-baseline gap-3 lg:min-w-0 lg:flex-1 lg:shrink">
          <span className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight sm:text-2xl">
            Trial <span className="text-accent">Mirror</span>
          </span>
          {subtitle && (
            <span className="hidden min-w-0 truncate text-sm text-muted lg:block" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
        <ul className="ml-auto flex min-w-0 overflow-x-auto sm:gap-1 lg:shrink-0">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!enabled[t.id]}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onTab(t.id)}
                  className={`min-h-11 min-w-11 whitespace-nowrap rounded-lg px-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-base ${
                    active ? "bg-accent text-accent-ink" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
