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

/**
 * Tier 1 — Pulse Pressure & DAP Assessment
 *
 * Per ANDROMEDA-SHOCK 2 Figure 2:
 *  - PP < 40 mmHg → assess fluid responsiveness → fluid boluses (up to 1000 mL)
 *  - PP ≥ 40 AND DAP < 50 mmHg → uptitrate NE for DAP ≥ 50 → reassess CRT
 *  - PP ≥ 40 AND DAP ≥ 50 → straight to Tier 2
 */
export default function Tier1PulsePress({ state, dispatch }: StepProps) {
  const [sbp, setSbp] = useState(state.patient.sbp?.toString() ?? '');
  const [dbp, setDbp] = useState(state.patient.dbp?.toString() ?? '');
  const [neUptitrated, setNeUptitrated] = useState(false);

  const sbpVal = parseFloat(sbp);
  const dbpVal = parseFloat(dbp);
  const valid = !isNaN(sbpVal) && !isNaN(dbpVal) && sbpVal > dbpVal && dbpVal > 0;

  const pp = valid ? Math.round(sbpVal - dbpVal) : null;
  const map = valid ? Math.round((sbpVal + 2 * dbpVal) / 3) : null;

  // Paper thresholds
  const ppLow = pp !== null && pp < 40;       // PP < 40 → fluid path
  const dapLow = valid && dbpVal < 50;        // DAP < 50 → NE path (only when PP ≥ 40)

  // Determine branch
  type Branch = 'fluid' | 'dap' | 'direct_tier2' | null;
  let branch: Branch = null;
  if (valid) {
    if (ppLow) {
      branch = 'fluid';              // PP < 40 → assess FR → fluids
    } else if (dapLow) {
      branch = 'dap';                // PP ≥ 40 AND DAP < 50 → NE for DAP ≥ 50
    } else {
      branch = 'direct_tier2';       // PP ≥ 40 AND DAP ≥ 50 → skip to Tier 2
    }
  }

  const canProceed = valid && (branch !== 'dap' || neUptitrated);

  function handleProceed() {
    if (!valid || !branch) return;

    dispatch({ type: 'UPDATE', data: { sbp: sbpVal, dbp: dbpVal, pp: pp!, map: map!, tier1Path: branch } });

    if (branch === 'fluid') {
      dispatch({
        type: 'LOG',
        message: `PP ${pp} mmHg (< 40) → Low stroke volume suspected → Assess fluid responsiveness`,
        logType: 'warning',
      });
      dispatch({ type: 'GOTO', phase: 'tier1_fr' });
    } else if (branch === 'dap') {
      dispatch({
        type: 'LOG',
        message: `PP ${pp} mmHg (>= 40), DAP ${dbpVal} mmHg (< 50) → Vasoplegia → NE uptitrated for DAP >= 50 → CRT reassessment`,
        logType: 'warning',
      });
      dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_dap_adjust' });
    } else {
      dispatch({
        type: 'LOG',
        message: `PP ${pp} mmHg (>= 40), DAP ${dbpVal} mmHg (>= 50) → Hemodynamics adequate → Proceeding to Tier 2`,
        logType: 'info',
      });
      dispatch({ type: 'GOTO', phase: 'tier2_echo' });
    }
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 1"
        step="Step 1"
        title="Pulse Pressure & Diastolic Pressure Assessment"
        subtitle="Identify hemodynamic pattern: hypovolemia (PP < 40) vs vasoplegia (DAP < 50)"
      />

      <Alert variant="info" title="Rationale (ANDROMEDA-SHOCK 2)">
        A narrow pulse pressure (&lt; 40 mmHg) suggests low stroke volume — assess fluid
        responsiveness. If PP is adequate (&ge; 40) but diastolic pressure is low (&lt; 50 mmHg),
        this reflects vasoplegia — uptitrate norepinephrine to achieve DAP &ge; 50 mmHg.
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
                {ppLow ? 'LOW (< 40) → Assess FR' : 'Normal (>= 40)'}
              </Badge>
            </Card>

            <Card className="text-center py-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Diastolic Arterial Pressure
              </p>
              <p
                className={`text-3xl font-bold font-mono tabular-nums mb-1 ${
                  !ppLow && dapLow ? 'text-red-400' : 'text-slate-100'
                }`}
              >
                {dbpVal} mmHg
              </p>
              <Badge variant={!ppLow && dapLow ? 'danger' : 'neutral'}>
                {!ppLow && dapLow ? 'LOW (< 50) → Uptitrate NE' : dapLow ? 'Low (< 50)' : 'Adequate (>= 50)'}
              </Badge>
            </Card>
          </div>

          {/* Branch: PP < 40 → Fluid responsiveness */}
          {branch === 'fluid' && (
            <Alert variant="warning" title="Low Pulse Pressure — Assess Fluid Responsiveness">
              PP &lt; 40 mmHg suggests low stroke volume. Proceed to fluid responsiveness
              assessment. If fluid responsive, administer 500 mL bolus (max 1000 mL in Tier 1).
            </Alert>
          )}

          {/* Branch: PP ≥ 40, DAP < 50 → NE uptitration */}
          {branch === 'dap' && (
            <>
              <Alert variant="warning" title="Vasoplegia — Uptitrate Norepinephrine">
                PP &ge; 40 mmHg but DAP &lt; 50 mmHg → decreased vascular tone.
                Uptitrate norepinephrine to achieve DAP &ge; 50 mmHg, then reassess CRT.
              </Alert>

              <Divider label="Confirm NE adjustment" />

              <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/40 bg-blue-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neUptitrated}
                  onChange={(e) => setNeUptitrated(e.target.checked)}
                  className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    NE uptitrated — DAP &ge; 50 mmHg achieved
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Confirm vasopressor dose has been adjusted before proceeding to CRT reassessment
                  </p>
                </div>
              </label>
            </>
          )}

          {/* Branch: PP ≥ 40, DAP ≥ 50 → Straight to Tier 2 */}
          {branch === 'direct_tier2' && (
            <Alert variant="info" title="Hemodynamics Adequate — Proceed to Tier 2">
              PP &ge; 40 mmHg and DAP &ge; 50 mmHg — no Tier 1 fluid or NE intervention required.
              Proceed directly to Tier 2 (echocardiography).
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
        {!valid
          ? 'Enter blood pressure above'
          : branch === 'fluid'
          ? 'PP < 40 → Assess Fluid Responsiveness'
          : branch === 'dap'
          ? !neUptitrated
            ? 'Confirm NE adjustment above'
            : 'DAP Adjusted → CRT Reassessment'
          : 'Adequate → Proceed to Tier 2 Echo'}
      </Button>
    </div>
  );
}
