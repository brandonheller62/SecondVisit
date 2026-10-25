"use client";

import { Check, Copy, DownloadSimple } from "@phosphor-icons/react/dist/ssr";

import { useState } from "react";
import { BARRIER_LABELS, SUPPORT_LABELS } from "@/lib/assumptions";
import type { Approval, Draft, PatientScore } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Badge, Button, Card } from "@/components/shell/ui";
import { ApprovalGate } from "./ApprovalGate";

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function rankedCsv(patients: PatientScore[], approval: Approval): string {
  const header = [
    "rank", "patient_id", "synthetic", "tier", "risk_of_leaving_without_support", "top_barriers", "recommended_supports",
    "patient_travel_per_visit", "patient_lost_pay_per_visit", "patient_uninsured_per_visit", "patient_cost_per_visit", "patient_cost_all_visits",
  ];
  const rows = patients.map((p, i) => [
    i + 1,
    p.patientId,
    "yes",
    p.tier,
    p.risk.toFixed(3),
    p.topBarriers.map((b) => `${BARRIER_LABELS[b.key].label} (${b.visitLabel})`).join("; "),
    p.recommendedSupports.map((s) => SUPPORT_LABELS[s].label).join("; "),
    p.visitCostBreakdown.travel,
    p.visitCostBreakdown.lostWages,
    p.visitCostBreakdown.outOfPocket,
    p.costPerVisit,
    p.totalCost,
  ]);
  const note = [`# Trial Mirror support list. SYNTHETIC data. Ranks who to offer support first; never use to exclude anyone. Approved by ${approval.reviewer} at ${approval.approvedAt}.`];
  return [note, header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function DraftsView({ drafts, onDrafts, approval, onApproval, ranked }: {
  drafts: Draft[];
  onDrafts: (d: Draft[]) => void;
  approval: Approval | null;
  onApproval: (a: Approval | null) => void;
  ranked: PatientScore[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const footer = approval ? `\n\n---\nApproved by ${approval.reviewer} on ${approval.approvedAt}. Prepared with Trial Mirror using synthetic data. Not medical advice; does not determine eligibility.` : "";
  const all = drafts.map((d) => `# ${d.title}\n\n${d.text}`).join("\n\n");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drafts</h1>
        <p className="mt-1 text-lg text-muted">Written by the agent from aggregates and patient IDs only. Edit freely; any edit needs a fresh approval.</p>
      </div>

      <ApprovalGate approval={approval} onApprove={onApproval}>
        {(enabled) => (
          <>
            <Button disabled={!enabled} onClick={() => copy("all", all + footer)}>{copied === "all" ? <><Check {...ico} /> Copied</> : <><Copy {...ico} /> Copy all drafts</>}</Button>
            <Button disabled={!enabled} onClick={() => approval && download("trial-mirror-support-list.csv", rankedCsv(ranked, approval), "text/csv")}>
              <DownloadSimple {...ico} /> Download support list (CSV)
            </Button>
          </>
        )}
      </ApprovalGate>

      {drafts.map((d) => (
        <Card
          key={d.id}
          title={d.title}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {d.needsNativeReview && <Badge tone="warn">Machine-drafted, needs native-speaker/CHW review</Badge>}
              <Button disabled={!approval} onClick={() => copy(d.id, d.text + footer)}>{copied === d.id ? <><Check {...ico} /> Copied</> : <><Copy {...ico} /> Copy text</>}</Button>
            </div>
          }
        >
          <label htmlFor={`draft-${d.id}`} className="sr-only">{d.title}</label>
          <textarea
            id={`draft-${d.id}`}
            lang={d.language}
            value={d.text}
            onChange={(e) => {
              onDrafts(drafts.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)));
              if (approval) onApproval(null);
            }}
            rows={Math.min(24, Math.max(8, d.text.split("\n").length + 2))}
            className="w-full rounded-lg border border-line bg-bg p-3 leading-relaxed"
          />
        </Card>
      ))}
    </div>
  );
}
