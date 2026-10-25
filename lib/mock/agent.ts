import type { AgentStep, Trial } from "@/lib/types";

// Canned agent run. Every step comes back "done"; the UI reveals them one at a
// time so the demo shows the agent working.

export function buildAgentRun(trial: Trial): AgentStep[] {
  const fastingVisits = trial.visits.filter((v) => v.fasting);
  const ordered = [...trial.rules].sort(
    (a, b) => b.shareIneligibleRuledOut / b.costPerCheck - a.shareIneligibleRuledOut / a.costPerCheck,
  );

  return [
    {
      id: "plan",
      label: "Plan",
      status: "done",
      summary: "6-step plan: fetch, extract, eligibility, prescreen order, visit simulation, drafts.",
      toolCall: {
        tool: "planner.make_plan",
        input: { goal: "Find avoidable screening cost and visit barriers", trialId: trial.id, population: "synthetic-miami-v3" },
        output: { steps: ["fetch_trial", "extract_criteria", "run_eligibility", "order_prescreen", "simulate_visits", "draft_documents"] },
      },
    },
    {
      id: "fetch",
      label: "Fetch trial",
      status: "done",
      summary: `${trial.id}: ${trial.shortTitle}, ${trial.phase}, recruiting at ${trial.site}.`,
      toolCall: {
        tool: "clinicaltrials.get_study",
        input: { nctId: trial.id, cache: "demo" },
        output: { nctId: trial.id, title: trial.title, phase: trial.phase, status: "RECRUITING", location: `${trial.neighborhood}, Miami, FL`, enrollment: trial.enrollmentTarget },
      },
    },
    {
      id: "extract",
      label: "Extract criteria",
      status: "done",
      summary: `${trial.rules.length} rules and ${trial.visits.length} visits extracted (${fastingVisits.length} fasting).`,
      toolCall: {
        tool: "criteria.extract",
        input: { source: "eligibilityModule.eligibilityCriteria", schema: "EligibilityRule[]" },
        output: {
          rules: trial.rules.map((r) => ({ id: r.id, kind: r.kind, criterion: r.criterion, field: r.field })),
          visits: trial.visits.map((v) => ({ id: v.id, week: v.week, start: v.startTime, fasting: v.fasting })),
        },
      },
    },
    {
      id: "eligibility",
      label: "Run eligibility rules",
      status: "done",
      summary: "Rules run on 5,000 synthetic Miami adults. Missing fields are marked uncertain, never excluded.",
      toolCall: {
        tool: "eligibility.run_rules",
        input: { population: "synthetic-miami-v3", n: 5000, missingPolicy: "mark_uncertain" },
        output: { evaluated: 5000, perRule: trial.rules.map((r) => ({ id: r.id, ruledOut: r.shareIneligibleRuledOut, uncertain: r.uncertainShare })) },
      },
    },
    {
      id: "prescreen",
      label: "Order prescreen checks",
      status: "done",
      summary: `Cheapest high-yield first: "${ordered[0].criterion}" then "${ordered[1].criterion}". Costly checks moved last.`,
      toolCall: {
        tool: "prescreen.order_checks",
        input: { objective: "max ruled_out / cost", rules: trial.rules.map((r) => r.id) },
        output: { order: ordered.map((r, i) => ({ rank: i + 1, id: r.id, costPerCheck: r.costPerCheck })) },
      },
    },
    {
      id: "simulate",
      label: "Simulate visits",
      status: "done",
      summary: `5 practice participants walked through ${trial.visits.length} visits. First big drop: Visit ${fastingVisits[0]?.number ?? 1} (fasting, ${fastingVisits[0]?.startTime ?? "morning"}).`,
      toolCall: {
        tool: "burden.simulate_visits",
        input: { personas: 5, visits: trial.visits.map((v) => v.id), scenario: { eveningVisits: false, rideVouchers: false, stormWeek: false } },
        output: { dropoutVisit: fastingVisits[0]?.id, topBarrier: "early fasting visit after night shift", note: "SYNTHETIC — not a prediction about real people" },
      },
    },
    {
      id: "draft",
      label: "Draft documents",
      status: "done",
      summary: "Drafted barrier report, plain-language summary (English, Spanish, Haitian Creole) and accommodation request.",
      toolCall: {
        tool: "docs.draft",
        input: { kinds: ["barrier_report", "summary", "accommodation"], languages: ["en", "es", "ht"], readingLevel: "grade 6" },
        output: { drafts: 4, status: "pending", requiresReview: "CHW" },
      },
    },
    {
      id: "approval",
      label: "Awaiting approval",
      status: "done",
      summary: "Nothing is exported until a community health worker reviews and approves it.",
      toolCall: null,
    },
  ];
}
