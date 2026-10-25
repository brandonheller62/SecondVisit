import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { ToolName } from "@/lib/types";
import { ico } from "@/components/shell/icons";

/** Expandable view of exactly what went into and came out of a tool call. */
export function ToolCallPanel({ tool, input, output }: { tool: ToolName; input: unknown; output: unknown }) {
  return (
    <details className="group mt-3 rounded-lg border border-line bg-bg">
      <summary className="cursor-pointer list-none select-none px-3 py-2 [&::-webkit-details-marker]:hidden text-sm font-medium text-info">
        <span className="inline-flex transition-transform duration-150 group-open:rotate-90"><CaretRight {...ico} /></span> Tool input / output:{" "}
        <code className="font-mono">{tool}</code>
      </summary>
      <div className="grid gap-3 border-t border-line p-3 lg:grid-cols-2">
        {([["input", input], ["output", output]] as const).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{k}</div>
            <pre className="max-h-80 overflow-auto rounded-md bg-surface-2 p-3 font-mono text-sm leading-relaxed">
              {v === undefined ? "(none yet)" : JSON.stringify(v, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </details>
  );
}
