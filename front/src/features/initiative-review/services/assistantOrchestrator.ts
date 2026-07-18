/**
 * ADR-026 (IRC-04): orquestador determinista del asistente de revisión inicial.
 *
 * Capa PURA (sin React, sin red): deriva la agenda desde el review, decide la transición
 * de cada turno según el modo, rehidrata el historial persistido a mensajes y genera los
 * mensajes-guía. La página ejecuta las acciones contra el client (add-context /
 * strategic-answers / confirm-route de ADR-025). Chat determinista: cero LLM por turno.
 */
import type { InitiativeReview, ChatEvent, SnapshotSectionId } from './initiativeReviewClient';
import type { ChatMessage } from '../components/chat/AssistantPanel';
import { answerDoubt, FAQ_FALLBACK } from './assistantFaq';

export type AssistantMode = 'answer' | 'context' | 'doubt';

export interface StrategicQ {
  id: string;
  question: string;
  options: string[];
  allowsUnknown: boolean;
  answer?: string;
  status: string;
}

export interface Agenda {
  activeQuestion: StrategicQ | null;
  answeredCount: number;
  pendingCount: number;
  totalQuestions: number;
  missing: string[];
  canConfirm: boolean;
  ready: boolean; // sin preguntas pendientes y sin faltantes
}

/** Faltantes canónicos del PRD cuando el readiness no es alto. */
const PRD_MISSING = ['aprobaciones internas', 'recursos disponibles', 'criterios de escalamiento'];

const SECTION_LABEL: Record<SnapshotSectionId, string> = {
  understanding: 'Lo que Starteria entendió',
  challengeType: 'Tipo de reto',
  critique: 'Mirada crítica',
  questions: 'Preguntas estratégicas',
  improvedProposal: 'Versión mejorada',
  routePreview: 'Ruta Step 0-4',
};

const ANSWERED_STATES = new Set(['answered', 'unknown']);

export function deriveAgenda(review: InitiativeReview): Agenda {
  const qs = (review.snapshot?.strategicQuestions ?? []) as StrategicQ[];
  const pending = qs.filter((q) => !ANSWERED_STATES.has(q.status));
  const readiness = review.snapshot?.informationReadiness ?? null;
  const missing = readiness === 'high' ? [] : PRD_MISSING;
  return {
    activeQuestion: pending[0] ?? null,
    answeredCount: qs.length - pending.length,
    pendingCount: pending.length,
    totalQuestions: qs.length,
    missing,
    canConfirm: true,
    ready: pending.length === 0 && missing.length === 0,
  };
}

/** Modo por defecto contextual: si hay pregunta activa, se asume respuesta; si no, contexto. */
export function defaultMode(agenda: Agenda): AssistantMode {
  return agenda.activeQuestion ? 'answer' : 'context';
}

/** Reconoce una respuesta "no lo sé aún". */
export function isUnknownAnswer(text: string): boolean {
  const n = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return ['no lo se', 'no se', 'ns', 'no lo se aun', 'no lo tengo', 'todavia no', 'no aun'].some((p) => n === p || n.startsWith(p));
}

export type OrchestratorAction =
  | { type: 'answer'; questionId: string; answer: string }
  | { type: 'answer_unknown'; questionId: string }
  | { type: 'context'; text: string }
  | { type: 'doubt'; question: string; answer: string };

/**
 * Transición pura de un turno del usuario. Dado el modo, la agenda y el texto, decide qué
 * acción ejecutar. No produce efectos: la página traduce la acción a una llamada del client.
 */
export function nextAction(mode: AssistantMode, agenda: Agenda, text: string): OrchestratorAction {
  if (mode === 'doubt') {
    return { type: 'doubt', question: text, answer: answerDoubt(text) ?? FAQ_FALLBACK };
  }
  if (mode === 'answer' && agenda.activeQuestion) {
    if (agenda.activeQuestion.allowsUnknown && isUnknownAnswer(text)) {
      return { type: 'answer_unknown', questionId: agenda.activeQuestion.id };
    }
    return { type: 'answer', questionId: agenda.activeQuestion.id, answer: text };
  }
  // 'context', o 'answer' sin pregunta activa → se trata como contexto.
  return { type: 'context', text };
}

/** Frase de anuncio de cambios (reutilizada por IRC-05 para el resaltado del panel). */
export function announceDiff(changed: SnapshotSectionId[]): string {
  if (changed.length === 0) return 'Revisé lo que me contaste, pero el análisis se mantiene igual.';
  const labels = changed.map((s) => SECTION_LABEL[s]);
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
  return `Con lo que me contaste actualicé: ${list}. Revisa el panel — resalté lo que cambió.`;
}

/** Rehidrata el historial persistido (ADR-026 IRC-01) a mensajes del chat. */
export function mapEventsToMessages(events: ChatEvent[] = []): ChatMessage[] {
  return events
    .filter((e) => e.role !== 'system')
    .map((e): ChatMessage => {
      if (e.role === 'user') {
        const content =
          e.kind === 'answer'
            ? e.payload.unknown
              ? 'No lo sé aún.'
              : String(e.payload.answer ?? e.payload.text ?? '')
            : String(e.payload.text ?? '');
        return { id: e.id, role: 'user', content };
      }
      const content =
        e.kind === 'diff_announcement' ? announceDiff(e.payload.changedSections ?? []) : String(e.payload.text ?? '');
      return { id: e.id, role: 'assistant', content };
    })
    .filter((m) => m.content !== '');
}

/** Mensajes-guía derivados (NO persistidos): apertura + prompt de pregunta / listo / faltantes. */
export function guideMessages(review: InitiativeReview, agenda: Agenda): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  const hasUserTurns = (review.chatEvents ?? []).some((e) => e.role === 'user');

  if (!hasUserTurns) {
    const missingLine = agenda.missing.length ? ` Antes de confirmar la ruta me falta saber: ${agenda.missing.join(', ')}.` : '';
    msgs.push({ id: 'guide-opening', role: 'assistant', content: `Revisé tu propuesta.${missingLine} Puedes responder las preguntas, agregar contexto o preguntarme una duda.` });
    // F6: distinción contexto-del-análisis vs contexto-de-empresa (solo si hay empresa seleccionada).
    if (review.companyContext?.companyId) {
      msgs.push({
        id: 'guide-company-context',
        role: 'assistant',
        content:
          'Ojo: lo que agregues aquí ajusta solo este análisis. Para actualizar el contexto de tu empresa de forma permanente, usa "Completar contexto de empresa" en el panel.',
      });
    }
  }

  if (agenda.activeQuestion) {
    msgs.push({
      id: `guide-q-${agenda.activeQuestion.id}`,
      role: 'assistant',
      content: `Pregunta ${agenda.answeredCount + 1} de ${agenda.totalQuestions}: ${agenda.activeQuestion.question}`,
    });
  } else if (agenda.ready) {
    msgs.push({ id: 'guide-ready', role: 'assistant', content: 'Tienes lo necesario para confirmar la ruta. Cuando quieras confírmala, o dime si falta algo.' });
  } else {
    msgs.push({ id: 'guide-gaps', role: 'assistant', content: `Cuando quieras, agrega contexto sobre: ${agenda.missing.join(', ')}. O confirma la ruta y lo resolvemos en el Step 0.` });
  }
  return msgs;
}

/**
 * Compone la conversación visible: historial rehidratado + dudas transitorias (no
 * persistidas) + mensaje-guía actual.
 */
export function composeConversation(review: InitiativeReview, transient: ChatMessage[] = []): ChatMessage[] {
  const agenda = deriveAgenda(review);
  return [...mapEventsToMessages(review.chatEvents), ...transient, ...guideMessages(review, agenda)];
}
