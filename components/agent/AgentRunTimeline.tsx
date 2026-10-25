"use client";

import { ArrowRight, Check, ChatText, CircleNotch, Pause, Warning, WarningCircle } from "@phosphor-icons/react/dist/ssr";

import type { RunStopReason, ToolName } from "@/lib/types";
import { ico, type PhosphorIcon } from "@/components/shell/icons";
import { Badge, Button, Card } from "@/components/shell/ui";
import { ToolCallPanel } from "./ToolCallPanel";
import type { RunState, RunStep } from "./useAgentRun";

const TOOL_LABEL: Record<ToolName, string> = {
  fetch_trial: "Fetch trial from ClinicalTrials.gov",
  extract_visit_schedule: "Extract visit schedule",
  parse_patients: "Validate patient file",
  score_patients: "Score friction per patient and visit",
  simulate_supports: "Simulate supports",
  summarize_groups: "Summarize by group",
  draft_documents: "Draft documents",
};

const statusUi: Record<RunStep["status"], { Icon: PhosphorIcon; spin?: boolean; word: string; ring: string; tone: "info" | "ok" | "bad" }> = {
  running: { Icon: CircleNotch, spin: true, word: "Running", ring: "border-info text-info", tone: "info" },
  done: { Icon: Check, word: "Done", ring: "border-ok bg-ok/15 text-ok", tone: "ok" },
  error: { Icon: WarningCircle, word: "Error", ring: "border-bad bg-bad/15 text-bad", tone: "bad" },
};

const stopUi: Record<RunStopReason, { tone: "ok" | "warn" | "bad"; title: string }> = {
  approval_gate: { tone: "warn", title: "Waiting for human approval" },
  needs_schedule: { tone: "warn", title: "Visit schedule needed" },
  finished: { tone: "ok", title: "Finished" },
  iteration_cap: { tone: "bad", title: "Stopped at the 12-step limit" },
  refusal: { tone: "bad", title: "The model declined" },
  error: { tone: "bad", title: "Run failed" },
};

const stopBorder = { ok: "border-ok/60", warn: "border-warn/60", bad: "border-bad/60" };

/** Live timeline of the real steps the agent took, in the order they streamed in. */
export function AgentRunTimeline({ run, onCancel, onOpen, onPasteSchedule }: {
  run: RunState;
  onCancel: () => void;
  onOpen: (tab: "results" | "drafts") => void;
  onPasteSchedule: () => void;
}) {
  const last = run.items.at(-1);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">Agent run</h1>
          <p className="mt-1 text-lg text-muted">
            {run.trial ? `${run.trial.nctId}: ${run.trial.title}` : "Starting…"}
          </p>
          {run.trial?.source === "cache" && (
            <p className="mt-2 flex items-center gap-2 text-warn"><Warning {...ico} /> {run.trial.sourceNote}</p>
          )}
        </div>
        {run.status === "running" && <Button onClick={onCancel}>Cancel</Button>}
      </div>

      <p className="sr-only" aria-live="polite">
        {run.status === "running" ? (last?.kind === "step" ? `${TOOL_LABEL[last.step.tool]}: ${last.step.status}` : "Agent is thinking") : run.stop?.message}
      </p>

      <Card title="Steps">
        {run.items.length === 0 && <p className="flex items-center gap-2 text-muted"><CircleNotch {...ico} className={`${ico.className} animate-spin`} /> Waiting for the agent&apos;s first step…</p>}
        <ol className="relative">
          {run.items.map((it, i) => {
            const lastItem = i === run.items.length - 1;
            // Parallel tool calls arrive in the same turn; stagger them 50ms so they don't land as one block.
            const sameTurn = it.kind === "step" ? run.items.slice(0, i).filter((x) => x.kind === "step" && x.step.iteration === it.step.iteration).length : 0;
            if (it.kind === "message") {
              return (
                <li key={it.id} className="tm-enter relative flex gap-4 pb-5 last:pb-0">
                  {!lastItem && <span aria-hidden className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 bg-line" />}
                  <span aria-hidden className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-line text-muted"><ChatText {...ico} /></span>
                  <p className="pt-2 text-muted italic">{it.text}</p>
                </li>
              );
            }
            const s = it.step;
            const ui = statusUi[s.status];
            return (
              <li key={s.id} className="tm-enter relative flex gap-4 pb-6 last:pb-0" style={sameTurn ? { transitionDelay: `${sameTurn * 50}ms` } : undefined}>
                {!lastItem && <span aria-hidden className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 transition-colors duration-200 ${s.status === "done" ? "bg-ok/60" : "bg-line"}`} />}
                <span aria-hidden className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition-colors duration-200 ${ui.ring}`}>
                  {/* Keyed by status so the new glyph mounts and pops in when the step finishes. */}
                  <span key={s.status} className="tm-pop flex">
                    <ui.Icon {...ico} className={ui.spin ? "animate-spin" : undefined} />
                  </span>
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">{TOOL_LABEL[s.tool]}</h3>
                    <Badge tone={ui.tone}>{ui.word}</Badge>
                    <span className="text-xs text-muted">step {s.id.slice(1)} · turn {s.iteration}</span>
                  </div>
                  <p key={s.status} className={`tm-fade mt-1 ${s.status === "error" ? "text-bad" : ""}`}>{s.summary}</p>
                  <ToolCallPanel tool={s.tool} input={s.input} output={s.output} />
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {run.stop && (
        <Card className={`tm-enter ${stopBorder[stopUi[run.stop.reason].tone]}`}>
          <div role="status">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              {run.stop.reason === "approval_gate" && <Pause {...ico} />}
              {stopUi[run.stop.reason].title}
            </h2>
            <p className="mt-1">{run.stop.message}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {run.stop.reason === "needs_schedule" && <Button variant="primary" onClick={onPasteSchedule}>Paste visit schedule <ArrowRight {...ico} /></Button>}
            {run.schedule?.scheduleFound && <Button variant="primary" onClick={() => onOpen("results")}>Open results <ArrowRight {...ico} /></Button>}
            {run.drafts && <Button variant="primary" onClick={() => onOpen("drafts")}>Review drafts <ArrowRight {...ico} /></Button>}
          </div>
        </Card>
      )}
    </div>
  );
}
