export type PortfolioBootstrapAnalyzerMode = 'deterministic' | 'real_ai';
export type StrategicConnectionProposalStatus =
  | 'probable_alignment'
  | 'partial_alignment'
  | 'alignment_unknown'
  | 'possible_misalignment';
export type BootstrapUncertainty = 'low' | 'medium' | 'high';
export type AdvancementConditionType =
  | 'business_signal'
  | 'decision_path'
  | 'critical_dependency'
  | 'required_context'
  | 'ownership_visibility';
export type AdvancementSeverity = 'info' | 'attention' | 'blocking';

export interface AnalyzerAnchorInput {
  id: string;
  outcomeStatement: string;
  contextSummary?: string | null;
  decisionToEnable?: string | null;
  businessSignalValue?: string | null;
  version: number;
  sourceRefs: unknown;
}

export interface AnalyzerWorkItemInput {
  id: string;
  rawLabel: string;
  proposedName?: string | null;
  proposedPurpose?: string | null;
  currentStateHint?: string | null;
  sourceRefs: unknown;
}

export interface PortfolioBootstrapAnalysisInput {
  anchor: AnalyzerAnchorInput;
  workItems: AnalyzerWorkItemInput[];
}

export interface WorkItemAnalysis {
  workItemId: string;
  strategicConnection: {
    proposedStatus: StrategicConnectionProposalStatus;
    rationale: string;
    uncertainty: BootstrapUncertainty;
    sourceRefs: string[];
  };
  advancementConditions: Array<{
    type: AdvancementConditionType;
    statement: string;
    status: string;
    severity: AdvancementSeverity;
    movementAffected?: string;
    sourceRefs: string[];
    uncertainty: BootstrapUncertainty;
  }>;
  conflicts: Array<{
    statement: string;
    sourceRefs: string[];
  }>;
}

export interface PortfolioBootstrapAnalysisOutput {
  workItemAnalyses: WorkItemAnalysis[];
  portfolioLevelFindings: Array<{
    type: 'missing_business_signal' | 'missing_decision_path' | 'information_conflict';
    statement: string;
    sourceRefs: string[];
  }>;
}

export interface PortfolioBootstrapAnalyzer {
  mode: PortfolioBootstrapAnalyzerMode;
  analyze(input: PortfolioBootstrapAnalysisInput): Promise<PortfolioBootstrapAnalysisOutput>;
}

export class DeterministicPortfolioBootstrapAnalyzer implements PortfolioBootstrapAnalyzer {
  readonly mode = 'deterministic' as const;

  async analyze(input: PortfolioBootstrapAnalysisInput): Promise<PortfolioBootstrapAnalysisOutput> {
    const anchorWords = meaningfulWords([
      input.anchor.outcomeStatement,
      input.anchor.contextSummary,
      input.anchor.decisionToEnable,
      input.anchor.businessSignalValue,
    ].filter(Boolean).join(' '));

    const workItemAnalyses = input.workItems.map((workItem) => {
      const label = [workItem.proposedName, workItem.rawLabel, workItem.proposedPurpose].filter(Boolean).join(' ');
      const workWords = meaningfulWords(label);
      const overlapCount = workWords.filter((word) => anchorWords.includes(word)).length;
      const proposedStatus = resolveConnectionStatus(overlapCount, workItem.proposedPurpose);
      const uncertainty: BootstrapUncertainty = proposedStatus === 'alignment_unknown' ? 'high' : 'medium';
      const sourceRefs = [`work_item:${workItem.id}`, `anchor:${input.anchor.id}`];

      return {
        workItemId: workItem.id,
        strategicConnection: {
          proposedStatus,
          rationale: connectionRationale(proposedStatus),
          uncertainty,
          sourceRefs,
        },
        advancementConditions: buildAdvancementConditions(workItem, input.anchor),
        conflicts: detectConflicts(workItem, input.anchor),
      };
    });

    return {
      workItemAnalyses,
      portfolioLevelFindings: portfolioFindings(input),
    };
  }
}

function resolveConnectionStatus(overlapCount: number, purpose?: string | null): StrategicConnectionProposalStatus {
  if (overlapCount >= 2) return 'probable_alignment';
  if (overlapCount === 1 || hasText(purpose)) return 'partial_alignment';
  return 'alignment_unknown';
}

function connectionRationale(status: StrategicConnectionProposalStatus): string {
  if (status === 'probable_alignment') return 'Comparte lenguaje material con el Portfolio Anchor, pero aun requiere revision humana.';
  if (status === 'partial_alignment') return 'Tiene alguna relacion interpretable o proposito declarado, pero la conexion no esta completa.';
  if (status === 'possible_misalignment') return 'Hay indicios de distancia con el Portfolio Anchor; debe revisarse antes de concluir.';
  return 'La fuente no aporta suficiente informacion para proponer una relacion clara.';
}

function buildAdvancementConditions(workItem: AnalyzerWorkItemInput, anchor: AnalyzerAnchorInput): WorkItemAnalysis['advancementConditions'] {
  const sourceRefs = [`work_item:${workItem.id}`];
  const conditions: WorkItemAnalysis['advancementConditions'] = [];
  const text = normalize([workItem.rawLabel, workItem.proposedName, workItem.proposedPurpose].filter(Boolean).join(' '));

  if (!mentionsSignal(text)) {
    conditions.push({
      type: 'business_signal',
      statement: 'No se observa una senal de negocio explicita para este trabajo.',
      status: 'signal_unknown',
      severity: 'attention',
      sourceRefs,
      uncertainty: 'medium',
    });
  }

  if (!hasText(anchor.decisionToEnable) && !mentionsDecision(text)) {
    conditions.push({
      type: 'decision_path',
      statement: 'La ruta de decision aun no esta clara para este trabajo.',
      status: 'decision_path_unknown',
      severity: 'attention',
      sourceRefs,
      uncertainty: 'medium',
    });
  }

  const dependency = findDependency(text);
  if (dependency) {
    conditions.push({
      type: 'critical_dependency',
      statement: `Aparece una dependencia a revisar: ${dependency}.`,
      status: 'dependency_detected',
      severity: mentionsBlocking(text) ? 'blocking' : 'attention',
      movementAffected: mentionsBlocking(text) ? 'Siguiente movimiento del portfolio' : undefined,
      sourceRefs,
      uncertainty: mentionsBlocking(text) ? 'low' : 'medium',
    });
  }

  if (!hasText(workItem.proposedPurpose)) {
    conditions.push({
      type: 'required_context',
      statement: 'Falta contexto sobre que intenta conseguir este trabajo.',
      status: 'context_missing',
      severity: 'attention',
      sourceRefs,
      uncertainty: 'low',
    });
  }

  conditions.push({
    type: 'ownership_visibility',
    statement: 'No hay owner organizacional confirmado para este trabajo.',
    status: 'missing',
    severity: 'info',
    sourceRefs,
    uncertainty: 'medium',
  });

  return conditions;
}

function detectConflicts(workItem: AnalyzerWorkItemInput, anchor: AnalyzerAnchorInput): WorkItemAnalysis['conflicts'] {
  const text = normalize([workItem.rawLabel, workItem.proposedPurpose].filter(Boolean).join(' '));
  const anchorText = normalize(anchor.outcomeStatement);
  if (text.includes('pausar') && (anchorText.includes('crecer') || anchorText.includes('aumentar'))) {
    return [{
      statement: 'El trabajo menciona pausar mientras el anchor apunta a crecimiento; requiere revision.',
      sourceRefs: [`work_item:${workItem.id}`, `anchor:${anchor.id}`],
    }];
  }
  return [];
}

function portfolioFindings(input: PortfolioBootstrapAnalysisInput): PortfolioBootstrapAnalysisOutput['portfolioLevelFindings'] {
  const findings: PortfolioBootstrapAnalysisOutput['portfolioLevelFindings'] = [];
  if (!hasText(input.anchor.businessSignalValue)) {
    findings.push({
      type: 'missing_business_signal',
      statement: 'El Portfolio Anchor aun no tiene senal de negocio explicita.',
      sourceRefs: [`anchor:${input.anchor.id}`],
    });
  }
  if (!hasText(input.anchor.decisionToEnable)) {
    findings.push({
      type: 'missing_decision_path',
      statement: 'El Portfolio Anchor no explicita que decision debe habilitar.',
      sourceRefs: [`anchor:${input.anchor.id}`],
    });
  }
  return findings;
}

function mentionsSignal(text: string): boolean {
  return /\b(kpi|senal|metrica|conversion|retencion|ingresos|coste|costo|tickets|nps|churn|abandono)\b/.test(text);
}

function mentionsDecision(text: string): boolean {
  return /\b(decidir|decision|comite|aprobar|priorizar|invertir|continuar|cerrar|pausar)\b/.test(text);
}

function findDependency(text: string): string | null {
  const dependencies = ['it', 'data', 'legal', 'compliance', 'operations', 'operaciones', 'procurement', 'compras', 'commercial', 'comercial'];
  return dependencies.find((dependency) => text.includes(dependency)) ?? null;
}

function mentionsBlocking(text: string): boolean {
  return /\b(bloquea|bloqueado|impide|no puede avanzar|detenido)\b/.test(text);
}

function meaningfulWords(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasText(value?: string | null): boolean {
  return Boolean(value?.trim());
}

const STOP_WORDS = new Set([
  'para',
  'esta',
  'este',
  'esto',
  'como',
  'sobre',
  'desde',
  'hacia',
  'trabajo',
  'iniciativa',
  'proyecto',
  'programa',
  'nuevo',
  'nueva',
  'digital',
]);
