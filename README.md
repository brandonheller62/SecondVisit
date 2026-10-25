# YCI Hackathon — Oct 25, 2026

> One-line pitch goes here.

## Team

- Brandon Heller
- Girish Raju
- Mateo Gomez-Peck

## The idea

_What problem are we solving, and for who?_

## Stack

Next.js (App Router) + TypeScript + Tailwind, charts with Recharts. Frontend only: all data is mock and goes through `lib/api.ts`, so a backend can replace those function bodies without touching components.

## Running locally

Needs Node 20+. No `.env`, database or API keys.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # run before pushing; must pass
```

Demo path: pick the diabetes trial → **Analyze trial** → watch the agent run → **CHW review**. The hotel night-shift worker drops out at Visit 4; turn on **Evening visits** and they finish. **Storm closure week** makes most people drop at Visit 5.

## Who owns what

Stay in your own folders to avoid merge conflicts. Shared files (`lib/types.ts`, `lib/api.ts`): pull right before editing, keep the change small, and push right away.

| Owner | Files |
| --- | --- |
| Brandon | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/shell/*` (banner, nav, trial picker, shared UI), `components/agent/*` (run timeline, tool-call panels), `lib/types.ts`, `lib/api.ts`, `lib/mock/*` |
| Girish | `components/coordinator/*` (funnel, language funnel, prescreen table, false-exclusion card, cost calculator) |
| Mateo | `components/chw/*` (personas, walk-through, heatmap, toggles, ranked barriers, drafts, language switch, approval gate, assumptions) |

## How we work

- We both push straight to `main`. Don't push code that breaks the app.
- Split the work by file or area so we're rarely editing the same file.
- Loop: `git pull --rebase` → code → commit → `git pull --rebase` → `git push`. Small commits, every 15–30 min.

## Demo

_Link, screenshots, or GIF._
