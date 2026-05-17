import React from 'react';
import type { ChallengeActivationRecommendationModel } from '../../domain/types';

export function ChallengeActivationRecommendation({
  recommendation,
  note,
  onNoteChange,
  onAccept,
}: {
  recommendation: ChallengeActivationRecommendationModel;
  note: string;
  onNoteChange: (value: string) => void;
  onAccept: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>RECOMENDACION DE ACTIVACION</p>
          <h3 className="mt-1 text-lg text-slate-950" style={{ fontWeight: 700 }}>{recommendation.recommendedModeLabel}</h3>
          <p className="mt-2 text-sm text-slate-600">{recommendation.justification}</p>
        </div>
        <button onClick={onAccept} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800" style={{ fontWeight: 700 }}>
          Aceptar recomendacion
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Confianza" value={`${recommendation.confidenceLabel} (${Math.round(recommendation.confidenceScore * 100)}%)`} />
        <InfoCard label="Riesgo sponsor" value={recommendation.sponsorRisk ? 'Hay riesgo por sponsor no confirmado' : 'Sponsor sin riesgo visible'} />
        <InfoCard label="Faltantes" value={recommendation.missingItems[0] ?? 'No hay faltantes criticos ahora'} />
        <InfoCard label="Siguiente paso" value={recommendation.nextSteps[0] ?? 'Revisar modalidad y activar'} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ListBlock title="Riesgos" items={recommendation.risks} fallback="No hay riesgos adicionales visibles ahora." />
        <ListBlock title="Proximos pasos" items={recommendation.nextSteps} fallback="Revisa la modalidad y activa el reto." />
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm text-slate-700" style={{ fontWeight: 600 }}>Justificacion editable</span>
        <textarea
          value={note}
          onChange={event => onNoteChange(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </label>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function ListBlock({ title, items, fallback }: { title: string; items: string[]; fallback: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{title}</p>
      <div className="mt-3 space-y-2">
        {(items.length > 0 ? items : [fallback]).map(item => (
          <p key={item} className="text-sm text-slate-700">{item}</p>
        ))}
      </div>
    </div>
  );
}
