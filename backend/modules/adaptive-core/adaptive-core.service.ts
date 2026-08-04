import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { syncInitiativeProgress } from '../portfolio/initiative-progress';
import type {
  AdaptiveCoreState,
  AdaptiveDepthLevel,
  AdaptiveHealth,
  AdaptiveQuestionSource,
  AdaptiveRouteType,
  MaterializedQuestion,
  Step0AlignmentBrief,
} from './adaptive-core.types';
import type { CheckpointResponseInput, ConfirmBriefInput, ConfirmStep1OutputInput, ConfirmStep2OutputInput, ConfirmStep3OutputInput, ConfirmStep4OutputInput, CriticalChangeInput } from './adaptive-core.schemas';

type Role = 'participante' | 'owner' | 'mentor' | 'admin' | 'sponsor' | 'portfolio_lead' | string;
type StepNumber = 0 | 1 | 2 | 3 | 4;

const STEP0_CHECKPOINTS = [
  { key: 'CP-0.1', sequence: 1, title: 'Enmarcar la iniciativa', outputKey: 'InitiativeFraming' },
  { key: 'CP-0.2', sequence: 2, title: 'Aterrizar condiciones reales', outputKey: 'ExecutionConditionsMap' },
  { key: 'CP-0.3', sequence: 3, title: 'Definir que validar o decidir', outputKey: 'AlignmentBrief + ValidationContract' },
] as const;

const STEP1_CHECKPOINTS = [
  { key: 'CP-1.1', sequence: 1, title: 'Priorizar validacion', outputKey: 'ValidationFocus' },
  { key: 'CP-1.2', sequence: 2, title: 'Disenar plan de evidencia', outputKey: 'EvidencePlan' },
  { key: 'CP-1.3', sequence: 3, title: 'Capturar y analizar evidencia', outputKey: 'EvidenceMap' },
  { key: 'CP-1.4', sequence: 4, title: 'Sintetizar y decidir foco', outputKey: 'Step1FocusDecision' },
] as const;

const STEP1_OUTPUT_BY_ROUTE: Record<AdaptiveRouteType, string> = {
  explore_validate: 'ProblemFocusBrief',
  design_solution: 'OpportunityThesis',
  implement_handoff: 'ReadinessAdoptionAssessment',
  plan_coordinate: 'UncertaintyLearningMap',
  reconstruct_existing: 'EvidenceReconstructionReport',
  lightweight_plan: 'ProblemFocusBrief',
};

const STEP2_CHECKPOINTS = [
  { key: 'CP-2.1', sequence: 1, title: 'Design Criteria', outputKey: 'DesignCriteria' },
  { key: 'CP-2.2', sequence: 2, title: 'Alternatives', outputKey: 'AlternativeSet' },
  { key: 'CP-2.3', sequence: 3, title: 'Selected Bet', outputKey: 'SelectedBet' },
  { key: 'CP-2.4', sequence: 4, title: 'Execution Design', outputKey: 'ExecutionDesign' },
  { key: 'CP-2.5', sequence: 5, title: 'Readiness', outputKey: 'ReadinessCheck' },
] as const;

const STEP2_OUTPUT_BY_ROUTE: Record<AdaptiveRouteType, string> = {
  explore_validate: 'ExperimentCard',
  design_solution: 'PilotCard',
  implement_handoff: 'ImplementationValidationPlan',
  plan_coordinate: 'DeliveryPlan',
  reconstruct_existing: 'RecoveryValidationPlan',
  lightweight_plan: 'ExperimentCard',
};

const STEP3_CHECKPOINTS = [
  { key: 'CP-3.1', sequence: 1, title: 'Execution Readiness', outputKey: 'ExecutionReadiness' },
  { key: 'CP-3.2', sequence: 2, title: 'Execution Log', outputKey: 'ExecutionLog' },
  { key: 'CP-3.3', sequence: 3, title: 'Result Analysis', outputKey: 'ExperimentResultAnalysis' },
  { key: 'CP-3.4', sequence: 4, title: 'Decision', outputKey: 'Step3Decision' },
  { key: 'CP-3.5', sequence: 5, title: 'Operational Readiness', outputKey: 'OperationalReadiness' },
] as const;

const STEP3_OUTPUT_BY_ROUTE: Record<AdaptiveRouteType, string> = {
  explore_validate: 'ExperimentResultsLearningDecision',
  design_solution: 'PilotResultsProductDecision',
  implement_handoff: 'ImplementationValidationReport',
  plan_coordinate: 'ExecutionReviewUpdatedDecision',
  reconstruct_existing: 'RecoveryResultsRegularizationDecision',
  lightweight_plan: 'LightweightResultsBrief',
};

const STEP4_CHECKPOINTS = [
  { key: 'CP-4.1', sequence: 1, title: 'Audiencia y decision', outputKey: 'DecisionAudienceBrief' },
  { key: 'CP-4.2', sequence: 2, title: 'Narrativa con evidencia', outputKey: 'EvidenceBackedNarrative' },
  { key: 'CP-4.3', sequence: 3, title: 'Siguiente horizonte', outputKey: 'NextHorizonPlan' },
  { key: 'CP-4.4', sequence: 4, title: 'Paquete de decision', outputKey: 'DecisionPackage' },
  { key: 'CP-4.5', sequence: 5, title: 'Transferencia o cierre', outputKey: 'TransferOrClosure' },
] as const;

const STEP4_OUTPUT_BY_ROUTE: Record<AdaptiveRouteType, string> = {
  explore_validate: 'DecisionMemoLearningReport',
  design_solution: 'BusinessCaseRoadmap',
  implement_handoff: 'OperationalHandoffPackage',
  plan_coordinate: 'ExecutiveDeliveryReport',
  reconstruct_existing: 'RegularizationGovernancePackage',
  lightweight_plan: 'LightweightDecisionBrief',
};

export class AdaptiveCoreService {
  constructor(private prisma: PrismaClient) {}

  async ensureInitialized(projectId: string, userId: string, role: Role): Promise<AdaptiveCoreState> {
    const project = await this.getAccessibleProject(projectId, userId, role);
    const db = this.prisma as any;
    const existing = await db.adaptiveStepConfiguration.findFirst({
      where: { projectId, stepNumber: 0, status: 'active' },
      orderBy: { version: 'desc' },
    });
    if (!existing) {
      await this.initializeFromProject(project, userId);
    }
    return this.getState(projectId, userId, role);
  }

  async initializeFromProject(project: any, userId?: string): Promise<void> {
    const db = this.prisma as any;
    const existing = await db.adaptiveStepConfiguration.findFirst({
      where: { projectId: project.id, stepNumber: 0, status: 'active' },
      select: { id: true },
    });
    if (existing) return;

    const masterContext = this.buildMasterContext(project);
    const config = this.buildStepConfiguration(0, 1, masterContext);
    await db.$transaction(async (tx: any) => {
      const createdConfig = await tx.adaptiveStepConfiguration.create({
        data: {
          projectId: project.id,
          stepNumber: 0,
          version: 1,
          status: 'active',
          routeType: masterContext.routeType,
          depthLevel: masterContext.depthLevel,
          maturity: masterContext.maturity,
          configurationJson: config,
          sourceContextJson: masterContext,
        },
      });
      await this.materializeCheckpointTx(tx, project.id, createdConfig, 'CP-0.1', [], userId, `checkpoint_started:${project.id}:CP-0.1:1`);
      await this.upsertProgressSignalTx(tx, project.id, {
        step: 0,
        checkpointCode: 'CP-0.1',
        checkpointTitle: 'Enmarcar la iniciativa',
        health: masterContext.risks.length > 0 ? 'attention' : 'healthy',
        hypothesis: masterContext.assumptions[0] ?? 'Hipotesis pendiente de definir en Step 0.',
        evidence: masterContext.knownFacts[0] ?? 'Sin evidencia robusta aun; Step 0 ordena contexto.',
        evidenceStrength: masterContext.knownFacts.length > 1 ? 'weak' : 'none',
        blocker: masterContext.risks[0] ?? '',
        actorRequired: masterContext.challengeSnapshot ? 'Challenge Owner' : 'Owner de iniciativa',
        nextAction: 'Iniciar CP-0.1: Enmarcar la iniciativa.',
        upcomingDecision: masterContext.decisions[0] ?? 'Definir decision futura en CP-0.3.',
        updatedAt: new Date().toISOString(),
      });
      await this.recordEventTx(tx, project.id, 'step_configuration_created', 'Step 0 configurado por checkpoints.', { step: 0, version: 1 }, userId, `step-config-created:${project.id}:0:1`);
    });
  }

  async getState(projectId: string, userId: string, role: Role): Promise<AdaptiveCoreState> {
    await this.getAccessibleProject(projectId, userId, role);
    const db = this.prisma as any;
    const [configs, instances, outputs, signal, events] = await Promise.all([
      db.adaptiveStepConfiguration.findMany({ where: { projectId }, orderBy: [{ stepNumber: 'asc' }, { version: 'asc' }] }),
      db.adaptiveCheckpointInstance.findMany({ where: { projectId }, orderBy: [{ stepNumber: 'asc' }, { sequence: 'asc' }, { createdAt: 'asc' }] }),
      db.adaptiveStepOutput.findMany({ where: { projectId }, orderBy: [{ stepNumber: 'asc' }, { version: 'asc' }] }),
      db.adaptiveProgressSignal.findUnique({ where: { projectId } }),
      db.adaptiveAdaptationEvent.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    ]);
    const activeConfig = configs.find((c: any) => c.status === 'active' && c.stepNumber === 4)
      ?? configs.find((c: any) => c.status === 'active' && c.stepNumber === 3)
      ?? configs.find((c: any) => c.status === 'active' && c.stepNumber === 2)
      ?? configs.find((c: any) => c.status === 'active' && c.stepNumber === 1)
      ?? configs.find((c: any) => c.status === 'active' && c.stepNumber === 0)
      ?? configs[0];
    const activeCheckpoint = instances.find((i: any) => i.status === 'ready' || i.status === 'in_progress') ?? null;
    return {
      schemaVersion: 'PRD-03-v0.4',
      masterContext: activeConfig?.sourceContextJson ?? {},
      activeStepConfigurationId: activeConfig?.id ?? '',
      stepConfigurations: configs.map((c: any) => ({ ...c.configurationJson, id: c.id, version: c.version, status: c.status, requiresReview: c.requiresReview })),
      activeCheckpoint: activeCheckpoint ? this.serializeCheckpoint(activeCheckpoint) : null,
      checkpointInstances: instances.map((i: any) => this.serializeCheckpoint(i)),
      stepOutputs: outputs.map((o: any) => ({ id: o.id, step: o.stepNumber, version: o.version, status: o.status, outputKey: o.outputKey, output: o.outputJson, requiresReview: o.requiresReview })),
      progressSignal: signal?.signalJson ?? null,
      events,
      legacyFallback: Boolean(activeConfig?.sourceContextJson?.legacyFallback),
    };
  }

  async confirmCheckpoint(projectId: string, userId: string, role: Role, input: CheckpointResponseInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    const db = this.prisma as any;
    const existingResponse = await db.adaptiveCheckpointResponse.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingResponse) return this.getState(projectId, userId, role);

    const instance = await db.adaptiveCheckpointInstance.findFirst({
      where: { projectId, checkpointKey: input.checkpointKey, status: { in: ['ready', 'in_progress'] } },
      include: { stepConfiguration: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!instance) throw AppError.conflict('El checkpoint no esta activo o ya fue confirmado.', 'CHECKPOINT_NOT_ACTIVE');
    const stepConfiguration = instance.stepConfiguration
      ?? await db.adaptiveStepConfiguration.findUnique({ where: { id: instance.stepConfigurationId } });
    if (!stepConfiguration) throw AppError.badRequest('No existe configuracion para el checkpoint activo.', 'CHECKPOINT_CONFIGURATION_MISSING');

    const previousResponses = await db.adaptiveCheckpointResponse.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
    const sufficiency = this.evaluateCheckpoint(instance.checkpointKey, input.responses, previousResponses.map((r: any) => r.responseJson));
    if (!sufficiency.sufficient) {
      throw AppError.badRequest('El checkpoint aun no tiene informacion suficiente.', 'CHECKPOINT_INSUFFICIENT', {
        details: sufficiency.missing.map((field) => ({ field, code: 'MISSING_REQUIRED_FIELD', message: 'Completa o marca como pendiente este dato.' })),
      });
    }

    await db.$transaction(async (tx: any) => {
      await tx.adaptiveCheckpointResponse.create({
        data: {
          projectId,
          checkpointInstanceId: instance.id,
          checkpointKey: instance.checkpointKey,
          responseJson: input.responses,
          answeredById: userId,
          idempotencyKey: input.idempotencyKey,
        },
      });
      await tx.adaptiveCheckpointInstance.update({
        where: { id: instance.id },
        data: { status: 'completed', completedAt: new Date(), sufficiencyJson: sufficiency },
      });
      await this.recordEventTx(tx, projectId, 'checkpoint_completed', `${instance.checkpointKey} completado.`, { checkpointKey: instance.checkpointKey, sufficiency }, userId, input.idempotencyKey);

      const nextKey = this.nextCheckpointKey(instance.checkpointKey);
      if (nextKey === 'CP-2.5' && !this.shouldActivateReadiness(stepConfiguration.sourceContextJson ?? {}, input.responses)) {
        const allResponses = [...previousResponses.map((r: any) => r.responseJson), input.responses];
        const output = this.buildStep2Output(stepConfiguration.sourceContextJson, allResponses);
        await this.upsertStepOutputTx(tx, projectId, 2, stepConfiguration.id, output.outputKey, output as unknown as Record<string, unknown>, 'draft');
        await this.upsertProgressSignalTx(tx, projectId, {
          step: 2,
          checkpointCode: 'CP-2.4',
          checkpointTitle: 'Execution Design',
          health: 'ready_for_decision',
          hypothesis: output.hypothesis,
          evidence: output.evidenceUsed[0] ?? 'Evidencia transferida de Step 1.',
          evidenceStrength: output.evidenceUsed.length > 0 ? 'medium' : 'weak',
          blocker: output.risks[0] ?? '',
          actorRequired: output.responsibles[0] ?? 'Owner de iniciativa',
          nextAction: 'Revisar y confirmar el output de Step 2 antes de configurar Step 3.',
          upcomingDecision: output.goNoGoCriteria,
          updatedAt: new Date().toISOString(),
          selectedBet: output.selectedBet,
          readiness: output.readiness,
          contributionToChallenge: output.challengeContribution,
        });
        await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el output de Step 2.', { step: 2, outputKey: output.outputKey, readinessSkipped: true }, userId, `step2-output-review-required:${projectId}:2`);
      } else if (nextKey === 'CP-3.5' && !this.shouldActivateOperationalReadiness(stepConfiguration.sourceContextJson ?? {}, [...previousResponses.map((r: any) => r.responseJson), input.responses])) {
        const allResponses = [...previousResponses.map((r: any) => r.responseJson), input.responses];
        const output = this.buildStep3Output(stepConfiguration.sourceContextJson, allResponses);
        await this.upsertStepOutputTx(tx, projectId, 3, stepConfiguration.id, output.outputKey, output as unknown as Record<string, unknown>, 'draft');
        await this.upsertProgressSignalTx(tx, projectId, {
          step: 3,
          checkpointCode: 'CP-3.4',
          checkpointTitle: 'Decision',
          health: output.decision.decision === 'pause' ? 'attention' : 'ready_for_decision',
          hypothesis: output.hypothesis,
          evidence: output.resultAnalysis.interpretation,
          evidenceStrength: output.resultAnalysis.evidenceStrength,
          blocker: output.executionReadiness.blockers[0] ?? '',
          actorRequired: output.decision.requiredApprover || output.decision.owner || output.executionReadiness.actorsRequired[0] || 'Owner de iniciativa',
          nextAction: 'Revisar y confirmar el output de Step 3 antes de configurar Step 4.',
          upcomingDecision: output.decision.nextAction,
          updatedAt: new Date().toISOString(),
          execution: output.executionSummary,
          readiness: output.executionReadiness,
          result: output.resultAnalysis.classification,
          preliminaryResult: output.resultAnalysis.interpretation,
          contradictingEvidenceRefs: output.resultAnalysis.contradictingEvidenceRefs,
          deviations: output.executionLog.deviations,
          contributionToChallenge: output.challengeContribution,
        });
        await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el output de Step 3.', { step: 3, outputKey: output.outputKey, operationalReadinessSkipped: true }, userId, `step3-output-review-required:${projectId}:3`);
      } else if (nextKey) {
        await this.materializeCheckpointTx(tx, projectId, stepConfiguration, nextKey, [...previousResponses.map((r: any) => r.responseJson), input.responses], userId, `checkpoint_started:${projectId}:${nextKey}:${stepConfiguration.version}`);
        await this.updateSignalForCheckpointTx(tx, projectId, nextKey, input.responses, stepConfiguration.sourceContextJson);
      } else {
        const allResponses = [...previousResponses.map((r: any) => r.responseJson), input.responses];
        if (instance.stepNumber === 0) {
          const brief = this.buildStep0Brief(stepConfiguration.sourceContextJson, allResponses);
          await this.upsertStepOutputTx(tx, projectId, 0, stepConfiguration.id, 'Step0AlignmentBrief', brief as unknown as Record<string, unknown>, 'draft');
          await this.upsertProgressSignalTx(tx, projectId, {
            step: 0,
            checkpointCode: 'CP-0.3',
            checkpointTitle: 'Definir que validar o decidir',
            health: 'ready_for_decision',
            hypothesis: brief.priorityHypothesis,
            evidence: brief.availableEvidence[0] ?? 'Evidencia pendiente de confirmar.',
            evidenceStrength: brief.availableEvidence.length > 0 ? 'weak' : 'none',
            blocker: brief.missingInformation.length > 0 ? brief.missingInformation[0] : '',
            actorRequired: brief.actors[0] ?? 'Owner de iniciativa',
            nextAction: 'Revisar y confirmar el Alignment Brief de Step 0.',
            upcomingDecision: brief.decisionCriteria,
            updatedAt: new Date().toISOString(),
          });
          await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el Alignment Brief.', { step: 0, outputKey: 'Step0AlignmentBrief' }, userId, `brief-review-required:${projectId}:0`);
        } else if (instance.stepNumber === 1) {
          const output = this.buildStep1Output(stepConfiguration.sourceContextJson, allResponses);
          await this.upsertStepOutputTx(tx, projectId, 1, stepConfiguration.id, output.outputKey, output as unknown as Record<string, unknown>, 'draft');
          await this.upsertProgressSignalTx(tx, projectId, {
            step: 1,
            checkpointCode: 'CP-1.4',
            checkpointTitle: 'Sintetizar y decidir foco',
            health: output.sufficiency === 'sufficient' ? 'ready_for_decision' : 'attention',
            hypothesis: output.hypothesisForStep2,
            evidence: output.evidenceSummary,
            evidenceStrength: output.sufficiency === 'sufficient' ? 'medium' : 'weak',
            blocker: output.blocker,
            actorRequired: output.actorRequired,
            nextAction: 'Revisar y confirmar el output de Step 1 antes de configurar Step 2.',
            upcomingDecision: output.futureDecision,
            updatedAt: new Date().toISOString(),
          });
          await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el output de Step 1.', { step: 1, outputKey: output.outputKey }, userId, `step1-output-review-required:${projectId}:1`);
        } else if (instance.stepNumber === 2) {
          const output = this.buildStep2Output(stepConfiguration.sourceContextJson, allResponses);
          await this.upsertStepOutputTx(tx, projectId, 2, stepConfiguration.id, output.outputKey, output as unknown as Record<string, unknown>, 'draft');
          await this.upsertProgressSignalTx(tx, projectId, {
            step: 2,
            checkpointCode: instance.checkpointKey,
            checkpointTitle: 'Readiness',
            health: output.readiness.status === 'blocked' ? 'blocked' : 'ready_for_decision',
            hypothesis: output.hypothesis,
            evidence: output.evidenceUsed[0] ?? 'Evidencia transferida de Step 1.',
            evidenceStrength: output.evidenceUsed.length > 0 ? 'medium' : 'weak',
            blocker: output.readiness.blockers[0] ?? output.risks[0] ?? '',
            actorRequired: output.readiness.actorRequired ?? output.responsibles[0] ?? 'Owner de iniciativa',
            nextAction: 'Revisar y confirmar el output de Step 2 antes de configurar Step 3.',
            upcomingDecision: output.goNoGoCriteria,
            updatedAt: new Date().toISOString(),
            selectedBet: output.selectedBet,
            readiness: output.readiness,
            contributionToChallenge: output.challengeContribution,
          });
          await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el output de Step 2.', { step: 2, outputKey: output.outputKey }, userId, `step2-output-review-required:${projectId}:2`);
        } else if (instance.stepNumber === 3) {
          const output = this.buildStep3Output(stepConfiguration.sourceContextJson, allResponses);
          await this.upsertStepOutputTx(tx, projectId, 3, stepConfiguration.id, output.outputKey, output as unknown as Record<string, unknown>, 'draft');
          await this.upsertProgressSignalTx(tx, projectId, {
            step: 3,
            checkpointCode: instance.checkpointKey,
            checkpointTitle: 'Operational Readiness',
            health: output.operationalReadiness?.status === 'blocked' ? 'blocked' : 'ready_for_decision',
            hypothesis: output.hypothesis,
            evidence: output.resultAnalysis.interpretation,
            evidenceStrength: output.resultAnalysis.evidenceStrength,
            blocker: output.operationalReadiness?.blockers?.[0] ?? output.executionReadiness.blockers[0] ?? '',
            actorRequired: output.operationalReadiness?.requiredApprover ?? output.decision.requiredApprover ?? output.decision.owner ?? 'Owner de iniciativa',
            nextAction: 'Revisar y confirmar el output de Step 3 antes de configurar Step 4.',
            upcomingDecision: output.decision.nextAction,
            updatedAt: new Date().toISOString(),
            execution: output.executionSummary,
            readiness: output.executionReadiness,
            operationalReadiness: output.operationalReadiness,
            result: output.resultAnalysis.classification,
            preliminaryResult: output.resultAnalysis.interpretation,
            contradictingEvidenceRefs: output.resultAnalysis.contradictingEvidenceRefs,
            deviations: output.executionLog.deviations,
            contributionToChallenge: output.challengeContribution,
          });
          await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el output de Step 3.', { step: 3, outputKey: output.outputKey }, userId, `step3-output-review-required:${projectId}:3`);
        } else {
          const output = this.buildStep4Output(stepConfiguration.sourceContextJson, allResponses);
          await this.upsertStepOutputTx(tx, projectId, 4, stepConfiguration.id, output.outputKey, output as unknown as Record<string, unknown>, 'draft');
          await this.upsertProgressSignalTx(tx, projectId, {
            step: 4,
            checkpointCode: instance.checkpointKey,
            checkpointTitle: 'Transferencia o cierre',
            health: output.transferOrClosure.blockers.length > 0 ? 'blocked' : 'ready_for_decision',
            hypothesis: output.hypothesis,
            evidence: output.recommendation,
            evidenceStrength: output.finalChallengeContribution.evidenceStrength,
            blocker: output.transferOrClosure.blockers[0] ?? '',
            actorRequired: output.transferOrClosure.owner || output.audienceBrief.decisionMaker || 'Owner de iniciativa',
            nextAction: 'Revisar y confirmar el output de Step 4 para cerrar organizacionalmente la iniciativa.',
            upcomingDecision: output.transferOrClosure.finalDecision,
            updatedAt: new Date().toISOString(),
            audience: output.audienceBrief,
            recommendation: output.recommendation,
            artifacts: output.decisionPackage.artifacts,
            handoffStatus: output.transferOrClosure.status,
            futureOwner: output.transferOrClosure.receiverOwner,
            finalState: output.finalState,
            organizationalDecision: output.organizationalDecision,
            contributionToChallenge: output.finalChallengeContribution,
            challengeCoverage: output.challengeCoverage,
          });
          await this.recordEventTx(tx, projectId, 'actor_action_required', 'El owner debe confirmar el output de Step 4.', { step: 4, outputKey: output.outputKey }, userId, `step4-output-review-required:${projectId}:4`);
        }
      }
    });
    return this.getState(projectId, userId, role);
  }

  async confirmStep0Brief(projectId: string, userId: string, role: Role, input: ConfirmBriefInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    if (!input.confirmed) throw AppError.badRequest('El Brief debe ser confirmado por el usuario.', 'BRIEF_CONFIRMATION_REQUIRED');
    const db = this.prisma as any;
    const existingEvent = await db.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingEvent) return this.getState(projectId, userId, role);

    const draft = await db.adaptiveStepOutput.findFirst({ where: { projectId, stepNumber: 0, status: 'draft' }, orderBy: { version: 'desc' } });
    if (!draft) throw AppError.badRequest('No existe Alignment Brief para confirmar.', 'STEP0_BRIEF_NOT_READY');
    const step0Config = await db.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber: 0, status: 'active' }, orderBy: { version: 'desc' } });
    const masterContext = step0Config?.sourceContextJson ?? {};

    await db.$transaction(async (tx: any) => {
      await tx.adaptiveStepOutput.update({
        where: { id: draft.id },
        data: { status: 'confirmed', outputJson: input.brief, confirmedById: userId, confirmedAt: new Date() },
      });
      await tx.project.update({ where: { id: projectId }, data: { step0Status: 'COMPLETED', currentStep: 1, lastModified: new Date() } });

      const step1Version = await this.nextConfigVersionTx(tx, projectId, 1);
      const step1ConfigJson = this.buildStepConfiguration(1, step1Version, masterContext, input.brief);
      const step1Config = await tx.adaptiveStepConfiguration.create({
        data: {
          projectId,
          stepNumber: 1,
          version: step1Version,
          status: 'active',
          routeType: masterContext.routeType ?? 'explore_validate',
          depthLevel: masterContext.depthLevel ?? 'standard',
          maturity: masterContext.maturity ?? 'problem',
          configurationJson: step1ConfigJson,
          sourceContextJson: { ...masterContext, step0Output: input.brief },
        },
      });
      await this.materializeCheckpointTx(tx, projectId, step1Config, 'CP-1.1', [input.brief], userId, `checkpoint_started:${projectId}:CP-1.1:${step1Version}`);
      await this.upsertProgressSignalTx(tx, projectId, {
        step: 1,
        checkpointCode: 'CP-1.1',
        checkpointTitle: 'Priorizar que comprobar',
        health: 'healthy',
        hypothesis: String(input.brief.priorityHypothesis ?? 'Hipotesis prioritaria pendiente.'),
        evidence: Array.isArray(input.brief.availableEvidence) ? input.brief.availableEvidence[0] ?? 'Evidencia pendiente.' : 'Evidencia pendiente.',
        evidenceStrength: Array.isArray(input.brief.availableEvidence) && input.brief.availableEvidence.length > 0 ? 'weak' : 'none',
        blocker: '',
        actorRequired: Array.isArray(input.brief.actors) ? input.brief.actors[0] ?? 'Owner de iniciativa' : 'Owner de iniciativa',
        nextAction: 'Iniciar CP-1.1: priorizar que debe comprobarse.',
        upcomingDecision: String(input.brief.decisionCriteria ?? 'Definir continuidad hacia Step 2.'),
        updatedAt: new Date().toISOString(),
      });
      await this.recordEventTx(tx, projectId, 'step_completed', 'Step 0 confirmado por el usuario.', { step: 0, outputId: draft.id }, userId, input.idempotencyKey);
      await this.recordEventTx(tx, projectId, 'next_step_configured', 'Step 1 configurado desde el Alignment Brief confirmado.', { step: 1, version: step1Version }, userId, `next-step-configured:${projectId}:1:${step1Version}`);
    });
    await syncInitiativeProgress(this.prisma, projectId);
    return this.getState(projectId, userId, role);
  }

  async confirmStep1Output(projectId: string, userId: string, role: Role, input: ConfirmStep1OutputInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    if (!input.confirmed) throw AppError.badRequest('El output de Step 1 debe ser confirmado por el usuario.', 'STEP1_CONFIRMATION_REQUIRED');
    const db = this.prisma as any;
    const existingEvent = await db.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingEvent) return this.getState(projectId, userId, role);

    const draft = await db.adaptiveStepOutput.findFirst({ where: { projectId, stepNumber: 1, status: 'draft' }, orderBy: { version: 'desc' } });
    if (!draft) throw AppError.badRequest('No existe output de Step 1 para confirmar.', 'STEP1_OUTPUT_NOT_READY');
    const step1Config = await db.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber: 1, status: 'active' }, orderBy: { version: 'desc' } });
    if (!step1Config) throw AppError.badRequest('No existe configuracion activa de Step 1.', 'STEP1_CONFIGURATION_MISSING');

    const step1Output = { ...(draft.outputJson ?? {}), ...(input.brief ?? {}) };
    const nextMasterContext = this.buildStep2MasterContext(step1Config.sourceContextJson ?? {}, step1Output);

    await db.$transaction(async (tx: any) => {
      await tx.adaptiveStepOutput.update({
        where: { id: draft.id },
        data: { status: 'confirmed', outputJson: step1Output, confirmedById: userId, confirmedAt: new Date(), requiresReview: false },
      });
      await tx.project.update({ where: { id: projectId }, data: { currentStep: 2, lastModified: new Date() } });

      const step2Version = await this.nextConfigVersionTx(tx, projectId, 2);
      const step2ConfigJson = this.buildStepConfiguration(2, step2Version, nextMasterContext, nextMasterContext.step0Output);
      const step2Config = await tx.adaptiveStepConfiguration.create({
        data: {
          projectId,
          stepNumber: 2,
          version: step2Version,
          status: 'active',
          routeType: nextMasterContext.routeType ?? 'explore_validate',
          depthLevel: nextMasterContext.depthLevel ?? 'standard',
          maturity: nextMasterContext.maturity ?? 'problem',
          configurationJson: step2ConfigJson,
          sourceContextJson: nextMasterContext,
        },
      });
      await this.materializeCheckpointTx(tx, projectId, step2Config, 'CP-2.1', [step1Output], userId, `checkpoint_started:${projectId}:CP-2.1:${step2Version}`);
      await this.upsertProgressSignalTx(tx, projectId, {
        step: 2,
        checkpointCode: 'CP-2.1',
        checkpointTitle: STEP2_CHECKPOINTS[0].title,
        health: 'healthy',
        hypothesis: String(step1Output.hypothesisForStep2 ?? step1Output.updatedFocus ?? 'Hipotesis confirmada en Step 1.'),
        evidence: String(step1Output.evidenceSummary ?? 'Evidencia confirmada en Step 1.'),
        evidenceStrength: String(step1Output.sufficiency ?? '') === 'sufficient' ? 'medium' : 'weak',
        blocker: '',
        actorRequired: String(step1Output.actorRequired ?? 'Owner de iniciativa'),
        nextAction: 'Revisar transferencia de Step 1 y preparar el diseno de apuesta en Step 2.',
        upcomingDecision: String(step1Output.futureDecision ?? 'Definir apuesta inicial.'),
        updatedAt: new Date().toISOString(),
        validationFocus: step1Output.validationFocus,
        plannedEvidence: step1Output.evidencePlan,
        obtainedEvidence: step1Output.evidenceMap,
        sufficiency: step1Output.sufficiency,
        contradictions: step1Output.contradictions,
        contributionToChallenge: step1Output.challengeContribution,
      });
      await tx.initiativePortfolioMeta.updateMany({
        where: { projectId },
        data: { status: 'en_step_2' } as any,
      });
      await this.recordEventTx(tx, projectId, 'step_completed', 'Step 1 confirmado por el usuario.', { step: 1, outputId: draft.id }, userId, input.idempotencyKey);
      await this.recordEventTx(tx, projectId, 'next_step_configured', 'Step 2 configurado desde el output confirmado de Step 1.', { step: 2, version: step2Version, transferred: ['foco', 'hipotesis', 'evidencia', 'restricciones', 'criterios', 'baseline', 'actores', 'decision futura'] }, userId, `next-step-configured:${projectId}:2:${step2Version}`);
    });
    await syncInitiativeProgress(this.prisma, projectId);
    return this.getState(projectId, userId, role);
  }

  async confirmStep2Output(projectId: string, userId: string, role: Role, input: ConfirmStep2OutputInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    if (!input.confirmed) throw AppError.badRequest('El output de Step 2 debe ser confirmado por el usuario.', 'STEP2_CONFIRMATION_REQUIRED');
    const db = this.prisma as any;
    const existingEvent = await db.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingEvent) return this.getState(projectId, userId, role);

    const draft = await db.adaptiveStepOutput.findFirst({ where: { projectId, stepNumber: 2, status: 'draft' }, orderBy: { version: 'desc' } });
    if (!draft) throw AppError.badRequest('No existe output de Step 2 para confirmar.', 'STEP2_OUTPUT_NOT_READY');
    const step2Config = await db.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber: 2, status: 'active' }, orderBy: { version: 'desc' } });
    if (!step2Config) throw AppError.badRequest('No existe configuracion activa de Step 2.', 'STEP2_CONFIGURATION_MISSING');

    const step2Output = { ...(draft.outputJson ?? {}), ...(input.brief ?? {}) };
    const selectedBetChanged = this.hasSelectedBetChanged(draft.outputJson ?? {}, input.brief ?? {});
    if (selectedBetChanged && !this.hasValue((input.brief as any).changeReason)) {
      throw AppError.badRequest('Registra la razon del cambio de apuesta antes de confirmar Step 2.', 'STEP2_BET_CHANGE_REASON_REQUIRED');
    }
    const nextMasterContext = this.buildStep3MasterContext(step2Config.sourceContextJson ?? {}, step2Output);

    await db.$transaction(async (tx: any) => {
      await tx.adaptiveStepOutput.update({
        where: { id: draft.id },
        data: { status: 'confirmed', outputJson: step2Output, confirmedById: userId, confirmedAt: new Date(), requiresReview: false },
      });
      await tx.project.update({ where: { id: projectId }, data: { currentStep: 3, lastModified: new Date() } });

      const step3Version = await this.nextConfigVersionTx(tx, projectId, 3);
      const step3ConfigJson = this.buildStepConfiguration(3, step3Version, nextMasterContext, nextMasterContext.step0Output);
      const step3Config = await tx.adaptiveStepConfiguration.create({
        data: {
          projectId,
          stepNumber: 3,
          version: step3Version,
          status: 'active',
          routeType: nextMasterContext.routeType ?? 'explore_validate',
          depthLevel: nextMasterContext.depthLevel ?? 'standard',
          maturity: nextMasterContext.maturity ?? 'solution_proposed',
          configurationJson: step3ConfigJson,
          sourceContextJson: nextMasterContext,
        },
      });
      await this.materializeCheckpointTx(tx, projectId, step3Config, 'CP-3.1', [step2Output], userId, `checkpoint_started:${projectId}:CP-3.1:${step3Version}`);
      await this.upsertProgressSignalTx(tx, projectId, {
        step: 3,
        checkpointCode: 'CP-3.1',
        checkpointTitle: STEP3_CHECKPOINTS[0].title,
        health: 'healthy',
        hypothesis: String(step2Output.hypothesis ?? step2Output.selectedBet?.hypothesis ?? 'Hipotesis confirmada en Step 2.'),
        evidence: Array.isArray(step2Output.evidenceUsed) ? step2Output.evidenceUsed[0] ?? 'Evidencia confirmada en Step 2.' : 'Evidencia confirmada en Step 2.',
        evidenceStrength: 'medium',
        blocker: '',
        actorRequired: Array.isArray(step2Output.responsibles) ? step2Output.responsibles[0] ?? 'Owner de iniciativa' : 'Owner de iniciativa',
        nextAction: 'Preparar ejecucion y medicion desde la apuesta confirmada.',
        upcomingDecision: String(step2Output.goNoGoCriteria ?? 'Decision Go/No-Go.'),
        updatedAt: new Date().toISOString(),
        selectedBet: step2Output.selectedBet,
        readiness: step2Output.readiness,
        contributionToChallenge: step2Output.challengeContribution,
      });
      await tx.initiativePortfolioMeta.updateMany({
        where: { projectId },
        data: { status: 'en_step_3' } as any,
      });
      await this.recordEventTx(tx, projectId, 'step_completed', 'Step 2 confirmado por el usuario.', { step: 2, outputId: draft.id, selectedBetChanged }, userId, input.idempotencyKey);
      await this.recordEventTx(tx, projectId, 'next_step_configured', 'Step 3 configurado desde el output confirmado de Step 2.', { step: 3, version: step3Version }, userId, `next-step-configured:${projectId}:3:${step3Version}`);
    });
    await syncInitiativeProgress(this.prisma, projectId);
    return this.getState(projectId, userId, role);
  }

  async confirmStep3Output(projectId: string, userId: string, role: Role, input: ConfirmStep3OutputInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    if (!input.confirmed) throw AppError.badRequest('El output de Step 3 debe ser confirmado por el usuario.', 'STEP3_CONFIRMATION_REQUIRED');
    const db = this.prisma as any;
    const existingEvent = await db.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingEvent) return this.getState(projectId, userId, role);

    const draft = await db.adaptiveStepOutput.findFirst({ where: { projectId, stepNumber: 3, status: 'draft' }, orderBy: { version: 'desc' } });
    if (!draft) throw AppError.badRequest('No existe output de Step 3 para confirmar.', 'STEP3_OUTPUT_NOT_READY');
    const step3Config = await db.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber: 3, status: 'active' }, orderBy: { version: 'desc' } });
    if (!step3Config) throw AppError.badRequest('No existe configuracion activa de Step 3.', 'STEP3_CONFIGURATION_MISSING');

    const step3Output = { ...(draft.outputJson ?? {}), ...(input.brief ?? {}) };
    if (!this.hasValue((step3Output as any).decision?.decision ?? (step3Output as any).decision)) {
      throw AppError.badRequest('Step 3 requiere una decision confirmada antes de configurar Step 4.', 'STEP3_DECISION_REQUIRED');
    }
    const nextMasterContext = this.buildStep4MasterContext(step3Config.sourceContextJson ?? {}, step3Output);

    await db.$transaction(async (tx: any) => {
      await tx.adaptiveStepOutput.update({
        where: { id: draft.id },
        data: { status: 'confirmed', outputJson: step3Output, confirmedById: userId, confirmedAt: new Date(), requiresReview: false },
      });
      await tx.project.update({ where: { id: projectId }, data: { currentStep: 4, lastModified: new Date() } });

      const step4Version = await this.nextConfigVersionTx(tx, projectId, 4);
      const step4ConfigJson = this.buildStepConfiguration(4, step4Version, nextMasterContext, nextMasterContext.step0Output);
      const step4Config = await tx.adaptiveStepConfiguration.create({
        data: {
          projectId,
          stepNumber: 4,
          version: step4Version,
          status: 'active',
          routeType: nextMasterContext.routeType ?? 'explore_validate',
          depthLevel: nextMasterContext.depthLevel ?? 'standard',
          maturity: nextMasterContext.maturity ?? 'results_confirmed',
          configurationJson: step4ConfigJson,
          sourceContextJson: nextMasterContext,
        },
      });
      await this.materializeCheckpointTx(tx, projectId, step4Config, 'CP-4.1', [step3Output], userId, `checkpoint_started:${projectId}:CP-4.1:${step4Version}`);
      await this.upsertProgressSignalTx(tx, projectId, {
        step: 4,
        checkpointCode: 'CP-4.1',
        checkpointTitle: STEP4_CHECKPOINTS[0].title,
        health: 'healthy',
        hypothesis: String(step3Output.hypothesis ?? step3Output.decision?.rationale ?? 'Decision confirmada en Step 3.'),
        evidence: String(step3Output.resultAnalysis?.interpretation ?? 'Resultados confirmados en Step 3.'),
        evidenceStrength: String(step3Output.resultAnalysis?.evidenceStrength ?? 'medium'),
        blocker: '',
        actorRequired: String(step3Output.decision?.owner ?? step3Output.decision?.requiredApprover ?? 'Owner de iniciativa'),
        nextAction: 'Iniciar CP-4.1: configurar continuidad desde la decision confirmada.',
        upcomingDecision: String(step3Output.decision?.nextAction ?? 'Definir continuidad del aprendizaje.'),
        updatedAt: new Date().toISOString(),
        result: step3Output.resultAnalysis?.classification,
        decision: step3Output.decision,
        contributionToChallenge: step3Output.challengeContribution,
      });
      await tx.initiativePortfolioMeta.updateMany({
        where: { projectId },
        data: { status: 'en_step_4' } as any,
      });
      await this.recordEventTx(tx, projectId, 'step_completed', 'Step 3 confirmado por el usuario.', { step: 3, outputId: draft.id, decision: step3Output.decision }, userId, input.idempotencyKey);
      await this.recordEventTx(tx, projectId, 'next_step_configured', 'Step 4 configurado desde el output confirmado de Step 3.', { step: 4, version: step4Version }, userId, `next-step-configured:${projectId}:4:${step4Version}`);
    });
    await syncInitiativeProgress(this.prisma, projectId);
    return this.getState(projectId, userId, role);
  }

  async confirmStep4Output(projectId: string, userId: string, role: Role, input: ConfirmStep4OutputInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    if (!input.confirmed) throw AppError.badRequest('El output de Step 4 debe ser confirmado por el usuario.', 'STEP4_CONFIRMATION_REQUIRED');
    const db = this.prisma as any;
    const existingEvent = await db.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingEvent) return this.getState(projectId, userId, role);

    const draft = await db.adaptiveStepOutput.findFirst({ where: { projectId, stepNumber: 4, status: 'draft' }, orderBy: { version: 'desc' } });
    if (!draft) throw AppError.badRequest('No existe output de Step 4 para confirmar.', 'STEP4_OUTPUT_NOT_READY');
    const step4Config = await db.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber: 4, status: 'active' }, orderBy: { version: 'desc' } });
    if (!step4Config) throw AppError.badRequest('No existe configuracion activa de Step 4.', 'STEP4_CONFIGURATION_MISSING');

    const step4Output = { ...(draft.outputJson ?? {}), ...(input.brief ?? {}) };
    const finalState = this.normalizeFinalState((step4Output as any).finalState ?? (step4Output as any).transferOrClosure?.finalState);
    const organizationalDecision = String((step4Output as any).organizationalDecision ?? (step4Output as any).transferOrClosure?.finalDecision ?? '');
    if (!this.hasValue(organizationalDecision)) {
      throw AppError.badRequest('Step 4 requiere una decision organizacional confirmada.', 'STEP4_DECISION_REQUIRED');
    }
    const confirmedStep4Output = { ...step4Output, finalState, organizationalDecision };
    const nextMasterContext = this.buildFinalMasterContext(step4Config.sourceContextJson ?? {}, confirmedStep4Output, finalState);

    await db.$transaction(async (tx: any) => {
      await tx.adaptiveStepOutput.update({
        where: { id: draft.id },
        data: { status: 'confirmed', outputJson: confirmedStep4Output, confirmedById: userId, confirmedAt: new Date(), requiresReview: false },
      });
      await tx.adaptiveStepConfiguration.update({
        where: { id: step4Config.id },
        data: {
          sourceContextJson: nextMasterContext,
          configurationJson: {
            ...(step4Config.configurationJson ?? {}),
            finalState,
            organizationalDecision,
            finalOutputKey: confirmedStep4Output.outputKey,
            closedAt: new Date().toISOString(),
          },
        },
      });
      await tx.project.update({
        where: { id: projectId },
        data: { currentStep: 4, status: this.projectStatusForFinalState(finalState), lastModified: new Date() } as any,
      });
      await this.upsertProgressSignalTx(tx, projectId, {
        step: 4,
        checkpointCode: 'closed',
        checkpointTitle: 'Cierre organizacional',
        health: finalState === 'paused' || finalState === 'new_iteration_required' ? 'attention' : 'healthy',
        hypothesis: String(step4Output.hypothesis ?? nextMasterContext.step3Output?.hypothesis ?? ''),
        evidence: String(step4Output.recommendation ?? step4Output.narrative?.recommendation ?? ''),
        evidenceStrength: String(step4Output.finalChallengeContribution?.evidenceStrength ?? step4Output.challengeCoverage?.evidenceStrength ?? 'medium'),
        blocker: '',
        actorRequired: String(step4Output.transferOrClosure?.owner ?? step4Output.audienceBrief?.decisionMaker ?? 'Owner de iniciativa'),
        nextAction: String(step4Output.transferOrClosure?.nextStep ?? step4Output.nextHorizon?.nextAction ?? 'Iniciativa cerrada organizacionalmente.'),
        upcomingDecision: organizationalDecision,
        updatedAt: new Date().toISOString(),
        audience: step4Output.audienceBrief,
        recommendation: step4Output.recommendation,
        artifacts: step4Output.decisionPackage?.artifacts ?? [],
        handoffStatus: step4Output.transferOrClosure?.status,
        futureOwner: step4Output.transferOrClosure?.receiverOwner,
        finalState,
        hypothesisResult: step4Output.hypothesisResult,
        organizationalDecision,
        contributionToChallenge: step4Output.finalChallengeContribution,
        challengeCoverage: step4Output.challengeCoverage,
      });
      await tx.initiativePortfolioMeta.updateMany({
        where: { projectId },
        data: this.portfolioMetaFinalUpdate(step4Output, finalState) as any,
      });
      if (nextMasterContext.challengeSnapshot?.id && tx.challenge?.update) {
        await tx.challenge.update({
          where: { id: nextMasterContext.challengeSnapshot.id },
          data: { coverageStatus: this.prismaCoverageStatus(step4Output.challengeCoverage?.status), updatedAt: new Date() } as any,
        }).catch(() => null);
      }
      await this.recordEventTx(tx, projectId, 'step_completed', 'Step 4 confirmado por el usuario.', { step: 4, outputId: draft.id, finalState, organizationalDecision }, userId, input.idempotencyKey);
      await this.recordEventTx(tx, projectId, 'initiative_closed', 'Cierre organizacional registrado.', { finalState, challengeCoverage: step4Output.challengeCoverage, handoff: step4Output.transferOrClosure }, userId, `initiative-closed:${projectId}:4:${draft.version}`);
    });
    await syncInitiativeProgress(this.prisma, projectId);
    return this.getState(projectId, userId, role);
  }

  async registerCriticalChange(projectId: string, userId: string, role: Role, input: CriticalChangeInput): Promise<AdaptiveCoreState> {
    await this.ensureInitialized(projectId, userId, role);
    const db = this.prisma as any;
    const existing = await db.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return this.getState(projectId, userId, role);
    if (!input.confirmed) {
      await this.recordEventTx(db, projectId, `${input.field}_change_detected`, 'Cambio critico detectado; requiere confirmacion antes de recalibrar.', this.buildCriticalChangeReview(input), userId, input.idempotencyKey);
      return this.getState(projectId, userId, role);
    }

    const targetStep = input.field === 'selected_bet' ? 2 : 0;
    const active = await db.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber: targetStep, status: 'active' }, orderBy: { version: 'desc' } });
    if (!active) throw AppError.badRequest('No hay configuracion activa para recalibrar.', 'NO_ACTIVE_CONFIGURATION');
    const review = this.buildCriticalChangeReview(input, Number(active.version ?? 1) + 1);
    if (input.action === 'keep_previous_route' || input.action === 'back_and_edit') {
      await db.$transaction(async (tx: any) => {
        await tx.adaptiveStepOutput.updateMany({ where: { projectId, status: { in: ['draft', 'confirmed'] } }, data: { requiresReview: true } });
        await this.upsertProgressSignalTx(tx, projectId, {
          step: active.stepNumber,
          checkpointCode: 'critical-change-review',
          checkpointTitle: 'Revision de cambio critico',
          health: 'attention',
          hypothesis: String(input.nextValue ?? ''),
          evidence: String(input.reason ?? 'Cambio critico pendiente de resolucion.'),
          evidenceStrength: 'weak',
          blocker: input.action === 'back_and_edit' ? 'El usuario eligio volver y editar antes de recalibrar.' : '',
          actorRequired: 'Owner de iniciativa',
          nextAction: input.action === 'back_and_edit' ? 'Volver a editar el dato critico.' : 'Mantener ruta actual y revisar outputs dependientes.',
          upcomingDecision: 'Decidir si recalibrar la ruta mas adelante.',
          updatedAt: new Date().toISOString(),
          criticalChangeReview: review,
        });
        await this.recordEventTx(tx, projectId, `${input.field}_change_reviewed`, 'Cambio critico revisado sin crear nueva ruta.', review, userId, input.idempotencyKey);
      });
      return this.getState(projectId, userId, role);
    }
    const nextVersion = await this.nextConfigVersionTx(db, projectId, targetStep);
    const nextContext = this.applyCriticalChange(active.sourceContextJson ?? {}, input);
    const nextConfigJson = this.buildStepConfiguration(targetStep as StepNumber, nextVersion, nextContext);
    await db.$transaction(async (tx: any) => {
      await tx.adaptiveStepConfiguration.update({ where: { id: active.id }, data: { status: 'superseded', requiresReview: true } });
      await tx.adaptiveStepOutput.updateMany({ where: { projectId, stepNumber: { gte: targetStep }, status: { in: ['draft', 'confirmed'] } }, data: { requiresReview: true } });
      const created = await tx.adaptiveStepConfiguration.create({
        data: {
          projectId,
          stepNumber: targetStep,
          version: nextVersion,
          status: 'active',
          routeType: nextContext.routeType,
          depthLevel: nextContext.depthLevel,
          maturity: nextContext.maturity,
          configurationJson: nextConfigJson,
          sourceContextJson: nextContext,
        },
      });
      const restartCheckpoint = targetStep === 2 ? 'CP-2.1' : 'CP-0.1';
      await this.materializeCheckpointTx(tx, projectId, created, restartCheckpoint, [], userId, `checkpoint_started:${projectId}:${restartCheckpoint}:${nextVersion}`);
      await this.upsertProgressSignalTx(tx, projectId, {
        step: targetStep,
        checkpointCode: restartCheckpoint,
        checkpointTitle: targetStep === 2 ? 'Design Criteria' : 'Enmarcar la iniciativa',
        health: 'attention',
        hypothesis: String(input.nextValue ?? ''),
        evidence: String(input.reason ?? 'Cambio critico confirmado.'),
        evidenceStrength: 'weak',
        blocker: '',
        actorRequired: 'Owner de iniciativa',
        nextAction: input.action === 'split_phases' ? 'Revisar nueva version y separar fases antes de continuar.' : 'Revisar nueva version de Step 0.',
        upcomingDecision: 'Confirmar si la nueva ruta reemplaza el brief anterior.',
        updatedAt: new Date().toISOString(),
        criticalChangeReview: { ...review, newVersion: nextVersion },
      });
      await this.recordEventTx(tx, projectId, `${input.field}_changed`, 'Cambio critico confirmado; se creo nueva configuracion y outputs dependientes requieren revision.', { ...review, newVersion: nextVersion }, userId, input.idempotencyKey);
      await this.recordEventTx(tx, projectId, 'step_reconfigured', `Step ${targetStep} reconfigurado por cambio critico.`, { step: targetStep, version: nextVersion }, userId, `step-reconfigured:${projectId}:${targetStep}:${nextVersion}`);
    });
    return this.getState(projectId, userId, role);
  }

  private async getAccessibleProject(projectId: string, userId: string, role: Role) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: true,
        portfolioMeta: { include: { challenge: { include: { strategicFront: true } } } },
        contextSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
        steps: true,
      },
    });
    if (!project) throw AppError.notFound('Proyecto', 'PROJECT_NOT_FOUND');
    if (role !== 'admin' && role !== 'mentor') {
      const isMember = (project as any).teamMembers.some((m: any) => m.userId === userId);
      if (!isMember) throw AppError.forbidden('No tienes acceso a este proyecto.', 'PROJECT_ACCESS_DENIED');
    }
    return project as any;
  }

  private buildMasterContext(project: any) {
    const raw = (project.step0Data ?? {}) as Record<string, any>;
    const legacy = raw.adaptiveCore?.masterContext ?? {};
    const portfolioMeta = project.portfolioMeta?.[0];
    const companySnapshot = project.contextSnapshots?.[0];
    const companyJson = companySnapshot?.snapshotJson ?? null;
    const companyCoverage = Number(companySnapshot?.contextScore ?? companyJson?.contextScore ?? 0);
    const routeType = String(legacy.routeType ?? this.deriveRouteType(raw, portfolioMeta)) as AdaptiveRouteType;
    const depthLevel = String(legacy.depthLevel ?? this.deriveDepthLevel(raw, companyCoverage)) as AdaptiveDepthLevel;
    const company = companyJson ? {
      id: companyJson.company?.id ?? companySnapshot.companyId,
      name: companyJson.company?.name ?? 'Empresa seleccionada',
      area: companyJson.areas?.[0]?.name ?? null,
      coverage: companyCoverage,
      restrictions: this.extractCompanyDimension(companyJson, ['restriction', 'restriccion', 'guardrail']),
      culture: this.extractCompanyDimension(companyJson, ['culture', 'cultura']),
      actors: this.extractCompanyDimension(companyJson, ['actor', 'stakeholder', 'sponsor']),
      decisionModel: this.extractCompanyDimension(companyJson, ['decision', 'comite', 'gobernanza']),
      formats: this.extractCompanyDimension(companyJson, ['format', 'formato', 'template']),
      sources: (companyJson.sources ?? []).map((s: any) => s.id ?? s.url ?? s.originalFilename).filter(Boolean),
      lowCoverage: companyCoverage < 50,
      versionId: companyJson.versionId,
      versionNumber: companyJson.versionNumber,
    } : null;
    return {
      id: legacy.id ?? `master-context-${project.initialReviewSnapshotId ?? project.id}-v1`,
      version: Number(legacy.version ?? 1),
      legacyFallback: !raw.adaptiveCore,
      challengeType: legacy.challengeType ?? raw.challengeType ?? portfolioMeta?.challenge?.type ?? 'exploration',
      routeType,
      depthLevel,
      maturity: legacy.maturity ?? (routeType === 'implement_handoff' ? 'solution_proposed' : 'problem'),
      knownFacts: this.compact([raw.contextInitial, raw.initialFocus, raw.expectedImpact, raw.quePasaQueQuieres]),
      assumptions: this.compact([...(Array.isArray(raw.pendingQuestions) ? raw.pendingQuestions.map((q: any) => typeof q === 'string' ? q : q.question) : []), raw.validationSignal]),
      missingCriticalInformation: this.compact(Array.isArray(raw.pendingQuestions) ? raw.pendingQuestions.map((q: any) => typeof q === 'string' ? q : q.question) : []),
      risks: this.compact([raw.mainRisk]),
      decisions: this.compact([raw.nextRecommendedStep, raw.decisionRequested]),
      companySnapshot: company,
      challengeSnapshot: portfolioMeta ? {
        id: portfolioMeta.challengeId,
        title: portfolioMeta.challenge?.title ?? portfolioMeta.challenge?.name,
        strategicFrontId: portfolioMeta.strategicFrontId,
        objective: portfolioMeta.challenge?.objective,
        successCriteria: portfolioMeta.challenge?.successCriteria,
        challengeOwner: portfolioMeta.challenge?.challengeOwner,
        strategicFront: portfolioMeta.challenge?.strategicFront?.name,
      } : null,
      createdAt: new Date().toISOString(),
    };
  }

  private buildStepConfiguration(step: StepNumber, version: number, masterContext: any, step0Output?: Record<string, unknown>) {
    const routeType = (masterContext.routeType ?? 'explore_validate') as AdaptiveRouteType;
    const checkpointSpecs = step === 0
      ? STEP0_CHECKPOINTS
      : step === 1
        ? STEP1_CHECKPOINTS
        : step === 2
          ? STEP2_CHECKPOINTS.filter((cp) => cp.key !== 'CP-2.5' || this.shouldActivateReadiness(masterContext))
          : step === 3
            ? STEP3_CHECKPOINTS.filter((cp) => cp.key !== 'CP-3.5' || this.shouldActivateOperationalReadiness(masterContext))
            : STEP4_CHECKPOINTS;
    const checkpoints = checkpointSpecs.map((cp, idx) => ({
      id: cp.key.toLowerCase().replace('.', '-'),
      step,
      code: cp.key,
      title: cp.title,
      status: idx === 0 ? 'ready' : 'locked',
      outputKey: cp.outputKey,
      questions: idx === 0 ? this.buildQuestions(cp.key, version, masterContext, []) : [],
      completionCriteria: step === 0
        ? ['Sintesis suficiente', 'Faltantes visibles', 'Siguiente accion definida']
        : step === 1
          ? ['Foco visible', 'Evidencia con sourceRefs', 'Decision de continuidad explicita']
          : step === 2
            ? ['Foco transferido', 'Hipotesis de Step 1 visible', 'Restricciones y criterios heredados']
            : step === 3
              ? ['Ejecucion registrada', 'Resultado analizado', 'Decision confirmable']
              : ['Decision Step 3 transferida', 'Continuidad configurada'],
    }));
    return {
      id: `step-${step}-${routeType}-v${version}`,
      step,
      version,
      visibleName: step === 0 ? 'Step 0 adaptativo' : step === 1 ? 'Step 1 adaptativo' : step === 2 ? 'Step 2 adaptativo' : step === 3 ? 'Step 3 adaptativo' : 'Step 4 configurado',
      objective: step === 0
        ? 'Convertir la intencion inicial en hipotesis estrategica delimitada y contrato de validacion o ejecucion.'
        : step === 1
          ? 'Delimitar y fundamentar el foco mediante evidencia suficiente.'
          : step === 2
            ? 'Convertir el foco sustentado en una apuesta seleccionada y una forma ejecutable de probarla o implementarla.'
            : step === 3
              ? 'Ejecutar, analizar resultados y confirmar una decision trazable desde la apuesta seleccionada.'
              : 'Preparar continuidad o cierre operativo desde la decision confirmada de Step 3.',
      expectedOutput: step === 0 ? 'Step0AlignmentBrief + ValidationContract' : step === 1 ? STEP1_OUTPUT_BY_ROUTE[routeType] : step === 2 ? STEP2_OUTPUT_BY_ROUTE[routeType] : step === 3 ? STEP3_OUTPUT_BY_ROUTE[routeType] : STEP4_OUTPUT_BY_ROUTE[routeType],
      routeType,
      depthLevel: masterContext.depthLevel ?? 'standard',
      transferredFromStep0: step0Output ?? null,
      transferredFromStep1: step === 2 ? masterContext.step1Output ?? null : null,
      transferredFromStep2: step === 3 ? masterContext.step2Output ?? null : null,
      transferredFromStep3: step === 4 ? masterContext.step3Output ?? null : null,
      checkpoints,
    };
  }

  private buildQuestions(checkpointKey: string, configurationVersion: number, masterContext: any, previousAnswers: Record<string, unknown>[]): MaterializedQuestion[] {
    const questions: MaterializedQuestion[] = [];
    const add = (source: AdaptiveQuestionSource, prompt: string, clarifiesVariable: string, required: boolean, reason: string, sourceRefs: string[] = [], extra: Partial<MaterializedQuestion> = {}) => {
      questions.push({
        id: `${checkpointKey.toLowerCase().replace('.', '-')}-v${configurationVersion}-q${questions.length + 1}`,
        checkpointKey,
        configurationVersion,
        prompt,
        purpose: reason,
        clarifiesVariable,
        answerType: extra.answerType ?? 'free_text',
        reason,
        source,
        sourceRefs,
        required,
        allowsUnknown: extra.allowsUnknown ?? true,
        contextDerived: extra.contextDerived,
        confirmationRequired: extra.confirmationRequired,
      });
    };

    if (checkpointKey === 'CP-0.1') {
      add('core', 'Que resultado o cambio debe quedar entendible para un lider?', 'objective', true, 'Step 0 no puede cerrar sin proposito entendible.', ['PRD-03:9.4'], { allowsUnknown: false });
      add('challenge_type', 'Que tipo de reto describe mejor la iniciativa hoy?', 'challengeType', true, 'El tipo de reto ajusta profundidad y preguntas posteriores.', [String(masterContext.challengeType ?? '')]);
      if (masterContext.challengeSnapshot) add('challenge_context', 'Que parte del reto padre aborda esta iniciativa?', 'challengeContribution.subproblem', true, 'La iniciativa vinculada debe reportar contribucion al reto.', [masterContext.challengeSnapshot.id], { contextDerived: true });
    }
    if (checkpointKey === 'CP-0.2') {
      add('core', 'Cual es el alcance inicial y que queda fuera por ahora?', 'scope', true, 'El cierre de Step 0 requiere alcance inicial.', ['PRD-03:9.4']);
      add('core', 'Quien es el owner operativo y que actor debe confirmar condiciones?', 'owner_and_actor_required', true, 'Sin owner hay hard gate de Step 0.', ['PRD-03:9.5'], { answerType: 'owner', allowsUnknown: false });
      if (masterContext.companySnapshot) {
        add(
          'company_context',
          'Que restriccion de empresa podria afectar evidencia, datos o aprobaciones?',
          'company_constraints',
          !masterContext.companySnapshot.lowCoverage,
          masterContext.companySnapshot.lowCoverage
            ? 'La cobertura de contexto es baja; se presenta como hipotesis a confirmar, no como hard gate.'
            : 'El contexto empresarial sugiere revisar restricciones antes de avanzar.',
          masterContext.companySnapshot.sources ?? [],
          { contextDerived: true, confirmationRequired: true },
        );
      }
    }
    if (checkpointKey === 'CP-0.3') {
      add('core', 'Cual es la hipotesis prioritaria que debe validarse o decidirse?', 'priorityHypothesis', true, 'Step 0 debe cerrar con hipotesis o pregunta central.', ['PRD-03:9.4'], { allowsUnknown: false });
      add('previous_answer', 'Que evidencia o criterio permitiria tomar la siguiente decision?', 'decisionCriteria', true, 'El criterio de decision se deriva de respuestas previas y faltantes.', previousAnswers.map((_, i) => `checkpoint-response-${i + 1}`));
    }
    if (checkpointKey === 'CP-1.1') {
      add('core', 'Cual es la hipotesis principal que debe validarse primero?', 'mainHypothesis', true, 'Step 1 delimita una hipotesis principal antes de disenar evidencia.', ['Step0AlignmentBrief'], { allowsUnknown: false });
      add('core', 'Cual es el supuesto critico detras de esa hipotesis?', 'criticalAssumption', true, 'El plan de evidencia depende del supuesto con mayor riesgo.', ['PRD-03:CP-1.1'], { allowsUnknown: false });
      add('core', 'Que pregunta de aprendizaje debe responder la evidencia?', 'learningQuestion', true, 'Toda evidencia debe conectar con una pregunta verificable.', ['PRD-03:CP-1.1'], { allowsUnknown: false });
      add('core', 'Que riesgo existe si se equivocan en esta hipotesis?', 'riskOfBeingWrong', true, 'El riesgo prioriza profundidad y metodo.', ['PRD-03:CP-1.1']);
      add('core', 'Que decision depende de esta evidencia?', 'dependentDecision', true, 'Step 1 debe preparar una decision posterior explicita.', ['Step0AlignmentBrief']);
      if (masterContext.companySnapshot) {
        const influence = this.buildCompanyInfluence(masterContext.companySnapshot, 'validators');
        add('company_context', 'Que actor de empresa debe validar o abrir acceso para esta evidencia?', 'companyValidator', false, influence.reason, influence.sourceRefs, { contextDerived: true, confirmationRequired: influence.confirmationStatus !== 'confirmed' });
      }
    }
    if (checkpointKey === 'CP-1.2') {
      add('method_catalog', 'Que metodo usaran para conseguir evidencia suficiente?', 'methods', true, 'El metodo debe corresponder a hipotesis, reto, empresa, restricciones y acceso.', ['PRD-03:CP-1.2'], { answerType: 'multi_choice', allowsUnknown: false });
      add('core', 'Que fuentes y actores participaran?', 'sourcesAndActors', true, 'El plan exige fuentes, actores y responsables.', ['PRD-03:CP-1.2']);
      add('core', 'Quien es responsable y en que fechas se conseguira la evidencia?', 'responsibleAndDates', true, 'Sin responsable y fechas el plan no es ejecutable.', ['PRD-03:CP-1.2'], { answerType: 'date' });
      add('core', 'Que evidencia esperan obtener y cual es el criterio de suficiencia?', 'expectedEvidenceAndSufficiency', true, 'El criterio evita cerrar Step 1 por opinion.', ['PRD-03:CP-1.2']);
    }
    if (checkpointKey === 'CP-1.3') {
      add('core', 'Que evidencias capturaron? Incluye archivos, links, texto, metricas, entrevistas, observaciones o documentos.', 'evidenceItems', true, 'Step 1 requiere evidencia explicita antes de sintetizar.', ['PRD-03:CP-1.3'], { allowsUnknown: false });
      add('core', 'Clasifica cada evidencia como supports, contradicts, weak_signal, insufficient, context o new_uncertainty.', 'evidenceClassifications', true, 'La clasificacion alimenta contradicciones y suficiencia.', ['PRD-03:CP-1.3'], { allowsUnknown: false });
      add('core', 'Que sourceRefs respaldan cada conclusion?', 'sourceRefs', true, 'Toda conclusion debe preservar referencias de fuente.', ['PRD-03:CP-1.3'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-1.4') {
      add('core', 'Cuales son los hechos, contradicciones, vacios y aprendizajes principales?', 'synthesis', true, 'La sintesis debe separar evidencia de interpretacion.', ['EvidenceMap'], { allowsUnknown: false });
      add('core', 'Cual es el foco actualizado y que hipotesis pasa a Step 2?', 'updatedFocusAndHypothesis', true, 'Step 2 se configura desde este foco confirmado.', ['ValidationFocus', 'EvidenceMap'], { allowsUnknown: false });
      add('core', 'Decision de continuidad: mantener, acotar, reformular, cambiar, pausar, cerrar o avanzar con observaciones.', 'continuityDecision', true, 'Step 1 no cierra sin decision revisada por usuario.', ['PRD-03:CP-1.4'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-2.1') {
      add('previous_answer', 'Cual es el resultado esperado de la apuesta?', 'expectedOutcome', true, 'Los criterios de diseno parten del foco confirmado de Step 1.', ['Step1ConfirmedOutput'], { allowsUnknown: false });
      add('core', 'Define criterios de exito, evidencia esperada y tiempo hasta senal.', 'successCriteria', true, 'Step 2 necesita criterios para comparar alternativas.', ['PRD-03:CP-2.1'], { allowsUnknown: false });
      add('core', 'Que restricciones, guardrails y condiciones no negociables aplican?', 'constraintsGuardrails', true, 'La seleccion debe respetar restricciones y guardrails.', ['Step1ConfirmedOutput']);
      add('core', 'Cual es el nivel de reversibilidad de la apuesta?', 'reversibilityLevel', true, 'La reversibilidad ajusta riesgo y modalidad de prueba.', ['PRD-03:CP-2.1'], { answerType: 'single_choice' });
      if (masterContext.companySnapshot) {
        const influence = this.buildCompanyInfluence(masterContext.companySnapshot, 'guardrails');
        add('company_context', 'Confirma que guardrails empresariales deben afectar el diseno.', 'companyGuardrails', false, influence.reason, influence.sourceRefs, { contextDerived: true, confirmationRequired: influence.confirmationStatus !== 'confirmed' });
      }
    }
    if (checkpointKey === 'CP-2.2') {
      add('method_catalog', 'Registra o genera alternativas suficientes para esta ruta, incluyendo opcion de no hacer nada si aplica.', 'alternatives', true, 'No se exige idear 10 opciones; se comparan alternativas pertinentes.', ['PRD-03:CP-2.2'], { allowsUnknown: false });
      add('route', 'Que modalidad aplica: build, buy, partner, implementar, coordinar, recuperar o no hacer nada?', 'implementationModes', true, 'La modalidad cambia por routeType y madurez.', [String(masterContext.routeType ?? '')], { answerType: 'multi_choice' });
      add('previous_answer', 'Que evidenceRefs respaldan cada alternativa?', 'alternativeEvidenceRefs', true, 'Las alternativas deben preservar trazabilidad a evidencia.', ['EvidenceMap'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-2.3') {
      add('core', 'Compara alternativas por valor, alineamiento, factibilidad, viabilidad, riesgo, reversibilidad, tiempo hasta senal, carga operativa y compatibilidad empresarial.', 'comparison', true, 'La apuesta seleccionada debe tener comparacion explicita.', ['AlternativeSet'], { allowsUnknown: false });
      add('core', 'Cual es la apuesta principal, cual es el backup y por que?', 'selectedBet', true, 'El output requiere apuesta, backup y justificacion.', ['PRD-03:CP-2.3'], { allowsUnknown: false });
      add('previous_answer', 'Que supuestos, riesgos y evidenceRefs sustentan la seleccion?', 'selectedBetEvidenceRefs', true, 'La seleccion debe preservar evidencia y supuestos.', ['EvidenceMap', 'AlternativeSet'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-2.4') {
      add('route', 'Describe la prueba o ejecucion: alcance, participantes, baseline, metrica, umbral y duracion.', 'executionDesign', true, 'Cada ruta produce un diseno ejecutable.', [String(masterContext.routeType ?? '')], { allowsUnknown: false });
      add('core', 'Quienes son responsables, que recursos se requieren y que evidencia se capturara?', 'ownersResourcesEvidence', true, 'El diseno debe poder ejecutarse y medirse.', ['SelectedBet']);
      add('core', 'Define riesgos, guardrails y criterio Go/No-Go.', 'goNoGoCriteria', true, 'El cierre de Step 2 prepara la decision futura.', ['PRD-03:CP-2.4'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-2.5') {
      add('core', 'Confirma owner, tiempo, recursos, datos, tecnologia, permisos, seguridad y presupuesto.', 'readinessChecklist', true, 'Readiness se activa para iniciativas complejas, transversales, reguladas, con dependencias, implementacion o alto riesgo.', ['PRD-03:CP-2.5'], { allowsUnknown: false });
      add('core', 'Que dependencias, bloqueos y plan alternativo quedan?', 'dependenciesAndFallback', true, 'Sin plan alternativo, una apuesta riesgosa no debe avanzar sin observaciones.', ['SelectedBet']);
    }
    if (checkpointKey === 'CP-3.1') {
      add('previous_answer', 'Confirma hipotesis, prueba o plan, alcance, baseline, metrica, umbral y guardrails transferidos desde Step 2.', 'step3TransferConfirmation', true, 'Step 3 se configura desde el output confirmado de Step 2.', ['Step2ConfirmedOutput'], { allowsUnknown: false });
      add('core', 'Que requisitos ya estan cumplidos para ejecutar y cuales faltan?', 'executionReadinessChecklist', true, 'CP-3.1 genera ExecutionReadiness antes de operar.', ['PRD-03:CP-3.1'], { allowsUnknown: false });
      add('core', 'Que permisos, dependencias, bloqueos, actores requeridos y fallbackPlan aplican?', 'executionDependencies', true, 'La ejecucion debe distinguir quick wins de implementaciones complejas y hard gates.', ['Step2Readiness'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-3.2') {
      add('core', 'Registra actividades, mediciones, observaciones, entrevistas, incidentes, decisiones o evidencias relevantes de ejecucion.', 'executionRecords', true, 'CP-3.2 registra hechos relevantes, no cada clic ni edicion menor.', ['PRD-03:CP-3.2'], { allowsUnknown: false });
      add('core', 'Que sourceRefs o evidenceRefs respaldan esos registros?', 'executionSourceRefs', true, 'Los registros operativos deben preservar trazabilidad.', ['ExecutionLog'], { allowsUnknown: false });
      add('core', 'Hubo cambios de alcance, hipotesis, dependencias o riesgos criticos?', 'criticalExecutionChanges', false, 'Los cambios criticos alimentan CriticalChangeReview.', ['CriticalChangeReview']);
    }
    if (checkpointKey === 'CP-3.3') {
      add('core', 'Compara baseline, resultado, umbral, adopcion, esfuerzo, carga operativa, riesgos y efectos no previstos.', 'resultComparison', true, 'CP-3.3 analiza resultado contra el diseno de ejecucion.', ['ExecutionDesign', 'ExecutionLog'], { allowsUnknown: false });
      add('core', 'Clasifica la hipotesis y separa evidencia que apoya, contradice o limita la interpretacion.', 'hypothesisClassification', true, 'La IA puede proponer interpretacion, pero el usuario debe confirmarla.', ['PRD-03:CP-3.3'], { allowsUnknown: false });
      add('core', 'Confirma interpretacion, limitaciones y efectos inesperados.', 'confirmedInterpretation', true, 'Step 3 no debe avanzar a decision sin interpretacion confirmada.', ['ExperimentResultAnalysis'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-3.4') {
      add('core', 'Elige decision: iterate, repeat_test, expand_sample, change_scope, pivot, scale_pilot, continue_implementation, transfer, integrate_to_roadmap, pause, close_with_learning o reformulate_challenge.', 'decision', true, 'Step 3 no cierra automaticamente; requiere decision del usuario.', ['PRD-03:CP-3.4'], { answerType: 'single_choice', allowsUnknown: false });
      add('core', 'Explica rationale, riesgos, incertidumbres restantes, nextAction, owner, dueDate y requiredApprover.', 'decisionDetails', true, 'La decision debe ser ejecutable y trazable.', ['ExperimentResultAnalysis'], { allowsUnknown: false });
      add('previous_answer', 'Que evidenceRefs sustentan la decision?', 'decisionEvidenceRefs', true, 'La decision debe estar respaldada por evidencia.', ['ExecutionLog', 'ExperimentResultAnalysis'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-3.5') {
      add('core', 'Confirma owner futuro, soporte, mantenimiento, infraestructura, seguridad, presupuesto, adopcion, documentacion, metricas, rollback y aceptacion del area receptora.', 'operationalReadinessChecklist', true, 'CP-3.5 solo aplica cuando la decision operacionaliza o escala.', ['PRD-03:CP-3.5'], { allowsUnknown: false });
      add('core', 'Que bloqueos, aprobadores o plan alternativo quedan para operacionalizar?', 'operationalBlockers', true, 'El escalamiento no debe avanzar sin readiness operacional visible.', ['Step3Decision'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-4.1') {
      add('previous_answer', 'Confirma decision, resultados, evidencia, limitaciones, riesgos, proximo paso, owner y aprobador transferidos desde Step 3.', 'step4TransferConfirmation', true, 'Step 4 se configura desde output confirmado de Step 3.', ['Step3ConfirmedOutput'], { allowsUnknown: false });
      add('core', 'Quien es la audiencia primaria, decision maker, audiencias secundarias y deadline?', 'decisionAudience', true, 'CP-4.1 define audiencia y decision solicitada antes de redactar narrativa.', ['PRD-03:CP-4.1'], { allowsUnknown: false });
      add('core', 'Que decision se solicita, que evidencia requieren, que objeciones anticipan y que formato prefieren?', 'audienceDecisionNeeds', true, 'El paquete debe responder a necesidades reales de decision, no forzar pitch.', ['Step3Decision'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-4.2') {
      add('core', 'Redacta narrativa con contexto, foco, hipotesis, apuesta, ejecucion, resultados, aprendizajes, contradicciones, riesgos, limitaciones, recomendacion y proximo paso.', 'evidenceNarrative', true, 'CP-4.2 produce narrativa respaldada por evidencia.', ['PRD-03:CP-4.2'], { allowsUnknown: false });
      add('previous_answer', 'Que evidenceRefs/sourceRefs respaldan las afirmaciones criticas y que limitaciones mantienen?', 'narrativeEvidenceRefs', true, 'Toda afirmacion critica debe preservar trazabilidad y confianza.', ['Step3Output'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-4.3') {
      add('route', 'Define el siguiente horizonte segun decision: roadmap, transferencia, operacion, iteracion o cierre.', 'nextHorizonPlan', true, 'CP-4.3 materializa el plan posterior adecuado al decisionType.', ['Step3Decision'], { allowsUnknown: false });
      add('core', 'Incluye fases, alcance, owner, recursos, inversion, gobernanza, adopcion, riesgos, metricas, hitos, dependencias, rollback y seguimiento segun aplique.', 'nextHorizonDetails', true, 'El horizonte debe ser ejecutable pero minimo.', ['PRD-03:CP-4.3'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-4.4') {
      add('core', 'Que artefactos minimos necesita esta audiencia: one-pager, memo, business case, pilot report, deck outline, implementation plan, handoff, learning report o closure report?', 'decisionArtifacts', true, 'No se generan todos los artefactos por defecto.', ['PRD-03:CP-4.4'], { allowsUnknown: false });
      add('previous_answer', 'Confirma version, autor, fecha, limitaciones y evidenceRefs por artefacto.', 'artifactTraceability', true, 'Cada artefacto debe ser editable y trazable.', ['EvidenceBackedNarrative'], { allowsUnknown: false });
    }
    if (checkpointKey === 'CP-4.5') {
      add('core', 'Registra transferencia, decision final o cierre: receptor, aceptacion, recursos, documentacion, capacitacion, soporte, permisos, fecha, metricas y seguimiento segun aplique.', 'transferOrClosure', true, 'CP-4.5 materializa transferencia o cierre organizacional.', ['PRD-03:CP-4.5'], { allowsUnknown: false });
      add('core', 'Confirma estado final: completed, transferred, scaled, integrated_to_roadmap, closed_with_learning, paused o new_iteration_required.', 'finalState', true, 'El estado final se separa de resultado de hipotesis y contribucion al reto.', ['PRD-03:Estados finales'], { answerType: 'single_choice', allowsUnknown: false });
      add('challenge_context', 'Como cambia la cobertura del reto sin marcarlo automaticamente como resuelto?', 'challengeCoverageUpdate', false, 'La cobertura final se actualiza con contribucion, evidencia, solapamiento y metricas.', ['ChallengeContribution']);
    }
    return questions;
  }

  private async materializeCheckpointTx(tx: any, projectId: string, config: any, checkpointKey: string, previousAnswers: Record<string, unknown>[], userId?: string, idempotencyKey?: string) {
    const spec = [...STEP0_CHECKPOINTS, ...STEP1_CHECKPOINTS, ...STEP2_CHECKPOINTS, ...STEP3_CHECKPOINTS, ...STEP4_CHECKPOINTS].find((cp) => cp.key === checkpointKey);
    if (!spec) throw new Error(`Unsupported checkpoint ${checkpointKey}`);
    const exists = await tx.adaptiveCheckpointInstance.findFirst({ where: { projectId, stepConfigurationId: config.id, checkpointKey } });
    if (exists) return exists;
    const questions = this.buildQuestions(checkpointKey, config.version, config.sourceContextJson ?? {}, previousAnswers);
    const created = await tx.adaptiveCheckpointInstance.create({
      data: {
        projectId,
        stepConfigurationId: config.id,
        stepNumber: checkpointKey.startsWith('CP-4') ? 4 : checkpointKey.startsWith('CP-3') ? 3 : checkpointKey.startsWith('CP-2') ? 2 : checkpointKey.startsWith('CP-1') ? 1 : 0,
        checkpointKey,
        sequence: spec.sequence,
        status: 'ready',
        materializedQuestionsJson: questions,
        idempotencyKey,
      },
    });
    await this.recordEventTx(tx, projectId, 'checkpoint_started', `${checkpointKey} iniciado.`, { checkpointKey, questionCount: questions.length }, userId, idempotencyKey ? `${idempotencyKey}:event` : undefined);
    return created;
  }

  private evaluateCheckpoint(checkpointKey: string, responses: Record<string, unknown>, previous: Record<string, unknown>[]) {
    const requiredByCheckpoint: Record<string, string[]> = {
      'CP-0.1': ['objective'],
      'CP-0.2': ['scope', 'owner_and_actor_required'],
      'CP-0.3': ['priorityHypothesis', 'decisionCriteria'],
      'CP-1.1': ['mainHypothesis', 'criticalAssumption', 'learningQuestion', 'riskOfBeingWrong', 'dependentDecision'],
      'CP-1.2': ['methods', 'sourcesAndActors', 'responsibleAndDates', 'expectedEvidenceAndSufficiency'],
      'CP-1.3': ['evidenceItems', 'evidenceClassifications', 'sourceRefs'],
      'CP-1.4': ['synthesis', 'updatedFocusAndHypothesis', 'continuityDecision'],
      'CP-2.1': ['expectedOutcome', 'successCriteria', 'constraintsGuardrails', 'reversibilityLevel'],
      'CP-2.2': ['alternatives', 'implementationModes', 'alternativeEvidenceRefs'],
      'CP-2.3': ['comparison', 'selectedBet', 'selectedBetEvidenceRefs'],
      'CP-2.4': ['executionDesign', 'ownersResourcesEvidence', 'goNoGoCriteria'],
      'CP-2.5': ['readinessChecklist', 'dependenciesAndFallback'],
      'CP-3.1': ['step3TransferConfirmation', 'executionReadinessChecklist', 'executionDependencies'],
      'CP-3.2': ['executionRecords', 'executionSourceRefs'],
      'CP-3.3': ['resultComparison', 'hypothesisClassification', 'confirmedInterpretation'],
      'CP-3.4': ['decision', 'decisionDetails', 'decisionEvidenceRefs'],
      'CP-3.5': ['operationalReadinessChecklist', 'operationalBlockers'],
      'CP-4.1': ['step4TransferConfirmation', 'decisionAudience', 'audienceDecisionNeeds'],
      'CP-4.2': ['evidenceNarrative', 'narrativeEvidenceRefs'],
      'CP-4.3': ['nextHorizonPlan', 'nextHorizonDetails'],
      'CP-4.4': ['decisionArtifacts', 'artifactTraceability'],
      'CP-4.5': ['transferOrClosure', 'finalState'],
    };
    const required = requiredByCheckpoint[checkpointKey] ?? [];
    const missing = required.filter((field) => !this.hasValue(responses[field]));
    return { sufficient: missing.length === 0, missing, previousResponseCount: previous.length };
  }

  private buildStep0Brief(masterContext: any, responses: Record<string, any>[]): Step0AlignmentBrief {
    const merged = Object.assign({}, ...responses);
    return {
      intention: String(merged.objective ?? masterContext.knownFacts?.[0] ?? ''),
      origin: String(merged.origin ?? 'revision_inicial'),
      challengeType: String(merged.challengeType ?? masterContext.challengeType ?? ''),
      objective: String(merged.objective ?? ''),
      scope: String(merged.scope ?? ''),
      inclusions: this.toList(merged.inclusions),
      exclusions: this.toList(merged.exclusions),
      output: String(merged.output ?? masterContext.decisions?.[0] ?? ''),
      adoption: String(merged.adoption ?? ''),
      outcome: String(merged.outcome ?? ''),
      actors: this.compact([merged.owner_and_actor_required, ...(masterContext.companySnapshot?.actors ?? []), masterContext.challengeSnapshot?.challengeOwner]),
      restrictions: this.compact([merged.company_constraints, ...(masterContext.companySnapshot?.restrictions ?? [])]),
      facts: masterContext.knownFacts ?? [],
      signals: this.compact([merged.availableEvidence, merged.signal, ...(masterContext.knownFacts ?? []).slice(1)]),
      assumptions: this.compact([...(masterContext.assumptions ?? []), merged.priorityHypothesis]),
      priorityHypothesis: String(merged.priorityHypothesis ?? masterContext.assumptions?.[0] ?? ''),
      validationQuestions: this.compact([merged.validationQuestion, ...(masterContext.missingCriticalInformation ?? [])]),
      decisionCriteria: String(merged.decisionCriteria ?? masterContext.decisions?.[0] ?? ''),
      availableEvidence: this.compact([merged.availableEvidence, merged.currentEvidence]),
      missingInformation: this.compact([...(masterContext.missingCriticalInformation ?? []), merged.missingInformation]),
    };
  }

  private buildStep1Output(masterContext: any, responses: Record<string, any>[]) {
    const merged = Object.assign({}, ...responses);
    const routeType = (masterContext.routeType ?? 'explore_validate') as AdaptiveRouteType;
    const outputKey = STEP1_OUTPUT_BY_ROUTE[routeType];
    const evidenceItems = this.normalizeEvidenceItems(merged.evidenceItems, merged.evidenceClassifications, merged.sourceRefs);
    const classifications = evidenceItems.map((item) => item.classification);
    const contradictions = evidenceItems.filter((item) => item.classification === 'contradicts');
    const insufficient = evidenceItems.filter((item) => item.classification === 'insufficient' || item.classification === 'weak_signal');
    const supports = evidenceItems.filter((item) => item.classification === 'supports');
    const companyInfluences = this.buildCompanyInfluences(masterContext.companySnapshot);
    const sufficiency = supports.length > 0 && contradictions.length === 0 && insufficient.length <= supports.length ? 'sufficient' : 'partial';
    const blocker = contradictions[0]?.summary ?? insufficient[0]?.summary ?? '';
    const validationFocus = {
      mainHypothesis: String(merged.mainHypothesis ?? merged.validationFocus ?? masterContext.step0Output?.priorityHypothesis ?? ''),
      criticalAssumption: String(merged.criticalAssumption ?? ''),
      learningQuestion: String(merged.learningQuestion ?? ''),
      riskOfBeingWrong: String(merged.riskOfBeingWrong ?? ''),
      dependentDecision: String(merged.dependentDecision ?? masterContext.step0Output?.decisionCriteria ?? ''),
      sourceRefs: ['Step0AlignmentBrief', ...this.sourceRefsFrom(merged.sourceRefs)],
    };
    const evidencePlan = {
      suggestedMethods: this.suggestEvidenceMethods(validationFocus.mainHypothesis, routeType, masterContext),
      methods: this.toList(merged.methods),
      sourcesAndActors: this.toList(merged.sourcesAndActors),
      responsibleAndDates: this.toList(merged.responsibleAndDates),
      expectedEvidenceAndSufficiency: String(merged.expectedEvidenceAndSufficiency ?? ''),
      companyInfluences,
    };
    const evidenceMap = {
      items: evidenceItems,
      classifications,
      conclusions: this.toList(merged.synthesis).map((conclusion, index) => ({
        conclusion,
        sourceRefs: evidenceItems[index]?.sourceRefs?.length ? evidenceItems[index].sourceRefs : this.sourceRefsFrom(merged.sourceRefs),
      })),
    };
    const updatedFocus = String(merged.updatedFocusAndHypothesis ?? validationFocus.mainHypothesis);
    const continuityDecision = String(merged.continuityDecision ?? 'avanzar_con_observaciones');
    return {
      outputKey,
      routeType,
      validationFocus,
      evidencePlan,
      evidenceMap,
      facts: this.toList(merged.facts),
      contradictions: contradictions.map((item) => item.summary),
      gaps: this.compact([merged.gaps, ...insufficient.map((item) => item.summary)]),
      learning: String(merged.synthesis ?? ''),
      updatedFocus,
      hypothesisForStep2: updatedFocus,
      continuityDecision,
      sufficiency,
      evidenceSummary: `${supports.length} evidencia(s) apoyan; ${contradictions.length} contradicen; ${insufficient.length} son debiles o insuficientes.`,
      blocker,
      actorRequired: String(merged.companyValidator ?? masterContext.companySnapshot?.actors?.[0] ?? masterContext.challengeSnapshot?.challengeOwner ?? 'Owner de iniciativa'),
      futureDecision: validationFocus.dependentDecision,
      sourceRefs: Array.from(new Set(['Step0AlignmentBrief', ...evidenceItems.flatMap((item) => item.sourceRefs)])),
      challengeContribution: masterContext.challengeSnapshot ? {
        challengeId: masterContext.challengeSnapshot.id,
        contribution: continuityDecision === 'cerrar' ? 'aprendizaje para reformular o cerrar' : 'evidencia para decidir foco del reto',
        evidenceStrength: sufficiency === 'sufficient' ? 'medium' : 'weak',
      } : null,
      createdAt: new Date().toISOString(),
    };
  }

  private buildStep2MasterContext(masterContext: any, step1Output: Record<string, any>) {
    return {
      ...masterContext,
      version: Number(masterContext.version ?? 1) + 1,
      step1Output,
      knownFacts: this.compact([...(masterContext.knownFacts ?? []), ...(step1Output.facts ?? []), step1Output.evidenceSummary]),
      assumptions: this.compact([step1Output.hypothesisForStep2, ...(masterContext.assumptions ?? [])]),
      missingCriticalInformation: this.compact([...(step1Output.gaps ?? []), ...(masterContext.missingCriticalInformation ?? [])]),
      risks: this.compact([step1Output.blocker, ...(masterContext.risks ?? [])]),
      decisions: this.compact([step1Output.futureDecision, step1Output.continuityDecision, ...(masterContext.decisions ?? [])]),
      step2Transfer: {
        focus: step1Output.updatedFocus,
        hypothesis: step1Output.hypothesisForStep2,
        evidence: step1Output.evidenceMap,
        restrictions: masterContext.step0Output?.restrictions ?? [],
        criteria: step1Output.validationFocus?.dependentDecision ?? step1Output.futureDecision,
        baseline: step1Output.evidenceSummary,
        actors: this.compact([step1Output.actorRequired, ...(masterContext.step0Output?.actors ?? [])]),
        futureDecision: step1Output.futureDecision,
      },
    };
  }

  private buildStep2Output(masterContext: any, responses: Record<string, any>[]) {
    const merged = Object.assign({}, ...responses);
    const routeType = (masterContext.routeType ?? 'explore_validate') as AdaptiveRouteType;
    const step1Output = masterContext.step1Output ?? {};
    const outputKey = STEP2_OUTPUT_BY_ROUTE[routeType];
    const designCriteria = {
      expectedOutcome: String(merged.expectedOutcome ?? step1Output.updatedFocus ?? ''),
      successCriteria: this.toList(merged.successCriteria),
      constraints: this.compact([merged.constraintsGuardrails, ...(step1Output.validationFocus?.restrictions ?? []), ...(masterContext.step2Transfer?.restrictions ?? [])]),
      guardrails: this.compact([merged.companyGuardrails, ...(masterContext.companySnapshot?.restrictions ?? [])]),
      nonNegotiables: this.toList(merged.nonNegotiables ?? merged.constraintsGuardrails),
      reversibilityLevel: String(merged.reversibilityLevel ?? 'medium'),
      timeToSignal: String(merged.timeToSignal ?? merged.successCriteria ?? ''),
      expectedEvidence: this.toList(merged.expectedEvidence ?? merged.successCriteria),
      companyInfluences: this.buildCompanyInfluences(masterContext.companySnapshot),
    };
    const alternatives = this.normalizeAlternatives(merged.alternatives, merged.alternativeEvidenceRefs, routeType);
    const selectedBet = this.normalizeSelectedBet(merged.selectedBet, alternatives, merged.selectedBetEvidenceRefs, merged.comparison);
    const execution = this.normalizeExecutionDesign(merged.executionDesign, merged.ownersResourcesEvidence, merged.goNoGoCriteria, selectedBet, routeType, step1Output);
    const readiness = this.buildReadiness(merged.readinessChecklist, merged.dependenciesAndFallback, masterContext, execution);
    const evidenceUsed = Array.from(new Set([
      ...this.sourceRefsFrom(merged.alternativeEvidenceRefs),
      ...this.sourceRefsFrom(merged.selectedBetEvidenceRefs),
      ...(step1Output.sourceRefs ?? []),
    ]));
    const risks = this.compact([merged.risks, ...(step1Output.contradictions ?? []), readiness.blockers]);
    return {
      outputKey,
      routeType,
      designCriteria,
      alternativeSet: {
        routeType,
        alternatives,
        generationRule: routeType === 'lightweight_plan' ? 'lightweight_not_10_ideas' : 'fit_for_route_not_fixed_count',
      },
      selectedBet,
      executionDesign: execution,
      readiness,
      hypothesis: String(selectedBet.hypothesis ?? step1Output.hypothesisForStep2 ?? step1Output.updatedFocus ?? ''),
      testOrExecution: execution.testOrExecution,
      scope: execution.scope,
      participants: execution.participants,
      baseline: execution.baseline,
      metric: execution.metric,
      threshold: execution.threshold,
      duration: execution.duration,
      responsibles: execution.responsibles,
      resources: execution.resources,
      evidence: execution.evidence,
      evidenceUsed,
      guardrails: designCriteria.guardrails,
      goNoGoCriteria: execution.goNoGoCriteria,
      risks,
      challengeContribution: masterContext.challengeSnapshot ? {
        challengeId: masterContext.challengeSnapshot.id,
        selectedBet: selectedBet.primary,
        contribution: `Apuesta ${selectedBet.primary} aporta evidencia para ${masterContext.challengeSnapshot.title ?? 'el reto'}.`,
        evidenceStrength: evidenceUsed.length > 0 ? 'medium' : 'weak',
      } : null,
      createdAt: new Date().toISOString(),
    };
  }

  private buildStep3MasterContext(masterContext: any, step2Output: Record<string, any>) {
    return {
      ...masterContext,
      version: Number(masterContext.version ?? 1) + 1,
      step2Output,
      knownFacts: this.compact([...(masterContext.knownFacts ?? []), ...(step2Output.evidenceUsed ?? [])]),
      assumptions: this.compact([step2Output.hypothesis, ...(masterContext.assumptions ?? [])]),
      missingCriticalInformation: this.compact([...(step2Output.readiness?.blockers ?? []), ...(masterContext.missingCriticalInformation ?? [])]),
      risks: this.compact([...(step2Output.risks ?? []), ...(masterContext.risks ?? [])]),
      decisions: this.compact([step2Output.goNoGoCriteria, ...(masterContext.decisions ?? [])]),
      step3Transfer: {
        selectedBet: step2Output.selectedBet,
        hypothesis: step2Output.hypothesis,
        executionDesign: step2Output.executionDesign,
        readiness: step2Output.readiness,
        goNoGoCriteria: step2Output.goNoGoCriteria,
      },
    };
  }

  private buildStep3Output(masterContext: any, responses: Record<string, any>[]) {
    const merged = Object.assign({}, ...responses);
    const routeType = (masterContext.routeType ?? 'explore_validate') as AdaptiveRouteType;
    const step2Output = masterContext.step2Output ?? {};
    const executionDesign = step2Output.executionDesign ?? {};
    const outputKey = STEP3_OUTPUT_BY_ROUTE[routeType];
    const executionReadiness = this.buildExecutionReadiness(merged, masterContext, step2Output);
    const executionLog = this.buildExecutionLog(merged, masterContext);
    const resultAnalysis = this.buildResultAnalysis(merged, executionLog, step2Output);
    const decision = this.buildStep3Decision(merged, resultAnalysis, executionDesign);
    const operationalReadiness = this.shouldActivateOperationalReadiness(masterContext, responses)
      ? this.buildOperationalReadiness(merged, decision, executionReadiness)
      : null;
    const challengeContribution = this.buildStep3ChallengeContribution(masterContext, step2Output, resultAnalysis, decision);
    return {
      outputKey,
      routeType,
      hypothesis: String(step2Output.hypothesis ?? executionDesign.hypothesis ?? ''),
      selectedBet: step2Output.selectedBet ?? null,
      executionSummary: {
        testOrExecution: String(step2Output.testOrExecution ?? executionDesign.testOrExecution ?? ''),
        scope: String(step2Output.scope ?? executionDesign.scope ?? ''),
        baseline: String(step2Output.baseline ?? executionDesign.baseline ?? ''),
        metric: String(step2Output.metric ?? executionDesign.metric ?? ''),
        threshold: String(step2Output.threshold ?? executionDesign.threshold ?? ''),
        participants: this.toList(step2Output.participants ?? executionDesign.participants),
        responsibles: this.toList(step2Output.responsibles ?? executionDesign.responsibles),
        guardrails: this.toList(step2Output.guardrails ?? executionDesign.guardrails),
        expectedEvidence: this.toList(step2Output.evidence ?? executionDesign.evidence),
      },
      executionReadiness,
      executionLog,
      resultAnalysis,
      decision,
      operationalReadiness,
      sourceRefs: Array.from(new Set([
        ...(step2Output.evidenceUsed ?? []),
        ...this.sourceRefsFrom(merged.executionSourceRefs),
        ...this.sourceRefsFrom(merged.decisionEvidenceRefs),
      ])),
      challengeContribution,
      createdAt: new Date().toISOString(),
    };
  }

  private buildExecutionReadiness(merged: Record<string, any>, masterContext: any, step2Output: Record<string, any>) {
    const checklist = this.toList(merged.executionReadinessChecklist);
    const dependencies = this.toList(merged.executionDependencies);
    const lowCoverage = Boolean(masterContext.companySnapshot?.lowCoverage);
    const criticalRestriction = this.compact([...(masterContext.companySnapshot?.restrictions ?? []), ...(step2Output.guardrails ?? [])])
      .some((item) => /critica|critico|seguridad|regulad|legal|permiso|hard gate/i.test(item));
    const missing = checklist.filter((item) => this.isReadinessGap(item));
    const blockers = criticalRestriction
      ? this.compact([dependencies.filter((item) => this.isReadinessBlocker(item)), missing])
      : dependencies.filter((item) => this.isReadinessBlocker(item) && /bloque/i.test(item));
    const status = blockers.length > 0 ? 'blocked' : missing.length > 0 ? 'ready_with_observations' : 'ready';
    return {
      readinessStatus: status,
      reviewMode: step2Output.readiness?.required || masterContext.depthLevel === 'extended' || criticalRestriction ? 'expanded' : 'lightweight',
      fulfilledRequirements: checklist.filter((item) => !missing.includes(item)),
      missingRequirements: lowCoverage ? missing.map((item) => `${item} (confirmable)`) : missing,
      blockers,
      actorsRequired: this.compact([merged.actorRequired, step2Output.responsibles?.[0], masterContext.challengeSnapshot?.challengeOwner]),
      permissions: dependencies.filter((item) => /permiso|aprob/i.test(item)),
      dependencies,
      fallbackPlan: dependencies.find((item) => /fallback|alternativo|plan b/i.test(item)) ?? step2Output.readiness?.fallbackPlan ?? '',
      hardGate: criticalRestriction && blockers.length > 0,
      companyContextLowCoverage: lowCoverage,
    };
  }

  private buildExecutionLog(merged: Record<string, any>, masterContext: any) {
    const refs = this.sourceRefsFrom(merged.executionSourceRefs);
    const records = this.normalizeExecutionRecords(merged.executionRecords, refs);
    const criticalChanges = this.toList(merged.criticalExecutionChanges).map((change, index) => this.buildCriticalChangeReview({
      idempotencyKey: `step3-critical-${index + 1}`,
      field: change.toLowerCase().includes('hipotes') ? 'hypothesis' : 'scope',
      previousValue: null,
      nextValue: change,
      reason: 'Detectado durante CP-3.2 Execution Log.',
      confirmed: true,
      action: 'update_route',
    } as CriticalChangeInput));
    return {
      records,
      deviations: records.filter((record) => /desvi|scope|alcance|incidente|riesgo/i.test(`${record.type} ${record.description}`)).map((record) => record.title),
      criticalChanges,
      sourceRefs: refs,
      challengeContext: masterContext.challengeSnapshot?.id ?? null,
    };
  }

  private buildResultAnalysis(merged: Record<string, any>, executionLog: Record<string, any>, step2Output: Record<string, any>) {
    const comparison = typeof merged.resultComparison === 'object' && merged.resultComparison !== null ? merged.resultComparison as Record<string, any> : {};
    const classification = this.normalizeHypothesisClassification(merged.hypothesisClassification, executionLog.records);
    const supportRefs = this.sourceRefsFrom(comparison.supportingEvidenceRefs ?? merged.supportingEvidenceRefs ?? merged.executionSourceRefs);
    const contradictRefs = this.sourceRefsFrom(comparison.contradictingEvidenceRefs ?? merged.contradictingEvidenceRefs);
    const limitations = this.toList(comparison.limitations ?? merged.limitations);
    const unexpectedEffects = this.toList(comparison.unexpectedEffects ?? merged.unexpectedEffects);
    const evidenceStrength = classification === 'supported'
      ? 'strong'
      : classification === 'partially_supported' || classification === 'mixed_signal'
        ? 'medium'
        : supportRefs.length || contradictRefs.length
          ? 'weak'
          : 'insufficient';
    return {
      baseline: String(comparison.baseline ?? step2Output.baseline ?? ''),
      result: String(comparison.result ?? comparison.outcome ?? ''),
      threshold: String(comparison.threshold ?? step2Output.threshold ?? ''),
      adoption: String(comparison.adoption ?? ''),
      effort: String(comparison.effort ?? ''),
      operationalLoad: String(comparison.operationalLoad ?? comparison.cargaOperativa ?? ''),
      risks: this.toList(comparison.risks ?? step2Output.risks),
      unexpectedEffects,
      classification,
      evidenceStrength,
      supportingEvidenceRefs: supportRefs,
      contradictingEvidenceRefs: contradictRefs,
      limitations,
      interpretation: String(merged.confirmedInterpretation ?? comparison.interpretation ?? `Resultado clasificado como ${classification}.`),
      userConfirmed: this.hasValue(merged.confirmedInterpretation),
    };
  }

  private buildStep3Decision(merged: Record<string, any>, resultAnalysis: Record<string, any>, executionDesign: Record<string, any>) {
    const details = typeof merged.decisionDetails === 'object' && merged.decisionDetails !== null ? merged.decisionDetails as Record<string, any> : {};
    const rawDecision = typeof merged.decision === 'object' && merged.decision !== null ? merged.decision as Record<string, any> : { decision: merged.decision };
    const decision = String(rawDecision.decision ?? rawDecision.type ?? merged.decision ?? 'iterate');
    return {
      decision,
      rationale: String(rawDecision.rationale ?? details.rationale ?? resultAnalysis.interpretation ?? ''),
      evidenceRefs: this.sourceRefsFrom(rawDecision.evidenceRefs ?? details.evidenceRefs ?? merged.decisionEvidenceRefs),
      risks: this.toList(rawDecision.risks ?? details.risks ?? resultAnalysis.risks),
      remainingUncertainties: this.toList(rawDecision.remainingUncertainties ?? details.remainingUncertainties ?? resultAnalysis.limitations),
      nextAction: String(rawDecision.nextAction ?? details.nextAction ?? executionDesign.goNoGoCriteria ?? ''),
      owner: String(rawDecision.owner ?? details.owner ?? executionDesign.responsibles?.[0] ?? 'Owner de iniciativa'),
      dueDate: String(rawDecision.dueDate ?? details.dueDate ?? ''),
      requiredApprover: String(rawDecision.requiredApprover ?? details.requiredApprover ?? ''),
    };
  }

  private buildOperationalReadiness(merged: Record<string, any>, decision: Record<string, any>, executionReadiness: Record<string, any>) {
    const checklist = this.toList(merged.operationalReadinessChecklist);
    const blockers = this.compact([
      checklist.filter((item) => this.isReadinessGap(item)),
      this.toList(merged.operationalBlockers).filter((item) => this.isReadinessGap(item) || this.isReadinessBlocker(item)),
    ]);
    return {
      required: true,
      status: blockers.length > 0 ? 'blocked' : 'ready_with_observations',
      futureOwner: checklist.find((item) => /owner|dueno|responsable/i.test(item)) ?? decision.owner,
      support: checklist.filter((item) => /soporte|mantenimiento/i.test(item)),
      infrastructure: checklist.filter((item) => /infra|tecnolog/i.test(item)),
      security: checklist.filter((item) => /seguridad|permiso/i.test(item)),
      budget: checklist.filter((item) => /presupuesto|costo/i.test(item)),
      adoption: checklist.filter((item) => /adopcion|aceptacion/i.test(item)),
      documentation: checklist.filter((item) => /document/i.test(item)),
      metrics: checklist.filter((item) => /metrica|metric/i.test(item)),
      rollback: checklist.find((item) => /rollback|reversa|retroceso/i.test(item)) ?? executionReadiness.fallbackPlan ?? '',
      receivingAreaAcceptance: checklist.find((item) => /area receptora|aceptacion/i.test(item)) ?? '',
      blockers,
      requiredApprover: decision.requiredApprover,
    };
  }

  private isReadinessGap(item: string) {
    const normalized = item.trim().toLowerCase();
    if (/^sin (faltantes|pendientes|bloqueos|riesgos)/i.test(normalized)) {
      return false;
    }
    return /falt|pendiente|sin |no confirmado|bloque|riesgo/i.test(item);
  }

  private isReadinessBlocker(item: string) {
    const normalized = item.trim().toLowerCase();
    if (/^sin (bloqueos|pendientes|riesgos)/i.test(normalized)) {
      return false;
    }
    return /bloque|permiso|seguridad|regulad|legal|pendiente|hard gate/i.test(item);
  }

  private buildStep4MasterContext(masterContext: any, step3Output: Record<string, any>) {
    return {
      ...masterContext,
      version: Number(masterContext.version ?? 1) + 1,
      step3Output,
      knownFacts: this.compact([...(masterContext.knownFacts ?? []), step3Output.resultAnalysis?.interpretation]),
      assumptions: this.compact([step3Output.hypothesis, ...(masterContext.assumptions ?? [])]),
      missingCriticalInformation: this.compact([...(step3Output.decision?.remainingUncertainties ?? []), ...(masterContext.missingCriticalInformation ?? [])]),
      risks: this.compact([...(step3Output.decision?.risks ?? []), ...(masterContext.risks ?? [])]),
      decisions: this.compact([step3Output.decision?.decision, step3Output.decision?.nextAction, ...(masterContext.decisions ?? [])]),
      step4Transfer: {
        decision: step3Output.decision,
        resultAnalysis: step3Output.resultAnalysis,
        operationalReadiness: step3Output.operationalReadiness,
        challengeContribution: step3Output.challengeContribution,
      },
    };
  }

  private buildStep4Output(masterContext: any, responses: Record<string, any>[]) {
    const merged = Object.assign({}, ...responses);
    const routeType = (masterContext.routeType ?? 'explore_validate') as AdaptiveRouteType;
    const step3Output = masterContext.step3Output ?? {};
    const decisionType = String(step3Output.decision?.decision ?? merged.finalState ?? 'close_with_learning');
    const audienceBrief = this.buildDecisionAudienceBrief(merged, masterContext, step3Output);
    const outputKey = this.step4OutputKey(routeType, decisionType, audienceBrief.preferredFormat);
    const narrative = this.buildEvidenceBackedNarrative(merged, masterContext, step3Output);
    const nextHorizon = this.buildNextHorizon(merged, decisionType, step3Output);
    const decisionPackage = this.buildDecisionPackage(merged, routeType, decisionType, audienceBrief, narrative);
    const transferOrClosure = this.buildTransferOrClosure(merged, decisionType, audienceBrief, nextHorizon);
    const finalState = this.normalizeFinalState(merged.finalState ?? transferOrClosure.finalState);
    const finalChallengeContribution = this.buildFinalChallengeContribution(masterContext, step3Output, narrative, transferOrClosure, finalState);
    const challengeCoverage = this.buildChallengeCoverage(masterContext, finalChallengeContribution, finalState, merged);
    return {
      outputKey,
      routeType,
      decisionType,
      finalState,
      hypothesis: String(step3Output.hypothesis ?? ''),
      hypothesisResult: String(step3Output.resultAnalysis?.classification ?? ''),
      organizationalDecision: transferOrClosure.finalDecision,
      recommendation: narrative.recommendation,
      audienceBrief,
      narrative,
      nextHorizon,
      decisionPackage,
      transferOrClosure,
      finalChallengeContribution,
      challengeCoverage,
      sourceRefs: Array.from(new Set([
        ...(step3Output.sourceRefs ?? []),
        ...this.sourceRefsFrom(merged.narrativeEvidenceRefs),
        ...this.sourceRefsFrom(merged.artifactTraceability),
        ...this.sourceRefsFrom(merged.challengeCoverageUpdate),
      ])),
      createdAt: new Date().toISOString(),
    };
  }

  private buildDecisionAudienceBrief(merged: Record<string, any>, masterContext: any, step3Output: Record<string, any>) {
    const audience = this.recordFrom(merged.decisionAudience);
    const needs = this.recordFrom(merged.audienceDecisionNeeds);
    const companyFormats = masterContext.companySnapshot?.formats ?? [];
    const decision = step3Output.decision ?? {};
    return {
      primaryAudience: String(audience.primaryAudience ?? audience.audience ?? needs.primaryAudience ?? decision.requiredApprover ?? 'Owner de iniciativa'),
      decisionMaker: String(audience.decisionMaker ?? audience.decisor ?? needs.decisionMaker ?? decision.requiredApprover ?? decision.owner ?? 'Owner de iniciativa'),
      secondaryAudiences: this.compact([audience.secondaryAudiences, needs.secondaryAudiences, masterContext.challengeSnapshot?.challengeOwner]),
      requestedDecision: String(needs.requestedDecision ?? audience.requestedDecision ?? decision.nextAction ?? decision.decision ?? ''),
      deadline: String(audience.deadline ?? needs.deadline ?? decision.dueDate ?? ''),
      audienceNeeds: this.toList(needs.audienceNeeds ?? needs.needs ?? audience.audienceNeeds),
      objections: this.toList(needs.objections ?? audience.objections ?? decision.risks),
      requiredEvidenceRefs: Array.from(new Set([
        ...(step3Output.decision?.evidenceRefs ?? []),
        ...(step3Output.resultAnalysis?.supportingEvidenceRefs ?? []),
        ...(step3Output.resultAnalysis?.contradictingEvidenceRefs ?? []),
        ...this.sourceRefsFrom(needs.requiredEvidenceRefs ?? audience.requiredEvidenceRefs),
      ])),
      unsupportedClaims: this.toList(needs.unsupportedClaims ?? audience.unsupportedClaims),
      preferredFormat: String(needs.preferredFormat ?? audience.preferredFormat ?? companyFormats[0] ?? this.defaultArtifactKind(step3Output.decision?.decision, masterContext.routeType)),
    };
  }

  private buildEvidenceBackedNarrative(merged: Record<string, any>, masterContext: any, step3Output: Record<string, any>) {
    const raw = this.recordFrom(merged.evidenceNarrative);
    const refs = Array.from(new Set([
      ...(step3Output.sourceRefs ?? []),
      ...this.sourceRefsFrom(merged.narrativeEvidenceRefs),
    ]));
    const limitations = this.compact([raw.limitations, ...(step3Output.resultAnalysis?.limitations ?? []), ...(step3Output.decision?.remainingUncertainties ?? [])]);
    const claim = (topic: string, text: unknown, evidenceRefs: string[] = refs) => ({
      topic,
      text: String(text ?? ''),
      evidenceRefs,
      sourceRefs: evidenceRefs,
      confidence: evidenceRefs.length > 0 ? String(step3Output.resultAnalysis?.evidenceStrength ?? 'medium') : 'low',
      limitations,
    });
    const recommendation = String(raw.recommendation ?? step3Output.decision?.nextAction ?? step3Output.decision?.rationale ?? '');
    return {
      context: claim('context', raw.context ?? masterContext.knownFacts?.[0] ?? ''),
      focus: claim('focus', raw.focus ?? masterContext.step2Transfer?.focus ?? step3Output.executionSummary?.scope ?? ''),
      hypothesis: claim('hypothesis', raw.hypothesis ?? step3Output.hypothesis ?? ''),
      selectedBet: claim('selected_bet', raw.selectedBet ?? step3Output.selectedBet?.primary ?? ''),
      execution: claim('execution', raw.execution ?? step3Output.executionSummary?.testOrExecution ?? ''),
      results: claim('results', raw.results ?? step3Output.resultAnalysis?.interpretation ?? ''),
      learnings: claim('learnings', raw.learnings ?? step3Output.resultAnalysis?.interpretation ?? ''),
      contradictions: claim('contradictions', raw.contradictions ?? (step3Output.resultAnalysis?.contradictingEvidenceRefs ?? []).join(', '), step3Output.resultAnalysis?.contradictingEvidenceRefs ?? refs),
      risks: claim('risks', raw.risks ?? (step3Output.decision?.risks ?? []).join(', ')),
      limitations,
      recommendation,
      nextStep: String(raw.nextStep ?? step3Output.decision?.nextAction ?? ''),
      criticalClaims: ['context', 'focus', 'hypothesis', 'selectedBet', 'execution', 'results', 'recommendation'].map((key) => ({
        key,
        evidenceRefs: refs,
        sourceRefs: refs,
        confidence: refs.length > 0 ? String(step3Output.resultAnalysis?.evidenceStrength ?? 'medium') : 'low',
        limitations,
      })),
      userConfirmed: this.hasValue(merged.evidenceNarrative),
    };
  }

  private buildNextHorizon(merged: Record<string, any>, decisionType: string, step3Output: Record<string, any>) {
    const plan = this.recordFrom(merged.nextHorizonPlan);
    const details = this.recordFrom(merged.nextHorizonDetails);
    const planTypeByDecision: Record<string, string> = {
      scale_pilot: 'ScalingRoadmap',
      transfer: 'TransferPlan',
      continue_implementation: 'OperationalizationPlan',
      integrate_to_roadmap: 'OperationalizationPlan',
      iterate: 'IterationPlan',
      repeat_test: 'IterationPlan',
      expand_sample: 'IterationPlan',
      change_scope: 'IterationPlan',
      pivot: 'IterationPlan',
      pause: 'ClosurePlan',
      close_with_learning: 'ClosurePlan',
      reformulate_challenge: 'ClosurePlan',
    };
    return {
      planType: String(plan.planType ?? planTypeByDecision[decisionType] ?? 'ClosurePlan'),
      phases: this.toList(plan.phases ?? details.phases ?? ['Siguiente accion']),
      scope: String(plan.scope ?? details.scope ?? step3Output.executionSummary?.scope ?? ''),
      owner: String(plan.owner ?? details.owner ?? step3Output.decision?.owner ?? 'Owner de iniciativa'),
      resources: this.toList(plan.resources ?? details.resources),
      investment: String(plan.investment ?? details.investment ?? ''),
      capabilities: this.toList(plan.capabilities ?? details.capabilities),
      governance: this.toList(plan.governance ?? details.governance),
      adoption: this.toList(plan.adoption ?? details.adoption),
      risks: this.toList(plan.risks ?? details.risks ?? step3Output.decision?.risks),
      metrics: this.toList(plan.metrics ?? details.metrics ?? step3Output.executionSummary?.metric),
      milestones: this.toList(plan.milestones ?? details.milestones),
      dependencies: this.toList(plan.dependencies ?? details.dependencies),
      rollback: String(plan.rollback ?? details.rollback ?? step3Output.operationalReadiness?.rollback ?? ''),
      followUp: String(plan.followUp ?? details.followUp ?? step3Output.decision?.nextAction ?? ''),
    };
  }

  private buildDecisionPackage(merged: Record<string, any>, routeType: AdaptiveRouteType, decisionType: string, audienceBrief: Record<string, any>, narrative: Record<string, any>) {
    const requested = this.toList(merged.decisionArtifacts);
    const trace = this.recordFrom(merged.artifactTraceability);
    const defaults = this.defaultArtifactsFor(routeType, decisionType, audienceBrief.preferredFormat);
    const artifacts = (requested.length > 0 ? requested : defaults).slice(0, 3).map((kind, index) => ({
      id: `artifact-${index + 1}`,
      kind,
      title: this.artifactTitle(kind, narrative.recommendation),
      editable: true,
      evidenceRefs: this.sourceRefsFrom((trace as any)[kind]?.evidenceRefs ?? trace.evidenceRefs ?? narrative.criticalClaims),
      limitations: this.toList((trace as any)[kind]?.limitations ?? trace.limitations ?? narrative.limitations),
      version: Number((trace as any)[kind]?.version ?? trace.version ?? 1),
      author: String((trace as any)[kind]?.author ?? trace.author ?? 'adaptive-core'),
      date: String((trace as any)[kind]?.date ?? trace.date ?? new Date().toISOString()),
    }));
    return {
      generationRule: 'minimum_useful_package',
      artifacts,
      notGeneratedByDefault: ['one-pager', 'memo', 'business case', 'pilot report', 'deck outline', 'implementation plan', 'handoff package', 'learning report', 'closure report'].filter((kind) => !artifacts.some((artifact) => artifact.kind === kind)),
    };
  }

  private buildTransferOrClosure(merged: Record<string, any>, decisionType: string, audienceBrief: Record<string, any>, nextHorizon: Record<string, any>) {
    const raw = this.recordFrom(merged.transferOrClosure);
    const finalState = this.normalizeFinalState(merged.finalState ?? raw.finalState ?? decisionType);
    const isTransfer = ['transferred', 'scaled', 'integrated_to_roadmap', 'completed'].includes(finalState);
    const receiverOwner = String(raw.receiverOwner ?? raw.ownerReceptor ?? raw.futureOwner ?? '');
    const blockers = isTransfer && !this.hasValue(receiverOwner) ? ['Owner receptor requerido para transferencia u operacion.'] : this.toList(raw.blockers);
    return {
      mode: isTransfer ? 'transfer_or_operation' : 'closure_or_iteration',
      status: blockers.length > 0 ? 'blocked' : 'ready',
      receiverOwner,
      acceptance: String(raw.acceptance ?? raw.aceptacion ?? ''),
      resources: this.toList(raw.resources),
      documentation: this.toList(raw.documentation),
      training: this.toList(raw.training ?? raw.capacitacion),
      support: this.toList(raw.support ?? raw.soporte),
      permissions: this.toList(raw.permissions ?? raw.permisos),
      date: String(raw.date ?? raw.fecha ?? new Date().toISOString()),
      metrics: this.toList(raw.metrics ?? nextHorizon.metrics),
      followUp: String(raw.followUp ?? raw.seguimiento ?? nextHorizon.followUp ?? ''),
      finalDecision: String(raw.finalDecision ?? raw.decisionFinal ?? audienceBrief.requestedDecision ?? decisionType),
      decisionMaker: String(raw.decisionMaker ?? audienceBrief.decisionMaker ?? ''),
      conditions: this.toList(raw.conditions),
      comments: String(raw.comments ?? ''),
      nextStep: String(raw.nextStep ?? nextHorizon.followUp ?? ''),
      owner: String(raw.owner ?? receiverOwner ?? nextHorizon.owner ?? ''),
      dueDate: String(raw.dueDate ?? ''),
      closureReason: String(raw.reason ?? raw.razon ?? ''),
      learning: String(raw.learning ?? raw.aprendizaje ?? ''),
      evidenceRefs: this.sourceRefsFrom(raw.evidenceRefs),
      reusableAssets: this.toList(raw.reusableAssets ?? raw.activosReutilizables),
      communication: String(raw.communication ?? raw.comunicacion ?? ''),
      finalState,
      blockers,
    };
  }

  private buildFinalChallengeContribution(masterContext: any, step3Output: Record<string, any>, narrative: Record<string, any>, transferOrClosure: Record<string, any>, finalState: string) {
    if (!masterContext.challengeSnapshot) {
      return {
        challengeId: null,
        contributionType: this.contributionTypeForFinalState(finalState),
        evidenceStrength: String(step3Output.resultAnalysis?.evidenceStrength ?? 'medium'),
        result: String(step3Output.resultAnalysis?.classification ?? ''),
        recommendation: narrative.recommendation,
        evidenceRefs: Array.from(new Set([...(step3Output.sourceRefs ?? []), ...(transferOrClosure.evidenceRefs ?? [])])),
        challengeResolved: false,
      };
    }
    return {
      challengeId: masterContext.challengeSnapshot.id,
      subproblem: masterContext.step2Transfer?.focus ?? step3Output.executionSummary?.scope ?? '',
      hypothesis: step3Output.hypothesis ?? '',
      metric: step3Output.executionSummary?.metric ?? '',
      contributionType: this.contributionTypeForFinalState(finalState),
      evidenceStrength: String(step3Output.resultAnalysis?.evidenceStrength ?? 'medium'),
      result: String(step3Output.resultAnalysis?.classification ?? ''),
      decision: transferOrClosure.finalDecision,
      recommendation: narrative.recommendation || transferOrClosure.nextStep,
      evidenceRefs: Array.from(new Set([...(step3Output.sourceRefs ?? []), ...(transferOrClosure.evidenceRefs ?? [])])),
      finalState,
      challengeResolved: false,
    };
  }

  private buildChallengeCoverage(masterContext: any, contribution: Record<string, any>, finalState: string, merged: Record<string, any> = {}) {
    const requested = this.recordFrom(merged.challengeCoverageUpdate);
    const result = String(contribution.result ?? '');
    const evidenceStrength = String(contribution.evidenceStrength ?? 'medium');
    let status = 'partial';
    if (!contribution.challengeId) status = 'no_coverage';
    else if (finalState === 'new_iteration_required' || finalState === 'paused') status = 'needs_reformulation';
    else if (finalState === 'closed_with_learning') status = result === 'insufficient_evidence' ? 'exploratory_coverage' : 'partial';
    else if (['scaled', 'transferred', 'integrated_to_roadmap', 'completed'].includes(finalState)) status = evidenceStrength === 'strong' ? 'ready_for_decision' : 'supported';
    return {
      status: contribution.challengeId ? String(requested.status ?? status) : 'no_coverage',
      evidenceStrength,
      result,
      decision: contribution.decision ?? finalState,
      overlap: requested.overlap ?? 'not_evaluated',
      metrics: this.toList(requested.metrics ?? contribution.metric),
      relatedInitiatives: this.toList(requested.relatedInitiatives),
      rationale: String(requested.rationale ?? contribution.recommendation ?? ''),
      autoResolved: false,
    };
  }

  private buildFinalMasterContext(masterContext: any, step4Output: Record<string, any>, finalState: string) {
    return {
      ...masterContext,
      version: Number(masterContext.version ?? 1) + 1,
      step4Output,
      finalState,
      organizationalDecision: step4Output.organizationalDecision,
      challengeCoverage: step4Output.challengeCoverage,
      knownFacts: this.compact([...(masterContext.knownFacts ?? []), step4Output.recommendation]),
      decisions: this.compact([step4Output.organizationalDecision, finalState, ...(masterContext.decisions ?? [])]),
      risks: this.compact([...(step4Output.narrative?.risks?.limitations ?? []), ...(masterContext.risks ?? [])]),
      closedAt: new Date().toISOString(),
    };
  }

  private normalizeFinalState(raw: unknown) {
    const value = String(raw ?? '').trim();
    const byDecision: Record<string, string> = {
      iterate: 'new_iteration_required',
      repeat_test: 'new_iteration_required',
      expand_sample: 'new_iteration_required',
      change_scope: 'new_iteration_required',
      pivot: 'new_iteration_required',
      scale_pilot: 'scaled',
      continue_implementation: 'completed',
      transfer: 'transferred',
      integrate_to_roadmap: 'integrated_to_roadmap',
      pause: 'paused',
      close_with_learning: 'closed_with_learning',
      reformulate_challenge: 'new_iteration_required',
    };
    const normalized = byDecision[value] ?? value;
    const allowed = new Set(['completed', 'transferred', 'scaled', 'integrated_to_roadmap', 'closed_with_learning', 'paused', 'new_iteration_required']);
    return allowed.has(normalized) ? normalized : 'closed_with_learning';
  }

  private projectStatusForFinalState(finalState: string) {
    if (finalState === 'new_iteration_required') return 'ITERATION';
    if (finalState === 'paused') return 'IN_PROGRESS';
    return 'COMPLETED';
  }

  private portfolioMetaFinalUpdate(step4Output: Record<string, any>, finalState: string) {
    const closed = ['completed', 'transferred', 'scaled', 'integrated_to_roadmap', 'closed_with_learning'].includes(finalState);
    return {
      status: closed ? 'cerrada' : finalState === 'paused' ? 'bloqueada' : 'en_step_4',
      currentStep: 'Step 4',
      readyForDecision: false,
      signalSummary: String(step4Output.recommendation ?? ''),
      nextActionRecommended: String(step4Output.transferOrClosure?.nextStep ?? ''),
      mainBlocker: String(step4Output.transferOrClosure?.blockers?.[0] ?? ''),
      hypothesisCovered: String(step4Output.hypothesis ?? ''),
      contributionType: this.portfolioContributionType(step4Output.finalChallengeContribution?.contributionType),
      estimatedContribution: this.estimatedContribution(step4Output.finalChallengeContribution?.evidenceStrength),
      partialSignal: ['mixed_signal', 'partially_supported'].includes(String(step4Output.finalChallengeContribution?.result ?? '')),
      resolvedCorePart: false,
      executiveSummary: String(step4Output.narrative?.recommendation ?? step4Output.recommendation ?? ''),
      experimentSummary: String(step4Output.narrative?.results?.text ?? ''),
      decisionRecommendationReason: String(step4Output.transferOrClosure?.finalDecision ?? ''),
      deliverables: step4Output.decisionPackage?.artifacts ?? [],
      stepsTimeline: step4Output.nextHorizon?.milestones ?? [],
      coverageScore: this.coverageScore(step4Output.challengeCoverage?.status),
      alignmentNotes: String(step4Output.challengeCoverage?.rationale ?? ''),
      decisionNotes: String(step4Output.organizationalDecision ?? ''),
      lastActivity: new Date().toISOString(),
    };
  }

  private prismaCoverageStatus(status: unknown) {
    const value = String(status ?? '');
    if (value === 'resolved') return 'resuelto';
    if (value === 'needs_reformulation') return 'reformular';
    if (value === 'supported' || value === 'ready_for_decision') return 'cobertura_suficiente';
    if (value === 'partial' || value === 'exploratory_coverage' || value === 'overlapped') return 'cobertura_parcial';
    return 'sin_cobertura';
  }

  private coverageScore(status: unknown) {
    const value = String(status ?? '');
    if (value === 'ready_for_decision' || value === 'supported') return 0.75;
    if (value === 'partial') return 0.5;
    if (value === 'exploratory_coverage' || value === 'overlapped') return 0.35;
    if (value === 'needs_reformulation') return 0.2;
    if (value === 'resolved') return 1;
    return 0;
  }

  private portfolioContributionType(type: unknown) {
    const value = String(type ?? '');
    if (value === 'resolver_directamente') return 'resolver_directamente';
    if (value === 'resolver_parcialmente') return 'resolver_parcialmente';
    if (value === 'validar') return 'validar';
    return 'descubrir';
  }

  private contributionTypeForFinalState(finalState: string) {
    if (['scaled', 'transferred', 'integrated_to_roadmap', 'completed'].includes(finalState)) return 'resolver_parcialmente';
    if (finalState === 'new_iteration_required') return 'validar';
    return 'descubrir';
  }

  private estimatedContribution(evidenceStrength: unknown) {
    const value = String(evidenceStrength ?? '');
    if (value === 'strong') return 'alto';
    if (value === 'medium') return 'medio';
    return 'bajo';
  }

  private step4OutputKey(routeType: AdaptiveRouteType, decisionType: string, preferredFormat?: unknown) {
    if (String(preferredFormat ?? '').toLowerCase().includes('one-pager')) return 'LightweightDecisionBrief';
    if (routeType === 'lightweight_plan') return 'LightweightDecisionBrief';
    if (decisionType === 'scale_pilot' || decisionType === 'integrate_to_roadmap') return 'BusinessCaseRoadmap';
    if (decisionType === 'transfer' || decisionType === 'continue_implementation') return 'OperationalHandoffPackage';
    return STEP4_OUTPUT_BY_ROUTE[routeType];
  }

  private defaultArtifactKind(decisionType: unknown, routeType: unknown) {
    const decision = String(decisionType ?? '');
    if (decision === 'close_with_learning' || decision === 'pause') return 'learning report';
    if (decision === 'transfer' || routeType === 'implement_handoff') return 'handoff package';
    if (decision === 'scale_pilot' || decision === 'integrate_to_roadmap') return 'business case';
    if (routeType === 'lightweight_plan') return 'one-pager';
    return 'memo';
  }

  private defaultArtifactsFor(routeType: AdaptiveRouteType, decisionType: string, preferredFormat: unknown) {
    const preferred = String(preferredFormat ?? '').trim();
    if (preferred) return [preferred];
    const first = this.defaultArtifactKind(decisionType, routeType);
    if (decisionType === 'scale_pilot') return [first, 'roadmap'];
    if (decisionType === 'transfer' || decisionType === 'continue_implementation') return [first, 'implementation plan'];
    if (decisionType === 'close_with_learning' || decisionType === 'pause') return [first, 'closure report'];
    return [first];
  }

  private artifactTitle(kind: string, recommendation: unknown) {
    const suffix = String(recommendation ?? '').trim();
    return suffix ? `${kind}: ${suffix}` : kind;
  }

  private recordFrom(value: unknown): Record<string, any> {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
    if (typeof value === 'string') return { text: value };
    return {};
  }

  private buildStep3ChallengeContribution(masterContext: any, step2Output: Record<string, any>, resultAnalysis: Record<string, any>, decision: Record<string, any>) {
    if (!masterContext.challengeSnapshot) return null;
    return {
      challengeId: masterContext.challengeSnapshot.id,
      subproblem: masterContext.step2Transfer?.focus ?? step2Output.scope ?? '',
      hypothesis: step2Output.hypothesis ?? '',
      metric: step2Output.metric ?? step2Output.executionDesign?.metric ?? '',
      contributionType: decision.decision,
      evidenceStrength: resultAnalysis.evidenceStrength,
      result: resultAnalysis.classification,
      recommendation: decision.nextAction || decision.rationale,
      evidenceRefs: Array.from(new Set([...(step2Output.evidenceUsed ?? []), ...(decision.evidenceRefs ?? []), ...(resultAnalysis.supportingEvidenceRefs ?? []), ...(resultAnalysis.contradictingEvidenceRefs ?? [])])),
      coverageUpdated: true,
      challengeResolved: false,
    };
  }

  private normalizeAlternatives(rawAlternatives: unknown, rawEvidenceRefs: unknown, routeType: AdaptiveRouteType) {
    const values = Array.isArray(rawAlternatives) ? rawAlternatives : this.toList(rawAlternatives);
    const refs = this.sourceRefsFrom(rawEvidenceRefs);
    const fallback = routeType === 'lightweight_plan'
      ? ['Ejecutar quick win controlado', 'No hacer nada por ahora']
      : ['Build interno', 'Buy externo', 'Partner', 'No hacer nada'];
    const source = values.length > 0 ? values : fallback;
    return source.map((item: any, index) => ({
      id: String(item?.id ?? `alt-${index + 1}`),
      name: typeof item === 'string' ? item : String(item?.name ?? item?.title ?? `Alternativa ${index + 1}`),
      mode: String(item?.mode ?? item?.implementationMode ?? this.defaultAlternativeMode(routeType, index)),
      description: typeof item === 'string' ? item : String(item?.description ?? item?.summary ?? ''),
      evidenceRefs: this.sourceRefsFrom(item?.evidenceRefs ?? item?.sourceRefs ?? refs[index] ?? refs),
      prescribed: Boolean(item?.prescribed),
    }));
  }

  private normalizeSelectedBet(rawSelected: unknown, alternatives: Array<Record<string, any>>, rawEvidenceRefs: unknown, rawComparison: unknown) {
    const selected = rawSelected && typeof rawSelected === 'object' && !Array.isArray(rawSelected) ? rawSelected as Record<string, any> : {};
    const primary = String(selected.primary ?? selected.name ?? selected.apuestaPrincipal ?? alternatives[0]?.name ?? 'Apuesta principal pendiente');
    return {
      primary,
      backup: String(selected.backup ?? alternatives[1]?.name ?? 'No hacer nada por ahora'),
      justification: String(selected.justification ?? selected.justificacion ?? rawComparison ?? `Seleccionada por mejor balance de valor, factibilidad y tiempo hasta senal: ${primary}.`),
      assumptions: this.toList(selected.assumptions ?? selected.supuestos),
      risks: this.toList(selected.risks ?? selected.riesgos),
      hypothesis: String(selected.hypothesis ?? selected.hipotesis ?? primary),
      evidenceRefs: this.sourceRefsFrom(selected.evidenceRefs ?? selected.sourceRefs ?? rawEvidenceRefs),
      comparison: rawComparison ?? {},
    };
  }

  private normalizeExecutionDesign(rawExecution: unknown, rawOwnersResources: unknown, rawGoNoGo: unknown, selectedBet: Record<string, any>, routeType: AdaptiveRouteType, step1Output: any) {
    const execution = rawExecution && typeof rawExecution === 'object' && !Array.isArray(rawExecution) ? rawExecution as Record<string, any> : {};
    return {
      outputKind: STEP2_OUTPUT_BY_ROUTE[routeType],
      hypothesis: String(execution.hypothesis ?? selectedBet.hypothesis ?? step1Output.hypothesisForStep2 ?? ''),
      testOrExecution: String(execution.testOrExecution ?? execution.test ?? execution.execution ?? selectedBet.primary),
      scope: String(execution.scope ?? step1Output.updatedFocus ?? ''),
      participants: this.toList(execution.participants ?? execution.participantes),
      baseline: String(execution.baseline ?? step1Output.evidenceSummary ?? ''),
      metric: String(execution.metric ?? execution.metrica ?? 'Senal principal definida por Step 2'),
      threshold: String(execution.threshold ?? execution.umbral ?? ''),
      duration: String(execution.duration ?? execution.duracion ?? ''),
      responsibles: this.toList(execution.responsibles ?? rawOwnersResources),
      resources: this.toList(execution.resources ?? rawOwnersResources),
      evidence: this.toList(execution.evidence ?? execution.evidencia),
      risks: this.toList(execution.risks ?? execution.riesgos),
      guardrails: this.toList(execution.guardrails),
      goNoGoCriteria: String(execution.goNoGoCriteria ?? rawGoNoGo ?? ''),
    };
  }

  private buildReadiness(rawChecklist: unknown, rawDependencies: unknown, masterContext: any, execution: Record<string, any>) {
    const required = this.shouldActivateReadiness(masterContext, execution);
    const checklist = this.toList(rawChecklist);
    const dependencies = this.toList(rawDependencies);
    const blockers = required ? this.compact([
      checklist.length === 0 ? 'Checklist de readiness pendiente.' : '',
      dependencies.filter((item) => /bloque|pendiente|sin permiso|riesgo/i.test(item)),
    ]) : [];
    return {
      required,
      status: blockers.length > 0 ? 'blocked' : required ? 'ready_with_observations' : 'not_required',
      checklist,
      dependencies,
      blockers,
      actorRequired: blockers.length > 0 ? 'Owner / sponsor de dependencia' : execution.responsibles?.[0] ?? 'Owner de iniciativa',
      fallbackPlan: dependencies.find((item) => /alternativo|fallback|plan b/i.test(item)) ?? '',
    };
  }

  private shouldActivateReadiness(masterContext: any, latest?: Record<string, unknown>) {
    const routeType = String(masterContext.routeType ?? '');
    const readinessSignals = {
      risks: masterContext.risks ?? [],
      missingCriticalInformation: masterContext.missingCriticalInformation ?? [],
      knownFacts: masterContext.knownFacts ?? [],
      companyRestrictions: masterContext.companySnapshot?.restrictions ?? [],
      latest,
    };
    const text = JSON.stringify(readinessSignals).toLowerCase();
    return routeType === 'implement_handoff'
      || masterContext.depthLevel === 'extended'
      || (masterContext.companySnapshot?.restrictions ?? []).length > 0
      || /regulad|seguridad|permiso|presupuesto|dependenc|transversal|tecnologia|datos|alto riesgo/.test(text);
  }

  private shouldActivateOperationalReadiness(masterContext: any, responses: Record<string, any>[] = []) {
    const merged = Object.assign({}, ...responses);
    const decision = typeof merged.decision === 'object' && merged.decision !== null
      ? String((merged.decision as Record<string, any>).decision ?? (merged.decision as Record<string, any>).type ?? '')
      : String(merged.decision ?? '');
    return ['scale_pilot', 'continue_implementation', 'transfer', 'integrate_to_roadmap'].includes(decision)
      || ['scale_pilot', 'continue_implementation', 'transfer', 'integrate_to_roadmap'].includes(String(masterContext.step3Output?.decision?.decision ?? ''));
  }

  private defaultAlternativeMode(routeType: AdaptiveRouteType, index: number) {
    if (routeType === 'design_solution') return ['build', 'buy', 'partner', 'do_nothing'][index] ?? 'build';
    if (routeType === 'implement_handoff') return ['controlled_implementation', 'phased_rollout', 'do_nothing'][index] ?? 'controlled_implementation';
    if (routeType === 'plan_coordinate') return ['delivery_path', 'scope_reduction', 'do_nothing'][index] ?? 'delivery_path';
    if (routeType === 'reconstruct_existing') return ['recover', 'rebuild_evidence', 'do_nothing'][index] ?? 'recover';
    return ['experiment', 'concierge_test', 'do_nothing'][index] ?? 'experiment';
  }

  private normalizeExecutionRecords(rawRecords: unknown, refs: string[]) {
    const values = Array.isArray(rawRecords) ? rawRecords : this.toList(rawRecords);
    return values.map((item: any, index) => {
      const record = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, any> : {};
      const text = typeof item === 'string' ? item : String(record.description ?? record.title ?? `Registro ${index + 1}`);
      return {
        type: String(record.type ?? this.inferExecutionRecordType(text)),
        title: String((record.title ?? text.slice(0, 80)) || `Registro ${index + 1}`),
        description: String(record.description ?? text),
        occurredAt: String(record.occurredAt ?? new Date().toISOString()),
        actor: String(record.actor ?? 'Owner de iniciativa'),
        evidenceRefs: this.sourceRefsFrom(record.evidenceRefs ?? refs[index] ?? refs),
        sourceRefs: this.sourceRefsFrom(record.sourceRefs ?? refs[index] ?? refs),
        impact: String(record.impact ?? ''),
        configurationVersion: Number(record.configurationVersion ?? 1),
        checkpointKey: String(record.checkpointKey ?? 'CP-3.2'),
      };
    });
  }

  private inferExecutionRecordType(text: string) {
    const lower = text.toLowerCase();
    if (/metric|medic|baseline|resultado/.test(lower)) return 'measurement';
    if (/entrevista|usuario|actor/.test(lower)) return 'interview';
    if (/incidente|bloque|riesgo/.test(lower)) return 'incident';
    if (/decision|go|no-go/.test(lower)) return 'decision';
    if (/alcance|hipotes|dependenc/.test(lower)) return 'scope_or_hypothesis_change';
    if (/evidencia|archivo|fuente/.test(lower)) return 'evidence';
    return 'activity';
  }

  private normalizeHypothesisClassification(raw: unknown, records: Array<Record<string, any>>) {
    const value = typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? String((raw as Record<string, any>).classification ?? (raw as Record<string, any>).status ?? '')
      : String(raw ?? '');
    const allowed = new Set(['supported', 'partially_supported', 'contradicted', 'mixed_signal', 'insufficient_evidence', 'not_interpretable']);
    if (allowed.has(value)) return value;
    const text = `${value} ${JSON.stringify(records)}`.toLowerCase();
    if (/contradic|empeor|no cumple|fall/.test(text) && /apoya|mejor|cumple/.test(text)) return 'mixed_signal';
    if (/contradic|empeor|no cumple|fall/.test(text)) return 'contradicted';
    if (/parcial|algunos|mitad/.test(text)) return 'partially_supported';
    if (/insuf|sin evidencia|pocos datos/.test(text)) return 'insufficient_evidence';
    if (/no interpretable|confuso/.test(text)) return 'not_interpretable';
    return 'supported';
  }

  private hasSelectedBetChanged(previous: any, next: any) {
    const prevBet = previous?.selectedBet?.primary ?? previous?.selectedBet ?? null;
    const nextBet = next?.selectedBet?.primary ?? next?.selectedBet ?? null;
    return this.hasValue(prevBet) && this.hasValue(nextBet) && JSON.stringify(prevBet) !== JSON.stringify(nextBet);
  }

  private normalizeEvidenceItems(rawItems: unknown, rawClassifications: unknown, rawRefs: unknown) {
    const items = Array.isArray(rawItems) ? rawItems : this.toList(rawItems);
    const classifications = this.toList(rawClassifications);
    const refs = this.sourceRefsFrom(rawRefs);
    const allowed = new Set(['supports', 'contradicts', 'weak_signal', 'insufficient', 'context', 'new_uncertainty']);
    return items.map((item: any, index) => {
      const itemRefs = this.sourceRefsFrom(item?.sourceRefs ?? item?.sourceRef ?? item?.id ?? refs[index] ?? refs);
      const classification = String(item?.classification ?? classifications[index] ?? 'context');
      return {
        id: String(item?.id ?? `evidence-${index + 1}`),
        type: String(item?.type ?? item?.tipo ?? 'text'),
        summary: typeof item === 'string' ? item : String(item?.summary ?? item?.desc ?? item?.text ?? JSON.stringify(item)),
        classification: allowed.has(classification) ? classification : 'context',
        sourceRefs: itemRefs.length > 0 ? itemRefs : [`evidence-${index + 1}`],
      };
    });
  }

  private suggestEvidenceMethods(hypothesis: string, routeType: AdaptiveRouteType, masterContext: any) {
    const text = `${hypothesis} ${routeType} ${(masterContext.challengeType ?? '')}`.toLowerCase();
    const methods = new Set<string>();
    if (text.includes('adop') || routeType === 'implement_handoff') methods.add('readiness interviews').add('process observation').add('adoption metric baseline');
    if (text.includes('cliente') || routeType === 'explore_validate') methods.add('user interviews').add('problem evidence review');
    if (routeType === 'design_solution') methods.add('concept test').add('workflow walkthrough');
    if (routeType === 'plan_coordinate') methods.add('stakeholder alignment review').add('dependency mapping');
    if (routeType === 'reconstruct_existing') methods.add('document reconstruction').add('decision log review');
    if (masterContext.companySnapshot?.restrictions?.length) methods.add('policy and data-access check');
    return Array.from(methods);
  }

  private buildCompanyInfluences(companySnapshot: any) {
    if (!companySnapshot) return [];
    return ['methods', 'actors', 'restrictions', 'evidence', 'artifacts', 'validators'].map((target) => this.buildCompanyInfluence(companySnapshot, target));
  }

  private buildCompanyInfluence(companySnapshot: any, target: string) {
    const coverageLevel = Number(companySnapshot.coverage ?? 0) >= 70 ? 'high' : Number(companySnapshot.coverage ?? 0) >= 50 ? 'medium' : 'low';
    return {
      source: 'CompanyContextSnapshot',
      target,
      reason: coverageLevel === 'low'
        ? 'Cobertura baja: usar como sugerencia y pedir confirmacion; no crear hard gate.'
        : `Contexto empresarial afecta ${target}.`,
      sourceRefs: companySnapshot.sources ?? [],
      coverageLevel,
      confirmationStatus: coverageLevel === 'low' ? 'needs_confirmation' : 'confirmed',
    };
  }

  private buildCriticalChangeReview(input: CriticalChangeInput, newVersion?: number) {
    const affectedByField: Record<string, { checkpoints: string[]; outputs: string[]; nextStep: string }> = {
      scope: { checkpoints: ['CP-0.2', 'CP-0.3', 'CP-1.1'], outputs: ['Step0AlignmentBrief', 'ValidationFocus'], nextStep: 'Step 1' },
      company_or_area: { checkpoints: ['CP-0.2', 'CP-1.2', 'CP-1.3'], outputs: ['EvidencePlan', 'EvidenceMap'], nextStep: 'Step 1' },
      challenge_type: { checkpoints: ['CP-0.1', 'CP-1.1', 'CP-1.4'], outputs: ['Step0AlignmentBrief', 'Step1FocusDecision'], nextStep: 'Step 1' },
      route: { checkpoints: ['CP-0.3', 'CP-1.4'], outputs: ['StepConfiguration', 'Step1FocusDecision'], nextStep: 'Step 1' },
      hypothesis: { checkpoints: ['CP-0.3', 'CP-1.1', 'CP-1.2'], outputs: ['ValidationFocus', 'EvidencePlan'], nextStep: 'Step 1' },
      target_date: { checkpoints: ['CP-0.2', 'CP-1.2'], outputs: ['ExecutionConditionsMap', 'EvidencePlan'], nextStep: 'Step 1' },
      critical_restriction: { checkpoints: ['CP-0.2', 'CP-1.2', 'CP-1.4'], outputs: ['EvidencePlan', 'Step1FocusDecision'], nextStep: 'Step 1' },
      selected_bet: { checkpoints: ['CP-2.1', 'CP-2.3', 'CP-2.4'], outputs: ['SelectedBet', 'ExecutionDesign'], nextStep: 'Step 3' },
    };
    const affected = affectedByField[input.field];
    return {
      field: input.field,
      previousValue: input.previousValue ?? null,
      nextValue: input.nextValue,
      reason: input.reason ?? 'Sin motivo registrado.',
      action: input.action,
      affectedCheckpoints: affected.checkpoints,
      affectedOutputs: affected.outputs,
      affectedNextStep: affected.nextStep,
      newVersion: newVersion ?? null,
      rules: {
        silentUpdateAllowed: false,
        preservePreviousConfiguration: true,
        dependentOutputsRequireReview: true,
      },
    };
  }

  private async upsertStepOutputTx(tx: any, projectId: string, stepNumber: number, sourceConfigurationId: string, outputKey: string, outputJson: Record<string, unknown>, status: string) {
    const latest = await tx.adaptiveStepOutput.findFirst({ where: { projectId, stepNumber }, orderBy: { version: 'desc' } });
    const version = latest ? latest.version + 1 : 1;
    return tx.adaptiveStepOutput.create({ data: { projectId, stepNumber, version, sourceConfigurationId, outputKey, outputJson, status } });
  }

  private async upsertProgressSignalTx(tx: any, projectId: string, signal: Record<string, any>) {
    await tx.adaptiveProgressSignal.upsert({
      where: { projectId },
      create: { projectId, stepNumber: signal.step, checkpointKey: signal.checkpointCode, health: signal.health, signalJson: signal },
      update: { stepNumber: signal.step, checkpointKey: signal.checkpointCode, health: signal.health, signalJson: signal },
    });
    await tx.initiativePortfolioMeta.updateMany({
      where: { projectId },
      data: {
        currentStep: `Step ${signal.step}`,
        signalSummary: signal.evidence,
        mainBlocker: signal.blocker,
        nextActionRecommended: signal.nextAction,
        hypothesisCovered: signal.hypothesis,
      } as any,
    });
  }

  private async updateSignalForCheckpointTx(tx: any, projectId: string, checkpointKey: string, responses: Record<string, unknown>, masterContext: any) {
    const spec = [...STEP0_CHECKPOINTS, ...STEP1_CHECKPOINTS, ...STEP2_CHECKPOINTS, ...STEP3_CHECKPOINTS, ...STEP4_CHECKPOINTS].find((cp) => cp.key === checkpointKey);
    await this.upsertProgressSignalTx(tx, projectId, {
      step: checkpointKey.startsWith('CP-4') ? 4 : checkpointKey.startsWith('CP-3') ? 3 : checkpointKey.startsWith('CP-2') ? 2 : checkpointKey.startsWith('CP-1') ? 1 : 0,
      checkpointCode: checkpointKey,
      checkpointTitle: spec?.title ?? checkpointKey,
      health: 'healthy' as AdaptiveHealth,
      hypothesis: String(responses.priorityHypothesis ?? responses.objective ?? masterContext.assumptions?.[0] ?? 'Hipotesis pendiente.'),
      evidence: String(responses.availableEvidence ?? responses.currentEvidence ?? masterContext.knownFacts?.[0] ?? 'Evidencia pendiente.'),
      evidenceStrength: responses.availableEvidence || responses.currentEvidence ? 'weak' : 'none',
      blocker: '',
      actorRequired: String(responses.owner_and_actor_required ?? masterContext.challengeSnapshot?.challengeOwner ?? 'Owner de iniciativa'),
      nextAction: `Completar ${checkpointKey}: ${spec?.title ?? checkpointKey}.`,
      upcomingDecision: String(responses.decisionCriteria ?? masterContext.decisions?.[0] ?? 'Decision pendiente.'),
      updatedAt: new Date().toISOString(),
    });
  }

  private async recordEventTx(tx: any, projectId: string, eventType: string, summary: string, payload: unknown, userId?: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await tx.adaptiveAdaptationEvent.findUnique({ where: { idempotencyKey } }).catch(() => null);
      if (existing) return existing;
    }
    return tx.adaptiveAdaptationEvent.create({ data: { projectId, eventType, summary, payloadJson: payload as any, createdById: userId, idempotencyKey } });
  }

  private async nextConfigVersionTx(tx: any, projectId: string, stepNumber: number): Promise<number> {
    const latest = await tx.adaptiveStepConfiguration.findFirst({ where: { projectId, stepNumber }, orderBy: { version: 'desc' } });
    return latest ? latest.version + 1 : 1;
  }

  private nextCheckpointKey(key: string): string | null {
    const order = ['CP-0.1', 'CP-0.2', 'CP-0.3', 'CP-1.1', 'CP-1.2', 'CP-1.3', 'CP-1.4', 'CP-2.1', 'CP-2.2', 'CP-2.3', 'CP-2.4', 'CP-2.5', 'CP-3.1', 'CP-3.2', 'CP-3.3', 'CP-3.4', 'CP-3.5', 'CP-4.1', 'CP-4.2', 'CP-4.3', 'CP-4.4', 'CP-4.5'];
    const idx = order.indexOf(key);
    if (idx < 0 || idx >= order.length - 1) return null;
    const next = order[idx + 1];
    if (key.startsWith('CP-0') && next.startsWith('CP-1')) return null;
    if (key.startsWith('CP-1') && next.startsWith('CP-2')) return null;
    if (key.startsWith('CP-2') && next.startsWith('CP-3')) return null;
    if (key.startsWith('CP-3') && next.startsWith('CP-4')) return null;
    return next;
  }

  private serializeCheckpoint(instance: any) {
    const spec = [...STEP0_CHECKPOINTS, ...STEP1_CHECKPOINTS, ...STEP2_CHECKPOINTS, ...STEP3_CHECKPOINTS, ...STEP4_CHECKPOINTS].find((cp) => cp.key === instance.checkpointKey);
    return {
      id: instance.id,
      step: instance.stepNumber,
      checkpointKey: instance.checkpointKey,
      title: spec?.title ?? instance.checkpointKey,
      outputKey: spec?.outputKey ?? instance.checkpointKey,
      status: instance.status,
      sequence: instance.sequence,
      questions: instance.materializedQuestionsJson,
      sufficiency: instance.sufficiencyJson,
      startedAt: instance.startedAt,
      completedAt: instance.completedAt,
      configurationId: instance.stepConfigurationId,
    };
  }

  private applyCriticalChange(context: any, input: CriticalChangeInput) {
    const next = { ...context, version: Number(context.version ?? 1) + 1, requiresReview: true };
    if (input.field === 'scope') next.scope = input.nextValue;
    if (input.field === 'challenge_type') next.challengeType = input.nextValue;
    if (input.field === 'route') next.routeType = input.nextValue;
    if (input.field === 'hypothesis') next.assumptions = [String(input.nextValue), ...(context.assumptions ?? [])];
    if (input.field === 'critical_restriction') next.risks = [String(input.nextValue), ...(context.risks ?? [])];
    if (input.field === 'company_or_area') next.companySnapshot = { ...(context.companySnapshot ?? {}), changedTo: input.nextValue, confirmationRequired: true };
    if (input.field === 'target_date') next.targetDate = input.nextValue;
    if (input.field === 'selected_bet') next.step2Output = { ...(context.step2Output ?? {}), selectedBet: input.nextValue, requiresReview: true };
    return next;
  }

  private deriveRouteType(raw: Record<string, any>, portfolioMeta: any): AdaptiveRouteType {
    const text = [raw.nextRecommendedStep, raw.initialFocus, raw.mainRisk, raw.decisionRequested].filter(Boolean).join(' ').toLowerCase();
    if (/quick win|rapido|rapida|simple|liger|pequena|pequeña/.test(text)) return 'lightweight_plan';
    if (text.includes('implementar') || text.includes('handoff') || text.includes('adopcion')) return 'implement_handoff';
    if (text.includes('plan') || text.includes('coordinar') || text.includes('deadline')) return 'plan_coordinate';
    if (text.includes('reconstru')) return 'reconstruct_existing';
    if (text.includes('solucion') || text.includes('dise')) return 'design_solution';
    if ((raw.challengeType ?? portfolioMeta?.challenge?.type) === 'correction') return 'plan_coordinate';
    return 'explore_validate';
  }

  private deriveDepthLevel(raw: Record<string, any>, companyCoverage: number): AdaptiveDepthLevel {
    const risk = String(raw.mainRisk ?? '').toLowerCase();
    const pendingCount = Array.isArray(raw.pendingQuestions) ? raw.pendingQuestions.length : 0;
    if (risk.includes('legal') || risk.includes('datos') || risk.includes('regulator') || pendingCount >= 4) return 'extended';
    if (companyCoverage >= 50 || raw.informationReadiness === 'medium' || raw.informationReadiness === 'high') return 'standard';
    return 'essential';
  }

  private extractCompanyDimension(snapshotJson: any, needles: string[]) {
    return (snapshotJson?.entries ?? [])
      .filter((entry: any) => needles.some((needle) => String(entry.dimension ?? entry.fieldKey ?? '').toLowerCase().includes(needle)))
      .map((entry: any) => typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value))
      .filter(Boolean)
      .slice(0, 6);
  }

  private compact(values: unknown[]): string[] {
    return values.flatMap((value) => this.toList(value)).map((value) => value.trim()).filter(Boolean);
  }

  private toList(value: unknown): string[] {
    if (Array.isArray(value)) return value.flatMap((item) => this.toList(item));
    if (typeof value === 'string') return value.split(/\n|;/).map((item) => item.trim()).filter(Boolean);
    if (value == null) return [];
    return [String(value)];
  }

  private hasValue(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null;
  }

  private sourceRefsFrom(value: unknown): string[] {
    if (Array.isArray(value)) return value.flatMap((item) => this.sourceRefsFrom(item));
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return this.sourceRefsFrom(record.sourceRefs ?? record.sourceRef ?? record.id ?? record.url ?? record.name);
    }
    if (typeof value === 'string') return value.split(/\n|;|,/).map((item) => item.trim()).filter(Boolean);
    return [];
  }
}
