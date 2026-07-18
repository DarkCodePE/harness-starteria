import { describe, it, expect } from 'vitest';
import {
  deriveAgenda,
  defaultMode,
  nextAction,
  isUnknownAnswer,
  announceDiff,
  mapEventsToMessages,
  guideMessages,
  composeConversation,
} from '../services/assistantOrchestrator';
import type { InitiativeReview, ChatEvent } from '../services/initiativeReviewClient';

function review(overrides: Partial<InitiativeReview> = {}): InitiativeReview {
  return {
    id: 'rev1',
    status: 'generated',
    originalInput: 'x',
    addedContext: [],
    challengeId: null,
    snapshot: {
      id: 'snap1',
      version: 1,
      understandingSummary: 'La propuesta busca X.',
      suggestedChallengeType: 'growth',
      selectedChallengeType: 'growth',
      challengeTypeReason: 'razón',
      informationReadiness: 'low',
      critique: { solid: 's', weak: 'w', risky: 'r', recommendedAdjustment: 'a' },
      strategicQuestions: [
        { id: 'q1', question: '¿Qué acción inmediata?', options: [], allowsUnknown: true, status: 'unanswered' },
        { id: 'q2', question: '¿Tu equipo tiene disponibilidad?', options: [], allowsUnknown: true, status: 'unanswered' },
      ],
      improvedProposal: { suggestedName: 'N', improvedDescription: 'd', initialFocus: 'f', expectedImpact: 'i', nextRecommendedStep: 'Step 0' },
      routePreview: [{ step: 0, name: 'Ordenar contexto', whatWillHappen: 'x', expectedOutput: 'y', status: 'active' }],
    },
    ...overrides,
  };
}

describe('deriveAgenda (IRC-04)', () => {
  it('marca la primera pregunta pendiente como activa y cuenta faltantes del PRD', () => {
    const a = deriveAgenda(review());
    expect(a.activeQuestion?.id).toBe('q1');
    expect(a.pendingCount).toBe(2);
    expect(a.answeredCount).toBe(0);
    expect(a.missing).toEqual(['aprobaciones internas', 'recursos disponibles', 'criterios de escalamiento']);
    expect(a.ready).toBe(false);
  });

  it('con readiness high no hay faltantes; con todas respondidas queda ready', () => {
    const r = review();
    r.snapshot!.informationReadiness = 'high';
    r.snapshot!.strategicQuestions = r.snapshot!.strategicQuestions.map((q) => ({ ...q, status: 'answered' }));
    const a = deriveAgenda(r);
    expect(a.missing).toEqual([]);
    expect(a.activeQuestion).toBeNull();
    expect(a.ready).toBe(true);
  });

  it('salta preguntas ya respondidas/unknown al elegir la activa', () => {
    const r = review();
    r.snapshot!.strategicQuestions[0].status = 'answered';
    expect(deriveAgenda(r).activeQuestion?.id).toBe('q2');
  });
});

describe('defaultMode + nextAction (IRC-04: transición por modo)', () => {
  it('defaultMode es answer con pregunta activa, context sin ella', () => {
    expect(defaultMode(deriveAgenda(review()))).toBe('answer');
    const r = review();
    r.snapshot!.strategicQuestions = [];
    expect(defaultMode(deriveAgenda(r))).toBe('context');
  });

  it('modo answer con pregunta activa → acción answer con questionId', () => {
    const a = deriveAgenda(review());
    expect(nextAction('answer', a, 'Reducir incertidumbre técnica')).toEqual({ type: 'answer', questionId: 'q1', answer: 'Reducir incertidumbre técnica' });
  });

  it('modo answer + "no lo sé" (allowsUnknown) → acción answer_unknown', () => {
    const a = deriveAgenda(review());
    expect(nextAction('answer', a, 'no lo sé aún')).toEqual({ type: 'answer_unknown', questionId: 'q1' });
  });

  it('modo context → acción context; modo answer sin pregunta activa cae a context', () => {
    const a = deriveAgenda(review());
    expect(nextAction('context', a, 'Tenemos 2 devs')).toEqual({ type: 'context', text: 'Tenemos 2 devs' });
    const r = review();
    r.snapshot!.strategicQuestions = [];
    const empty = deriveAgenda(r);
    expect(nextAction('answer', empty, 'algo')).toEqual({ type: 'context', text: 'algo' });
  });

  it('modo doubt → acción doubt con respuesta del catálogo (o fallback)', () => {
    const a = deriveAgenda(review());
    const known = nextAction('doubt', a, '¿qué significa crecimiento?');
    expect(known.type).toBe('doubt');
    expect((known as any).answer).toContain('Crecimiento');
    const unknown = nextAction('doubt', a, 'xyzzy?');
    expect((unknown as any).answer).toMatch(/No tengo una respuesta directa/);
  });
});

describe('isUnknownAnswer', () => {
  it('reconoce variantes de "no lo sé" y no confunde respuestas reales', () => {
    expect(isUnknownAnswer('no lo sé')).toBe(true);
    expect(isUnknownAnswer('No lo se aun')).toBe(true);
    expect(isUnknownAnswer('ns')).toBe(true);
    expect(isUnknownAnswer('Tenemos un plan claro')).toBe(false);
  });
});

describe('announceDiff (IRC-04/05)', () => {
  it('lista vacía → mensaje "se mantiene igual"', () => {
    expect(announceDiff([])).toMatch(/se mantiene igual/);
  });
  it('una sección → menciona su etiqueta', () => {
    expect(announceDiff(['critique'])).toContain('Mirada crítica');
  });
  it('varias secciones → une con "y"', () => {
    const msg = announceDiff(['critique', 'improvedProposal']);
    expect(msg).toContain('Mirada crítica y Versión mejorada');
  });
});

describe('mapEventsToMessages + rehidratación (IRC-04)', () => {
  const events: ChatEvent[] = [
    { id: 'e1', role: 'user', kind: 'answer', payload: { questionId: 'q1', answer: 'Reducir riesgo' }, snapshotVersion: 1, createdAt: '2026-07-18T00:00:00Z' },
    { id: 'e2', role: 'user', kind: 'context', payload: { text: 'LLM on-premise' }, snapshotVersion: 2, createdAt: '2026-07-18T00:01:00Z' },
    { id: 'e3', role: 'assistant', kind: 'diff_announcement', payload: { changedSections: ['critique'] }, snapshotVersion: 2, createdAt: '2026-07-18T00:01:01Z' },
    { id: 'e4', role: 'user', kind: 'answer', payload: { questionId: 'q2', unknown: true, answer: null }, snapshotVersion: 2, createdAt: '2026-07-18T00:02:00Z' },
  ];

  it('convierte cada evento persistido a su mensaje, con el anuncio de diff renderizado', () => {
    const msgs = mapEventsToMessages(events);
    expect(msgs).toHaveLength(4);
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'Reducir riesgo' });
    expect(msgs[1]).toMatchObject({ role: 'user', content: 'LLM on-premise' });
    expect(msgs[2].role).toBe('assistant');
    expect(msgs[2].content).toContain('Mirada crítica');
    expect(msgs[3]).toMatchObject({ role: 'user', content: 'No lo sé aún.' });
  });

  it('composeConversation antepone historial y añade el guía actual; sin historial muestra apertura', () => {
    const withHistory = composeConversation(review({ chatEvents: events }));
    // el primer mensaje viene del historial, no la apertura
    expect(withHistory[0]).toMatchObject({ role: 'user', content: 'Reducir riesgo' });

    const fresh = composeConversation(review());
    expect(fresh[0].id).toBe('guide-opening');
    expect(String(fresh[0].content)).toContain('Antes de confirmar la ruta me falta saber');
  });
});

describe('guideMessages (IRC-04)', () => {
  it('con pregunta activa muestra el prompt numerado', () => {
    const r = review();
    const msgs = guideMessages(r, deriveAgenda(r));
    const q = msgs.find((m) => m.id.startsWith('guide-q-'));
    expect(String(q?.content)).toContain('Pregunta 1 de 2');
  });

  it('ready → mensaje de confirmar; no-ready sin pregunta → sugiere faltantes', () => {
    const ready = review();
    ready.snapshot!.informationReadiness = 'high';
    ready.snapshot!.strategicQuestions = ready.snapshot!.strategicQuestions.map((q) => ({ ...q, status: 'answered' }));
    expect(guideMessages(ready, deriveAgenda(ready)).some((m) => m.id === 'guide-ready')).toBe(true);

    const gaps = review();
    gaps.snapshot!.strategicQuestions = gaps.snapshot!.strategicQuestions.map((q) => ({ ...q, status: 'answered' }));
    expect(guideMessages(gaps, deriveAgenda(gaps)).some((m) => m.id === 'guide-gaps')).toBe(true);
  });
});
