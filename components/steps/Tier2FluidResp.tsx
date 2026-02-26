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

/**
 * Tier 2 — Fluid Responsiveness
 *
 * Per ANDROMEDA-SHOCK 2: After echo ruled out major cardiac dysfunction,
 * perform successive 500 mL fluid challenges (crystalloid or colloid, each over 30 min)
 * until one of three stop conditions is met:
 *   1. CRT normalises (<= 3s)
 *   2. Fluid responsiveness becomes negative
 *   3. Safety limits are met (CVP > 15, worsening oxygenation, new rales/B-lines)
 */
export default function Tier2FluidResp({ state, dispatch }: StepProps) {
  const [method, setMethod] = useState('');
  const [frResult, setFrResult] = useState('');
  const [vtiBefore, setVtiBefore] = useState('');
  const [vtiAfter, setVtiAfter] = useState('');
  const [worseningOx, setWorseningOx] = useState(false);
  const [newRales, setNewRales] = useState(false);
  const [cvpHigh, setCvpHigh] = useState(false);
  const [bolusGiven, setBolusGiven] = useState(false);
  const [crtAfterBolus, setCrtAfterBolus] = useState('');
  const [wantAnother, setWantAnother] = useState('');
  const [iterationDone, setIterationDone] = useState(false);

  const safetyIssue = worseningOx || newRales || cvpHigh;

  const vtiB = parseFloat(vtiBefore);
  const vtiA = parseFloat(vtiAfter);
  let vtiChange: number | null = null;
  let frPositive: boolean | null = null;
  let frCanDetermine = false;

  if ((method === 'vti' || method === 'plr_vti') && !isNaN(vtiB) && !isNaN(vtiA) && vtiB > 0) {
    vtiChange = Math.round(((vtiA - vtiB) / vtiB) * 100);
    frPositive = vtiChange >= 10;
    frCanDetermine = true;
  } else if ((method === 'plr' || method === 'ppv' || method === 'ivc' || method === 'eeot') && frResult) {
    frPositive = frResult === 'positive';
    frCanDetermine = true;
  } else if (method === 'not_possible') {
    frPositive = false;
    frCanDetermine = true;
  }

  const crtAfterVal = parseFloat(crtAfterBolus);
  const crtNormalized = !isNaN(crtAfterVal) && crtAfterVal <= 3;

  function handleFRNegative() {
    dispatch({ type: 'MARK_TIER2', key: 'fr' });
    dispatch({ type: 'UPDATE', data: { frMethod: method, frPositive: false } });
    dispatch({
      type: 'LOG',
      message: `Tier 2 FR: Negative (${method}) -- no fluid administered`,
      logType: 'info',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_tier2_fr' });
  }

  function handleSafetyStop() {
    dispatch({ type: 'MARK_TIER2', key: 'fr' });
    dispatch({
      type: 'LOG',
      message: `Tier 2 FR: Safety limit reached (${worseningOx ? 'oxygenation' : ''}${newRales ? ' rales/B-lines' : ''}${cvpHigh ? ' CVP>15' : ''}) -- fluid stopped`,
      logType: 'danger',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_tier2_fr' });
  }

  function handleGiveBolus() {
    const newTotal = state.patient.totalFluidMl + 500;
    dispatch({ type: 'UPDATE', data: {
      fluidBoluses: state.patient.fluidBoluses + 1,
      totalFluidMl: newTotal,
      frMethod: method,
      frPositive: true,
    }});
    dispatch({
      type: 'LOG',
      message: `Tier 2 fluid bolus: 500 mL over 30 min. Total fluid: ${newTotal} mL`,
      logType: 'info',
    });
    setBolusGiven(true);
  }

  function handleCRTCheck() {
    if (isNaN(crtAfterVal)) return;
    dispatch({ type: 'RECORD_CRT', value: crtAfterVal, label: 'After Tier 2 fluid bolus' });

    if (crtNormalized) {
      dispatch({ type: 'MARK_TIER2', key: 'fr' });
      dispatch({ type: 'GOTO', phase: 'normal_monitoring' });
    } else {
      setIterationDone(true);
    }
  }

  function handleRepeat() {
    // Reset for next bolus cycle
    setMethod('');
    setFrResult('');
    setVtiBefore('');
    setVtiAfter('');
    setWorseningOx(false);
    setNewRales(false);
    setCvpHigh(false);
    setBolusGiven(false);
    setCrtAfterBolus('');
    setWantAnother('');
    setIterationDone(false);
  }

  function handleStopFluids() {
    dispatch({ type: 'MARK_TIER2', key: 'fr' });
    dispatch({
      type: 'LOG',
      message: `Tier 2 fluid challenges stopped -- CRT still abnormal. Total fluid: ${state.patient.totalFluidMl} mL`,
      logType: 'warning',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_tier2_fr' });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="Fluid Responsiveness"
        title="Tier 2 -- Successive Fluid Challenges"
        subtitle="Repeat FR assessment and give 500 mL boluses until CRT normalises, FR negative, or safety limits"
      />

      <Alert variant="info" title="Tier 2 Fluid Protocol (ANDROMEDA-SHOCK 2)">
        Perform successive fluid challenges: assess FR, if positive give <strong>500 mL
        crystalloid or colloid over 30 minutes</strong>, then reassess CRT. Repeat until:
        (1) CRT normalises, (2) FR becomes negative, or (3) safety limits met
        (CVP &gt; 15, worsening oxygenation, new rales/B-lines).
        Total volume so far: <strong>{state.patient.totalFluidMl} mL</strong>.
      </Alert>

      {/* Step 1: FR Assessment */}
      {!bolusGiven && !iterationDone && (
        <>
          <RadioGroup
            label="FR assessment method"
            name="t2_fr_method"
            value={method}
            onChange={setMethod}
            options={[
              {
                value: 'plr_vti',
                label: 'Passive Leg Raise + VTI',
                description: '>= 15% VTI increase = positive',
                badge: 'Preferred',
                badgeVariant: 'success',
              },
              { value: 'plr', label: 'Passive Leg Raise + PP', description: '>= 12% PP change' },
              { value: 'ppv', label: 'PPV / SVV', description: 'PPV > 13% = positive' },
              { value: 'ivc', label: 'IVC Variation', description: '> 15% variation = positive' },
              { value: 'eeot', label: 'End-Expiratory Occlusion', description: '> 5% CO increase' },
              { value: 'vti', label: 'Mini-fluid Challenge + VTI', description: '>= 10% VTI increase' },
              {
                value: 'not_possible',
                label: 'Not possible',
                badge: 'No fluids',
                badgeVariant: 'warning',
              },
            ]}
          />

          {(method === 'plr_vti' || method === 'vti') && (
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="VTI Before" value={vtiBefore} onChange={setVtiBefore} unit="cm" min={1} max={50} step={0.1} required />
              <NumberInput label="VTI After" value={vtiAfter} onChange={setVtiAfter} unit="cm" min={1} max={50} step={0.1} required />
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

          {(method === 'plr' || method === 'ppv' || method === 'ivc' || method === 'eeot') && (
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

          {/* FR Negative → no fluid */}
          {frCanDetermine && !frPositive && (
            <>
              <Alert variant="warning" title="Not Fluid Responsive">
                FR negative -- no fluid bolus. Proceed to next Tier 2 intervention.
              </Alert>
              <Button variant="primary" size="lg" fullWidth onClick={handleFRNegative}>
                FR Negative -- Next Intervention
              </Button>
            </>
          )}

          {/* FR Positive → safety check then bolus */}
          {frCanDetermine && frPositive && (
            <>
              <Divider label="Safety checks before bolus" />
              <CheckboxItem
                label="Worsening oxygenation"
                description=">= 3-point FiO2 rise or >= 5 cmH2O PEEP increase"
                checked={worseningOx}
                onChange={setWorseningOx}
                variant="danger"
              />
              <CheckboxItem
                label="New pulmonary rales / B-lines"
                description="New bilateral crackles or B-lines suggesting overload"
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

              {safetyIssue ? (
                <>
                  <Alert variant="danger" title="Safety Limit -- Stop Fluids">
                    Safety contraindication detected. No further fluid administration.
                  </Alert>
                  <Button variant="danger" size="lg" fullWidth onClick={handleSafetyStop}>
                    Safety Stop -- Next Intervention
                  </Button>
                </>
              ) : (
                <>
                  <Alert variant="success" title="FR Positive -- Give 500 mL Bolus">
                    Administer 500 mL crystalloid or colloid over 30 minutes.
                  </Alert>
                  <Button variant="primary" size="lg" fullWidth onClick={handleGiveBolus}>
                    Confirm 500 mL Bolus Administered
                  </Button>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Step 2: After bolus → CRT check */}
      {bolusGiven && !iterationDone && (
        <>
          <Alert variant="info" title="Bolus Complete">
            500 mL bolus administered. Now reassess CRT to determine if another cycle is needed.
          </Alert>
          <NumberInput
            label="CRT after bolus"
            value={crtAfterBolus}
            onChange={setCrtAfterBolus}
            unit="seconds"
            min={0.5}
            max={15}
            step={0.5}
            placeholder="e.g. 3.0"
            hint="Normal <= 3 seconds"
            required
          />
          {!isNaN(crtAfterVal) && (
            <Card className="text-center py-5">
              <p className={`text-3xl font-bold font-mono ${crtNormalized ? 'text-green-400' : 'text-red-400'}`}>
                {crtAfterVal}s
              </p>
              <Badge variant={crtNormalized ? 'success' : 'danger'}>
                {crtNormalized ? 'NORMALIZED' : 'Still ABNORMAL'}
              </Badge>
            </Card>
          )}
          <Button
            variant={crtNormalized ? 'success' : 'warning'}
            size="lg"
            fullWidth
            disabled={isNaN(crtAfterVal)}
            onClick={handleCRTCheck}
          >
            {crtNormalized ? 'CRT Normalised -- Monitoring' : 'Record -- Assess for Next Cycle'}
          </Button>
        </>
      )}

      {/* Step 3: CRT still abnormal → repeat or stop */}
      {iterationDone && (
        <>
          <Alert variant="warning" title="CRT Still Abnormal After Bolus">
            CRT {crtAfterVal}s (still &gt; 3s). You may repeat the cycle (reassess FR, give another
            500 mL bolus) or stop fluid challenges and proceed to the next Tier 2 intervention.
          </Alert>
          <div className="flex gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={handleRepeat}>
              Repeat Cycle (Reassess FR)
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={handleStopFluids}>
              Stop Fluids -- Next Intervention
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
