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
  } else if (method === 'none' || method === 'not_possible') {
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
        message: `FR assessment: ${frPositive ? 'Positive' : 'Negative'} (${method}) — SAFETY ISSUE: ${worseningOx ? 'worsening oxygenation' : ''}${newRales ? ' new rales' : ''} → Fluid withheld`,
        logType: 'danger',
      });
      dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_fluid1' });
      return;
    }

    if (frPositive) {
      dispatch({
        type: 'LOG',
        message: `FR assessment: POSITIVE (method: ${method}) — Proceed to fluid bolus`,
        logType: 'info',
      });
      dispatch({ type: 'GOTO', phase: 'tier1_fluid' });
    } else {
      dispatch({
        type: 'LOG',
        message: `FR assessment: NEGATIVE (method: ${method}) — Skip fluid bolus → CRT reassessment`,
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
        step="Step 2 of 2"
        title="Fluid Responsiveness Assessment"
        subtitle="Determine whether a fluid bolus is likely to increase cardiac output"
      />

      <Alert variant="info" title="Choose the most reliable available method">
        Passive Leg Raise with VTI change is the preferred method. Use PLR + clinical
        assessment if echo is unavailable. Avoid fluids if FR is negative or contraindicated.
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
            description: 'Raise legs 45°, measure aortic VTI before and after 1 min. ≥10% increase = positive.',
            badge: 'Preferred',
            badgeVariant: 'success',
          },
          {
            value: 'plr',
            label: 'Passive Leg Raise (clinical)',
            description: 'Raise legs 45° for 1 min. Assess change in pulse pressure, MAP, or CO clinically.',
            badge: 'Alternative',
            badgeVariant: 'info',
          },
          {
            value: 'vti',
            label: 'End-expiratory Occlusion + VTI',
            description: '15-sec end-expiratory hold: ≥10% VTI increase = positive. Ventilated patients only.',
          },
          {
            value: 'ppv',
            label: 'Pulse Pressure Variation (PPV/SVV)',
            description: 'PPV > 13% = fluid responsive. Only valid: fully ventilated, regular rhythm, TV ≥ 8 mL/kg.',
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
                {vtiChange >= 10 ? 'FR POSITIVE (≥10%)' : 'FR NEGATIVE (<10%)'}
              </Badge>
            </Card>
          )}
        </div>
      )}

      {(method === 'plr' || method === 'ppv') && (
        <RadioGroup
          label="FR result"
          name="fr_result"
          value={frResult}
          onChange={setFrResult}
          options={[
            {
              value: 'positive',
              label: 'Fluid Responsive',
              description:
                method === 'ppv'
                  ? 'PPV/SVV > 13%'
                  : 'Clear increase in MAP, pulse pressure, or CO after PLR',
              badge: 'Positive',
              badgeVariant: 'success',
            },
            {
              value: 'negative',
              label: 'Not Fluid Responsive',
              description:
                method === 'ppv'
                  ? 'PPV/SVV ≤ 13%'
                  : 'No meaningful change after PLR',
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
            Check for fluid administration contraindications before proceeding:
          </p>
          <CheckboxItem
            label="Worsening oxygenation"
            description="SpO2 decreasing or FiO2 requirements increasing since last assessment"
            checked={worseningOx}
            onChange={setWorseningOx}
            variant="danger"
          />
          <CheckboxItem
            label="New pulmonary rales"
            description="New or worsening bilateral crackles on auscultation"
            checked={newRales}
            onChange={setNewRales}
            variant="danger"
          />
        </>
      )}

      {safetyIssue && frCanDetermine && (
        <Alert variant="danger" title="Fluid Administration Contraindicated">
          Safety issue detected — do NOT administer fluid bolus. Proceed to CRT reassessment.
        </Alert>
      )}

      {frCanDetermine && !safetyIssue && frPositive && (
        <Alert variant="success" title="Fluid Responsive">
          FR positive → Administer 100 mL crystalloid bolus over 10 minutes.
        </Alert>
      )}

      {frCanDetermine && !safetyIssue && frPositive === false && method !== 'not_possible' && (
        <Alert variant="warning" title="Not Fluid Responsive">
          FR negative → Skip fluid bolus. Proceed directly to CRT reassessment.
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
          ? 'Safety Issue — Skip Fluid → CRT Reassessment'
          : frPositive
          ? 'Fluid Responsive → Administer Bolus'
          : 'Not Fluid Responsive → CRT Reassessment'}
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

  const bolusCount = state.patient.fluidBoluses;
  const totalMl = state.patient.totalFluidMl;
  const safetyIssue = worseningOx || newRales;

  function handleGiveAnother() {
    const newTotal = totalMl + 100;
    dispatch({ type: 'UPDATE', data: { fluidBoluses: bolusCount + 1, totalFluidMl: newTotal } });
    dispatch({
      type: 'LOG',
      message: `Fluid bolus #${bolusCount + 1}: 100 mL crystalloid given. Total: ${newTotal} mL`,
      logType: 'info',
    });
    setConfirmed(false);
    setCheckAgain(false);
    setFrStillPositive('');
    setWorseningOx(false);
    setNewRales(false);
  }

  function handleDone() {
    const newTotal = totalMl + (confirmed && bolusCount === 0 ? 100 : 0);
    const finalTotal = bolusCount === 0 ? (state.patient.totalFluidMl || 0) + 100 : state.patient.totalFluidMl;
    dispatch({
      type: 'LOG',
      message: `Fluid resuscitation complete. Total boluses: ${bolusCount + (bolusCount === 0 ? 1 : 0)}, total: ${finalTotal} mL → CRT reassessment`,
      logType: 'info',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_fluid1' });
  }

  function handleFirstBolus() {
    const newTotal = (state.patient.totalFluidMl || 0) + 100;
    dispatch({ type: 'UPDATE', data: { fluidBoluses: bolusCount + 1, totalFluidMl: newTotal } });
    dispatch({
      type: 'LOG',
      message: `Fluid bolus #${bolusCount + 1}: 100 mL crystalloid given. Total: ${newTotal} mL`,
      logType: 'info',
    });
    setCheckAgain(true);
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 1"
        step="Fluid Bolus"
        title="Administer 100 mL Crystalloid Bolus"
        subtitle="Fluid responsiveness confirmed — give crystalloid and reassess"
      />

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Boluses Given</p>
          <p className="text-3xl font-bold font-mono text-blue-400">{state.patient.fluidBoluses}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Volume</p>
          <p className="text-3xl font-bold font-mono text-blue-400">{state.patient.totalFluidMl} mL</p>
        </Card>
      </div>

      <Alert variant="info" title="Bolus Protocol">
        Give <strong>100 mL 0.9% NaCl or Lactated Ringer&apos;s</strong> IV over 10 minutes.
        Monitor SpO2 and respiratory status during infusion. Maximum 3 boluses before
        mandatory CRT reassessment.
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
                100 mL bolus administered over 10 minutes
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
            Bolus Given — Check FR Again
          </Button>
        </>
      )}

      {checkAgain && (
        <>
          <Divider label="Re-assess Fluid Responsiveness" />

          <RadioGroup
            label="Is the patient still fluid responsive?"
            name="fr_repeat"
            value={frStillPositive}
            onChange={setFrStillPositive}
            options={[
              {
                value: 'yes',
                label: 'Still fluid responsive',
                description: 'Repeat FR assessment remains positive and within limits',
                badge: 'Give another',
                badgeVariant: 'info',
              },
              {
                value: 'no',
                label: 'No longer fluid responsive',
                description: 'FR assessment now negative — stop fluids',
                badge: 'Stop fluids',
                badgeVariant: 'neutral',
              },
            ]}
          />

          {frStillPositive && (
            <>
              <Divider label="Safety checks" />
              <CheckboxItem
                label="Worsening oxygenation"
                description="SpO2 decreasing or increasing FiO2 requirement"
                checked={worseningOx}
                onChange={setWorseningOx}
                variant="danger"
              />
              <CheckboxItem
                label="New pulmonary rales"
                description="New bilateral crackles on auscultation"
                checked={newRales}
                onChange={setNewRales}
                variant="danger"
              />
            </>
          )}

          {safetyIssue && (
            <Alert variant="danger" title="Stop — Safety Issue">
              Fluid administration must stop due to safety concern. Proceed to CRT reassessment.
            </Alert>
          )}

          {state.patient.fluidBoluses >= 3 && !safetyIssue && (
            <Alert variant="warning" title="Maximum Boluses Reached">
              3 boluses given — mandatory CRT reassessment before further fluids.
            </Alert>
          )}

          <div className="flex gap-3">
            {frStillPositive === 'yes' && !safetyIssue && state.patient.fluidBoluses < 3 && (
              <Button variant="primary" size="lg" fullWidth onClick={handleGiveAnother}>
                Give Another 100 mL Bolus
              </Button>
            )}
            <Button variant="ghost" size="lg" fullWidth onClick={handleDone}>
              {safetyIssue || frStillPositive === 'no' || state.patient.fluidBoluses >= 3
                ? 'Proceed to CRT Reassessment'
                : 'Done — CRT Reassessment'}
            </Button>
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
