import type { ToolName } from "@/lib/types";

/** Raw tool input and output, shown only when "Show details" is on. */
export function ToolCallPanel({ tool, input, output }: { tool: ToolName; input: unknown; output: unknown }) {
  return (
    <div className="mt-2 text-sm">
      <code className="font-mono text-muted">{tool}</code>
      <div className="mt-1 grid gap-3 lg:grid-cols-2">
        {([["Input", input], ["Output", output]] as const).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <div className="mb-1 text-xs font-medium text-muted">{k}</div>
            <pre className="max-h-80 overflow-auto rounded-md bg-surface-2 p-3 font-mono text-xs leading-relaxed">
              {v === undefined ? "(none yet)" : JSON.stringify(v, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
