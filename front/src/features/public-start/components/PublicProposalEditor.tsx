import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  HelpCircle,
  Loader2,
  PenLine,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { PublicDraft, PublicDraftOutput } from '../domain/types';
import { finishPublicDraft, generateMockPublicDraftOutput, normalizePublicProposalTitle } from '../services/publicDraftService';
import { updatePublicDraft } from '../services/publicDraftStorage';
import { buildPublicProposalMarkdown } from '../services/publicProposalExportService';
import { PublicOnePagerPreview } from './PublicOnePagerPreview';
import type { PublicEditorQuestionStatus } from './PublicQuestionCard';
import { usePublicDraftAutoSeed } from '../hooks/usePublicDraftAutoSeed';
import { refinePublicField } from '../services/publicFieldRefineService';

type EditableField = keyof Pick<
  PublicDraftOutput,
  'proposalTitle' | 'whatToMove' | 'impactedAudience' | 'whyNow' | 'initialEvidence' | 'supportNeeded' | 'decisionRequested'
>;
type ContextStatus = 'idle' | 'classifying' | 'classified' | 'applied';

interface FieldConfig {
  id: EditableField;
  label: string;
  question: string;
  helper: string;
  placeholder: string;
  required?: boolean;
}

interface FieldSuggestion {
  questionId: EditableField;
  currentValue: string;
  suggestedValue: string;
  rationale: string;
  fromInitialInfo: boolean;
  version: number;
}

const FIELDS: FieldConfig[] = [
  {
    id: 'proposalTitle',
    label: 'Nombre de la iniciativa',
    question: 'Nombre de la iniciativa',
    helper: 'Ponle un nombre simple y entendible. No tiene que ser definitivo.',
    placeholder: 'Ej. Organizar la carga de proyectos en Tax & Legal',
    required: true,
  },
  {
    id: 'whatToMove',
    label: 'Qué quieres cambiar, mejorar o explorar',
    question: 'Qué quieres cambiar, mejorar o explorar',
    helper: 'Resume qué situación quieres ordenar: un problema, una oportunidad o algo que necesitas entender mejor.',
    placeholder: 'Ej. Ordenar la gestión de proyectos simultáneos entre Tax & Legal y Precios de Transferencia.',
    required: true,
  },
  {
    id: 'whyNow',
    label: 'Por qué importa ahora',
    question: 'Por qué importa ahora',
    helper: 'Explica qué pasa si esto sigue igual o qué oportunidad se puede perder.',
    placeholder: 'Ej. La carga actual puede generar retrasos, dependencia excesiva de una persona y menor calidad en la entrega.',
    required: true,
  },
  {
    id: 'impactedAudience',
    label: 'A quién impacta',
    question: 'A quién impacta',
    helper: 'Indica qué personas, equipos, áreas, clientes o procesos se ven afectados.',
    placeholder: 'Ej. Equipo de Tax & Legal, área de Precios de Transferencia, practicante/asistente y clientes internos.',
    required: true,
  },
  {
    id: 'initialEvidence',
    label: 'Qué te hace pensar que esto importa',
    question: 'Qué te hace pensar que esto importa',
    helper:
      'Puede ser una demora, reclamo, sobrecarga, retrabajo, dato, conversación o una intuición basada en experiencia. No necesitas evidencia perfecta.',
    placeholder: 'Ej. Hay demasiados proyectos simultáneos, poca capacidad de apoyo y varias tareas terminan dependiendo de mí.',
  },
  {
    id: 'supportNeeded',
    label: 'Qué decisión o apoyo necesitas',
    question: 'Qué decisión o apoyo necesitas',
    helper: 'Indica qué necesitas para avanzar: priorización, tiempo, datos, apoyo de otra área, validación o autorización.',
    placeholder: 'Ej. Necesito priorizar proyectos, definir responsabilidades y acordar apoyo con el área involucrada.',
  },
];

const GENERIC = new Set(['no se', 'no sé', 'por definir', 'pendiente', 'n/a', 'na', 'ninguno', 'no aplica']);
const SIGNAL_CHIPS = [
  'Hay sobrecarga de trabajo',
  'Hay demoras visibles',
  'Hay retrabajo',
  'Hay dependencia de una persona',
  'Hay reclamos o presión interna',
  'Es una hipótesis por validar',
  'No tengo evidencia aún',
];
const DESTINATIONS: Array<{ field: EditableField; label: string }> = [
  { field: 'impactedAudience', label: 'Impacto' },
  { field: 'initialEvidence', label: 'Señal actual' },
  { field: 'whyNow', label: 'Urgencia' },
  { field: 'supportNeeded', label: 'Decisión o apoyo' },
];

const STATUS_COPY: Record<PublicEditorQuestionStatus, { label: string; className: string; icon: 'check' | 'circle' | 'edit' }> = {
  review: { label: 'Revisar', className: 'border-sky-200 bg-sky-50 text-sky-700', icon: 'circle' },
  missing: { label: 'Falta aclarar', className: 'border-amber-200 bg-amber-50 text-amber-700', icon: 'circle' },
  confirmed: { label: 'Confirmado', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: 'check' },
  ai_refined: { label: 'Mejorado con IA', className: 'border-violet-200 bg-violet-50 text-violet-700', icon: 'check' },
  suggestion_available: { label: 'Sugerencia disponible', className: 'border-violet-200 bg-violet-50 text-violet-700', icon: 'edit' },
};

function clean(value: string | undefined) {
  return (value ?? '').trim();
}

function isTooGeneric(value: string | undefined) {
  const normalized = clean(value).toLowerCase();
  return !normalized || normalized.length <= 15 || GENERIC.has(normalized);
}

function fieldStatus(
  field: EditableField,
  value: string | undefined,
  confirmedFields: Set<string>,
  aiRefinedFields: Set<string>,
  suggestionField: string | null,
): PublicEditorQuestionStatus {
  if (suggestionField === field) return 'suggestion_available';
  if (confirmedFields.has(field)) return 'confirmed';
  if (aiRefinedFields.has(field)) return 'ai_refined';
  if (isTooGeneric(value)) return 'missing';
  return 'review';
}

function missingRequired(output: PublicDraftOutput) {
  return FIELDS.filter(field => field.required && isTooGeneric(String(output[field.id] ?? '')));
}

function needsClarity(output: PublicDraftOutput, confirmedFields: Set<string>, aiRefinedFields: Set<string>, suggestionField: string | null) {
  return FIELDS.filter(field => fieldStatus(field.id, String(output[field.id] ?? ''), confirmedFields, aiRefinedFields, suggestionField) === 'missing');
}

function missingLabels(output: PublicDraftOutput, confirmedFields: Set<string>, aiRefinedFields: Set<string>, suggestionField: string | null) {
  return needsClarity(output, confirmedFields, aiRefinedFields, suggestionField).map(field => field.label);
}

function risks(output: PublicDraftOutput) {
  const items = ['La propuesta sigue siendo preliminar y aún no equivale a una validación.'];
  if (!clean(output.initialEvidence) || /no tengo evidencia aún|hipótesis por validar/i.test(output.initialEvidence ?? '')) {
    items.push('La evidencia está pendiente de confirmar con señales, datos o conversaciones.');
  }
  if (!clean(output.supportNeeded) && !clean(output.decisionRequested)) items.push('Aún falta aclarar qué decisión o apoyo permitiría avanzar.');
  return items;
}

function nextAction(output: PublicDraftOutput) {
  const text = `${output.proposalTitle} ${output.whatToMove}`;
  if (/tax\s*&\s*legal|precios de transferencia/i.test(text)) {
    return 'Mapear proyectos activos, responsables, fechas límite, urgencia, tareas pendientes y dependencias con otras áreas.';
  }
  if (/ventas|producto nuevo/i.test(text)) {
    return 'Revisar conversaciones comerciales recientes, objeciones frecuentes y ejemplos de clientes que sí entendieron el valor del producto.';
  }
  if (/aprobaci[oó]n|solicitudes internas/i.test(text)) {
    return 'Revisar el flujo actual de aprobación, tiempos promedio, responsables y puntos donde se pierde seguimiento.';
  }
  return 'Continuar ordenando la propuesta con las personas involucradas y revisar qué señales permiten decidir el siguiente paso.';
}

function inferDestination(value: string): EditableField {
  if (/(reclamo|tiempo|feedback|reporte|dato|métrica|observación|evidencia|hipótesis|sobrecarga|retrabajo)/i.test(value)) return 'initialEvidence';
  if (/(decisión|permiso|presupuesto|líder|responsable|acceso|validar|autorización)/i.test(value)) return 'supportNeeded';
  if (/(ahora|urgente|demora|costo|riesgo|oportunidad|mes|semana)/i.test(value)) return 'whyNow';
  return 'impactedAudience';
}

function buildSuggestion(field: EditableField, value: string, fallback: PublicDraftOutput, version = 1): FieldSuggestion {
  const current = value.trim();
  const fromInitialInfo = current.length === 0;
  const titleBase = normalizePublicProposalTitle(current || fallback.proposalTitle || fallback.whatToMove, 'Organizar una iniciativa preliminar');
  const suggestions: Record<EditableField, string> = {
    proposalTitle: titleBase,
    whatToMove: fromInitialInfo
      ? clean(fallback.whatToMove) || 'Ordenar la situación actual, aclarar qué está pasando y definir qué debe revisarse antes de decidir una solución.'
      : current,
    whyNow: fromInitialInfo
      ? clean(fallback.whyNow) || 'Si esto sigue igual, puede mantenerse la sobrecarga, la pérdida de seguimiento o la dificultad para priorizar correctamente.'
      : current,
    impactedAudience: fromInitialInfo
      ? clean(fallback.impactedAudience) || 'Personas, equipos, áreas o procesos que dependen de que esta situación se ordene.'
      : current,
    initialEvidence: fromInitialInfo
      ? clean(fallback.initialEvidence) || 'No tengo evidencia aún. La señal inicial debe validarse con datos, conversaciones o revisión del proceso.'
      : current,
    supportNeeded: fromInitialInfo
      ? clean(fallback.supportNeeded) || 'Necesito priorización, tiempo, datos o apoyo de una persona que pueda desbloquear la decisión.'
      : current,
    decisionRequested: fromInitialInfo
      ? clean(fallback.decisionRequested) || 'Definir si esta propuesta debe convertirse en iniciativa para seguir ordenándola en Starteria.'
      : current,
  };

  const refinementPrefix = version > 1 && !fromInitialInfo ? 'Versión alternativa: ' : '';
  return {
    questionId: field,
    currentValue: value,
    suggestedValue: `${refinementPrefix}${suggestions[field]}`.trim(),
    fromInitialInfo,
    version,
    rationale: fromInitialInfo
      ? 'Sugerencia generada a partir de la información inicial para que tengas una base editable.'
      : 'Aclara la redacción para que el punto sea más concreto, revisable y útil dentro de la propuesta preliminar.',
  };
}

function pluralPoint(count: number) {
  if (count === 0) return 'Sin puntos pendientes';
  if (count === 1) return '1 punto necesita más claridad';
  return `${count} puntos necesitan más claridad`;
}

export function PublicProposalEditor({ initialDraft }: { initialDraft: PublicDraft }) {
  const navigate = useNavigate();
  const editorPanelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [activeField, setActiveField] = useState<EditableField>('proposalTitle');
  const [activeValue, setActiveValue] = useState(String(initialDraft.aiOutput.proposalTitle ?? ''));
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(() => new Set());
  const [aiRefinedFields, setAiRefinedFields] = useState<Set<string>>(() => new Set());
  const [showEvidenceHelp, setShowEvidenceHelp] = useState(false);
  const [showOriginalIdea, setShowOriginalIdea] = useState(false);
  const [originalIdeaDraft, setOriginalIdeaDraft] = useState(initialDraft.inputText);
  const [originalIdeaStatus, setOriginalIdeaStatus] = useState<'synced' | 'dirty' | 'updating'>('synced');
  const [contextInput, setContextInput] = useState('');
  const [contextStatus, setContextStatus] = useState<ContextStatus>('idle');
  const [selectedDestination, setSelectedDestination] = useState<EditableField>('impactedAudience');
  const [suggestion, setSuggestion] = useState<FieldSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [previewHighlight, setPreviewHighlight] = useState<EditableField | null>(null);

  // Auto-seed step0.* fields from PDF-autofill proposals (feature-flagged via
  // AutofillContext). Idempotent: only fills empty fields, never overwrites a
  // user edit. Keeps the PDF-upload → editor pipeline intact after the
  // master-detail redesign. See [[usePublicDraftAutoSeed]].
  usePublicDraftAutoSeed(draft.id, draft, refreshed => {
    setDraft(refreshed);
    setActiveValue(prev => (prev.trim() ? prev : String(refreshed.aiOutput[activeField] ?? '')));
  });

  const suggestionField = suggestion?.questionId ?? null;
  const requiredMissing = useMemo(() => missingRequired(draft.aiOutput), [draft.aiOutput]);
  const clarityMissing = useMemo(
    () => needsClarity(draft.aiOutput, confirmedFields, aiRefinedFields, suggestionField),
    [draft.aiOutput, confirmedFields, aiRefinedFields, suggestionField],
  );
  const reviewedCount = confirmedFields.size + aiRefinedFields.size;
  const canContinue = requiredMissing.length === 0;
  const canExport = canContinue && clarityMissing.length <= 2;
  const activeConfig = FIELDS.find(field => field.id === activeField) ?? FIELDS[0];
  const canAdjustFromBar = contextInput.trim().length > 0;

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, [activeField]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const persistDraft = (patch: Partial<PublicDraft>) => {
    const updated = updatePublicDraft(draft.id, patch);
    if (updated) setDraft(updated);
  };

  const showSaved = (message: string) => {
    setSavedNotice(message);
    window.setTimeout(() => setSavedNotice(null), 2400);
  };

  const persistOutput = (
    output: PublicDraftOutput,
    nextConfirmedFields = confirmedFields,
    nextAiRefinedFields = aiRefinedFields,
    nextSuggestionField = suggestionField,
  ) => {
    const nextOutput = {
      ...output,
      proposalTitle: normalizePublicProposalTitle(output.proposalTitle || output.whatToMove, 'Propuesta preliminar de iniciativa'),
      missingCriticalFields: missingLabels(output, nextConfirmedFields, nextAiRefinedFields, nextSuggestionField),
      risks: risks(output),
      nextRecommendedAction: nextAction(output),
    };
    persistDraft({
      status: 'edited',
      aiOutput: nextOutput,
      aiRecommendation: {
        summary: 'La propuesta se está ajustando como borrador preliminar. Todavía requiere revisión del usuario.',
        goodPoints: ['La idea ya tiene una estructura conversable.', 'Los puntos pendientes ayudan a definir la siguiente conversación.'],
        missing: nextOutput.missingCriticalFields,
        nextAction: nextOutput.nextRecommendedAction,
        confidenceScore: nextOutput.confidenceScore,
      },
    });
  };

  const updateField = (
    field: EditableField,
    value: string,
    options: { confirmed?: boolean; aiRefined?: boolean; message?: string } = {},
  ) => {
    const nextOutput = { ...draft.aiOutput, [field]: value };
    if (field === 'whatToMove' && !clean(draft.aiOutput.proposalTitle)) nextOutput.proposalTitle = normalizePublicProposalTitle(value);
    if (field === 'supportNeeded' && !clean(draft.aiOutput.decisionRequested)) nextOutput.decisionRequested = value;

    const nextConfirmedFields = new Set(confirmedFields);
    const nextAiRefinedFields = new Set(aiRefinedFields);
    if (options.confirmed) nextConfirmedFields.add(field);
    if (options.aiRefined) nextAiRefinedFields.add(field);
    setConfirmedFields(nextConfirmedFields);
    setAiRefinedFields(nextAiRefinedFields);

    persistOutput(nextOutput, nextConfirmedFields, nextAiRefinedFields, null);
    showSaved(options.message ?? 'La propuesta se actualizó con este ajuste.');
  };

  const selectField = (field: EditableField) => {
    setActiveField(field);
    setActiveValue(String(draft.aiOutput[field] ?? ''));
    setSuggestion(null);
    setSavedNotice(null);
    setPreviewHighlight(field);
    window.setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
      editorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => setPreviewHighlight(null), 800);
  };

  const saveActiveField = () => {
    updateField(activeField, activeValue, { confirmed: true, message: 'Cambio guardado. La propuesta se actualizó con este ajuste.' });
  };

  const useExample = () => {
    setActiveValue(buildSuggestion(activeField, '', draft.aiOutput).suggestedValue);
  };

  const adjustActiveField = async (version = 1) => {
    setSuggestionLoading(true);
    setSuggestion(null);
    try {
      // Real AI refinement (ADR-016). NO-PII context: only the draft's own
      // initiative content, never user identity (the public draft is anonymous).
      const result = await refinePublicField(activeField, activeValue, {
        suggestedChallengeType: draft.aiOutput.suggestedChallengeType,
        proposalTitle: draft.aiOutput.proposalTitle,
        whatToMove: draft.aiOutput.whatToMove,
      });
      setSuggestion({
        questionId: activeField,
        currentValue: activeValue,
        suggestedValue: result.suggestedValue,
        rationale: result.rationale,
        fromInitialInfo: activeValue.trim().length === 0,
        version,
      });
    } catch {
      // Fallback heurístico local: servicio caído / timeout / 429 nunca rompe la
      // UI ni bloquea al usuario (ADR-016 / PRD-003 US-002 / NFR-3 Zero-Mocks).
      setSuggestion(buildSuggestion(activeField, activeValue, draft.aiOutput, version));
    } finally {
      setSuggestionLoading(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    const field = suggestion.questionId;
    updateField(field, suggestion.suggestedValue, { aiRefined: true, message: 'Sugerencia aplicada. El punto quedó mejorado con IA.' });
    if (field === activeField) setActiveValue(suggestion.suggestedValue);
    setSuggestion(null);
  };

  const regenerateSuggestion = () => {
    adjustActiveField((suggestion?.version ?? 1) + 1);
  };

  const appendSignalChip = (chip: string) => {
    const currentLines = activeValue
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (currentLines.some(line => line.toLowerCase() === chip.toLowerCase())) return;

    setActiveValue(currentLines.length > 0 ? `${currentLines.join('\n')}\n${chip}` : chip);
  };

  const updateOriginalIdea = (value: string) => {
    setOriginalIdeaDraft(value);
    setOriginalIdeaStatus(value.trim() === draft.inputText.trim() ? 'synced' : 'dirty');
  };

  const restructureFromOriginal = () => {
    const base = originalIdeaDraft.trim();
    if (base.length < 30) return;
    setOriginalIdeaStatus('updating');
    window.setTimeout(() => {
      const generated = generateMockPublicDraftOutput(base);
      persistDraft({ inputText: base, status: 'edited' });
      persistOutput({
        ...generated,
        initialEvidence: clean(draft.aiOutput.initialEvidence) || generated.initialEvidence,
        supportNeeded: clean(draft.aiOutput.supportNeeded) || generated.supportNeeded,
        decisionRequested: clean(draft.aiOutput.decisionRequested) || generated.decisionRequested,
      });
      setActiveField('proposalTitle');
      setActiveValue(generated.proposalTitle);
      setOriginalIdeaStatus('synced');
      showSaved('La propuesta se actualizó desde la idea original.');
    }, 450);
  };

  const classifyContext = () => {
    if (!contextInput.trim()) return;
    setContextStatus('classifying');
    window.setTimeout(() => {
      setSelectedDestination(inferDestination(contextInput));
      setContextStatus('classified');
    }, 450);
  };

  const applyContext = () => {
    const current = String(draft.aiOutput[selectedDestination] ?? '').trim();
    const nextValue = current ? `${current}\n${contextInput.trim()}` : contextInput.trim();
    updateField(selectedDestination, nextValue, { message: 'La propuesta general se actualizó con tu contexto.' });
    if (selectedDestination === activeField) setActiveValue(nextValue);
    setContextInput('');
    setContextStatus('applied');
  };

  const handleContinue = () => {
    if (!canContinue) return;
    finishPublicDraft(draft.id);
    navigate(`/auth/continue/${draft.id}`);
  };

  const copyOnePager = async () => {
    await navigator.clipboard.writeText(buildPublicProposalMarkdown(draft));
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-[1540px] flex-col gap-5 px-2 pb-44 pt-4 sm:px-4 lg:px-6">
      <header className="rounded-3xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg text-slate-950" style={{ fontWeight: 900 }}>Propuesta preliminar</h1>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">Borrador para revisar</span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{reviewedCount}/{FIELDS.length} puntos revisados</span>
          <span className="ml-auto text-xs text-slate-500" style={{ fontWeight: 750 }}>{pluralPoint(clarityMissing.length)}</span>
        </div>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(520px,34%)_minmax(0,1fr)] xl:gap-7">
        <section className="min-w-0">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 lg:sticky lg:top-24">
            <h2 className="text-base text-slate-950" style={{ fontWeight: 900 }}>Complementa tu idea</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Revisa cada punto, ajusta lo necesario y confirma lo que sí representa tu caso.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              No tiene que estar perfecto. Buscamos suficiente claridad para iniciar una buena conversación.
            </p>

            <div className="mt-4 grid gap-2">
              {FIELDS.map(field => {
                const status = fieldStatus(field.id, String(draft.aiOutput[field.id] ?? ''), confirmedFields, aiRefinedFields, suggestionField);
                const statusCopy = STATUS_COPY[status];
                const Icon = statusCopy.icon === 'check' ? CheckCircle2 : statusCopy.icon === 'edit' ? PenLine : Circle;
                const isActive = activeField === field.id;
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => selectField(field.id)}
                    className={`group grid min-h-14 w-full grid-cols-[24px_minmax(0,1fr)_112px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? 'border-violet-300 bg-violet-50 text-violet-950 shadow-sm shadow-violet-100/70 ring-2 ring-violet-100'
                        : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 justify-self-center ${isActive ? 'text-violet-600' : statusCopy.icon === 'check' ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className="min-w-0 text-sm leading-5 line-clamp-2" style={{ fontWeight: 800 }}>
                      {field.label}
                    </span>
                    <span className={`w-[112px] justify-self-end rounded-full border px-2 py-1 text-center text-[11px] ${isActive ? 'border-violet-200 bg-violet-600 text-white' : statusCopy.className}`} style={{ fontWeight: 800 }}>
                      {isActive ? 'Editando' : statusCopy.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div ref={editorPanelRef} className="mt-4 scroll-mt-28 rounded-[1.35rem] border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white p-4 shadow-inner">
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] uppercase text-indigo-700" style={{ fontWeight: 900, letterSpacing: '0.06em' }}>
                <PenLine size={12} /> Estás editando
              </p>
              <h3 className="mt-3 text-lg text-slate-950" style={{ fontWeight: 900 }}>{activeConfig.question}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Completa o ajusta este punto para mejorar la claridad de la propuesta.</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{activeConfig.helper}</p>

              {activeField === 'initialEvidence' && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2">
                  <button type="button" onClick={() => setShowEvidenceHelp(prev => !prev)} className="flex w-full items-center justify-between gap-2 text-left text-xs text-slate-700" style={{ fontWeight: 850 }}>
                    <span className="inline-flex items-center gap-2"><HelpCircle size={14} />¿Por qué pedimos esto?</span>
                    {showEvidenceHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showEvidenceHelp && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Esto ayuda a distinguir una idea suelta de una situación que vale la pena revisar. No buscamos que pruebes todo ahora; solo queremos entender qué señales muestran que el tema existe.
                    </p>
                  )}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={activeValue}
                onChange={event => setActiveValue(event.target.value)}
                rows={5}
                placeholder={activeConfig.placeholder}
                className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />

              {activeField === 'initialEvidence' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SIGNAL_CHIPS.map(chip => {
                    const isSelected = activeValue
                      .split('\n')
                      .map(line => line.trim().toLowerCase())
                      .includes(chip.toLowerCase());

                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => appendSignalChip(chip)}
                        aria-pressed={isSelected}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          isSelected
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                        style={{ fontWeight: 750 }}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              )}

              {suggestionLoading && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-violet-700">
                  <Loader2 size={15} className="animate-spin" />
                  Generando sugerencia para este punto...
                </div>
              )}

              {suggestion && suggestion.questionId === activeField && (
                <div className="mt-3 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-2 text-sm text-violet-950" style={{ fontWeight: 900 }}><Wand2 size={15} />Sugerencia IA</p>
                      {suggestion.fromInitialInfo && (
                        <p className="mt-1 text-xs text-violet-700">Sugerencia generada a partir de la información inicial.</p>
                      )}
                    </div>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700" style={{ fontWeight: 800 }}>No se aplica sola</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>Tu versión actual</p>
                      <p className="mt-1 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{suggestion.currentValue || 'Sin respuesta todavía.'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-violet-700" style={{ fontWeight: 800 }}>Propuesta sugerida por IA</p>
                      <p className="mt-1 rounded-xl bg-violet-50 p-3 text-sm leading-6 text-violet-950">{suggestion.suggestedValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>Por qué esta sugerencia mejora claridad</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{suggestion.rationale}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={applySuggestion} className="rounded-xl bg-violet-700 px-3 py-2 text-xs text-white hover:bg-violet-800" style={{ fontWeight: 850 }}>Aplicar sugerencia</button>
                    <button type="button" onClick={() => setSuggestion(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 850 }}>Mantener mi versión</button>
                    <button type="button" onClick={regenerateSuggestion} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 hover:bg-violet-100" style={{ fontWeight: 850 }}>Regenerar</button>
                  </div>
                </div>
              )}

              {savedNotice && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700" style={{ fontWeight: 800 }}>
                  {savedNotice}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => adjustActiveField()} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs text-violet-700 hover:bg-violet-50" style={{ fontWeight: 850 }}><Sparkles size={13} />Ajustar con IA</button>
                <button type="button" onClick={useExample} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 800 }}>Usar ejemplo</button>
                <button type="button" onClick={saveActiveField} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700" style={{ fontWeight: 850 }}><CheckCircle2 size={13} />Guardar cambio</button>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-white/70 p-4 ring-1 ring-slate-200/80">
              <button type="button" onClick={() => setShowOriginalIdea(prev => !prev)} className="flex w-full items-center justify-between gap-3 text-left">
                <span>
                  <span className="flex items-center gap-2 text-sm text-slate-950" style={{ fontWeight: 850 }}><FileText size={15} className="text-slate-400" />Idea original</span>
                  <span className="mt-1 block text-xs text-slate-500">Ver o editar la idea con la que empezaste</span>
                </span>
                {showOriginalIdea ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showOriginalIdea && (
                <div className="mt-4">
                  <span className={`mb-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${originalIdeaStatus === 'dirty' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} style={{ fontWeight: 800 }}>
                    {originalIdeaStatus === 'dirty' ? 'Cambios sin aplicar' : originalIdeaStatus === 'updating' ? 'Reestructurando...' : 'Propuesta actualizada'}
                  </span>
                  <textarea value={originalIdeaDraft} onChange={event => updateOriginalIdea(event.target.value)} rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                  <button type="button" onClick={restructureFromOriginal} disabled={originalIdeaStatus !== 'dirty' || originalIdeaDraft.trim().length < 30} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45" style={{ fontWeight: 850 }}>
                    {originalIdeaStatus === 'updating' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}Reestructurar propuesta con IA
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <PublicOnePagerPreview
          draft={draft}
          highlightedField={previewHighlight}
          canExport={canExport}
          canContinue={canContinue}
          missingCount={Math.max(1, requiredMissing.length)}
          onCopy={copyOnePager}
          onDownload={() => window.print()}
          onContinue={handleContinue}
        />
      </div>

      {contextStatus === 'classified' && (
        <div className="fixed bottom-24 left-1/2 z-40 w-[min(720px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-violet-200 bg-white p-4 shadow-2xl">
          <p className="text-sm text-violet-950" style={{ fontWeight: 900 }}>Sugerencia para la propuesta general</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
              <strong>Qué está bien:</strong> agregaste contexto que puede mejorar el borrador.
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              <strong>Qué falta:</strong> ubicarlo en el punto correcto antes de aplicarlo.
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-800">
              <strong>Sugerencia:</strong> Starteria recomienda integrarlo en una sección específica.
            </div>
          </div>
          <p className="mt-3 text-xs text-violet-900" style={{ fontWeight: 900 }}>Ubicar este ajuste en:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DESTINATIONS.map(destination => (
              <button key={destination.field} type="button" onClick={() => setSelectedDestination(destination.field)} className={`rounded-xl border px-3 py-2 text-xs ${selectedDestination === destination.field ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600'}`} style={{ fontWeight: 800 }}>
                {destination.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={applyContext} className="rounded-xl bg-violet-600 px-3 py-2 text-xs text-white hover:bg-violet-700" style={{ fontWeight: 900 }}>Aplicar sugerencia</button>
            <button type="button" onClick={() => setContextStatus('idle')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 850 }}>Mantener mi versión</button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="mx-auto grid max-w-[1540px] gap-3 lg:grid-cols-[300px_minmax(0,1fr)_auto] lg:items-center">
          <p className="text-xs text-slate-600" style={{ fontWeight: 800 }}>
            {requiredMissing.length > 0 ? pluralPoint(requiredMissing.length) : 'Borrador suficiente para iniciar una conversación'}
          </p>
          <div className="flex min-w-0 gap-2">
            <input
              value={contextInput}
              onChange={event => {
                setContextInput(event.target.value);
                if (contextStatus === 'applied') setContextStatus('idle');
              }}
              placeholder="¿Quieres corregir la propuesta general? Escribe aquí algo que Starteria deba reinterpretar."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={classifyContext}
              disabled={!canAdjustFromBar || contextStatus === 'classifying'}
              title={!canAdjustFromBar ? 'Agrega contexto general para reinterpretar la propuesta.' : undefined}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontWeight: 850 }}
            >
              {contextStatus === 'classifying' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Ajustar propuesta con IA
            </button>
          </div>
          <div>
            <button type="button" onClick={handleContinue} disabled={!canContinue} title={!canContinue ? `Aclara ${requiredMissing.map(field => field.label.toLowerCase()).join(' y ')} para continuar.` : undefined} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45" style={{ fontWeight: 900 }}>
              Convertir en iniciativa y seguir en Starteria
              <ArrowRight size={14} />
            </button>
            <p className="mt-1 text-center text-[11px] text-slate-500">Guarda este borrador y continúa ordenándolo con una guía paso a paso.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
