import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../../../app/services/auth.service';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  PencilLine,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../app/components/ui/alert';
import { Badge } from '../../../app/components/ui/badge';
import { Button } from '../../../app/components/ui/button';
import { Textarea } from '../../../app/components/ui/textarea';
import { AISuggestionPanel } from '../../../app/components/design-system/patterns';
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
  GapResolution,
  GapResolutionType,
  ProvenancedText,
  ProvenanceOrigin,
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
  {
    label: 'Alinear iniciativas',
    value: 'Tengo varias iniciativas y necesito entender cuales realmente contribuyen a nuestros objetivos.',
  },
  {
    label: 'Entender bloqueos',
    value: 'Necesito entender que bloqueos impiden avanzar las iniciativas mas importantes.',
  },
  {
    label: 'Preparar comite',
    value: 'Tengo que preparar comite y explicar que decisiones necesita el portafolio.',
  },
  {
    label: 'Decidir prioridades',
    value: 'Quiero decidir que prioridades deberian recibir atencion ahora y cuales pueden esperar.',
  },
];

const PROVENANCE_LABELS: Record<ProvenanceOrigin, string> = {
  USER_DECLARED: 'Lo indicaste tu',
  EXTRACTED_FROM_USER_TEXT: 'Lo que nos contaste',
  AI_INFERRED: 'Interpretado por Starteria',
  AI_SUGGESTED: 'Propuesta de Starteria',
};

function latestQuestions(session: PortfolioEntrySessionDto | null): PortfolioEntryQuestion[] {
  const turns = session?.conversation ?? [];
  return turns.at(-1)?.emittedQuestions.slice(0, 1) ?? [];
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

function originIsUser(value: ProvenancedText | undefined): boolean {
  const origin = value?.provenance?.origin;
  return origin === 'USER_DECLARED' || origin === 'EXTRACTED_FROM_USER_TEXT';
}

function provenanceLabels(handoff: PortfolioEntryHandoff): string[] {
  const labels = new Set<string>();
  for (const item of handoff.provenance_summary ?? []) labels.add(PROVENANCE_LABELS[item.origin]);
  if (originIsUser(handoff.understanding)) labels.add(PROVENANCE_LABELS.USER_DECLARED);
  if (originIsUser(handoff.desired_outcome)) labels.add(PROVENANCE_LABELS.EXTRACTED_FROM_USER_TEXT);
  const hasInferredContext = [
    handoff.understanding.provenance?.origin,
    handoff.desired_outcome.provenance?.origin,
    handoff.decision_to_enable !== 'unresolved' ? handoff.decision_to_enable.provenance?.origin : undefined,
  ].includes('AI_INFERRED');
  if (hasInferredContext) labels.add(PROVENANCE_LABELS.AI_INFERRED);
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

function ConversationTrace({ session }: { session: PortfolioEntrySessionDto }) {
  if (session.conversation.length === 0) return null;

  return (
    <details className="rounded-ds-md border border-border-default bg-background-subtle p-4">
      <summary className="cursor-pointer text-sm font-semibold text-text-primary">
        Ver conversación
      </summary>
      <div className="mt-4 space-y-4" data-testid="portfolio-entry-conversation-trace">
        {session.conversation.map((turn, index) => (
          <div key={turn.id} className="space-y-3 border-l-2 border-border-default pl-4">
            <div>
              <p className="text-xs font-semibold uppercase text-text-muted">
                {index === 0 ? 'Tu contexto inicial' : 'Tu respuesta'}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{turn.userInput}</p>
            </div>
            {turn.emittedQuestions.map((question) => (
              <div key={`${turn.id}-${question.question}`}>
                <p className="text-xs font-semibold uppercase text-brand-primary">Starteria</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">{question.question}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
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
    <AISuggestionPanel
      state="loading"
      loadingLabel={copy[pendingRequest]}
      className="shadow-none"
    />
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
    <Alert variant="danger" aria-live="assertive">
      <AlertCircle />
      <AlertTitle>{error.title}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {terminal ? (
          <Button type="button" variant="secondary" size="sm" onClick={onRestart} className="mt-2">
            <RefreshCcw size={14} />
            Empezar de nuevo
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function InitialComposer({
  value,
  pending,
  onChange,
  onSubmit,
  variant = 'workspace',
}: {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  variant?: 'landing' | 'workspace';
}) {
  const canSubmit = value.trim().length >= MIN_ENTRY_LENGTH && !pending;
  const isLanding = variant === 'landing';
  return (
    <section
      className={
        isLanding
          ? 'rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-xl shadow-slate-900/8 backdrop-blur md:p-6'
          : 'rounded-[22px] border border-border-default bg-surface-default p-4 shadow-sm shadow-slate-900/5 md:p-5'
      }
    >
      <div className="space-y-2">
        <label htmlFor="portfolio-entry-input" className="block text-sm font-semibold text-text-primary">
          ¿Qué necesitas conseguir o entender?
        </label>
        <Textarea
          id="portfolio-entry-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={isLanding ? 7 : 8}
          className={
            isLanding
              ? 'min-h-40 resize-y border-slate-200 bg-white text-base leading-7 shadow-inner shadow-slate-900/[0.02] md:min-h-48'
              : 'min-h-52 resize-y border-slate-200 bg-white/90 text-base leading-7 shadow-inner shadow-slate-900/[0.02]'
          }
          placeholder="Tengo varias iniciativas y no se cuales realmente contribuyen a nuestras prioridades..."
          disabled={pending}
        />
        <p className="text-xs leading-5 text-text-muted">
          No necesitas tenerlo estructurado. Empieza con lo que sabes.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Ejemplos editables">
        {EXAMPLES.map((example) => (
          <Button
            key={example.label}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange(example.value)}
            disabled={pending}
            className="h-auto w-full min-w-0 max-w-full shrink justify-start rounded-full border-slate-200 bg-white/80 whitespace-normal break-words text-left text-xs leading-5 sm:w-auto"
          >
            {example.label}
            <span className="sr-only">{example.value}</span>
          </Button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck size={15} className="text-[var(--status-feedback-success-text)]" />
          No se crea nada en tu portafolio hasta que lo revises.
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          Analizar mi situación
          <ArrowRight size={16} />
        </Button>
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
  const guided = session.clarification.interactionMode === 'guided_exploration';
  const canSubmit = value.trim().length > 0 && !pending;
  return (
    <section className="mx-auto max-w-3xl rounded-ds-lg border border-border-default bg-surface-default p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-ds-md bg-brand-primary-subtle p-2 text-brand-primary">
          <HelpCircle size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{guided ? 'Exploración guiada' : 'Quick clarification'}</Badge>
              <Badge variant="neutral">
                {guided
                  ? `Profundizando · ${session.clarification.questionsAskedCurrentRound} de hasta 2`
                  : `Aclaración ${session.clarification.quickQuestionsAsked} de hasta ${session.clarification.quickQuestionBudget}`}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{guided ? 'Exploración guiada' : 'Aclaración breve'}</h2>
            {session.semanticProjection.understanding ? (
              <div className="mt-3 rounded-ds-md border border-brand-primary/20 bg-brand-primary-subtle p-4" data-testid="portfolio-entry-understanding">
                <p className="text-xs font-semibold uppercase text-brand-primary">Así estoy entendiendo lo que me dices</p>
                <p className="mt-2 text-sm leading-6 text-text-primary">{session.semanticProjection.understanding.value.replace(/^Así estoy entendiendo lo que me dices:\s*/i, '')}</p>
              </div>
            ) : null}
          </div>

          <ConversationTrace session={session} />

          <div className="rounded-ds-md border border-border-default bg-background-subtle p-4">
            <p className="text-xs font-semibold uppercase text-text-muted">Tu punto de partida</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {session.conversation[0]?.userInput || 'Todavía no hay contexto declarado.'}
            </p>
          </div>

          {activeQuestion ? (
            <div
              className="rounded-ds-md border border-border-default bg-background-subtle p-4"
              data-testid="portfolio-entry-active-question"
            >
              <p className="text-xs font-semibold uppercase text-text-muted">Lo que estamos aclarando ahora</p>
              <p
                className="mt-2 text-sm font-semibold leading-6 text-text-primary"
                data-testid="portfolio-entry-active-question-text"
              >
                {activeQuestion.question}
              </p>
            </div>
          ) : null}

          {activeQuestion ? (
            <div className="space-y-2">
            <label htmlFor="portfolio-entry-answer" className="block text-sm font-semibold text-text-primary">
              Tu respuesta
            </label>
            <Textarea
              id="portfolio-entry-answer"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={4}
              className="min-h-28 resize-y bg-background-subtle text-sm leading-6"
              disabled={pending}
            />
            </div>
          ) : (
            <div className="rounded-ds-md border border-status-feedback-warning-border bg-status-feedback-warning-surface p-4 text-sm leading-6 text-status-feedback-warning-text" data-testid="portfolio-entry-inconsistent-state">
              No hay una pregunta activa para responder. Puedes revisar la conversación o continuar cuando Starteria proponga el siguiente paso.
            </div>
          )}

          {activeQuestion ? <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              Enviar respuesta
              <ArrowRight size={16} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => onChange('No lo se todavia.')}
            >
              No lo se todavia
            </Button>
          </div> : null}
        </div>
      </div>
    </section>
  );
}

function GuidedExplorationOffer({
  pending,
  session,
  onChoose,
}: {
  pending: boolean;
  session: PortfolioEntrySessionDto;
  onChoose: (choice: 'accept' | 'provisional_route') => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <AISuggestionPanel
        title={session.clarification.checkpoint === 'guided'
          ? 'Con lo que acabamos de profundizar, ya puedo convertir esta lectura en una propuesta de abordaje.'
          : 'Ya tengo suficiente claridad para proponerte un primer abordaje'}
        suggestion={session.clarification.checkpoint === 'guided'
          ? 'La exploración guiada queda cerrada y la propuesta seguirá mostrando qué está claro y qué conserva incertidumbre.'
          : 'Entiendo qué estás intentando conseguir, qué está dificultando la decisión y qué aspectos siguen abiertos. Podemos seguir aterrizando algunos puntos o convertir lo que tenemos en una propuesta concreta.'}
        why={['La aclaración puede continuar sin convertirse en una entrevista larga.', 'La propuesta será provisional y conservará la incertidumbre explícita.']}
        actions={session.clarification.checkpoint === 'guided'
          ? [{ id: 'provisional', label: 'Ver mi propuesta de abordaje', tone: 'primary', disabled: pending }]
          : [
            { id: 'provisional', label: 'Ver mi propuesta de abordaje', tone: 'primary', disabled: pending },
            { id: 'deepen', label: 'Seguir aterrizando mi necesidad', tone: 'secondary', disabled: pending },
          ]}
        onAction={(actionId) => onChoose(actionId === 'deepen' ? 'accept' : 'provisional_route')}
      />
      <div className="mt-4">
        <ConversationTrace session={session} />
      </div>
    </div>
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
    <div className="rounded-ds-md border border-border-default bg-surface-default p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
        {badges.map((badge) => (
          <Badge key={badge} variant="neutral">
            {badge}
          </Badge>
        ))}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{value}</p>
    </div>
  );
}

function ProvenanceChips({ handoff }: { handoff: PortfolioEntryHandoff }) {
  const labels = provenanceLabels(handoff);
  return (
    <div className="flex flex-wrap gap-2" aria-label="Procedencia de la lectura">
      {labels.map((label) => (
        <Badge key={label} variant="neutral">
          {label}
        </Badge>
      ))}
    </div>
  );
}

function UnderstandingSection({ handoff }: { handoff: PortfolioEntryHandoff }) {
  const tension = handoff.unresolved_context[0]?.description;
  return (
    <section className="rounded-ds-lg border border-border-default bg-surface-default p-5 shadow-sm md:p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase text-brand-primary">01</p>
        <h2 className="mt-2 text-xl font-semibold text-text-primary">Tu situación</h2>
        <p className="mt-1 text-sm leading-6 text-text-secondary">Una lectura breve y revisable de lo que has puesto sobre la mesa.</p>
      </div>
      <dl className="grid gap-4 md:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase text-text-muted">Situación</dt>
          <dd className="mt-1 text-sm leading-6 text-text-primary">{textFromProvenanced(handoff.understanding)}</dd>
        </div>
        {tension ? (
          <div>
            <dt className="text-xs font-medium uppercase text-text-muted">Punto abierto</dt>
            <dd className="mt-1 text-sm leading-6 text-text-primary">{tension}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium uppercase text-text-muted">Decisión a habilitar</dt>
          <dd className="mt-1 text-sm leading-6 text-text-primary">{textFromDecision(handoff.decision_to_enable)}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <ProvenanceChips handoff={handoff} />
      </div>
    </section>
  );
}

function RecommendedApproachSection({ handoff }: { handoff: PortfolioEntryHandoff }) {
  const approach = handoff.recommended_approach;

  return (
    <section className="rounded-ds-lg border-2 border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)] p-5 shadow-md md:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-[var(--ai-suggested-border)] bg-surface-default text-[var(--ai-suggested-text)]">
          02 · Así abordaría tu situación
        </Badge>
        {approach?.origin === 'AI_SUGGESTED' ? <Badge variant="neutral">Propuesta de Starteria</Badge> : null}
      </div>
      <h2 className="mt-4 text-2xl font-semibold leading-tight text-text-primary md:text-3xl">Qué haría Starteria primero</h2>
      <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-text-primary md:text-lg">
        {approach?.description || 'Starteria todavía no tiene una propuesta suficiente para esta situación. Conviene aclarar un poco más el contexto antes de recomendar un primer paso.'}
      </p>
      {approach?.rationale ? (
        <div className="mt-5 border-t border-[var(--ai-suggested-border)] pt-5">
          <p className="text-xs font-semibold uppercase text-text-muted">Por qué empezar por ahí</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-text-secondary">{approach.rationale}</p>
        </div>
      ) : null}
      {approach?.assumption?.trim() ? (
        <div className="mt-4 rounded-ds-md border border-border-default bg-surface-default p-3">
          <p className="text-xs font-semibold uppercase text-text-muted">Supuesto todavía abierto</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{approach.assumption}</p>
        </div>
      ) : null}
      {approach ? <p className="mt-4 text-xs text-text-muted">Propuesta pendiente de revisión humana.</p> : null}
      {handoff.alternative_approaches.length > 0 ? (
        <div className="mt-6 border-t border-[var(--ai-suggested-border)] pt-5">
          <p className="text-xs font-semibold uppercase text-text-muted">Otras formas de empezar</p>
          <div className="mt-3 space-y-3">
            {handoff.alternative_approaches.map((alternative, index) => (
              <div key={`${alternative.description}-${index}`} className="rounded-ds-md border border-border-default bg-surface-default p-4">
                <p className="text-sm leading-6 text-text-primary">{alternative.description}</p>
                {alternative.rationale ? <p className="mt-2 text-xs leading-5 text-text-secondary">{alternative.rationale}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const RESOLUTION_COPY: Record<GapResolutionType, string> = {
  STARTERIA_CAN_STRUCTURE: 'Starteria puede estructurar esta información para hacerla comparable y visible.',
  STARTERIA_CAN_GUIDE: 'Starteria puede guiar la aclaración y dejar explícito qué criterio falta.',
  STARTERIA_CAN_TRACK: 'Starteria puede registrar y seguir este pendiente junto con la decisión.',
  REQUIRES_ORGANIZATIONAL_INPUT: 'Requiere información o criterio de tu organización.',
  REQUIRES_EXTERNAL_EVIDENCE: 'Requiere evidencia que Starteria puede registrar y conectar, pero no inventar.',
  OUT_OF_SCOPE: 'Este punto queda fuera del alcance de esta lectura.',
};

function resolutionForGap(gap: GapResolution | undefined): string {
  if (!gap) return 'No hay un tratamiento definido todavía para este pendiente.';
  return gap.starteria_capability?.trim() && gap.resolution_type.startsWith('STARTERIA_')
    ? gap.starteria_capability
    : RESOLUTION_COPY[gap.resolution_type];
}

function MaterialGapsSection({ handoff }: { handoff: PortfolioEntryHandoff }) {
  const resolutions = new Map((handoff.gap_resolution_map ?? []).map((gap) => [gap.gap_id, gap]));
  const unresolvedIds = new Set(handoff.unresolved_context.map((gap) => gap.gap_id));
  const gaps = [
    ...handoff.unresolved_context.map((gap) => ({
      id: gap.gap_id,
      description: gap.description,
      resolution: resolutionForGap(resolutions.get(gap.gap_id)),
    })),
    ...(handoff.gap_resolution_map ?? [])
      .filter((gap) => !unresolvedIds.has(gap.gap_id))
      .map((gap) => ({
        id: gap.gap_id,
        description: gap.gap_description,
        resolution: resolutionForGap(gap),
      })),
  ];
  const gapDescriptions = new Set(gaps.map((gap) => gap.description));
  const evidence = handoff.evidence_or_clarity_needed.filter((item) => item.value && !gapDescriptions.has(item.value));

  return (
    <section className="rounded-ds-lg border border-border-default bg-surface-default p-5 shadow-sm md:p-6">
      <p className="text-xs font-semibold uppercase text-brand-primary">03</p>
      <h2 className="mt-2 text-xl font-semibold text-text-primary">Lo que todavía puede cambiar la decisión</h2>
      <p className="mt-1 text-sm leading-6 text-text-secondary">Mostramos lo que falta sin convertirlo en una conclusión ni inventar evidencia.</p>
      {gaps.length > 0 ? (
        <div className="mt-5 space-y-3">
          {gaps.map((gap) => (
            <div key={gap.id} className="rounded-ds-md border border-border-default bg-background-subtle p-4">
              <p className="text-sm font-semibold text-text-primary">{gap.description}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{gap.resolution}</p>
            </div>
          ))}
        </div>
      ) : null}
      {evidence.length > 0 ? (
        <div className="mt-5 rounded-ds-md border border-[var(--status-feedback-warning-border)] bg-[var(--status-feedback-warning-surface)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--status-feedback-warning-text)]">Claridad o evidencia que falta</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-text-secondary">
            {evidence.map((item, index) => <li key={`${item.value}-${index}`}>{item.value}</li>)}
          </ul>
        </div>
      ) : null}
      {gaps.length === 0 && evidence.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-text-secondary">No hay pendientes materiales registrados en esta lectura inicial.</p>
      ) : null}
    </section>
  );
}

const PATH_LABELS: Record<string, string> = {
  structure: 'Estructurar',
  make_visible: 'Hacer visible',
  compare_or_follow: 'Comparar y seguir',
  resolve_gaps: 'Resolver pendientes',
  prepare_decision: 'Preparar una decisión',
};

function StarteriaPathSection({ handoff }: { handoff: PortfolioEntryHandoff }) {
  return (
    <section className="rounded-ds-lg border border-border-default bg-surface-default p-5 shadow-sm md:p-6">
      <p className="text-xs font-semibold uppercase text-brand-primary">04</p>
      <h2 className="mt-2 text-xl font-semibold text-text-primary">Cómo lo llevamos a trabajo</h2>
      <p className="mt-1 text-sm leading-6 text-text-secondary">La ruta contextual disponible para continuar.</p>
      {handoff.starteria_path.length > 0 ? (
        <ol className="mt-5 space-y-3 border-l-2 border-brand-primary/30 pl-5">
          {handoff.starteria_path.map((item, index) => (
            <li key={`${item.action}-${index}`} className="relative rounded-ds-md border border-border-default bg-background-subtle p-4">
              <span className="absolute -left-[2.05rem] top-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">{index + 1}</span>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-text-primary">{PATH_LABELS[item.action] ?? 'Siguiente trabajo'}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{item.description}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm leading-6 text-text-secondary">La ruta de trabajo todavía se está preparando para esta situación.</p>
      )}
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
    <section className="space-y-5 rounded-ds-lg border border-border-default bg-background-subtle p-5 md:p-6">
      <div>
        <p className="text-xs font-semibold uppercase text-brand-primary">05 · Continúa con Starteria</p>
        <h2 className="mt-3 text-xl font-semibold leading-tight text-text-primary">Lleva esta lectura a tu portafolio.</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Conserva lo entendido y continúa trabajando sobre los pendientes cuando tu cuenta lo permita.
        </p>
      </div>
      <ul className="space-y-3">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2 text-sm leading-6 text-text-secondary">
            <CheckCircle2 size={15} className="mt-1 shrink-0 text-[var(--status-feedback-success-text)]" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={onConfirm} disabled={pending}>
          Continuar con mi portafolio
          <ArrowRight size={16} />
        </Button>
        <Button type="button" variant="ghost" onClick={onStartEditing} disabled={pending}>
          Ajustar esta lectura
        </Button>
      </div>
      <p className="text-xs leading-5 text-text-muted">Esta continuidad no crea iniciativas ni activa Steps.</p>
    </section>
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
        <Badge variant="success">Lectura inicial lista</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-text-primary">Starteria ya puede darte una interpretacion revisable.</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Nada de esto crea iniciativas ni valida estrategia. Es una lectura inicial para decidir si quieres continuar con tu portafolio real.
        </p>
      </div>

      <div className="space-y-5">
        <ConversationTrace session={session} />
        <UnderstandingSection handoff={handoff} />
        <RecommendedApproachSection handoff={handoff} />
        <MaterialGapsSection handoff={handoff} />
        <StarteriaPathSection handoff={handoff} />
        <EarlyAccessCard pending={pending} onConfirm={onConfirm} onStartEditing={onStartEditing} />
      </div>

      {editing ? (
        <div className="rounded-ds-lg border border-border-default bg-surface-default p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Correcciones</h3>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            Ajusta solo lo que no refleje tu situacion. Starteria guardara una nueva revision antes de continuar.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {editableFields.map((field) => (
              <label key={field.path} className="block text-sm font-semibold text-text-primary">
                {field.label}
                <Textarea
                  value={correctionDraft[field.path] ?? field.value}
                  onChange={(event) => onEditChange(field.path, event.target.value)}
                  disabled={pending}
                  rows={3}
                  className="mt-1 min-h-24 resize-y bg-background-subtle text-sm font-normal leading-6"
                />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-sm font-semibold text-text-primary">
            Nota opcional
            <Textarea
              value={correctionNotes}
              onChange={(event) => onNotesChange(event.target.value)}
              disabled={pending}
              rows={3}
              className="mt-1 min-h-24 resize-y bg-background-subtle text-sm font-normal leading-6"
            />
          </label>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={pending}
              onClick={onCorrect}
            >
              Guardar correcciones
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onCancelEditing}
            >
              Cancelar
            </Button>
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
    <section className="mx-auto max-w-4xl rounded-ds-lg border border-[var(--status-feedback-success-border)] bg-[var(--status-feedback-success-surface)] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-1 text-[var(--status-feedback-success-text)]" />
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Esta lectura esta lista para continuar.</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {isClaimed
                ? 'Tu sesion ya esta guardada en tu cuenta. Puedes continuar al contexto Portfolio sin crear Project, Step 0 ni iniciativa canonica.'
                : 'Perfecto. Esta lectura todavia no ha creado ninguna iniciativa ni cambiado tu portafolio. Crea tu cuenta para conservar este contexto y continuar trabajando sobre el.'}
            </p>
          </div>
          <ConversationTrace session={session} />
          {handoff ? (
            <div className="space-y-3">
              {handoff.recommended_approach ? (
                <FieldBlock label="Propuesta de Starteria" value={handoff.recommended_approach.description} badges={['Pendiente de tu revision']} />
              ) : null}
              {handoff.recommended_approach?.rationale ? (
                <FieldBlock label="Por qué empezar por ahí" value={handoff.recommended_approach.rationale} badges={['Explicación de la propuesta']} />
              ) : null}
              <FieldBlock label="Decision y foco" value={`${textFromDecision(handoff.decision_to_enable)} ${textFromProvenanced(handoff.desired_outcome)}`} badges={['Confirmado por ti']} />
              <FieldBlock label="Siguiente paso conceptual" value={handoff.recommended_cta} badges={['Pre-canonico']} />
            </div>
          ) : null}
          {conversionError ? (
            <Alert variant="warning">
              <AlertCircle />
              <AlertTitle>{conversionError.title}</AlertTitle>
              <AlertDescription>
                <p>{conversionError.message}</p>
              </AlertDescription>
            </Alert>
          ) : null}
          {isClaimed ? (
            <Button
              type="button"
              onClick={onConvert}
              disabled={conversionPending}
              loading={conversionPending}
              aria-busy={conversionPending}
            >
              {!conversionPending ? <ArrowRight size={16} /> : null}
              Continuar con mi portafolio
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onContinue}
            >
              Crear cuenta y conservar lectura
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ClaimedNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mx-auto max-w-3xl rounded-ds-md border border-[var(--status-feedback-success-border)] bg-[var(--status-feedback-success-surface)] p-4 text-sm text-[var(--status-feedback-success-text)]">
      <div className="flex items-start gap-2">
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Tu sesion quedo guardada en tu cuenta.</p>
          <p className="mt-1 leading-6">Ahora puedes continuar al contexto Portfolio y revisar pendientes sin crear una iniciativa por defecto.</p>
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss} className="mt-2 px-0">
            Ocultar mensaje
          </Button>
        </div>
      </div>
    </div>
  );
}

type PortfolioEntryExperienceProps = {
  variant?: 'landing' | 'workspace';
  recoverExisting?: boolean;
  redirectAfterStart?: string;
};

export function PortfolioEntryExperience({
  variant = 'workspace',
  recoverExisting = true,
  redirectAfterStart,
}: PortfolioEntryExperienceProps = {}) {
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
  const activeQuestion = questions[0];
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
    if (!recoverExisting) return;
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
  }, [recoverExisting]);

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
      if (redirectAfterStart) navigate(redirectAfterStart);
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
        matchedQuestionIds: activeQuestion ? [activeQuestion.id] : undefined,
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

  const chooseGuided = async (choice: 'accept' | 'provisional_route') => {
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
      trackPortfolioEntryEvent(choice === 'accept' ? 'guided_exploration_accepted' : 'guided_provisional_route_selected', {
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
      // The continuation grants the capability in the database. Rotate the access
      // token before entering Portfolio so the current request context sees it too.
      // A full navigation also rehydrates AppContext with the newly granted roles;
      // an SPA navigate would retain the pre-continuation participant permissions.
      if (result.portfolioAccessGranted) {
        await authService.refreshToken();
        window.location.assign(result.destinationRoute);
        return;
      }
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
          variant={variant}
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
      return <GuidedExplorationOffer session={sessionDto} pending={pending} onChoose={chooseGuided} />;
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
    <div className={variant === 'landing' ? 'space-y-4' : 'space-y-5'}>
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
