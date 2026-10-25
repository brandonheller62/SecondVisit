// Column contract for patient CSV uploads. Only de-identified, synthetic data.
// lib/scoring/parsePatients.ts validates every upload against this file.

import { INSURANCES, TRANSPORTS, WORK_SCHEDULES, YES_NO_NA } from "../lib/types";

export type ColumnKind =
  | { type: "id" }
  | { type: "int"; min: number; max: number }
  | { type: "text" }
  | { type: "enum"; values: readonly string[] };

export interface ColumnSpec {
  column: string;
  kind: ColumnKind;
  description: string;
}

/** Required columns. Order does not matter; header names are matched case-insensitively. */
export const PATIENT_COLUMNS: ColumnSpec[] = [
  { column: "patient_id", kind: { type: "id" }, description: "Study-assigned pseudonymous ID, e.g. SYN-001" },
  { column: "age", kind: { type: "int", min: 18, max: 110 }, description: "Age in years" },
  { column: "neighborhood", kind: { type: "text" }, description: "Neighborhood (group reporting only, not scored)" },
  { column: "preferred_language", kind: { type: "text" }, description: "Language the person prefers for visits and materials" },
  { column: "occupation", kind: { type: "text" }, description: "Broad job category" },
  { column: "work_schedule", kind: { type: "enum", values: WORK_SCHEDULES }, description: "day shift, night shift, irregular, none" },
  { column: "transport", kind: { type: "enum", values: TRANSPORTS }, description: "How the person usually gets to the clinic" },
  { column: "commute_minutes_one_way", kind: { type: "int", min: 0, max: 400 }, description: "Door-to-clinic minutes, one way" },
  { column: "insurance", kind: { type: "enum", values: INSURANCES }, description: "Coverage type" },
  { column: "children_under_6", kind: { type: "int", min: 0, max: 15 }, description: "Number of children under 6 at home" },
  { column: "childcare_available", kind: { type: "enum", values: YES_NO_NA }, description: "yes, no, n/a" },
  { column: "can_take_unpaid_time_off", kind: { type: "enum", values: YES_NO_NA }, description: "yes, no, n/a" },
  { column: "missed_appointments_last_12mo", kind: { type: "int", min: 0, max: 100 }, description: "Missed clinic appointments in the last 12 months" },
];

/**
 * Columns that are accepted but never used. Medical eligibility is decided by
 * the research team, not this tool, so clinical fields are dropped on parse.
 */
export const IGNORED_COLUMNS = ["diagnosis_group", "a1c"];

/**
 * Any header matching one of these makes the whole file rejected: the tool
 * only accepts de-identified data. Matched against the header with spaces,
 * dashes and underscores removed, lowercased.
 */
export const IDENTIFYING_COLUMN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "name", pattern: /^(full|first|last|middle|given|family|sur|patient|maiden)?name$|^(fname|lname)$/ },
  { label: "phone", pattern: /phone|mobile|cell|telephone|^tel$|fax/ },
  { label: "email", pattern: /email|e_?mail/ },
  { label: "street address", pattern: /address|street|^addr|aptnumber|^apt$/ },
  { label: "date of birth", pattern: /^dob$|birth|birthday|dateofbirth/ },
  { label: "SSN", pattern: /ssn|socialsecurity|^sin$/ },
  { label: "MRN / record number", pattern: /mrn|medicalrecord|recordnumber|chartnumber|^chart$|accountnumber|healthplanid|memberid|policynumber|insuranceid|medicaidid|medicareid/ },
  { label: "license / passport", pattern: /license|licence|passport|driversid/ },
  { label: "exact location", pattern: /^(lat|latitude|lon|lng|longitude)$|^zip(code)?$|^postal|ipaddress|^ip$/ },
  { label: "photo / biometric", pattern: /photo|face|fingerprint|biometric/ },
];
