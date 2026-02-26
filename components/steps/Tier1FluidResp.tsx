'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  RadioGroup,
  Button,
  CheckboxItem,
  Divider,
  Badge,
  Card,
  NumberInput,
} from '@/components/shared/ui';

// ─── Fluid Responsiveness Assessment (tier1_fr) ───────────────────────────────

function FRAssessment({ state, dispatch }: StepProps) {
  const [method, setMethod] = useState('');
  const [frResult, setFrResult] = useState('');
  const [worseningOx, setWorseningOx] = useState(false);
  const [newRales, setNewRales] = useState(false);
  const [vtiBefore, setVtiBefore] = useState('');
  const [vtiAfter, setVtiAfter] = useState('');

  const safetyIssue = worseningOx || newRales;
  const methodChosen = method !== '';

  let frPositive: boolean | null = null;
  let frCanDetermine = false;

  if (method === 'plr' && frResult) {
    frPositive = frResult === 'positive';
    frCanDetermine = true;
  } else if (method === 'vti' || method === 'plr_vti') {
    const vtiB = parseFloat(vtiBefore);
    const vtiA = parseFloat(vtiAfter);
    if (!isNaN(vtiB) && !isNaN(vtiA) && vtiB > 0) {
      const change = ((vtiA - vtiB) / vtiB) * 100;
      frPositive = change >= 10;
      frCanDetermine = true;
    }
  } else if (method === 'ppv' && frResult) {
    frPositive = frResult === 'positive';
    frCanDetermine = true;
  } else if (method === 'ivc' && frResult) {
    frPositive = frResult === 'positive';
    frCanDetermine = true;
  } else if (method === 'eeot' && frResult) {
    frPositive = frResult === 'positive';
    frCanDetermine = true;
  } else if (method === 'not_possible') {
    frPositive = false;
    frCanDetermine = true;
  }

  const canProceed = methodChosen && frCanDetermine;

  function handleProceed() {
    if (!canProceed) return;

    dispatch({ type: 'UPDATE', data: { frMethod: method, frPositive, worseningOx, newRales } });

    if (safetyIssue) {
      dispatch({
        type: 'LOG',
        message: `FR assessment: ${frPositive ? 'Positive' : 'Negative'} (${method}) -- SAFETY ISSUE: ${worseningOx ? 'worsening oxygenation' : ''}${newRales ? ' new rales' : ''} -- Fluid withheld`,
        logType: 'danger',
      });
      dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_fluid1' });
      return;
    }

    if (frPositive) {
      dispatch({
        type: 'LOG',
        message: `FR assessment: POSITIVE (method: ${method}) -- Proceed to 500 mL fluid bolus`,
        logType: 'info',
      });
      dispatch({ type: 'GOTO', phase: 'tier1_fluid' });
    } else {
      dispatch({
        type: 'LOG',
        message: `FR assessment: NEGATIVE (method: ${method}) -- Skip fluid bolus -- CRT reassessment`,
        logType: 'info',
      });
      dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_fluid1' });
    }
  }

  const vtiB = parseFloat(vtiBefore);
  const vtiA = parseFloat(vtiAfter);
  let vtiChange: number | null = null;
  if (!isNaN(vtiB) && !isNaN(vtiA) && vtiB > 0) {
    vtiChange = Math.round(((vtiA - vtiB) / vtiB) * 100);
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 1"
        step="Step 2"
        title="Fluid Responsiveness Assessment"
        subtitle="Systematic FR assessment before any fluid administration (PP < 40 mmHg pathway)"
      />

      <Alert variant="info" title="Assess before giving fluids">
        Per ANDROMEDA-SHOCK 2: fluid responsiveness MUST be assessed before any fluid
        bolus. If FR positive, give 500 mL crystalloid or colloid over 30 minutes.
        Maximum 1000 mL (2 boluses) in Tier 1.
      </Alert>

      <RadioGroup
        label="Assessment method"
        name="fr_method"
        value={method}
        onChange={setMethod}
        options={[
          {
            value: 'plr_vti',
            label: 'Passive Leg Raise + VTI (Echo)',
            description: 'Raise legs 45 deg, measure aortic VTI before and after 1 min. >= 15% increase = positive.',
            badge: 'Preferred',
            badgeVariant: 'success',
          },
          {
            value: 'plr',
            label: 'Passive Leg Raise + Pulse Pressure',
            description: 'Raise legs 45 deg for 1 min. >= 12% PP change = positive.',
          },
          {
            value: 'ppv',
            label: 'Pulse Pressure Variation (PPV)',
            description: 'PPV > 13% = fluid responsive. Requires: ventilated, no spontaneous breaths, sinus rhythm, TV >= 8 mL/kg.',
          },
          {
            value: 'ivc',
            label: 'IVC Variation (Echo)',
            description: 'IVC distensibility > 15% during mechanical ventilation = positive.',
          },
          {
            value: 'eeot',
            label: 'End-Expiratory Occlusion Test',
            description: '15-sec end-expiratory hold: > 5% increase in CO = positive. Ventilated patients only.',
          },
          {
            value: 'vti',
            label: 'Mini-fluid Challenge + VTI',
            description: '100 mL challenge: >= 10% VTI increase = positive.',
          },
          {
            value: 'not_possible',
            label: 'FR assessment not possible',
            description: 'Document reason (arrhythmia, spontaneous breathing, contraindication).',
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
            placeholder="e.g. 14.0"
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
            placeholder="e.g. 15.8"
            required
          />
          {vtiChange !== null && (
            <Card className="col-span-2 text-center py-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">VTI Change</p>
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

      {(method === 'plr' || method === 'ppv' || method === 'ivc' || method === 'eeot') && (
        <RadioGroup
          label="FR result"
          name="fr_result"
          value={frResult}
          onChange={setFrResult}
          options={[
            {
              value: 'positive',
              label: 'Fluid Responsive',
              badge: 'Positive',
              badgeVariant: 'success',
            },
            {
              value: 'negative',
              label: 'Not Fluid Responsive',
              badge: 'Negative',
              badgeVariant: 'danger',
            },
          ]}
        />
      )}

      {methodChosen && frCanDetermine && !safetyIssue && (
        <>
          <Divider label="Safety checks" />
          <p className="text-xs text-slate-400">
            Check for fluid administration contraindications:
          </p>
          <CheckboxItem
            label="Worsening oxygenation"
            description=">= 3-point rise in FiO2 requirement or >= 5 cmH2O increase in PEEP"
            checked={worseningOx}
            onChange={setWorseningOx}
            variant="danger"
          />
          <CheckboxItem
            label="New pulmonary rales or B-lines"
            description="New or worsening bilateral crackles / B-lines suggesting fluid overload"
            checked={newRales}
            onChange={setNewRales}
            variant="danger"
          />
        </>
      )}

      {safetyIssue && frCanDetermine && (
        <Alert variant="danger" title="Fluid Administration Contraindicated">
          Safety issue detected -- do NOT administer fluid bolus. Proceed to CRT reassessment.
        </Alert>
      )}

      {frCanDetermine && !safetyIssue && frPositive && (
        <Alert variant="success" title="Fluid Responsive">
          FR positive -- administer <strong>500 mL crystalloid or colloid over 30 minutes</strong>.
        </Alert>
      )}

      {frCanDetermine && !safetyIssue && frPositive === false && method !== 'not_possible' && (
        <Alert variant="warning" title="Not Fluid Responsive">
          FR negative -- skip fluid bolus. Proceed to CRT reassessment.
        </Alert>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canProceed}
        onClick={handleProceed}
      >
        {!canProceed
          ? 'Complete assessment above'
          : safetyIssue
          ? 'Safety Issue -- Skip Fluid -- CRT Reassessment'
          : frPositive
          ? 'FR Positive -- Give 500 mL Bolus'
          : 'FR Negative -- CRT Reassessment'}
      </Button>
    </div>
  );
}

// ─── Fluid Bolus Administration (tier1_fluid) ─────────────────────────────────

function FluidBolus({ state, dispatch }: StepProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [checkAgain, setCheckAgain] = useState(false);
  const [frStillPositive, setFrStillPositive] = useState('');
  const [worseningOx, setWorseningOx] = useState(false);
  const [newRales, setNewRales] = useState(false);
  const [cvpHigh, setCvpHigh] = useState(false);

  const bolusCount = state.patient.fluidBoluses;
  const totalMl = state.patient.totalFluidMl;
  const safetyIssue = worseningOx || newRales || cvpHigh;
  const maxTier1Fluid = 1000; // per protocol
  const bolusSize = 500;
  const atLimit = totalMl >= maxTier1Fluid;

  function handleFirstBolus() {
    const newTotal = (state.patient.totalFluidMl || 0) + bolusSize;
    dispatch({ type: 'UPDATE', data: { fluidBoluses: bolusCount + 1, totalFluidMl: newTotal } });
    dispatch({
      type: 'LOG',
      message: `Fluid bolus #${bolusCount + 1}: ${bolusSize} mL over 30 min. Total: ${newTotal} mL`,
      logType: 'info',
    });
    setCheckAgain(true);
  }

  function handleGiveSecond() {
    const newTotal = state.patient.totalFluidMl + bolusSize;
    dispatch({ type: 'UPDATE', data: { fluidBoluses: state.patient.fluidBoluses + 1, totalFluidMl: newTotal } });
    dispatch({
      type: 'LOG',
      message: `Fluid bolus #${state.patient.fluidBoluses + 1}: ${bolusSize} mL over 30 min. Total: ${newTotal} mL`,
      logType: 'info',
    });
    // After second bolus → CRT reassess
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_fluid1' });
  }

  function handleDone() {
    dispatch({
      type: 'LOG',
      message: `Tier 1 fluid complete. Total: ${state.patient.totalFluidMl} mL in ${state.patient.fluidBoluses} bolus(es) -- CRT reassessment`,
      logType: 'info',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_fluid1' });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 1"
        step="Fluid Bolus"
        title="Administer 500 mL Fluid Bolus"
        subtitle="Fluid responsiveness confirmed -- give 500 mL crystalloid or colloid over 30 minutes"
      />

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Boluses Given</p>
          <p className="text-3xl font-bold font-mono text-blue-400">{state.patient.fluidBoluses}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Volume</p>
          <p className="text-3xl font-bold font-mono text-blue-400">{state.patient.totalFluidMl} mL</p>
          <p className="text-xs text-slate-500 mt-1">Max {maxTier1Fluid} mL in Tier 1</p>
        </Card>
      </div>

      <Alert variant="info" title="Bolus Protocol (ANDROMEDA-SHOCK 2)">
        Give <strong>500 mL crystalloid or 5% albumin</strong> IV over <strong>30 minutes</strong>.
        Maximum 2 boluses (1000 mL total) in Tier 1. Reassess CRT after each bolus.
        If CRT still abnormal after first bolus, reassess FR before giving second.
      </Alert>

      {!checkAgain && (
        <>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/40 bg-blue-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">
                500 mL bolus administered over 30 minutes
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirm infusion complete before proceeding
              </p>
            </div>
          </label>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!confirmed}
            onClick={handleFirstBolus}
          >
            Bolus Given -- Assess Response
          </Button>
        </>
      )}

      {checkAgain && (
        <>
          <Divider label="After bolus -- reassess CRT and FR" />

          <Alert variant="neutral" title="Decision Point">
            Reassess CRT. If still abnormal AND patient is still fluid responsive AND within
            safety limits, a second 500 mL bolus can be administered (max 1000 mL total).
          </Alert>

          {!atLimit && (
            <RadioGroup
              label="Is the patient still fluid responsive for a second bolus?"
              name="fr_repeat"
              value={frStillPositive}
              onChange={setFrStillPositive}
              options={[
                {
                  value: 'yes',
                  label: 'Still fluid responsive + CRT still abnormal',
                  description: 'FR reassessment positive -- consider second 500 mL bolus',
                  badge: 'Give 2nd bolus',
                  badgeVariant: 'info',
                },
                {
                  value: 'no',
                  label: 'No longer fluid responsive OR CRT normalised',
                  description: 'Stop fluids -- proceed to CRT reassessment',
                  badge: 'Stop fluids',
                  badgeVariant: 'neutral',
                },
              ]}
            />
          )}

          {atLimit && (
            <Alert variant="warning" title="Tier 1 Fluid Limit Reached">
              {maxTier1Fluid} mL administered -- maximum Tier 1 fluid reached. Proceed to CRT reassessment.
            </Alert>
          )}

          {frStillPositive === 'yes' && !atLimit && (
            <>
              <Divider label="Safety checks before 2nd bolus" />
              <CheckboxItem
                label="Worsening oxygenation"
                description=">= 3-point rise in FiO2 or >= 5 cmH2O PEEP increase"
                checked={worseningOx}
                onChange={setWorseningOx}
                variant="danger"
              />
              <CheckboxItem
                label="New pulmonary rales / B-lines"
                description="New bilateral crackles or B-lines on lung ultrasound"
                checked={newRales}
                onChange={setNewRales}
                variant="danger"
              />
              <CheckboxItem
                label="CVP > 15 mmHg"
                description="Central venous pressure exceeds safety threshold"
                checked={cvpHigh}
                onChange={setCvpHigh}
                variant="danger"
              />
            </>
          )}

          {safetyIssue && frStillPositive === 'yes' && (
            <Alert variant="danger" title="Safety Limit -- No Further Fluids">
              Safety contraindication detected. Proceed to CRT reassessment without additional fluid.
            </Alert>
          )}

          <div className="flex gap-3">
            {frStillPositive === 'yes' && !safetyIssue && !atLimit && (
              <Button variant="primary" size="lg" fullWidth onClick={handleGiveSecond}>
                Give 2nd 500 mL Bolus
              </Button>
            )}
            {(frStillPositive === 'no' || safetyIssue || atLimit) && (
              <Button variant="ghost" size="lg" fullWidth onClick={handleDone}>
                Proceed to CRT Reassessment
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Export: routes to the right sub-component based on phase ────────────────

export default function Tier1FluidResp(props: StepProps) {
  if (props.state.phase === 'tier1_fluid') {
    return <FluidBolus {...props} />;
  }
  return <FRAssessment {...props} />;
}
