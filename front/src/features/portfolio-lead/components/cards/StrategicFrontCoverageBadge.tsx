import React from 'react';
import type { StrategicFrontCardModel } from '../../domain/types';

const COVERAGE_TONE_CLASSES: Record<StrategicFrontCardModel['coverageStatus'], string> = {
  sin_cobertura: 'border-slate-200 bg-slate-100 text-slate-700',
  cobertura_parcial: 'border-amber-200 bg-amber-50 text-amber-800',
  cobertura_suficiente: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  necesita_reformulacion: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function StrategicFrontCoverageBadge({
  coverageStatus,
  coverageLabel,
}: Pick<StrategicFrontCardModel, 'coverageStatus' | 'coverageLabel'>) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${COVERAGE_TONE_CLASSES[coverageStatus]}`}>
      {coverageLabel}
    </span>
  );
}
