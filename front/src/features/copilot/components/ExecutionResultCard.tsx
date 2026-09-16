import React from 'react';
import type { ActionExecutionDto, ProposedActionDto } from '../domain/copilot.types';
import { getCreatedStrategicFrontName, getProjectionLinks } from '../mappers/copilot-dto-mappers';

export function ExecutionResultCard({
  action,
  execution,
  refreshWarning,
}: {
  action: ProposedActionDto | null;
  execution: ActionExecutionDto | null;
  refreshWarning?: string | null;
}) {
  if (!execution || !['completed', 'idempotent_replay'].includes(execution.status)) return null;
  const links = getProjectionLinks(execution.projectionLinks.length > 0 ? execution.projectionLinks : execution.result?.projectionLinks ?? []);
  const createdName = action ? getCreatedStrategicFrontName(action) : 'Frente estratégico';
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-live="polite">
      <p className="text-sm text-emerald-950" style={{ fontWeight: 700 }}>Frente estratégico creado</p>
      <p className="mt-1 text-sm text-emerald-800">{createdName} ya fue confirmado por el backend.</p>
      {execution.status === 'idempotent_replay' && (
        <p className="mt-2 text-xs text-emerald-700">Esta respuesta recuperó una ejecución previa; no se creó un duplicado.</p>
      )}
      {execution.result?.warnings?.map((warning) => (
        <p key={warning} className="mt-2 text-xs text-amber-700">{warning}</p>
      ))}
      {refreshWarning && <p className="mt-2 text-sm text-amber-700">{refreshWarning}</p>}
      {links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

