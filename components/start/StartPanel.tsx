"use client";

import { ArrowRight, Check, CircleNotch, UploadSimple, X } from "@phosphor-icons/react/dist/ssr";

import { useRef } from "react";
import type { ParseResult } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Button, Card, InfoTip, SyntheticTag } from "@/components/shell/ui";

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
        <h1 className="text-3xl font-semibold tracking-tight">Who needs support to stay in this trial?</h1>
        <p className="mt-2 text-lg text-muted">Pick a trial and a patient list. We&apos;ll rank who to offer help first.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Trial">
          <label htmlFor="nct" className="text-sm font-medium text-muted">NCT ID</label>
          <input
            id="nct"
            value={nctId}
            onChange={(e) => onNctId(e.target.value)}
            placeholder="NCT00000000"
            spellCheck={false}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-3 font-mono text-xl uppercase tracking-wide"
            aria-invalid={nctId !== "" && !nctValid}
            aria-describedby="nct-help"
          />
          <p id="nct-help" className={`mt-1 text-sm ${nctId && !nctValid ? "text-bad" : "text-muted"}`}>
            {nctId && !nctValid ? "Use NCT followed by 8 digits." : "Any ClinicalTrials.gov ID, or pick a demo below."}
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
                  className={`rounded-lg border-2 p-3 text-left transition ${active ? "border-text" : "border-border hover:border-muted"}`}
                >
                  <span className="block font-semibold">{t.label}</span>
                  <span className="block text-sm text-muted">{t.detail}</span>
                  <span className="mt-1 block text-xs text-muted">
                    <span className="font-mono">{t.nctId}</span> · cached demo
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title={
            <span className="inline-flex items-center gap-1">
              2. Patients
              <InfoTip label="How patient files are handled">
                Use a de-identified list of people already medically eligible. Files with names, phone numbers, emails, addresses, dates of birth, SSNs or MRNs are rejected. Rows stay in memory and are never stored or logged; the AI only sees totals and patient IDs.
              </InfoTip>
            </span>
          }
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={onSample}>Use sample patients</Button>
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

          <div className="mt-4 min-h-16" aria-live="polite">
            {!file && <p className="text-muted">No patient list yet.</p>}
            {file && file.parse.ok && (
              <div className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Check {...ico} /> {file.name}
                  <SyntheticTag />
                </p>
                <p className="text-muted">
                  {file.parse.quality.accepted} of {file.parse.quality.rows} patients ready
                  {file.parse.quality.rejectedRows.length > 0 && `, ${file.parse.quality.rejectedRows.length} skipped (row ${file.parse.quality.rejectedRows[0].row}: ${file.parse.quality.rejectedRows[0].reason})`}.
                </p>
              </div>
            )}
            {file && !file.parse.ok && (
              <div role="alert" className="text-bad">
                <p className="flex items-center gap-2 font-semibold"><X {...ico} /> {file.name} was not accepted</p>
                <p className="mt-1">{file.parse.error}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {showProtocol && (
        <Card title="Visit schedule needed" subtitle="The registry doesn't list the visits. Paste the schedule and run again.">
          <label htmlFor="protocol" className="sr-only">Visit schedule or protocol text</label>
          <textarea
            id="protocol"
            value={protocolText}
            onChange={(e) => onProtocolText(e.target.value)}
            rows={8}
            placeholder={"e.g. Screening (week -2): fasting labs, 2 hours, 8 AM.\nWeek 0 baseline: ECG, questionnaires, 3 hours…"}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm"
          />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" className="px-6 py-3 text-lg" disabled={!ready} onClick={onRun}>
          {running ? <><CircleNotch {...ico} className={`${ico.className} animate-spin`} /> Running…</> : <>Run agent <ArrowRight {...ico} /></>}
        </Button>
        {!ready && !running && <span className="text-muted">{!nctValid ? "Pick a trial first." : !file?.parse.ok ? "Add a patient list." : ""}</span>}
      </div>
    </div>
  );
}
