import type { ToolCall } from "@/lib/types";

export function ToolCallPanel({ call }: { call: ToolCall }) {
  return (
    <details className="group mt-3 rounded-lg border border-line bg-bg">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-info">
        <span className="inline-block transition group-open:rotate-90" aria-hidden>▸</span> Tool call:{" "}
        <code className="font-mono">{call.tool}</code>
      </summary>
      <div className="grid gap-3 border-t border-line p-3 lg:grid-cols-2">
        {(["input", "output"] as const).map((k) => (
          <div key={k}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{k}</div>
            <pre className="max-h-72 overflow-auto rounded-md bg-surface-2 p-3 font-mono text-sm leading-relaxed">
              {JSON.stringify(call[k], null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </details>
  );
}
