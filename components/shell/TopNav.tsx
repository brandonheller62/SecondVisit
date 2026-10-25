"use client";

import type { Trial } from "@/lib/types";

export type Tab = "trial" | "run" | "coordinator" | "chw";

const tabs: { id: Tab; label: string }[] = [
  { id: "trial", label: "1. Pick trial" },
  { id: "run", label: "2. Agent run" },
  { id: "coordinator", label: "Coordinator" },
  { id: "chw", label: "CHW review" },
];

export function TopNav({ tab, onTab, trial }: { tab: Tab; onTab: (t: Tab) => void; trial: Trial | null }) {
  return (
    <nav aria-label="Main" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="mr-auto flex items-baseline gap-3">
          <span className="text-2xl font-bold tracking-tight">
            Trial <span className="text-accent">Mirror</span>
          </span>
          {trial && (
            <span className="hidden text-sm text-muted md:inline">
              {trial.id} · {trial.shortTitle}
            </span>
          )}
        </div>
        <ul className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const disabled = t.id !== "trial" && !trial;
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={disabled}
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
