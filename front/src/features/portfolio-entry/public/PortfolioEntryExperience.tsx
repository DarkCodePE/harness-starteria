import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  PencilLine,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  chooseGuidedExploration,
  confirmPortfolioEntryHandoff,
  continuePortfolioEntryToPortfolio,
  correctPortfolioEntryHandoff,
  createPortfolioEntrySession,
  getClaimedPortfolioEntrySession,
  getPortfolioEntrySession,
  materializePortfolioEntryHandoff,
  normalizePortfolioEntryApiError,
  submitPortfolioEntryMessage,
} from './portfolioEntryPublicService';
import { createIdempotencyKey } from './idempotency';
import { trackPortfolioEntryEvent } from './analytics';
import {
  clearPortfolioEntryClaimedNotice,
  clearPortfolioEntryConversionState,
  clearPortfolioEntryCurrentSession,
  readClaimedPortfolioEntrySession,
  readPortfolioEntryClaimedNotice,
  readPortfolioEntryCurrentSession,
  savePendingPortfolioEntryClaim,
  savePortfolioEntryCurrentSession,
} from './storage';
import type {
  PortfolioEntryHandoff,
  PortfolioEntryQuestion,
  PortfolioEntrySessionDto,
  ProvenancedText,
  ProvenanceOrigin,
  ReviewDisposition,
  StoredPortfolioEntrySession,
  SuggestedApproach,
} from './types';

type PendingRequest =
  | 'recovering'
  | 'starting'
  | 'submitting'
  | 'guided'
  | 'handoff'
  | 'correcting'
  | 'confirming'
  | 'converting'
  | null;

type UiError = {
  kind: string;
  title: string;
  message: string;
  retryable: boolean;
};

type EditableField = {
  path: string;
  label: string;
  value: string;
};

const MIN_ENTRY_LENGTH = 30;

const EXAMPLES = [
  'Tengo varias iniciativas y necesito entender cuales realmente contribuyen a nuestros objetivos.',
  'Quiero aumentar ventas este trimestre, pero no se que iniciativas priorizar.',
  'Tengo que presentar al comite el estado de mis iniciativas y que decisiones hacen falta.',
  'Creo que dos equipos estan trabajando en soluciones parecidas y quiero ordenar el portafolio.',
];

const PROVENANCE_LABELS: Record<ProvenanceOrigin, string> = {
  USER_DECLARED: 'Tu nos dijiste',
  EXTRACTED_FROM_USER_TEXT: 'Tu nos dijiste',
  AI_INFERRED: 'Starteria interpreta',
  AI_SUGGESTED: 'Starteria propone',
};

const REVIEW_LABELS: Record<ReviewDisposition, string> = {
  UNREVIEWED: 'Pendiente de tu revision',
  USER_CONFIRMED: 'Confirmado por ti',
  USER_REJECTED: 'Rechazado por ti',
  SUPERSEDED: 'Actualizado por una version posterior',
};

function latestQuestions(session: PortfolioEntrySessionDto | null): PortfolioEntryQuestion[] {
  const turns = session?.conversation ?? [];
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const questions = turns[index]?.emittedQuestions ?? [];
    if (questions.length > 0) return questions;
  }
  return [];
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textFromProvenanced(value: ProvenancedText | 'unresolved' | undefined): string {
  if (!value || value === 'unresolved') return 'Aun por aclarar';
  return value.value;
}

function textFromApproach(value: SuggestedApproach | undefined): string {
  if (!value) return 'Aun por aclarar';
  return value.description;
}

function textFromDecision(value: PortfolioEntryHandoff['decision_to_enable']): string {
  return value === 'unresolved' ? 'Pendiente de aclarar antes de decidir.' : textFromProvenanced(value);
}

function shortText(value: string, fallback: string, maxLength = 190): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}...`;
}

function originIsUser(value: ProvenancedText | undefined): boolean {
  const origin = value?.provenance?.origin;
  return origin === 'USER_DECLARED' || origin === 'EXTRACTED_FROM_USER_TEXT';
}

function needsCarefulLanguage(handoff: PortfolioEntryHandoff): boolean {
  const origins = [
    handoff.understanding.provenance?.origin,
    handoff.desired_outcome.provenance?.origin,
    handoff.decision_to_enable !== 'unresolved' ? handoff.decision_to_enable.provenance?.origin : undefined,
    handoff.recommended_approach?.origin,
  ];
  return origins.some((origin) => origin === 'AI_INFERRED' || origin === 'AI_SUGGESTED');
}

function currentFrame(session: PortfolioEntrySessionDto): string {
  return (
    session.semanticProjection.currentFrame ??
    session.semanticProjection.initialEntryState ??
    session.semanticProjection.primaryIntent ??
    'portfolio_first'
  );
}

function insightForSession(session: PortfolioEntrySessionDto, handoff: PortfolioEntryHandoff): { headline: string; support: string } {
  const frame = currentFrame(session);
  const careful = needsCarefulLanguage(handoff);
  const prefix = careful ? 'Tu principal reto parece ser' : 'Tu principal reto es';
  const outcome = textFromProvenanced(handoff.desired_outcome);
  const knownContext = handoff.known_context.map((item) => item.value).filter(Boolean).slice(0, 2).join(' ');
  const supportSource = [outcome, knownContext].filter((item) => item && item !== 'Aun por aclarar').join(' ');

  if (frame.includes('solution')) {
    return {
      headline: `${prefix} conectar esta solucion con una decision de negocio clara, antes de tratarla como iniciativa lista para ejecutar.`,
      support: shortText(
        supportSource || textFromProvenanced(handoff.understanding),
        'Starteria necesita distinguir que se sabe de la solucion, que resultado deberia justificarla y que evidencia falta revisar.',
      ),
    };
  }

  if (frame.includes('report')) {
    return {
      headline: `${prefix} convertir el reporte en una lectura que habilite decisiones, no solo mostrar estado.`,
      support: shortText(
        supportSource || textFromProvenanced(handoff.understanding),
        'La lectura ordena que debe entender el comite, que iniciativas son relevantes y que informacion sigue pendiente.',
      ),
    };
  }

  if (frame.includes('strategy') || frame.includes('strategic')) {
    return {
      headline: `${prefix} aterrizar la prioridad de negocio en iniciativas y criterios comparables.`,
      support: shortText(
        supportSource || textFromProvenanced(handoff.understanding),
        'Starteria separa la prioridad declarada de las iniciativas concretas y de la evidencia necesaria para gobernarlas.',
      ),
    };
  }

  if (frame.includes('initiative')) {
    return {
      headline: `${prefix} revisar una iniciativa dentro de una decision de portafolio, no saltar directo a ejecucion.`,
      support: shortText(
        supportSource || textFromProvenanced(handoff.understanding),
        'La iniciativa mencionada queda como contexto inicial; todavia falta confirmar como se relaciona con prioridad, evidencia y decision.',
      ),
    };
  }

  return {
    headline: `${prefix} decidir que iniciativas merecen atencion y bajo que criterio de negocio.`,
    support: shortText(
      supportSource || textFromProvenanced(handoff.understanding),
      'Starteria esta construyendo una lectura inicial para conectar objetivo, situacion, pendientes y decisiones antes de crear cualquier objeto canonico.',
    ),
  };
}

type RouteStep = {
  title: string;
  description: string;
};

function routeForSession(session: PortfolioEntrySessionDto, handoff: PortfolioEntryHandoff): RouteStep[] {
  const frame = currentFrame(session);
  const path = handoff.starteria_path ?? [];
  const extra = path.length > 0 ? path[0]?.description : undefined;

  if (frame.includes('solution')) {
    return [
      { title: 'Reconectar', description: 'Solucion con resultado de negocio.' },
      { title: 'Revisar', description: 'Evidencia existente y supuestos.' },
      { title: 'Ubicar', description: 'Lugar dentro del portafolio real.' },
      { title: 'Preparar decision', description: extra || 'Continuar, ajustar, pausar o escalar.' },
    ];
  }

  if (frame.includes('report')) {
    return [
      { title: 'Clarificar', description: 'Que debe decidir el comite.' },
      { title: 'Consolidar', description: 'Iniciativas relevantes del equipo.' },
      { title: 'Senalar', description: 'Atencion, bloqueos y pendientes.' },
      { title: 'Actualizar', description: extra || 'Mantener una lectura util para decidir.' },
    ];
  }

  if (frame.includes('strategy') || frame.includes('strategic')) {
    return [
      { title: 'Aterrizar', description: 'Prioridad y senal de negocio.' },
      { title: 'Entender', description: 'Donde actuar con el portafolio.' },
      { title: 'Conectar', description: 'Iniciativas reales con la prioridad.' },
      { title: 'Seguir', description: extra || 'Contribucion, gaps y decisiones.' },
    ];
  }

  if (frame.includes('portfolio')) {
    return [
      { title: 'Aclarar', description: 'Criterio de negocio comun.' },
      { title: 'Incorporar', description: 'Portafolio e iniciativas reales.' },
      { title: 'Revisar', description: 'Relaciones, solapamientos y gaps.' },
      { title: 'Priorizar', description: extra || 'Continuar, ajustar, escalar, pausar o cerrar.' },
    ];
  }

  return [
    { title: 'Alinear', description: 'Prioridad y senal de negocio.' },
    { title: 'Conectar', description: 'Iniciativas reales del equipo.' },
    { title: 'Detectar', description: 'Gaps, solapamientos y bloqueos.' },
    { title: 'Decidir', description: extra || 'Continuar, ajustar, escalar, pausar o cerrar.' },
  ];
}

function provenanceLabels(handoff: PortfolioEntryHandoff): string[] {
  const labels = new Set<string>();
  for (const item of handoff.provenance_summary ?? []) labels.add(PROVENANCE_LABELS[item.origin]);
  if (originIsUser(handoff.understanding) || originIsUser(handoff.desired_outcome)) labels.add('Tu nos dijiste');
  if (needsCarefulLanguage(handoff)) labels.add('Starteria interpreta');
  if (
    handoff.handoff_status !== 'ready' ||
    handoff.decision_to_enable === 'unresolved' ||
    handoff.unresolved_context.length > 0 ||
    handoff.evidence_or_clarity_needed.length > 0
  ) {
    labels.add('Pendiente de confirmar');
  }
  return [...labels].slice(0, 4);
}

function partialSummary(session: PortfolioEntrySessionDto): string {
  const frame = currentFrame(session);
  if (frame.includes('solution')) return 'Veo una solucion o herramienta como punto de entrada.';
  if (frame.includes('report')) return 'Veo una necesidad de preparar lectura para reporte o comite.';
  if (frame.includes('strategy')) return 'Veo una prioridad de negocio que todavia necesita bajar a decisiones.';
  if (frame.includes('portfolio')) return 'Veo una necesidad de ordenar varias iniciativas bajo un criterio comun.';
  return 'Tengo una primera lectura, pero falta una pieza para darte una interpretacion util.';
}

function microInsight(session: PortfolioEntrySessionDto): string | null {
  const frame = currentFrame(session);
  if (frame.includes('solution')) {
    return 'Hay algo importante aqui: ya tienes una solucion, pero todavia necesitamos entender que resultado de negocio deberia justificar que siga recibiendo inversion.';
  }
  if (frame.includes('report')) {
    return 'Hay algo importante aqui: un buen reporte no solo muestra estado; debe dejar claro que decision necesita habilitar.';
  }
  return null;
}

function fieldBadge(value: ProvenancedText | SuggestedApproach | undefined): string[] {
  const labels: string[] = [];
  if (!value) return ['Aun por aclarar'];
  if ('provenance' in value && value.provenance?.origin) {
    labels.push(PROVENANCE_LABELS[value.provenance.origin]);
  }
  if ('origin' in value) {
    labels.push(PROVENANCE_LABELS[value.origin]);
  }
  if ('review_disposition' in value) {
    labels.push(REVIEW_LABELS[value.review_disposition]);
  }
  return labels.length ? labels : ['Pendiente de tu revision'];
}

function getEditableFields(handoff: PortfolioEntryHandoff): EditableField[] {
  return [
    {
      path: 'understanding.value',
      label: 'Que entendio Starteria',
      value: textFromProvenanced(handoff.understanding),
    },
    {
      path: 'desired_outcome.value',
      label: 'Resultado deseado',
      value: textFromProvenanced(handoff.desired_outcome),
    },
    {
      path: 'decision_to_enable.value',
      label: 'Decision que busca habilitar',
      value: textFromProvenanced(handoff.decision_to_enable),
    },
    {
      path: 'recommended_approach.description',
      label: 'Enfoque recomendado',
      value: textFromApproach(handoff.recommended_approach),
    },
    {
      path: 'recommended_cta',
      label: 'Siguiente paso propuesto',
      value: handoff.recommended_cta,
    },
  ];
}

function mapError(kind: string): UiError {
  switch (kind) {
    case 'validation':
      return {
        kind,
        title: 'Revisa el texto',
        message: 'Hay algo en la solicitud que Starteria no puede procesar todavia. Ajusta el contenido y vuelve a intentar.',
        retryable: false,
      };
    case 'unauthorized':
      return {
        kind,
        title: 'La sesion ya no es valida',
        message: 'No pudimos verificar esta sesion anonima. Reinicia el flujo para continuar.',
        retryable: false,
      };
    case 'forbidden':
      return {
        kind,
        title: 'Esta sesion pertenece a otra cuenta',
        message: 'Ingresa con la cuenta correcta o empieza una nueva entrada publica.',
        retryable: false,
      };
    case 'not_found':
      return {
        kind,
        title: 'No encontramos la sesion',
        message: 'La sesion publica ya no esta disponible. Puedes empezar de nuevo sin perder claridad sobre lo que quieres explicar.',
        retryable: false,
      };
    case 'conflict':
      return {
        kind,
        title: 'La sesion avanzo',
        message: 'Actualizamos la vista con el estado mas reciente. Revisa antes de volver a enviar.',
        retryable: false,
      };
    case 'expired':
      return {
        kind,
        title: 'La sesion expiro',
        message: 'Por seguridad, esta entrada publica ya no esta activa. Empieza una nueva sesion para continuar.',
        retryable: false,
      };
    case 'rate_limited':
      return {
        kind,
        title: 'Demasiados intentos seguidos',
        message: 'Conservamos tu texto. Espera un momento antes de volver a intentar.',
        retryable: true,
      };
    case 'provider_output':
    case 'unavailable':
    case 'timeout':
      return {
        kind,
        title: 'Starteria no pudo terminar ahora',
        message: 'Conservamos la sesion y tu texto. Puedes reintentar en unos segundos.',
        retryable: true,
      };
    case 'mapping_invalid':
      return {
        kind,
        title: 'No pudimos continuar al portafolio todavia',
        message: 'La interpretacion confirmada necesita una revision antes de pasar al contexto Portfolio. Conservamos tu sesion para que puedas revisarla.',
        retryable: false,
      };
    case 'server_error':
      return {
        kind,
        title: 'Seguimos preparando tu portafolio',
        message: 'No pudimos completar la continuidad Portfolio todavia. Conservamos tu sesion; intenta continuar nuevamente.',
        retryable: true,
      };
    default:
      return {
        kind,
        title: 'No pudimos completar la accion',
        message: 'Revisa tu conexion y vuelve a intentar.',
        retryable: true,
      };
  }
}

function StatusMessage({ pendingRequest }: { pendingRequest: PendingRequest }) {
  if (!pendingRequest) return null;
  const copy: Record<Exclude<PendingRequest, null>, string> = {
    recovering: 'Recuperando tu sesion publica...',
    starting: 'Creando una sesion segura...',
    submitting: 'Starteria esta revisando tu contexto...',
    guided: 'Starteria esta preparando la exploracion...',
    handoff: 'Ordenando la sugerencia de Starteria...',
    correcting: 'Guardando tus correcciones...',
    confirming: 'Guardando tu confirmacion...',
    converting: 'Preparando la continuidad de tu portafolio...',
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
    >
      <Loader2 size={16} className="animate-spin" />
      {copy[pendingRequest]}
    </div>
  );
}

function ErrorMessage({
  error,
  onRestart,
}: {
  error: UiError | null;
  onRestart: () => void;
}) {
  if (!error) return null;
  const terminal = ['unauthorized', 'not_found', 'expired'].includes(error.kind);
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="font-semibold">{error.title}</p>
          <p className="leading-6">{error.message}</p>
          {terminal ? (
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              <RefreshCcw size={14} />
              Empezar de nuevo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InitialComposer({
  value,
  pending,
  onChange,
  onSubmit,
}: {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = value.trim().length >= MIN_ENTRY_LENGTH && !pending;
  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="portfolio-entry-input" className="block text-sm font-semibold text-slate-900">
          ¿Qué necesitas conseguir o entender de tus iniciativas?
        </label>
        <textarea
          id="portfolio-entry-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={7}
          className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="Describe el problema, oportunidad, objetivo, decision o iniciativa que quieres ordenar."
          disabled={pending}
        />
        <p className="text-xs text-slate-500">
          Escribe al menos {MIN_ENTRY_LENGTH} caracteres. No subas informacion sensible en modo publico.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Ejemplos editables">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange(example)}
            disabled={pending}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={15} className="text-emerald-600" />
          Entrada pre-canonica: nada se crea en tu portafolio todavia.
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Analizar mi situación
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function ConversationPanel({
  session,
  value,
  pending,
  onChange,
  onSubmit,
}: {
  session: PortfolioEntrySessionDto;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const questions = latestQuestions(session);
  const activeQuestion = questions[0];
  const insight = microInsight(session);
  const canSubmit = value.trim().length > 0 && !pending;
  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-700">
          <HelpCircle size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Esto entendi hasta ahora</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{partialSummary(session)}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Hasta 3 preguntas. Puedes continuar con informacion parcial.
            </p>
          </div>

          {insight ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm leading-6 text-indigo-950">
              {insight}
            </div>
          ) : null}

          {activeQuestion ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Siguiente aclaracion</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{activeQuestion.question}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="portfolio-entry-answer" className="block text-sm font-semibold text-slate-900">
              Tu respuesta
            </label>
            <textarea
              id="portfolio-entry-answer"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar respuesta
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onChange('No lo se todavia.')}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              No lo se todavia
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuidedExplorationOffer({
  pending,
  onChoose,
}: {
  pending: boolean;
  onChoose: (choice: 'accept' | 'reject') => void;
}) {
  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="mt-1 text-emerald-700" />
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Tengo suficiente informacion para darte una primera lectura.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Puedes verla ahora o profundizar un poco mas antes de cerrar esta interpretacion inicial.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={() => onChoose('reject')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ver mi lectura
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onChoose('accept')}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Profundizar un poco mas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldBlock({
  label,
  value,
  badges,
}: {
  label: string;
  value: string;
  badges: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        {badges.map((badge) => (
          <span key={badge} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {badge}
          </span>
        ))}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function ProvenanceChips({ handoff }: { handoff: PortfolioEntryHandoff }) {
  const labels = provenanceLabels(handoff);
  return (
    <div className="flex flex-wrap gap-2" aria-label="Procedencia de la lectura">
      {labels.map((label) => (
        <span key={label} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {label}
        </span>
      ))}
    </div>
  );
}

function InsightPanel({ session, handoff }: { session: PortfolioEntrySessionDto; handoff: PortfolioEntryHandoff }) {
  const insight = insightForSession(session, handoff);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">TU LECTURA INICIAL</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950 md:text-3xl">{insight.headline}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">{insight.support}</p>
        </div>
        <ProvenanceChips handoff={handoff} />
        <details className="group rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
            De donde sale esta lectura?
          </summary>
          <div className="mt-3 space-y-2 leading-6">
            {(handoff.provenance_summary.length > 0 ? handoff.provenance_summary : [{ origin: 'AI_INFERRED' as ProvenanceOrigin }]).map(
              (item, index) => (
                <p key={`${item.origin}-${index}`}>
                  <span className="font-semibold">{PROVENANCE_LABELS[item.origin]}:</span>{' '}
                  {item.source_text || item.source_path || 'A partir de tu entrada y de la interpretacion provisional de Starteria.'}
                </p>
              ),
            )}
          </div>
        </details>
      </div>
    </section>
  );
}

function BriefSection({ handoff }: { handoff: PortfolioEntryHandoff }) {
  const known = handoff.known_context.filter((item) => item.value).slice(0, 4);
  const pending = [
    ...handoff.unresolved_context.map((item) => item.description),
    ...handoff.evidence_or_clarity_needed.map((item) => item.value),
  ].filter(Boolean);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <h3 className="text-lg font-semibold text-slate-950">Lo que Starteria entendio</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <BriefItem title="Objetivo" body={textFromProvenanced(handoff.desired_outcome)} />
        <BriefItem title="Decision" body={textFromDecision(handoff.decision_to_enable)} />
        <BriefItem title="Situacion" items={known.map((item) => item.value)} fallback={textFromProvenanced(handoff.understanding)} />
        <BriefItem title="Pendientes" items={pending} fallback="Sin pendientes registrados en esta lectura inicial." />
      </div>
    </section>
  );
}

function BriefItem({ title, body, items, fallback }: { title: string; body?: string; items?: string[]; fallback?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      {items && items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-800">
          {items.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-800">{body || fallback || 'Pendiente de aclarar.'}</p>
      )}
    </div>
  );
}

function StarteriaRoute({ session, handoff }: { session: PortfolioEntrySessionDto; handoff: PortfolioEntryHandoff }) {
  const steps = routeForSession(session, handoff);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Ruta sugerida</p>
        <h3 className="text-lg font-semibold text-slate-950">Tu ruta en Starteria</h3>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
              {index + 1}
            </span>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EarlyAccessCard({
  pending,
  onConfirm,
  onStartEditing,
}: {
  pending: boolean;
  onConfirm: () => void;
  onStartEditing: () => void;
}) {
  const benefits = [
    'Guarda esta lectura y retomala despues.',
    'Un espacio para organizar prioridades e iniciativas.',
    'Copilot Starteria especializado en Portfolio.',
    'Revision inicial de contexto, gaps y decisiones.',
    'Acceso anticipado al MVP.',
  ];
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Early Access - Gratis</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-950">Prueba Starteria con tu portafolio real.</h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2">
            <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-700" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-3">
        <p className="text-sm font-semibold text-slate-900">Guarda esta lectura y continua con tus iniciativas reales.</p>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar con mi portafolio
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onStartEditing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilLine size={16} />
          Ajustar lectura
        </button>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Al registrarte conservaras esta lectura. Todavia no estamos creando iniciativas ni activando Steps.
        </p>
      </div>
    </aside>
  );
}

function HandoffReview({
  session,
  correctionDraft,
  correctionNotes,
  editing,
  pending,
  onEditChange,
  onNotesChange,
  onStartEditing,
  onCancelEditing,
  onCorrect,
  onConfirm,
}: {
  session: PortfolioEntrySessionDto;
  correctionDraft: Record<string, string>;
  correctionNotes: string;
  editing: boolean;
  pending: boolean;
  onEditChange: (path: string, value: string) => void;
  onNotesChange: (value: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onCorrect: () => void;
  onConfirm: () => void;
}) {
  const handoff = session.handoff?.handoff;
  if (!handoff) return null;
  const editableFields = getEditableFields(handoff);

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Lectura inicial lista</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Starteria ya puede darte una interpretacion revisable.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nada de esto crea iniciativas ni valida estrategia. Es una lectura inicial para decidir si quieres continuar con tu portafolio real.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <InsightPanel session={session} handoff={handoff} />
          <BriefSection handoff={handoff} />
          <StarteriaRoute session={session} handoff={handoff} />
        </div>

        <EarlyAccessCard pending={pending} onConfirm={onConfirm} onStartEditing={onStartEditing} />
      </div>

      {editing ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-950">Correcciones</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Ajusta solo lo que no refleje tu situacion. Starteria guardara una nueva revision antes de continuar.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {editableFields.map((field) => (
              <label key={field.path} className="block text-sm font-semibold text-slate-800">
                {field.label}
                <textarea
                  value={correctionDraft[field.path] ?? field.value}
                  onChange={(event) => onEditChange(field.path, event.target.value)}
                  disabled={pending}
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-sm font-semibold text-slate-800">
            Nota opcional
            <textarea
              value={correctionNotes}
              onChange={(event) => onNotesChange(event.target.value)}
              disabled={pending}
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={onCorrect}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar correcciones
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onCancelEditing}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ConfirmedSummary({
  session,
  onContinue,
  onConvert,
  conversionPending,
  conversionError,
}: {
  session: PortfolioEntrySessionDto;
  onContinue: () => void;
  onConvert?: () => void;
  conversionPending?: boolean;
  conversionError?: UiError | null;
}) {
  const handoff = session.handoff?.handoff;
  const isClaimed = session.ownership.state === 'CLAIMED';
  return (
    <section className="mx-auto max-w-4xl rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-1 text-emerald-700" />
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Perfecto. Esta lectura esta lista para continuar.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {isClaimed
                ? 'Tu sesion ya esta guardada en tu cuenta. Puedes continuar al contexto Portfolio sin crear Project, Step 0 ni iniciativa canonica.'
                : 'Perfecto. Esta lectura todavia no ha creado ninguna iniciativa ni cambiado tu portafolio. Crea tu cuenta para conservar este contexto y continuar trabajando sobre el.'}
            </p>
          </div>
          {handoff ? (
            <div className="grid gap-3 md:grid-cols-2">
              <FieldBlock label="Que entendio" value={textFromProvenanced(handoff.understanding)} badges={['Confirmado por ti']} />
              <FieldBlock label="Foco" value={textFromProvenanced(handoff.desired_outcome)} badges={['Confirmado por ti']} />
              <FieldBlock label="Decision a habilitar" value={textFromDecision(handoff.decision_to_enable)} badges={['Confirmado por ti']} />
              <FieldBlock label="Siguiente paso conceptual" value={handoff.recommended_cta} badges={['Pre-canonico']} />
            </div>
          ) : null}
          {conversionError ? (
            <div role="alert" className="rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-900">
              <p className="font-semibold">{conversionError.title}</p>
              <p className="mt-1 leading-6">{conversionError.message}</p>
            </div>
          ) : null}
          {isClaimed ? (
            <button
              type="button"
              onClick={onConvert}
              disabled={conversionPending}
              aria-busy={conversionPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {conversionPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Continuar con mi portafolio
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Crear cuenta y conservar lectura
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ClaimedNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <div className="flex items-start gap-2">
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Tu sesion quedo guardada en tu cuenta.</p>
          <p className="mt-1 leading-6">Ahora puedes continuar al contexto Portfolio y revisar pendientes sin crear una iniciativa por defecto.</p>
          <button type="button" onClick={onDismiss} className="mt-2 text-xs font-semibold underline underline-offset-2">
            Ocultar mensaje
          </button>
        </div>
      </div>
    </div>
  );
}

export function PortfolioEntryExperience() {
  const navigate = useNavigate();
  const [sessionRef, setSessionRef] = useState<StoredPortfolioEntrySession | null>(null);
  const [sessionDto, setSessionDto] = useState<PortfolioEntrySessionDto | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState<Record<string, string>>({});
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [editingCorrection, setEditingCorrection] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState(() => readPortfolioEntryClaimedNotice());
  const [conversionError, setConversionError] = useState<UiError | null>(null);
  const [conversionIdempotencyKey, setConversionIdempotencyKey] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const materializedRevisionRef = useRef<number | null>(null);
  const trackedClarificationRef = useRef<number | null>(null);
  const trackedGuidedOfferRef = useRef<number | null>(null);
  const trackedConversionCtaRef = useRef<string | null>(null);

  const questions = useMemo(() => latestQuestions(sessionDto), [sessionDto]);
  const pending = pendingRequest !== null;

  const restart = () => {
    clearPortfolioEntryCurrentSession();
    setSessionRef(null);
    setSessionDto(null);
    setCurrentInput('');
    setError(null);
    setCorrectionDraft({});
    setCorrectionNotes('');
    setEditingCorrection(false);
    setConversionError(null);
    setConversionIdempotencyKey(null);
  };

  const handleRequestError = async (err: unknown, ref = sessionRef) => {
    const apiError = normalizePortfolioEntryApiError(err);
    const uiError = mapError(apiError.kind);
    setError(uiError);
    trackPortfolioEntryEvent('portfolio_entry_api_failure', { kind: apiError.kind, status: apiError.status });

    if (apiError.kind === 'conflict' && ref) {
      try {
        const latest = await getPortfolioEntrySession(ref.sessionId, ref.credential);
        setSessionDto(latest);
      } catch {
        // Keep the conflict guidance visible.
      }
      return;
    }

    if (apiError.kind === 'timeout' && ref) {
      try {
        const latest = await getPortfolioEntrySession(ref.sessionId, ref.credential);
        setSessionDto(latest);
      } catch {
        // The retry copy already tells the user no semantic input was replayed.
      }
    }

    if (['unauthorized', 'not_found', 'expired'].includes(apiError.kind)) {
      clearPortfolioEntryCurrentSession();
      setSessionRef(null);
      if (apiError.kind === 'expired') trackPortfolioEntryEvent('session_expired');
    }
  };

  useEffect(() => {
    const stored = readPortfolioEntryCurrentSession();
    const claimed = readClaimedPortfolioEntrySession() ?? claimedNotice;
    if (!stored && !claimed) return;
    let cancelled = false;
    setPendingRequest('recovering');
    const recovery = stored
      ? getPortfolioEntrySession(stored.sessionId, stored.credential)
      : getClaimedPortfolioEntrySession(claimed!.sessionId);
    recovery
      .then((session) => {
        if (cancelled) return;
        setSessionRef(stored ?? null);
        setSessionDto(session);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (stored) {
          void handleRequestError(err, stored);
          return;
        }
        const apiError = normalizePortfolioEntryApiError(err);
        setError(mapError(apiError.kind));
        trackPortfolioEntryEvent('portfolio_entry_api_failure', { kind: apiError.kind, status: apiError.status });
      })
      .finally(() => {
        if (!cancelled) setPendingRequest(null);
      });
    return () => {
      cancelled = true;
    };
    // Run only once on mount; recovery state lives in sessionStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    statusRef.current?.focus();
  }, [sessionDto?.revision, error?.kind]);

  useEffect(() => {
    if (!sessionDto) return;
    if (questions.length > 0 && trackedClarificationRef.current !== sessionDto.revision) {
      trackedClarificationRef.current = sessionDto.revision;
      trackPortfolioEntryEvent('clarification_displayed', {
        sessionId: sessionDto.id,
        count: questions.length,
        quickQuestionsAsked: sessionDto.clarification.quickQuestionsAsked,
      });
    }
    if (sessionDto.nextAction === 'offer_guided_exploration' && trackedGuidedOfferRef.current !== sessionDto.revision) {
      trackedGuidedOfferRef.current = sessionDto.revision;
      trackPortfolioEntryEvent('guided_exploration_offered', { sessionId: sessionDto.id });
    }
    if (
      sessionDto.lifecycleStatus === 'CONFIRMED' &&
      sessionDto.ownership.state === 'CLAIMED' &&
      trackedConversionCtaRef.current !== sessionDto.id
    ) {
      trackedConversionCtaRef.current = sessionDto.id;
      trackPortfolioEntryEvent('portfolio_entry_conversion_cta_viewed', { sessionId: sessionDto.id });
    }
  }, [questions.length, sessionDto]);

  useEffect(() => {
    if (!sessionDto || !sessionRef) return;
    if (sessionDto.nextAction !== 'generate_handoff') return;
    if (materializedRevisionRef.current === sessionDto.revision) return;
    materializedRevisionRef.current = sessionDto.revision;

    const key = createIdempotencyKey('portfolio-entry:handoff');
    setPendingRequest('handoff');
    materializePortfolioEntryHandoff(sessionRef.sessionId, sessionRef.credential, {
      expectedRevision: sessionDto.revision,
      idempotencyKey: key,
    })
      .then((next) => {
        setSessionDto(next);
        setError(null);
        trackPortfolioEntryEvent('handoff_generated', { sessionId: next.id });
      })
      .catch((err) => void handleRequestError(err))
      .finally(() => setPendingRequest(null));
    // handleRequestError intentionally reads current state; only the revision triggers this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDto?.nextAction, sessionDto?.revision, sessionRef?.sessionId]);

  const startFlow = async () => {
    const message = currentInput.trim();
    if (message.length < MIN_ENTRY_LENGTH || pending) return;
    setError(null);
    setPendingRequest('starting');
    trackPortfolioEntryEvent('public_entry_started');
    try {
      const created = await createPortfolioEntrySession();
      const ref = { sessionId: created.session.id, credential: created.publicAccessToken };
      savePortfolioEntryCurrentSession(ref);
      setSessionRef(ref);
      setSessionDto(created.session);
      trackPortfolioEntryEvent('portfolio_entry_session_created', { sessionId: created.session.id });

      setPendingRequest('submitting');
      const next = await submitPortfolioEntryMessage(ref.sessionId, ref.credential, {
        expectedRevision: created.session.revision,
        idempotencyKey: createIdempotencyKey('portfolio-entry:first-message'),
        message,
      });
      setSessionDto(next);
      setCurrentInput('');
      trackPortfolioEntryEvent('portfolio_entry_first_message_submitted', { sessionId: next.id });
    } catch (err) {
      await handleRequestError(err);
    } finally {
      setPendingRequest(null);
    }
  };

  const submitAnswer = async () => {
    if (!sessionDto || !sessionRef || pending) return;
    const message = currentInput.trim();
    if (!message) return;
    setError(null);
    setPendingRequest('submitting');
    try {
      const next = await submitPortfolioEntryMessage(sessionRef.sessionId, sessionRef.credential, {
        expectedRevision: sessionDto.revision,
        idempotencyKey: createIdempotencyKey('portfolio-entry:message'),
        message,
      });
      setSessionDto(next);
      setCurrentInput('');
      trackPortfolioEntryEvent('clarification_answered', { sessionId: next.id });
    } catch (err) {
      await handleRequestError(err);
    } finally {
      setPendingRequest(null);
    }
  };

  const chooseGuided = async (choice: 'accept' | 'reject') => {
    if (!sessionDto || !sessionRef || pending) return;
    setError(null);
    setPendingRequest('guided');
    try {
      const next = await chooseGuidedExploration(sessionRef.sessionId, sessionRef.credential, {
        expectedRevision: sessionDto.revision,
        idempotencyKey: createIdempotencyKey(`portfolio-entry:guided:${choice}`),
        choice,
      });
      setSessionDto(next);
      trackPortfolioEntryEvent(choice === 'accept' ? 'guided_exploration_accepted' : 'guided_exploration_rejected', {
        sessionId: next.id,
      });
    } catch (err) {
      await handleRequestError(err);
    } finally {
      setPendingRequest(null);
    }
  };

  const updateCorrectionDraft = (path: string, value: string) => {
    setCorrectionDraft((prev) => ({ ...prev, [path]: value }));
  };

  const beginCorrection = () => {
    const handoff = sessionDto?.handoff?.handoff;
    if (!handoff) return;
    const draft = Object.fromEntries(getEditableFields(handoff).map((field) => [field.path, field.value]));
    setCorrectionDraft(draft);
    setEditingCorrection(true);
  };

  const correctHandoff = async () => {
    if (!sessionDto || !sessionRef || !sessionDto.handoff || pending) return;
    const handoff = sessionDto.handoff.handoff;
    const base = Object.fromEntries(getEditableFields(handoff).map((field) => [field.path, field.value]));
    const changed = Object.fromEntries(
      Object.entries(correctionDraft)
        .map(([path, value]) => [path, value.trim()])
        .filter(([path, value]) => value && value !== base[path]),
    );
    if (Object.keys(changed).length === 0 && !correctionNotes.trim()) {
      setEditingCorrection(false);
      return;
    }
    setError(null);
    setPendingRequest('correcting');
    try {
      const next = await correctPortfolioEntryHandoff(sessionRef.sessionId, sessionRef.credential, {
        expectedRevision: sessionDto.revision,
        idempotencyKey: createIdempotencyKey('portfolio-entry:correct'),
        correctedFields: changed,
        notes: correctionNotes,
      });
      setSessionDto(next);
      setEditingCorrection(false);
      trackPortfolioEntryEvent('handoff_corrected', { sessionId: next.id });
    } catch (err) {
      await handleRequestError(err);
    } finally {
      setPendingRequest(null);
    }
  };

  const confirmHandoff = async () => {
    if (!sessionDto || !sessionRef || !sessionDto.handoff || pending) return;
    const handoff = sessionDto.handoff.handoff;
    setError(null);
    setPendingRequest('confirming');
    try {
      const next = await confirmPortfolioEntryHandoff(sessionRef.sessionId, sessionRef.credential, {
        expectedRevision: sessionDto.revision,
        idempotencyKey: createIdempotencyKey('portfolio-entry:confirm'),
        acceptedFields: getEditableFields(handoff).map((field) => field.path),
      });
      setSessionDto(next);
      trackPortfolioEntryEvent('handoff_confirmed', { sessionId: next.id });
    } catch (err) {
      await handleRequestError(err);
    } finally {
      setPendingRequest(null);
    }
  };

  const continueToSignup = () => {
    if (!sessionRef) return;
    savePendingPortfolioEntryClaim(sessionRef);
    trackPortfolioEntryEvent('signup_gate_reached', { sessionId: sessionRef.sessionId });
    navigate('/auth');
  };

  const convertClaimedSession = async () => {
    if (!sessionDto || pending) return;
    if (sessionDto.ownership.state !== 'CLAIMED' || sessionDto.lifecycleStatus !== 'CONFIRMED') return;
    const key = conversionIdempotencyKey ?? createIdempotencyKey('portfolio-entry:convert');
    setConversionIdempotencyKey(key);
    setConversionError(null);
    setError(null);
    setPendingRequest('converting');
    trackPortfolioEntryEvent('portfolio_entry_conversion_started', { sessionId: sessionDto.id });
    try {
      const result = await continuePortfolioEntryToPortfolio(sessionDto.id, {
        expectedRevision: sessionDto.revision,
        idempotencyKey: key,
      });
      trackPortfolioEntryEvent('portfolio_entry_conversion_completed', {
        sessionId: result.sessionId,
        continuationId: result.continuationId,
      });
      clearPortfolioEntryConversionState();
      trackPortfolioEntryEvent('portfolio_entry_overview_opened', { continuationId: result.continuationId });
      navigate(result.destinationRoute);
    } catch (err) {
      const apiError = normalizePortfolioEntryApiError(err);
      const uiError = mapError(apiError.kind);
      setConversionError(uiError);
      trackPortfolioEntryEvent('portfolio_entry_conversion_failed', {
        sessionId: sessionDto.id,
        kind: apiError.kind,
        status: apiError.status,
      });
      if (apiError.kind === 'conflict') {
        try {
          const latest = await getClaimedPortfolioEntrySession(sessionDto.id);
          setSessionDto(latest);
        } catch {
          // Keep the conversion conflict guidance visible.
        }
      }
    } finally {
      setPendingRequest(null);
    }
  };

  const dismissClaimedNotice = () => {
    clearPortfolioEntryClaimedNotice();
    setClaimedNotice(null);
  };

  const renderMain = () => {
    if (!sessionDto) {
      return (
        <InitialComposer
          value={currentInput}
          pending={pending}
          onChange={setCurrentInput}
          onSubmit={startFlow}
        />
      );
    }

    if (sessionDto.lifecycleStatus === 'CONFIRMED') {
      return (
        <ConfirmedSummary
          session={sessionDto}
          onContinue={continueToSignup}
          onConvert={convertClaimedSession}
          conversionPending={pendingRequest === 'converting'}
          conversionError={conversionError}
        />
      );
    }

    if (sessionDto.nextAction === 'offer_guided_exploration') {
      return <GuidedExplorationOffer pending={pending} onChoose={chooseGuided} />;
    }

    if (sessionDto.nextAction === 'review_handoff' || sessionDto.nextAction === 'claim_or_close') {
      return (
        <HandoffReview
          session={sessionDto}
          correctionDraft={correctionDraft}
          correctionNotes={correctionNotes}
          editing={editingCorrection}
          pending={pending}
          onEditChange={updateCorrectionDraft}
          onNotesChange={setCorrectionNotes}
          onStartEditing={beginCorrection}
          onCancelEditing={() => setEditingCorrection(false)}
          onCorrect={correctHandoff}
          onConfirm={confirmHandoff}
        />
      );
    }

    return (
      <ConversationPanel
        session={sessionDto}
        value={currentInput}
        pending={pending}
        onChange={setCurrentInput}
        onSubmit={submitAnswer}
      />
    );
  };

  return (
    <div className="space-y-5">
      {claimedNotice ? <ClaimedNotice onDismiss={dismissClaimedNotice} /> : null}
      <div ref={statusRef} tabIndex={-1} className="mx-auto max-w-3xl outline-none">
        <StatusMessage pendingRequest={pendingRequest} />
      </div>
      <div className="mx-auto max-w-3xl">
        <ErrorMessage error={error} onRestart={restart} />
      </div>
      {renderMain()}
    </div>
  );
}
