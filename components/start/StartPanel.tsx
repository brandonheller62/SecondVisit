"use client";

import { ArrowRight, Check, CircleNotch, UploadSimple, X } from "@phosphor-icons/react/dist/ssr";

import { useRef } from "react";
import type { ParseResult, Patient } from "@/lib/types";
import { ico } from "@/components/shell/icons";
import { Button, Card, Floor, InfoTip, SyntheticTag, WallBand } from "@/components/shell/ui";

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

/** Preferred languages in the loaded list, most common first: a glimpse of who is in the file. */
function languageCounts(patients: Patient[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const p of patients) counts.set(p.preferredLanguage, (counts.get(p.preferredLanguage) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export interface PatientFile {
  name: string;
  csv: string;
  parse: ParseResult;
}

export function StartPanel({ nctId, onNctId, file, onSample, onUpload, onRun, running, nctValid }: {
  nctId: string;
  onNctId: (v: string) => void;
  file: PatientFile | null;
  onSample: () => void;
  onUpload: (f: File) => void;
  onRun: () => void;
  running: boolean;
  nctValid: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const ready = nctValid && file?.parse.ok && !running;

  return (
    <>
      <WallBand
        size="lg"
        title="Who needs support to stay in this trial?"
        lede="Pick a trial and a patient list. We'll rank who to offer help first."
      />
      <Floor className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="1. Trial">
          {/* Only the demo trials for now: there is no patient data for other trials yet.
              Styled as hotel room-key tags: the punched hole fills when the trial is picked. */}
          <div className="grid gap-3" role="group" aria-label="Demo trials">
            {DEMO_TRIALS.map((t) => {
              const active = nctId.trim().toUpperCase() === t.nctId;
              return (
                <button
                  key={t.nctId}
                  type="button"
                  onClick={() => onNctId(t.nctId)}
                  aria-pressed={active}
                  className={`group flex items-start gap-4 rounded-xl border-2 bg-surface p-4 text-left shadow-[0_2px_8px_-4px_rgb(16_35_63/0.25)] transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.99] ${
                    active ? "border-primary shadow-[0_8px_20px_-10px_rgb(16_35_63/0.45)]" : "border-transparent hover:border-border"
                  }`}
                >
                  <span aria-hidden className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${active ? "border-primary bg-primary text-on-primary" : "border-border bg-bg"}`}>
                    {active && <Check size={12} weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold leading-snug">{t.label}</span>
                    <span className="mt-0.5 block text-muted">{t.detail}</span>
                    <span className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-text">{t.nctId}</span> cached demo
                    </span>
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
            {!file && <p className="rounded-xl border-2 border-dashed border-border px-4 py-6 text-muted">No patient list yet.</p>}
            {file && file.parse.ok && (
              <div className="rounded-xl bg-surface p-4 shadow-[0_2px_8px_-4px_rgb(16_35_63/0.25)]">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Check {...ico} className={`${ico.className} text-primary`} /> {file.name}
                  <SyntheticTag />
                </p>
                <p className="mt-1 text-muted">
                  {file.parse.quality.accepted} of {file.parse.quality.rows} patients ready
                  {file.parse.quality.rejectedRows.length > 0 && `, ${file.parse.quality.rejectedRows.length} skipped (row ${file.parse.quality.rejectedRows[0].row}: ${file.parse.quality.rejectedRows[0].reason})`}.
                </p>
                <ul aria-label="Patients by preferred language" className="mt-3 flex flex-wrap gap-2 text-sm">
                  {languageCounts(file.parse.patients).map(([lang, n]) => (
                    <li key={lang} className="rounded-full bg-surface-2 px-3 py-1">
                      {lang} <span className="font-semibold">{n}</span>
                    </li>
                  ))}
                </ul>
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

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" className="px-8 py-3.5 text-lg" disabled={!ready} onClick={onRun}>
          {running ? <><CircleNotch {...ico} className={`${ico.className} animate-spin`} /> Running…</> : <>Run agent <ArrowRight {...ico} /></>}
        </Button>
        {!ready && !running && <span className="text-muted">{!nctValid ? "Pick a trial first." : !file?.parse.ok ? "Add a patient list." : ""}</span>}
      </div>
      </Floor>
    </>
  );
}
