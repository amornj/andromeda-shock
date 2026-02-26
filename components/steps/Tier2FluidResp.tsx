'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  RadioGroup,
  NumberInput,
  Button,
  Card,
  Badge,
  Divider,
  CheckboxItem,
} from '@/components/shared/ui';

export default function Tier2FluidResp({ state, dispatch }: StepProps) {
  const [method, setMethod] = useState('');
  const [frResult, setFrResult] = useState('');
  const [vtiBefore, setVtiBefore] = useState('');
  const [vtiAfter, setVtiAfter] = useState('');
  const [worseningOx, setWorseningOx] = useState(false);
  const [newRales, setNewRales] = useState(false);
  const [bolusGiven, setBolusGiven] = useState(false);

  const safetyIssue = worseningOx || newRales;

  const vtiB = parseFloat(vtiBefore);
  const vtiA = parseFloat(vtiAfter);
  let vtiChange: number | null = null;
  let frPositive: boolean | null = null;
  let frCanDetermine = false;

  if ((method === 'vti' || method === 'plr_vti') && !isNaN(vtiB) && !isNaN(vtiA) && vtiB > 0) {
    vtiChange = Math.round(((vtiA - vtiB) / vtiB) * 100);
    frPositive = vtiChange >= 10;
    frCanDetermine = true;
  } else if ((method === 'plr' || method === 'ppv') && frResult) {
    frPositive = frResult === 'positive';
    frCanDetermine = true;
  } else if (method === 'not_possible') {
    frPositive = false;
    frCanDetermine = true;
  }

  const canProceed = method !== '' && frCanDetermine;

  function handleProceed() {
    if (!frCanDetermine) return;

    dispatch({ type: 'MARK_TIER2', key: 'fr' });
    dispatch({ type: 'UPDATE', data: { frMethod: method, frPositive } });

    if (safetyIssue) {
      dispatch({
        type: 'LOG',
        message: `Tier 2 FR: ${frPositive ? 'Positive' : 'Negative'} (${method}) — Safety issue: withheld fluid`,
        logType: 'danger',
      });
    } else if (frPositive && bolusGiven) {
      dispatch({
        type: 'LOG',
        message: `Tier 2 FR: Positive (${method}) — 100 mL bolus given. Total: ${state.patient.totalFluidMl + 100} mL`,
        logType: 'info',
      });
      dispatch({ type: 'UPDATE', data: { fluidBoluses: state.patient.fluidBoluses + 1, totalFluidMl: state.patient.totalFluidMl + 100 } });
    } else {
      dispatch({
        type: 'LOG',
        message: `Tier 2 FR: ${frPositive ? 'Positive — fluid given' : 'Negative — no fluid'} (${method})`,
        logType: 'info',
      });
    }
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_tier2_fr' });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="Fluid Responsiveness"
        title="Tier 2 — Fluid Responsiveness Assessment"
        subtitle="Repeat fluid responsiveness assessment as part of Tier 2 intervention sequence"
      />

      <Alert variant="info" title="Tier 2 FR Context">
        Reassessing fluid responsiveness after Tier 1 and cardiac-specific interventions.
        Use most reliable available method. Total fluid volume: {state.patient.totalFluidMl} mL administered.
      </Alert>

      <RadioGroup
        label="FR assessment method"
        name="t2_fr_method"
        value={method}
        onChange={setMethod}
        options={[
          {
            value: 'plr_vti',
            label: 'Passive Leg Raise + VTI',
            description: '≥10% VTI increase = positive',
            badge: 'Preferred',
            badgeVariant: 'success',
          },
          {
            value: 'plr',
            label: 'Passive Leg Raise (clinical)',
            description: 'Clinical assessment of CO change after PLR',
          },
          {
            value: 'vti',
            label: 'End-expiratory Occlusion + VTI',
            description: '15-sec hold — ventilated patients',
          },
          {
            value: 'ppv',
            label: 'PPV / SVV',
            description: 'PPV > 13% = fluid responsive',
          },
          {
            value: 'not_possible',
            label: 'Not possible',
            description: 'Document reason',
            badge: 'No fluids',
            badgeVariant: 'warning',
          },
        ]}
      />

      {(method === 'plr_vti' || method === 'vti') && (
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="VTI Before"
            value={vtiBefore}
            onChange={setVtiBefore}
            unit="cm"
            min={1}
            max={50}
            step={0.1}
            placeholder="14.0"
            required
          />
          <NumberInput
            label="VTI After"
            value={vtiAfter}
            onChange={setVtiAfter}
            unit="cm"
            min={1}
            max={50}
            step={0.1}
            placeholder="16.0"
            required
          />
          {vtiChange !== null && (
            <Card className="col-span-2 text-center py-4">
              <p className="text-xs text-slate-500 mb-1">VTI Change</p>
              <p className={`text-2xl font-bold font-mono ${vtiChange >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                {vtiChange > 0 ? '+' : ''}{vtiChange}%
              </p>
              <Badge variant={vtiChange >= 10 ? 'success' : 'danger'}>
                {vtiChange >= 10 ? 'FR POSITIVE' : 'FR NEGATIVE'}
              </Badge>
            </Card>
          )}
        </div>
      )}

      {(method === 'plr' || method === 'ppv') && (
        <RadioGroup
          label="FR result"
          name="t2_fr_result"
          value={frResult}
          onChange={setFrResult}
          options={[
            { value: 'positive', label: 'Fluid Responsive', badge: 'Positive', badgeVariant: 'success' },
            { value: 'negative', label: 'Not Fluid Responsive', badge: 'Negative', badgeVariant: 'danger' },
          ]}
        />
      )}

      {frCanDetermine && frPositive && !safetyIssue && (
        <>
          <Divider label="Safety checks" />
          <CheckboxItem
            label="Worsening oxygenation"
            checked={worseningOx}
            onChange={setWorseningOx}
            variant="danger"
          />
          <CheckboxItem
            label="New pulmonary rales"
            checked={newRales}
            onChange={setNewRales}
            variant="danger"
          />
        </>
      )}

      {frCanDetermine && frPositive && !safetyIssue && (
        <>
          <Alert variant="success" title="Fluid Responsive">
            Administer 100 mL crystalloid bolus. Confirm given below.
          </Alert>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/40 bg-blue-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={bolusGiven}
              onChange={(e) => setBolusGiven(e.target.checked)}
              className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
            />
            <p className="text-sm font-medium text-slate-200">100 mL bolus administered</p>
          </label>
        </>
      )}

      {safetyIssue && (
        <Alert variant="danger" title="Fluid Withheld — Safety Issue">
          Safety contraindication — do not administer fluid bolus.
        </Alert>
      )}

      {frCanDetermine && !frPositive && method !== 'not_possible' && (
        <Alert variant="warning" title="Not Fluid Responsive">
          No fluid bolus — proceed to next Tier 2 intervention.
        </Alert>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canProceed || (frPositive === true && !safetyIssue && !bolusGiven)}
        onClick={handleProceed}
      >
        {!canProceed
          ? 'Complete assessment above'
          : 'Record & Proceed to CRT Reassessment'}
      </Button>
    </div>
  );
}
