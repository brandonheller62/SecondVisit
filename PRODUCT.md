# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience right now: people seeing Second Visit as a demo (hackathon judges, recruiters, portfolio visitors), usually once and for a few minutes. They need to understand what it does and why it matters within the first screen, then watch it work.

The product is designed for clinical research teams at Miami-Dade trial sites (research coordinators and site staff) who need to decide which already-eligible patients to offer retention support first.

## Product Purpose

Second Visit is a retention-support agent. It reads a real trial's visit schedule from ClinicalTrials.gov, scores the practical barriers each already-eligible patient would face at those visits (schedule clashes, transport, childcare, language access, cost), ranks who should be offered support first, and simulates what supports (evening visits, ride vouchers, childcare stipend, interpreter + translated materials, wage & expense reimbursement) would change.

Success: a viewer sees that people drop out of trials for reasons a site can fix, and that this tool shows which fix helps whom.

## Positioning

The barrier is treated as a gap in the trial, not a trait of the person. The score decides who is offered help first and is never used to exclude, deprioritize or reject anyone. Every number traces back to transparent points in code; Claude orchestrates tools and writes a closing note but never sees patient rows and never writes the results summary.

## Operating Context

Three-step flow: Start (pick a demo trial, load or upload a patient CSV) → Agent run (tool calls stream in as plain sentences) → Results (summary, ranked support list, support switches, group table, limitations, advanced assumptions and costs). Runs locally with `npm run dev`; deployed builds need an Anthropic API key.

## Capabilities and Constraints

- Next.js 15 App Router, TypeScript, Tailwind 4, Phosphor icons, IBM Plex Sans/Mono. No database.
- Patient data is synthetic and de-identified; files with identifying columns are rejected. Every synthetic person shown carries a Synthetic tag.
- No medical advice and no eligibility decisions; the safety note stays on every screen.
- Team decision (2026-10-25): the need-level chart and recharts were removed from Results.
- Point values are judgment calls, not validated; results are estimates, not predictions.

## Brand Commitments

- Name: "Second Visit" (the visit a patient has to come back for).
- The caduceus page-load intro stays.
- Voice: warm and plain. About people and care, plain sentences, humane, never clinical or salesy.

## Evidence on Hand

- Two cached demo trials in `data/trials/` (type 2 diabetes + NASH NCT05232071; resistant hypertension NCT06343298).
- 120 synthetic patients in `data/synthetic_patients.csv`.
- Screenshots in `docs/screenshots/`.
- No real users, testimonials, outcomes or validation data exist; never imply them.

## Product Principles

1. Help first, never exclude: ranking language always points toward offering support.
2. Show the mechanism: every number is explainable from barriers and points.
3. Plain sentences over jargon or dashboards.
4. Honest uncertainty: unknowns and limitations stay visible.
5. Privacy by construction: synthetic data, nothing patient-level reaches the model.

## Accessibility & Inclusion

WCAG AA contrast; need level is never shown by color alone; keyboard and screen-reader support for the run timeline and switches; reduced-motion respected (the intro is skipped).
