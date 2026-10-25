// Shared types for Trial Mirror. Mock data and (later) the real backend both
// produce these shapes, so components never need to know where data came from.

export type LanguageGroup = "Spanish" | "Haitian Creole" | "English" | "Portuguese";

/** Languages the plain-language summary is drafted in. */
export type SummaryLanguage = "en" | "es" | "ht";

export type VisitTime = "morning" | "afternoon" | "evening";

export type FrictionCategory =
  | "schedule"
  | "transport"
  | "fasting"
  | "childcare"
  | "cost"
  | "language"
  | "closure";

export interface Visit {
  id: string;
  number: number;
  name: string;
  week: number;
  time: VisitTime;
  /** Clock time shown to people, e.g. "7:30 AM". */
  startTime: string;
  fasting: boolean;
  durationHours: number;
  procedures: string[];
}

export interface EligibilityRule {
  id: string;
  kind: "inclusion" | "exclusion";
  criterion: string;
  /** Field in the synthetic record the rule reads. */
  field: string;
  /** How a coordinator would actually check it (chart review, phone question, lab...). */
  check: string;
  costPerCheck: number;
  /** Share of all ineligible people this check alone rules out (0-1). */
  shareIneligibleRuledOut: number;
  /** Share of people the rule cannot decide because data is missing (0-1). */
  uncertainShare: number;
}

export interface Trial {
  id: string;
  title: string;
  shortTitle: string;
  condition: string;
  sponsor: string;
  site: string;
  neighborhood: string;
  phase: string;
  enrollmentTarget: number;
  durationWeeks: number;
  visits: Visit[];
  rules: EligibilityRule[];
  /** Week of the trial a hurricane closure is simulated in. */
  stormWeek: number;
  stormVisitId: string;
  questionsForResearchTeam: string[];
}

export interface SyntheticPerson {
  id: string;
  synthetic: true;
  age: number;
  language: LanguageGroup;
  zip: string;
  occupation: string;
  insurance: "employer" | "medicare" | "medicaid" | "uninsured";
  commute: "bus" | "car" | "rideshare" | "walk";
  workShift: "day" | "night" | "rotation" | "variable" | "retired";
  dependents: number;
}

export interface Persona {
  id: string;
  label: string;
  archetype: string;
  summary: string;
  constraints: string[];
  person: SyntheticPerson;
}

/** What-if toggles a CHW can flip. */
export interface Scenario {
  eveningVisits: boolean;
  rideVouchers: boolean;
  stormWeek: boolean;
}

/** Adjustable scenario assumptions. These are knobs, never predictions. */
export interface Assumptions {
  weights: Record<FrictionCategory, number>;
  /** Friction at or above this means the practice participant drops out. */
  dropoutThreshold: number;
  /** Chance a person at a barrier visit actually leaves the trial. */
  dropProbAtBarrier: number;
  /** Chance of leaving at any visit for unrelated reasons. */
  baselineDropProb: number;
  /** Chance outreach reaches an eligible person, by language group. */
  reachProbability: Record<LanguageGroup, number>;
}

export type FunnelStageKey = "population" | "eligible" | "reachable" | "completes";

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  count: number;
}

export interface FunnelResult {
  trialId: string;
  scenario: Scenario;
  stages: FunnelStage[];
  byLanguage: { language: LanguageGroup; stages: FunnelStage[] }[];
}

export interface BarrierResult {
  personaId: string;
  visitId: string;
  /** 0 (no friction) to 1 (cannot attend). */
  friction: number;
  reason: string;
  categories: FrictionCategory[];
  dropsOut: boolean;
}

export interface RankedBarrier {
  id: string;
  visitId: string;
  label: string;
  reason: string;
  personaIds: string[];
  maxFriction: number;
  suggestedFix: string;
}

export interface FalseExclusionPoint {
  missingPct: number;
  falseExclusionRate: number;
  uncertainRate: number;
}

export type DraftKind = "summary" | "accommodation";
export type DraftStatus = "pending" | "approved";

export interface Draft {
  id: string;
  trialId: string;
  kind: DraftKind;
  language: SummaryLanguage;
  title: string;
  text: string;
  status: DraftStatus;
  approvedBy: string | null;
  approvedAt: string | null;
}

export type AgentStepStatus = "pending" | "running" | "done";

export interface ToolCall {
  tool: string;
  input: unknown;
  output: unknown;
}

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStepStatus;
  summary: string;
  toolCall: ToolCall | null;
}
