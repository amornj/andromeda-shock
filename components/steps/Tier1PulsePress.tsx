'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  NumberInput,
  Button,
  Card,
  Divider,
  Badge,
} from '@/components/shared/ui';

export default function Tier1PulsePress({ state, dispatch }: StepProps) {
  const [sbp, setSbp] = useState(state.patient.sbp?.toString() ?? '');
  const [dbp, setDbp] = useState(state.patient.dbp?.toString() ?? '');
  const [neUptitrated, setNeUptitrated] = useState(false);

  const sbpVal = parseFloat(sbp);
  const dbpVal = parseFloat(dbp);
  const valid = !isNaN(sbpVal) && !isNaN(dbpVal) && sbpVal > dbpVal && dbpVal > 0;

  const pp = valid ? Math.round(sbpVal - dbpVal) : null;
  const map = valid ? Math.round((sbpVal + 2 * dbpVal) / 3) : null;

  const ppLow = pp !== null && pp <= 30;
  const dbpLow = valid && dbpVal < 30;
  const needsNE = ppLow || dbpLow;

  const canProceed = valid && (!needsNE || neUptitrated);

  function handleProceed() {
    if (!valid) return;

    dispatch({ type: 'UPDATE', data: { sbp: sbpVal, dbp: dbpVal, pp: pp!, map: map! } });

    if (needsNE) {
      dispatch({
        type: 'LOG',
        message: `PP ${pp} mmHg${ppLow ? ' ≤30 (low)' : ''}, DBP ${dbpVal} mmHg${dbpLow ? ' <30 (low)' : ''} → NE uptitrated`,
        logType: 'warning',
      });
      dispatch({ type: 'GOTO', phase: 'tier1_fr', ctx: 'post_ne' });
    } else {
      dispatch({
        type: 'LOG',
        message: `PP ${pp} mmHg (normal >30), DBP ${dbpVal} mmHg (≥30) — no NE adjustment`,
        logType: 'info',
      });
      dispatch({ type: 'GOTO', phase: 'tier1_fr' });
    }
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 1"
        step="Step 1 of 2"
        title="Pulse Pressure Assessment"
        subtitle="Measure arterial blood pressure and assess vasopressor adequacy"
      />

      <Alert variant="info" title="Rationale">
        Pulse pressure ≤ 30 mmHg or DBP &lt; 30 mmHg suggests inadequate vasopressor
        tone or vasoplegia. Optimise NE before assessing fluid responsiveness.
      </Alert>

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Systolic BP"
          value={sbp}
          onChange={setSbp}
          unit="mmHg"
          min={50}
          max={250}
          step={1}
          placeholder="120"
          required
        />
        <NumberInput
          label="Diastolic BP"
          value={dbp}
          onChange={setDbp}
          unit="mmHg"
          min={10}
          max={150}
          step={1}
          placeholder="60"
          required
        />
      </div>

      {valid && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center py-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Pulse Pressure
              </p>
              <p
                className={`text-3xl font-bold font-mono tabular-nums mb-1 ${
                  ppLow ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {pp} mmHg
              </p>
              <Badge variant={ppLow ? 'danger' : 'success'}>
                {ppLow ? 'LOW — uptitrate NE' : 'Normal > 30'}
              </Badge>
            </Card>

            <Card className="text-center py-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Mean Arterial Pressure
              </p>
              <p
                className={`text-3xl font-bold font-mono tabular-nums mb-1 ${
                  map! < 65 ? 'text-yellow-400' : 'text-slate-100'
                }`}
              >
                {map} mmHg
              </p>
              <Badge variant={map! < 65 ? 'warning' : 'neutral'}>
                {map! < 65 ? 'Below 65 target' : 'Adequate'}
              </Badge>
            </Card>
          </div>

          {needsNE && (
            <>
              <Alert variant="warning" title="NE Uptitration Required">
                {ppLow && (
                  <p>• Pulse Pressure ≤ 30 mmHg → likely vasoplegia</p>
                )}
                {dbpLow && (
                  <p>• DBP &lt; 30 mmHg → insufficient vasopressor tone</p>
                )}
                <p className="mt-2 font-semibold">
                  Target: DBP ≥ 30 mmHg and PP &gt; 30 mmHg. Uptitrate NE by
                  0.05–0.1 mcg/kg/min increments. Confirm below when done.
                </p>
              </Alert>

              <Divider label="Confirm action" />

              <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/40 bg-blue-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neUptitrated}
                  onChange={(e) => setNeUptitrated(e.target.checked)}
                  className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    NE uptitrated — target achieved
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Confirm vasopressor dose has been adjusted before proceeding
                  </p>
                </div>
              </label>
            </>
          )}

          {!needsNE && (
            <Alert variant="success" title="Pulse Pressure Normal">
              PP &gt; 30 mmHg and DBP ≥ 30 mmHg — vasopressor tone adequate.
              Proceed to fluid responsiveness assessment.
            </Alert>
          )}
        </>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canProceed}
        onClick={handleProceed}
      >
        Proceed to Fluid Responsiveness Assessment
      </Button>
    </div>
  );
}
