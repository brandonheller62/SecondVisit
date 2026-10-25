import type { ResultsSummary } from "@/lib/scoring/summary";
import { Card, ScenarioBadge } from "@/components/shell/ui";

/** Three sentences built in code from the numbers (lib/scoring/summary.ts), never by the model. */
export function SummaryCard({ summary }: { summary: ResultsSummary }) {
  const [need, barrier, change] = summary.sentences;
  return (
    <Card title="Summary">
      <div className="max-w-[75ch] space-y-2 text-lg">
        <p>{need}</p>
        <p>{barrier}</p>
        <p>
          {change}
          <ScenarioBadge />
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-warn">{summary.label}</p>
    </Card>
  );
}
