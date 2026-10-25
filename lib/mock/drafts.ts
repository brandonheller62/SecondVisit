import type { Draft, SummaryLanguage } from "@/lib/types";

// Machine-drafted text. Spanish and Haitian Creole are sample translations
// and must be checked by a fluent CHW before anything leaves the app.

type Texts = { summary: Record<SummaryLanguage, string>; accommodation: string };

const texts: Record<string, Texts> = {
  NCT90000001: {
    summary: {
      en: `This is a research study for adults with type 2 diabetes and fatty liver. It tests a medicine that is not approved yet, given as a shot once a week.

The study lasts about 6 months. There are 7 visits at a clinic in Hialeah.
• Two visits start at 7:30 in the morning. You cannot eat for 10 hours before them.
• The longest visit takes about 3 hours.
• Two visits include an MRI scan of the liver.

Joining is your choice. You can stop at any time.

This summary does not say whether you can join. Only the study team can decide that. It is not medical advice.`,
      es: `Este es un estudio de investigación para adultos con diabetes tipo 2 e hígado graso. Prueba un medicamento que todavía no está aprobado. Se pone como una inyección una vez por semana.

El estudio dura unos 6 meses. Hay 7 visitas en una clínica en Hialeah.
• Dos visitas empiezan a las 7:30 de la mañana. No puede comer durante 10 horas antes.
• La visita más larga dura unas 3 horas.
• Dos visitas incluyen una resonancia (MRI) del hígado.

Participar es su decisión. Puede dejar el estudio en cualquier momento.

Este resumen no dice si usted puede participar. Solo el equipo del estudio puede decidirlo. No es un consejo médico.`,
      ht: `Sa a se yon etid rechèch pou granmoun ki gen dyabèt tip 2 ak grès nan fwa. Li teste yon medikaman ki poko apwouve. Yo bay li an piki yon fwa chak semèn.

Etid la dire anviwon 6 mwa. Gen 7 vizit nan yon klinik nan Hialeah.
• De vizit kòmanse a 7:30 nan maten. Ou pa ka manje pandan 10 èdtan anvan.
• Vizit ki pi long lan pran anviwon 3 èdtan.
• De vizit gen yon eskanè MRI pou fwa a.

Se ou ki deside si ou vle patisipe. Ou ka kite etid la nenpòt ki lè.

Rezime sa a pa di si ou ka patisipe. Se sèlman ekip etid la ki ka deside sa. Sa a pa yon konsèy medikal.`,
    },
    accommodation: `To: Study coordinator, Bayside Clinical Research Center
Re: Accommodation requests for NCT90000001

We ran a practice walk-through of this study's visit schedule using synthetic (made-up) participants based on Miami neighborhoods. No real people were assessed. Based on that run, we ask the study team to consider:

1. Evening option for Visits 4 and 6. The 7:30 AM fasting visits were the biggest barrier for night-shift workers. A late-afternoon visit with a daytime fast removed that barrier in the practice run.
2. Ride vouchers paid up front, not reimbursed later. Bus-only participants faced two transfers each way.
3. Consent and questionnaires in Haitian Creole and Spanish, with an interpreter on site.
4. A rescheduling window of at least ±7 days for Visit 5, in case of a storm closure in week 12.
5. A place for children to wait during the 3-hour visits.

Thank you,
[CHW name], Community Health Worker`,
  },
  NCT90000002: {
    summary: {
      en: `This is a research study for adults whose blood pressure is still high. It tests a once-a-day pill plus checking your blood pressure at home.

The study lasts about 6 months. There are 6 visits at a clinic in Little Haiti.
• Two visits start at 8:00 in the morning. You cannot eat before them.
• For one visit you wear a blood pressure monitor for 24 hours and bring it back the next day.
• You need a smartphone for the home blood pressure app.

Joining is your choice. You can stop at any time.

This summary does not say whether you can join. Only the study team can decide that. It is not medical advice.`,
      es: `Este es un estudio de investigación para adultos que todavía tienen la presión alta. Prueba una pastilla diaria y medir la presión en casa.

El estudio dura unos 6 meses. Hay 6 visitas en una clínica en Little Haiti.
• Dos visitas empiezan a las 8:00 de la mañana. No puede comer antes.
• En una visita usted lleva un monitor de presión por 24 horas y lo devuelve al día siguiente.
• Necesita un teléfono inteligente para la aplicación de presión.

Participar es su decisión. Puede dejar el estudio en cualquier momento.

Este resumen no dice si usted puede participar. Solo el equipo del estudio puede decidirlo. No es un consejo médico.`,
      ht: `Sa a se yon etid rechèch pou granmoun ki toujou gen tansyon wo. Li teste yon grenn pou pran chak jou, ansanm ak tcheke tansyon ou lakay ou.

Etid la dire anviwon 6 mwa. Gen 6 vizit nan yon klinik nan Ti Ayiti.
• De vizit kòmanse a 8:00 nan maten. Ou pa ka manje anvan.
• Pou yon vizit, ou mete yon aparèy tansyon pandan 24 èdtan epi ou pote l tounen nan demen.
• Ou bezwen yon telefòn entèlijan pou aplikasyon tansyon an.

Se ou ki deside si ou vle patisipe. Ou ka kite etid la nenpòt ki lè.

Rezime sa a pa di si ou ka patisipe. Se sèlman ekip etid la ki ka deside sa. Sa a pa yon konsèy medikal.`,
    },
    accommodation: `To: Study coordinator, Northside Community Heart Clinic
Re: Accommodation requests for NCT90000002

We ran a practice walk-through of this study's visit schedule using synthetic (made-up) participants based on Miami neighborhoods. No real people were assessed. Based on that run, we ask the study team to consider:

1. Evening option for the 8:00 AM fasting Visits 3 and 6.
2. Mail-back or neighborhood drop-off for the 24-hour monitor (Visit 4).
3. The home blood pressure app in Haitian Creole and Spanish.
4. A home-visit backup for Visit 4 if a storm closes the clinic in week 8.
5. Ride vouchers for participants without a car.

Thank you,
[CHW name], Community Health Worker`,
  },
};

const titles: Record<SummaryLanguage, string> = {
  en: "Plain-language summary (English)",
  es: "Resumen en lenguaje sencillo (Español)",
  ht: "Rezime an lang senp (Kreyòl ayisyen)",
};

export function buildDrafts(trialId: string): Draft[] {
  const t = texts[trialId];
  if (!t) return [];
  const base = { trialId, status: "pending" as const, approvedBy: null, approvedAt: null };
  return [
    ...(Object.keys(t.summary) as SummaryLanguage[]).map((language) => ({
      ...base,
      id: `${trialId}-summary-${language}`,
      kind: "summary" as const,
      language,
      title: titles[language],
      text: t.summary[language],
    })),
    {
      ...base,
      id: `${trialId}-accommodation-en`,
      kind: "accommodation" as const,
      language: "en" as const,
      title: "Accommodation request",
      text: t.accommodation,
    },
  ];
}
