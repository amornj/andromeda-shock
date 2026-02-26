'use client';

import { useState } from 'react';
import type { StepProps } from './types';
import {
  StepHeader,
  Alert,
  Button,
  Divider,
  RadioGroup,
  Card,
} from '@/components/shared/ui';

export default function Tier2RVManagement({ state, dispatch }: StepProps) {
  const [actionsConfirmed, setActionsConfirmed] = useState<Record<string, boolean>>({});
  const [response, setResponse] = useState('');

  const toggleAction = (key: string) => {
    setActionsConfirmed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const anyActionDone = Object.values(actionsConfirmed).some(Boolean);

  function handleComplete() {
    if (!response) return;
    const result = response === 'improved';

    dispatch({ type: 'UPDATE', data: { rvManagementResult: result } });
    dispatch({
      type: 'LOG',
      message: `RV management: ${result ? 'CRT improved' : 'No response'}. Actions: ${Object.entries(actionsConfirmed).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none documented'} → CRT reassessment`,
      logType: result ? 'success' : 'warning',
    });
    dispatch({ type: 'GOTO', phase: 'crt_reassess', ctx: 'post_tier2_rv' });
  }

  const rvActions = [
    {
      key: 'avoid_fluid',
      label: 'No further fluid administration',
      description: 'Per protocol: no further fluid loading recommended in RV failure',
    },
    {
      key: 'reduce_peep',
      label: 'Reduce PEEP < 10 cmH2O',
      description: 'Decrease right ventricular afterload by lowering intrathoracic pressure',
    },
    {
      key: 'limit_pplat',
      label: 'Limit plateau pressure < 28 cmH2O',
      description: 'Prevent further RV afterload increase from excessive airway pressures',
    },
    {
      key: 'prone',
      label: 'Consider prone positioning (if severe ARDS)',
      description: 'Reduces RV afterload and improves oxygenation in severe ARDS patients',
    },
    {
      key: 'vasopressin',
      label: 'Add vasopressin 0.03-0.04 U/min (optional)',
      description: 'Maintains systemic MAP without increasing pulmonary vascular resistance',
    },
    {
      key: 'iNO',
      label: 'Inhaled nitric oxide (if available, optional)',
      description: 'Pulmonary vasodilator to reduce RV afterload -- 10-40 ppm',
    },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        tier="Tier 2"
        step="RV Management"
        title="RV Failure — Protective Management"
        subtitle="Echo-confirmed RV failure: reduce afterload, optimise preload, and protect RV function"
      />

      <Alert variant="warning" title="Indication">
        RV failure confirmed: RV/LV ratio &gt; 1 AND CVP &gt; 8 mmHg. Goal: reduce pulmonary
        vascular resistance, optimise RV preload, and maintain systemic perfusion without
        further RV stress.
      </Alert>

      <div className="grid grid-cols-2 gap-3">
        {state.patient.rvLvRatio !== null && (
          <Card className="text-center py-4">
            <p className="text-xs text-slate-500 mb-1">RV/LV Ratio</p>
            <p className="text-2xl font-bold font-mono text-red-400">{state.patient.rvLvRatio.toFixed(1)}</p>
          </Card>
        )}
        {state.patient.cvp !== null && (
          <Card className="text-center py-4">
            <p className="text-xs text-slate-500 mb-1">CVP</p>
            <p className="text-2xl font-bold font-mono text-yellow-400">{state.patient.cvp} mmHg</p>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          RV Management Actions
        </p>
        <p className="text-xs text-slate-500">Check all actions performed:</p>
        {rvActions.map((action) => (
          <label
            key={action.key}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30 cursor-pointer hover:border-slate-600 transition-all"
          >
            <input
              type="checkbox"
              checked={!!actionsConfirmed[action.key]}
              onChange={() => toggleAction(action.key)}
              className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">{action.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
            </div>
          </label>
        ))}
      </div>

      <Divider label="After management — record response (1 hour)" />

      <RadioGroup
        label="Clinical response after RV management"
        name="rv_response"
        value={response}
        onChange={setResponse}
        options={[
          {
            value: 'improved',
            label: 'CRT improved / normalising',
            description: 'Improvement in peripheral perfusion markers',
            badge: 'Positive',
            badgeVariant: 'success',
          },
          {
            value: 'no_response',
            label: 'No meaningful improvement',
            description: 'CRT still abnormal — proceed to next Tier 2 intervention',
            badge: 'No response',
            badgeVariant: 'danger',
          },
        ]}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!response || !anyActionDone}
        onClick={handleComplete}
      >
        {!anyActionDone
          ? 'Confirm at least one management action'
          : !response
          ? 'Select clinical response above'
          : 'Record Response → CRT Reassessment'}
      </Button>
    </div>
  );
}
