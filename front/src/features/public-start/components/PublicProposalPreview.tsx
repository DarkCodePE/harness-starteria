import React from 'react';
import { ArrowRight, Copy, FileDown } from 'lucide-react';
import type { PublicDraft } from '../domain/types';

function valueOrPending(value: string | undefined, fallback = 'Pendiente por precisar.') {
  return value?.trim() || fallback;
}

function challengeTypeLabel(value: PublicDraft['aiOutput']['suggestedChallengeType']) {
  switch (value) {
    case 'growth':
      return 'Crecimiento';
    case 'exploration':
      return 'Exploración';
    case 'correction':
    default:
      return 'Corrección';
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] uppercase text-slate-400" style={{ fontWeight: 850, letterSpacing: '0.08em' }}>
        {title}
      </p>
      <div className="mt-2 text-sm leading-6 text-slate-800">{children}</div>
    </section>
  );
}

interface PublicProposalPreviewProps {
  draft: PublicDraft;
  onCopy?: () => void;
  onDownloadPdf?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
}

export function PublicProposalPreview({
  draft,
  onCopy,
  onDownloadPdf,
  onContinue,
  canContinue = true,
}: PublicProposalPreviewProps) {
  const output = draft.aiOutput;
  const supportAndDecision = [output.supportNeeded, output.decisionRequested].filter(Boolean).join(' ');
  const risksAndGaps = [...output.missingCriticalFields, ...output.risks];

  return (
    <aside className="space-y-3 xl:sticky xl:top-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-50"
          style={{ fontWeight: 800 }}
        >
          <Copy size={13} />
          Copiar
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-50"
          style={{ fontWeight: 800 }}
        >
          <FileDown size={13} />
          Descargar one-pager
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ fontWeight: 850 }}
        >
          Crear iniciativa
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-100 p-3 shadow-sm">
        <article className="min-h-[720px] rounded-[1.25rem] border border-slate-200 bg-white px-7 py-8 shadow-xl shadow-slate-200/70">
          <header className="border-b border-slate-200 pb-5">
            <p className="text-[11px] uppercase text-indigo-600" style={{ fontWeight: 900, letterSpacing: '0.12em' }}>
              PROPUESTA DE INICIATIVA
            </p>
            <h2 className="mt-3 text-2xl text-slate-950" style={{ fontWeight: 850, lineHeight: 1.15 }}>
              {output.proposalTitle || 'Propuesta de iniciativa'}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="rounded-full border border-slate-200 px-2.5 py-1">
                Tipo sugerido: {challengeTypeLabel(output.suggestedChallengeType)}
              </span>
              <span className="rounded-full border border-slate-200 px-2.5 py-1">
                Señal: {valueOrPending(output.suggestedKpiOrSignal, 'Por definir')}
              </span>
            </div>
          </header>

          <div className="py-5">
            <Section title="Qué quiere mover">
              {valueOrPending(output.whatToMove)}
            </Section>
            <Section title="Por qué importa ahora">
              {valueOrPending(output.whyNow)}
            </Section>
            <Section title="A quién impacta">
              {valueOrPending(output.impactedAudience)}
            </Section>
            <Section title="Evidencia o respaldo inicial">
              {valueOrPending(output.initialEvidence, 'Aún falta documentar evidencia o señales iniciales.')}
            </Section>
            <Section title="Decisión o apoyo necesario">
              {valueOrPending(supportAndDecision)}
            </Section>
            <Section title="Riesgos / faltantes">
              {risksAndGaps.length > 0 ? (
                <ul className="space-y-1.5">
                  {risksAndGaps.map(item => (
                    <li key={item} className="pl-3 before:-ml-3 before:mr-2 before:content-['•']">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                'Sin faltantes críticos en esta versión.'
              )}
            </Section>
            <Section title="Siguiente paso recomendado">
              {valueOrPending(output.nextRecommendedAction)}
            </Section>
          </div>

          <footer className="border-t border-slate-200 pt-4 text-[11px] leading-5 text-slate-400">
            Documento temporal creado en modo público. No representa evidencia validada ni aprobación.
          </footer>
        </article>
      </div>
    </aside>
  );
}
