import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TruthService } from '../truth.service';

const describeIntegration = process.env.TRUTH_DB_INTEGRATION === '1' ? describe : describe.skip;
const prisma = new PrismaClient();
const service = new TruthService(prisma);

const userId = 'user-truth-r1-integration';
const projectId = 'project-truth-r1-integration';
const actor = { id: userId, role: 'mentor' };

async function clean() {
  await prisma.attentionItem.deleteMany({ where: { projectId } });
  await prisma.impactAssertion.deleteMany({ where: { projectId } });
  await prisma.truthClaimSourceRef.deleteMany({ where: { claim: { projectId } } });
  await prisma.truthValidation.deleteMany({ where: { projectId } });
  await prisma.evidence.deleteMany({ where: { projectId } });
  await prisma.truthClaim.deleteMany({ where: { projectId } });
  await prisma.sourceRef.deleteMany({ where: { projectId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describeIntegration('TruthService R1 persistence integration', () => {
  beforeAll(async () => {
    await clean();
    await prisma.user.create({
      data: {
        id: userId,
        email: 'truth.r1.integration@starteria.test',
        name: 'Truth R1 Integration',
        role: 'mentor',
        initials: 'TI',
        skills: [],
      },
    });
    await prisma.project.create({
      data: {
        id: projectId,
        name: 'Truth R1 Integration Project',
        description: 'Disposable DB proof for R1 truth integrity.',
        ownerId: userId,
      },
    });
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('persists and refreshes Claim, Evidence, Validation and AttentionItem with coherent relations', async () => {
    const source = await service.createSourceRef(
      { projectId, sourceType: 'API', reference: 'metric-r1-db', location: 'snapshot-1' },
      actor,
    );
    const claim = await service.createClaim({
      projectId,
      subjectType: 'initiative',
      subjectId: projectId,
      claimType: 'impact',
      statement: 'La iniciativa redujo 10 horas de retrabajo.',
      createdByType: 'human',
      sourceRefIds: [source.id],
    }, actor);
    const evidence = await service.attachEvidence({
      projectId,
      targetClaimId: claim.id,
      sourceRefId: source.id,
      name: 'Medicion operativa',
      evidenceType: 'OTHER',
      truthStatus: 'supports',
      stepRef: 3,
      provenance: { table: 'ops_metrics', period: '2026-08' },
    }, actor);
    const validation = await service.recordValidation({
      projectId,
      claimId: claim.id,
      evidenceId: evidence.id,
      result: 'supported',
      validatorType: 'human',
      validatorRole: 'mentor',
      rationale: 'La evidencia fuente corresponde al claim y soporta el resultado.',
    }, actor);
    const blocker = await service.createAttentionItem({
      projectId,
      objectType: 'initiative',
      objectId: projectId,
      category: 'validation',
      reason: 'Requiere seguimiento de metrica posterior.',
      severity: 'medium',
      sourceRefId: source.id,
      exitCondition: 'Metrica revisada por sponsor.',
      nextAction: 'Agendar revision.',
    });

    const refreshedClaim = await prisma.truthClaim.findUnique({
      where: { id: claim.id },
      include: { currentValidation: true, sourceRefLinks: true },
    });
    const refreshedEvidence = await prisma.evidence.findUnique({
      where: { id: evidence.id },
      include: { sourceRef: true, targetClaim: true, validations: true },
    });
    const refreshedValidation = await prisma.truthValidation.findUnique({
      where: { id: validation.id },
      include: { project: true, claim: true, evidence: true, sourceRef: true },
    });
    const refreshedBlocker = await prisma.attentionItem.findUnique({
      where: { id: blocker.id },
      include: { project: true, sourceRef: true },
    });

    expect(refreshedClaim).toMatchObject({
      id: claim.id,
      projectId,
      verificationState: 'supported',
      currentValidationId: validation.id,
    });
    expect(refreshedClaim?.sourceRefLinks).toHaveLength(1);
    expect(refreshedEvidence).toMatchObject({
      id: evidence.id,
      projectId,
      sourceRefId: source.id,
      targetClaimId: claim.id,
      truthStatus: 'supports',
    });
    expect(refreshedEvidence?.validations[0]?.id).toBe(validation.id);
    expect(refreshedValidation).toMatchObject({
      id: validation.id,
      projectId,
      claimId: claim.id,
      evidenceId: evidence.id,
      sourceRefId: source.id,
      result: 'supported',
    });
    expect(refreshedValidation?.project.id).toBe(projectId);
    expect(refreshedBlocker).toMatchObject({
      id: blocker.id,
      projectId,
      sourceRefId: source.id,
      status: 'open',
    });
  });
});
