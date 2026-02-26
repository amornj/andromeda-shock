'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  NumberInput,
  Button,
  Card,
  Badge,
  Divider,
} from '@/components/shared/ui';

export default function NormalMonitoring({ state, dispatch }: StepProps) {
  const [crt, setCrt] = useState('');

  const crtVal = parseFloat(crt);
  const crtValid = !isNaN(crtVal) && crtVal > 0 && crtVal <= 15;
  const isNormal = crtValid && crtVal <= 3;

  const lastCRT = state.patient.crt;

  function handleReassess() {
    if (!crtValid) return;
    dispatch({ type: 'RECORD_CRT', value: crtVal, label: 'Hourly monitoring reassessment' });

    if (!isNormal) {
      dispatch({
        type: 'LOG',
        message: `CRT deteriorated to ${crtVal}s during monitoring — re-entering intervention protocol`,
        logType: 'warning',
      });
      dispatch({ type: 'GOTO', phase: 'tier1_pp' });
    } else {
      dispatch({
        type: 'LOG',
        message: `Hourly CRT reassessment: ${crtVal}s — still normal`,
        logType: 'success',
      });
      setCrt('');
    }
  }

  function handleSummary() {
    dispatch({ type: 'GOTO', phase: 'print_summary' });
  }

  const protocolMs = state.protocolStart
    ? new Date().getTime() - state.protocolStart.getTime()
    : 0;
  const protocolExpired = protocolMs >= 6 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      <StepHeader
        step="Normal Monitoring"
        title="CRT Normalised — Continue Monitoring"
        subtitle="Capillary refill time ≤ 3s achieved. Maintain hourly reassessment for the 6-hour protocol window."
      />

      <Alert variant="success" title="Protocol Target Achieved">
        CRT has normalised (≤ 3 seconds). Continue standard care and reassess CRT every
        hour for the duration of the 6-hour protocol window. If CRT becomes abnormal again,
        re-enter the intervention algorithm.
      </Alert>

      {lastCRT !== null && (
        <Card className="text-center py-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current CRT</p>
          <p className="text-4xl font-bold font-mono text-green-400 tabular-nums mb-2">
            {lastCRT}s
          </p>
          <Badge variant="success">NORMALISED ≤ 3s</Badge>
        </Card>
      )}

      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">
          Ongoing Management
        </p>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
            <span>Reassess CRT hourly for the 6-hour protocol window</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
            <span>Maintain NE at current dose unless haemodynamics improve</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
            <span>Continue monitoring lactate, urine output, and mental status</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
            <span>If CRT &gt; 3s at any reassessment — re-enter intervention algorithm</span>
          </li>
        </ul>
      </div>

      <Divider label="Hourly CRT Reassessment" />

      <NumberInput
        label="New CRT Measurement"
        value={crt}
        onChange={setCrt}
        unit="seconds"
        min={0.5}
        max={15}
        step={0.5}
        placeholder="e.g. 2.5"
        hint="Enter when performing the next hourly reassessment"
      />

      {crtValid && (
        <Alert variant={isNormal ? 'success' : 'warning'}>
          {isNormal
            ? `CRT ${crtVal}s — still normal. Protocol continues.`
            : `CRT ${crtVal}s — ABNORMAL. Re-entering intervention algorithm.`}
        </Alert>
      )}

      <Button
        variant={isNormal || !crtValid ? 'success' : 'warning'}
        size="lg"
        fullWidth
        disabled={!crtValid}
        onClick={handleReassess}
      >
        {!crtValid
          ? 'Enter CRT measurement above'
          : isNormal
          ? 'Record — CRT Still Normal'
          : 'CRT Abnormal — Re-enter Algorithm'}
      </Button>

      {(protocolExpired || state.phase === 'normal_monitoring') && (
        <>
          <Divider />
          <Button variant="ghost" size="md" fullWidth onClick={handleSummary}>
            View Protocol Summary &amp; Print
          </Button>
        </>
      )}
    </div>
  );
}
