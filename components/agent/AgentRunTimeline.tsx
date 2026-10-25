"use client";

import { useEffect, useState } from "react";
import { getAgentRun } from "@/lib/api";
import type { AgentStepStatus, Trial } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Badge, Button, Card } from "@/components/shell/ui";
import { ToolCallPanel } from "./ToolCallPanel";

const STEP_MS = 1300;

const statusUi: Record<AgentStepStatus | "waiting", { icon: string; word: string; ring: string; tone: "neutral" | "info" | "ok" | "warn" }> = {
  pending: { icon: "○", word: "Pending", ring: "border-line text-muted", tone: "neutral" },
  running: { icon: "◌", word: "Running", ring: "border-info text-info animate-pulse", tone: "info" },
  done: { icon: "✓", word: "Done", ring: "border-ok bg-ok/15 text-ok", tone: "ok" },
  waiting: { icon: "⏸", word: "Waiting for CHW", ring: "border-warn bg-warn/15 text-warn", tone: "warn" },
};

/**
 * Replays a finished agent run one step at a time. `runKey` changes each time
 * "Analyze" is clicked so the animation restarts.
 */
export function AgentRunTimeline({ trial, runKey, onOpen }: {
  trial: Trial;
  runKey: number;
  onOpen: (tab: "coordinator" | "chw") => void;
}) {
  const steps = useApi(() => getAgentRun(trial.id), [trial.id]);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => setRevealed(0), [runKey, trial.id]);

  useEffect(() => {
    if (!steps || revealed >= steps.length - 1) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [steps, revealed]);

  if (!steps) return null;
  const finished = revealed >= steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agent run</h1>
          <p className="mt-1 text-lg text-muted">
            {trial.id} · {trial.shortTitle}
          </p>
        </div>
        <p className="sr-only" aria-live="polite">
          {steps[revealed].label}: {finished ? "waiting for CHW approval" : "running"}
        </p>
        {!finished && (
          <Button onClick={() => setRevealed(steps.length - 1)}>Skip to end</Button>
        )}
      </div>

      <Card>
        <ol className="relative">
          {steps.map((step, i) => {
            const status: AgentStepStatus | "waiting" =
              i < revealed ? "done" : i === revealed ? (i === steps.length - 1 ? "waiting" : "running") : "pending";
            const ui = statusUi[status];
            const shown = status !== "pending";
            return (
              <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 transition-colors duration-500 ${
                      i < revealed ? "bg-ok/60" : "bg-line"
                    }`}
                  />
                )}
                <span
                  aria-hidden
                  className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-500 ${ui.ring}`}
                >
                  {ui.icon}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className={`text-lg font-semibold ${shown ? "" : "text-muted"}`}>{step.label}</h3>
                    <Badge tone={ui.tone}>{ui.word}</Badge>
                  </div>
                  {status === "running" && <p className="mt-1 text-muted">Working…</p>}
                  {(status === "done" || status === "waiting") && (
                    <div className="animate-[fadein_400ms_ease-out]">
                      <p className="mt-1">{step.summary}</p>
                      {step.toolCall && <ToolCallPanel call={step.toolCall} />}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {finished && (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => onOpen("coordinator")}>Open coordinator view →</Button>
          <Button variant="primary" onClick={() => onOpen("chw")}>Open CHW review →</Button>
        </div>
      )}
    </div>
  );
}
