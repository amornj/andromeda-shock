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

export default function Tier2Echo({ state, dispatch }: StepProps) {
  const [fac, setFac] = useState('');
  const [vti, setVti] = useState('');
  const [rvLv, setRvLv] = useState('');
  const [cvp, setCvp] = useState('');
  const [echoAvailable, setEchoAvailable] = useState('');
  const [echoNotPossible, setEchoNotPossible] = useState(false);

  const facVal = parseFloat(fac);
  const vtiVal = parseFloat(vti);
  const rvLvVal = parseFloat(rvLv);
  const cvpVal = parseFloat(cvp);

  const facValid = !isNaN(facVal) && facVal >= 0 && facVal <= 100;
  const vtiValid = !isNaN(vtiVal) && vtiVal > 0;
  const rvLvValid = !isNaN(rvLvVal) && rvLvVal > 0;
  const cvpValid = !isNaN(cvpVal) && cvpVal >= 0;

  // LV dysfunction: FAC < 40% AND VTI < 14 cm
  const lvDysfunction = facValid && vtiValid && facVal < 40 && vtiVal < 14;
  // RV failure: RV/LV ratio > 1 AND CVP > 8 mmHg
  const rvFailure = rvLvValid && cvpValid && rvLvVal > 1 && cvpVal > 8;

  let dx: 'lv' | 'rv' | 'none' | null = null;
  let echoComplete = false;

  if (echoNotPossible) {
    dx = 'none';
    echoComplete = true;
  } else if (echoAvailable === 'yes' && facValid && vtiValid && rvLvValid && cvpValid) {
    if (lvDysfunction && !rvFailure) dx = 'lv';
    else if (rvFailure && !lvDysfunction) dx = 'rv';
    else if (lvDysfunction && rvFailure) dx = 'lv'; // LV takes priority in algorithm
    else dx = 'none';
    echoComplete = true;
  } else if (echoAvailable === 'partial') {
    // Allow manual dx selection below
    echoComplete = dx !== null;
  }

  const [manualDx, setManualDx] = useState('');

  const finalDx = echoNotPossible
    ? 'none'
    : echoAvailable === 'partial' && manualDx
    ? (manualDx as 'lv' | 'rv' | 'none')
    : dx;

  const canProceed =
    finalDx !== null &&
    (echoNotPossible || echoAvailable !== '' && (echoAvailable !== 'yes' || echoComplete));

  function handleProceed() {
    if (!finalDx) return;

    dispatch({ type: 'UPDATE', data: {
      fac: facValid ? facVal : null,
      aorticVTI: vtiValid ? vtiVal : null,
      rvLvRatio: rvLvValid ? rvLvVal : null,
      cvp: cvpValid ? cvpVal : null,
      cardiacDx: finalDx,
    }});
    dispatch({ type: 'MARK_TIER2', key: 'echo' });
    dispatch({
      type: 'LOG',
      message: `Echo: ${
        echoNotPossible
          ? 'Not possible — no cardiac dx identified'
          : `${fac ? `FAC ${facVal}%` : ''}${vti ? `, VTI ${vtiVal}cm` : ''}${rvLv ? `, RV/LV ${rvLvVal}` : ''}${cvp ? `, CVP ${cvpVal}mmHg` : ''} → Dx: ${finalDx.toUpperCase()}`
      }`,
      logType: finalDx === 'none' ? 'info' : 'warning',
    });

    if (finalDx === 'lv') {
      dispatch({ type: 'GOTO', phase: 'tier2_lv_dobutamine' });
    } else if (finalDx === 'rv') {
      dispatch({ type: 'GOTO', phase: 'tier2_rv_management' });
    } else {
      dispatch({ type: 'GOTO', phase: 'tier2_fr' });
    }
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="Step 1"
        title="Bedside Echocardiography"
        subtitle="Assess cardiac function to guide targeted Tier 2 intervention"
      />

      <Alert variant="info" title="Echo-guided intervention">
        Bedside echo identifies specific cardiac phenotypes: LV systolic dysfunction
        targets dobutamine; RV failure targets RV-protective strategy. No cardiac
        dysfunction → proceed to fluid responsiveness / MAP test.
      </Alert>

      <CheckboxItem
        label="Echo not available or not feasible"
        description="Technical limitations, no operator, or clinical contraindication — skip to Tier 2 FR/MAP assessment"
        checked={echoNotPossible}
        onChange={(v) => { setEchoNotPossible(v); if (v) setEchoAvailable(''); }}
        variant="warning"
      />

      {!echoNotPossible && (
        <RadioGroup
          label="Echo availability"
          name="echo_avail"
          value={echoAvailable}
          onChange={setEchoAvailable}
          options={[
            {
              value: 'yes',
              label: 'Full quantitative assessment available',
              description: 'Can measure FAC, aortic VTI, RV/LV ratio, and CVP',
              badge: 'Preferred',
              badgeVariant: 'success',
            },
            {
              value: 'partial',
              label: 'Qualitative assessment only',
              description: 'Visual estimate — will enter clinical diagnosis manually',
            },
          ]}
        />
      )}

      {echoAvailable === 'yes' && !echoNotPossible && (
        <>
          <Divider label="LV Assessment" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="FAC (Fractional Area Change)"
              value={fac}
              onChange={setFac}
              unit="%"
              min={0}
              max={100}
              step={1}
              placeholder="e.g. 35"
              hint="FAC < 40% = LV systolic dysfunction"
              required
            />
            <NumberInput
              label="Aortic VTI"
              value={vti}
              onChange={setVti}
              unit="cm"
              min={1}
              max={50}
              step={0.5}
              placeholder="e.g. 12"
              hint="VTI < 14 cm = low stroke volume"
              required
            />
          </div>

          {facValid && vtiValid && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center py-3">
                <p className="text-xs text-slate-500 mb-1">FAC</p>
                <p className={`text-2xl font-bold font-mono ${facVal < 40 ? 'text-red-400' : 'text-green-400'}`}>
                  {facVal}%
                </p>
                <Badge variant={facVal < 40 ? 'danger' : 'success'}>
                  {facVal < 40 ? 'Low (<40%)' : 'Normal (≥40%)'}
                </Badge>
              </Card>
              <Card className="text-center py-3">
                <p className="text-xs text-slate-500 mb-1">VTI</p>
                <p className={`text-2xl font-bold font-mono ${vtiVal < 14 ? 'text-red-400' : 'text-green-400'}`}>
                  {vtiVal} cm
                </p>
                <Badge variant={vtiVal < 14 ? 'danger' : 'success'}>
                  {vtiVal < 14 ? 'Low (<14 cm)' : 'Normal (≥14 cm)'}
                </Badge>
              </Card>
            </div>
          )}

          <Divider label="RV Assessment" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="RV/LV EDA Ratio"
              value={rvLv}
              onChange={setRvLv}
              unit="ratio"
              min={0}
              max={5}
              step={0.1}
              placeholder="e.g. 0.9"
              hint="RV/LV > 1 = RV dilatation"
              required
            />
            <NumberInput
              label="CVP / RAP"
              value={cvp}
              onChange={setCvp}
              unit="mmHg"
              min={0}
              max={30}
              step={1}
              placeholder="e.g. 12"
              hint="CVP > 8 mmHg = elevated RV filling pressure"
              required
            />
          </div>

          {rvLvValid && cvpValid && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center py-3">
                <p className="text-xs text-slate-500 mb-1">RV/LV Ratio</p>
                <p className={`text-2xl font-bold font-mono ${rvLvVal > 1 ? 'text-red-400' : 'text-green-400'}`}>
                  {rvLvVal.toFixed(1)}
                </p>
                <Badge variant={rvLvVal > 1 ? 'danger' : 'success'}>
                  {rvLvVal > 1 ? 'Dilated (>1)' : 'Normal (≤1)'}
                </Badge>
              </Card>
              <Card className="text-center py-3">
                <p className="text-xs text-slate-500 mb-1">CVP</p>
                <p className={`text-2xl font-bold font-mono ${cvpVal > 8 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {cvpVal} mmHg
                </p>
                <Badge variant={cvpVal > 8 ? 'warning' : 'success'}>
                  {cvpVal > 8 ? 'Elevated (>8)' : 'Normal (≤8)'}
                </Badge>
              </Card>
            </div>
          )}

          {echoComplete && finalDx !== null && (
            <Alert
              variant={finalDx === 'none' ? 'info' : 'warning'}
              title={
                finalDx === 'lv'
                  ? 'LV Systolic Dysfunction Identified'
                  : finalDx === 'rv'
                  ? 'RV Failure Identified'
                  : 'No Specific Cardiac Phenotype'
              }
            >
              {finalDx === 'lv' && 'FAC < 40% AND VTI < 14 cm → Proceed to LV-targeted dobutamine therapy'}
              {finalDx === 'rv' && 'RV/LV > 1 AND CVP > 8 mmHg → Proceed to RV-protective management'}
              {finalDx === 'none' && 'Echo criteria not met for LV or RV dysfunction → Proceed to FR/MAP assessment'}
            </Alert>
          )}
        </>
      )}

      {echoAvailable === 'partial' && !echoNotPossible && (
        <>
          <Divider label="Clinical Diagnosis" />
          <RadioGroup
            label="Based on qualitative echo, select clinical phenotype:"
            name="manual_dx"
            value={manualDx}
            onChange={setManualDx}
            options={[
              {
                value: 'lv',
                label: 'LV Systolic Dysfunction',
                description: 'Visually impaired LV contractility with low stroke volume',
                badge: '→ Dobutamine',
                badgeVariant: 'warning',
              },
              {
                value: 'rv',
                label: 'RV Failure',
                description: 'Visually dilated RV with septal shift or elevated CVP',
                badge: '→ RV Management',
                badgeVariant: 'warning',
              },
              {
                value: 'none',
                label: 'No Specific Cardiac Dysfunction',
                description: 'Normal or indeterminate findings',
                badge: '→ FR / MAP Test',
                badgeVariant: 'neutral',
              },
            ]}
          />
        </>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!finalDx}
        onClick={handleProceed}
      >
        {!finalDx
          ? 'Complete echo assessment above'
          : finalDx === 'lv'
          ? 'LV Dysfunction → Dobutamine Therapy'
          : finalDx === 'rv'
          ? 'RV Failure → RV Management'
          : 'No Cardiac Dx → FR / MAP Assessment'}
      </Button>
    </div>
  );
}
