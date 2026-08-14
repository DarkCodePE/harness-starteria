import type { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import type {
  AttachEvidenceInput,
  CreateAttentionItemInput,
  CreateClaimInput,
  CreateImpactAssertionInput,
  CreateSourceRefInput,
  RecordValidationInput,
  ResolveAttentionItemInput,
  TransitionImpactInput,
} from './truth.schemas';

type Actor = { id: string; role?: string; type?: 'human' | 'ai' | 'system' };

const FINAL_VALIDATION_RESULTS = new Set(['supported', 'contradicted', 'insufficient']);

const CLAIM_STATE_BY_VALIDATION = {
  unvalidated: 'unvalidated',
  supported: 'supported',
  contradicted: 'contradicted',
  insufficient: 'insufficient',
} as const;

const EVIDENCE_STATUS_BY_VALIDATION = {
  supported: 'supports',
  contradicted: 'contradicts',
  insufficient: 'insufficient',
} as const;

export class TruthService {
  constructor(private prisma: PrismaClient) {}

  async createSourceRef(input: CreateSourceRefInput, actor: Actor) {
    return this.prisma.sourceRef.create({
      data: {
        project: input.projectId ? { connect: { id: input.projectId } } : undefined,
        sourceType: input.sourceType,
        reference: input.reference,
        location: input.location,
        originActorId: actor.id,
        originActorType: input.originActorType ?? actor.type ?? 'human',
        contentHash: input.contentHash,
        version: input.version,
        metadataJson: input.metadataJson as Prisma.InputJsonValue,
        capturedAt: input.capturedAt ? new Date(input.capturedAt) : undefined,
      },
    });
  }

  async createClaim(input: CreateClaimInput, actor: Actor) {
    await this.ensureProject(input.projectId);
    if (input.sourceRefIds.length > 0) {
      await this.ensureSourceRefs(input.sourceRefIds, input.projectId);
    }

    return this.prisma.truthClaim.create({
      data: {
        projectId: input.projectId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        claimType: input.claimType,
        statement: input.statement,
        valueJson: input.valueJson === undefined ? undefined : input.valueJson as Prisma.InputJsonValue,
        createdById: actor.id,
        createdByType: input.createdByType,
        verificationState: 'unvalidated',
        sourceRefsJson: input.sourceRefIds as Prisma.InputJsonValue,
        sourceRefLinks: input.sourceRefIds.length > 0
          ? { create: input.sourceRefIds.map((sourceRefId) => ({ sourceRefId })) }
          : undefined,
      },
    });
  }

  async attachEvidence(input: AttachEvidenceInput, actor: Actor) {
    await this.ensureProject(input.projectId);
    await this.ensureSourceRefs([input.sourceRefId], input.projectId);
    if (input.targetClaimId) await this.ensureClaim(input.projectId, input.targetClaimId);

    return this.prisma.evidence.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        type: input.evidenceType,
        url: input.url,
        storageKey: input.storageKey,
        stepRef: input.stepRef,
        moduleRef: input.moduleRef,
        ownerId: actor.id,
        status: 'UPLOADED',
        sourceRefId: input.sourceRefId,
        targetClaimId: input.targetClaimId,
        truthStatus: input.truthStatus,
        capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
        excerpt: input.excerpt,
        provenance: input.provenance as Prisma.InputJsonValue,
        metadataJson: input.metadataJson as Prisma.InputJsonValue,
      },
      include: { sourceRef: true, targetClaim: true },
    });
  }

  async recordValidation(input: RecordValidationInput, actor: Actor) {
    await this.ensureProject(input.projectId);
    const claim = input.claimId ? await this.ensureClaim(input.projectId, input.claimId) : null;
    if (input.sourceRefId) await this.ensureSourceRefs([input.sourceRefId], input.projectId);
    const evidence = input.evidenceId
      ? await this.ensureEvidenceForValidation(input.projectId, input.evidenceId, input.claimId)
      : null;

    if (input.validatorType === 'ai' && FINAL_VALIDATION_RESULTS.has(input.result)) {
      throw AppError.forbidden(
        'La IA no puede cambiar la validacion autorizada de una afirmacion.',
        'AI_CANNOT_VALIDATE_CLAIM',
        { hint: 'Registra el analisis IA como assessment no autoritativo o usa una validacion humana/regla.' },
      );
    }
    if (FINAL_VALIDATION_RESULTS.has(input.result) && input.validatorType !== 'human' && input.validatorType !== 'system_rule') {
      throw AppError.forbidden('ValidatorType no autorizado para validacion final.', 'VALIDATOR_NOT_AUTHORIZED');
    }
    if (input.result === 'supported') {
      this.ensureSupportedValidationInput({ claim, evidence, input });
    }

    const validationSourceRefId = evidence?.sourceRefId ?? input.sourceRefId;
    if (input.sourceRefId && evidence?.sourceRefId && input.sourceRefId !== evidence.sourceRefId) {
      throw AppError.badRequest('La validacion debe usar el SourceRef de la evidencia.', 'VALIDATION_SOURCE_REF_MISMATCH');
    }

    const latest = input.claimId
      ? await this.prisma.truthValidation.findFirst({
          where: { claimId: input.claimId },
          orderBy: { version: 'desc' },
          select: { version: true },
        })
      : null;

    const validation = await this.prisma.truthValidation.create({
      data: {
        projectId: input.projectId,
        claimId: input.claimId,
        evidenceId: input.evidenceId,
        sourceRefId: validationSourceRefId,
        result: input.result,
        validatedById: actor.id,
        validatorType: input.validatorType,
        validatorRole: input.validatorRole ?? actor.role,
        rationale: input.rationale,
        version: latest ? latest.version + 1 : 1,
      },
    });

    if (input.claimId) {
      await this.prisma.truthClaim.update({
        where: { id: input.claimId },
        data: {
          verificationState: CLAIM_STATE_BY_VALIDATION[input.result],
          currentValidationId: validation.id,
        },
      });
    }

    if (input.evidenceId && input.result !== 'unvalidated') {
      await this.prisma.evidence.update({
        where: { id: input.evidenceId },
        data: { truthStatus: EVIDENCE_STATUS_BY_VALIDATION[input.result] },
      });
    }

    return validation;
  }

  async getClaimReadiness(projectId: string, claimId: string) {
    const claim = await this.ensureClaim(projectId, claimId);
    return {
      claimId,
      verificationState: claim.verificationState,
      satisfiesValidatedSupport: claim.verificationState === 'supported',
    };
  }

  async createAttentionItem(input: CreateAttentionItemInput) {
    await this.ensureProject(input.projectId);
    if (input.sourceRefId) await this.ensureSourceRefs([input.sourceRefId], input.projectId);
    return this.prisma.attentionItem.create({
      data: {
        project: { connect: { id: input.projectId } },
        objectType: input.objectType,
        objectId: input.objectId,
        category: input.category,
        reason: input.reason,
        severity: input.severity,
        sourceRef: input.sourceRefId ? { connect: { id: input.sourceRefId } } : undefined,
        ownerId: input.ownerId,
        exitCondition: input.exitCondition,
        nextAction: input.nextAction,
      },
    });
  }

  async listAttentionItems(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.attentionItem.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async resolveAttentionItem(projectId: string, id: string, input: ResolveAttentionItemInput, actor: Actor) {
    const existing = await this.prisma.attentionItem.findFirst({ where: { id, projectId } });
    if (!existing) throw AppError.notFound('Bloqueo', 'ATTENTION_ITEM_NOT_FOUND');
    if (existing.status === 'resolved' || existing.status === 'cancelled') {
      throw AppError.conflict('El bloqueo ya tiene un cierre explicito.', 'ATTENTION_ITEM_ALREADY_CLOSED');
    }
    return this.prisma.attentionItem.update({
      where: { id },
      data: {
        status: input.status,
        resolutionNote: input.resolutionNote,
        resolvedById: actor.id,
        resolvedAt: new Date(),
      },
    });
  }

  async createImpactAssertion(input: CreateImpactAssertionInput, actor: Actor) {
    await this.ensureProject(input.projectId);
    if (input.claimId) await this.ensureClaim(input.projectId, input.claimId);
    if (input.sourceRefId) await this.ensureSourceRefs([input.sourceRefId], input.projectId);
    return this.prisma.impactAssertion.create({
      data: {
        projectId: input.projectId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        claimId: input.claimId,
        metric: input.metric,
        valueJson: input.valueJson === undefined ? undefined : input.valueJson as Prisma.InputJsonValue,
        status: input.status,
        sourceRefId: input.sourceRefId,
        createdById: actor.id,
      },
    });
  }

  async transitionImpact(projectId: string, id: string, input: TransitionImpactInput, actor: Actor) {
    const current = await this.prisma.impactAssertion.findFirst({ where: { id, projectId } });
    if (!current) throw AppError.notFound('Impacto', 'IMPACT_ASSERTION_NOT_FOUND');

    const requestedValidationId = input.validationId ?? current.validationId ?? undefined;
    if (input.status === 'realized') {
      if (current.status !== 'validated') {
        throw AppError.conflict(
          'El impacto no puede pasar directo a realizado sin una transicion validada previa.',
          'IMPACT_REALIZED_REQUIRES_VALIDATED',
        );
      }
      await this.ensureImpactValidation(projectId, current, requestedValidationId);
    }
    if (input.status === 'validated') {
      await this.ensureImpactValidation(projectId, current, input.validationId);
    }

    return this.prisma.impactAssertion.update({
      where: { id },
      data: {
        status: input.status,
        validationId: requestedValidationId,
        transitionedById: actor.id,
        transitionedAt: new Date(),
      },
    });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) throw AppError.notFound('Proyecto', 'PROJECT_NOT_FOUND');
    return project;
  }

  private async ensureClaim(projectId: string, id: string) {
    const claim = await this.prisma.truthClaim.findFirst({ where: { id, projectId } });
    if (!claim) throw AppError.notFound('Claim', 'TRUTH_CLAIM_NOT_FOUND');
    return claim;
  }

  private async ensureEvidence(projectId: string, id: string) {
    const evidence = await this.prisma.evidence.findFirst({ where: { id, projectId } });
    if (!evidence) throw AppError.notFound('Evidencia', 'EVIDENCE_NOT_FOUND');
    return evidence;
  }

  private async ensureEvidenceForValidation(projectId: string, id: string, claimId?: string) {
    const evidence = await this.prisma.evidence.findFirst({
      where: { id, projectId },
      include: { sourceRef: true, targetClaim: true },
    });
    if (!evidence) throw AppError.notFound('Evidencia', 'EVIDENCE_NOT_FOUND');
    if (claimId && evidence.targetClaimId !== claimId) {
      throw AppError.badRequest('La evidencia no esta ligada al Claim validado.', 'EVIDENCE_CLAIM_MISMATCH');
    }
    if (evidence.sourceRefId && !evidence.sourceRef) {
      throw AppError.badRequest('La evidencia no tiene SourceRef real.', 'EVIDENCE_SOURCE_REF_NOT_FOUND');
    }
    if (evidence.sourceRef?.projectId && evidence.sourceRef.projectId !== projectId) {
      throw AppError.badRequest('La evidencia usa SourceRef de otro proyecto.', 'EVIDENCE_SOURCE_PROJECT_MISMATCH');
    }
    return evidence;
  }

  private async ensureSourceRefs(ids: string[], projectId: string) {
    const found = await this.prisma.sourceRef.findMany({
      where: { id: { in: ids }, OR: [{ projectId }, { projectId: null }] },
      select: { id: true },
    });
    const foundIds = new Set(found.map((item: { id: string }) => item.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw AppError.badRequest('SourceRef no encontrado para el proyecto.', 'SOURCE_REF_NOT_FOUND', {
        details: missing.map((id) => ({ field: 'sourceRefId', code: 'SOURCE_REF_NOT_FOUND', message: id })),
      });
    }
  }

  private ensureSupportedValidationInput({
    claim,
    evidence,
    input,
  }: {
    claim: Awaited<ReturnType<TruthService['ensureClaim']>> | null;
    evidence: Awaited<ReturnType<TruthService['ensureEvidenceForValidation']>> | null;
    input: RecordValidationInput;
  }) {
    if (!input.claimId || !claim) {
      throw AppError.badRequest('Supported requiere un Claim real del proyecto.', 'SUPPORTED_CLAIM_REQUIRED');
    }
    if (!input.evidenceId || !evidence) {
      throw AppError.badRequest('Supported requiere Evidence real.', 'SUPPORTED_EVIDENCE_REQUIRED');
    }
    if (evidence.targetClaimId !== input.claimId) {
      throw AppError.badRequest('Supported requiere Evidence ligada al Claim.', 'SUPPORTED_EVIDENCE_CLAIM_MISMATCH');
    }
    if (!evidence.sourceRefId || !evidence.sourceRef) {
      throw AppError.badRequest('Supported requiere Evidence con SourceRef real.', 'SUPPORTED_SOURCE_REF_REQUIRED');
    }
    if (evidence.truthStatus !== 'supports') {
      throw AppError.badRequest('Supported requiere Evidence marcada como supports.', 'SUPPORTED_EVIDENCE_STATUS_INVALID');
    }
  }

  private async ensureImpactValidation(
    projectId: string,
    impact: { claimId: string | null; subjectType: string; subjectId: string | null },
    validationId?: string | null,
  ) {
    if (!validationId) {
      throw AppError.badRequest('ImpactStatus validated/realized requiere validationId real.', 'IMPACT_VALIDATION_REQUIRED');
    }
    const validation = await this.prisma.truthValidation.findFirst({
      where: { id: validationId, projectId },
      include: { claim: true, evidence: { include: { sourceRef: true } } },
    });
    if (!validation) throw AppError.notFound('TruthValidation', 'IMPACT_VALIDATION_NOT_FOUND');
    if (validation.result !== 'supported') {
      throw AppError.badRequest('ImpactStatus validated requiere una validacion supported.', 'IMPACT_VALIDATION_RESULT_INVALID');
    }
    if (impact.claimId && validation.claimId !== impact.claimId) {
      throw AppError.badRequest('La validacion no corresponde al Claim del impacto.', 'IMPACT_VALIDATION_CLAIM_MISMATCH');
    }
    if (!validation.claimId || !validation.claim) {
      throw AppError.badRequest('La validacion no tiene Claim real.', 'IMPACT_VALIDATION_CLAIM_REQUIRED');
    }
    if (!validation.evidenceId || !validation.evidence) {
      throw AppError.badRequest('La validacion no tiene Evidence real.', 'IMPACT_VALIDATION_EVIDENCE_REQUIRED');
    }
    if (validation.evidence.targetClaimId !== validation.claimId) {
      throw AppError.badRequest('La Evidence de la validacion no corresponde al Claim.', 'IMPACT_VALIDATION_EVIDENCE_CLAIM_MISMATCH');
    }
    if (!validation.evidence.sourceRefId || !validation.evidence.sourceRef) {
      throw AppError.badRequest('La Evidence de la validacion no tiene SourceRef real.', 'IMPACT_VALIDATION_SOURCE_REQUIRED');
    }
    if (validation.evidence.truthStatus !== 'supports') {
      throw AppError.badRequest('La Evidence de la validacion no soporta el Claim.', 'IMPACT_VALIDATION_EVIDENCE_STATUS_INVALID');
    }
    return validation;
  }
}
