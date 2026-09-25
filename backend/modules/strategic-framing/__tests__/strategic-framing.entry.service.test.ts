import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/AppError';
import { StrategicFramingEntryService } from '../strategic-framing.entry.service';

const permissions = new Set(['portfolio:read', 'portfolio:write']) as any;
const actor = { id: 'user-1', organizationId: 'org-1' };
const state = { id: 'state-1', version: 1, createdAt: '2026-09-25T10:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' } as any;

function snapshot(sourceMode: 'public_entry' | 'enterprise_direct' | 'existing_portfolio' = 'enterprise_direct', overrides: Record<string, unknown> = {}) {
  return {
    context: { userId: actor.id, organizationId: actor.organizationId, sourceMode },
    anchor: { intendedMovement: 'Mover margen', parentContext: { status: 'unresolved', sourceRefs: [] }, provenance: [{ sourceRef: 'source:1', kind: 'user_declared' }], signal: null, ...overrides },
    scopeAssessment: { level: 'unresolved', confidence: 'unknown', rationale: [], provenance: [], canonicalized: false },
    existingWork: [], framingSignals: { observations: [], drivers: [], gaps: [], opportunities: [] },
    sufficiency: { status: 'insufficient', blockers: [], softGaps: [], optionalContext: [] },
    nextBestAction: { kind: 'clarify_anchor', reason: 'review' }, generatedAt: '2026-09-25T10:00:00.000Z',
  } as any;
}

function bootstrap(homeState: 'HOME_D' | 'HOME_E' | null = 'HOME_D') {
  return {
    bootstrapSession: { id: 'bootstrap-1', userId: actor.id, organizationId: actor.organizationId, sourceContinuationId: 'continuation-1' },
    anchor: { id: 'anchor-1', status: 'anchor_confirmed', outcomeStatement: 'Mover margen', contextSummary: 'Clientes', decisionToEnable: null, businessSignalStatus: 'proxy', businessSignalValue: 'retención', sourceRefs: ['anchor:1'], provenanceStatus: 'user_confirmed' },
    workItems: [{ id: 'work-1', rawLabel: 'Trabajo', proposedName: 'Trabajo', proposedPurpose: null, currentStateHint: 'active', ownerCandidate: 'Ana', sourceRefs: ['work:1'] }],
    strategicConnections: [], advancementConditions: [], proposedMutations: [],
    latestReading: homeState ? { homeState } : null,
  } as any;
}

describe('SF-3D entry adapters', () => {
  let prisma: any;
  let readService: any;
  let provisional: any;
  let bootstrapService: any;
  let service: StrategicFramingEntryService;

  beforeEach(() => {
    prisma = {
      strategicFramingProvisionalState: { findUnique: vi.fn().mockResolvedValue(null) },
      strategicFront: { findUnique: vi.fn() },
      challenge: { findUnique: vi.fn() },
      initiativePortfolioMeta: { findFirst: vi.fn() },
    };
    readService = { compose: vi.fn((input: any) => snapshot(input.context.sourceMode)) };
    provisional = { initializeFromReadSnapshot: vi.fn().mockResolvedValue(state) };
    bootstrapService = { getSession: vi.fn().mockResolvedValue(bootstrap()) };
    service = new StrategicFramingEntryService(prisma, readService, provisional, bootstrapService);
  });

  it('creates from an eligible Bootstrap first reading and preserves source evidence and owner candidate as evidence', async () => {
    const result = await service.createOrReuse({ source: { sourceMode: 'public_entry', bootstrapSessionId: 'bootstrap-1' }, actor, permissions });
    expect(result.sourceMode).toBe('public_entry');
    expect(result.workspacePath).toBe('/portfolio/framing/state-1');
    expect(readService.compose).toHaveBeenCalledWith(expect.objectContaining({ context: expect.objectContaining({ bootstrapSessionId: 'bootstrap-1', sourceContinuationId: 'continuation-1' }) }));
    expect(provisional.initializeFromReadSnapshot).toHaveBeenCalledWith(expect.objectContaining({ logicalContextKey: 'bootstrap:bootstrap-1' }));
    expect((readService.compose.mock.calls[0][0].workItems[0] as any).ownerCandidate).toBe('Ana');
    expect((readService.compose.mock.calls[0][0].workItems[0] as any).sourceRefs).toEqual(['work:1']);
  });

  it('reuses the same Bootstrap session and preserves foreign-session denial', async () => {
    prisma.strategicFramingProvisionalState.findUnique.mockResolvedValue({ id: 'existing' });
    const result = await service.createOrReuse({ source: { sourceMode: 'public_entry', bootstrapSessionId: 'bootstrap-1' }, actor, permissions });
    expect(result.reused).toBe(true);
    bootstrapService.getSession.mockRejectedValueOnce(AppError.forbidden('No autorizado.', 'PORTFOLIO_BOOTSTRAP_FORBIDDEN'));
    await expect(service.createOrReuse({ source: { sourceMode: 'public_entry', bootstrapSessionId: 'foreign' }, actor, permissions })).rejects.toMatchObject({ code: 'PORTFOLIO_BOOTSTRAP_FORBIDDEN' });
  });

  it('blocks Bootstrap before HOME_D/HOME_E first reading', async () => {
    bootstrapService.getSession.mockResolvedValueOnce(bootstrap(null));
    await expect(service.createOrReuse({ source: { sourceMode: 'public_entry', bootstrapSessionId: 'bootstrap-1' }, actor, permissions })).rejects.toMatchObject({ code: 'SF3D_BOOTSTRAP_FIRST_READING_REQUIRED' });
    expect(provisional.initializeFromReadSnapshot).not.toHaveBeenCalled();
  });

  it('creates direct framing with user-declared provenance and keeps insufficient context provisional', async () => {
    await service.createOrReuse({ source: { sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' }, actor, permissions, idempotencyKey: 'direct-1' });
    const input = readService.compose.mock.calls[0][0];
    expect(input.context.sourceMode).toBe('enterprise_direct');
    expect(input.anchor.provenanceStatus).toBe('user_declared');
    expect(input.anchor.status).toBe('anchor_provisional');
    expect(input.canonicalContext).toBeUndefined();
  });

  it('reuses the same direct Idempotency-Key and differentiates a deliberately new key', async () => {
    prisma.strategicFramingProvisionalState.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'existing' }).mockResolvedValueOnce(null);
    await service.createOrReuse({ source: { sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' }, actor, permissions, idempotencyKey: 'same' });
    const reused = await service.createOrReuse({ source: { sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' }, actor, permissions, idempotencyKey: 'same' });
    const fresh = await service.createOrReuse({ source: { sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' }, actor, permissions, idempotencyKey: 'new' });
    expect(reused.reused).toBe(true);
    expect(fresh.reused).toBe(false);
    expect(provisional.initializeFromReadSnapshot.mock.calls[0][0].logicalContextKey).toBe('direct:same');
    expect(provisional.initializeFromReadSnapshot.mock.calls[2][0].logicalContextKey).toBe('direct:new');
  });

  it('does not force Front or Challenge classification for direct input', async () => {
    await service.createOrReuse({ source: { sourceMode: 'enterprise_direct', intendedMovement: 'Resolver un bloqueo' }, actor, permissions, idempotencyKey: 'direct-2' });
    expect(readService.compose.mock.calls[0][0].canonicalContext).toBeUndefined();
  });

  it('reads Strategic Front evidence without canonical mutation', async () => {
    prisma.strategicFront.findUnique.mockResolvedValue({ id: 'front-1', organizationId: 'org-1', name: 'Growth', strategicObjective: 'Mover margen', description: 'Clientes', whyNow: null, mainKpi: 'retención' });
    await service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: 'front-1' }, actor, permissions });
    expect(readService.compose.mock.calls[0][0].canonicalContext).toMatchObject({ strategicFrontId: 'front-1' });
    expect(prisma.strategicFront.findUnique).toHaveBeenCalled();
    expect(prisma.strategicFront).not.toHaveProperty('update');
  });

  it('reads Challenge with its real parent Front', async () => {
    prisma.challenge.findUnique.mockResolvedValue({ id: 'challenge-1', title: 'Bloqueo', whatWeWantToMove: 'Reducir fricción', strategicFront: { id: 'front-1', name: 'Growth', organizationId: 'org-1' } });
    await service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'challenge', sourceId: 'challenge-1' }, actor, permissions });
    expect(readService.compose.mock.calls[0][0].canonicalContext).toMatchObject({ challengeId: 'challenge-1', strategicFrontId: 'front-1' });
  });

  it('reads Initiative through a real InitiativePortfolioMeta → Challenge → Front chain', async () => {
    prisma.initiativePortfolioMeta.findFirst.mockResolvedValue({ id: 'meta-1', projectId: 'project-1', status: 'en_step_0', project: { name: 'Entrega', description: 'Intervención' }, challenge: { id: 'challenge-1', strategicFront: { id: 'front-1', name: 'Growth', organizationId: 'org-1' } } });
    await service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'initiative', sourceId: 'project-1' }, actor, permissions });
    expect(readService.compose.mock.calls[0][0].canonicalContext).toMatchObject({ initiativeId: 'project-1', challengeId: 'challenge-1', strategicFrontId: 'front-1' });
  });

  it('denies cross-organization sources and nonexistent sources', async () => {
    prisma.strategicFront.findUnique.mockResolvedValue({ id: 'front-1', organizationId: 'org-other', name: 'Other' });
    await expect(service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: 'front-1' }, actor, permissions })).rejects.toMatchObject({ code: 'SF3D_SOURCE_FORBIDDEN' });
    prisma.strategicFront.findUnique.mockResolvedValueOnce(null);
    await expect(service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: 'missing' }, actor, permissions })).rejects.toMatchObject({ code: 'SF3D_SOURCE_NOT_FOUND' });
  });

  it('does not silently link an independent Initiative', async () => {
    prisma.initiativePortfolioMeta.findFirst.mockResolvedValue({ id: 'meta-1', projectId: 'project-1', challenge: null, project: { name: 'Independiente' } });
    await expect(service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'initiative', sourceId: 'project-1' }, actor, permissions })).rejects.toMatchObject({ code: 'SF3D_INDEPENDENT_INITIATIVE_UNSUPPORTED' });
    expect(provisional.initializeFromReadSnapshot).not.toHaveBeenCalled();
  });

  it('reuses the same Existing Portfolio source identity', async () => {
    prisma.strategicFramingProvisionalState.findUnique.mockResolvedValue({ id: 'existing' });
    prisma.strategicFront.findUnique.mockResolvedValue({ id: 'front-1', organizationId: 'org-1', name: 'Growth' });
    const result = await service.createOrReuse({ source: { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: 'front-1' }, actor, permissions });
    expect(result.reused).toBe(true);
    expect(provisional.initializeFromReadSnapshot).toHaveBeenCalledWith(expect.objectContaining({ logicalContextKey: 'existing_portfolio:strategic_front:front-1' }));
  });
});
