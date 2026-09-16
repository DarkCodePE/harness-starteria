import React from 'react';
import type { ChallengeActivationMode } from '../../domain/types';

export function ChallengeActivationModeSelector({
  value,
  recommendedMode,
  onChange,
  options,
}: {
  value: ChallengeActivationMode;
  recommendedMode?: ChallengeActivationMode;
  onChange: (value: ChallengeActivationMode) => void;
  options: Array<{ value: ChallengeActivationMode; label: string; description: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Modalidad de activacion</p>
      <div className="mt-4 grid gap-3">
        {options.map(option => {
          const active = option.value === value;
          const recommended = option.value === recommendedMode;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border p-4 text-left transition-colors ${active ? 'border-slate-900 bg-white' : 'border-slate-200 bg-white hover:bg-slate-100'}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{option.label}</p>
                {recommended ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                    Recomendado
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
