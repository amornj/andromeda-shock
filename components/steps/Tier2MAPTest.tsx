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
  NumberInput,
  CheckboxItem,
} from '@/components/shared/ui';

export default function Tier2MAPTest({ state, dispatch }: StepProps) {
  const [confirmedHTN, setConfirmedHTN] = useState(
    state.patient.hasChronicHTN === true ? true : false
  );
  const [mapAchieved, setMapAchieved] = useState('');
  const [currentMap, setCurrentMap] = useState('');
  const [started, setStarted] = useState(false);
  const [response, setResponse] = useState('');

  const currentMapVal = parseFloat(currentMap);
  const currentMapValid = !isNaN(currentMapVal) && currentMapVal > 30;
  const mapTarget = 80;

  function handleStart() {
    dispatch({ type: 'UPDATE', data: { hasChronicHTN: confirmedHTN } });
    dispatch({
      type: 'LOG',
      message: `MAP test started — targeting MAP 80–85 mmHg for 1 hour (chronic HTN patient). Current MAP: ${currentMapVal} mmHg`,
      logType: 'info',
    });
    setStarted(true);
  }

  function handleComplete() {
    if (!response) return;
    const result = response === 'improved';

    dispatch({ type: 'MARK_TIER2', key: 'map' });
    dispatch({ type: 'UPDATE', data: { mapTestResult: result } });
    dispatch({
      type: 'LOG',
      message: `MAP test (80–85 mmHg, 1hr): ${result ? 'CRT improved' : 'No response'} → CRT reassessment`,
      logType: result ? 'success' : 'warning',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_map' });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="MAP Test"
        title="MAP Test — Chronic Hypertension"
        subtitle="For patients with chronic HTN: target MAP 80–85 mmHg to address relative hypotension"
      />

      <Alert variant="info" title="Rationale">
        Chronically hypertensive patients have rightward-shifted cerebral and peripheral
        autoregulation curves. A standard MAP ≥ 65 mmHg target may be insufficient —
        targeting MAP 80–85 mmHg may restore microcirculatory perfusion and normalise CRT.
      </Alert>

      {!started && (
        <>
          <CheckboxItem
            label="Confirmed chronic hypertension"
            description="Known diagnosis of essential or secondary hypertension requiring antihypertensive medication"
            checked={confirmedHTN}
            onChange={setConfirmedHTN}
          />

          {!confirmedHTN && (
            <Alert variant="warning" title="MAP Test Indication">
              MAP test is indicated for patients with known chronic hypertension only.
              If the patient is not hypertensive, skip to Dobutamine Test.
            </Alert>
          )}

          {confirmedHTN && (
            <>
              <NumberInput
                label="Current MAP"
                value={currentMap}
                onChange={setCurrentMap}
                unit="mmHg"
                min={30}
                max={150}
                step={1}
                placeholder="e.g. 68"
                hint="Baseline MAP before uptitrating vasopressors"
                required
              />

              {currentMapValid && currentMapVal < mapTarget && (
                <Alert variant="warning" title="MAP Below Target">
                  Current MAP {currentMapVal} mmHg — below 80–85 target. Uptitrate NE
                  to achieve target MAP. Monitor for NE-related adverse effects.
                </Alert>
              )}

              {currentMapValid && currentMapVal >= mapTarget && (
                <Alert variant="info" title="MAP Already at Target">
                  Current MAP {currentMapVal} mmHg is already at the 80–85 target range.
                  Observe for 1 hour and record CRT response.
                </Alert>
              )}

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-300">MAP Test Protocol</p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-blue-400">1.</span>
                    <span>Uptitrate NE to achieve MAP <strong className="text-slate-200">80–85 mmHg</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">2.</span>
                    <span>Maintain target MAP for <strong className="text-slate-200">1 hour</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">3.</span>
                    <span>Reassess CRT at end of 1-hour trial</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">4.</span>
                    <span>If CRT normalises → maintain target. If no response → next intervention</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!currentMapValid}
                onClick={handleStart}
              >
                Start MAP Test (Target 80–85 mmHg)
              </Button>
            </>
          )}

          {!confirmedHTN && (
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => {
                dispatch({ type: 'MARK_TIER2', key: 'map' });
                dispatch({ type: 'LOG', message: 'MAP test skipped — no chronic HTN', logType: 'info' });
                dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_map' });
              }}
            >
              Skip MAP Test (No Chronic HTN) → Next Step
            </Button>
          )}
        </>
      )}

      {started && (
        <>
          <Card className="text-center py-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">MAP Target</p>
            <p className="text-3xl font-bold font-mono text-blue-400">80–85 mmHg</p>
            <p className="text-xs text-slate-400 mt-2">Maintain for 1 hour — then reassess CRT</p>
          </Card>

          <Divider label="After 1-hour trial" />

          <RadioGroup
            label="Clinical response after MAP 80–85 for 1 hour"
            name="map_response"
            value={response}
            onChange={setResponse}
            options={[
              {
                value: 'improved',
                label: 'CRT improved / normalised',
                description: 'Peripheral perfusion improved with higher MAP target',
                badge: 'Positive',
                badgeVariant: 'success',
              },
              {
                value: 'no_response',
                label: 'No meaningful improvement',
                description: 'CRT still abnormal — proceed to next intervention',
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
    </div>
  );
}
