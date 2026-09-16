import type { PortfolioEntryAnalysisV2 } from '../domain/analysis.schema';
import type { PortfolioEntryHandoffV2 } from '../domain/handoff.schema';
import type { SessionContext, SessionExecutionResult } from '../domain/session.types';
import type { ModelExecutionResult } from '../model/model-execution-types';
import { buildPortfolioEntryHandoffV2 } from './handoff-builder';

export interface PortfolioEntryHandoffMaterializer {
  materialize(input: {
    sessionId: string;
    runId: string;
    analysis: PortfolioEntryAnalysisV2;
    context: SessionContext;
  }): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown> }>;
}

export class PortfolioEntryRuntimeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioEntryRuntimeConfigurationError';
  }
}

export class DeterministicPortfolioEntryHandoffMaterializer implements PortfolioEntryHandoffMaterializer {
  async materialize(input: {
    sessionId: string;
    runId: string;
    analysis: PortfolioEntryAnalysisV2;
    context: SessionContext;
  }): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown> }> {
    const built = buildPortfolioEntryHandoffV2({
      candidate_source: deterministicHandoffCandidate(input.analysis),
      final_analysis: input.analysis,
      execution: createExecution(input),
    });
    if (!built.handoff || !built.schema_valid) {
      throw new Error('Portfolio Entry deterministic handoff materializer produced an invalid handoff.');
    }
    return { handoff: built.handoff };
  }
}

export class UnconfiguredPortfolioEntryHandoffMaterializer implements PortfolioEntryHandoffMaterializer {
  async materialize(): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown> }> {
    throw new PortfolioEntryRuntimeConfigurationError('Portfolio Entry live handoff materializer is not configured.');
  }
}

function createExecution(input: {
  sessionId: string;
  runId: string;
  context: SessionContext;
}): SessionExecutionResult {
  return {
    trace: {
      case_id: input.sessionId,
      run_id: input.runId,
      candidate_id: 'portfolio-entry-api-v1',
      turns: [],
      questions_total: 0,
      quick_questions_total: input.context.quick_questions_asked,
      exploration_rounds: input.context.exploration_round,
      mode_transitions: [],
      stop_reason: null,
      clarification_status: 'ready_for_handoff',
      execution_guard_triggered: false,
    },
    final_context: input.context,
    completed: true,
    stop_reason: 'checkpoint_reached',
    violations: [],
  };
}

function deterministicHandoffCandidate(analysis: PortfolioEntryAnalysisV2): PortfolioEntryHandoffV2 {
  const sourceText = typeof analysis.extracted_context.summary === 'string'
    ? analysis.extracted_context.summary
    : 'Entrada inicial de Portfolio Entry.';
  const provenance = { origin: 'AI_SUGGESTED' as const, source_path: 'latestAnalysis', source_text: sourceText };
  return {
    understanding: {
      value: sourceText || 'El usuario quiere ordenar una iniciativa dentro de un portafolio.',
      provenance,
    },
    desired_outcome: {
      value: 'Conectar la intencion del negocio con iniciativas, evidencia y decisiones posteriores.',
      provenance,
    },
    decision_to_enable: {
      value: 'Definir que debe decidirse despues de revisar la evidencia disponible.',
      provenance,
    },
    recommended_approach: {
      description: 'Estructurar la entrada como una sesion pre-canonica revisable.',
      rationale: 'Permite mantener inferencias como sugeridas hasta confirmacion humana.',
      assumption: 'La iniciativa aun no debe convertirse en una entidad canonica.',
      origin: 'AI_SUGGESTED',
      review_disposition: 'UNREVIEWED',
      provenance: [provenance],
    },
    alternative_approaches: [],
    known_context: [{
      key: 'current_frame',
      value: analysis.current_frame,
      provenance,
    }],
    unresolved_context: (analysis.ambiguities.length ? analysis.ambiguities : ['decision_to_enable']).map((gap, index) => ({
      gap_id: `gap-${index + 1}`,
      description: typeof gap === 'string' ? gap : 'Contexto pendiente de clarificacion.',
      provenance,
    })),
    gap_resolution_map: [{
      gap_id: 'gap-1',
      gap_description: 'Contexto que requiere validacion humana antes de cualquier conversion.',
      resolution_type: 'REQUIRES_ORGANIZATIONAL_INPUT',
      resolution_stage: 'PORTFOLIO',
      provenance,
    }],
    evidence_or_clarity_needed: [{
      value: 'Confirmacion humana de campos sugeridos y gaps pendientes.',
      provenance,
    }],
    starteria_path: [{
      action: 'structure',
      description: 'Mantener la sesion como handoff pre-canonico listo para revision.',
    }],
    recommended_cta: 'Revisar y confirmar o corregir el handoff pre-canonico.',
    provenance_summary: [provenance],
    handoff_status: analysis.ambiguities.length ? 'ready_with_uncertainty' : 'ready',
  };
}
