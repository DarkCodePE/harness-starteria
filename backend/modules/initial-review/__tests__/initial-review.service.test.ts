/**
 * initial-review.service.test.ts — IR-B2 (ADR-025).
 *
 * Fija el contrato del service con mocks (sin DB): mapeo canonical↔legacy del tipo de
 * reto, versionado de snapshots, control de propiedad, y el manejo de fallo del generador
 * (la revisión NO queda a medias ni crea iniciativa).
 */
import { describe, it, expect, vi } from 'vitest';
import { InitialReviewService } from '../initial-review.service';
import type { GeneratedReview, InitialReviewGenerator } from '../initial-review.types';

const FIXED_GEN: GeneratedReview = {
  understandingSummary: 'Entiendo tu propuesta.',
  suggestedChallengeType: 'correction', // canónico (inglés)
  challengeTypeReason: 'Reduce una fricción existente.',
  informationReadiness: 'low',
  critique: { solid: 's', weak: 'w', risky: 'r', recommendedAdjustment: 'a', mainRisk: 'mr', missingEvidence: [] },
  strategicQuestions: [
    { id: 'q1', question: '¿Dónde?', options: ['Un área'], allowsUnknown: true, answerType: 'single_choice', status: 'unanswered', shouldCarryToStep0: true },
  ],
  improvedProposal: { suggestedName: 'N', improvedDescription: 'd', initialFocus: 'f', expectedImpact: 'i', nextRecommendedStep: 'Step 0' },
  routePreview: [{ step: 0, name: 'Ordenar contexto', whatWillHappen: 'x', expectedOutput: 'y', status: 'active' }],
};

function fakeGenerator(gen: GeneratedReview | Error = FIXED_GEN): InitialReviewGenerator {
  return { generate: vi.fn(async () => { if (gen instanceof Error) throw gen; return gen; }) };
}

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    initialReview: {
      create: vi.fn(async ({ data }: any) => ({ id: 'rev1', addedContext: null, sourceFileIds: null, challengeId: null, ...data })),
      update: vi.fn(async ({ where, data }: any) => ({ id: where.id, ownerId: 'u1', originalInput: 'x', addedContext: data.addedContext ?? [], sourceFileIds: null, challengeId: null, status: data.status ?? 'generated' })),
      findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, ownerId: 'u1', status: 'generated', originalInput: 'x', addedContext: [], sourceFileIds: [], challengeId: null })),
    },
    initialReviewSnapshot: {
      create: vi.fn(async ({ data }: any) => ({ id: 'snap1', informationReadiness: null, ...data })),
      findFirst: vi.fn(async () => ({ id: 'snap1', version: 1, understandingSummary: 'u', suggestedChallengeType: 'correccion', selectedChallengeType: 'correccion', challengeTypeReason: 'r', informationReadiness: 'low', critique: {}, strategicQuestions: [{ id: 'q1', question: '¿Dónde?', options: [], allowsUnknown: true, answerType: 'single_choice', status: 'unanswered', shouldCarryToStep0: true }], improvedProposal: {}, routePreview: [] })),
      aggregate: vi.fn(async () => ({ _max: { version: 1 } })),
      update: vi.fn(async ({ where, data }: any) => ({ id: where.id, version: 1, understandingSummary: 'u', suggestedChallengeType: 'correccion', selectedChallengeType: 'correccion', challengeTypeReason: 'r', informationReadiness: 'low', critique: {}, strategicQuestions: data.strategicQuestions, improvedProposal: {}, routePreview: [] })),
    },
    // ADR-026 (IRC-01): historial conversacional del asistente.
    initialReviewChatEvent: {
      create: vi.fn(async ({ data }: any) => ({ id: 'evt1', snapshotVersion: null, createdAt: new Date('2026-07-18T00:00:00Z'), ...data })),
      findMany: vi.fn(async () => []),
    },
    ...overrides,
  } as any;
}

describe('InitialReviewService — createReview (IR-B2)', () => {
  it('crea la revisión (processing→generated) + snapshot v1 y mapea el tipo canónico→DB→canónico', async () => {
    const prisma = makePrisma();
    const svc = new InitialReviewService(prisma, fakeGenerator());

    const dto = await svc.createReview('u1', { originalInput: 'Quiero mejorar el proceso de compras.' });

    expect(prisma.initialReview.create.mock.calls[0][0].data.status).toBe('processing');
    // el tipo canónico 'correction' se persiste como 'correccion' (DB español)
    const snapArg = prisma.initialReviewSnapshot.create.mock.calls[0][0].data;
    expect(snapArg.version).toBe(1);
    expect(snapArg.suggestedChallengeType).toBe('correccion');
    expect(snapArg.selectedChallengeType).toBe('correccion');
    expect(snapArg.challengeTypeReason).toBe('Reduce una fricción existente.');
    // review pasa a generated
    expect(prisma.initialReview.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'generated' } }));
    // el DTO expone el tipo canónico (inglés)
    expect(dto.snapshot?.suggestedChallengeType).toBe('correction');
    expect(dto.status).toBe('generated');
  });

  it('si el generador falla, marca la revisión failed y NO filtra el error crudo', async () => {
    const prisma = makePrisma();
    const svc = new InitialReviewService(prisma, fakeGenerator(new Error('LLM down')));

    await expect(svc.createReview('u1', { originalInput: 'algo suficientemente largo' })).rejects.toMatchObject({ code: 'INITIAL_REVIEW_GEN_FAILED' });
    expect(prisma.initialReview.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'failed' } }));
    // no se creó snapshot
    expect(prisma.initialReviewSnapshot.create).not.toHaveBeenCalled();
  });
});

describe('InitialReviewService — ownership + versionado', () => {
  it('getReview: un no-dueño sin rol admin/mentor recibe forbidden', async () => {
    const prisma = makePrisma({ initialReview: { findUnique: vi.fn(async () => ({ id: 'rev1', ownerId: 'other', status: 'generated', originalInput: 'x', addedContext: [] })) } });
    const svc = new InitialReviewService(prisma, fakeGenerator());
    await expect(svc.getReview('rev1', 'u1', 'participante')).rejects.toMatchObject({ code: 'INITIAL_REVIEW_FORBIDDEN' });
  });

  it('getReview: un admin sí puede leer la revisión de otro', async () => {
    const prisma = makePrisma({ initialReview: { findUnique: vi.fn(async () => ({ id: 'rev1', ownerId: 'other', status: 'generated', originalInput: 'x', addedContext: [] })) } });
    const svc = new InitialReviewService(prisma, fakeGenerator());
    const dto = await svc.getReview('rev1', 'admin-user', 'admin');
    expect(dto.id).toBe('rev1');
  });

  it('addContext: crea una NUEVA versión (v2) y marca la revisión updated', async () => {
    const prisma = makePrisma();
    const svc = new InitialReviewService(prisma, fakeGenerator());
    await svc.addContext('rev1', 'u1', 'contexto extra');
    expect(prisma.initialReviewSnapshot.create.mock.calls[0][0].data.version).toBe(2);
    expect(prisma.initialReview.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'updated', addedContext: ['contexto extra'] }) }));
  });

  it('addContext: una revisión ya convertida no admite más contexto (conflict)', async () => {
    const prisma = makePrisma({ initialReview: { findUnique: vi.fn(async () => ({ id: 'rev1', ownerId: 'u1', status: 'converted_to_initiative', originalInput: 'x', addedContext: [] })) } });
    const svc = new InitialReviewService(prisma, fakeGenerator());
    await expect(svc.addContext('rev1', 'u1', 'x')).rejects.toMatchObject({ code: 'INITIAL_REVIEW_ALREADY_CONVERTED' });
  });

  it('saveStrategicAnswers: fusiona respuesta y marca la pregunta answered', async () => {
    const prisma = makePrisma();
    const svc = new InitialReviewService(prisma, fakeGenerator());
    await svc.saveStrategicAnswers('rev1', 'u1', { answers: [{ id: 'q1', answer: 'Un área' }] });
    const merged = prisma.initialReviewSnapshot.update.mock.calls[0][0].data.strategicQuestions;
    expect(merged[0]).toMatchObject({ id: 'q1', answer: 'Un área', status: 'answered' });
  });
});

describe('InitialReviewService — chat events (ADR-026, IRC-01)', () => {
  it('getReview: rehidrata chatEvents en orden cronológico (con desempate por id)', async () => {
    const events = [
      { id: 'e1', reviewId: 'rev1', role: 'assistant', kind: 'guide', payload: { text: 'Hola' }, snapshotVersion: 1, createdAt: new Date('2026-07-18T00:00:00Z') },
      { id: 'e2', reviewId: 'rev1', role: 'user', kind: 'answer', payload: { questionId: 'q1', text: 'Un área' }, snapshotVersion: 1, createdAt: new Date('2026-07-18T00:01:00Z') },
    ];
    const findMany = vi.fn(async () => events);
    const prisma = makePrisma({ initialReviewChatEvent: { create: vi.fn(), findMany } });
    const svc = new InitialReviewService(prisma, fakeGenerator());

    const dto = await svc.getReview('rev1', 'u1', 'participante');

    // se ordena por createdAt asc y luego id asc (determinista ante empates de ms)
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { reviewId: 'rev1' }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }));
    expect(dto.chatEvents).toHaveLength(2);
    expect(dto.chatEvents[0]).toMatchObject({ id: 'e1', role: 'assistant', kind: 'guide', snapshotVersion: 1 });
    // createdAt se serializa a ISO-8601 string
    expect(dto.chatEvents[0].createdAt).toBe('2026-07-18T00:00:00.000Z');
    expect(dto.chatEvents[1]).toMatchObject({ id: 'e2', role: 'user', kind: 'answer' });
  });

  it('getReview: sin eventos, chatEvents es un array vacío (no undefined)', async () => {
    const prisma = makePrisma();
    const svc = new InitialReviewService(prisma, fakeGenerator());
    const dto = await svc.getReview('rev1', 'u1', 'participante');
    expect(dto.chatEvents).toEqual([]);
  });

  it('appendChatEvent: persiste role/kind/payload/snapshotVersion y devuelve el DTO', async () => {
    const create = vi.fn(async ({ data }: any) => ({ id: 'evtX', snapshotVersion: data.snapshotVersion ?? null, createdAt: new Date('2026-07-18T12:00:00Z'), ...data }));
    const prisma = makePrisma({ initialReviewChatEvent: { create, findMany: vi.fn(async () => []) } });
    const svc = new InitialReviewService(prisma, fakeGenerator());

    const dto = await svc.appendChatEvent('rev1', { role: 'user', kind: 'context', payload: { text: 'validamos con el CTO' }, snapshotVersion: 3 });

    expect(create).toHaveBeenCalledWith({ data: { reviewId: 'rev1', role: 'user', kind: 'context', payload: { text: 'validamos con el CTO' }, snapshotVersion: 3 } });
    expect(dto).toMatchObject({ id: 'evtX', role: 'user', kind: 'context', snapshotVersion: 3, createdAt: '2026-07-18T12:00:00.000Z' });
  });

  it('appendChatEvent: acepta un tx externo (misma transacción que el snapshot)', async () => {
    const create = vi.fn(async ({ data }: any) => ({ id: 'evtTx', snapshotVersion: null, createdAt: new Date('2026-07-18T12:00:00Z'), ...data }));
    const prisma = makePrisma();
    const svc = new InitialReviewService(prisma, fakeGenerator());
    const tx = { initialReviewChatEvent: { create } } as any;

    await svc.appendChatEvent('rev1', { role: 'assistant', kind: 'diff_announcement', payload: { changedSections: ['critique'] } }, tx);

    // se escribió en el tx, no en el prisma base
    expect(create).toHaveBeenCalledTimes(1);
    expect(prisma.initialReviewChatEvent.create).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data.snapshotVersion).toBeNull();
  });
});
