"use client";

import { useEffect, useState } from "react";
import { approveDraft } from "@/lib/api";
import type { Draft } from "@/lib/types";
import { Badge, Button } from "@/components/shell/ui";

/**
 * Nothing leaves the app until a CHW ticks "I reviewed this", enters their
 * name and approves. Editing the text afterwards sends it back to Pending
 * (handled by the parent).
 */
export function ApprovalGate({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const [reviewed, setReviewed] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const approved = draft.status === "approved";
  const id = draft.id;

  // An edit after approval puts the draft back to Pending; make the reviewer re-confirm.
  useEffect(() => {
    if (!approved) setReviewed(false);
  }, [approved]);

  async function approve() {
    onChange(await approveDraft(draft, name.trim()));
  }

  async function copy() {
    await navigator.clipboard.writeText(draft.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 rounded-lg border border-line bg-bg p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Status</span>
        {approved ? <Badge tone="ok">✓ Approved</Badge> : <Badge tone="warn">⏳ Pending review</Badge>}
        {approved && draft.approvedAt && (
          <span className="text-sm">
            by <b>{draft.approvedBy}</b> on {new Date(draft.approvedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </div>

      {!approved && (
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              className="h-5 w-5 accent-[var(--color-accent)]"
            />
            I reviewed this
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Reviewer name</span>
            <input
              id={`${id}-approver`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CHW name"
              className="rounded-lg border border-line bg-surface px-3 py-2"
            />
          </label>
          <Button variant="primary" disabled={!reviewed || !name.trim()} onClick={approve}>
            Approve
          </Button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button disabled={!approved} onClick={() => printDraft(draft)}>⤓ Export PDF</Button>
        <Button disabled={!approved} onClick={copy}>{copied ? "✓ Copied" : "⧉ Copy text"}</Button>
        {!approved && <span className="text-sm text-muted">Export unlocks after approval.</span>}
      </div>
    </div>
  );
}

/** Opens the browser print dialog on a clean page; "Save as PDF" covers export. */
function printDraft(draft: Draft) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  w.document.write(`<!doctype html><html lang="${draft.language}"><head><meta charset="utf-8"><title>${esc(draft.title)}</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 20px;color:#111}
pre{white-space:pre-wrap;font:inherit}footer{margin-top:32px;font-size:13px;color:#555;border-top:1px solid #ccc;padding-top:8px}</style></head>
<body><h1>${esc(draft.title)}</h1><pre>${esc(draft.text)}</pre>
<footer>Approved by ${esc(draft.approvedBy ?? "")} on ${esc(draft.approvedAt ?? "")}. Prepared with Trial Mirror using synthetic data only. Not medical advice; does not determine eligibility.</footer>
</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
