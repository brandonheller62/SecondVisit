"use client";

import { ArrowRight, Check, ChatText, CircleNotch, Warning, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import type { RunStopReason, ToolName } from "@/lib/types";
import { ico, type PhosphorIcon } from "@/components/shell/icons";
import { Button, Toggle } from "@/components/shell/ui";
import { ToolCallPanel } from "./ToolCallPanel";
import type { RunState, RunStep } from "./useAgentRun";

/** What each step is doing while it runs. When it finishes, the tool's own one-line sentence replaces this. */
const RUNNING_TEXT: Record<ToolName, string> = {
  fetch_trial: "Loading the trial…",
  extract_visit_schedule: "Reading the visit schedule…",
  parse_patients: "Checking the patient list…",
  score_patients: "Ranking patients by how hard the visits are for them…",
  simulate_supports: "Trying supports…",
  summarize_groups: "Breaking the results down by group…",
};

const statusUi: Record<RunStep["status"], { Icon: PhosphorIcon; spin?: boolean; ring: string }> = {
  running: { Icon: CircleNotch, spin: true, ring: "border-border text-muted" },
  done: { Icon: Check, ring: "border-text/30 text-text" },
  error: { Icon: WarningCircle, ring: "border-bad text-bad" },
};

const stopTitle: Record<RunStopReason, string> = {
  needs_schedule: "Visit schedule needed",
  finished: "Done",
  iteration_cap: "Stopped at the 12-step limit",
  refusal: "The model declined",
  error: "Run failed",
};

/** Live list of the steps the agent took, one plain sentence each. Raw tool input/output sits behind one toggle. */
export function AgentRunTimeline({ run, onCancel, onOpen, onPasteSchedule }: {
  run: RunState;
  onCancel: () => void;
  onOpen: (tab: "results") => void;
  onPasteSchedule: () => void;
}) {
  const [details, setDetails] = useState(false);
  const last = run.items.at(-1);
  const sentence = (s: RunStep) => (s.status === "running" ? RUNNING_TEXT[s.tool] : s.summary);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Agent run</h1>
        <div className="flex items-center gap-3">
          {run.status === "running" && <Button onClick={onCancel}>Cancel</Button>}
          <div className="w-44">
            <Toggle checked={details} onChange={setDetails} label="Show details" />
          </div>
        </div>
      </div>

      {run.trial?.source === "cache" && (
        <p className="flex items-center gap-2 text-warn"><Warning {...ico} /> {run.trial.sourceNote}</p>
      )}

      <p className="sr-only" aria-live="polite">
        {run.status === "running" ? (last?.kind === "step" ? sentence(last.step) : "The agent is thinking") : run.stop?.message}
      </p>

      <section className="border-t border-border pt-6">
        {run.items.length === 0 && <p className="flex items-center gap-2 text-muted"><CircleNotch {...ico} className={`${ico.className} animate-spin`} /> Starting…</p>}
        <ol>
          {run.items.map((it, i) => {
            // Parallel tool calls arrive in the same turn; stagger them 50ms so they don't land as one block.
            const sameTurn = it.kind === "step" ? run.items.slice(0, i).filter((x) => x.kind === "step" && x.step.iteration === it.step.iteration).length : 0;
            if (it.kind === "message") {
              return (
                <li key={it.id} className="tm-enter flex gap-3 py-2">
                  <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center text-muted"><ChatText {...ico} /></span>
                  <p className="max-w-[75ch] pt-0.5">{it.text}</p>
                </li>
              );
            }
            const s = it.step;
            const ui = statusUi[s.status];
            return (
              <li key={s.id} className="tm-enter flex gap-3 py-2" style={sameTurn ? { transitionDelay: `${sameTurn * 50}ms` } : undefined}>
                <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${ui.ring}`}>
                  {/* Keyed by status so the new glyph mounts and pops in when the step finishes. */}
                  <span key={s.status} className="tm-pop flex">
                    <ui.Icon {...ico} className={ui.spin ? "animate-spin" : undefined} />
                  </span>
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p key={s.status} className={`tm-fade ${s.status === "error" ? "text-bad" : s.status === "running" ? "text-muted" : ""}`}>{sentence(s)}</p>
                  {details && <ToolCallPanel tool={s.tool} input={s.input} output={s.output} />}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {run.stop && (
        <section className="tm-enter border-t border-border pt-6">
          <div role="status">
            <h2 className={`text-xl font-semibold ${run.stop.reason === "finished" ? "" : run.stop.reason === "needs_schedule" ? "text-warn" : "text-bad"}`}>
              {stopTitle[run.stop.reason]}
            </h2>
            <p className="mt-1">{run.stop.message}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {run.stop.reason === "needs_schedule" && <Button variant="primary" onClick={onPasteSchedule}>Paste visit schedule <ArrowRight {...ico} /></Button>}
            {run.schedule?.scheduleFound && <Button variant="primary" onClick={() => onOpen("results")}>Open results <ArrowRight {...ico} /></Button>}
          </div>
        </section>
      )}
    </div>
  );
}
