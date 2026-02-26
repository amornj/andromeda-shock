# CLAUDE.md — ANDROMEDA-SHOCK 2 CRT-PHR Algorithm

## Project Overview
Clinical decision support web app implementing the CRT-PHR (Capillary Refill Time - Personalized Hemodynamic Resuscitation) algorithm from the ANDROMEDA-SHOCK 2 trial (Hernandez et al., JAMA 2025; 334(22): 1988-1999).

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** useReducer (no external state library)
- **Deployment:** Vercel (https://andromeda-shock.vercel.app)
- **Backend:** None — all logic is client-side

## Architecture

### State Management
- `lib/types.ts` — All TypeScript types (AlgorithmPhase, PatientData, AlgorithmState)
- `lib/reducer.ts` — useReducer with actions: START_PROTOCOL, GOTO, LOG, UPDATE, RECORD_CRT, MARK_TIER2, RESET

### Components
- `components/AlgorithmWizard.tsx` — Main orchestrator (phase router, layout, inline Summary + Rescue)
- `components/shared/` — Reusable UI: Timer, DecisionLog, ProgressIndicator, ui.tsx (Button, Card, Alert, Badge, NumberInput, RadioGroup, etc.)
- `components/steps/` — One component per algorithm step:
  - InitialAssessment → Tier1PulsePress → Tier1FluidResp
  - CRTReassess (used between steps)
  - Tier2Echo → Tier2LVDobutamine / Tier2RVManagement → Tier2FluidResp → Tier2MAPTest → Tier2DobutamineTest
- `components/steps/types.ts` — StepProps type (state + dispatch)

### Algorithm Flow
1. Initial CRT measurement → normal (monitoring) or abnormal (Tier 1)
2. Tier 1: PP check → DBP/NE adjustment → fluid responsiveness → fluid bolus
3. CRT reassessment after each intervention
4. Tier 2: Echo → LV/RV management → repeat FR → MAP test (HTN patients) → dobutamine test → rescue
5. Summary with CRT history, metrics, full decision log, print button

## Commands
```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
vercel --prod    # Deploy to production
```

## Design
- Dark navy (#0f172a) + blue (#3b82f6) accent theme
- Mobile-responsive for bedside use
- Color-coded alerts: green (normal), yellow (caution), red (abnormal)
- 6-hour protocol timer with hourly reassessment warnings

## Key Decisions
- No backend — everything runs client-side for privacy (no patient data leaves the device)
- Hierarchical step flow matches the original trial protocol exactly
- Fluid responsiveness testing is mandatory before any fluid administration
- Safety limits enforced (CVP >15, worsening oxygenation, new rales)
