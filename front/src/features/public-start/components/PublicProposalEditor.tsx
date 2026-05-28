import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, FileText, Loader2, Sparkles } from 'lucide-react';
import type { PublicDraft, PublicDraftOutput } from '../domain/types';
import { finishPublicDraft, generateMockPublicDraftOutput, updatePublicDraftAnswers } from '../services/publicDraftService';
import { updatePublicDraft } from '../services/publicDraftStorage';
import { buildPublicProposalMarkdown } from '../services/publicProposalExportService';
import { PublicAIAssistPanel, type PublicAISuggestion } from './PublicAIAssistPanel';
import { PublicFieldDropdown } from './PublicFieldDropdown';
import { PublicOnePagerPreview } from './PublicOnePagerPreview';
import type { PublicEditorQuestionStatus } from './PublicQuestionCard';
import { AutofillField } from '../../../app/components/autofill/AutofillField';
import { AutofillLocalPersistenceProvider, selectProposal, useAutofillContext } from '../../../app/context/AutofillContext';
import { isPdfAutofillEnabled } from '../../../app/services/featureFlags';
import { STEP0_FIELD_PATH } from '../domain/step0FieldPath';

type EditableField = keyof Pick<
  PublicDraftOutput,
  'proposalTitle' | 'whatToMove' | 'impactedAudience' | 'whyNow' | 'initialEvidence' | 'supportNeeded' | 'decisionRequested'
>;
type ContextStatus = 'idle' | 'classifying' | 'classified' | 'applied';

const FIELDS: Array<{ id: EditableField; label: string; question: string; helper: string; placeholder: string; required?: boolean }> = [
  { id: 'proposalTitle', label: 'Nombre de la iniciativa', question: 'Como se llama esta iniciativa?', helper: 'Usa un nombre concreto que ayude a entender el cambio que quieres mover.', placeholder: 'Ej. Reducir demoras en aprobaciones internas', required: true },
  { id: 'whatToMove', label: 'Que quieres mover', question: 'Que objetivo, problema u oportunidad quieres mover?', helper: 'Describe el cambio que buscas provocar, sin cerrar todavia la solucion.', placeholder: 'Ej. Reducir el tiempo de aprobacion de solicitudes internas...', required: true },
  { id: 'whyNow', label: 'Por que importa ahora', question: 'Por que importa resolverlo ahora?', helper: 'Conecta urgencia, costo de esperar o ventana de oportunidad.', placeholder: 'Ej. Si se posterga, el equipo seguira perdiendo seguimiento...', required: true },
  { id: 'impactedAudience', label: 'A quien impacta', question: 'A quien impacta esta iniciativa?', helper: 'Nombra personas, equipos, clientes o areas afectadas directamente.', placeholder: 'Ej. Equipo comercial, operaciones y personas que esperan aprobaciones.', required: true },
  { id: 'initialEvidence', label: 'Que respaldo o senal tienes', question: 'Que evidencia o senal tienes hoy?', helper: 'No inventes evidencia. Puedes describir que senal falta buscar.', placeholder: 'Ej. Reclamos, tiempo perdido, feedback interno, dato de reporte...' },
  { id: 'supportNeeded', label: 'Que apoyo necesitas', question: 'Que apoyo o decision necesitas para avanzar?', helper: 'Aclara si necesitas feedback, permiso para validar, acceso a datos o sponsor.', placeholder: 'Ej. Permiso para validar con usuarios y acceso a datos del proceso.' },
];

const REQUIRED_FIELDS: EditableField[] = ['proposalTitle', 'whatToMove', 'whyNow', 'impactedAudience'];
const GENERIC = new Set(['no se', 'no sé', 'por definir', 'pendiente', 'n/a', 'na', 'ninguno', 'no aplica']);
const DESTINATIONS: Array<{ field: EditableField; label: string }> = [
  { field: 'impactedAudience', label: 'impacto' },
  { field: 'initialEvidence', label: 'evidencia' },
  { field: 'whyNow', label: 'urgencia' },
  { field: 'supportNeeded', label: 'decision' },
];

function clean(value: string | undefined) {
  return (value ?? '').trim();
}

function fieldStatus(value: string | undefined, aiRefined: boolean): PublicEditorQuestionStatus {
  if (aiRefined) return 'ai_refined';
  const normalized = clean(value);
  if (!normalized) return 'missing';
  if (normalized.length <= 15 || GENERIC.has(normalized.toLowerCase())) return 'needs_improvement';
  return 'complete';
}

function isComplete(value: string | undefined) {
  return fieldStatus(value, false) === 'complete';
}

function missingRequired(output: PublicDraftOutput) {
  return FIELDS.filter(field => field.required && !isComplete(String(output[field.id] ?? '')));
}

function precisionFields(output: PublicDraftOutput) {
  return FIELDS.filter(field => fieldStatus(String(output[field.id] ?? ''), false) !== 'complete');
}

function missingLabels(output: PublicDraftOutput) {
  return precisionFields(output).map(field => field.label);
}

function risks(output: PublicDraftOutput) {
  const items = ['La propuesta sigue siendo temporal y aun no equivale a una validacion.'];
  if (!isComplete(output.initialEvidence)) items.push('Falta evidencia o una senal inicial para sostener mejor la conversacion.');
  if (!isComplete(output.supportNeeded) && !isComplete(output.decisionRequested)) items.push('Aun no esta claro que decision permitira avanzar.');
  return items;
}

function nextAction(output: PublicDraftOutput) {
  const missing = missingRequired(output);
    if (missing.length === 0) return 'Revisa el one-pager y decide si quieres seguir construyendo esta iniciativa.';
  return `Completa primero: ${missing.map(field => field.label).join(', ')}.`;
}

function inferDestination(value: string): EditableField {
  if (/(reclamo|venta|tiempo|feedback|reporte|dato|metrica|observacion|evidencia)/i.test(value)) return 'initialEvidence';
  if (/(decision|permiso|presupuesto|sponsor|acceso|validar|feedback)/i.test(value)) return 'supportNeeded';
  if (/(ahora|urgente|demora|costo|riesgo|oportunidad|mes|semana)/i.test(value)) return 'whyNow';
  return 'impactedAudience';
}

function buildSuggestion(field: EditableField, value: string): PublicAISuggestion {
  const suggestions: Record<EditableField, string> = {
    proposalTitle: value.trim() || 'Propuesta para mover una friccion critica',
    whatToMove: value.trim().length > 15 ? `${value.trim()} El primer foco sera entender la friccion principal, su impacto y una senal observable para decidir si conviene avanzar.` : 'Queremos aterrizar el problema u oportunidad en una primera senal observable antes de disenar una solucion.',
    whyNow: value.trim().length > 15 ? `${value.trim()} Si se posterga, puede seguir generando retrabajo, demora o perdida de oportunidad.` : 'Importa resolverlo ahora porque esperar puede aumentar retrabajo, demoras o perdida de oportunidad.',
    impactedAudience: value.trim().length > 15 ? value.trim() : 'Impacta a las personas que ejecutan o dependen del proceso afectado y al equipo que debe priorizar recursos.',
    initialEvidence: value.trim().length > 15 ? value.trim() : 'Aun no tengo evidencia documentada. El siguiente paso es buscar datos de tiempo, casos repetidos, feedback de usuarios o una entrevista breve.',
    supportNeeded: value.trim().length > 15 ? `${value.trim()} La decision minima es confirmar si vale la pena seguir construyendo esta iniciativa.` : 'Necesito feedback, acceso a informacion inicial y permiso para validar si vale la pena desarrollar esta iniciativa.',
    decisionRequested: value.trim().length > 15 ? value.trim() : 'Confirmar si esta propuesta debe convertirse en iniciativa para seguir avanzando.',
  };
  return {
    questionId: field,
    currentValue: value,
    suggestedValue: suggestions[field],
    rationale: 'Hace la respuesta mas especifica y accionable sin asumir evidencia ni aprobacion.',
  };
}

const STATUS_COPY: Record<PublicEditorQuestionStatus, { label: string; className: string }> = {
  complete: { label: 'Completo', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  missing: { label: 'Falta completar', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  needs_improvement: { label: 'Necesita precision', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  ai_refined: { label: 'Afinado con IA', className: 'border-violet-200 bg-violet-50 text-violet-700' },
};


export function PublicProposalEditor({ initialDraft }: { initialDraft: PublicDraft }) {
  const navigate = useNavigate();
  const autofillOn = isPdfAutofillEnabled();
  const [draft, setDraft] = useState(initialDraft);
  const [activeField, setActiveField] = useState<EditableField>('proposalTitle');
  const [activeValue, setActiveValue] = useState(String(initialDraft.aiOutput.proposalTitle ?? ''));
  const [aiRefinedFields, setAiRefinedFields] = useState<Set<string>>(() => new Set());
  const [showOriginalIdea, setShowOriginalIdea] = useState(false);
  const [originalIdeaDraft, setOriginalIdeaDraft] = useState(initialDraft.inputText);
  const [originalIdeaStatus, setOriginalIdeaStatus] = useState<'synced' | 'dirty' | 'updating'>('synced');
  const [contextInput, setContextInput] = useState('');
  const [contextStatus, setContextStatus] = useState<ContextStatus>('idle');
  const [selectedDestination, setSelectedDestination] = useState<EditableField>('impactedAudience');
  const [suggestion, setSuggestion] = useState<PublicAISuggestion | null>(null);

  // ---- Auto-seed aiOutput from AutofillContext proposals -----------------
  //
  // After a PDF upload on /public/start, the agent extracts step0 fields and
  // proposals are merged into AutofillContext keyed by this draft.id. The
  // chips on the per-field editor on the left would normally drive the
  // one-pager preview on the right only AFTER the user confirms each chip —
  // but the user expects the preview to populate immediately, the chips
  // becoming "Afinado con IA" markers they can still tweak.
  //
  // This effect bridges proposals → draft.aiOutput on mount and whenever the
  // proposals slice for this draftId changes. It only seeds fields whose
  // current aiOutput value is empty/whitespace, so user edits are never
  // overwritten.
  const { state: autofillState } = useAutofillContext();
  // Stable signature derived from the proposals we care about: rebuilds the
  // effect only when a relevant field's effective value (final ?? proposed)
  // actually changes. Keying off `state.byInitiative[draft.id]` reference
  // alone would also work, but a value-based signature makes the dependency
  // boring and impossible to accidentally retrigger from unrelated dispatches.
  const proposalSignature = useMemo(() => {
    const slice = autofillState.byInitiative[draft.id];
    if (!slice) return '';
    const parts: string[] = [];
    for (const field of FIELDS) {
      const path = STEP0_FIELD_PATH[field.id];
      if (!path) continue;
      const p = slice[path];
      if (!p) continue;
      const effective = (p.finalValue ?? p.proposedValue) as unknown;
      parts.push(`${field.id}:${typeof effective === 'string' ? effective : ''}`);
    }
    return parts.join('|');
  }, [autofillState.byInitiative, draft.id]);

  useEffect(() => {
    const patch: Partial<Record<EditableField, string>> = {};
    const newlyRefined: EditableField[] = [];
    for (const field of FIELDS) {
      const path = STEP0_FIELD_PATH[field.id];
      if (!path) continue;
      const proposal = selectProposal(autofillState, draft.id, path);
      if (!proposal) continue;
      const raw = (proposal.finalValue ?? proposal.proposedValue) as unknown;
      if (typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const current = String(draft.aiOutput[field.id] ?? '').trim();
      if (current) continue; // user-set or already seeded: do not overwrite
      patch[field.id] = trimmed;
      newlyRefined.push(field.id);
    }
    if (newlyRefined.length === 0) return;

    setDraft(prev => ({
      ...prev,
      aiOutput: { ...prev.aiOutput, ...patch },
    }));
    setAiRefinedFields(prev => {
      const next = new Set(prev);
      for (const id of newlyRefined) next.add(id);
      return next;
    });
    // Sync the editor textarea on the left only when it's still empty for the
    // currently active field — never fight an in-progress user edit.
    if (newlyRefined.includes(activeField) && !activeValue.trim()) {
      const seeded = patch[activeField];
      if (seeded) setActiveValue(seeded);
    }
    // Persist the patch through the existing storage helper so a reload
    // within the draft's lifespan keeps the seeded values.
    updatePublicDraftAnswers(draft.id, patch as Record<string, string>);
    // We intentionally exclude `draft.aiOutput`, `activeField`, `activeValue`
    // from deps: the effect must only run when the proposals slice changes.
    // `proposalSignature` is value-based, so re-runs stop once the slice
    // stabilises and the guard (`current` non-empty) is idempotent on top.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalSignature, draft.id]);

  const requiredMissing = useMemo(() => missingRequired(draft.aiOutput), [draft.aiOutput]);
  const precisionMissing = useMemo(() => precisionFields(draft.aiOutput), [draft.aiOutput]);
  const completedCount = FIELDS.length - precisionMissing.length;
  const canContinue = requiredMissing.length === 0;
  const canExport = canContinue && precisionMissing.length <= 2;
  const activeConfig = FIELDS.find(field => field.id === activeField) ?? FIELDS[0];
  const activeFieldChanged = activeValue.trim() !== String(draft.aiOutput[activeField] ?? '').trim();
  const canRefineFromBar = contextInput.trim().length > 0 || completedCount === FIELDS.length || activeFieldChanged;
  const missingCopy = requiredMissing.length > 0
    ? `Faltan ${requiredMissing.map(field => field.label.toLowerCase()).join(' y ')}`
    : precisionMissing.length > 0
      ? `${precisionMissing.length} campos necesitan precision`
      : 'Lista para guardar';

  const persistDraft = (patch: Partial<PublicDraft>) => {
    const updated = updatePublicDraft(draft.id, patch);
    if (updated) setDraft(updated);
  };

  const persistOutput = (output: PublicDraftOutput) => {
    const nextOutput = {
      ...output,
      missingCriticalFields: missingLabels(output),
      risks: risks(output),
      nextRecommendedAction: nextAction(output),
    };
    persistDraft({
      status: 'edited',
      aiOutput: nextOutput,
      aiRecommendation: {
        summary: 'La propuesta se esta afinando con tus respuestas. Aun no se considera validada.',
        goodPoints: ['La propuesta ya tiene una estructura editable.', 'Los faltantes quedan visibles para decidir el siguiente paso.'],
        missing: nextOutput.missingCriticalFields,
        nextAction: nextOutput.nextRecommendedAction,
        confidenceScore: nextOutput.confidenceScore,
      },
    });
  };

  const updateField = (field: EditableField, value: string) => {
    const nextOutput = { ...draft.aiOutput, [field]: value };
    if (field === 'supportNeeded' && !draft.aiOutput.decisionRequested?.trim()) nextOutput.decisionRequested = value;
    persistOutput(nextOutput);
  };

  const selectField = (field: EditableField) => {
    setActiveField(field);
    setActiveValue(String(draft.aiOutput[field] ?? ''));
  };

  const saveActiveField = () => {
    updateField(activeField, activeValue);
  };

  const useExample = () => {
    setActiveValue(buildSuggestion(activeField, '', draft.aiOutput).suggestedValue);
  };

  const refineActiveField = () => {
    setSuggestion(buildSuggestion(activeField, activeValue, draft.aiOutput));
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    const field = suggestion.questionId as EditableField;
    updateField(field, suggestion.suggestedValue);
    if (field === activeField) setActiveValue(suggestion.suggestedValue);
    setAiRefinedFields(prev => new Set(prev).add(field));
    setSuggestion(null);
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
    updateField(selectedDestination, nextValue);
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
    <AutofillLocalPersistenceProvider>
    <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-[1560px] flex-col gap-4 px-3 pb-28 pt-3 lg:px-5">
      <header className="rounded-3xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg text-slate-950" style={{ fontWeight: 900 }}>Propuesta de iniciativa</h1>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">Borrador en edicion</span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{completedCount}/{FIELDS.length} campos completos</span>
          <span className="ml-auto text-xs text-slate-500" style={{ fontWeight: 750 }}>{missingCopy}</span>
        </div>
      </header>

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(280px,30fr)_minmax(0,70fr)]">
        <section className="space-y-4">
          <div className="rounded-3xl bg-white/78 p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base text-slate-950" style={{ fontWeight: 900 }}>Completa lo esencial</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Elige un campo, guardalo y revisa como cambia el one-pager.</p>
              </div>
            </div>
            <div className="mt-3">
              <PublicFieldDropdown
                items={FIELDS.map(field => ({
                  id: field.id,
                  label: field.label,
                  status: fieldStatus(String(draft.aiOutput[field.id] ?? ''), aiRefinedFields.has(field.id)),
                }))}
                activeId={activeField}
                onSelect={selectField}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <p className="text-xs uppercase text-indigo-600" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>{activeConfig.label}</p>
            <h3 className="mt-2 text-xl text-slate-950" style={{ fontWeight: 900 }}>{activeConfig.question}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{activeConfig.helper}</p>
            <div className="mt-4">
              <AutofillField
                fieldPath={STEP0_FIELD_PATH[activeField] ?? `step0.${activeField}`}
                initiativeId={draft.id}
                value={activeValue}
                label={activeConfig.label}
                onChange={value => {
                  const next = String(value ?? '');
                  setActiveValue(next);
                  // With autofill on, this onChange fires only on confirm/edit
                  // of a proposal (the input is read-only while unconfirmed), so
                  // persisting here is correct. With the flag off, AutofillField
                  // is a pure passthrough and fires onChange on every keystroke —
                  // we keep the original "Guardar cambio" UX (persist on button).
                  if (autofillOn) updateField(activeField, next);
                }}
              >
                {({ value, onChange, readOnly }) => (
                  <textarea
                    value={value as string}
                    onChange={event => onChange(event.target.value)}
                    readOnly={readOnly}
                    rows={7}
                    placeholder={activeConfig.placeholder}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                )}
              </AutofillField>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={refineActiveField} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 hover:bg-violet-100" style={{ fontWeight: 850 }}><Sparkles size={13} />Afinar con IA</button>
              <button type="button" onClick={useExample} className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 800 }}>Usar ejemplo</button>
              <button type="button" onClick={saveActiveField} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700" style={{ fontWeight: 850 }}><CheckCircle2 size={13} />Guardar cambio</button>
            </div>
          </div>

          <div className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/80">
            <button type="button" onClick={() => setShowOriginalIdea(prev => !prev)} className="flex w-full items-center justify-between gap-3 text-left">
              <span>
                <span className="flex items-center gap-2 text-sm text-slate-950" style={{ fontWeight: 850 }}><FileText size={15} className="text-slate-400" />Idea original</span>
                <span className="mt-1 block text-xs text-slate-500">Ver / editar idea original</span>
              </span>
              {showOriginalIdea ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showOriginalIdea && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${originalIdeaStatus === 'dirty' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} style={{ fontWeight: 800 }}>
                    {originalIdeaStatus === 'dirty' ? 'Cambios sin aplicar' : originalIdeaStatus === 'updating' ? 'Reestructurando...' : 'Propuesta actualizada'}
                  </span>
                </div>
                <textarea value={originalIdeaDraft} onChange={event => updateOriginalIdea(event.target.value)} rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                <button type="button" onClick={restructureFromOriginal} disabled={originalIdeaStatus !== 'dirty' || originalIdeaDraft.trim().length < 30} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45" style={{ fontWeight: 850 }}>
                  {originalIdeaStatus === 'updating' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}Reestructurar propuesta con IA
                </button>
              </div>
            )}
          </div>
        </section>

        <PublicOnePagerPreview
          draft={draft}
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
          <p className="text-xs text-violet-900" style={{ fontWeight: 900 }}>Starteria sugiere usar este dato en:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DESTINATIONS.map(destination => (
              <button key={destination.field} type="button" onClick={() => setSelectedDestination(destination.field)} className={`rounded-xl border px-3 py-2 text-xs ${selectedDestination === destination.field ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600'}`} style={{ fontWeight: 800 }}>
                {destination.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={applyContext} className="mt-3 rounded-xl bg-violet-600 px-3 py-2 text-xs text-white hover:bg-violet-700" style={{ fontWeight: 900 }}>Aplicar sugerencia</button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="mx-auto grid max-w-[1536px] gap-3 lg:grid-cols-[280px_minmax(0,1fr)_auto] lg:items-center">
          <p className="text-xs text-slate-600" style={{ fontWeight: 800 }}>
            {requiredMissing.length > 0 ? `Faltan ${requiredMissing.length} campos para tener una propuesta presentable` : 'Propuesta suficiente para crear una iniciativa'}
          </p>
          <div className="flex min-w-0 gap-2">
            <input
              value={contextInput}
              onChange={event => {
                setContextInput(event.target.value);
                if (contextStatus === 'applied') setContextStatus('idle');
              }}
              placeholder="Agrega contexto para mejorar la propuesta..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={() => {
                if (contextInput.trim()) {
                  classifyContext();
                  return;
                }
                refineActiveField();
              }}
              disabled={!canRefineFromBar || contextStatus === 'classifying'}
              title={!canRefineFromBar ? 'Agrega contexto o edita un campo para afinar la propuesta.' : undefined}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontWeight: 850 }}
            >
              {contextStatus === 'classifying' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Afinar con IA
            </button>
          </div>
          <div>
            <button type="button" onClick={handleContinue} disabled={!canContinue} title={!canContinue ? `Completa ${requiredMissing.map(field => field.label.toLowerCase()).join(' y ')} para continuar.` : undefined} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45" style={{ fontWeight: 900 }}>
              Seguir construyendo esta iniciativa
              <ArrowRight size={14} />
            </button>
            <p className="mt-1 text-center text-[11px] text-slate-500">Guarda esta propuesta y continúa desarrollándola con guía de Starteria.</p>
          </div>
        </div>
      </div>

      <PublicAIAssistPanel suggestion={suggestion} onApply={applySuggestion} onKeep={() => setSuggestion(null)} onEditManually={() => setSuggestion(null)} />
    </div>
    </AutofillLocalPersistenceProvider>
  );
}
