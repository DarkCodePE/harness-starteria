import React from 'react';
import type { ChallengeCardModel } from '../../domain/types';
import { ChallengeActivationBadge } from './ChallengeActivationBadge';
import { ChallengeCoverageBadge } from './ChallengeCoverageBadge';
import { ChallengeNextAction } from './ChallengeNextAction';

const STATUS_TONE_CLASSES: Record<ChallengeCardModel['status'], string> = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  listo_para_activar: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  activo_interno: 'border-amber-200 bg-amber-50 text-amber-700',
  publicado: 'border-sky-200 bg-sky-50 text-sky-700',
  recibiendo_iniciativas: 'border-sky-200 bg-sky-50 text-sky-700',
  con_iniciativas_activas: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pendiente_de_decision: 'border-violet-200 bg-violet-50 text-violet-700',
  cerrado: 'border-slate-300 bg-slate-100 text-slate-600',
};

export function ChallengeCard({
  card,
  selected,
  onSelect,
  onOpenAction,
}: {
  card: ChallengeCardModel;
  selected: boolean;
  onSelect: (challengeId: string) => void;
  onOpenAction: (path: string) => void;
}) {
  return (
    <article className={`rounded-[28px] border p-6 transition-colors ${selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <button className="max-w-3xl text-left" onClick={() => onSelect(card.id)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE_CLASSES[card.status]}`}>
              {card.statusLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              {card.activationModeLabel}
            </span>
            <ChallengeActivationBadge activationState={card.activationState} activationStateLabel={card.activationStateLabel} />
            <ChallengeCoverageBadge coverageStatus={card.coverageStatus} coverageLabel={card.coverageLabel} />
          </div>

          <h3 className="mt-3 text-xl text-slate-950" style={{ fontWeight: 700 }}>{card.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{card.frontName} · {card.challengeTypeLabel}</p>
          <p className="mt-3 text-sm text-slate-600">{card.whatWeWantToMove}</p>
        </button>

        <button
          onClick={() => onOpenAction(card.actionPath)}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800"
          style={{ fontWeight: 700 }}
        >
          {card.actionLabel}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Senal principal" value={card.mainSignalLabel} />
        <MetricCard label="Urgencia" value={card.urgencyLabel} />
        <MetricCard label="Horizonte" value={card.horizonLabel} />
        <MetricCard label="Challenge owner" value={card.challengeOwner} />
        <MetricCard label="Sponsor" value={card.sponsor} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <OperationalCard label="Iniciativas asociadas" value={`${card.initiativesCount}`} />
        <OperationalCard label="Iniciativas bloqueadas" value={`${card.blockedInitiativesCount}`} />
        <OperationalCard label="Decisiones pendientes" value={`${card.pendingDecisionsCount}`} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChallengeNextAction compact description={card.nextActionDescription} actionLabel={card.actionLabel} onAction={() => onOpenAction(card.actionPath)} />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Lectura del reto</p>
          <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>{card.focusReason}</p>
          <p className="mt-2 text-sm text-slate-600">{card.relevantBlocker}</p>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function OperationalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}
