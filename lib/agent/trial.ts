// fetch_trial: ClinicalTrials.gov API v2, single study endpoint.
//   GET https://clinicaltrials.gov/api/v2/studies/{nctId}
// Field paths verified against a live response on 2026-10-25:
//   protocolSection.identificationModule.{nctId, briefTitle, officialTitle}
//   protocolSection.statusModule.overallStatus
//   protocolSection.conditionsModule.conditions[]
//   protocolSection.eligibilityModule.eligibilityCriteria
//   protocolSection.descriptionModule.{briefSummary, detailedDescription}
//   protocolSection.outcomesModule.{primaryOutcomes,secondaryOutcomes}[].{measure,timeFrame}
//   protocolSection.armsInterventionsModule.{armGroups,interventions}[].description
//   protocolSection.contactsLocationsModule.locations[].{facility, city, state, country}
// On failure we fall back to /data/trials/{nctId}.json and say so.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NCT_PATTERN } from "../nct";
import type { TrialInfo } from "../types";



/* eslint-disable @typescript-eslint/no-explicit-any */
type Study = { protocolSection?: any };

function toTrialInfo(study: Study, source: TrialInfo["source"], sourceNote: string): TrialInfo {
  const p = study.protocolSection ?? {};
  const outcomes = [...(p.outcomesModule?.primaryOutcomes ?? []), ...(p.outcomesModule?.secondaryOutcomes ?? [])];
  const arms = [...(p.armsInterventionsModule?.armGroups ?? []), ...(p.armsInterventionsModule?.interventions ?? [])];
  const description = [
    p.descriptionModule?.briefSummary,
    p.descriptionModule?.detailedDescription,
    ...arms.map((a: any) => a.description).filter(Boolean),
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    nctId: p.identificationModule?.nctId ?? "unknown",
    title: p.identificationModule?.briefTitle ?? p.identificationModule?.officialTitle ?? "unknown",
    conditions: p.conditionsModule?.conditions ?? [],
    overallStatus: p.statusModule?.overallStatus ?? "unknown",
    eligibilityText: p.eligibilityModule?.eligibilityCriteria ?? "",
    description,
    outcomeTimeFrames: outcomes.map((o: any) => `${o.measure ?? "Outcome"}: ${o.timeFrame ?? "time frame not stated"}`),
    locations: (p.contactsLocationsModule?.locations ?? []).map((l: any) => ({
      facility: l.facility ?? "unknown",
      city: l.city ?? "unknown",
      state: l.state ?? "",
      country: l.country ?? "",
    })),
    source,
    sourceNote,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function readCache(nctId: string): Promise<Study | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "trials", `${nctId}.json`), "utf8");
    return JSON.parse(raw) as Study;
  } catch {
    return null;
  }
}

export async function fetchTrial(nctIdRaw: string): Promise<TrialInfo> {
  const nctId = nctIdRaw.trim().toUpperCase();
  if (!NCT_PATTERN.test(nctId)) throw new Error(`"${nctIdRaw}" is not a valid NCT ID (expected NCT followed by 8 digits).`);

  let liveError = "";
  try {
    const res = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (res.ok) return toTrialInfo((await res.json()) as Study, "live", "Fetched live from ClinicalTrials.gov.");
    liveError = res.status === 404 ? `ClinicalTrials.gov has no study ${nctId} (404)` : `ClinicalTrials.gov returned HTTP ${res.status}`;
  } catch (e) {
    liveError = `ClinicalTrials.gov could not be reached (${e instanceof Error ? e.message : String(e)})`;
  }

  const cached = await readCache(nctId);
  if (cached) return toTrialInfo(cached, "cache", `${liveError}. Used the cached copy bundled with the app; it may be out of date.`);
  throw new Error(`${liveError}, and there is no cached copy for ${nctId}.`);
}

/** The text the schedule extractor reads. */
export function trialText(t: TrialInfo): string {
  return [
    `Title: ${t.title}`,
    `Conditions: ${t.conditions.join("; ")}`,
    `Description and arms:\n${t.description || "(none)"}`,
    `Outcome time frames:\n${t.outcomeTimeFrames.join("\n") || "(none)"}`,
    `Eligibility criteria:\n${t.eligibilityText || "(none)"}`,
  ].join("\n\n");
}
