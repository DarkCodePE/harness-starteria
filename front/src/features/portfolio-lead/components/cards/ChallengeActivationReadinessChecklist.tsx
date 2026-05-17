import React from 'react';
import type { ChallengeActivationReadiness } from '../../domain/types';

export function ChallengeActivationReadinessChecklist({
  readiness,
  sponsorConfirmed,
}: {
  readiness: ChallengeActivationReadiness;
  sponsorConfirmed: boolean;
}) {
  const items = readiness.missingItems.length > 0
    ? readiness.missingItems.map(item => ({ label: item, done: false }))
    : [{ label: 'No hay faltantes criticos para activar este reto.', done: true }];

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm text-amber-900" style={{ fontWeight: 700 }}>Checklist de readiness</p>
      <p className="mt-2 text-sm text-amber-800">
        Estado actual: {readiness.activationStateLabel}. {sponsorConfirmed ? 'El sponsor ya esta confirmado.' : 'El sponsor aun no esta confirmado y eso agrega riesgo.'}
      </p>
      <div className="mt-4 space-y-2">
        {items.map(item => (
          <div key={item.label} className={`rounded-2xl border px-4 py-3 text-sm ${item.done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-white text-amber-900'}`}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
