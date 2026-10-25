// The agent loop: send messages + tools to Claude, run the tools it asks for
// in code, send results back, repeat until Claude finishes, the approval gate
// is reached, or MAX_ITERATIONS is hit. Every step is emitted to the UI.

import Anthropic from "@anthropic-ai/sdk";
import type { AgentEvent, RunRequest, RunStopReason } from "../types";
import { getClient, getModel } from "./llm";
import { AGENT_SYSTEM } from "./prompts";
import { isToolName, newContext, runTool, TOOL_DEFINITIONS } from "./tools";

export const MAX_ITERATIONS = 12;

type Emit = (e: AgentEvent) => void;

const done = (emit: Emit, reason: RunStopReason, message: string) => emit({ type: "done", reason, message });

export async function runAgent(req: RunRequest, emit: Emit, signal?: AbortSignal): Promise<void> {
  const client = getClient();
  const model = getModel();
  const ctx = newContext(req.csv, req.protocolText);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Run Trial Mirror for trial ${req.nctId.trim()}. The patient CSV is uploaded and held on the server (you will see only aggregates).${ctx.protocolText ? " The research team also pasted visit schedule / protocol text; extract_visit_schedule will read it." : ""}`,
    },
  ];
  let stepNo = 0;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    if (signal?.aborted) return done(emit, "error", "Run cancelled.");

    const response = await client.messages.create(
      {
        model,
        max_tokens: 16000,
        system: [{ type: "text", text: AGENT_SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: TOOL_DEFINITIONS,
        messages,
      },
      { signal },
    );

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) emit({ type: "message", iteration, text: block.text.trim() });
    }

    if (response.stop_reason === "refusal") return done(emit, "refusal", "The model declined to continue this run.");

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (response.stop_reason === "max_tokens" && toolUses.length) {
      return done(emit, "error", "The model's reply was cut off mid tool call. Try running again.");
    }
    if (toolUses.length === 0) {
      if (ctx.schedule && !ctx.schedule.scheduleFound) {
        return done(emit, "needs_schedule", "The registry record has no usable visit schedule. Paste the visit schedule or protocol text and run again.");
      }
      return done(emit, "finished", "The agent finished without drafting documents.");
    }

    messages.push({ role: "assistant", content: response.content });

    // Run this turn's tool calls together; results go back in one user message.
    const results = await Promise.all(
      toolUses.map(async (use): Promise<Anthropic.ToolResultBlockParam> => {
        const id = `s${++stepNo}`;
        const tool = isToolName(use.name) ? use.name : null;
        if (!tool) {
          return { type: "tool_result", tool_use_id: use.id, is_error: true, content: `Unknown tool "${use.name}".` };
        }
        emit({ type: "step", id, iteration, tool, status: "running", summary: "Running…", input: use.input });
        try {
          const out = await runTool(tool, use.input, ctx);
          emit({ type: "step", id, iteration, tool, status: "done", summary: out.summary, input: use.input, output: out.forModel });
          if (tool === "fetch_trial" && ctx.trial) emit({ type: "trial", trial: ctx.trial });
          if (tool === "extract_visit_schedule" && ctx.schedule) emit({ type: "schedule", schedule: ctx.schedule });
          if (tool === "simulate_supports" && ctx.sim) emit({ type: "simulation", supports: ctx.sim.result.supports, stormWeek: ctx.sim.result.stormWeek });
          if (tool === "draft_documents" && ctx.drafts) emit({ type: "drafts", drafts: ctx.drafts });
          return { type: "tool_result", tool_use_id: use.id, content: JSON.stringify(out.forModel) };
        } catch (e) {
          const message = e instanceof Anthropic.APIError ? `Claude API error ${e.status ?? ""}: ${e.message}` : e instanceof Error ? e.message : String(e);
          emit({ type: "step", id, iteration, tool, status: "error", summary: message, input: use.input, output: { error: message } });
          return { type: "tool_result", tool_use_id: use.id, is_error: true, content: message };
        }
      }),
    );

    // Human control: once drafts exist, stop at the approval gate.
    if (ctx.drafts) return done(emit, "approval_gate", "Drafts are ready. A reviewer must approve them before anything can be exported.");

    messages.push({ role: "user", content: results });
  }

  done(emit, "iteration_cap", `Stopped after ${MAX_ITERATIONS} iterations without finishing.`);
}
