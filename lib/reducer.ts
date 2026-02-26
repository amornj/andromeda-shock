import type {
  AlgorithmState,
  AlgorithmPhase,
  CRTContext,
  LogEntry,
  LogType,
  PatientData,
} from './types';

export type Action =
  | { type: 'START_PROTOCOL'; crt: number }
  | { type: 'GOTO'; phase: AlgorithmPhase; ctx?: CRTContext }
  | { type: 'LOG'; message: string; logType: LogType }
  | { type: 'UPDATE'; data: Partial<PatientData> }
  | { type: 'RECORD_CRT'; value: number; label: string }
  | { type: 'MARK_TIER2'; key: keyof AlgorithmState['tier2Done'] }
  | { type: 'RESET' };

export const initialPatient: PatientData = {
  crt: null,
  crtHistory: [],
  sbp: null,
  dbp: null,
  pp: null,
  map: null,
  frMethod: '',
  frPositive: null,
  fluidBoluses: 0,
  totalFluidMl: 0,
  cvp: null,
  worseningOx: false,
  newRales: false,
  hasChronicHTN: null,
  fac: null,
  aorticVTI: null,
  rvLvRatio: null,
  cardiacDx: null,
  mapTestResult: null,
  dobutamineResult: null,
  lvDobutamineResult: null,
  rvManagementResult: null,
};

export const initialState: AlgorithmState = {
  phase: 'initial',
  crtCtx: 'initial',
  patient: initialPatient,
  log: [],
  protocolStart: null,
  tier2Done: { echo: false, fr: false, map: false, dobutamine: false },
};

let counter = 0;

function makeEntry(
  phase: AlgorithmPhase,
  message: string,
  logType: LogType
): LogEntry {
  return {
    id: `log-${++counter}-${Date.now()}`,
    time: new Date(),
    phase,
    message,
    logType,
  };
}

export function reducer(
  state: AlgorithmState,
  action: Action
): AlgorithmState {
  switch (action.type) {
    case 'START_PROTOCOL': {
      const now = new Date();
      const isAbnormal = action.crt > 3;
      return {
        ...initialState,
        protocolStart: now,
        phase: isAbnormal ? 'tier1_pp' : 'normal_monitoring',
        crtCtx: 'initial',
        patient: {
          ...initialPatient,
          crt: action.crt,
          crtHistory: [
            { time: now, value: action.crt, label: 'Initial assessment' },
          ],
        },
        log: [
          makeEntry(
            'initial',
            `Protocol initiated — Initial CRT: ${action.crt}s — ${
              isAbnormal ? 'ABNORMAL → Entering Tier 1' : 'NORMAL → Monitoring'
            }`,
            isAbnormal ? 'warning' : 'success'
          ),
        ],
      };
    }

    case 'GOTO':
      return {
        ...state,
        phase: action.phase,
        crtCtx: action.ctx ?? state.crtCtx,
      };

    case 'LOG':
      return {
        ...state,
        log: [
          ...state.log,
          makeEntry(state.phase, action.message, action.logType),
        ],
      };

    case 'UPDATE':
      return {
        ...state,
        patient: { ...state.patient, ...action.data },
      };

    case 'RECORD_CRT': {
      const now = new Date();
      const isNormal = action.value <= 3;
      return {
        ...state,
        patient: {
          ...state.patient,
          crt: action.value,
          crtHistory: [
            ...state.patient.crtHistory,
            { time: now, value: action.value, label: action.label },
          ],
        },
        log: [
          ...state.log,
          makeEntry(
            state.phase,
            `CRT reassessed: ${action.value}s (${action.label}) — ${
              isNormal ? 'NORMALIZED ✓' : 'Still ABNORMAL'
            }`,
            isNormal ? 'success' : 'warning'
          ),
        ],
      };
    }

    case 'MARK_TIER2':
      return {
        ...state,
        tier2Done: { ...state.tier2Done, [action.key]: true },
      };

    case 'RESET':
      counter = 0;
      return { ...initialState };

    default:
      return state;
  }
}
