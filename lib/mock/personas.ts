import type { LanguageGroup, Persona } from "@/lib/types";

// Five synthetic archetypes. None of these are real people.

export const personas: Persona[] = [
  {
    id: "p-nightshift",
    label: "Hotel night-shift worker",
    archetype: "Works 11 PM–7 AM, bus-only commute",
    summary: "Housekeeping supervisor at a Miami Beach hotel. Sleeps mornings after the shift ends.",
    constraints: ["Night shift ends 7 AM", "Two buses each way", "Eats a meal at 4 AM break"],
    person: { id: "syn-0412", synthetic: true, age: 46, language: "Spanish", zip: "33012", occupation: "Hotel housekeeping supervisor", insurance: "employer", commute: "bus", workShift: "night", dependents: 1 },
  },
  {
    id: "p-retiree",
    label: "Spanish-speaking retiree",
    archetype: "Retired, relies on family for rides",
    summary: "Lives with a daughter who drives on weekends. Prefers forms in Spanish.",
    constraints: ["No car", "Daughter works weekdays", "Prefers Spanish forms"],
    person: { id: "syn-1187", synthetic: true, age: 68, language: "Spanish", zip: "33135", occupation: "Retired", insurance: "medicare", commute: "rideshare", workShift: "retired", dependents: 0 },
  },
  {
    id: "p-parent",
    label: "Haitian Creole-speaking parent",
    archetype: "Two kids under 6, school pickup at 3 PM",
    summary: "Works part-time in a daycare. No childcare during long visits.",
    constraints: ["School pickup 3 PM", "Kids under 6", "Prefers Creole", "Bus commute"],
    person: { id: "syn-2033", synthetic: true, age: 34, language: "Haitian Creole", zip: "33137", occupation: "Daycare aide", insurance: "medicaid", commute: "bus", workShift: "day", dependents: 2 },
  },
  {
    id: "p-cruise",
    label: "Cruise-line worker",
    archetype: "Away at sea for weeks at a time",
    summary: "Galley crew on short Caribbean sailings. Phone signal only in port, so reminders often miss.",
    constraints: ["At sea weeks 7–9 and 19–21", "Prefers Portuguese"],
    person: { id: "syn-2760", synthetic: true, age: 39, language: "Portuguese", zip: "33132", occupation: "Cruise galley crew", insurance: "employer", commute: "car", workShift: "rotation", dependents: 0 },
  },
  {
    id: "p-driver",
    label: "Uninsured self-employed driver",
    archetype: "Paid by the trip, no paid time off",
    summary: "Drives for rideshare apps. Every hour at the clinic is an hour not earning.",
    constraints: ["No paid leave", "Uninsured", "Parking costs"],
    person: { id: "syn-3349", synthetic: true, age: 52, language: "English", zip: "33147", occupation: "Rideshare driver", insurance: "uninsured", commute: "car", workShift: "variable", dependents: 1 },
  },
];

/**
 * How much each persona stands in for each language group when we turn
 * persona results into funnel numbers. Rows sum to 1.
 */
export const segmentWeights: Record<LanguageGroup, Partial<Record<string, number>>> = {
  Spanish: { "p-nightshift": 0.4, "p-retiree": 0.35, "p-driver": 0.25 },
  "Haitian Creole": { "p-parent": 0.6, "p-nightshift": 0.25, "p-driver": 0.15 },
  English: { "p-driver": 0.4, "p-nightshift": 0.3, "p-retiree": 0.3 },
  Portuguese: { "p-cruise": 0.7, "p-driver": 0.3 },
};
