import React from 'react';
import type { StrategicFrontCardModel, StrategicFrontStatus } from '../../domain/types';
import { StrategicFrontCoverageBadge } from './StrategicFrontCoverageBadge';
import { StrategicFrontNextAction } from './StrategicFrontNextAction';

const STATUS_TONE_CLASSES: Record<StrategicFrontStatus, string> = {
  draft: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  tracking: 'border-sky-200 bg-sky-50 text-sky-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700',
  closed: 'border-slate-300 bg-slate-100 text-slate-600',
};

export function StrategicFrontCard({
  card,
  onEdit,
  onOpenAction,
  onStatusChange,
}: {
  card: StrategicFrontCardModel;
  onEdit: (frontId: string) => void;
  onOpenAction: (path: string) => void;
  onStatusChange: (frontId: string, status: StrategicFrontStatus) => void;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Prioridad {card.priority}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE_CLASSES[card.status]}`}>
              {card.statusLabel}
            </span>
            <StrategicFrontCoverageBadge coverageStatus={card.coverageStatus} coverageLabel={card.coverageLabel} />
          </div>

          <h3 className="mt-3 text-xl text-slate-950" style={{ fontWeight: 700 }}>
            {card.name}
          </h3>
          <p className="mt-2 text-sm text-slate-600 md:text-base">{card.strategicObjective}</p>
          <p className="mt-3 text-sm text-slate-500">{card.whyNow}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onOpenAction(card.actionPath)}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800"
            style={{ fontWeight: 700 }}
          >
            {card.actionLabel}
          </button>
          <button
            onClick={() => onEdit(card.id)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            style={{ fontWeight: 700 }}
          >
            Editar frente
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="KPI principal" value={card.mainKpi} />
        <MetricCard label="Baseline -> meta" value={`${card.baseline} -> ${card.target}`} />
        <MetricCard label="Horizonte" value={card.horizon} />
        <MetricCard label="Sponsor" value={card.sponsor} />
        <MetricCard label="Area mas visible" value={card.areaLabel} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <OperationalCard label="Retos activos en este frente" value={`${card.challengesCount}`} />
        <OperationalCard label="Iniciativas trazables" value={`${card.initiativesCount}`} />
        <OperationalCard label="Bloqueos relevantes" value={`${card.blockedInitiativesCount}`} />
        <OperationalCard label="Pendientes de decision" value={`${card.pendingDecisionsCount}`} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <StrategicFrontNextAction
          compact
          description={card.nextActionDescription}
          actionLabel={card.actionLabel}
          onAction={() => onOpenAction(card.actionPath)}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Seguimiento del frente</p>
          <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>{card.focusReason}</p>
          <p className="mt-2 text-sm text-slate-600">
            {card.relevantBlocker}
          </p>
          <div className="mt-4">
            <label className="block text-xs text-slate-500" style={{ fontWeight: 700 }}>
              Estado del frente
            </label>
            <select
              value={card.status}
              onChange={event => onStatusChange(card.id, event.target.value as StrategicFrontStatus)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="tracking">En seguimiento</option>
              <option value="paused">Pausado</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
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
