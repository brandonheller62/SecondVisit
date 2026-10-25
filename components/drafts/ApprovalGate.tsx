"use client";

import { Check, Hourglass } from "@phosphor-icons/react/dist/ssr";

import { useEffect, useState } from "react";
import type { Approval } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Badge, Button } from "@/components/shell/ui";

/**
 * Nothing can be exported until a reviewer ticks "I reviewed this", enters
 * their name and approves. Any edit afterwards sends the drafts back to Pending.
 */
export function ApprovalGate({ approval, onApprove, children }: {
  approval: Approval | null;
  onApprove: (a: Approval) => void;
  /** Export buttons; rendered disabled until approved. */
  children: (enabled: boolean) => React.ReactNode;
}) {
  const [reviewed, setReviewed] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!approval) setReviewed(false);
  }, [approval]);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Approval</h2>
        {approval ? <Badge tone="ok"><Check {...ico} /> Approved</Badge> : <Badge tone="warn"><Hourglass {...ico} /> Pending review</Badge>}
        {approval && (
          <span>
            by <b>{approval.reviewer}</b> on {new Date(approval.approvedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </div>

      {!approval && (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-lg">
            <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="h-5 w-5" />
            I reviewed this
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Reviewer name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="rounded-lg border border-line bg-bg px-3 py-2" />
          </label>
          <Button variant="primary" disabled={!reviewed || !name.trim()} onClick={() => onApprove({ reviewer: name.trim(), approvedAt: new Date().toISOString() })}>
            Approve
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {children(Boolean(approval))}
        {!approval && <span className="text-sm text-muted">Export unlocks after approval.</span>}
      </div>
    </div>
  );
}
