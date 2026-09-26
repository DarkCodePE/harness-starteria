import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { can, type Permission } from '../../shared/authz/permissions';
import { ScopedPortfolioAccessService } from '../../shared/authz/scoped-portfolio-access.service';
import type { StrategicFramingChallengeCandidate, StrategicFramingPrioritizationState } from './strategic-framing.types';

type Db = any;
type PromotionActor = { id: string; roles: readonly string[]; permissions: ReadonlySet<Permission> };
export type StrategicFramingPromotionInput = {
  stateId: string;
  challengeCandidateId: string;
  expectedVersion: number;
  strategicFrontId: string;
  title: string;
  statement: string;
  type: 'correccion' | 'crecimiento' | 'exploracion';
  objective?: string | null;
  whyNow?: string | null;
  successCriteria?: string | null;
  rationale?: string | null;
  actor: PromotionActor;
};

export class StrategicFramingPromotionService {
  private readonly scopedAccess: ScopedPortfolioAccessService;

  constructor(
    private readonly prisma: PrismaClient,
    scopedAccess?: ScopedPortfolioAccessService,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.scopedAccess = scopedAccess ?? new ScopedPortfolioAccessService(prisma);
  }

  async promote(input: StrategicFramingPromotionInput): Promise<{ promotion: any; challenge: any; retry: boolean }> {
    const normalized = normalizeInput(input);
    try {
      return await (this.prisma as Db).$transaction(async (tx: Db) => this.promoteInTransaction(tx, normalized));
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      return this.recoverUniqueConflict(normalized);
    }
  }

  private async promoteInTransaction(db: Db, input: NormalizedPromotionInput): Promise<{ promotion: any; challenge: any; retry: boolean }> {
    const state = await db.strategicFramingProvisionalState.findUnique({ where: { id: input.stateId } });
    if (!state) throw AppError.notFound('Estado provisional de Strategic Framing', 'STATE_NOT_FOUND');

    await this.assertAuthority(input.actor, state.organizationId);

    const existing = await db.strategicFramingPromotion.findUnique({
      where: { stateId_challengeCandidateId: { stateId: input.stateId, challengeCandidateId: input.challengeCandidateId } },
    });
    if (existing) return this.resolveExisting(existing, input);

    if (state.version !== input.expectedVersion) throw AppError.conflict('El estado de Strategic Framing está desactualizado.', 'STALE_STATE');
    const candidate = findCandidate(state.challengeStructuringState, input.challengeCandidateId);
    if (!candidate) throw AppError.notFound('ChallengeCandidate', 'CANDIDATE_NOT_FOUND');
    const prioritization = normalizePrioritizationState(state.prioritizationState);
    const sourceCandidates = validateCandidateEligibility(candidate, prioritization);
    const front = await db.strategicFront.findUnique({ where: { id: input.strategicFrontId } });
    if (!front) throw AppError.notFound('Strategic Front', 'FRONT_NOT_FOUND');
    assertFrontScope(state.organizationId, front.organizationId);

    const fingerprint = fingerprintFor(input, state.version, candidate);
    const challenge = await db.challenge.create({
      data: {
        strategicFrontId: input.strategicFrontId,
        title: input.title,
        description: input.statement,
        type: input.type,
        status: 'draft',
        ...(input.objective ? { objective: input.objective } : {}),
        ...(input.whyNow ? { whyNow: input.whyNow } : {}),
        ...(input.successCriteria ? { successCriteria: input.successCriteria } : {}),
      },
    });
    const promotedAt = this.now();
    const promotion = await db.strategicFramingPromotion.create({
      data: {
        stateId: input.stateId,
        challengeCandidateId: input.challengeCandidateId,
        sourceStateVersion: state.version,
        sourceCandidateIds: candidate.sourceCandidateIds,
        structuralRecommendationRef: candidate.structuralRecommendationRef,
        structuralRecommendationVersion: candidate.structuralRecommendationVersion,
        strategicFrontId: input.strategicFrontId,
        challengeId: challenge.id,
        actorUserId: input.actor.id,
        actorSnapshot: { userId: input.actor.id, effectiveRoles: [...input.actor.roles] },
        promotedAt,
        candidateSnapshot: {
          ...candidate,
          sourceCandidates,
          stateId: state.id,
          sourceStateVersion: state.version,
        },
        confirmedChallengeSnapshot: {
          stateId: input.stateId,
          challengeCandidateId: input.challengeCandidateId,
          sourceStateVersion: state.version,
          strategicFrontId: input.strategicFrontId,
          title: input.title,
          statement: input.statement,
          type: input.type,
          objective: input.objective,
          whyNow: input.whyNow,
          successCriteria: input.successCriteria,
          rationale: input.rationale,
          structuralRecommendationRef: candidate.structuralRecommendationRef,
          structuralRecommendationVersion: candidate.structuralRecommendationVersion,
          actorUserId: input.actor.id,
          fingerprint,
        },
        sourceRefs: uniqueStrings([
          ...stringArray(state.sourceRefs),
          ...sourceCandidates.flatMap((source) => source.sourceRefs),
        ]),
        provenance: {
          kind: 'human_confirmed_promotion',
          stateId: state.id,
          challengeCandidateId: candidate.challengeCandidateId,
          sourceStateVersion: state.version,
        },
        status: 'completed',
      },
    });
    return { promotion, challenge, retry: false };
  }

  private async assertAuthority(actor: PromotionActor, organizationId: string | null): Promise<void> {
    if (!can(actor.permissions, 'portfolio:write') || !actor.roles.includes('portfolio_lead') || !organizationId) {
      throw AppError.forbidden('La promoción requiere autoridad de Portfolio Lead con alcance organizacional.', 'PROMOTION_FORBIDDEN');
    }
    const allowed = await this.scopedAccess.canUserAccessPortfolio({ userId: actor.id, organizationId, capability: 'portfolio:write' });
    if (!allowed) throw AppError.forbidden('La promoción requiere un grant scoped de portfolio:write.', 'PROMOTION_FORBIDDEN');
  }

  private async resolveExisting(existing: any, input: NormalizedPromotionInput): Promise<{ promotion: any; challenge: any; retry: boolean }> {
    const snapshot = existing.confirmedChallengeSnapshot as ConfirmedSnapshot;
    if (!snapshot || snapshot.fingerprint !== fingerprintForStored(input, snapshot)) {
      throw AppError.conflict('Ya existe una promoción distinta para este ChallengeCandidate.', 'PROMOTION_CONFLICT');
    }
    const challenge = await (this.prisma as Db).challenge.findUnique({ where: { id: existing.challengeId } });
    return { promotion: existing, challenge, retry: true };
  }

  private async recoverUniqueConflict(input: NormalizedPromotionInput): Promise<{ promotion: any; challenge: any; retry: boolean }> {
    const promotion = await (this.prisma as Db).strategicFramingPromotion.findUnique({
      where: { stateId_challengeCandidateId: { stateId: input.stateId, challengeCandidateId: input.challengeCandidateId } },
    });
    if (!promotion) throw AppError.conflict('La promoción ya existe y no pudo clasificarse de forma segura.', 'PROMOTION_ALREADY_EXISTS');
    const state = await (this.prisma as Db).strategicFramingProvisionalState.findUnique({ where: { id: input.stateId }, select: { organizationId: true } });
    if (!state) throw AppError.notFound('Estado provisional de Strategic Framing', 'STATE_NOT_FOUND');
    await this.assertAuthority(input.actor, state.organizationId);
    return this.resolveExisting(promotion, input);
  }
}

type NormalizedPromotionInput = Omit<StrategicFramingPromotionInput, 'actor'> & { actor: PromotionActor };
type ConfirmedSnapshot = Partial<NormalizedPromotionInput> & { fingerprint: string; sourceStateVersion: number; structuralRecommendationRef?: string | null; structuralRecommendationVersion?: string | null };

function normalizeInput(input: StrategicFramingPromotionInput): NormalizedPromotionInput {
  if (!input.stateId?.trim() || !input.challengeCandidateId?.trim() || !input.strategicFrontId?.trim() || !input.title?.trim() || !input.statement?.trim() || !['correccion', 'crecimiento', 'exploracion'].includes(input.type)) {
    throw AppError.badRequest('El payload de promoción no es válido.', 'INVALID_PROMOTION_PAYLOAD');
  }
  return {
    ...input,
    challengeCandidateId: input.challengeCandidateId.trim(),
    stateId: input.stateId.trim(),
    strategicFrontId: input.strategicFrontId.trim(),
    title: input.title.trim(),
    statement: input.statement.trim(),
    objective: normalizeOptional(input.objective),
    whyNow: normalizeOptional(input.whyNow),
    successCriteria: normalizeOptional(input.successCriteria),
    rationale: normalizeOptional(input.rationale),
  };
}

function normalizeOptional(value: string | null | undefined): string | null { return value == null ? null : value.trim() || null; }
function findCandidate(value: unknown, id: string): StrategicFramingChallengeCandidate | null {
  if (!value || typeof value !== 'object') return null;
  const structuring = value as { schemaVersion?: unknown; nonCanonical?: unknown; candidates?: unknown };
  if (structuring.schemaVersion !== 1 || structuring.nonCanonical !== true) return null;
  const candidates = structuring.candidates;
  if (!Array.isArray(candidates)) return null;
  return (candidates.find((candidate) => candidate && typeof candidate === 'object' && (candidate as any).challengeCandidateId === id) as StrategicFramingChallengeCandidate | undefined) ?? null;
}
function validateCandidateEligibility(candidate: StrategicFramingChallengeCandidate, state: StrategicFramingPrioritizationState): any[] {
  if (!candidate.challengeCandidateId || !candidate.confirmedByUserId || !candidate.confirmedAt) notEligible();
  if (candidate.structureKind !== 'lightweight_challenge' && candidate.structureKind !== 'one_challenge' && candidate.structureKind !== 'multiple_challenges') notEligible();
  if (!Array.isArray(candidate.sourceCandidateIds) || candidate.sourceCandidateIds.length === 0 || new Set(candidate.sourceCandidateIds).size !== candidate.sourceCandidateIds.length) notEligible();
  const byId = new Map(state.candidates.map((source) => [source.candidateId, source]));
  const sources = candidate.sourceCandidateIds.map((id) => byId.get(id));
  if (sources.some((source) => !source)) notEligible();
  const resolved = sources as any[];
  if (resolved.some((source) => source.kind !== 'gap' && source.kind !== 'opportunity' || source.humanDisposition !== 'address_now' || !source.humanDecision)) notEligible();
  return resolved;
}
function notEligible(): never { throw AppError.conflict('El ChallengeCandidate no cumple los requisitos de promoción.', 'PROMOTION_NOT_ELIGIBLE'); }
function normalizePrioritizationState(value: unknown): StrategicFramingPrioritizationState { const v = value as any; return v && Array.isArray(v.candidates) ? v : { schemaVersion: 1, nonCanonical: true, focusSlots: null, focusRationale: null, candidates: [] }; }
function assertFrontScope(stateOrganizationId: string | null, frontOrganizationId: string | null): void { if (!stateOrganizationId || !frontOrganizationId || stateOrganizationId !== frontOrganizationId) throw AppError.conflict('El Strategic Front no pertenece al alcance organizacional del estado.', 'FRONT_SCOPE_MISMATCH'); }
function fingerprintFor(input: NormalizedPromotionInput, sourceStateVersion: number, candidate: StrategicFramingChallengeCandidate): string { return hash({ stateId: input.stateId, challengeCandidateId: input.challengeCandidateId, sourceStateVersion, strategicFrontId: input.strategicFrontId, title: input.title, statement: input.statement, type: input.type, objective: input.objective, whyNow: input.whyNow, successCriteria: input.successCriteria, rationale: input.rationale, structuralRecommendationRef: candidate.structuralRecommendationRef, structuralRecommendationVersion: candidate.structuralRecommendationVersion }); }
function fingerprintForStored(input: NormalizedPromotionInput, snapshot: ConfirmedSnapshot): string { return hash({ stateId: input.stateId, challengeCandidateId: input.challengeCandidateId, sourceStateVersion: snapshot.sourceStateVersion, strategicFrontId: input.strategicFrontId, title: input.title, statement: input.statement, type: input.type, objective: input.objective, whyNow: input.whyNow, successCriteria: input.successCriteria, rationale: input.rationale, structuralRecommendationRef: snapshot.structuralRecommendationRef ?? null, structuralRecommendationVersion: snapshot.structuralRecommendationVersion ?? null }); }
function hash(value: unknown): string { return createHash('sha256').update(stableJson(value)).digest('hex'); }
function stableJson(value: any): string { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`; return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`; }
function uniqueStrings(values: unknown[]): string[] { return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim()))].sort(); }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function isUniqueConstraintError(error: unknown): boolean { return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002'); }
