import type {
  DecisionReadinessAssessment,
  DecisionReadinessDimension,
  DecisionReadinessDimensionStatus,
  DecisionReadinessInput,
  DecisionReadinessIssue,
  DecisionReadinessStatus,
  DecisionType,
} from './adaptive-core.types';

const DIMENSIONS: DecisionReadinessDimension[] = ['evidence', 'impact', 'execution', 'risk', 'governance'];

export class DecisionReadinessResolver {
  evaluate(input: DecisionReadinessInput, evaluatedAt = new Date()): DecisionReadinessAssessment {
    const baseDimensions = this.evaluateDimensions(input);
    const hardBlockers: DecisionReadinessIssue[] = [];
    const conditions: DecisionReadinessIssue[] = [];
    const unresolvedQuestions: DecisionReadinessIssue[] = [];
    const rationale: string[] = [];

    if (input.riskContext.openCriticalRiskCount > 0) {
      hardBlockers.push(issue('RISK_CRITICAL_OPEN', 'risk', 'Existe un riesgo critico abierto que debe entenderse antes de decidir.'));
    }
    if (input.evidenceContext.contradictedEvidenceCount > 0 || input.evidenceContext.contradictedValidationCount > 0) {
      rationale.push('La evidencia contradicha se mantiene como aprendizaje, pero no cuenta como soporte validado.');
    }
    if (input.learningContext.unresolvedQuestionCount > 0) {
      unresolvedQuestions.push(issue('LEARNING_QUESTION_OPEN', 'evidence', 'Existe una pregunta o hipotesis pendiente que puede orientar el siguiente ciclo.'));
    }

    const dimensions = { ...baseDimensions };
    let overallStatus: DecisionReadinessStatus;

    switch (input.decisionType) {
      case 'continue_experimenting':
        overallStatus = this.evaluateContinue(input, dimensions, hardBlockers, conditions, unresolvedQuestions, rationale);
        break;
      case 'implement':
        overallStatus = this.evaluateImplement(input, dimensions, hardBlockers, conditions, rationale);
        break;
      case 'scale':
        overallStatus = this.evaluateScale(input, dimensions, hardBlockers, conditions, rationale);
        break;
      case 'pause':
        overallStatus = this.evaluatePause(input, dimensions, hardBlockers, conditions, rationale);
        break;
      case 'close_with_learning':
        overallStatus = this.evaluateCloseWithLearning(input, dimensions, hardBlockers, conditions, rationale);
        break;
      default:
        exhaustive(input.decisionType);
    }

    if (hardBlockers.length > 0) overallStatus = 'not_ready';

    return {
      assessmentVersion: 1,
      projectId: input.projectId,
      cycleId: input.cycleId,
      decisionType: input.decisionType,
      overallStatus,
      dimensions,
      hardBlockers,
      conditions,
      unresolvedQuestions,
      rationale,
      evaluatedAt,
    };
  }

  private evaluateDimensions(input: DecisionReadinessInput): Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus> {
    return {
      evidence: this.evidenceDimension(input),
      impact: this.impactDimension(input),
      execution: this.executionDimension(input),
      risk: this.riskDimension(input),
      governance: this.governanceDimension(input),
    };
  }

  private evidenceDimension(input: DecisionReadinessInput): DecisionReadinessDimensionStatus {
    if (input.evidenceContext.supportedClaimCount > 0) return 'sufficient';
    if (input.evidenceContext.evidenceCount > 0 || input.evidenceContext.claimCount > 0) return 'partial';
    return 'insufficient';
  }

  private impactDimension(input: DecisionReadinessInput): DecisionReadinessDimensionStatus {
    if (input.impactContext.realizedCount > 0 || input.impactContext.validatedCount > 0) return 'sufficient';
    if (input.impactContext.estimatedCount > 0) return 'partial';
    return 'insufficient';
  }

  private executionDimension(input: DecisionReadinessInput): DecisionReadinessDimensionStatus {
    if (input.executionContext.hasProvenExecutionReadiness && input.executionContext.openOperationalBlockerCount === 0) return 'sufficient';
    if (input.executionContext.hasExecutionSignal || input.executionContext.hasOperationalReadinessSignal || input.executionContext.currentStep >= 2) return 'partial';
    return 'insufficient';
  }

  private riskDimension(input: DecisionReadinessInput): DecisionReadinessDimensionStatus {
    if (input.riskContext.openCriticalRiskCount > 0) return 'insufficient';
    if (input.riskContext.hasProvenRiskReadiness && input.riskContext.openHighRiskCount === 0) return 'sufficient';
    if (input.riskContext.hasRiskSignal || input.riskContext.knownRiskCount > 0 || input.riskContext.openHighRiskCount > 0) return 'partial';
    return 'insufficient';
  }

  private governanceDimension(input: DecisionReadinessInput): DecisionReadinessDimensionStatus {
    if (input.governanceContext.hasProjectOwner && input.governanceContext.hasActiveTeamMember && input.governanceContext.hasPortfolioContext) return 'sufficient';
    if (input.governanceContext.hasProjectOwner || input.governanceContext.hasActiveTeamMember || input.governanceContext.hasPortfolioContext) return 'partial';
    return 'insufficient';
  }

  private evaluateContinue(
    input: DecisionReadinessInput,
    dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>,
    hardBlockers: DecisionReadinessIssue[],
    conditions: DecisionReadinessIssue[],
    unresolvedQuestions: DecisionReadinessIssue[],
    rationale: string[],
  ): DecisionReadinessStatus {
    if (input.learningContext.unresolvedQuestionCount === 0) {
      conditions.push(issue('LEARNING_QUESTION_REQUIRED', 'evidence', 'Continuar experimentando requiere una pregunta de aprendizaje significativa.'));
    }
    if (dimensions.execution === 'insufficient') {
      conditions.push(issue('EXPERIMENT_FEASIBILITY_MISSING', 'execution', 'Falta una base minima de factibilidad para ejecutar otro ciclo de aprendizaje.'));
    }
    if (dimensions.governance === 'insufficient') {
      conditions.push(issue('OPERATING_CONTEXT_MISSING', 'governance', 'Falta contexto operativo minimo para sostener otro ciclo.'));
    }
    if (hardBlockers.length > 0) return 'not_ready';
    if (unresolvedQuestions.length > 0 && dimensions.execution !== 'insufficient' && dimensions.governance !== 'insufficient') {
      rationale.push('Otro ciclo de aprendizaje puede ser responsable sin exigir impacto validado.');
      return conditions.length > 0 ? 'conditionally_ready' : 'ready';
    }
    return 'conditionally_ready';
  }

  private evaluateImplement(
    _input: DecisionReadinessInput,
    dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>,
    hardBlockers: DecisionReadinessIssue[],
    conditions: DecisionReadinessIssue[],
    rationale: string[],
  ): DecisionReadinessStatus {
    requireAtLeast(dimensions, 'evidence', 'sufficient', conditions);
    requireAtLeast(dimensions, 'impact', 'partial', conditions);
    requireAtLeast(dimensions, 'execution', 'partial', conditions);
    requireAtLeast(dimensions, 'risk', 'partial', conditions);
    requireAtLeast(dimensions, 'governance', 'partial', conditions);
    if (dimensions.execution !== 'sufficient') conditions.push(issue('EXECUTION_CONDITION', 'execution', 'La implementacion requiere cerrar condiciones operativas antes de avanzar sin restricciones.'));
    if (hardBlockers.length > 0 || dimensions.evidence !== 'sufficient' || dimensions.impact === 'insufficient') return 'not_ready';
    rationale.push('Implementar requiere soporte suficiente y condiciones explicitas cuando ejecucion, riesgo o gobernanza no estan cerrados.');
    return conditions.length > 0 ? 'conditionally_ready' : 'ready';
  }

  private evaluateScale(
    _input: DecisionReadinessInput,
    dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>,
    hardBlockers: DecisionReadinessIssue[],
    conditions: DecisionReadinessIssue[],
    rationale: string[],
  ): DecisionReadinessStatus {
    for (const dimension of DIMENSIONS) requireAtLeast(dimensions, dimension, 'sufficient', conditions);
    if (hardBlockers.length > 0 || DIMENSIONS.some((dimension) => dimensions[dimension] !== 'sufficient')) {
      rationale.push('Escalar exige un umbral mayor que implementar, con impacto validado o realizado.');
      return 'not_ready';
    }
    return 'ready';
  }

  private evaluatePause(
    input: DecisionReadinessInput,
    dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>,
    _hardBlockers: DecisionReadinessIssue[],
    conditions: DecisionReadinessIssue[],
    rationale: string[],
  ): DecisionReadinessStatus {
    if (input.learningContext.capturedLearningCount === 0 && input.learningContext.unresolvedQuestionCount === 0 && dimensions.risk === 'insufficient') {
      conditions.push(issue('PAUSE_RATIONALE_MISSING', 'risk', 'Pausar requiere una razon o contexto explicito.'));
      return 'not_ready';
    }
    rationale.push('Pausar no exige readiness de implementacion; exige razon suficiente para no seguir ejecutando ahora.');
    return conditions.length > 0 ? 'conditionally_ready' : 'ready';
  }

  private evaluateCloseWithLearning(
    input: DecisionReadinessInput,
    dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>,
    _hardBlockers: DecisionReadinessIssue[],
    conditions: DecisionReadinessIssue[],
    rationale: string[],
  ): DecisionReadinessStatus {
    if (input.learningContext.capturedLearningCount === 0 && input.evidenceContext.contradictedEvidenceCount === 0 && input.evidenceContext.contradictedValidationCount === 0) {
      conditions.push(issue('LEARNING_RATIONALE_MISSING', 'evidence', 'Cerrar con aprendizaje requiere aprendizaje capturado o evidencia que contradiga la tesis.'));
      return 'not_ready';
    }
    if (dimensions.evidence === 'insufficient' && input.learningContext.capturedLearningCount === 0) {
      conditions.push(issue('CLOSURE_EVIDENCE_MISSING', 'evidence', 'Falta una base minima para documentar el aprendizaje de cierre.'));
      return 'not_ready';
    }
    rationale.push('Cerrar con aprendizaje puede ser responsable aunque la evidencia sea negativa.');
    return 'ready';
  }
}

function issue(code: string, dimension: DecisionReadinessDimension, message: string): DecisionReadinessIssue {
  return { code, dimension, message };
}

function requireAtLeast(
  dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>,
  dimension: DecisionReadinessDimension,
  required: DecisionReadinessDimensionStatus,
  conditions: DecisionReadinessIssue[],
) {
  if (meets(dimensions[dimension], required)) return;
  conditions.push(issue(`${dimension.toUpperCase()}_${required.toUpperCase()}_REQUIRED`, dimension, `${dimension} requiere estado ${required} para este tipo de decision.`));
}

function meets(actual: DecisionReadinessDimensionStatus, required: DecisionReadinessDimensionStatus) {
  const order: Record<DecisionReadinessDimensionStatus, number> = { insufficient: 0, partial: 1, sufficient: 2 };
  return order[actual] >= order[required];
}

function exhaustive(value: never): never {
  throw new Error(`Unsupported decision type: ${value}`);
}
