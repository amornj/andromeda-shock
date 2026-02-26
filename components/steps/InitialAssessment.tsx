'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  NumberInput,
  Button,
  CheckboxItem,
  Divider,
  Card,
  Badge,
} from '@/components/shared/ui';

export default function InitialAssessment({ dispatch }: StepProps) {
  const [vasopressor, setVasopressor] = useState(false);
  const [lactate, setLactate] = useState(false);
  const [crt, setCrt] = useState('');

  const criteriaOk = vasopressor && lactate;
  const crtVal = parseFloat(crt);
  const crtValid = !isNaN(crtVal) && crtVal > 0 && crtVal <= 15;
  const isAbnormal = crtValid && crtVal > 3;

  function handleStart() {
    if (!criteriaOk || !crtValid) return;
    dispatch({ type: 'START_PROTOCOL', crt: crtVal });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        title="Initial Assessment"
        subtitle="Confirm septic shock inclusion criteria, then measure baseline capillary refill time"
      />

      <Alert variant="info" title="ANDROMEDA-SHOCK 2 — Inclusion Criteria">
        Patient must meet ALL criteria to enter the CRT-PHR algorithm. This tool
        follows the ANDROMEDA-SHOCK 2 trial protocol (Hernandez et al., 2025).
      </Alert>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Confirm inclusion criteria
        </p>
        <CheckboxItem
          label="Vasopressor-dependent septic shock"
          description="Norepinephrine ≥ 0.1 mcg/kg/min to maintain MAP ≥ 65 mmHg despite adequate initial fluid resuscitation"
          checked={vasopressor}
          onChange={setVasopressor}
        />
        <CheckboxItem
          label="Persistent tissue hypoperfusion"
          description="Lactate ≥ 4 mmol/L, OR lactate 2–4 mmol/L with ≥ 1 organ dysfunction (after ≥ 1L crystalloid)"
          checked={lactate}
          onChange={setLactate}
        />
      </div>

      {criteriaOk && (
        <>
          <Divider label="Baseline CRT Measurement" />

          <Alert variant="neutral" title="Standardised CRT Technique">
            Apply firm pressure to the middle finger pad for exactly 15 seconds under
            standard white light. Release and count seconds until normal skin colour
            returns. Perform 3 measurements and use the median.
          </Alert>

          <NumberInput
            label="Capillary Refill Time"
            value={crt}
            onChange={setCrt}
            unit="seconds"
            min={0.5}
            max={15}
            step={0.5}
            placeholder="e.g. 4.5"
            hint="Normal ≤ 3 seconds. Measure at fingertip under standardised lighting."
            required
          />

          {crtValid && (
            <Card className="text-center py-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                CRT Result
              </p>
              <p
                className={`text-4xl font-bold font-mono tabular-nums mb-2 ${
                  isAbnormal ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {crtVal}s
              </p>
              <Badge variant={isAbnormal ? 'danger' : 'success'}>
                {isAbnormal ? 'ABNORMAL — Entering Tier 1' : 'NORMAL — Standard Monitoring'}
              </Badge>
            </Card>
          )}
        </>
      )}

      {!criteriaOk && (
        <Alert variant="warning">
          Confirm both inclusion criteria before measuring CRT.
        </Alert>
      )}

      <Button
        variant={isAbnormal ? 'warning' : 'success'}
        size="lg"
        fullWidth
        disabled={!criteriaOk || !crtValid}
        onClick={handleStart}
      >
        {!criteriaOk || !crtValid
          ? 'Complete above fields to start'
          : isAbnormal
          ? 'Start Protocol → Tier 1 Interventions'
          : 'Start Protocol → Normal Monitoring'}
      </Button>
    </div>
  );
}
