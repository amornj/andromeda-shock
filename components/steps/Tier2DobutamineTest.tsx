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
} from '@/components/shared/ui';

export default function Tier2DobutamineTest({ state, dispatch }: StepProps) {
  const [started, setStarted] = useState(false);
  const [response, setResponse] = useState('');
  const [arrhythmia, setArrhythmia] = useState(false);
  const [stopped, setStopped] = useState(false);

  function handleStart() {
    dispatch({
      type: 'LOG',
      message: 'Dobutamine test started: 5 mcg/kg/min fixed dose × 1 hour',
      logType: 'info',
    });
    setStarted(true);
  }

  function handleStop() {
    dispatch({
      type: 'LOG',
      message: 'Dobutamine test stopped early — adverse effect (arrhythmia)',
      logType: 'danger',
    });
    setStopped(true);
  }

  function handleComplete() {
    if (!response && !stopped) return;
    const result = !stopped && response === 'improved';

    dispatch({ type: 'MARK_TIER2', key: 'dobutamine' });
    dispatch({ type: 'UPDATE', data: { dobutamineResult: result } });
    dispatch({
      type: 'LOG',
      message: `Dobutamine test (5 mcg/kg/min × 1hr): ${
        stopped
          ? 'Stopped early — adverse effect'
          : result
          ? 'CRT improved'
          : 'No response'
      } → CRT reassessment`,
      logType: stopped ? 'danger' : result ? 'success' : 'warning',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_dobutamine' });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="Dobutamine Test"
        title="Dobutamine Test — Fixed Dose Trial"
        subtitle="Empirical 1-hour fixed-dose dobutamine to assess response in the absence of clear cardiac indication"
      />

      <Alert variant="info" title="Rationale">
        When no specific cardiac phenotype is identified (or after LV/RV-specific
        interventions), a fixed-dose dobutamine trial at 5 mcg/kg/min for 1 hour
        tests whether increasing cardiac output improves CRT. This is distinct from
        the LV-targeted dobutamine titration.
      </Alert>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Protocol</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-600/40 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">1</span>
            <span className="text-slate-300">Administer dobutamine at <strong>5 mcg/kg/min</strong> IV — fixed dose</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-600/40 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">2</span>
            <span className="text-slate-300">Maintain for <strong>1 hour</strong> — do NOT titrate</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-600/40 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">3</span>
            <span className="text-slate-300">Stop if: significant arrhythmia, tachycardia &gt; 130 bpm, haemodynamic deterioration</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-600/40 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">4</span>
            <span className="text-slate-300">Reassess CRT at end of trial</span>
          </div>
        </div>
      </div>

      {!started && (
        <Button variant="warning" size="lg" fullWidth onClick={handleStart}>
          Start Dobutamine 5 mcg/kg/min
        </Button>
      )}

      {started && !stopped && (
        <>
          <Card className="text-center py-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Running</p>
            <p className="text-3xl font-bold font-mono text-yellow-400">5 mcg/kg/min</p>
            <p className="text-xs text-slate-400 mt-2">Fixed dose — maintain for 1 hour, do not titrate</p>
          </Card>

          <Divider label="Monitor for adverse effects" />

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-red-700/40 bg-red-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={arrhythmia}
              onChange={(e) => setArrhythmia(e.target.checked)}
              className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">Adverse effect requiring early stop</p>
              <p className="text-xs text-slate-400">Arrhythmia, tachycardia &gt;130 bpm, or haemodynamic deterioration</p>
            </div>
          </label>

          {arrhythmia && !stopped && (
            <Button variant="danger" size="lg" fullWidth onClick={handleStop}>
              Stop Dobutamine — Adverse Effect
            </Button>
          )}

          {!arrhythmia && (
            <>
              <Divider label="After 1-hour trial" />
              <RadioGroup
                label="CRT response after 1-hour dobutamine test"
                name="dob_test_response"
                value={response}
                onChange={setResponse}
                options={[
                  {
                    value: 'improved',
                    label: 'CRT improved / normalised',
                    description: 'Peripheral perfusion markers improved',
                    badge: 'Positive',
                    badgeVariant: 'success',
                  },
                  {
                    value: 'no_response',
                    label: 'No meaningful CRT improvement',
                    description: 'CRT still abnormal — consider rescue therapies',
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
        </>
      )}

      {stopped && (
        <>
          <Alert variant="danger" title="Dobutamine Stopped Early">
            Adverse effect documented — test terminated. Proceeding to CRT reassessment
            and rescue therapies.
          </Alert>
          <Button variant="primary" size="lg" fullWidth onClick={handleComplete}>
            Record Early Stop → CRT Reassessment
          </Button>
        </>
      )}
    </div>
  );
}
