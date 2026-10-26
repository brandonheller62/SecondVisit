import type { ResultsSummary } from "@/lib/scoring/summary";
import { Card } from "@/components/shell/ui";

/** Sets each number in a sentence in the sign face, so the counts read first without leaving the sentence. */
function SignNumbers({ text }: { text: string }) {
  return text.split(/(\d[\d,.]*)/).map((part, i) =>
    i % 2 ? <span key={i} className="font-sign text-[1.35em] leading-none">{part}</span> : part,
  );
}

/**
 * Sentences built in code from the numbers (lib/scoring/summary.ts), never by the model.
 * The third sentence (the change with supports) is shown once, under the support toggles.
 */
export function SummaryCard({ summary }: { summary: ResultsSummary }) {
  const [need, barrier] = summary.sentences;
  return (
    <Card title="Summary">
      <div className="max-w-[62ch] space-y-3">
        <p className="text-2xl leading-snug"><SignNumbers text={need} /></p>
        <p className="text-lg leading-relaxed text-muted">{barrier}</p>
      </div>
    </Card>
  );
}
