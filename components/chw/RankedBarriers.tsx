import { frictionLabel, frictionLevel } from "@/lib/format";
import type { Persona, RankedBarrier, Trial } from "@/lib/types";
import { Badge, Card } from "@/components/shell/ui";

export function RankedBarriers({ ranked, personas, threshold }: { ranked: RankedBarrier[]; personas: Persona[]; threshold: number }) {
  const name = (id: string) => personas.find((p) => p.id === id)?.label ?? id;
  return (
    <Card title="Ranked barriers" subtitle="Visits ordered by how much friction they put on the practice participants.">
      {ranked.length === 0 ? (
        <p className="text-muted">No visit reaches the “some friction” level in this scenario.</p>
      ) : (
        <ol className="space-y-3">
          {ranked.map((r, i) => {
            const level = frictionLevel(r.maxFriction, threshold);
            return (
              <li key={r.id} className="rounded-lg border border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-muted">#{i + 1}</span>
                  <span className="font-semibold">{r.label}</span>
                  <Badge tone={level === "barrier" ? "bad" : "warn"}>
                    {frictionLabel[level].icon} {frictionLabel[level].word} · {r.maxFriction.toFixed(2)}
                  </Badge>
                </div>
                <p className="mt-1">{r.reason}</p>
                <p className="mt-1 text-sm text-muted">Affects: {r.personaIds.map(name).join(", ")}</p>
                {r.suggestedFix && <p className="mt-1 text-sm text-accent">Ask about: {r.suggestedFix}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function ResearchQuestions({ trial }: { trial: Trial }) {
  return (
    <Card title="Questions to ask the research team">
      <ol className="list-decimal space-y-2 pl-6">
        {trial.questionsForResearchTeam.map((q) => <li key={q}>{q}</li>)}
      </ol>
    </Card>
  );
}
