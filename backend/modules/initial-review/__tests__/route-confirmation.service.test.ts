/**
 * route-confirmation.service.test.ts — IR-B4 (ADR-025, RB-IR-017/018).
 *
 * Fija la lógica de confirm-route con mocks: idempotencia, reuso de createProject sin
 * modificarlo, finalización atómica y liberación del claim ante fallo de creación.
 */
import { describe, it, expect, vi } from 'vitest';
import { RouteConfirmationService } from '../route-confirmation.service';

const SNAPSHOT = {
  id: 'snap1',
  version: 1,
  selectedChallengeType: 'correccion',
  understandingSummary: 'contexto',
  informationReadiness: 'low',
  improvedProposal: { suggestedName: 'Mi iniciativa', improvedDescription: 'desc', initialFocus: 'f', expectedImpact: 'i', nextRecommendedStep: 'Step 0' },
  strategicQuestions: [{ id: 'q1', status: 'unanswered' }],
  critique: { mainRisk: 'riesgo' },
};

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    initialReview: {
      findUnique: vi.fn(async () => ({ id: 'rev1', ownerId: 'u1', status: 'generated', challengeId: null })),
      update: vi.fn(async () => ({})),
    },
    initialReviewSnapshot: { findFirst: vi.fn(async () => SNAPSHOT) },
    routeConfirmation: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => ({ id: 'rc1', ...data })),
      update: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
    project: { update: vi.fn(async () => ({})) },
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    ...overrides,
  } as any;
}

function fakeProjects(createImpl?: any) {
  return { createProject: vi.fn(createImpl ?? (async () => ({ id: 'proj1' }))) } as any;
}

describe('RouteConfirmationService.confirmRoute (IR-B4)', () => {
  it('crea la iniciativa (reusa createProject) y finaliza confirmación + review + prefill', async () => {
    const prisma = makePrisma();
    const projects = fakeProjects();
    const svc = new RouteConfirmationService(prisma, projects);

    const res = await svc.confirmRoute('rev1', 'u1');

    expect(projects.createProject).toHaveBeenCalledWith('u1', expect.objectContaining({ name: 'Mi iniciativa' }));
    expect(res.initiativeId).toBe('proj1');
    expect(res.overviewUrl).toBe('/initiatives/proj1/overview');
    // finaliza: origin + snapshot + step0Data
    const projUpdate = prisma.project.update.mock.calls[0][0].data;
    expect(projUpdate.origin).toBe('from_initial_review');
    expect(projUpdate.initialReviewSnapshotId).toBe('snap1');
    expect(projUpdate.step0Data.suggestedName).toBe('Mi iniciativa');
    expect(projUpdate.step0Data.challengeType).toBe('correction'); // canónico
    expect(prisma.routeConfirmation.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ createdProjectId: 'proj1', status: 'initiative_created' }) }));
    expect(prisma.initialReview.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'converted_to_initiative' } }));
  });

  it('es IDEMPOTENTE: si ya hay Project, devuelve el mismo y NO llama createProject (RB-IR-018)', async () => {
    const prisma = makePrisma({ routeConfirmation: { findUnique: vi.fn(async () => ({ id: 'rc1', createdProjectId: 'projX' })) } });
    const projects = fakeProjects();
    const svc = new RouteConfirmationService(prisma, projects);

    const res = await svc.confirmRoute('rev1', 'u1');
    expect(res.initiativeId).toBe('projX');
    expect(projects.createProject).not.toHaveBeenCalled();
  });

  it('rechaza a quien no es el dueño de la revisión', async () => {
    const prisma = makePrisma({ initialReview: { findUnique: vi.fn(async () => ({ id: 'rev1', ownerId: 'other', challengeId: null })) } });
    const svc = new RouteConfirmationService(prisma, fakeProjects());
    await expect(svc.confirmRoute('rev1', 'u1')).rejects.toMatchObject({ code: 'INITIAL_REVIEW_FORBIDDEN' });
  });

  it('sin snapshot no hay ruta que confirmar', async () => {
    const prisma = makePrisma({ initialReviewSnapshot: { findFirst: vi.fn(async () => null) } });
    const svc = new RouteConfirmationService(prisma, fakeProjects());
    await expect(svc.confirmRoute('rev1', 'u1')).rejects.toMatchObject({ code: 'NO_SNAPSHOT_TO_CONFIRM' });
  });

  it('si createProject falla, libera el claim (borra la confirmación) para permitir reintento', async () => {
    const prisma = makePrisma();
    const projects = fakeProjects(async () => { throw new Error('db down'); });
    const svc = new RouteConfirmationService(prisma, projects);

    await expect(svc.confirmRoute('rev1', 'u1')).rejects.toMatchObject({ code: 'INITIATIVE_CREATE_FAILED' });
    expect(prisma.routeConfirmation.delete).toHaveBeenCalledWith({ where: { id: 'rc1' } });
  });
});
