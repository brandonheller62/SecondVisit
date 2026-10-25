"use client";

import { ArrowRight, Check, CircleNotch, UploadSimple, X } from "@phosphor-icons/react/dist/ssr";

import { useRef } from "react";
import type { ParseResult } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Badge, Button, Card, SyntheticTag } from "@/components/shell/ui";

export const DEMO_TRIALS = [
  {
    nctId: "NCT05232071",
    label: "Type 2 diabetes + fatty liver (NASH)",
    detail: "Lanifibranor ± empagliflozin, 24 weeks. Includes a Miami site.",
  },
  {
    nctId: "NCT06343298",
    label: "Hypertension (difficult to control)",
    detail: "MANP for resistant hypertension, about 10 weeks. Includes a Miami site.",
  },
];

export interface PatientFile {
  name: string;
  csv: string;
  parse: ParseResult;
}

export function StartPanel({ nctId, onNctId, file, onSample, onUpload, protocolText, onProtocolText, showProtocol, onRun, running, nctValid }: {
  nctId: string;
  onNctId: (v: string) => void;
  file: PatientFile | null;
  onSample: () => void;
  onUpload: (f: File) => void;
  protocolText: string;
  onProtocolText: (v: string) => void;
  showProtocol: boolean;
  onRun: () => void;
  running: boolean;
  nctValid: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const ready = nctValid && file?.parse.ok && !running;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Who needs support to stay in this trial?</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted">
          Pick a trial and a list of patients who are already medically eligible. The agent reads the trial&apos;s visit schedule, scores the friction each visit puts on each person, and ranks who should be offered help first.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Trial" subtitle="Any ClinicalTrials.gov ID, or a demo trial with a cached copy.">
          <label htmlFor="nct" className="text-sm font-medium text-muted">NCT ID</label>
          <input
            id="nct"
            value={nctId}
            onChange={(e) => onNctId(e.target.value)}
            placeholder="NCT00000000"
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-3 font-mono text-xl uppercase tracking-wide"
            aria-invalid={nctId !== "" && !nctValid}
            aria-describedby="nct-help"
          />
          <p id="nct-help" className={`mt-1 text-sm ${nctId && !nctValid ? "text-bad" : "text-muted"}`}>
            {nctId && !nctValid ? "Use NCT followed by 8 digits." : "Fetched live; falls back to a cached copy if the registry is unreachable."}
          </p>
          <div className="mt-4 grid gap-3">
            {DEMO_TRIALS.map((t) => {
              const active = nctId.trim().toUpperCase() === t.nctId;
              return (
                <button
                  key={t.nctId}
                  type="button"
                  onClick={() => onNctId(t.nctId)}
                  aria-pressed={active}
                  className={`rounded-lg border p-3 text-left transition ${active ? "border-accent bg-accent/10" : "border-line bg-surface-2 hover:border-muted"}`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-muted">{t.nctId}</span>
                    <Badge tone="neutral">Cached demo</Badge>
                    {active && <Badge tone="accent"><Check {...ico} /> Selected</Badge>}
                  </span>
                  <span className="mt-1 block font-semibold">{t.label}</span>
                  <span className="block text-sm text-muted">{t.detail}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="2. Patients" subtitle="De-identified CSV of people already medically eligible. Processed in memory only.">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={onSample}>Use sample patients</Button>
            <Button onClick={() => fileInput.current?.click()}><UploadSimple {...ico} /> Upload CSV…</Button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mt-4 min-h-24 rounded-lg bg-bg p-4" aria-live="polite">
            {!file && <p className="text-muted">No file yet. The sample file has 120 synthetic Miami-Dade patients.</p>}
            {file && file.parse.ok && (
              <div className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Check {...ico} className={`${ico.className} text-ok`} /> {file.name}
                  <SyntheticTag />
                </p>
                <p>
                  {file.parse.quality.accepted} of {file.parse.quality.rows} rows accepted
                  {file.parse.quality.rejectedRows.length > 0 && `, ${file.parse.quality.rejectedRows.length} rejected (e.g. row ${file.parse.quality.rejectedRows[0].row}: ${file.parse.quality.rejectedRows[0].reason})`}.
                </p>
                {file.parse.quality.ignoredColumns.length > 0 && (
                  <p className="text-sm text-muted">Ignored columns: {file.parse.quality.ignoredColumns.join(", ")}. Medical eligibility is the research team&apos;s decision, not this tool&apos;s.</p>
                )}
              </div>
            )}
            {file && !file.parse.ok && (
              <div role="alert" className="text-bad">
                <p className="flex items-center gap-2 font-semibold"><X {...ico} /> {file.name} was not accepted</p>
                <p className="mt-1">{file.parse.error}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">
            Files with names, phone numbers, emails, street addresses, dates of birth, SSNs, MRNs or similar columns are rejected. Rows are never stored or logged; the AI model sees only aggregates and patient IDs.
          </p>
        </Card>
      </div>

      {showProtocol && (
        <Card title="Visit schedule needed" subtitle="The registry record has no usable visit schedule. Paste the visit schedule or the protocol's schedule-of-assessments text and run again.">
          <label htmlFor="protocol" className="sr-only">Visit schedule or protocol text</label>
          <textarea
            id="protocol"
            value={protocolText}
            onChange={(e) => onProtocolText(e.target.value)}
            rows={8}
            placeholder={"e.g. Screening (week -2): fasting labs, 2 hours, 8 AM.\nWeek 0 baseline: ECG, questionnaires, 3 hours…"}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm"
          />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" className="px-6 py-3 text-lg" disabled={!ready} onClick={onRun}>
          {running ? <><CircleNotch {...ico} className={`${ico.className} animate-spin`} /> Agent running…</> : <>Run agent <ArrowRight {...ico} /></>}
        </Button>
        {!ready && !running && <span className="text-muted">{!nctValid ? "Enter a valid NCT ID." : !file?.parse.ok ? "Add an accepted patient file." : ""}</span>}
      </div>
    </div>
  );
}
