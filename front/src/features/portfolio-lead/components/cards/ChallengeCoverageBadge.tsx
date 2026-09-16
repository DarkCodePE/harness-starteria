import React from 'react';
import type { ChallengeCardModel } from '../../domain/types';

const COVERAGE_TONE_CLASSES: Partial<Record<ChallengeCardModel['coverageStatus'], string>> = {
  sin_cobertura: 'border-slate-200 bg-slate-100 text-slate-700',
  cobertura_parcial: 'border-amber-200 bg-amber-50 text-amber-800',
  cobertura_suficiente: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  resuelto: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  reformular: 'border-rose-200 bg-rose-50 text-rose-800',
  cerrar: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function ChallengeCoverageBadge({
  coverageStatus,
  coverageLabel,
}: Pick<ChallengeCardModel, 'coverageStatus' | 'coverageLabel'>) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${COVERAGE_TONE_CLASSES[coverageStatus] ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}>
      {coverageLabel}
    </span>
  );
}
