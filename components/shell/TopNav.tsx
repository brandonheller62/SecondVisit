"use client";

export type Tab = "start" | "run" | "results";

const tabs: { id: Tab; label: string; short: string }[] = [
  { id: "start", label: "1. Start", short: "Start" },
  { id: "run", label: "2. Agent run", short: "Run" },
  { id: "results", label: "3. Results", short: "Results" },
];

/** The blue canopy: the sign wordmark on the left, the three steps as pills on the right. */
export function TopNav({ tab, onTab, enabled, subtitle }: {
  tab: Tab;
  onTab: (t: Tab) => void;
  enabled: Record<Tab, boolean>;
  subtitle?: string;
}) {
  return (
    <nav aria-label="Main" className="bg-primary text-on-primary">
      {/* One row at every width: the brand never wraps and the trial title truncates, so the sticky header stays short. */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-2 sm:px-8 sm:gap-6">
        <div className="flex shrink-0 items-baseline gap-4 lg:min-w-0 lg:flex-1 lg:shrink">
          <span className="font-sign shrink-0 whitespace-nowrap text-base uppercase [font-stretch:115%] sm:text-xl">
            Second <span className="text-sky">Visit</span>
          </span>
          {subtitle && (
            <span className="hidden min-w-0 truncate text-sm text-canopy-muted md:block" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
        <ul className="ml-auto flex min-w-0 gap-1 overflow-x-auto lg:shrink-0">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!enabled[t.id]}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onTab(t.id)}
                  className={`min-h-11 min-w-11 whitespace-nowrap rounded-full px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-base ${
                    active ? "bg-surface text-primary" : "text-wall enabled:hover:bg-primary-hover enabled:hover:text-on-primary"
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
