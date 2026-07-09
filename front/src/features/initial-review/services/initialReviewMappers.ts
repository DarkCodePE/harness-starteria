import type { Project, Step0Data } from '../../../app/context/AppContext';
import { normalizeStep0Data, syncLegacyFields } from '../../../app/step0/step0Config';
import type { ChallengeType, InitialReview, InitialReviewArtifact, InitialReviewArtifactMessage } from '../domain/types';

const FRAME_BY_TYPE: Record<ChallengeType, Step0Data['initiativeFrame']> = {
  correction: 'correccion',
  growth: 'crecimiento',
  exploration: 'exploracion',
};

const OBJECTIVE_BY_TYPE: Record<ChallengeType, Step0Data['primaryObjective']> = {
  correction: 'eficiencia',
  growth: 'ingresos',
  exploration: 'aprendizaje',
};

export interface InitialReviewProjectDraft {
  name: string;
  description: string;
  step0Data: Step0Data;
}

const FALLBACK_ROUTE = 'Completar Step 0 para aterrizar contexto, alcance, actores y condiciones reales.';

function compactAnswers(review: InitialReview): Record<string, string> {
  return Object.entries({
    inputText: review.inputText,
    adjustedContext: review.answers?.adjustedContext,
    motivation: review.answers?.motivation,
    stakeholder: review.answers?.stakeholder,
    evidence: review.answers?.evidence,
    expectedOutcome: review.answers?.expectedOutcome,
    riskContext: review.answers?.riskContext,
    firstAction: review.answers?.firstAction,
    additionalContext: review.answers?.additionalContext,
  }).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.trim()) acc[key] = value.trim();
    return acc;
  }, {});
}

function buildConversation(review: InitialReview): InitialReviewArtifactMessage[] {
  const createdAt = review.createdAt || new Date().toISOString();
  const answers = compactAnswers(review);
  const messages: InitialReviewArtifactMessage[] = [];

  const push = (role: InitialReviewArtifactMessage['role'], text?: string) => {
    if (!text?.trim()) return;
    messages.push({
      id: `${review.id}-msg-${messages.length + 1}`,
      role,
      text: text.trim(),
      createdAt,
    });
  };

  push('assistant', 'Vamos a ordenar tu iniciativa antes de crearla como proyecto.');
  push('user', answers.inputText);
  push('user', answers.adjustedContext);
  push('user', answers.motivation);
  push('user', answers.stakeholder);
  push('user', answers.evidence);
  push('user', answers.expectedOutcome);
  push('user', answers.riskContext);
  push('user', answers.firstAction);
  push('assistant', review.output?.improvedProposal.proposal);
  push('assistant', review.output ? `Ruta recomendada: ${FALLBACK_ROUTE}` : undefined);

  return messages;
}

export function buildInitialReviewArtifact(review: InitialReview, initiativeId = ''): InitialReviewArtifact {
  if (!review.output) {
    throw new Error('INITIAL_REVIEW_OUTPUT_REQUIRED');
  }

  const challengeType = review.selectedChallengeType ?? review.output.suggestedChallengeType;
  const answers = compactAnswers(review);
  const pendingQuestions = review.output.strategicQuestions
    .filter(question => question.status === 'unanswered' || question.status === 'unknown')
    .map(question => question.answer ? `${question.question}: ${question.answer}` : question.question);
  const mainRisk = answers.riskContext || review.output.critique.mainRisk || review.output.critique.risky;

  return {
    id: `artifact-${review.id}`,
    initiativeId,
    source: 'initial_review_chat',
    status: initiativeId ? 'converted_to_initiative' : 'completed',
    createdAt: review.createdAt,
    updatedAt: new Date().toISOString(),
    conversation: buildConversation(review),
    answers,
    onePager: {
      title: review.output.improvedProposal.suggestedName,
      whatToMove: answers.adjustedContext || review.output.understandingSummary || review.output.improvedProposal.proposal,
      challengeType,
      whyNow: answers.motivation || review.output.improvedProposal.initialFocus,
      impactedAudience: answers.stakeholder || review.output.improvedProposal.expectedImpact,
      initialEvidence: answers.evidence || 'Pendiente de validar en Step 0.',
      mainRisk,
      pendingQuestions,
      recommendedRoute: FALLBACK_ROUTE,
      nextStep: review.output.improvedProposal.nextRecommendedStep || 'Empezar Step 0 para completar la base inicial.',
    },
  };
}

export function buildProjectDraftFromInitialReview(
  review: InitialReview,
  projectShell: Project,
  userName: string,
  userEmail: string,
): InitialReviewProjectDraft {
  if (!review.output) {
    throw new Error('INITIAL_REVIEW_OUTPUT_REQUIRED');
  }

  const challengeType = review.selectedChallengeType ?? review.output.suggestedChallengeType;
  const motivation = review.answers?.motivation;
  const stakeholder = review.answers?.stakeholder;
  const firstAction = review.answers?.firstAction;
  const evidence = review.answers?.evidence;
  const expectedOutcome = review.answers?.expectedOutcome;
  const riskContext = review.answers?.riskContext;
  const pendingQuestions = review.output.strategicQuestions
    .filter(question => question.status === 'unanswered' || question.status === 'unknown')
    .map(question => `${question.question}${question.answer ? `: ${question.answer}` : ''}`);
  const risk = review.output.critique.mainRisk || review.output.critique.risky;
  const artifact = buildInitialReviewArtifact(review);

  const rawStep0 = {
    initiativeTitle: review.output.improvedProposal.suggestedName,
    initiativeFrame: FRAME_BY_TYPE[challengeType],
    primaryObjective: OBJECTIVE_BY_TYPE[challengeType],
    quePasaQueQuieres: artifact.onePager.whatToMove,
    impactWho: stakeholder || artifact.onePager.impactedAudience,
    whyNowText: motivation || artifact.onePager.whyNow,
    evidenceType: 'hipotesis',
    currentEvidence: evidence || artifact.onePager.initialEvidence,
    validationSignal: [expectedOutcome, riskContext, ...artifact.onePager.pendingQuestions].filter(Boolean).join('\n'),
    supportNeeded: firstAction || expectedOutcome || review.output.improvedProposal.nextRecommendedStep,
    decisionRequested: firstAction
      ? `Usar Step 0 para preparar la iniciativa y avanzar hacia: ${firstAction}.`
      : 'Completar Step 0 y definir si corresponde avanzar a investigacion.',
    quienEscuchar: stakeholder || '',
    initialReview: {
      reviewId: review.id,
      challengeType,
      risk,
      pendingQuestions,
      nextRecommendedStep: review.output.improvedProposal.nextRecommendedStep,
      artifact,
    },
  } as Partial<Step0Data> & {
    initialReview: {
      reviewId: string;
      challengeType: ChallengeType;
      risk: string;
      pendingQuestions: string[];
      nextRecommendedStep: string;
      artifact: InitialReviewArtifact;
    };
  };

  const initialReviewMeta = rawStep0.initialReview;
  const normalized = normalizeStep0Data(rawStep0, projectShell, userName, userEmail);
  const synced = {
    ...syncLegacyFields(normalized),
    initialReview: initialReviewMeta,
  } as Step0Data;

  return {
    name: review.output.improvedProposal.suggestedName,
    description: review.output.improvedProposal.proposal,
    step0Data: synced,
  };
}
