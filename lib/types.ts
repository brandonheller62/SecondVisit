// Shared types for Second Visit. The agent route, the scoring code and the UI
// all speak these shapes. Change only by announcement (see README).

/** A value the source did not state. Shown as "unknown" in the UI, never guessed. */
export type Unknown = "unknown";
export type MaybeUnknown<T> = T | Unknown;

export const isKnown = <T,>(v: MaybeUnknown<T>): v is T => v !== "unknown";

// ---------- Trial ----------

export interface TrialLocation {
  facility: string;
  city: string;
  state: string;
  country: string;
}

export interface TrialInfo {
  nctId: string;
  title: string;
  conditions: string[];
  overallStatus: string;
  eligibilityText: string;
  description: string;
  /** Primary/secondary outcome time frames; often the only schedule hint in a registry record. */
  outcomeTimeFrames: string[];
  locations: TrialLocation[];
  /** "live" = fetched from ClinicalTrials.gov just now; "cache" = bundled copy in /data/trials. */
  source: "live" | "cache";
  sourceNote: string;
}

export type TimeOfDay = "morning" | "any";

export interface Visit {
  id: string;
  label: string;
  week: MaybeUnknown<number>;
  durationMinutes: MaybeUnknown<number>;
  fasting: MaybeUnknown<boolean>;
  timeOfDay: MaybeUnknown<TimeOfDay>;
  procedures: string[];
  inPerson: MaybeUnknown<boolean>;
}

export interface VisitSchedule {
  visits: Visit[];
  /** Languages the trial's consent/materials are offered in, if the text says. */
  materialsLanguages: MaybeUnknown<string[]>;
  /** False when the text had no usable visit schedule; the UI then asks for protocol text. */
  scheduleFound: boolean;
  notes: string;
  source: "registry" | "pasted";
}

// ---------- Patients (synthetic, de-identified) ----------

export const WORK_SCHEDULES = ["day shift", "night shift", "irregular", "none"] as const;
export const TRANSPORTS = ["own car", "bus/Metrorail only", "rideshare", "family ride"] as const;
export const INSURANCES = ["employer", "marketplace", "Medicare", "Medicaid", "uninsured"] as const;
export const YES_NO_NA = ["yes", "no", "n/a"] as const;

export type WorkSchedule = (typeof WORK_SCHEDULES)[number];
export type Transport = (typeof TRANSPORTS)[number];
export type Insurance = (typeof INSURANCES)[number];
export type YesNoNA = (typeof YES_NO_NA)[number];

export interface Patient {
  id: string;
  age: number;
  /** Used for group reporting only, never in the score. */
  neighborhood: string;
  /** Used only to check the trial's materials-language gap, never as a risk predictor. */
  preferredLanguage: string;
  occupation: string;
  workSchedule: WorkSchedule;
  transport: Transport;
  commuteMinutes: number;
  insurance: Insurance;
  childrenUnder6: number;
  childcareAvailable: YesNoNA;
  canTakeUnpaidTimeOff: YesNoNA;
  missedAppointments: number;
}

export interface DataQuality {
  rows: number;
  accepted: number;
  rejectedRows: { row: number; reason: string }[];
  /** Columns present but not used (e.g. clinical fields; eligibility is the research team's call). */
  ignoredColumns: string[];
}

export type ParseResult =
  | { ok: true; patients: Patient[]; quality: DataQuality }
  | { ok: false; error: string; blockedColumns: string[] };

// ---------- Scoring ----------

export const BARRIER_KEYS = ["scheduleClash", "transport", "cost", "childcare", "languageAccess", "missedPrior"] as const;
export type BarrierKey = (typeof BARRIER_KEYS)[number];

export const SUPPORT_KEYS = ["eveningVisits", "rideVouchers", "childcareStipend", "interpreter", "wageReimbursement"] as const;
export type SupportKey = (typeof SUPPORT_KEYS)[number];

export type Tier = "High" | "Medium" | "Low";

/** Whether the trial pays or reimburses participants. Set by the trial team and its ethics board; this tool never suggests amounts. */
export const COMPENSATION_KINDS = ["unknown", "none", "stipend", "travelReimbursed", "stipendAndTravel"] as const;
export type CompensationKind = (typeof COMPENSATION_KINDS)[number];

export interface ParticipantCompensation {
  kind: CompensationKind;
  /** Per-visit stipend as stated in the consent form. null = not entered, so nothing is subtracted. */
  stipendPerVisit: number | null;
}

export type SupportSet = Record<SupportKey, boolean>;

export interface Scenario {
  supports: SupportSet;
}

export interface CellTerm {
  key: BarrierKey;
  /** How strongly the barrier applies at this visit, 0..1. It counts once it reaches countsAt. */
  x: number;
  /** The barrier's points if it counts at this visit, else 0. */
  points: number;
  reason: string;
}

export interface Cell {
  patientId: string;
  visitId: string;
  /** Points of the barriers that count at this visit. */
  points: number;
  dominant: BarrierKey | null;
  terms: CellTerm[];
}

export interface PatientBarrier {
  key: BarrierKey;
  visitId: string;
  visitLabel: string;
  /** Points this barrier adds to the patient's score (it counts at least at one visit). */
  points: number;
  reason: string;
}

export interface PatientScore {
  patientId: string;
  /** Need score: the points of every barrier this patient has, out of maxPoints. */
  points: number;
  maxPoints: number;
  tier: Tier;
  /** The barriers that count, most points first. */
  topBarriers: PatientBarrier[];
  recommendedSupports: SupportKey[];
  /** Estimated out-of-pocket cost per in-person visit, before supports. */
  costPerVisit: number;
  /**
   * What an average visit costs the patient, by component, in dollars and cents, before supports.
   * compensation is what the trial pays back (stipend/travel reimbursement), so
   * travel + lostWages + outOfPocket - compensation = costPerVisit.
   */
  visitCostBreakdown: { travel: number; lostWages: number; outOfPocket: number; compensation: number };
  /** The patient's own cost across all scored visits, before supports. */
  totalCost: number;
}

export interface ScoreResult {
  /** Sorted by points, highest need first. */
  patients: PatientScore[];
  matrix: Cell[];
  /** Visits that count toward the score (in-person or unknown). */
  scoredVisits: Visit[];
  /** Plain-language notes about unknown inputs and how they were handled. */
  unknownNotes: string[];
}

export interface SupportCost {
  support: SupportKey;
  patientsHelped: number;
  cost: number;
}

export interface SimulationResult {
  supports: SupportKey[];
  /** Patients at each need level without and with the selected supports. */
  tiersBefore: Record<Tier, number>;
  tiersAfter: Record<Tier, number>;
  averagePointsBefore: number;
  averagePointsAfter: number;
  costs: SupportCost[];
  totalSupportCost: number;
}

export const GROUP_BYS = ["preferredLanguage", "neighborhood", "transport", "insurance"] as const;
export type GroupBy = (typeof GROUP_BYS)[number];

export interface GroupRow {
  group: string;
  n: number;
  suppressed: boolean;
  /** Average need score; null when suppressed ("Too small to report"). */
  averagePointsBefore: number | null;
  averagePointsAfter: number | null;
}

export interface GroupSummary {
  by: GroupBy;
  rows: GroupRow[];
}

// ---------- Agent run (POST /api/run, newline-delimited JSON) ----------

export type ToolName =
  | "fetch_trial"
  | "extract_visit_schedule"
  | "parse_patients"
  | "score_patients"
  | "simulate_supports"
  | "summarize_groups";

export interface RunRequest {
  nctId: string;
  csv: string;
  /** Visit schedule or protocol text pasted by the user when the registry has none. */
  protocolText?: string;
  /** Defaults to unknown. */
  participantCompensation?: ParticipantCompensation;
}

export type RunStopReason = "needs_schedule" | "finished" | "iteration_cap" | "refusal" | "error";

export type AgentEvent =
  | { type: "step"; id: string; iteration: number; tool: ToolName; status: "running" | "done" | "error"; summary: string; input?: unknown; output?: unknown }
  | { type: "message"; iteration: number; text: string }
  | { type: "trial"; trial: TrialInfo }
  | { type: "schedule"; schedule: VisitSchedule }
  | { type: "simulation"; supports: SupportKey[] }
  | { type: "done"; reason: RunStopReason; message: string };
