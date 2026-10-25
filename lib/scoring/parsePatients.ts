// Pure CSV -> Patient[] parsing and validation. Runs in memory on the server
// (agent tool) and in the browser (live re-scoring). Never logs rows.

import { IDENTIFYING_COLUMN_PATTERNS, IGNORED_COLUMNS, PATIENT_COLUMNS } from "../../data/patient_schema";
import type { DataQuality, ParseResult, Patient } from "../types";

/** Minimal RFC 4180 CSV reader: quoted fields, escaped quotes, CRLF. */
export function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const squash = (h: string) => h.toLowerCase().replace(/[\s_\-.]/g, "");

export function findIdentifyingColumns(headers: string[]): string[] {
  const hits: string[] = [];
  for (const h of headers) {
    const s = squash(h);
    const match = IDENTIFYING_COLUMN_PATTERNS.find((p) => p.pattern.test(s));
    if (match) hits.push(`${h} (${match.label})`);
  }
  return hits;
}

export function parsePatients(csv: string): ParseResult {
  const table = readCsv(csv);
  if (table.length < 2) return { ok: false, error: "The file has no data rows.", blockedColumns: [] };

  const headers = table[0].map((h) => h.trim());
  const blocked = findIdentifyingColumns(headers);
  if (blocked.length) {
    return {
      ok: false,
      error: `Rejected: this file has identifying columns (${blocked.join(", ")}). Trial Mirror accepts de-identified data only. Remove those columns and upload again. Nothing was stored.`,
      blockedColumns: blocked,
    };
  }

  const index = new Map(headers.map((h, i) => [h.toLowerCase(), i]));
  const missing = PATIENT_COLUMNS.filter((c) => !index.has(c.column)).map((c) => c.column);
  if (missing.length) {
    return { ok: false, error: `Missing required columns: ${missing.join(", ")}. See /data/patient_schema.ts.`, blockedColumns: [] };
  }
  const known = new Set([...PATIENT_COLUMNS.map((c) => c.column), ...IGNORED_COLUMNS]);
  const ignoredColumns = headers.filter((h) => !known.has(h.toLowerCase()) || IGNORED_COLUMNS.includes(h.toLowerCase()));

  const patients: Patient[] = [];
  const rejectedRows: DataQuality["rejectedRows"] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((cells, i) => {
    const rowNo = i + 2; // 1-based, header is row 1
    const values: Record<string, string | number> = {};
    for (const spec of PATIENT_COLUMNS) {
      const raw = (cells[index.get(spec.column)!] ?? "").trim();
      const k = spec.kind;
      if (raw === "") return rejectedRows.push({ row: rowNo, reason: `${spec.column} is empty` });
      if (k.type === "int") {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < k.min || n > k.max) return rejectedRows.push({ row: rowNo, reason: `${spec.column} must be a whole number ${k.min}-${k.max}` });
        values[spec.column] = n;
      } else if (k.type === "enum") {
        const v = k.values.find((x) => x.toLowerCase() === raw.toLowerCase());
        if (!v) return rejectedRows.push({ row: rowNo, reason: `${spec.column} "${raw}" is not one of: ${k.values.join(", ")}` });
        values[spec.column] = v;
      } else values[spec.column] = raw;
    }
    if (Object.keys(values).length !== PATIENT_COLUMNS.length) return; // a rejection was recorded above
    const id = String(values.patient_id);
    if (seen.has(id)) return rejectedRows.push({ row: rowNo, reason: `duplicate patient_id ${id}` });
    seen.add(id);
    patients.push({
      id,
      age: values.age as number,
      neighborhood: String(values.neighborhood),
      preferredLanguage: String(values.preferred_language),
      occupation: String(values.occupation),
      workSchedule: values.work_schedule as Patient["workSchedule"],
      transport: values.transport as Patient["transport"],
      commuteMinutes: values.commute_minutes_one_way as number,
      insurance: values.insurance as Patient["insurance"],
      childrenUnder6: values.children_under_6 as number,
      childcareAvailable: values.childcare_available as Patient["childcareAvailable"],
      canTakeUnpaidTimeOff: values.can_take_unpaid_time_off as Patient["canTakeUnpaidTimeOff"],
      missedAppointments: values.missed_appointments_last_12mo as number,
    });
  });

  if (!patients.length) return { ok: false, error: `No valid rows. First problems: ${rejectedRows.slice(0, 3).map((r) => `row ${r.row}: ${r.reason}`).join("; ")}`, blockedColumns: [] };

  return {
    ok: true,
    patients,
    quality: { rows: table.length - 1, accepted: patients.length, rejectedRows, ignoredColumns },
  };
}
