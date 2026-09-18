import type { PortfolioEntryAnalysisV2 } from '../domain/analysis.schema';
import type { PortfolioEntryHandoffV2 } from '../domain/handoff.schema';
import type { SessionContext, SessionExecutionResult } from '../domain/session.types';
import type { ModelExecutionResult } from '../model/model-execution-types';
import { buildPortfolioEntryHandoffV2 } from './handoff-builder';
import type { ValueHandoffEvidenceV2 } from './value-handoff-evidence';

export interface PortfolioEntryHandoffMaterializer {
  materialize(input: {
    sessionId: string;
    runId: string;
    analysis: PortfolioEntryAnalysisV2;
    context: SessionContext;
  }): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown>; valueDeltaEvidence?: ValueHandoffEvidenceV2 }>;
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
  }): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown>; valueDeltaEvidence?: ValueHandoffEvidenceV2 }> {
    const built = buildPortfolioEntryHandoffV2({
      candidate_source: deterministicHandoffCandidate(input.analysis),
      final_analysis: input.analysis,
      execution: createExecution(input),
    });
    if (!built.handoff || !built.schema_valid) {
      throw new Error('Portfolio Entry deterministic handoff materializer produced an invalid handoff.');
    }
    return { handoff: built.handoff, valueDeltaEvidence: built.value_delta_evidence ?? undefined };
  }
}

export class UnconfiguredPortfolioEntryHandoffMaterializer implements PortfolioEntryHandoffMaterializer {
  async materialize(): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown>; valueDeltaEvidence?: ValueHandoffEvidenceV2 }> {
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
  const sourceText = contextText(analysis.extracted_context, 'summary')
    ?? contextText(analysis.extracted_context, 'goal')
    ?? `Situación de ${analysis.current_frame.replaceAll('_', ' ')}.`;
  const goal = contextText(analysis.extracted_context, 'desired_outcome')
    ?? contextText(analysis.extracted_context, 'outcome')
    ?? 'ganar claridad para decidir el siguiente foco';
  const decision = contextText(analysis.extracted_context, 'decision_to_enable')
    ?? contextText(analysis.extracted_context, 'decision')
    ?? contextText(analysis.extracted_context, 'decision_needed');
  const provenance = { origin: 'AI_SUGGESTED' as const, source_path: 'latestAnalysis', source_text: sourceText };
  const gaps = buildGaps(analysis, decision, provenance);
  const approach = decision
    ? `Empezar por ordenar la situación alrededor de la decisión «${decision}», relacionando el contexto disponible con las señales y la evidencia que ya existen antes de abrir trabajo nuevo.`
    : 'Empezar por ordenar la situación y hacer explícita la decisión que se quiere habilitar, relacionando las iniciativas o señales mencionadas con la evidencia disponible antes de abrir trabajo nuevo.';
  const approachWithContext = `${approach} Contexto considerado: ${sourceText}`;
  return {
    understanding: {
      value: sourceText || 'El usuario quiere ordenar una iniciativa dentro de un portafolio.',
      provenance,
    },
    desired_outcome: {
      value: goal,
      provenance,
    },
    decision_to_enable: decision ? { value: decision, provenance } : 'unresolved',
    recommended_approach: {
      description: approachWithContext,
      rationale: `Esta secuencia aborda ${decision ? `la decisión de ${decision}` : 'la falta de una decisión explícita'} y permite comparar actividad, relación con el objetivo y evidencia sin afirmar causalidad.`,
      assumption: decision
        ? 'El criterio de atención todavía requiere revisión humana y puede cambiar con nueva evidencia.'
        : 'La decisión material todavía necesita aclaración; la recomendación es provisional.',
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
    unresolved_context: gaps.unresolved,
    gap_resolution_map: gaps.resolutions,
    evidence_or_clarity_needed: [{
      value: 'Confirmacion humana de campos sugeridos y gaps pendientes.',
      provenance,
    }],
    starteria_path: [
      { action: 'structure', description: `Estructurar ${sourceText.toLowerCase()} alrededor del criterio de atención.` },
      { action: 'make_visible', description: 'Hacer visibles las relaciones entre iniciativas, señales, actividad y evidencia disponible.' },
      { action: 'compare_or_follow', description: 'Comparar o seguir qué elementos requieren atención, pausa o profundización.' },
      { action: 'resolve_gaps', description: gaps.unresolved.length ? 'Registrar qué necesita aclaración organizacional o evidencia externa.' : 'Mantener visibles los supuestos que todavía pueden cambiar la lectura.' },
      { action: 'prepare_decision', description: `Preparar una lectura revisable para ${decision ? `la decisión de ${decision}` : 'definir la decisión que sigue'}.` },
    ],
    recommended_cta: 'Continuar con mi portafolio',
    provenance_summary: [provenance],
    handoff_status: analysis.ambiguities.length || !decision ? 'ready_with_uncertainty' : 'ready',
  };
}

function contextText(context: Record<string, unknown>, key: string): string | null {
  const value = context[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function buildGaps(
  analysis: PortfolioEntryAnalysisV2,
  decision: string | null,
  provenance: { origin: 'AI_SUGGESTED'; source_path: string; source_text: string },
) {
  const descriptions = analysis.ambiguities
    .map((gap) => typeof gap === 'string' ? gap : 'Hay contexto material pendiente de aclaración.')
    .filter((gap, index, all) => all.indexOf(gap) === index);
  if (!decision) descriptions.unshift('Todavía no está explícita la decisión que debe habilitar el trabajo.');
  if (!descriptions.length) descriptions.push('La relación entre la situación y la evidencia disponible aún debe validarse.');

  const unresolved = descriptions.map((description, index) => ({
    gap_id: `gap-${index + 1}`,
    description,
    provenance,
  }));
  const resolutions = unresolved.map((gap) => ({
    gap_id: gap.gap_id,
    gap_description: gap.description,
    resolution_type: gap.description.includes('evidencia')
      ? 'REQUIRES_EXTERNAL_EVIDENCE' as const
      : gap.description.includes('decisión')
        ? 'REQUIRES_ORGANIZATIONAL_INPUT' as const
        : 'STARTERIA_CAN_STRUCTURE' as const,
    starteria_capability: gap.description.includes('evidencia')
      ? 'Starteria puede registrar y conectar la evidencia con la decisión; no la inventa.'
      : 'Starteria puede estructurar el gap y mantenerlo visible para revisión.',
    resolution_stage: 'PORTFOLIO' as const,
    provenance,
  }));
  return { unresolved, resolutions };
}
