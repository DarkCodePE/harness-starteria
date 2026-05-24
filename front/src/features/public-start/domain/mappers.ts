import type { Step0Data } from '../../../app/context/AppContext';
import type { PublicDraft, PublicSuggestedChallengeType } from './types';

function mapChallengeTypeToStep0Frame(type: PublicSuggestedChallengeType): Step0Data['initiativeFrame'] {
  switch (type) {
    case 'growth':
      return 'crecimiento';
    case 'exploration':
      return 'exploracion';
    case 'correction':
    default:
      return 'correccion';
  }
}

function mapChallengeTypeToObjective(type: PublicSuggestedChallengeType): Step0Data['primaryObjective'] {
  switch (type) {
    case 'growth':
      return 'ingresos';
    case 'exploration':
      return 'aprendizaje';
    case 'correction':
    default:
      return 'eficiencia';
  }
}

function evidenceTypeFromText(value: string | undefined): Step0Data['evidenceType'] {
  const normalized = value?.toLowerCase() ?? '';
  if (!normalized) return '';
  if (normalized.includes('dato') || normalized.includes('metrica') || normalized.includes('métrica')) return 'datos';
  if (normalized.includes('entrevista') || normalized.includes('cliente') || normalized.includes('usuario')) return 'testimonios';
  if (normalized.includes('benchmark') || normalized.includes('referencia')) return 'benchmark';
  return 'hipotesis';
}

export function mapPublicDraftToStep0Data(draft: PublicDraft): Step0Data {
  const output = draft.aiOutput;
  const initiativeFrame = mapChallengeTypeToStep0Frame(output.suggestedChallengeType);
  const primaryObjective = mapChallengeTypeToObjective(output.suggestedChallengeType);
  const evidenceType = evidenceTypeFromText(output.initialEvidence);

  return {
    nombreParticipante: '',
    rolArea: '',
    origen: initiativeFrame === 'correccion'
      ? 'problema'
      : initiativeFrame === 'crecimiento'
        ? 'oportunidad'
        : 'explorando',
    quePasaQueQuieres: output.whatToMove || draft.inputText,
    impacta: output.impactedAudience ? [output.impactedAudience] : [],
    parteProceso: '',
    impacto3meses: primaryObjective === 'ingresos'
      ? 'ingresos'
      : primaryObjective === 'aprendizaje'
        ? 'no_claro'
        : 'costos',
    respaldo: evidenceType,
    quienEscuchar: output.suggestedStakeholder ?? '',
    siMinimo: output.supportNeeded ? [output.supportNeeded] : [],
    mode: 'independent',
    initiativeTitle: output.proposalTitle,
    initiativeFrame,
    clarityLevel: output.initialEvidence ? 'algunas_senales' : 'observacion_inicial',
    primaryObjective,
    specificChallengePart: '',
    challengeGoalConnection: '',
    linkedContributionType: '',
    impactWho: output.impactedAudience,
    visibleMoment: '',
    whyNowText: output.whyNow,
    ifNotNowConsequence: '',
    evidenceType,
    currentEvidence: output.initialEvidence ?? '',
    validationSignal: output.suggestedKpiOrSignal ?? '',
    sponsorInterestReason: output.suggestedStakeholder
      ? `Conviene involucrar a ${output.suggestedStakeholder} porque puede ayudar a destrabar la decision inicial.`
      : '',
    supportNeeded: output.supportNeeded ?? '',
    decisionRequested: output.decisionRequested ?? '',
    deliveryEmail: '',
    additionalStakeholders: '',
    additionalStakeholdersDetail: '',
    // TODO: cuando el PRD cierre el contrato final, mapear respuestas publicas
    // adicionales a rolArea, visibleMoment e ifNotNowConsequence sin inventar evidencia.
  };
}
