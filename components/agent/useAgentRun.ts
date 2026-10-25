"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentEvent, RunRequest, RunStopReason, SupportKey, ToolName, TrialInfo, VisitSchedule } from "@/lib/types";

export interface RunStep {
  id: string;
  iteration: number;
  tool: ToolName;
  status: "running" | "done" | "error";
  summary: string;
  input?: unknown;
  output?: unknown;
}

export type TimelineItem = { kind: "step"; step: RunStep } | { kind: "message"; id: string; text: string };

export interface RunState {
  status: "idle" | "running" | "done";
  items: TimelineItem[];
  trial: TrialInfo | null;
  schedule: VisitSchedule | null;
  simulation: { supports: SupportKey[] } | null;
  stop: { reason: RunStopReason; message: string } | null;
}

const EMPTY: RunState = { status: "idle", items: [], trial: null, schedule: null, simulation: null, stop: null };

function reduce(s: RunState, e: AgentEvent): RunState {
  switch (e.type) {
    case "step": {
      const step: RunStep = { id: e.id, iteration: e.iteration, tool: e.tool, status: e.status, summary: e.summary, input: e.input, output: e.output };
      const i = s.items.findIndex((it) => it.kind === "step" && it.step.id === e.id);
      const items = [...s.items];
      if (i >= 0) items[i] = { kind: "step", step };
      else items.push({ kind: "step", step });
      return { ...s, items };
    }
    case "message":
      return { ...s, items: [...s.items, { kind: "message", id: `m${s.items.length}`, text: e.text }] };
    case "trial":
      return { ...s, trial: e.trial };
    case "schedule":
      return { ...s, schedule: e.schedule };
    case "simulation":
      return { ...s, simulation: { supports: e.supports } };
    case "done":
      return { ...s, status: "done", stop: { reason: e.reason, message: e.message } };
  }
}

/** Streams POST /api/run and folds each NDJSON event into state. */
export function useAgentRun() {
  const [state, setState] = useState<RunState>(EMPTY);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (req: RunRequest) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ ...EMPTY, status: "running" });
    const apply = (e: AgentEvent) => setState((s) => reduce(s, e));
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req), signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const msg = await res.json().then((j: { error?: string }) => j.error).catch(() => null);
        return apply({ type: "done", reason: "error", message: msg ?? `Server returned ${res.status}` });
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) apply(JSON.parse(line) as AgentEvent);
      }
      if (buf.trim()) apply(JSON.parse(buf) as AgentEvent);
      setState((s) => (s.status === "running" ? { ...s, status: "done", stop: { reason: "error", message: "The connection closed before the run finished." } } : s));
    } catch (e) {
      if (ctrl.signal.aborted) return;
      apply({ type: "done", reason: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => (s.status === "running" ? { ...s, status: "done", stop: { reason: "error", message: "Run cancelled." } } : s));
  }, []);

  return { state, start, cancel };
}
