import { fmtCount, isReportable, TOO_SMALL } from "@/lib/format";
import type { FunnelResult } from "@/lib/types";

/** One card per language group; each stage shows before and after as bars. */
export function LanguageFunnel({ before, after }: { before: FunnelResult; after: FunnelResult }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {before.byLanguage.map((group, gi) => {
        const afterGroup = after.byLanguage[gi];
        const [population, ...stages] = group.stages;
        const max = Math.max(stages[0].count, afterGroup.stages[1].count);
        return (
          <div key={group.language} className="rounded-lg border border-line bg-surface-2 p-4">
            <h3 className="text-lg font-semibold">{group.language}</h3>
            <p className="mb-3 text-sm text-muted">of {fmtCount(population.count)} synthetic adults</p>
            <dl className="space-y-3">
              {stages.map((s, i) => {
                const a = afterGroup.stages[i + 1];
                return (
                  <div key={s.key}>
                    <dt className="text-sm text-muted">{s.label}</dt>
                    <dd className="mt-1 space-y-1">
                      <Row label="Before" count={s.count} max={max} color="bg-[#7d8ea3]" />
                      <Row label="After" count={a.count} max={max} color="bg-accent" />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const ok = isReportable(count);
  return (
    <div className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="h-3 overflow-hidden rounded bg-bg">
        {ok && <span className={`block h-full rounded ${color} transition-[width] duration-500`} style={{ width: `${(count / max) * 100}%` }} />}
      </span>
      <span className={`whitespace-nowrap text-right tabular-nums ${ok ? "" : "text-warn"}`} title={ok ? undefined : "Groups under 10 are suppressed"}>
        {ok ? fmtCount(count) : <><span aria-hidden>⊘ </span>{TOO_SMALL}</>}
      </span>
    </div>
  );
}
