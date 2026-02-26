# ANDROMEDA-SHOCK 2 — CRT-PHR Algorithm

A clinical decision support web app that guides clinicians through the **Capillary Refill Time – Personalized Hemodynamic Resuscitation (CRT-PHR)** algorithm for early septic shock management.

Based on the [ANDROMEDA-SHOCK 2 trial](https://jamanetwork.com/journals/jama/fullarticle/2840823) (Hernandez G, Ospina-Tascón GA, Kattan E, et al. *JAMA* 2025; 334(22): 1988-1999).

🔗 **Live:** [andromeda-shock.vercel.app](https://andromeda-shock.vercel.app)

## Features

- **Step-by-step algorithm** — Interactive wizard walking through Tier 1 and Tier 2 interventions
- **CRT-targeted resuscitation** — Normalization of capillary refill time (≤3 sec) as the primary goal
- **Phenotype-based decisions** — Pulse pressure, diastolic BP, and bedside echo to identify hypovolemia, vasoplegia, or cardiac dysfunction
- **Mandatory fluid responsiveness testing** — PLR, PPV, SVV, EEOT, IVC variation before any fluid bolus
- **Protocol timer** — 6-hour countdown with hourly CRT reassessment reminders
- **Decision log** — Timestamped record of all clinical decisions and interventions
- **Print-friendly summary** — Export the complete protocol record
- **Mobile-responsive** — Designed for bedside use on phones and tablets
- **Privacy-first** — No backend, no data transmission. Everything runs in your browser.

## The Algorithm

### Tier 1
1. Measure CRT (glass slide on fingertip, 10 sec press, chronometer)
2. Check pulse pressure (PP ≥40 → assess DBP; PP <40 → fluid responsiveness)
3. If DBP <50 → uptitrate norepinephrine
4. Assess fluid responsiveness → give 500 mL if FR+ (max 1L additional)
5. Reassess CRT after each intervention

### Tier 2 (if CRT still abnormal)
1. Bedside echocardiography (LV dysfunction: FAC <40% + VTI <14; RV failure: RV/LV >1 + CVP >8)
2. Repeat fluid responsiveness assessment
3. MAP test: 80-85 mmHg × 1 hr (chronic hypertension patients only)
4. Dobutamine test: 5 µg/kg/min × 1 hr
5. Rescue therapies if refractory

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

```bash
git clone https://github.com/amornj/andromeda-shock.git
cd andromeda-shock
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Disclaimer

This tool is for **clinical decision support only**. It does not replace clinical judgment, institutional protocols, or individualized patient assessment. Always consider the full clinical context when making treatment decisions.

## Reference

Hernandez G, Ospina-Tascón GA, Kattan E, et al. Personalized Hemodynamic Resuscitation Targeting Capillary Refill Time in Early Septic Shock: The ANDROMEDA-SHOCK-2 Randomized Clinical Trial. *JAMA*. 2025;334(22):1988-1999. doi:[10.1001/jama.2025.20402](https://doi.org/10.1001/jama.2025.20402)

## License

MIT
