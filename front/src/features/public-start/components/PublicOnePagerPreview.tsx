import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, FileDown, Gauge, Lightbulb, Lock, Route, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react';
import type { PublicDraft } from '../domain/types';

function text(value: string | undefined, fallback = 'Pendiente por completar.') {
  return value?.trim() || fallback;
}

function challengeTypeLabel(value: PublicDraft['aiOutput']['suggestedChallengeType']) {
  if (value === 'growth') return 'Crecimiento';
  if (value === 'exploration') return 'Exploracion';
  return 'Correccion';
}

function insightFromType(value: PublicDraft['aiOutput']['suggestedChallengeType']) {
  if (value === 'growth') return 'Hay una oportunidad de crecimiento que conviene acotar antes de invertir recursos.';
  if (value === 'exploration') return 'La propuesta puede reducir incertidumbre si se formula como aprendizaje validable.';
  return 'La propuesta apunta a corregir una friccion que puede estar generando costo operativo.';
}

function Panel({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/78 p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          <Icon size={16} />
        </div>
        <h3 className="text-sm text-slate-950" style={{ fontWeight: 900 }}>{title}</h3>
      </div>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

interface PublicOnePagerPreviewProps {
  draft: PublicDraft;
  canExport: boolean;
  canContinue: boolean;
  missingCount: number;
  onCopy: () => void;
  onDownload: () => void;
  onContinue: () => void;
}

export function PublicOnePagerPreview({
  draft,
  canExport,
  canContinue,
  missingCount,
  onCopy,
  onDownload,
  onContinue,
}: PublicOnePagerPreviewProps) {
  const output = draft.aiOutput;
  const supportAndDecision = [output.supportNeeded, output.decisionRequested].filter(Boolean).join(' ');
  const risksAndGaps = [...output.missingCriticalFields, ...output.risks].slice(0, 4);
  const clarityLabel = output.confidenceScore && output.confidenceScore > 0.7 ? 'Claridad media' : 'Claridad inicial';

  return (
    <aside className="space-y-3 xl:sticky xl:top-4">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white/80 p-2.5 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
        {canExport ? (
          <>
            <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 850 }}>
              <Copy size={14} />
              Copiar resumen
            </button>
            <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 850 }}>
              <FileDown size={14} />
              Descargar one-pager
            </button>
          </>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100" style={{ fontWeight: 850 }}>
            <Lock size={14} />
            Completa {missingCount} campos para descargar
          </div>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-xs text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ fontWeight: 900 }}
        >
          Convertir en iniciativa
          <ArrowRight size={14} />
        </button>
      </div>

      <article className="overflow-hidden rounded-[2.25rem] bg-white shadow-2xl shadow-slate-200/80 ring-1 ring-slate-200/80">
        <header className="relative overflow-hidden bg-slate-950 px-8 py-8 text-white">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-500/35 to-transparent" />
          <div className="relative">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase text-indigo-100" style={{ fontWeight: 900, letterSpacing: '0.12em' }}>
              Propuesta de iniciativa
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl" style={{ fontWeight: 900, lineHeight: 1.04 }}>
              {output.proposalTitle || 'Propuesta de iniciativa'}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">
              {text(output.whatToMove, 'Una base inicial para ordenar el problema, el impacto y la decision necesaria.')}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-indigo-50">
              <span className="rounded-full bg-white/12 px-3 py-1.5">Tipo sugerido: {challengeTypeLabel(output.suggestedChallengeType)}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">Estado: {canExport ? 'Presentable' : 'En afinacion'}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">{clarityLabel}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">Senal: {text(output.suggestedKpiOrSignal, 'Por definir')}</span>
            </div>
          </div>
        </header>

        <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 p-6">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Panel icon={Target} title="Resumen ejecutivo">
              {text(output.whatToMove)}
            </Panel>
            <Panel icon={Sparkles} title="Insights clave">
              <ul className="space-y-2">
                <li className="flex gap-2"><TrendingUp size={15} className="mt-1 shrink-0 text-indigo-600" />{insightFromType(output.suggestedChallengeType)}</li>
                <li className="flex gap-2"><Gauge size={15} className="mt-1 shrink-0 text-indigo-600" />Senal principal: {text(output.suggestedKpiOrSignal, 'aun por definir')}</li>
              </ul>
            </Panel>
            <Panel icon={ShieldCheck} title="Que sabemos hoy">
              <div className="space-y-3">
                <p><span className="text-slate-950" style={{ fontWeight: 850 }}>Impacto:</span> {text(output.impactedAudience)}</p>
                <p><span className="text-slate-950" style={{ fontWeight: 850 }}>Evidencia:</span> {text(output.initialEvidence, 'Aun falta documentar evidencia o senales iniciales.')}</p>
              </div>
            </Panel>
            <Panel icon={AlertTriangle} title="Que falta por validar">
              {risksAndGaps.length > 0 ? (
                <ul className="space-y-2">
                  {risksAndGaps.map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{item}</li>)}
                </ul>
              ) : (
                'No hay faltantes criticos en esta version.'
              )}
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Panel icon={Route} title="Siguiente paso recomendado">
              {text(output.nextRecommendedAction, 'Completar los campos faltantes y decidir si se convierte en iniciativa.')}
            </Panel>
            <section className="rounded-3xl bg-indigo-600 p-5 text-white shadow-lg shadow-indigo-200">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb size={17} />
                <h3 className="text-sm" style={{ fontWeight: 900 }}>Sugerencia de Starteria</h3>
              </div>
              <div className="space-y-3 text-sm leading-6 text-indigo-50">
                <p><span style={{ fontWeight: 900 }}>Fortaleza detectada:</span> la iniciativa ya tiene una direccion inicial conversable.</p>
                <p><span style={{ fontWeight: 900 }}>Riesgo actual:</span> puede quedarse en idea si no se precisa evidencia y decision minima.</p>
                <p><span style={{ fontWeight: 900 }}>Recomendacion:</span> usa esta ficha para pedir feedback y convertirla en iniciativa cuando tenga sponsor o siguiente paso claro.</p>
              </div>
            </section>
          </div>
        </div>
      </article>
    </aside>
  );
}
