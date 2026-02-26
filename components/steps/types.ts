import type { AlgorithmState } from '@/lib/types';
import type { Action } from '@/lib/reducer';
import type { Dispatch } from 'react';

export type StepProps = {
  state: AlgorithmState;
  dispatch: Dispatch<Action>;
};
