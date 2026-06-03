/**
 * Server-side port of the frontend draft→Step0 mapper
 * (front/src/features/public-start/domain/mappers.ts) for the pilot-claim flow
 * (ADR-018). The proposal snapshot persisted with a PilotLead carries the same
 * `aiOutput` shape (PublicDraftOutput), so the mapping transfers 1:1.
 *
 * Pure functions, no Prisma — hermetically testable. Output keys match
 * `updateStep0Schema` (project.schemas.ts) so it feeds ProjectService.updateStep0.
 */

interface AiOutput {
  proposalTitle?: string;
  whatToMove?: string;
  whyNow?: string;
  impactedAudience?: string;
  initialEvidence?: string;
  suggestedStakeholder?: string;
  supportNeeded?: string;
  decisionRequested?: string;
  suggestedChallengeType?: 'correction' | 'growth' | 'exploration' | string;
  suggestedKpiOrSignal?: string;
}

/** The proposal snapshot stored on PilotLead.proposal (pilot-lead.schemas.ts). */
export interface PilotProposalSnapshot {
  inputText?: string;
  sourceType?: string;
  title?: string;
  aiOutput?: AiOutput;
}

type ChallengeType = 'correction' | 'growth' | 'exploration' | string | undefined;

function mapChallengeTypeToFrame(type: ChallengeType): string {
  if (type === 'growth') return 'crecimiento';
  if (type === 'exploration') return 'exploracion';
  return 'correccion';
}

function mapChallengeTypeToObjective(type: ChallengeType): string {
  if (type === 'growth') return 'ingresos';
  if (type === 'exploration') return 'aprendizaje';
  return 'eficiencia';
}

function evidenceTypeFromText(value: string | undefined): string {
  const normalized = value?.toLowerCase() ?? '';
  if (!normalized) return '';
  if (normalized.includes('dato') || normalized.includes('metrica') || normalized.includes('métrica')) return 'datos';
  if (normalized.includes('entrevista') || normalized.includes('cliente') || normalized.includes('usuario')) return 'testimonios';
  if (normalized.includes('benchmark') || normalized.includes('referencia')) return 'benchmark';
  return 'hipotesis';
}

/** Project name from the proposal, mirroring AppContext.createProjectFromPublicDraft. */
export function deriveProjectName(proposal: PilotProposalSnapshot | null | undefined): string {
  const title = proposal?.aiOutput?.proposalTitle?.trim() || proposal?.title?.trim();
  return title || 'Propuesta de iniciativa';
}

/**
 * Map a stored pilot proposal to Step0 data. Returns null when there's no
 * `aiOutput` to map (legacy/partial capture) so the caller can create an empty
 * Step0 project instead.
 */
export function mapProposalToStep0Data(
  proposal: PilotProposalSnapshot | null | undefined,
): Record<string, unknown> | null {
  const output = proposal?.aiOutput;
  if (!output) return null;

  const initiativeFrame = mapChallengeTypeToFrame(output.suggestedChallengeType);
  const primaryObjective = mapChallengeTypeToObjective(output.suggestedChallengeType);
  const evidenceType = evidenceTypeFromText(output.initialEvidence);

  return {
    nombreParticipante: '',
    rolArea: '',
    origen:
      initiativeFrame === 'correccion'
        ? 'problema'
        : initiativeFrame === 'crecimiento'
          ? 'oportunidad'
          : 'explorando',
    quePasaQueQuieres: output.whatToMove || proposal?.inputText || '',
    impacta: output.impactedAudience ? [output.impactedAudience] : [],
    parteProceso: '',
    impacto3meses:
      primaryObjective === 'ingresos'
        ? 'ingresos'
        : primaryObjective === 'aprendizaje'
          ? 'no_claro'
          : 'costos',
    respaldo: evidenceType,
    quienEscuchar: output.suggestedStakeholder ?? '',
    siMinimo: output.supportNeeded ? [output.supportNeeded] : [],
    mode: 'independent',
    initiativeTitle: output.proposalTitle ?? '',
    initiativeFrame,
    clarityLevel: output.initialEvidence ? 'algunas_senales' : 'observacion_inicial',
    primaryObjective,
    impactWho: output.impactedAudience ?? '',
    whyNowText: output.whyNow ?? '',
    evidenceType,
    currentEvidence: output.initialEvidence ?? '',
    validationSignal: output.suggestedKpiOrSignal ?? '',
    sponsorInterestReason: output.suggestedStakeholder
      ? `Conviene involucrar a ${output.suggestedStakeholder} porque puede ayudar a destrabar la decision inicial.`
      : '',
    supportNeeded: output.supportNeeded ?? '',
    decisionRequested: output.decisionRequested ?? '',
  };
}
