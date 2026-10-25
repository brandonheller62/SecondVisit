import type { Trial } from "@/lib/types";

// Demo trials. IDs, sites and sponsors are fictional placeholders; swap in a
// cached real ClinicalTrials.gov record when the backend exists.

export const t2dTrial: Trial = {
  id: "NCT90000001",
  title:
    "A 26-Week Study of an Investigational Once-Weekly Medicine in Adults with Type 2 Diabetes and Fatty Liver (MASLD)",
  shortTitle: "Type 2 diabetes + fatty liver",
  condition: "Type 2 diabetes with fatty liver disease",
  sponsor: "Demo Sponsor A (mock)",
  site: "Bayside Clinical Research Center (mock)",
  neighborhood: "Hialeah",
  phase: "Phase 2",
  enrollmentTarget: 120,
  durationWeeks: 26,
  stormWeek: 12,
  stormVisitId: "t2d-v5",
  visits: [
    { id: "t2d-v1", number: 1, name: "Screening", week: 0, time: "afternoon", startTime: "1:00 PM", fasting: false, durationHours: 3, procedures: ["Consent", "Medical history", "Blood draw"] },
    { id: "t2d-v2", number: 2, name: "Baseline scan", week: 2, time: "morning", startTime: "10:00 AM", fasting: false, durationHours: 2, procedures: ["Liver MRI", "Questionnaires"] },
    { id: "t2d-v3", number: 3, name: "First dose", week: 4, time: "afternoon", startTime: "2:00 PM", fasting: false, durationHours: 1.5, procedures: ["Injection training", "Vitals"] },
    { id: "t2d-v4", number: 4, name: "Fasting labs + glucose test", week: 8, time: "morning", startTime: "7:30 AM", fasting: true, durationHours: 2.5, procedures: ["10-hour fast", "Oral glucose test", "Blood draw"] },
    { id: "t2d-v5", number: 5, name: "Safety check", week: 12, time: "afternoon", startTime: "3:00 PM", fasting: false, durationHours: 1.5, procedures: ["Vitals", "Blood draw"] },
    { id: "t2d-v6", number: 6, name: "Fasting labs + scan", week: 20, time: "morning", startTime: "7:30 AM", fasting: true, durationHours: 3, procedures: ["10-hour fast", "Liver MRI", "Blood draw"] },
    { id: "t2d-v7", number: 7, name: "End of study", week: 26, time: "afternoon", startTime: "2:00 PM", fasting: false, durationHours: 1, procedures: ["Vitals", "Exit questionnaire"] },
  ],
  rules: [
    { id: "t2d-r1", kind: "inclusion", criterion: "Age 18–75", field: "age", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.14, uncertainShare: 0.0 },
    { id: "t2d-r2", kind: "inclusion", criterion: "Diagnosed type 2 diabetes", field: "dx_t2d", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.52, uncertainShare: 0.06 },
    { id: "t2d-r3", kind: "exclusion", criterion: "Currently on insulin", field: "meds_insulin", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.11, uncertainShare: 0.09 },
    { id: "t2d-r4", kind: "inclusion", criterion: "BMI 27–45", field: "bmi", check: "Self-reported height/weight", costPerCheck: 1, shareIneligibleRuledOut: 0.09, uncertainShare: 0.18 },
    { id: "t2d-r5", kind: "inclusion", criterion: "A1c 7.0–10.5%", field: "a1c", check: "Chart review", costPerCheck: 12, shareIneligibleRuledOut: 0.21, uncertainShare: 0.31 },
    { id: "t2d-r6", kind: "exclusion", criterion: "Heavy alcohol use", field: "alcohol", check: "Screening questionnaire", costPerCheck: 4, shareIneligibleRuledOut: 0.04, uncertainShare: 0.22 },
    { id: "t2d-r7", kind: "inclusion", criterion: "Liver fat ≥ 8% on MRI", field: "liver_fat", check: "MRI at screening", costPerCheck: 450, shareIneligibleRuledOut: 0.17, uncertainShare: 0.64 },
  ],
  questionsForResearchTeam: [
    "Can the 7:30 AM fasting visits (4 and 6) be offered as late-afternoon or evening visits with a daytime fast?",
    "Does the study cover rides or bus passes, and are they paid up front or reimbursed later?",
    "Is consent and the questionnaire available in Haitian Creole, with an interpreter on site?",
    "If the clinic closes for a storm in week 12, how wide is the window to reschedule Visit 5?",
    "Is there payment for time, and does it arrive in time to cover a missed shift?",
    "Can children wait on site during the 3-hour visits?",
  ],
};

export const htnTrial: Trial = {
  id: "NCT90000002",
  title:
    "Home Blood Pressure Monitoring Plus a Once-Daily Combination Pill for Uncontrolled Hypertension",
  shortTitle: "Hypertension",
  condition: "Uncontrolled high blood pressure",
  sponsor: "Demo Academic Center (mock)",
  site: "Northside Community Heart Clinic (mock)",
  neighborhood: "Little Haiti",
  phase: "Phase 3",
  enrollmentTarget: 200,
  durationWeeks: 24,
  stormWeek: 8,
  stormVisitId: "htn-v4",
  visits: [
    { id: "htn-v1", number: 1, name: "Screening", week: 0, time: "morning", startTime: "9:30 AM", fasting: false, durationHours: 2, procedures: ["Consent", "Blood pressure", "Blood draw"] },
    { id: "htn-v2", number: 2, name: "Device setup", week: 1, time: "afternoon", startTime: "1:30 PM", fasting: false, durationHours: 1.5, procedures: ["Home BP cuff training", "App setup"] },
    { id: "htn-v3", number: 3, name: "Start medicine", week: 4, time: "morning", startTime: "8:00 AM", fasting: true, durationHours: 2, procedures: ["Fasting labs", "First dose"] },
    { id: "htn-v4", number: 4, name: "24-hour BP monitor", week: 8, time: "afternoon", startTime: "2:00 PM", fasting: false, durationHours: 1, procedures: ["Wear monitor 24 hours", "Return next day"] },
    { id: "htn-v5", number: 5, name: "Dose check", week: 16, time: "afternoon", startTime: "3:30 PM", fasting: false, durationHours: 1, procedures: ["Vitals", "Pill count"] },
    { id: "htn-v6", number: 6, name: "End of study", week: 24, time: "morning", startTime: "8:00 AM", fasting: true, durationHours: 2, procedures: ["Fasting labs", "Exit questionnaire"] },
  ],
  rules: [
    { id: "htn-r1", kind: "inclusion", criterion: "Age 30–80", field: "age", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.18, uncertainShare: 0.0 },
    { id: "htn-r2", kind: "inclusion", criterion: "Diagnosed hypertension on 0–2 medicines", field: "dx_htn", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.46, uncertainShare: 0.08 },
    { id: "htn-r3", kind: "exclusion", criterion: "Kidney disease stage 4+", field: "egfr", check: "Chart review", costPerCheck: 12, shareIneligibleRuledOut: 0.06, uncertainShare: 0.27 },
    { id: "htn-r4", kind: "inclusion", criterion: "Office BP 140–179 systolic", field: "sbp", check: "BP at screening visit", costPerCheck: 85, shareIneligibleRuledOut: 0.24, uncertainShare: 0.41 },
    { id: "htn-r5", kind: "exclusion", criterion: "Pregnant or planning pregnancy", field: "pregnancy", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.03, uncertainShare: 0.05 },
    { id: "htn-r6", kind: "inclusion", criterion: "Owns a smartphone", field: "smartphone", check: "Ask at first call", costPerCheck: 0.5, shareIneligibleRuledOut: 0.07, uncertainShare: 0.02 },
  ],
  questionsForResearchTeam: [
    "Can the 8:00 AM fasting visits (3 and 6) move to the evening?",
    "Can the 24-hour monitor be returned by mail or at a closer drop-off point?",
    "Is the home BP app available in Haitian Creole and Spanish?",
    "If a storm closes the clinic in week 8, can the monitor visit be done at home?",
    "Does the study provide a phone or data plan for people without one?",
  ],
};

export const trials: Trial[] = [t2dTrial, htnTrial];
