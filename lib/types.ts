export type AlgorithmPhase =
  | 'initial'
  | 'normal_monitoring'
  | 'tier1_pp'
  | 'tier1_fr'
  | 'tier1_fluid'
  | 'crt_reassess'
  | 'tier2_echo'
  | 'tier2_lv_dobutamine'
  | 'tier2_rv_management'
  | 'tier2_fr'
  | 'tier2_map'
  | 'tier2_dobutamine'
  | 'tier2_rescue'
  | 'print_summary';

export type CRTContext =
  | 'initial'
  | 'post_ne'
  | 'post_fluid1'
  | 'post_fluid2'
  | 'post_tier2_lv'
  | 'post_tier2_rv'
  | 'post_tier2_fr'
  | 'post_map'
  | 'post_dobutamine';

export type LogType = 'info' | 'success' | 'warning' | 'danger';

export interface LogEntry {
  id: string;
  time: Date;
  phase: AlgorithmPhase;
  message: string;
  logType: LogType;
}

export interface PatientData {
  crt: number | null;
  crtHistory: Array<{ time: Date; value: number; label: string }>;
  sbp: number | null;
  dbp: number | null;
  pp: number | null;
  map: number | null;
  frMethod: string;
  frPositive: boolean | null;
  fluidBoluses: number;
  totalFluidMl: number;
  cvp: number | null;
  worseningOx: boolean;
  newRales: boolean;
  hasChronicHTN: boolean | null;
  fac: number | null;
  aorticVTI: number | null;
  rvLvRatio: number | null;
  cardiacDx: 'lv' | 'rv' | 'none' | null;
  mapTestResult: boolean | null;
  dobutamineResult: boolean | null;
  lvDobutamineResult: boolean | null;
  rvManagementResult: boolean | null;
}

export interface AlgorithmState {
  phase: AlgorithmPhase;
  crtCtx: CRTContext;
  patient: PatientData;
  log: LogEntry[];
  protocolStart: Date | null;
  tier2Done: {
    echo: boolean;
    fr: boolean;
    map: boolean;
    dobutamine: boolean;
  };
}
