import type { HumanConfirmation, StrategicConnectionStatus } from './types';

const AI_ALLOWED_STATUSES: StrategicConnectionStatus[] = [
  'alignment_unknown',
  'probable_alignment',
  'partial_alignment',
  'possible_misalignment',
];

export function canSetStrategicConnectionStatus(params: {
  actor: 'ai' | 'user' | 'system';
  status: StrategicConnectionStatus;
  humanConfirmation?: HumanConfirmation;
}): boolean {
  if (params.actor === 'ai') return AI_ALLOWED_STATUSES.includes(params.status);
  if (params.status === 'confirmed_alignment' || params.status === 'confirmed_misalignment') {
    return Boolean(params.humanConfirmation);
  }
  return true;
}
