'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  Button,
  Card,
  Divider,
  RadioGroup,
  NumberInput,
} from '@/components/shared/ui';

export default function Tier2LVDobutamine({ state, dispatch }: StepProps) {
  const [started, setStarted] = useState(false);
  const [dose, setDose] = useState('2.5');
  const [response, setResponse] = useState('');
  const [arrhythmia, setArrhythmia] = useState(false);
  const [tachycardia, setTachycardia] = useState(false);

  const doseVal = parseFloat(dose);
  const doseValid = !isNaN(doseVal) && doseVal >= 2.5 && doseVal <= 7.5;
  const hasAdverseEffect = arrhythmia || tachycardia;

  function handleStart() {
    dispatch({
      type: 'LOG',
      message: `Dobutamine started at ${doseVal} mcg/kg/min for LV dysfunction (FAC ${state.patient.fac ?? '?'}%, VTI ${state.patient.aorticVTI ?? '?'} cm)`,
      logType: 'info',
    });
    setStarted(true);
  }

  function handleComplete() {
    if (!response) return;
    const result = response === 'improved';

    dispatch({ type: 'UPDATE', data: { lvDobutamineResult: result } });
    dispatch({
      type: 'LOG',
      message: `LV dobutamine trial (${doseVal} mcg/kg/min): ${result ? 'CRT improved' : 'No response'}${hasAdverseEffect ? ' — adverse effect noted' : ''} → CRT reassessment`,
      logType: result ? 'success' : 'warning',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_tier2_lv' });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="LV Dobutamine"
        title="LV Targeted — Dobutamine Therapy"
        subtitle="Echo-confirmed LV systolic dysfunction: initiate dobutamine to increase cardiac output"
      />

      <Alert variant="warning" title="Indication">
        LV systolic dysfunction confirmed: FAC &lt; 40% AND VTI &lt; 14 cm.
        Goal: increase stroke volume and improve peripheral perfusion (CRT normalisation).
      </Alert>

      <div className="grid grid-cols-2 gap-3">
        {state.patient.fac !== null && (
          <Card className="text-center py-4">
            <p className="text-xs text-slate-500 mb-1">FAC</p>
            <p className="text-2xl font-bold font-mono text-red-400">{state.patient.fac}%</p>
          </Card>
        )}
        {state.patient.aorticVTI !== null && (
          <Card className="text-center py-4">
            <p className="text-xs text-slate-500 mb-1">Aortic VTI</p>
            <p className="text-2xl font-bold font-mono text-red-400">{state.patient.aorticVTI} cm</p>
          </Card>
        )}
      </div>

      {!started && (
        <>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-300">Dobutamine Protocol (ANDROMEDA-SHOCK 2)</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-blue-400">1.</span>
                <span>Start at <strong className="text-slate-200">2.5 mcg/kg/min</strong> IV infusion</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">2.</span>
                <span>Titrate up to <strong className="text-slate-200">7.5 mcg/kg/min</strong> maximum</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">3.</span>
                <span><strong className="text-red-400">Stop if:</strong> HR increases &gt; 20% above 120 bpm, arrhythmias, ischemia, or hypotension</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">4.</span>
                <span>Reassess CRT at <strong className="text-slate-200">1 hour</strong></span>
              </li>
            </ul>
          </div>

          <NumberInput
            label="Starting dose"
            value={dose}
            onChange={setDose}
            unit="mcg/kg/min"
            min={2.5}
            max={7.5}
            step={2.5}
            placeholder="2.5"
            hint="Start 2.5 mcg/kg/min, titrate up to max 7.5 mcg/kg/min."
            required
          />

          <Button
            variant="warning"
            size="lg"
            fullWidth
            disabled={!doseValid}
            onClick={handleStart}
          >
            Start Dobutamine {doseValid ? `${doseVal} mcg/kg/min` : ''}
          </Button>
        </>
      )}

      {started && (
        <>
          <Alert variant="success" title={`Dobutamine running at ${doseVal} mcg/kg/min`}>
            Reassess CRT at 1 hour. Titrate dose based on clinical response. Monitor
            HR, rhythm, and blood pressure continuously.
          </Alert>

          <Divider label="After 1-hour trial — record response" />

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-red-700/40 bg-red-950/20 cursor-pointer">
              <input
                type="checkbox"
                checked={arrhythmia}
                onChange={(e) => setArrhythmia(e.target.checked)}
                className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-slate-200">New arrhythmia noted</p>
                <p className="text-xs text-slate-400">AF, VT, or significant ectopy — consider dose reduction</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-yellow-700/40 bg-yellow-950/20 cursor-pointer">
              <input
                type="checkbox"
                checked={tachycardia}
                onChange={(e) => setTachycardia(e.target.checked)}
                className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-slate-200">HR increased &gt;20% above 120 bpm, ischemia, or hypotension</p>
                <p className="text-xs text-slate-400">Stop dobutamine per protocol safety criteria</p>
              </div>
            </label>
          </div>

          <RadioGroup
            label="Clinical response after 1-hour dobutamine trial"
            name="dob_response"
            value={response}
            onChange={setResponse}
            options={[
              {
                value: 'improved',
                label: 'CRT improved / normalised',
                description: 'CRT trending toward ≤ 3s — continue dobutamine',
                badge: 'Positive response',
                badgeVariant: 'success',
              },
              {
                value: 'no_response',
                label: 'No meaningful CRT improvement',
                description: 'CRT unchanged or worsened — consider next Tier 2 intervention',
                badge: 'No response',
                badgeVariant: 'danger',
              },
            ]}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!response}
            onClick={handleComplete}
          >
            Record Response → CRT Reassessment
          </Button>
        </>
      )}
    </div>
  );
}
