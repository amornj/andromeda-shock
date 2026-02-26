'use client';

import { useReducer } from 'react';
import { reducer, initialState } from '@/lib/reducer';
import ProgressIndicator from '@/components/shared/ProgressIndicator';
import Timer from '@/components/shared/Timer';
import DecisionLog from '@/components/shared/DecisionLog';
import InitialAssessment from '@/components/steps/InitialAssessment';
import NormalMonitoring from '@/components/steps/NormalMonitoring';
import Tier1PulsePress from '@/components/steps/Tier1PulsePress';
import Tier1FluidResp from '@/components/steps/Tier1FluidResp';
import CRTReassess from '@/components/steps/CRTReassess';
import Tier2Echo from '@/components/steps/Tier2Echo';
import Tier2LVDobutamine from '@/components/steps/Tier2LVDobutamine';
import Tier2RVManagement from '@/components/steps/Tier2RVManagement';
import Tier2FluidResp from '@/components/steps/Tier2FluidResp';
import Tier2MAPTest from '@/components/steps/Tier2MAPTest';
import Tier2DobutamineTest from '@/components/steps/Tier2DobutamineTest';
import { Button, Card } from '@/components/shared/ui';

export default function AlgorithmWizard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const lastCrt = state.patient.crtHistory.length > 0
    ? state.patient.crtHistory[state.patient.crtHistory.length - 1].time
    : null;

  function renderStep() {
    switch (state.phase) {
      case 'initial':
        return <InitialAssessment state={state} dispatch={dispatch} />;
      case 'normal_monitoring':
        return <NormalMonitoring state={state} dispatch={dispatch} />;
      case 'tier1_pp':
        return <Tier1PulsePress state={state} dispatch={dispatch} />;
      case 'tier1_fr':
      case 'tier1_fluid':
        return <Tier1FluidResp state={state} dispatch={dispatch} />;
      case 'crt_reassess':
        return <CRTReassess state={state} dispatch={dispatch} />;
      case 'tier2_echo':
        return <Tier2Echo state={state} dispatch={dispatch} />;
      case 'tier2_lv_dobutamine':
        return <Tier2LVDobutamine state={state} dispatch={dispatch} />;
      case 'tier2_rv_management':
        return <Tier2RVManagement state={state} dispatch={dispatch} />;
      case 'tier2_fr':
        return <Tier2FluidResp state={state} dispatch={dispatch} />;
      case 'tier2_map':
        return <Tier2MAPTest state={state} dispatch={dispatch} />;
      case 'tier2_dobutamine':
        return <Tier2DobutamineTest state={state} dispatch={dispatch} />;
      case 'tier2_rescue':
        return <RescueTherapies state={state} dispatch={dispatch} />;
      case 'print_summary':
        return <Summary state={state} dispatch={dispatch} />;
      default:
        return <InitialAssessment state={state} dispatch={dispatch} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              ANDROMEDA-SHOCK 2
            </h1>
            <p className="text-xs text-slate-400">
              CRT-PHR Algorithm — Clinical Decision Support
            </p>
          </div>
          {state.phase !== 'initial' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              Reset
            </Button>
          )}
        </div>
      </header>

      {/* Progress */}
      {state.phase !== 'initial' && state.phase !== 'print_summary' && (
        <ProgressIndicator phase={state.phase} />
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step panel */}
          <div className="lg:col-span-2">{renderStep()}</div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Timer
              protocolStart={state.protocolStart}
              lastReassessTime={lastCrt}
            />
            <DecisionLog entries={state.log} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 px-4 text-center">
        <p className="text-xs text-slate-600">
          Based on ANDROMEDA-SHOCK 2 (Hernandez G et al., JAMA 2025; 334(22): 1988-1999).
          For clinical decision support only — does not replace clinical judgment.
        </p>
      </footer>
    </div>
  );
}

/* ─── Inline: Rescue Therapies ──────────────────────────────────────────── */

import type { StepProps } from '@/components/steps/types';
import { Alert, StepHeader } from '@/components/shared/ui';

function RescueTherapies({ state, dispatch }: StepProps) {
  return (
    <Card>
      <StepHeader
        tier="Tier 2"
        title="Rescue Therapies"
        subtitle="CRT remains abnormal after all protocol interventions. Management reverts to clinician judgment."
      />
      <Alert variant="danger" title="Refractory Shock">
        All structured protocol interventions have been exhausted. Consider rescue
        therapies based on clinical judgment:
      </Alert>
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        <li className="flex items-start gap-2">
          <span className="text-slate-500">•</span>
          Stress-dose corticosteroids (hydrocortisone 200 mg/day)
        </li>
        <li className="flex items-start gap-2">
          <span className="text-slate-500">•</span>
          High-volume hemofiltration
        </li>
        <li className="flex items-start gap-2">
          <span className="text-slate-500">•</span>
          Extracorporeal blood purification / adsorption
        </li>
        <li className="flex items-start gap-2">
          <span className="text-slate-500">•</span>
          Consider additional vasopressors (vasopressin, terlipressin)
        </li>
        <li className="flex items-start gap-2">
          <span className="text-slate-500">•</span>
          Reassess diagnosis — consider alternative causes of shock
        </li>
      </ul>
      <div className="flex gap-3 mt-6">
        <Button
          variant="primary"
          onClick={() => {
            dispatch({ type: 'LOG', message: 'Rescue therapies initiated — clinician judgment', logType: 'danger' });
            dispatch({ type: 'GOTO', phase: 'print_summary' });
          }}
        >
          View Summary
        </Button>
      </div>
    </Card>
  );
}

/* ─── Inline: Summary ───────────────────────────────────────────────────── */

function Summary({ state, dispatch }: StepProps) {
  const crtEntries = state.patient.crtHistory;

  return (
    <div className="space-y-6 print:text-black">
      <Card>
        <StepHeader title="Protocol Summary" subtitle="Review of all interventions and decisions" />

        {/* CRT History */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">CRT History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Time</th>
                  <th className="text-left py-2 text-slate-400 font-medium">CRT (s)</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Context</th>
                </tr>
              </thead>
              <tbody>
                {crtEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-slate-800/60">
                    <td className="py-2 text-slate-300 font-mono text-xs">
                      {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className={`py-2 font-semibold ${entry.value <= 3 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.value}s
                    </td>
                    <td className="py-2 text-slate-400">{entry.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Total Fluid</p>
            <p className="text-lg font-bold text-slate-200">{state.patient.totalFluidMl} mL</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Boluses</p>
            <p className="text-lg font-bold text-slate-200">{state.patient.fluidBoluses}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Cardiac Dx</p>
            <p className="text-lg font-bold text-slate-200">{state.patient.cardiacDx ?? 'N/A'}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Final CRT</p>
            <p className={`text-lg font-bold ${(state.patient.crt ?? 99) <= 3 ? 'text-green-400' : 'text-red-400'}`}>
              {state.patient.crt ?? '—'}s
            </p>
          </div>
        </div>

        {/* Full Decision Log */}
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Decision Log</h3>
        <ul className="space-y-1.5 text-sm">
          {state.log.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono whitespace-nowrap mt-0.5">
                {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-slate-300">{entry.message}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 mt-6 print:hidden">
          <Button variant="primary" onClick={() => window.print()}>
            Print Summary
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET' })}>
            New Patient
          </Button>
        </div>
      </Card>

      <Card className="print:hidden">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Reference:</strong> Hernandez G, Ospina-Tascón GA, Kattan E, et al.
          Personalized Hemodynamic Resuscitation Targeting Capillary Refill Time in Early Septic Shock:
          The ANDROMEDA-SHOCK-2 Randomized Clinical Trial. <em>JAMA</em>. 2025;334(22):1988-1999.
          doi:10.1001/jama.2025.20402
        </p>
      </Card>
    </div>
  );
}
