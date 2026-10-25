import type { BarrierResult, Persona } from "@/lib/types";
import { Badge, SyntheticTag } from "@/components/shell/ui";

export function PersonaCards({ personas, barriers, selectedId, onSelect }: {
  personas: Persona[];
  barriers: BarrierResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {personas.map((p) => {
        const drop = barriers.find((b) => b.personaId === p.id && b.dropsOut);
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(p.id)}
            className={`flex flex-col gap-2 rounded-xl border-2 bg-surface p-4 text-left transition ${
              active ? "border-accent" : "border-line hover:border-muted"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <SyntheticTag />
              <span className="font-mono text-xs text-muted">{p.person.id}</span>
            </div>
            <h3 className="text-lg font-semibold leading-snug">{p.label}</h3>
            <p className="text-sm text-muted">{p.archetype}</p>
            <p className="text-sm">
              {p.person.age} · {p.person.language} · {p.person.commute}
            </p>
            <div className="mt-auto pt-1">
              {drop ? <Badge tone="bad">✕ Drops out</Badge> : <Badge tone="ok">✓ Finishes</Badge>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
