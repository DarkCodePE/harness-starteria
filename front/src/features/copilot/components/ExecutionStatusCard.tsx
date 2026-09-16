import React from 'react';
import type { ActionExecutionDto } from '../domain/copilot.types';

export function ExecutionStatusCard({ execution }: { execution: ActionExecutionDto | null }) {
  if (!execution || ['completed', 'idempotent_replay'].includes(execution.status)) return null;
  if (execution.status === 'manual_review_required') {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4" aria-live="polite">
        <p className="text-sm text-amber-950" style={{ fontWeight: 700 }}>Revisión manual requerida</p>
        <p className="mt-1 text-sm text-amber-900">
          La ejecución quedó en un estado ambiguo. Starteria no volverá a ejecutar el comando para evitar duplicados.
        </p>
        {execution.error && <p className="mt-2 text-sm text-amber-900">{execution.error.message}</p>}
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4" aria-live="polite">
      <p className="text-sm text-sky-950" style={{ fontWeight: 700 }}>Ejecución {execution.status}</p>
      <p className="mt-1 text-sm text-sky-800">Starteria está confirmando el resultado con el backend.</p>
      {execution.error && <p className="mt-2 text-sm text-rose-700">{execution.error.message}</p>}
    </section>
  );
}
