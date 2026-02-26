'use client';

import type { AlgorithmPhase } from '@/lib/types';

interface Step {
  id: string;
  label: string;
  phases: AlgorithmPhase[];
}

const STEPS: Step[] = [
  {
    id: 'initial',
    label: 'Initial Assessment',
    phases: ['initial'],
  },
  {
    id: 'tier1',
    label: 'Tier 1',
    phases: ['tier1_pp', 'tier1_fr', 'tier1_fluid'],
  },
  {
    id: 'reassess',
    label: 'CRT Reassessment',
    phases: ['crt_reassess', 'normal_monitoring'],
  },
  {
    id: 'tier2',
    label: 'Tier 2',
    phases: [
      'tier2_echo',
      'tier2_lv_dobutamine',
      'tier2_rv_management',
      'tier2_fr',
      'tier2_map',
      'tier2_dobutamine',
      'tier2_rescue',
    ],
  },
];

function getStepStatus(
  step: Step,
  currentPhase: AlgorithmPhase,
  allPhases: AlgorithmPhase[]
): 'completed' | 'current' | 'upcoming' {
  const currentIdx = allPhases.indexOf(currentPhase);
  const stepMinIdx = Math.min(
    ...step.phases.map((p) => {
      const idx = allPhases.indexOf(p);
      return idx === -1 ? Infinity : idx;
    })
  );
  const stepMaxIdx = Math.max(
    ...step.phases.map((p) => allPhases.indexOf(p)).filter((i) => i !== -1)
  );

  if (step.phases.includes(currentPhase)) return 'current';
  if (currentIdx > stepMaxIdx) return 'completed';
  if (stepMinIdx > currentIdx) return 'upcoming';
  return 'upcoming';
}

const ALL_PHASES: AlgorithmPhase[] = [
  'initial',
  'tier1_pp',
  'tier1_fr',
  'tier1_fluid',
  'crt_reassess',
  'normal_monitoring',
  'tier2_echo',
  'tier2_lv_dobutamine',
  'tier2_rv_management',
  'tier2_fr',
  'tier2_map',
  'tier2_dobutamine',
  'tier2_rescue',
  'print_summary',
];

const phaseLabels: Partial<Record<AlgorithmPhase, string>> = {
  initial: 'Initial CRT & Criteria',
  normal_monitoring: 'Normal — Monitoring',
  tier1_pp: 'Tier 1 — Pulse Pressure',
  tier1_fr: 'Tier 1 — Fluid Responsiveness',
  tier1_fluid: 'Tier 1 — Fluid Bolus',
  crt_reassess: 'CRT Reassessment',
  tier2_echo: 'Tier 2 — Echo',
  tier2_lv_dobutamine: 'Tier 2 — LV Dobutamine',
  tier2_rv_management: 'Tier 2 — RV Management',
  tier2_fr: 'Tier 2 — Fluid Responsiveness',
  tier2_map: 'Tier 2 — MAP Test',
  tier2_dobutamine: 'Tier 2 — Dobutamine Test',
  tier2_rescue: 'Tier 2 — Rescue Therapies',
  print_summary: 'Summary',
};

interface ProgressIndicatorProps {
  phase: AlgorithmPhase;
}

export default function ProgressIndicator({ phase }: ProgressIndicatorProps) {
  return (
    <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-3">
      <div className="max-w-5xl mx-auto">
        {/* Current step label */}
        <p className="text-xs text-slate-400 mb-2.5">
          Current step:{' '}
          <span className="text-blue-400 font-medium">
            {phaseLabels[phase] ?? phase}
          </span>
        </p>

        {/* Step bubbles */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => {
            const status = getStepStatus(step, phase, ALL_PHASES);
            return (
              <div key={step.id} className="flex items-center gap-1 flex-1">
                <div className="flex-1">
                  <div
                    className={[
                      'h-1.5 rounded-full transition-all',
                      status === 'completed'
                        ? 'bg-green-500'
                        : status === 'current'
                        ? 'bg-blue-500'
                        : 'bg-slate-700',
                    ].join(' ')}
                  />
                  <p
                    className={[
                      'text-xs mt-1 truncate',
                      status === 'completed'
                        ? 'text-green-400'
                        : status === 'current'
                        ? 'text-blue-400 font-medium'
                        : 'text-slate-600',
                    ].join(' ')}
                  >
                    {step.label}
                  </p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-2 h-px bg-slate-700 flex-shrink-0 mb-3" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
