import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { can, type Permission } from '../../shared/authz/permissions';
import { PortfolioBootstrapService, type PortfolioBootstrapDto } from '../portfolio-bootstrap/portfolio-bootstrap.service';
import type { StrategicFramingSourceBody } from './strategic-framing.schemas';
import { StrategicFramingReadService } from './strategic-framing.read-service';
import { StrategicFramingProvisionalStateService } from './strategic-framing.provisional-state.service';
import type { StrategicFramingReadInput, StrategicFramingReadModel } from './strategic-framing.types';

type Actor = { id: string; organizationId: string | null };

export type StrategicFramingEntryResult = {
  state: Awaited<ReturnType<StrategicFramingProvisionalStateService['initializeFromReadSnapshot']>>;
  reused: boolean;
  sourceMode: 'public_entry' | 'enterprise_direct' | 'existing_portfolio';
  workspacePath: string;
};

export class StrategicFramingEntryService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly readService = new StrategicFramingReadService(),
    private readonly provisionalStateService = new StrategicFramingProvisionalStateService(prisma),
    private readonly bootstrapService = new PortfolioBootstrapService(prisma),
  ) {}

  async createOrReuse(input: {
    source: StrategicFramingSourceBody;
    actor: Actor;
    permissions: ReadonlySet<Permission>;
    idempotencyKey?: string;
  }): Promise<StrategicFramingEntryResult> {
    this.assertWrite(input.permissions);
    if (input.source.sourceMode === 'public_entry') return this.fromBootstrap(input);
    if (input.source.sourceMode === 'enterprise_direct') return this.fromEnterpriseDirect(input);
    return this.fromExistingPortfolio(input);
  }

  private async fromBootstrap(input: Parameters<StrategicFramingEntryService['createOrReuse']>[0]): Promise<StrategicFramingEntryResult> {
    if (input.source.sourceMode !== 'public_entry') throw new Error('unreachable');
    const bootstrap = await this.bootstrapService.getSession({
      sessionId: input.source.bootstrapSessionId,
      authenticatedUserId: input.actor.id,
      permissions: withRead(input.permissions),
    });
    if (!bootstrap.latestReading || !['HOME_D', 'HOME_E'].includes(bootstrap.latestReading.homeState)) {
      throw AppError.conflict('Bootstrap todavía no tiene una primera lectura gobernada.', 'SF3D_BOOTSTRAP_FIRST_READING_REQUIRED');
    }
    const snapshot = this.readService.compose(bootstrapReadInput(bootstrap, input.actor));
    const reused = await this.exists(input.actor, 'public_entry', `bootstrap:${input.source.bootstrapSessionId}`);
    const state = await this.provisionalStateService.initializeFromReadSnapshot({
      snapshot,
      logicalContextKey: `bootstrap:${input.source.bootstrapSessionId}`,
      actorUserId: input.actor.id,
      organizationId: input.actor.organizationId,
      permissions: withRead(input.permissions),
    });
    return result(state, 'public_entry', reused);
  }

  private async fromEnterpriseDirect(input: Parameters<StrategicFramingEntryService['createOrReuse']>[0]): Promise<StrategicFramingEntryResult> {
    if (input.source.sourceMode !== 'enterprise_direct') throw new Error('unreachable');
    const idempotencyKey = input.idempotencyKey?.trim();
    if (!idempotencyKey) throw AppError.badRequest('Idempotency-Key es obligatorio para iniciar framing directo.', 'SF3D_IDEMPOTENCY_KEY_REQUIRED');
    const sourceRef = `enterprise_direct:${input.actor.id}:${idempotencyKey}`;
    const anchorStatus = input.source.intendedMovement.trim() && (input.source.whyItMatters?.trim() || input.source.movementSignalValue?.trim() || input.source.decisionToEnable?.trim())
      ? 'anchor_sufficient' : 'anchor_provisional';
    const snapshot = this.readService.compose({
      context: { userId: input.actor.id, organizationId: input.actor.organizationId, sourceMode: 'enterprise_direct' },
      anchor: {
        status: anchorStatus,
        outcomeStatement: input.source.intendedMovement,
        contextSummary: input.source.whyItMatters ?? null,
        businessSignalStatus: input.source.movementSignalValue ? 'proxy' : 'unknown',
        businessSignalValue: input.source.movementSignalValue ?? null,
        decisionToEnable: input.source.decisionToEnable ?? null,
        sourceRefs: [sourceRef],
        provenanceStatus: 'user_declared',
      },
    });
    const reused = await this.exists(input.actor, 'enterprise_direct', `direct:${idempotencyKey}`);
    const state = await this.provisionalStateService.initializeFromReadSnapshot({
      snapshot,
      logicalContextKey: `direct:${idempotencyKey}`,
      actorUserId: input.actor.id,
      organizationId: input.actor.organizationId,
      permissions: withRead(input.permissions),
    });
    return result(state, 'enterprise_direct', reused);
  }

  private async fromExistingPortfolio(input: Parameters<StrategicFramingEntryService['createOrReuse']>[0]): Promise<StrategicFramingEntryResult> {
    if (input.source.sourceMode !== 'existing_portfolio') throw new Error('unreachable');
    const source = await this.loadExistingSource(input.source.sourceType, input.source.sourceId, input.actor);
    const snapshot = this.readService.compose(source.readInput);
    const rawKey = `existing_portfolio:${input.source.sourceType}:${input.source.sourceId}`;
    const reused = await this.exists(input.actor, 'existing_portfolio', rawKey);
    const state = await this.provisionalStateService.initializeFromReadSnapshot({
      snapshot,
      logicalContextKey: rawKey,
      actorUserId: input.actor.id,
      organizationId: input.actor.organizationId,
      permissions: withRead(input.permissions),
    });
    return result(state, 'existing_portfolio', reused);
  }

  private async loadExistingSource(sourceType: 'strategic_front' | 'challenge' | 'initiative', sourceId: string, actor: Actor): Promise<{ readInput: StrategicFramingReadInput }> {
    const db = this.prisma as any;
    if (sourceType === 'strategic_front') {
      const front = await db.strategicFront.findUnique({ where: { id: sourceId } });
      if (!front) throw AppError.notFound('Strategic Front', 'SF3D_SOURCE_NOT_FOUND');
      this.assertOrganization(front.organizationId, actor.organizationId);
      return { readInput: frontReadInput(front, actor) };
    }
    if (sourceType === 'challenge') {
      const challenge = await db.challenge.findUnique({ where: { id: sourceId }, include: { strategicFront: true } });
      if (!challenge) throw AppError.notFound('Challenge', 'SF3D_SOURCE_NOT_FOUND');
      this.assertOrganization(challenge.strategicFront?.organizationId, actor.organizationId);
      return { readInput: challengeReadInput(challenge, actor) };
    }
    const meta = await db.initiativePortfolioMeta.findFirst({ where: { OR: [{ id: sourceId }, { projectId: sourceId }] }, include: { project: true, challenge: { include: { strategicFront: true } } } });
    if (!meta) throw AppError.notFound('Initiative Portfolio', 'SF3D_SOURCE_NOT_FOUND');
    if (!meta.challenge?.strategicFront) throw AppError.conflict('La iniciativa no tiene una relación de Portfolio gobernada para reverse alignment.', 'SF3D_INDEPENDENT_INITIATIVE_UNSUPPORTED');
    this.assertOrganization(meta.challenge.strategicFront.organizationId, actor.organizationId);
    return { readInput: initiativeReadInput(meta, actor) };
  }

  private assertOrganization(sourceOrganizationId: string | null | undefined, actorOrganizationId: string | null): void {
    if (!sourceOrganizationId || sourceOrganizationId !== actorOrganizationId) throw AppError.forbidden('No autorizado para revisar este contexto de Portfolio.', 'SF3D_SOURCE_FORBIDDEN');
  }

  private assertWrite(permissions: ReadonlySet<Permission>): void {
    if (!can(permissions, 'portfolio:write')) throw AppError.forbidden('No tienes permiso Portfolio para iniciar framing.', 'SF3D_WRITE_REQUIRED');
  }

  private async exists(actor: Actor, sourceMode: 'public_entry' | 'enterprise_direct' | 'existing_portfolio', rawKey: string): Promise<boolean> {
    const logicalContextKey = `sf3b:${JSON.stringify({ version: 1, sourceMode, organizationId: actor.organizationId ?? null, rawKey })}`;
    const row = await (this.prisma as any).strategicFramingProvisionalState.findUnique({ where: { userId_logicalContextKey: { userId: actor.id, logicalContextKey } }, select: { id: true } });
    return Boolean(row);
  }
}

function withRead(permissions: ReadonlySet<Permission>): Set<Permission> {
  return new Set([...permissions, 'portfolio:read']);
}

function result(state: StrategicFramingEntryResult['state'], sourceMode: StrategicFramingEntryResult['sourceMode'], reused: boolean): StrategicFramingEntryResult {
  return { state, reused, sourceMode, workspacePath: `/portfolio/framing/${encodeURIComponent(state.id)}` };
}

function bootstrapReadInput(bootstrap: PortfolioBootstrapDto, actor: Actor): StrategicFramingReadInput {
  return {
    context: { userId: actor.id, organizationId: actor.organizationId, bootstrapSessionId: bootstrap.bootstrapSession.id, sourceContinuationId: bootstrap.bootstrapSession.sourceContinuationId, sourceMode: 'public_entry' },
    anchor: bootstrap.anchor ? { id: bootstrap.anchor.id, status: bootstrap.anchor.status, outcomeStatement: bootstrap.anchor.outcomeStatement, contextSummary: bootstrap.anchor.contextSummary, decisionToEnable: bootstrap.anchor.decisionToEnable, businessSignalStatus: bootstrap.anchor.businessSignalStatus, businessSignalValue: bootstrap.anchor.businessSignalValue, sourceRefs: bootstrap.anchor.sourceRefs, provenanceStatus: bootstrap.anchor.provenanceStatus } : null,
    workItems: bootstrap.workItems.map((item) => ({ id: item.id, rawLabel: item.rawLabel, proposedName: item.proposedName, proposedPurpose: item.proposedPurpose, currentStateHint: item.currentStateHint, ownerCandidate: item.ownerCandidate, sourceRefs: item.sourceRefs })),
    strategicConnections: bootstrap.strategicConnections.map((item) => ({ workItemId: item.workItemId, status: item.status, provenanceStatus: item.provenanceStatus, sourceRefs: item.sourceRefs, rationale: item.rationale })),
    advancementConditions: bootstrap.advancementConditions.map((item) => ({ id: item.id, type: item.type, status: item.status, statement: item.statement, severity: item.severity, movementAffected: item.movementAffected, provenanceStatus: item.provenanceStatus, sourceRefs: item.sourceRefs })),
    proposedMutations: bootstrap.proposedMutations.map((item) => ({ id: item.id, status: item.status, materiality: item.materiality, uncertainty: item.uncertainty, rationale: item.rationale, sourceRefs: item.sourceRefs })),
    now: () => new Date(),
  };
}

function frontReadInput(front: any, actor: Actor): StrategicFramingReadInput {
  const sourceRef = `strategic_front:${front.id}`;
  return { context: { userId: actor.id, organizationId: actor.organizationId, sourceMode: 'existing_portfolio' }, anchor: { id: front.id, status: front.strategicObjective || front.name ? 'anchor_sufficient' : 'anchor_provisional', outcomeStatement: front.strategicObjective || front.name, contextSummary: front.description || front.whyNow, businessSignalStatus: front.mainKpi ? 'confirmed' : 'unknown', businessSignalValue: front.mainKpi, sourceRefs: [sourceRef], provenanceStatus: 'extracted' }, canonicalContext: { strategicFrontId: front.id, strategicFrontLabel: front.name, sourceRefs: [sourceRef] } };
}

function challengeReadInput(challenge: any, actor: Actor): StrategicFramingReadInput {
  const front = challenge.strategicFront;
  const refs = [`challenge:${challenge.id}`, `strategic_front:${front.id}`];
  return { context: { userId: actor.id, organizationId: actor.organizationId, sourceMode: 'existing_portfolio' }, anchor: { id: challenge.id, status: challenge.whatWeWantToMove || challenge.objective ? 'anchor_sufficient' : 'anchor_provisional', outcomeStatement: challenge.whatWeWantToMove || challenge.objective || challenge.title || challenge.name, contextSummary: challenge.description || challenge.whyNow, decisionToEnable: challenge.successCriteria, sourceRefs: refs, provenanceStatus: 'extracted' }, canonicalContext: { strategicFrontId: front.id, strategicFrontLabel: front.name, challengeId: challenge.id, sourceRefs: refs } };
}

function initiativeReadInput(meta: any, actor: Actor): StrategicFramingReadInput {
  const challenge = meta.challenge;
  const front = challenge.strategicFront;
  const refs = [`initiative_portfolio:${meta.id}`, `project:${meta.projectId}`, `challenge:${challenge.id}`, `strategic_front:${front.id}`];
  return { context: { userId: actor.id, organizationId: actor.organizationId, sourceMode: 'existing_portfolio' }, anchor: { id: meta.id, status: 'anchor_sufficient', outcomeStatement: meta.project?.name ?? 'Iniciativa existente', contextSummary: meta.project?.description, sourceRefs: refs, provenanceStatus: 'extracted' }, workItems: [{ id: meta.projectId, rawLabel: meta.project?.name ?? meta.projectId, proposedName: meta.project?.name, proposedPurpose: meta.project?.description, currentStateHint: meta.status, sourceRefs: refs }], canonicalContext: { strategicFrontId: front.id, strategicFrontLabel: front.name, challengeId: challenge.id, initiativeId: meta.projectId, sourceRefs: refs } };
}
