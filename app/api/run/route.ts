// POST /api/run: runs the Second Visit agent and streams each step as
// newline-delimited JSON (one AgentEvent per line). The patient CSV lives only
// in this request's memory: it is never written to disk or logged.

import { runAgent } from "@/lib/agent/loop";
import type { AgentEvent, ParticipantCompensation, RunRequest } from "@/lib/types";
import { COMPENSATION_KINDS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_CSV_BYTES = 2_000_000;
const MAX_PROTOCOL_CHARS = 60_000;

export async function POST(request: Request) {
  let body: Partial<RunRequest>;
  try {
    body = (await request.json()) as Partial<RunRequest>;
  } catch {
    return Response.json({ error: "Body must be JSON: { nctId, csv, protocolText? }" }, { status: 400 });
  }
  const { nctId, csv, protocolText, participantCompensation: pc } = body;
  if (typeof nctId !== "string" || !nctId.trim()) return Response.json({ error: "nctId is required." }, { status: 400 });
  if (typeof csv !== "string" || !csv.trim()) return Response.json({ error: "csv is required." }, { status: 400 });
  if (csv.length > MAX_CSV_BYTES) return Response.json({ error: "CSV is larger than 2 MB." }, { status: 413 });
  if (protocolText !== undefined && (typeof protocolText !== "string" || protocolText.length > MAX_PROTOCOL_CHARS)) {
    return Response.json({ error: "protocolText must be text under 60,000 characters." }, { status: 400 });
  }
  let participantCompensation: ParticipantCompensation | undefined;
  if (pc !== undefined) {
    const stipend = pc?.stipendPerVisit;
    if (!pc || !COMPENSATION_KINDS.includes(pc.kind) || !(stipend === null || stipend === undefined || (typeof stipend === "number" && Number.isFinite(stipend) && stipend >= 0))) {
      return Response.json({ error: `participantCompensation must be { kind: ${COMPENSATION_KINDS.join(" | ")}, stipendPerVisit: number >= 0 or null }.` }, { status: 400 });
    }
    participantCompensation = { kind: pc.kind, stipendPerVisit: stipend ?? null };
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: AgentEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await runAgent({ nctId, csv, protocolText, participantCompensation }, emit, request.signal);
      } catch (e) {
        // Error text only; never the request body.
        emit({ type: "done", reason: "error", message: e instanceof Error ? e.message : "The agent run failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
