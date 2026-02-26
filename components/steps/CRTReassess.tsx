'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import type { AlgorithmPhase } from '@/lib/types';
import type { AlgorithmState } from '@/lib/types';
import {
  StepHeader,
  Alert,
  NumberInput,
  Button,
  Card,
  Badge,
  Divider,
} from '@/components/shared/ui';

function getNextPhaseAfterAbnormal(state: AlgorithmState): AlgorithmPhase {
  const { crtCtx, tier2Done, patient } = state;

  // Still in Tier 1 — haven't done FR yet
  if (crtCtx === 'initial' || crtCtx === 'post_ne') {
    return 'tier1_fr';
  }

  // Now in Tier 2 territory
  if (!tier2Done.echo) return 'tier2_echo';

  // Cardiac-specific interventions based on echo
  if (patient.cardiacDx === 'lv' && patient.lvDobutamineResult === null) {
    return 'tier2_lv_dobutamine';
  }
  if (patient.cardiacDx === 'rv' && patient.rvManagementResult === null) {
    return 'tier2_rv_management';
  }

  // Generic Tier 2 sequence
  if (!tier2Done.fr) return 'tier2_fr';
  if (patient.hasChronicHTN && !tier2Done.map) return 'tier2_map';
  if (!tier2Done.dobutamine) return 'tier2_dobutamine';

  return 'tier2_rescue';
}

const ctxLabels: Record<string, string> = {
  initial: 'Initial assessment',
  post_ne: 'After NE uptitration (Tier 1)',
  post_fluid1: 'After Tier 1 fluid resuscitation',
  post_fluid2: 'After repeat fluid assessment',
  post_tier2_lv: 'After LV dobutamine therapy',
  post_tier2_rv: 'After RV management',
  post_tier2_fr: 'After Tier 2 fluid responsiveness',
  post_map: 'After MAP test (80–85 mmHg)',
  post_dobutamine: 'After dobutamine test',
};

export default function CRTReassess({ state, dispatch }: StepProps) {
  const [crt, setCrt] = useState('');

  const crtVal = parseFloat(crt);
  const crtValid = !isNaN(crtVal) && crtVal > 0 && crtVal <= 15;
  const isNormal = crtValid && crtVal <= 3;

  const lastCRT = state.patient.crt;
  const trend =
    lastCRT !== null && crtValid
      ? crtVal < lastCRT
        ? 'improving'
        : crtVal > lastCRT
        ? 'worsening'
        : 'unchanged'
      : null;

  function handleRecord() {
    if (!crtValid) return;

    const ctxLabel = ctxLabels[state.crtCtx] ?? state.crtCtx;
    dispatch({ type: 'RECORD_CRT', value: crtVal, label: ctxLabel });

    if (isNormal) {
      dispatch({ type: 'GOTO', phase: 'normal_monitoring' });
    } else {
      const next = getNextPhaseAfterAbnormal(state);
      dispatch({ type: 'GOTO', phase: next });
    }
  }

  return (
    <div className="space-y-6">
      <StepHeader
        step="CRT Reassessment"
        title="Capillary Refill Time — Reassessment"
        subtitle="Measure CRT to evaluate treatment response and determine next steps"
      />

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Reassessment Context
        </p>
        <p className="text-sm text-slate-200">
          {ctxLabels[state.crtCtx] ?? state.crtCtx}
        </p>
        {lastCRT !== null && (
          <p className="text-xs text-slate-500">
            Previous CRT: <span className="text-slate-300 font-mono">{lastCRT}s</span>
          </p>
        )}
      </div>

      <Alert variant="neutral" title="CRT Measurement Technique">
        Apply firm pressure to the middle finger pad for 15 seconds under standard
        lighting. Release and count seconds until normal colour returns.
      </Alert>

      <NumberInput
        label="Capillary Refill Time"
        value={crt}
        onChange={setCrt}
        unit="seconds"
        min={0.5}
        max={15}
        step={0.5}
        placeholder="e.g. 3.5"
        hint="Repeat measurement 3× and use median. Normal ≤ 3 seconds."
        required
      />

      {crtValid && (
        <>
          <Card className="text-center py-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              New CRT Value
            </p>
            <p
              className={`text-4xl font-bold font-mono tabular-nums mb-2 ${
                isNormal ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {crtVal}s
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant={isNormal ? 'success' : 'danger'}>
                {isNormal ? 'NORMALIZED ≤ 3s' : 'Still ABNORMAL > 3s'}
              </Badge>
              {trend && (
                <Badge
                  variant={
                    trend === 'improving'
                      ? 'success'
                      : trend === 'worsening'
                      ? 'danger'
                      : 'neutral'
                  }
                >
                  {trend === 'improving' ? '↓ Improving' : trend === 'worsening' ? '↑ Worsening' : '→ Unchanged'}
                </Badge>
              )}
            </div>
          </Card>

          {!isNormal && (
            <Alert variant="warning" title="CRT Still Abnormal">
              {(() => {
                const next = getNextPhaseAfterAbnormal(state);
                const labels: Record<string, string> = {
                  tier1_fr: 'Proceed to Tier 1 Fluid Responsiveness Assessment',
                  tier2_echo: 'Proceed to Tier 2 — Bedside Echocardiography',
                  tier2_lv_dobutamine: 'Proceed to Tier 2 — LV Dobutamine Therapy',
                  tier2_rv_management: 'Proceed to Tier 2 — RV Management',
                  tier2_fr: 'Proceed to Tier 2 — Fluid Responsiveness',
                  tier2_map: 'Proceed to Tier 2 — MAP Test (Chronic HTN)',
                  tier2_dobutamine: 'Proceed to Tier 2 — Dobutamine Test',
                  tier2_rescue: 'Proceed to Rescue Therapies',
                };
                return labels[next] ?? `Next: ${next}`;
              })()}
            </Alert>
          )}

          {isNormal && (
            <Alert variant="success" title="CRT Normalised">
              CRT ≤ 3s — target achieved. Continue hourly monitoring per protocol.
            </Alert>
          )}
        </>
      )}

      <Divider />

      {state.patient.crtHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            CRT History
          </p>
          <div className="space-y-1.5">
            {state.patient.crtHistory.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-slate-800/40 rounded-lg px-3 py-2"
              >
                <span className="text-slate-400">{entry.label}</span>
                <span
                  className={`font-mono font-semibold ${
                    entry.value <= 3 ? 'text-green-400' : 'text-yellow-400'
                  }`}
                >
                  {entry.value}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant={isNormal ? 'success' : 'warning'}
        size="lg"
        fullWidth
        disabled={!crtValid}
        onClick={handleRecord}
      >
        {!crtValid
          ? 'Enter CRT value above'
          : isNormal
          ? 'CRT Normal → Normal Monitoring'
          : 'CRT Abnormal → Next Intervention'}
      </Button>
    </div>
  );
}
