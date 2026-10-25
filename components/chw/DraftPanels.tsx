"use client";

import { useState } from "react";
import type { Draft, SummaryLanguage } from "@/lib/types";
import { Badge, Button, Card } from "@/components/shell/ui";
import { ApprovalGate } from "./ApprovalGate";

const MACHINE = <Badge tone="warn">⚙ Machine-drafted, needs CHW review</Badge>;

/** Any edit sends an approved draft back to Pending. */
const edit = (d: Draft, text: string): Draft => ({ ...d, text, status: "pending", approvedBy: null, approvedAt: null });

const languages: { code: SummaryLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ht", label: "Kreyòl ayisyen" },
];

export function PlainSummary({ drafts, onChange }: { drafts: Draft[]; onChange: (d: Draft) => void }) {
  const [lang, setLang] = useState<SummaryLanguage>("en");
  const [editing, setEditing] = useState(false);
  const draft = drafts.find((d) => d.kind === "summary" && d.language === lang);
  if (!draft) return null;

  return (
    <Card title="Plain-language summary" actions={MACHINE}>
      <div role="radiogroup" aria-label="Summary language" className="mb-4 inline-flex rounded-lg border border-line p-1">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={lang === l.code}
            onClick={() => setLang(l.code)}
            className={`rounded-md px-4 py-1.5 font-medium ${lang === l.code ? "bg-accent text-accent-ink" : "text-ink hover:bg-surface-2"}`}
          >
            {l.label}
            {drafts.find((d) => d.kind === "summary" && d.language === l.code)?.status === "approved" && <span aria-label=" approved"> ✓</span>}
          </button>
        ))}
      </div>
      {editing ? (
        <textarea
          lang={lang}
          value={draft.text}
          onChange={(e) => onChange(edit(draft, e.target.value))}
          rows={14}
          className="w-full rounded-lg border border-line bg-bg p-4 text-lg leading-relaxed"
          aria-label={draft.title}
        />
      ) : (
        <div lang={lang} className="whitespace-pre-wrap rounded-lg bg-bg p-4 text-lg leading-relaxed">
          {draft.text}
        </div>
      )}
      <Button className="mt-3" onClick={() => setEditing(!editing)}>{editing ? "Done editing" : "✎ Edit text"}</Button>
      <ApprovalGate key={draft.id} draft={draft} onChange={onChange} />
    </Card>
  );
}

export function AccommodationDraft({ drafts, onChange }: { drafts: Draft[]; onChange: (d: Draft) => void }) {
  const draft = drafts.find((d) => d.kind === "accommodation");
  if (!draft) return null;
  return (
    <Card title="Accommodation request" subtitle="Edit freely before approving." actions={MACHINE}>
      <textarea
        value={draft.text}
        onChange={(e) => onChange(edit(draft, e.target.value))}
        rows={18}
        className="w-full rounded-lg border border-line bg-bg p-4 font-mono text-base leading-relaxed"
        aria-label="Accommodation request text"
      />
      <ApprovalGate draft={draft} onChange={onChange} />
    </Card>
  );
}
