# Trial Mirror — YCI Hackathon, Oct 25, 2026

> A retention-support agent for clinical trial teams in Miami-Dade: it reads a real trial's visit schedule, scores how much friction each already-eligible patient would face at each visit, and ranks who should be offered support first.

Miami AI-agent hackathon · Health & Wellbeing track.

## Team

- Brandon Heller
- Girish Raju
- Mateo Gomez-Peck

## The idea

People who qualify for a trial still drop out when visits clash with night shifts, need two buses each way, cost a day's pay, have no childcare, or come with forms in a language they don't read. A research team uploads a CSV of **synthetic, de-identified** patients who are **already medically eligible**. The agent fetches the trial from ClinicalTrials.gov, extracts the visit schedule, scores friction per patient per visit, simulates supports (evening visits, ride vouchers, childcare stipend, interpreter + translated materials, wage & expense reimbursement), and summarizes by group.

**The score decides who gets help first. It is never used to exclude, deprioritize or reject anyone.** It never decides medical eligibility and gives no medical advice.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind 4 + Recharts. Anthropic SDK (`@anthropic-ai/sdk`) for the agent, called from server routes only. Vitest for unit tests. No database.

## Running locally

Needs Node 20+ and an Anthropic API key.

```bash
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY and ANTHROPIC_MODEL
npm run dev                  # http://localhost:3000
npm test                     # scoring unit tests
npm run build                # run before pushing; must pass
```

| Env var | Required | What it is |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes | Anthropic API key. Server-side only. |
| `ANTHROPIC_MODEL` | yes | Claude model id for the agent loop and schedule extraction, e.g. `claude-opus-5-5` or `claude-sonnet-5-5`. Not hardcoded anywhere. |

Without these the app still loads; **Run agent** reports which variable is missing.

Demo path: **Start** → pick the diabetes/fatty-liver demo trial → **Use sample patients** → **Run agent** → watch the steps stream in → **Results** (toggle supports, edit assumptions).

## How the agent works

`POST /api/run` (`app/api/run/route.ts`) runs a real tool-use loop (`lib/agent/loop.ts`): it sends the messages and tool definitions to Claude, runs whatever tools Claude asks for in code, sends the results back, and repeats, capped at 12 iterations. Each step streams to the UI as newline-delimited JSON (step id, tool, status, one-line summary, tool input/output). Tool errors go back to Claude as `is_error` results; the prompt tells it to retry once or continue with the part flagged unknown, never to invent data. The run ends when Claude gives its short closing summary.

| Tool | How it runs |
| --- | --- |
| `fetch_trial(nct_id)` | Code. `GET https://clinicaltrials.gov/api/v2/studies/{nctId}` (field paths verified against a live response, see `lib/agent/trial.ts`). On failure uses `/data/trials/{nctId}.json` and says it used a cached copy. |
| `extract_visit_schedule` | Claude, structured output. Unstated fields come back as `"unknown"`. If there is no schedule, the UI asks for pasted protocol text and re-runs. |
| `parse_patients` | Code. Validates against `/data/patient_schema.ts`; rejects files with name, phone, email, address, DOB, SSN, MRN or similar columns. Returns counts only. |
| `score_patients` | Code (`lib/scoring/score.ts`). |
| `simulate_supports` | Code (`lib/scoring/simulate.ts`). |
| `summarize_groups` | Code. Groups under 10 people → "Too small to report". |

The patient CSV is held in memory for the request and never written to disk or logged. Claude never sees patient rows.

## The algorithm

For patient *p* and visit *v*, each barrier term *k* gets an exposure *x* between 0 and 1 and a weight *w*, and the visit's friction is **f(p,v) = 1 − ∏ₖ (1 − wₖ·xₖ)**. The terms are: **schedule clash** (morning or fasting visit after a night or irregular shift; a daytime visit for a day-shift worker with no time off; visits over 3 hours), **transport** (bus/Metrorail only, over 60 minutes = high, 40–60 = medium; long family rides = medium), **cost** (fare or mileage plus parking, lost pay for daytime visits, uninsured out-of-pocket, divided by a household's spare budget per visit), **childcare** (children under 6 and none available), **language access** (the trial's materials are not offered in the person's language, a gap in the trial and not a trait of the person) and **missed appointments** (off by default because it can encode socioeconomic bias). Across visits, **P(complete) = ∏ᵥ (1 − f(p,v))**, risk of leaving without support = 1 − P(complete), and tiers come from thresholds. Supports switch off the terms they address and the simulation re-scores. Race, ethnicity and immigration status are not inputs; neighborhood is used only for group reporting. All numbers live in `lib/assumptions.ts` with a reason for each and can be edited in the UI.

## Limitations

- **The weights are unvalidated assumptions.** Check them against a past trial's real dropout before any real use.
- Risk compounds over visits, so trials with many visits push more people into High. Compare patients within a trial, not across trials.
- Registry records rarely give visit times, durations or fasting; those show as "unknown". Unknown time of day is not scored as a morning clash, so need may be understated; unknown duration uses an assumed length; unknown in-person status is scored as in person.
- The data has no paid-leave column; the default assumes hourly workers lose pay for daytime visits.
- Synthetic demo data only. No medical questions are answered: talk to a clinician, or call 911 in an emergency.

## Responsible AI

Synthetic demo data only · uploads must be de-identified, and identifying columns are rejected · rows are never stored or logged · the LLM sees aggregates and patient IDs only · no eligibility decisions · no medical answers · groups under 10 suppressed · limitations box in the UI.

## Who owns what

Agree on `lib/types.ts` first, then change it only by announcement. Pull right before editing a shared file, keep the change small, push right away.

| Area | Owner | Files |
| --- | --- | --- |
| Agent | Girish | `app/api/run/route.ts`, `app/api/sample-patients/route.ts`, `lib/agent/*` (loop, tools, prompts, trial fetch) |
| Algorithm | Mateo | `lib/scoring/*`, `lib/assumptions.ts`, `lib/scoring/__tests__/*` |
| UI | Brandon | `components/*`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `lib/format.ts` |
| Data | shared | `data/synthetic_patients.csv`, `data/patient_schema.ts`, `data/trials/*.json` |
| Shared types | announce changes | `lib/types.ts`, `lib/nct.ts` |

## How we work

- We push straight to `main`. Don't push code that breaks the app (`npm run build` and `npm test` must pass).
- Split the work by file or area so we're rarely editing the same file.
- Loop: `git pull --rebase` → code → commit → `git pull --rebase` → `git push`. Small commits, every 15–30 min.
- Never commit `.env.local` or real patient data.

## Demo

_Link, screenshots, or GIF._
