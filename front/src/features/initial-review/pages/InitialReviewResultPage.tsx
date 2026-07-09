import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  MessageSquarePlus,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../app/context/AppContext';
import type { Project } from '../../../app/context/AppContext';
import type { ChallengeType, InitialReview, InitialReviewConversationStage, InitialReviewOutput } from '../domain/types';
import { generateInitialReviewOutput } from '../domain/mockGenerator';
import { buildProjectDraftFromInitialReview } from '../services/initialReviewMappers';
import { getInitialReview, markReviewAsConverted, saveInitialReviewOutput, updateInitialReview } from '../services/initialReviewStorage';

type AnswerKey = 'adjustedContext' | 'motivation' | 'stakeholder' | 'evidence' | 'expectedOutcome' | 'riskContext';
type ChatQuestion = {
  id: string;
  stage: InitialReviewConversationStage;
  answerKey: AnswerKey;
  prompt: string;
  placeholder: string;
  acknowledgement: (answer: string) => string;
};

const CHAT_QUESTIONS: ChatQuestion[] = [
  {
    id: 'idea',
    stage: 'intro',
    answerKey: 'adjustedContext',
    prompt: 'Para empezar, cuéntame en una frase: ¿qué idea, problema u oportunidad quieres mover?',
    placeholder: 'Ej. Quiero reducir el tiempo de aprobación de solicitudes internas...',
    acknowledgement: () => 'Entendido. Ya tengo una primera base para ordenar la iniciativa.',
  },
  {
    id: 'why-now',
    stage: 'motivation',
    answerKey: 'motivation',
    prompt: 'Para entender mejor el foco, ¿por qué crees que esto importa resolverlo o explorarlo ahora?',
    placeholder: 'Ej. Porque está retrasando al equipo comercial cada semana...',
    acknowledgement: () => 'Bien, ahora entiendo mejor por qué este tema importa en este momento.',
  },
  {
    id: 'impact',
    stage: 'stakeholder',
    answerKey: 'stakeholder',
    prompt: '¿A quién impacta principalmente?',
    placeholder: 'Ej. Operaciones, administración, equipo comercial, clientes internos...',
    acknowledgement: () => 'Perfecto. Con eso puedo perfilar mejor a quién debería servir esta iniciativa.',
  },
  {
    id: 'evidence',
    stage: 'first_action',
    answerKey: 'evidence',
    prompt: '¿Qué evidencia, señal o información tienes hasta ahora?',
    placeholder: 'Ej. Reclamos frecuentes, demoras visibles, métricas, conversaciones, intuición...',
    acknowledgement: () => 'Gracias. Voy a tratar eso como una señal inicial, no como una validación definitiva.',
  },
  {
    id: 'outcome',
    stage: 'critical_analysis',
    answerKey: 'expectedOutcome',
    prompt: '¿Qué esperas lograr si esta iniciativa avanza?',
    placeholder: 'Ej. Reducir tiempos, aumentar adopción, validar demanda, pedir apoyo...',
    acknowledgement: () => 'Buen punto. Eso ayuda a definir qué debería mover la iniciativa.',
  },
  {
    id: 'risks',
    stage: 'one_pager',
    answerKey: 'riskContext',
    prompt: '¿Hay alguna restricción, riesgo o persona clave que debamos considerar?',
    placeholder: 'Ej. Falta de datos, dependencia de un líder, poco tiempo, resistencia del equipo...',
    acknowledgement: () => 'Listo. Con eso puedo armar una primera lectura más útil.',
  },
];

const QUESTION_STAGE_ORDER = CHAT_QUESTIONS.map(question => question.stage);

const CHALLENGE_COPY: Record<ChallengeType, { label: string; description: string }> = {
  correction: {
    label: 'Corrección',
    description: 'Reducir una fricción, error, demora o problema actual.',
  },
  growth: {
    label: 'Crecimiento',
    description: 'Mover adopción, ventas, conversión, uso o retención.',
  },
  exploration: {
    label: 'Exploración',
    description: 'Validar una oportunidad nueva o reducir incertidumbre.',
  },
};

export function InitialReviewResultPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { createProject, hydrateProjectStep0FromPrefill, setCurrentProject, user } = useApp();
  const initialReview = reviewId ? getInitialReview(reviewId) : null;
  const initialIntentFromReview = initialReview?.answers?.adjustedContext?.trim() || initialReview?.inputText?.trim() || '';
  const hasUsableInitialIntent = initialIntentFromReview.length >= 12;
  const initialConversationStage = initialReview?.conversationStage && initialReview.conversationStage !== 'intro'
    ? initialReview.conversationStage
    : hasUsableInitialIntent
      ? 'motivation'
      : 'intro';
  const [review, setReview] = useState<InitialReview | null>(initialReview);
  const [stage, setStage] = useState<InitialReviewConversationStage>(initialConversationStage);
  const [composerValue, setComposerValue] = useState('');
  const [contextOpen, setContextOpen] = useState(false);
  const [fileContextOpen, setFileContextOpen] = useState(false);
  const [editingInitialIntent, setEditingInitialIntent] = useState(false);
  const [initialIntentDraft, setInitialIntentDraft] = useState(initialIntentFromReview);
  const [contextDraft, setContextDraft] = useState(review?.answers?.additionalContext ?? review?.contextText ?? '');
  const [fileContextDraft, setFileContextDraft] = useState(review?.answers?.fileContext?.note ?? '');
  const [editingOnePager, setEditingOnePager] = useState(false);
  const [introReady, setIntroReady] = useState(stage !== 'intro');
  const [isTyping, setIsTyping] = useState(stage === 'intro');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const convertingRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const output = review?.output;
  const selectedType = review?.selectedChallengeType ?? output?.suggestedChallengeType;

  const initialUserIntent = review?.answers?.adjustedContext?.trim() || review?.inputText?.trim() || '';
  const hasInitialUserIntent = initialUserIntent.length >= 12;
  const hasShortInitialUserIntent = initialUserIntent.length > 0 && initialUserIntent.length < 12;
  const currentQuestionIndex = Math.max(0, QUESTION_STAGE_ORDER.indexOf(stage));
  const currentQuestion = CHAT_QUESTIONS[currentQuestionIndex] ?? CHAT_QUESTIONS[CHAT_QUESTIONS.length - 1];
  const isSummaryStage = stage === 'route_confirmation';

  const projectShell = useMemo<Project>(() => ({
    id: '',
    name: output?.improvedProposal.suggestedName ?? '',
    status: 'Draft',
    currentStep: 0,
    step0Status: 'No iniciado',
    mentorCredits: 3,
    steps: [],
    team: [],
    evidence: [],
    createdAt: '',
    lastModified: '',
  }), [output?.improvedProposal.suggestedName]);

  useEffect(() => {
    if (stage !== 'intro' || introReady) return;
    const timer = window.setTimeout(() => {
      setIsTyping(false);
      setIntroReady(true);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [introReady, stage]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [stage, isTyping, contextOpen, fileContextOpen, review]);

  if (!review || !output) {
    return (
      <div className="min-h-full bg-slate-50 p-6 text-center text-slate-500">
        Revisión no encontrada o incompleta.
        <button onClick={() => navigate('/initiatives/new')} className="ml-2 text-indigo-600">Crear otra</button>
      </div>
    );
  }

  const answers = review.answers ?? {};
  const effectiveAnswers = {
    ...answers,
    ...(hasInitialUserIntent ? { adjustedContext: initialUserIntent } : {}),
  };
  const onePager = buildOnePager(review, output, selectedType);

  const patchReview = (patch: Partial<InitialReview>) => {
    const updated = updateInitialReview(review.id, {
      ...patch,
      metadata: {
        createdAt: review.metadata?.createdAt ?? review.createdAt,
        updatedAt: new Date().toISOString(),
        source: review.metadata?.source ?? 'manual',
        version: review.metadata?.version ?? 1,
        ...patch.metadata,
      },
    });
    if (updated) setReview(updated);
    return updated;
  };

  const persistOutput = (nextOutput: InitialReviewOutput, patch: Partial<InitialReview> = {}) => {
    const saved = saveInitialReviewOutput(review.id, nextOutput);
    const updated = updateInitialReview(review.id, {
      ...patch,
      output: nextOutput,
      status: patch.status ?? 'in_progress',
      metadata: {
        createdAt: review.metadata?.createdAt ?? review.createdAt,
        updatedAt: new Date().toISOString(),
        source: review.metadata?.source ?? 'manual',
        version: review.metadata?.version ?? 1,
        ...patch.metadata,
      },
    });
    setReview(updated ?? saved);
  };

  const goToStageWithTyping = (nextStage: InitialReviewConversationStage, nextStatus: InitialReview['status'] = 'in_progress') => {
    setIsTyping(true);
    window.setTimeout(() => {
      setStage(nextStage);
      setIsTyping(false);
      patchReview({ conversationStage: nextStage, status: nextStatus });
    }, 850);
  };

  const submitAnswer = () => {
    const answer = composerValue.trim();
    if (!answer || isTyping || isSummaryStage) return;

    const nextAnswers = {
      ...effectiveAnswers,
      [currentQuestion.answerKey]: answer,
    };

    if (currentQuestion.answerKey === 'adjustedContext') {
      const updated = updateInitialReview(review.id, {
        inputText: answer,
        contextText: [review.contextText, answer].filter(Boolean).join('\n'),
        answers: nextAnswers,
        status: 'in_progress',
      });
      if (updated) {
        const generatedOutput = generateInitialReviewOutput(updated);
        const previousQuestionsById = new Map(output.strategicQuestions.map(question => [question.id, question]));
        const nextOutput: InitialReviewOutput = {
          ...generatedOutput,
          strategicQuestions: generatedOutput.strategicQuestions.map(question => {
            const previous = previousQuestionsById.get(question.id);
            return previous?.status === 'answered' || previous?.status === 'unknown'
              ? { ...question, answer: previous.answer, status: previous.status }
              : question;
          }),
        };
        const saved = saveInitialReviewOutput(review.id, nextOutput);
        setReview(saved ?? updated);
      }
    } else {
      patchReview({
        answers: nextAnswers,
        status: currentQuestionIndex === CHAT_QUESTIONS.length - 1 ? 'one_pager_ready' : 'in_progress',
      });
    }

    setComposerValue('');

    if (currentQuestionIndex >= CHAT_QUESTIONS.length - 1) {
      goToStageWithTyping('route_confirmation', 'route_ready');
      return;
    }

    const nextQuestion = CHAT_QUESTIONS[currentQuestionIndex + 1];
    goToStageWithTyping(nextQuestion.stage);
  };

  const regenerateWithContext = () => {
    const updated = updateInitialReview(review.id, {
      contextText: [review.contextText, contextDraft].filter(Boolean).join('\n'),
      answers: { ...answers, additionalContext: contextDraft },
      status: 'processing',
    });
    if (!updated) return;

    const generatedOutput = generateInitialReviewOutput(updated);
    const previousQuestionsById = new Map(output.strategicQuestions.map(question => [question.id, question]));
    const nextOutput: InitialReviewOutput = {
      ...generatedOutput,
      improvedProposal: {
        ...generatedOutput.improvedProposal,
        suggestedName: output.improvedProposal.suggestedName || generatedOutput.improvedProposal.suggestedName,
      },
      strategicQuestions: generatedOutput.strategicQuestions.map(question => {
        const previous = previousQuestionsById.get(question.id);
        return previous?.status === 'answered' || previous?.status === 'unknown'
          ? { ...question, answer: previous.answer, status: previous.status }
          : question;
      }),
    };
    const saved = saveInitialReviewOutput(review.id, nextOutput);
    setReview(saved);
    setContextOpen(false);
  };

  const saveFileContext = () => {
    patchReview({
      answers: {
        ...answers,
        fileContext: {
          name: 'contexto-manual.txt',
          note: fileContextDraft || 'Pendiente de validar',
          addedAt: new Date().toISOString(),
        },
      },
      status: 'in_progress',
    });
    setFileContextOpen(false);
  };

  const updateProposal = (proposal: InitialReviewOutput['improvedProposal']) => {
    persistOutput({
      ...output,
      improvedProposal: proposal,
    }, {
      metadata: {
        createdAt: review.metadata?.createdAt ?? review.createdAt,
        updatedAt: new Date().toISOString(),
        source: review.metadata?.source ?? 'manual',
        version: (review.metadata?.version ?? 1) + 1,
      },
    });
  };

  const confirmRoute = async () => {
    if (saving || convertingRef.current) return;
    if (review.convertedProjectId) {
      navigate(`/projects/${review.convertedProjectId}`);
      return;
    }

    convertingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      updateInitialReview(review.id, {
        status: 'confirmed',
        conversationStage: 'route_confirmation',
        metadata: {
          createdAt: review.metadata?.createdAt ?? review.createdAt,
          updatedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          source: review.metadata?.source ?? 'manual',
          version: review.metadata?.version ?? 1,
        },
      });
      const latestReview = getInitialReview(review.id) ?? review;
      const draft = buildProjectDraftFromInitialReview(latestReview, projectShell, user?.name ?? '', user?.email ?? '');
      const result = await createProject(draft.name, draft.description);
      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      const initialReviewMeta = (draft.step0Data as unknown as {
        initialReview?: {
          artifact?: {
            initiativeId: string;
            status: 'completed' | 'converted_to_initiative';
            updatedAt: string;
          };
        };
      }).initialReview;
      if (initialReviewMeta?.artifact) {
        initialReviewMeta.artifact.initiativeId = result.project.id;
        initialReviewMeta.artifact.status = 'converted_to_initiative';
        initialReviewMeta.artifact.updatedAt = new Date().toISOString();
      }
      hydrateProjectStep0FromPrefill(result.project.id, draft.step0Data);
      const hydratedProject = {
        ...result.project,
        currentStep: 0,
        step0Status: 'En progreso' as const,
        step0Data: draft.step0Data,
      };
      setCurrentProject(hydratedProject);
      const converted = markReviewAsConverted(review.id, result.project.id);
      setReview(converted);
      navigate(`/projects/${result.project.id}`);
    } catch {
      setError('No pudimos crear la estructura inicial en este momento. Tus respuestas siguen guardadas. Puedes intentar nuevamente.');
      updateInitialReview(review.id, { status: 'failed' });
    } finally {
      convertingRef.current = false;
      setSaving(false);
    }
  };

  const downloadOnePager = () => {
    const content = [
      'Estructura inicial de iniciativa',
      '',
      `Nombre sugerido: ${onePager.suggestedTitle}`,
      `Tipo de reto: ${onePager.challengeType}`,
      `Qué quiere mover: ${onePager.whatToMove}`,
      `Por qué importa ahora: ${onePager.whyNow}`,
      `A quién impacta: ${onePager.impactedAudience}`,
      `Evidencia inicial disponible: ${onePager.availableEvidence}`,
      `Riesgos o faltantes: ${onePager.criticalAnalysis.risks.join('; ')}`,
      `Ruta recomendada: ${Object.values(onePager.roadmap).join(' | ')}`,
      `Siguiente paso sugerido: ${onePager.nextRecommendedAction}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${onePager.suggestedTitle || 'one-pager-starteria'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restartAnswers = () => {
    setStage(hasInitialUserIntent ? 'motivation' : 'intro');
    setIntroReady(true);
    patchReview({ conversationStage: hasInitialUserIntent ? 'motivation' : 'intro', status: 'in_progress' });
  };

  const saveInitialIntent = () => {
    const nextIntent = initialIntentDraft.trim();
    if (!nextIntent) return;
    const updated = updateInitialReview(review.id, {
      inputText: nextIntent,
      contextText: [review.contextText, nextIntent].filter(Boolean).join('\n'),
      answers: { ...answers, adjustedContext: nextIntent },
      status: 'in_progress',
      conversationStage: nextIntent.length >= 12 ? 'motivation' : 'intro',
    });
    if (updated) {
      const generatedOutput = generateInitialReviewOutput(updated);
      const previousQuestionsById = new Map(output.strategicQuestions.map(question => [question.id, question]));
      const nextOutput: InitialReviewOutput = {
        ...generatedOutput,
        strategicQuestions: generatedOutput.strategicQuestions.map(question => {
          const previous = previousQuestionsById.get(question.id);
          return previous?.status === 'answered' || previous?.status === 'unknown'
            ? { ...question, answer: previous.answer, status: previous.status }
            : question;
        }),
      };
      const saved = saveInitialReviewOutput(review.id, nextOutput);
      setReview(saved ?? updated);
      setStage(nextIntent.length >= 12 ? 'motivation' : 'intro');
      setEditingInitialIntent(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 pb-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={15} /> Volver al dashboard
        </button>

        <InitialReviewHeader />

        <InitialReviewChatPanel
          currentIndex={Math.min(currentQuestionIndex, CHAT_QUESTIONS.length - 1)}
          isSummaryStage={isSummaryStage}
          isTyping={isTyping}
          contextOpen={contextOpen}
          fileContextOpen={fileContextOpen}
          contextDraft={contextDraft}
          fileContextDraft={fileContextDraft}
          composerValue={composerValue}
          composerPlaceholder={isSummaryStage ? 'Agrega más contexto antes de confirmar...' : currentQuestion.placeholder}
          answers={answers}
          effectiveAnswers={effectiveAnswers}
          initialUserIntent={initialUserIntent}
          hasInitialUserIntent={hasInitialUserIntent}
          hasShortInitialUserIntent={hasShortInitialUserIntent}
          editingInitialIntent={editingInitialIntent}
          initialIntentDraft={initialIntentDraft}
          output={output}
          onePager={onePager}
          selectedType={selectedType}
          editingOnePager={editingOnePager}
          saving={saving}
          error={error}
          threadEndRef={threadEndRef}
          onComposerChange={setComposerValue}
          onInitialIntentDraftChange={setInitialIntentDraft}
          onEditInitialIntent={() => setEditingInitialIntent(true)}
          onCancelEditInitialIntent={() => setEditingInitialIntent(false)}
          onSaveInitialIntent={saveInitialIntent}
          onSubmitAnswer={submitAnswer}
          onContextOpen={() => setContextOpen(value => !value)}
          onFileOpen={() => setFileContextOpen(value => !value)}
          onContextChange={setContextDraft}
          onFileContextChange={setFileContextDraft}
          onRegenerateContext={regenerateWithContext}
          onSaveFileContext={saveFileContext}
          onCloseContext={() => setContextOpen(false)}
          onCloseFileContext={() => setFileContextOpen(false)}
          onConfirmRoute={confirmRoute}
          onRestartAnswers={restartAnswers}
          onDownloadOnePager={downloadOnePager}
          onEditToggle={() => setEditingOnePager(value => !value)}
          onProposalChange={updateProposal}
        />
      </div>
    </div>
  );
}

function buildOnePager(review: InitialReview, output: InitialReviewOutput, selectedType?: ChallengeType) {
  const challengeType = selectedType ?? output.suggestedChallengeType;
  const answers = review.answers ?? {};
  const missing = [
    !answers.evidence ? 'Evidencia inicial suficiente para contrastar el problema.' : null,
    !answers.riskContext ? output.critique.weak : null,
    ...output.strategicQuestions
      .filter(question => question.status === 'unanswered' || question.status === 'unknown')
      .map(question => question.question),
  ].filter(Boolean).slice(0, 3) as string[];

  return {
    suggestedTitle: output.improvedProposal.suggestedName,
    challengeType: CHALLENGE_COPY[challengeType].label,
    whatToMove: answers.adjustedContext || review.inputText || output.improvedProposal.proposal,
    whyNow: answers.motivation || output.improvedProposal.initialFocus,
    impactedAudience: answers.stakeholder || output.improvedProposal.expectedImpact,
    suggestedStakeholder: answers.stakeholder || 'Pendiente de validar',
    initialHypothesis: output.understandingSummary,
    availableEvidence: answers.evidence || answers.fileContext?.note || 'Pendiente de validar',
    criticalAnalysis: {
      strengths: [output.critique.solid],
      risks: [answers.riskContext || output.critique.risky],
      missingInformation: missing.length > 0 ? missing : [output.critique.weak],
      mainWarning: answers.riskContext || output.critique.mainRisk || output.critique.risky,
    },
    roadmap: {
      step0: 'Ordenar contexto y preparar una versión compartible para líder o sponsor.',
      step1: 'Definir y validar el foco del reto.',
      step2: 'Diseñar la apuesta y el experimento.',
      step3: 'Ejecutar, aprender y decidir.',
      step4: 'Cerrar, alinear y proyectar siguiente paso.',
    },
    nextRecommendedAction: answers.expectedOutcome || output.improvedProposal.nextRecommendedStep,
  };
}

function InitialReviewHeader() {
  return (
    <header className="mx-auto mb-5 max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700" style={{ fontWeight: 900 }}>
        <Sparkles size={13} /> Revisión inicial
      </span>
      <h1 className="mt-3 text-2xl text-slate-950" style={{ fontWeight: 900 }}>Ordenemos tu idea paso a paso</h1>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Startería te hará algunas preguntas rápidas para entender el foco, detectar riesgos iniciales y proponerte una ruta clara.
      </p>
    </header>
  );
}

function InitialReviewChatPanel({
  currentIndex,
  isSummaryStage,
  isTyping,
  contextOpen,
  fileContextOpen,
  contextDraft,
  fileContextDraft,
  composerValue,
  composerPlaceholder,
  answers,
  effectiveAnswers,
  initialUserIntent,
  hasInitialUserIntent,
  hasShortInitialUserIntent,
  editingInitialIntent,
  initialIntentDraft,
  output,
  onePager,
  selectedType,
  editingOnePager,
  saving,
  error,
  threadEndRef,
  onComposerChange,
  onInitialIntentDraftChange,
  onEditInitialIntent,
  onCancelEditInitialIntent,
  onSaveInitialIntent,
  onSubmitAnswer,
  onContextOpen,
  onFileOpen,
  onContextChange,
  onFileContextChange,
  onRegenerateContext,
  onSaveFileContext,
  onCloseContext,
  onCloseFileContext,
  onConfirmRoute,
  onRestartAnswers,
  onDownloadOnePager,
  onEditToggle,
  onProposalChange,
}: {
  currentIndex: number;
  isSummaryStage: boolean;
  isTyping: boolean;
  contextOpen: boolean;
  fileContextOpen: boolean;
  contextDraft: string;
  fileContextDraft: string;
  composerValue: string;
  composerPlaceholder: string;
  answers: NonNullable<InitialReview['answers']>;
  effectiveAnswers: NonNullable<InitialReview['answers']>;
  initialUserIntent: string;
  hasInitialUserIntent: boolean;
  hasShortInitialUserIntent: boolean;
  editingInitialIntent: boolean;
  initialIntentDraft: string;
  output: InitialReviewOutput;
  onePager: ReturnType<typeof buildOnePager>;
  selectedType?: ChallengeType;
  editingOnePager: boolean;
  saving: boolean;
  error: string | null;
  threadEndRef: React.MutableRefObject<HTMLDivElement | null>;
  onComposerChange: (value: string) => void;
  onInitialIntentDraftChange: (value: string) => void;
  onEditInitialIntent: () => void;
  onCancelEditInitialIntent: () => void;
  onSaveInitialIntent: () => void;
  onSubmitAnswer: () => void;
  onContextOpen: () => void;
  onFileOpen: () => void;
  onContextChange: (value: string) => void;
  onFileContextChange: (value: string) => void;
  onRegenerateContext: () => void;
  onSaveFileContext: () => void;
  onCloseContext: () => void;
  onCloseFileContext: () => void;
  onConfirmRoute: () => void;
  onRestartAnswers: () => void;
  onDownloadOnePager: () => void;
  onEditToggle: () => void;
  onProposalChange: (proposal: InitialReviewOutput['improvedProposal']) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm text-slate-950" style={{ fontWeight: 900 }}>Startería</p>
            <p className="text-xs text-slate-500">Guiando tu revisión inicial</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">
            {isSummaryStage ? 'Resumen listo' : `Pregunta ${currentIndex + 1} de ${CHAT_QUESTIONS.length}`}
          </span>
          <MinimalProgress currentIndex={isSummaryStage ? CHAT_QUESTIONS.length : currentIndex} total={CHAT_QUESTIONS.length + 1} />
        </div>
      </div>

      <div className="max-h-[62vh] min-h-[420px] space-y-4 overflow-y-auto bg-slate-50/60 px-4 py-5 sm:px-6">
        {!hasInitialUserIntent && (
          <AssistantBubble>
            <p>Hola, soy Startería. Te voy a ayudar a ordenar esta idea antes de convertirla en iniciativa.</p>
          </AssistantBubble>
        )}

        {hasInitialUserIntent && (
          <>
            <AssistantBubble>
              <p>Ya tengo una primera idea: {initialUserIntent}</p>
              <button
                type="button"
                onClick={onEditInitialIntent}
                className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                style={{ fontWeight: 800 }}
              >
                Editar idea inicial
              </button>
            </AssistantBubble>
            {editingInitialIntent && (
              <InlineEditInitialIntent
                value={initialIntentDraft}
                onChange={onInitialIntentDraftChange}
                onCancel={onCancelEditInitialIntent}
                onSave={onSaveInitialIntent}
              />
            )}
            <AssistantBubble>
              <p>Te voy a ayudar a ordenarla antes de convertirla en iniciativa.</p>
            </AssistantBubble>
          </>
        )}

        {hasShortInitialUserIntent && (
          <AssistantBubble>
            <p>Veo una idea inicial, pero necesito un poco más de contexto. ¿Qué quieres mover exactamente?</p>
          </AssistantBubble>
        )}

        {CHAT_QUESTIONS.map((question, index) => {
          const answer = effectiveAnswers[question.answerKey];
          if (hasInitialUserIntent && index === 0) return null;
          if (index > currentIndex || (!answer && index < currentIndex)) return null;
          const isCurrent = index === currentIndex && !isSummaryStage;
          if (!answer && !isCurrent) return null;
          return (
            <React.Fragment key={question.id}>
              {(index < currentIndex || isCurrent) && (
                <AssistantBubble>
                  <p>{question.prompt}</p>
                </AssistantBubble>
              )}
              {answer && (
                <>
                  <UserBubble>{answer}</UserBubble>
                  <AssistantBubble>
                    <p>{question.acknowledgement(answer)}</p>
                  </AssistantBubble>
                </>
              )}
            </React.Fragment>
          );
        })}

        {isTyping && <TypingIndicator />}

        {isSummaryStage && !isTyping && (
          <>
            <AssistantBubble>
              <p>Listo. Con lo que me contaste, esta sería una primera lectura de tu iniciativa.</p>
              <InitialReviewSummaryCard
                onePager={onePager}
                output={output}
                selectedType={selectedType}
                editing={editingOnePager}
                onEditToggle={onEditToggle}
                onProposalChange={onProposalChange}
              />
            </AssistantBubble>
            <AssistantBubble>
              <p>Primero ordenamos tu idea. Solo se creará como iniciativa cuando confirmes esta ruta.</p>
            </AssistantBubble>
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            <QuickReplyGroup>
              <QuickReply primary onClick={onConfirmRoute} disabled={saving}>
                {saving ? 'Creando iniciativa...' : 'Estoy de acuerdo con esta ruta'}
              </QuickReply>
              <QuickReply onClick={onContextOpen}>Agregar más contexto</QuickReply>
              <QuickReply onClick={onRestartAnswers}>Ajustar respuestas</QuickReply>
              <QuickReply onClick={onDownloadOnePager}>Descargar one pager</QuickReply>
            </QuickReplyGroup>
          </>
        )}

        {contextOpen && (
          <AddContextInput
            value={contextDraft}
            onChange={onContextChange}
            onCancel={onCloseContext}
            onRegenerate={onRegenerateContext}
          />
        )}

        {fileContextOpen && (
          <FileContextUploadButton
            value={fileContextDraft}
            onChange={onFileContextChange}
            onCancel={onCloseFileContext}
            onSave={onSaveFileContext}
          />
        )}

        <div ref={threadEndRef} />
      </div>

      <ChatComposer
        value={composerValue}
        placeholder={composerPlaceholder}
        disabled={isTyping || isSummaryStage}
        onChange={onComposerChange}
        onSubmit={onSubmitAnswer}
        onFileOpen={onFileOpen}
        onContextOpen={onContextOpen}
      />
    </section>
  );
}

function MinimalProgress({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Progreso de revisión inicial">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full transition-all ${index <= currentIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
        <Sparkles size={14} />
      </div>
      <div className="max-w-[78%] rounded-3xl rounded-tl-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-3xl rounded-tr-md bg-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-sm">
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 pl-11 text-sm text-slate-500">
      <span>Startería está escribiendo</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
      </span>
    </div>
  );
}

function ChatComposer({
  value,
  placeholder,
  disabled,
  onChange,
  onSubmit,
  onFileOpen,
  onContextOpen,
}: {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFileOpen: () => void;
  onContextOpen: () => void;
}) {
  return (
    <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-300 focus-within:bg-white">
        <button
          type="button"
          onClick={onFileOpen}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-white hover:text-indigo-600"
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
        >
          <Paperclip size={17} />
        </button>
        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={disabled ? 'Startería está preparando la siguiente respuesta...' : placeholder}
          className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Enviar"
          title="Enviar"
        >
          <Send size={17} />
        </button>
      </div>
      <button
        type="button"
        onClick={onContextOpen}
        className="mt-2 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
        style={{ fontWeight: 800 }}
      >
        <MessageSquarePlus size={13} /> Agregar más contexto
      </button>
    </div>
  );
}

function InlineEditInitialIntent({
  value,
  onChange,
  onCancel,
  onSave,
}: {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="ml-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:ml-11">
      <label className="block">
        <span className="text-sm text-slate-950" style={{ fontWeight: 900 }}>Editar idea inicial</span>
        <textarea
          rows={3}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Describe la idea, problema u oportunidad que quieres ordenar..."
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onSave} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white" style={{ fontWeight: 850 }}>
          Guardar ajuste
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function QuickReplyGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 pl-0 sm:pl-11">{children}</div>;
}

function QuickReply({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
      }`}
      style={{ fontWeight: 850 }}
    >
      {primary && !disabled && <Check size={14} />}
      {children}
    </button>
  );
}

function AddContextInput({ value, onChange, onCancel, onRegenerate }: { value: string; onChange: (value: string) => void; onCancel: () => void; onRegenerate: () => void }) {
  return (
    <div className="ml-0 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:ml-11">
      <label className="block">
        <span className="text-sm text-indigo-950" style={{ fontWeight: 900 }}>Agregar más contexto</span>
        <textarea
          rows={3}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Pega aquí datos, restricciones o detalles que ayuden a entender mejor la idea..."
          className="mt-2 w-full resize-none rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onRegenerate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white" style={{ fontWeight: 850 }}>
          <RefreshCw size={14} /> Actualizar revisión
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-indigo-100 bg-white px-4 py-2 text-sm text-slate-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}

function FileContextUploadButton({ value, onChange, onCancel, onSave }: { value: string; onChange: (value: string) => void; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="ml-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:ml-11">
      <div className="flex items-start gap-3">
        <FileText size={18} className="mt-1 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-950" style={{ fontWeight: 900 }}>Adjuntar archivo</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">En este MVP aún no hay upload real. Pega aquí el contenido relevante y Startería lo guardará como contexto.</p>
          <textarea
            rows={3}
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="Pega notas, extractos o datos relevantes..."
            className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onSave} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white" style={{ fontWeight: 850 }}>Guardar contexto</button>
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InitialReviewSummaryCard({
  onePager,
  output,
  selectedType,
  editing,
  onEditToggle,
  onProposalChange,
}: {
  onePager: ReturnType<typeof buildOnePager>;
  output: InitialReviewOutput;
  selectedType?: ChallengeType;
  editing: boolean;
  onEditToggle: () => void;
  onProposalChange: (proposal: InitialReviewOutput['improvedProposal']) => void;
}) {
  const proposal = output.improvedProposal;
  const updateProposal = (field: keyof InitialReviewOutput['improvedProposal'], value: string) => {
    onProposalChange({ ...proposal, [field]: value });
  };

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-indigo-500" style={{ fontWeight: 900 }}>One pager preliminar</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 900 }}>{onePager.suggestedTitle}</h2>
        </div>
        <button type="button" onClick={onEditToggle} className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700" style={{ fontWeight: 850 }}>
          {editing ? 'Ver resumen' : 'Editar base'}
        </button>
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3">
          <ProposalField label="Nombre sugerido" value={proposal.suggestedName} onChange={value => updateProposal('suggestedName', value)} />
          <ProposalField label="Foco inicial" value={proposal.proposal} onChange={value => updateProposal('proposal', value)} rows={4} />
          <ProposalField label="Siguiente paso sugerido" value={proposal.nextRecommendedStep} onChange={value => updateProposal('nextRecommendedStep', value)} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <SummaryItem label="Foco inicial" text={onePager.whatToMove} />
          <SummaryItem label="Tipo de reto sugerido" text={selectedType ? CHALLENGE_COPY[selectedType].label : onePager.challengeType} />
          <SummaryItem label="Por qué importa ahora" text={onePager.whyNow} />
          <SummaryItem label="Usuarios o áreas impactadas" text={onePager.impactedAudience} />
          <SummaryItem label="Evidencia disponible" text={onePager.availableEvidence} />
          <SummaryItem label="Riesgos o faltantes" text={[...onePager.criticalAnalysis.risks, ...onePager.criticalAnalysis.missingInformation].join(' ')} />
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900 }}>Ruta recomendada</p>
        <div className="mt-3 grid gap-2">
          {Object.entries(onePager.roadmap).map(([key, value], index) => (
            <div key={key} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-0.5 h-6 rounded-full bg-slate-950 px-2 text-xs leading-6 text-white" style={{ fontWeight: 900 }}>Step {index}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
        Siguiente paso sugerido: {onePager.nextRecommendedAction}
      </div>
    </div>
  );
}

function SummaryItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900 }}>{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function ProposalField({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-slate-400" style={{ fontWeight: 900 }}>{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}
