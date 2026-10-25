import type { ResultsSummary } from "@/lib/scoring/summary";
import { Card } from "@/components/shell/ui";

/**
 * Sentences built in code from the numbers (lib/scoring/summary.ts), never by the model.
 * The third sentence (completion change) is shown once, as the headline next to the chart.
 */
export function SummaryCard({ summary }: { summary: ResultsSummary }) {
  const [need, barrier] = summary.sentences;
  return (
    <Card title="Summary">
      <div className="max-w-[75ch] space-y-2 text-lg">
        <p>{need}</p>
        <p>{barrier}</p>
      </div>
    </Card>
  );
}
