import React from 'react';
import { AlertTriangle, ArrowRight, BriefcaseBusiness, Copy, FileDown, HelpCircle, Lightbulb, Lock, Route, ShieldCheck, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import type { PublicDraft } from '../domain/types';
import { inferPublicDraftNarrative } from '../services/publicDraftService';

function text(value: string | undefined, fallback = 'Pendiente por completar.') {
  return value?.trim() || fallback;
}

function isNoEvidence(value: string | undefined) {
  return /no tengo evidencia aún|sin evidencia|hipótesis por validar/i.test(value ?? '');
}

function impactPotential(focus: string) {
  if (focus === 'Coordinación operativa') {
    return 'Podría reducir carga concentrada, mejorar coordinación entre áreas y dar más claridad sobre prioridades y capacidad operativa.';
  }
  if (focus === 'Crecimiento comercial') {
    return 'Podría mejorar la claridad del mensaje comercial, reducir objeciones y ayudar a priorizar segmentos con mayor interés.';
  }
  if (focus === 'Mejora operativa') {
    return 'Podría reducir demoras, mejorar trazabilidad y clarificar responsables en el flujo operativo.';
  }
  if (focus === 'Capacidad limitada' || focus === 'Priorización de trabajo') {
    return 'Podría ordenar carga, delegación y decisiones para evitar saturación y pérdida de seguimiento.';
  }
  return 'Podría convertir una idea abierta en una conversación más clara sobre alcance, señales y próximos pasos.';
}

function firstStepParts(nextStep: string) {
  if (/proyectos activos|responsables|fechas límite|dependencias/i.test(nextStep)) {
    return {
      headline: 'Mapea primero la carga actual de trabajo.',
      items: ['Lista proyectos activos', 'Define responsables y dependencias', 'Ordena urgencia, carga y posibles delegaciones'],
    };
  }
  if (/flujo actual de aprobación|tiempos promedio|puntos donde se pierde seguimiento/i.test(nextStep)) {
    return {
      headline: 'Revisa primero el flujo actual de aprobación.',
      items: ['Identifica etapas y responsables', 'Mide tiempos promedio', 'Ubica dónde se pierde seguimiento'],
    };
  }
  if (/conversaciones comerciales|objeciones frecuentes/i.test(nextStep)) {
    return {
      headline: 'Revisa primero señales comerciales recientes.',
      items: ['Agrupa objeciones frecuentes', 'Detecta mensajes poco claros', 'Compara clientes que sí entendieron el valor'],
    };
  }
  return {
    headline: nextStep,
    items: ['Ordena la información disponible', 'Identifica personas involucradas', 'Define la primera decisión necesaria'],
  };
}

function Card({
  icon: Icon,
  title,
  children,
  span = 'lg:col-span-6',
  tone = 'default',
  highlighted = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  span?: string;
  tone?: 'default' | 'strong' | 'warning' | 'action';
  highlighted?: boolean;
}) {
  const toneClasses = {
    default: 'bg-white/86 ring-slate-200/80',
    strong: 'bg-white ring-slate-200 shadow-md shadow-slate-200/60',
    warning: 'bg-amber-50/90 ring-amber-200',
    action: 'bg-indigo-600 text-white ring-indigo-500',
  };
  const iconClasses = {
    default: 'bg-indigo-50 text-indigo-700',
    strong: 'bg-slate-950 text-white',
    warning: 'bg-amber-100 text-amber-700',
    action: 'bg-white/15 text-white',
  };

  return (
    <section className={`${span} rounded-3xl p-5 ring-1 transition-all duration-300 md:p-6 ${highlighted ? 'scale-[1.01] ring-2 ring-violet-300 shadow-xl shadow-violet-100' : ''} ${toneClasses[tone]}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${iconClasses[tone]}`}>
          <Icon size={17} />
        </div>
        <h3 className={`text-sm ${tone === 'action' ? 'text-white' : 'text-slate-950'}`} style={{ fontWeight: 900 }}>{title}</h3>
      </div>
      <div className={`text-sm leading-6 md:leading-7 ${tone === 'action' ? 'text-indigo-50' : 'text-slate-700'}`}>{children}</div>
    </section>
  );
}

interface PublicOnePagerPreviewProps {
  draft: PublicDraft;
  highlightedField?: string | null;
  canExport: boolean;
  canContinue: boolean;
  missingCount: number;
  onCopy: () => void;
  onDownload: () => void;
  onContinue: () => void;
}

export function PublicOnePagerPreview({
  draft,
  highlightedField,
  canExport,
  canContinue,
  missingCount,
  onCopy,
  onDownload,
  onContinue,
}: PublicOnePagerPreviewProps) {
  const output = draft.aiOutput;
  const narrative = inferPublicDraftNarrative(draft.inputText, output);
  const supportAndDecision = [output.supportNeeded, output.decisionRequested].filter(Boolean).join(' ');
  const signal = output.initialEvidence && !isNoEvidence(output.initialEvidence) ? output.initialEvidence : narrative.signal;
  const step = firstStepParts(narrative.nextStep);
  const isHighlighted = (fields: string[]) => highlightedField ? fields.includes(highlightedField) : false;

  return (
    <aside className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-1">
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
            Aclara {missingCount} punto{missingCount === 1 ? '' : 's'} para descargar
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

      <article className="overflow-hidden rounded-[2.25rem] bg-white shadow-xl shadow-slate-200/80 ring-1 ring-slate-200/80">
        <header className={`relative overflow-hidden bg-slate-950 px-8 py-8 text-white transition-all duration-300 md:px-10 md:py-9 ${isHighlighted(['proposalTitle']) ? 'ring-4 ring-violet-300' : ''}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.48),transparent_42%)]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-500/25 to-transparent" />
          <div className="relative max-w-4xl">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase text-indigo-100" style={{ fontWeight: 900, letterSpacing: '0.12em' }}>
              Propuesta preliminar
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl md:text-5xl" style={{ fontWeight: 900, lineHeight: 1.02 }}>
              {narrative.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200">
              {narrative.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-indigo-50">
              {['Estado: Borrador para revisar', 'Claridad: Inicial', 'Respaldo: Pendiente', `Foco: ${narrative.focus}`].map(badge => (
                <span key={badge} className="rounded-full bg-white/12 px-3 py-1.5">{badge}</span>
              ))}
            </div>
          </div>
        </header>

        <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 p-6 md:p-8">
          <p className="mb-3 text-xs uppercase text-slate-400" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Qué estamos entendiendo</p>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <Card icon={Target} title="Resumen claro" span="lg:col-span-7" tone="strong" highlighted={isHighlighted(['proposalTitle', 'whatToMove'])}>
              {narrative.summary}
            </Card>
            <Card icon={BriefcaseBusiness} title="Situación actual" span="lg:col-span-5" highlighted={isHighlighted(['whatToMove'])}>
              {text(output.whatToMove, narrative.currentSituation)}
            </Card>

            <div className="lg:col-span-12 mt-1">
              <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Por qué vale la pena mirarlo</p>
            </div>
            <Card icon={ShieldCheck} title="Por qué importa" span="lg:col-span-6" highlighted={isHighlighted(['whyNow'])}>
              {text(output.whyNow, narrative.whyMatters)}
            </Card>
            <Card icon={TrendingUp} title="Impacto potencial" span="lg:col-span-6" highlighted={isHighlighted(['whyNow', 'initialEvidence'])}>
              {impactPotential(narrative.focus)}
            </Card>

            <div className="lg:col-span-12 mt-1">
              <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Qué sabemos y qué interpretamos</p>
            </div>
            <Card icon={Users} title="A quién impacta" span="lg:col-span-5" highlighted={isHighlighted(['impactedAudience'])}>
              {text(output.impactedAudience, narrative.audience)}
            </Card>
            <Card icon={Sparkles} title="Hipótesis inicial" span="lg:col-span-7" highlighted={isHighlighted(['initialEvidence'])}>
              {narrative.hypothesis}
            </Card>

            <div className="lg:col-span-12 mt-1">
              <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Qué falta aclarar y cuál es el siguiente paso</p>
            </div>
            <Card icon={AlertTriangle} title="Qué falta aclarar" span="lg:col-span-7" tone="warning" highlighted={isHighlighted(['initialEvidence', 'supportNeeded'])}>
              <ul className="space-y-2">
                {narrative.validationItems.slice(0, 5).map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{item}</li>)}
              </ul>
            </Card>
            <Card icon={Route} title="Primer paso recomendado" span="lg:col-span-5" tone="strong" highlighted={isHighlighted(['supportNeeded'])}>
              <p className="text-slate-950" style={{ fontWeight: 850 }}>{step.headline}</p>
              <ul className="mt-3 space-y-2">
                {step.items.map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />{item}</li>)}
              </ul>
            </Card>

            <Card icon={Lightbulb} title="Cómo seguir en Starteria" span="lg:col-span-8" tone="action" highlighted={isHighlighted(['supportNeeded'])}>
              <p>Con Starteria puedes convertir este borrador en una iniciativa guiada, profundizar señales, ordenar prioridades y preparar una ruta clara para avanzar con apoyo de IA.</p>
              <button type="button" onClick={onContinue} disabled={!canContinue} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60" style={{ fontWeight: 900 }}>
                Convertir en iniciativa
                <ArrowRight size={14} />
              </button>
            </Card>
            <Card icon={HelpCircle} title="Señal disponible" span="lg:col-span-4" highlighted={isHighlighted(['initialEvidence'])}>
              {signal}
            </Card>
          </div>
        </div>
      </article>
    </aside>
  );
}
