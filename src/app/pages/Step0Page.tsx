import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, ChevronRight, Copy, CreditCard, Download, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MentorVirtualPanel } from '../components/MentorVirtualPanel';
import { MentorSupportModal } from '../components/MentorSupportModal';
import { AutosaveIndicator, useAutosave } from '../components/AutosaveIndicator';
import { usePortfolioLead } from '../portfolio/PortfolioLeadContext';
import {
  ADDITIONAL_STAKEHOLDER_OPTIONS,
  CLARITY_OPTIONS,
  CONTRIBUTION_OPTIONS,
  EVIDENCE_TYPE_OPTIONS,
  FRAME_OPTIONS,
  PRIMARY_OBJECTIVE_OPTIONS,
  buildInheritedChallengeContext,
  getConsequenceHelper,
  getDescriptionHelper,
  getDynamicDescriptionLabel,
  getRequiredFieldKeys,
  getStep0Mode,
  getSummaryBlocks,
  getSummaryTitle,
  isFilled,
  normalizeStep0Data,
  syncLegacyFields,
} from '../step0/step0Config';
import type { Step0Data } from '../context/AppContext';

const IA_FEEDBACK = {
  claro: ['La base ya deja mas claro que se quiere mover.', 'La solicitud de apoyo se entiende mejor.', 'La conversacion con sponsor u owner ya tiene mejor foco.'],
  faltaPrecisar: ['Refuerza la evidencia actual.', 'Haz mas concreta la decision que estas pidiendo.', 'Aterriza mejor el destrabe minimo.'],
  preguntas: ['Que senal justificaria seguir?', 'Que parte del reto o del negocio se moveria primero?', 'Que apoyo minimo necesitas para no quedarte solo en diagnostico?'],
  siguienteAccion: 'Refuerza evidencia y decision solicitada para que el Step 0 quede realmente conversable.',
};

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{label}</p>
        {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
      </div>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className ?? ''}`} />;
}

function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${props.className ?? ''}`} />;
}

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | '';
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map(option => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-white'}`}
            style={{ fontWeight: 600 }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Step0Page() {
  const { projectId } = useParams();
  const { projects, updateProject, updateStep0, user } = useApp();
  const { challenges, strategicFronts } = usePortfolioLead();
  const navigate = useNavigate();
  const project = projects.find(item => item.id === projectId);
  const [showIAPanel, setShowIAPanel] = useState(false);
  const [iaLoading, setIaLoading] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [copied, setCopied] = useState(false);
  const projectForInit = project ?? {
    id: '',
    name: '',
    status: 'Draft' as const,
    currentStep: 1,
    step0Status: 'No iniciado' as const,
    mentorCredits: 0,
    steps: [],
    team: [],
    evidence: [],
    createdAt: '',
    lastModified: '',
  };
  const [form, setForm] = useState<Step0Data>(() => normalizeStep0Data(project?.step0Data, projectForInit, user?.name ?? '', user?.email ?? ''));
  const saveState = useAutosave([form]);

  if (!project) {
    return <div className="p-6 text-slate-500">Proyecto no encontrado.</div>;
  }

  const mode = form.mode ?? getStep0Mode(project);
  const inherited = buildInheritedChallengeContext(project, challenges, strategicFronts);
  const summaryBlocks = getSummaryBlocks(form, inherited);
  const requiredKeys = getRequiredFieldKeys(mode, form);
  const completed = requiredKeys.filter(key => isFilled(form[key])).length;
  const progress = Math.round((completed / requiredKeys.length) * 100);
  const missing = requiredKeys.filter(key => !isFilled(form[key]));
  const canSave = missing.length === 0;
  const summaryTitle = getSummaryTitle(mode);
  const previewCount = Math.min(summaryBlocks.length, Math.round((completed / requiredKeys.length) * summaryBlocks.length));
  const descriptionLabel = getDynamicDescriptionLabel(form.initiativeFrame ?? '', mode);
  const descriptionHelper = getDescriptionHelper(form.initiativeFrame ?? '', form.primaryObjective ?? '');
  const consequenceHelper = getConsequenceHelper(form.primaryObjective ?? '');

  const analysisText = useMemo(
    () => [summaryTitle, ...summaryBlocks.map(block => `${block.label}: ${block.value}`)].join('\n'),
    [summaryBlocks, summaryTitle],
  );

  const setField = <K extends keyof Step0Data>(key: K, value: Step0Data[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const openIA = () => {
    setShowIAPanel(true);
    setIaLoading(true);
    window.setTimeout(() => setIaLoading(false), 1200);
  };

  const handleSave = async () => {
    const synced = syncLegacyFields({ ...form, mode });
    setSaving(true);
    await new Promise(resolve => window.setTimeout(resolve, 450));
    if ((synced.initiativeTitle ?? '').trim() && synced.initiativeTitle!.trim() !== project.name.trim()) {
      updateProject(project.id, { name: synced.initiativeTitle!.trim() });
    }
    updateStep0(project.id, synced, 'Completado');
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => navigate(`/projects/${project.id}`), 600);
  };

  const runAnalysis = () => {
    if (!canSave) return;
    setAnalysisState('loading');
    window.setTimeout(() => setAnalysisState('done'), 1500);
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(analysisText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadSummary = () => {
    const blob = new Blob([analysisText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starteria-step0-${project.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-100 bg-white px-5 pb-5 pt-6">
          <div className="mx-auto max-w-[1480px]">
            <button onClick={() => navigate(`/projects/${project.id}`)} className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700">
              <ArrowLeft size={14} /> Volver al proyecto
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700" style={{ fontWeight: 700 }}>PASO 0</span>
                  <span className="text-xs text-slate-400">{progress}% completado</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                    {mode === 'linked_to_challenge' ? 'Iniciativa dentro de reto' : 'Proyecto independiente'}
                  </span>
                </div>
                <h1 className="text-xl text-slate-900" style={{ fontWeight: 700 }}>Base estrategica inicial</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Este paso construye una base breve pero estrategica para justificar por que esta iniciativa merece luz verde, profundidad o destrabe.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMentorModal(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <Calendar size={14} /> Pedir ayuda a un mentor
                </button>
                <AutosaveIndicator state={saveState} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1480px] items-start gap-6 px-5 py-6 min-[1280px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {mode === 'linked_to_challenge' && inherited.items.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Bloque 0 - Contexto heredado del reto</h2>
                <p className="mt-1 text-sm text-slate-500">Este contexto viene del reto padre y se muestra solo como ancla.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {inherited.items.map(item => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm text-slate-800" style={{ fontWeight: 600 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
              <h2 className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{mode === 'linked_to_challenge' ? 'Bloque 1 - Encaje con el reto padre' : 'Bloque 1 - Punto de partida'}</h2>
              <Field label="¿Como se llama tu iniciativa?"><Input value={form.initiativeTitle ?? project.name} onChange={event => setField('initiativeTitle', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? '¿Desde que rol y area estas viendo este reto?' : '¿Desde que rol y area estas viendo esta iniciativa?'}><Input value={form.rolArea} onChange={event => setField('rolArea', event.target.value)} /></Field>
              {mode === 'linked_to_challenge' && <Field label="¿Que parte especifica del reto estas buscando mover con esta iniciativa?"><Area rows={3} value={form.specificChallengePart ?? ''} onChange={event => setField('specificChallengePart', event.target.value)} /></Field>}
              {mode === 'linked_to_challenge' && <Field label="¿Como se conecta esta iniciativa con el objetivo o KPI que ya persigue este reto?"><Area rows={3} value={form.challengeGoalConnection ?? ''} onChange={event => setField('challengeGoalConnection', event.target.value)} /></Field>}
              <Field label="¿Como quieres enmarcar esta iniciativa hoy?"><ChoiceGroup value={form.initiativeFrame ?? ''} options={FRAME_OPTIONS} onChange={value => setField('initiativeFrame', value)} /></Field>
              <Field label="¿Que objetivo principal ayudaria a mover esta iniciativa?"><ChoiceGroup value={form.primaryObjective ?? ''} options={PRIMARY_OBJECTIVE_OPTIONS} onChange={value => setField('primaryObjective', value)} /></Field>
              <Field label="¿Con que nivel de claridad llegas hoy?"><ChoiceGroup value={form.clarityLevel ?? ''} options={CLARITY_OPTIONS} onChange={value => setField('clarityLevel', value)} /></Field>
              {mode === 'linked_to_challenge' && <Field label="¿Que tipo de aporte crees que puede hacer esta iniciativa dentro del reto?"><ChoiceGroup value={form.linkedContributionType ?? ''} options={CONTRIBUTION_OPTIONS} onChange={value => setField('linkedContributionType', value)} /></Field>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
              <h2 className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Bloque 2 - Justificacion de la iniciativa</h2>
              <Field label={descriptionLabel} helper={descriptionHelper}><Area rows={5} value={form.quePasaQueQuieres} onChange={event => setField('quePasaQueQuieres', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? '¿A quien impacta mas directamente esta parte del reto?' : '¿A quien impacta mas directamente esta iniciativa?'}><Area rows={3} value={form.impactWho ?? ''} onChange={event => setField('impactWho', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? '¿Donde o en que momento se hace mas visible esta parte del reto?' : '¿Donde o en que momento se hace mas visible este reto?'}><Area rows={3} value={form.visibleMoment ?? ''} onChange={event => setField('visibleMoment', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? '¿Por que vale la pena mover esta iniciativa ahora dentro del reto?' : '¿Por que conviene mover esto ahora?'}><Area rows={3} value={form.whyNowText ?? ''} onChange={event => setField('whyNowText', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? 'Si esta parte del reto no se aborda, ¿que efecto tendria sobre el objetivo o KPI del reto?' : 'Si esto no se aborda en los proximos 3 meses, ¿cual seria la consecuencia principal?'} helper={consequenceHelper}><Area rows={3} value={form.ifNotNowConsequence ?? ''} onChange={event => setField('ifNotNowConsequence', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? '¿Que evidencia, senales o referencias respaldan hoy esta iniciativa?' : '¿Que respaldo tienes hoy para sostener esta iniciativa?'}>
                <div className="space-y-3">
                  <ChoiceGroup value={form.evidenceType ?? ''} options={EVIDENCE_TYPE_OPTIONS} onChange={value => setField('evidenceType', value)} />
                  <Area rows={3} value={form.currentEvidence ?? ''} onChange={event => setField('currentEvidence', event.target.value)} />
                </div>
              </Field>
              <Field label={mode === 'linked_to_challenge' ? '¿Que senal te haria pensar que esta iniciativa si merece seguir avanzando dentro del reto?' : '¿Que senal te haria decir que vale la pena seguir avanzando?'}><Area rows={3} value={form.validationSignal ?? ''} onChange={event => setField('validationSignal', event.target.value)} /></Field>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
              <h2 className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{mode === 'linked_to_challenge' ? 'Bloque 3 - Decision y destrabe real' : 'Bloque 3 - Respaldo y siguiente paso'}</h2>
              {mode === 'independent' && <Field label="¿Que area, lider o sponsor tendria mas sentido que escuche esto primero?"><Area rows={3} value={form.quienEscuchar} onChange={event => setField('quienEscuchar', event.target.value)} /></Field>}
              {mode === 'independent' && <Field label="¿Por que esa persona o area deberia interesarse en esta iniciativa?"><Area rows={3} value={form.sponsorInterestReason ?? ''} onChange={event => setField('sponsorInterestReason', event.target.value)} /></Field>}
              {mode === 'linked_to_challenge' && <Field label="Ademas del sponsor y owner ya definidos, ¿hay alguien mas que conviene involucrar desde el inicio?"><ChoiceGroup value={form.additionalStakeholders ?? ''} options={ADDITIONAL_STAKEHOLDER_OPTIONS} onChange={value => setField('additionalStakeholders', value)} /></Field>}
              {mode === 'linked_to_challenge' && form.additionalStakeholders === 'si' && <Field label="¿A quien mas conviene involucrar y para que?"><Area rows={3} value={form.additionalStakeholdersDetail ?? ''} onChange={event => setField('additionalStakeholdersDetail', event.target.value)} /></Field>}
              <Field label={mode === 'linked_to_challenge' ? '¿Que apoyo minimo necesitas del sponsor o owner ya definido para avanzar?' : '¿Que apoyo minimo necesitas para que esto avance?'}><Area rows={3} value={form.supportNeeded ?? ''} onChange={event => setField('supportNeeded', event.target.value)} /></Field>
              <Field label={mode === 'linked_to_challenge' ? '¿Que decision puntual estas buscando en esta etapa?' : '¿Que decision estas buscando en esta etapa?'}><Area rows={3} value={form.decisionRequested ?? ''} onChange={event => setField('decisionRequested', event.target.value)} /></Field>
              <Field label="¿A que correo te envio el one-pager listo para compartir?"><Input type="email" value={form.deliveryEmail ?? ''} onChange={event => setField('deliveryEmail', event.target.value)} /></Field>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{summaryTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">Convierte lo que ya escribiste en una base breve para compartir o seguir refinando.</p>
              <div className="mt-4 space-y-4">
                {analysisState === 'idle' && (
                  <>
                    {missing.length > 0 && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700"><AlertCircle size={14} className="mt-0.5 shrink-0" /> Completa los campos visibles para generar el resumen inicial.</div>}
                    <button onClick={runAnalysis} disabled={!canSave} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ fontWeight: 600 }}><Sparkles size={14} className="mr-2 inline" />Generar resumen inicial</button>
                  </>
                )}
                {analysisState === 'loading' && <div className="flex flex-col items-center gap-3 py-8 text-sm text-slate-600"><Loader2 size={28} className="animate-spin text-indigo-500" />Ordenando tu base estrategica...</div>}
                {analysisState === 'done' && (
                  <>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900" style={{ fontWeight: 600 }}>
                      {mode === 'linked_to_challenge' ? 'La iniciativa ya tiene una base clara para justificarse dentro del reto.' : 'La iniciativa ya tiene una base clara para abrir conversacion y buscar respaldo inicial.'}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white">
                      {summaryBlocks.map(block => <div key={block.label} className="border-b border-slate-100 px-4 py-3 text-xs text-slate-700 last:border-b-0"><span style={{ fontWeight: 700 }}>{block.label}: </span>{block.value}</div>)}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={downloadSummary} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white" style={{ fontWeight: 600 }}><Download size={14} className="mr-2 inline" />Descargar resumen</button>
                      <button onClick={copySummary} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600" style={{ fontWeight: 600 }}><Copy size={14} className="mr-2 inline" />{copied ? 'Copiado' : 'Copiar resumen'}</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden min-[1280px]:block">
            <div className="sticky top-4 space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="bg-indigo-600 px-4 py-3.5">
                  <p className="text-xs text-indigo-200" style={{ fontWeight: 700 }}>PREVIEW DEL RESUMEN</p>
                  <p className="mt-0.5 text-sm text-white" style={{ fontWeight: 700 }}>{summaryTitle}</p>
                </div>
                <div className="space-y-3 p-4">
                  {mode === 'linked_to_challenge' && inherited.items.length > 0 && <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs text-sky-700">{inherited.items.slice(0, 4).map(item => `${item.label}: ${item.value}`).join(' | ')}</div>}
                  {summaryBlocks.map(block => <div key={block.label}><p className="text-xs text-slate-400" style={{ fontWeight: 700 }}>{block.label.toUpperCase()}</p><p className="mt-0.5 text-xs text-slate-700">{block.value}</p></div>)}
                </div>
                <div className="px-4 pb-4">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-400"><span>Bloques listos</span><span className="text-indigo-600" style={{ fontWeight: 700 }}>{previewCount}/{summaryBlocks.length}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(previewCount / summaryBlocks.length) * 100}%` }} /></div>
                </div>
              </div>
              <button onClick={openIA} className="w-full rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-left text-sm text-violet-700 hover:bg-violet-100" style={{ fontWeight: 600 }}><Sparkles size={14} className="mr-2 inline" />Mejorar claridad con IA</button>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-3">
          <button onClick={handleSave} disabled={!canSave || saving || saved} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ fontWeight: 600 }}>
            {saved ? <><CheckCircle2 size={14} className="mr-2 inline" />Guardado</> : saving ? 'Guardando...' : <>Guardar y continuar <ChevronRight size={14} className="ml-1 inline" /></>}
          </button>
          <button onClick={openIA} className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm text-violet-600" style={{ fontWeight: 600 }}><Sparkles size={14} className="mr-2 inline" />Mejorar claridad con IA</button>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            {project.mentorCredits !== undefined && <div className="flex items-center gap-1.5 text-xs text-slate-400"><CreditCard size={12} /><span>{project.mentorCredits} creditos disponibles</span></div>}
            <AutosaveIndicator state={saveState} />
          </div>
        </div>
      </div>

      <MentorVirtualPanel open={showIAPanel} onClose={() => setShowIAPanel(false)} context="Paso 0 · Base estrategica inicial" feedback={IA_FEEDBACK} loading={iaLoading} />
      {showMentorModal && <MentorSupportModal onClose={() => setShowMentorModal(false)} context="Paso 0 · Base estrategica inicial" mentorCredits={project.mentorCredits ?? 3} onOpenIA={() => { setShowMentorModal(false); openIA(); }} />}
    </div>
  );
}
