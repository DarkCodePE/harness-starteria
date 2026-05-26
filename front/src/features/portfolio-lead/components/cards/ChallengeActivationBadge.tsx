import React from 'react';
import type { ChallengeCardModel } from '../../domain/types';

const ACTIVATION_TONE_CLASSES: Record<ChallengeCardModel['activationState'], string> = {
  solo_definido: 'border-slate-200 bg-slate-100 text-slate-700',
  listo_para_activar: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  activo_interno: 'border-amber-200 bg-amber-50 text-amber-800',
  publicado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export function ChallengeActivationBadge({
  activationState,
  activationStateLabel,
}: Pick<ChallengeCardModel, 'activationState' | 'activationStateLabel'>) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${ACTIVATION_TONE_CLASSES[activationState]}`}>
      {activationStateLabel}
    </span>
  );
}
