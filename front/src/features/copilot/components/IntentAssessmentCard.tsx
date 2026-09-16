import React from 'react';
import type { IntentAssessmentDto } from '../domain/copilot.types';

export function IntentAssessmentCard({ assessment }: { assessment: IntentAssessmentDto | null }) {
  if (!assessment) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="Interpretación del Copiloto">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>INTERPRETACIÓN</p>
      <p className="mt-2 text-sm text-slate-900">
        Entendí una intención de {assessment.operation === 'create' ? 'crear' : 'revisar'}: {formatIntent(assessment.primaryIntent)}.
      </p>
      {assessment.recommendedCapabilities.length > 0 && (
        <p className="mt-1 text-sm text-slate-600">
          Capability: {assessment.recommendedCapabilities.join(', ')}
        </p>
      )}
      {assessment.confidence !== 'high' && (
        <p className="mt-2 text-xs text-amber-700">Confianza {assessment.confidence}. Revisa la propuesta antes de aprobar.</p>
      )}
    </section>
  );
}

function formatIntent(intent: string): string {
  if (intent === 'create_strategic_front') return 'crear un frente estratégico';
  return 'solicitud no identificada';
}

