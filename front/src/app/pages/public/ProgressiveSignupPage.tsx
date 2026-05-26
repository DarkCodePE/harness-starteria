import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  FileDown,
  Link2,
  Lock,
  Map,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AuthError } from '../../services/api';
import type { PublicDraft } from '../../../features/public-start/domain/types';
import { getPublicDraft, isPublicDraftExpired } from '../../../features/public-start/services/publicDraftStorage';
import { buildPublicProposalMarkdown, downloadPublicProposal } from '../../../features/public-start/services/publicProposalExportService';

type ContinueState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'expired' }
  | { status: 'discarded' }
  | { status: 'ready'; draft: PublicDraft };

type AuthMode = 'register' | 'login';
type UseIntent = 'develop_initiative' | 'save_for_later' | 'present_to_someone' | 'use_with_team';

const PENDING_CONVERSION_KEY = 'starteria.publicStart.pendingConversion';

const INTENT_OPTIONS: Array<{ value: UseIntent; label: string }> = [
  { value: 'develop_initiative', label: 'Seguir desarrollándola' },
  { value: 'save_for_later', label: 'Guardarla para más tarde' },
  { value: 'present_to_someone', label: 'Presentarla a alguien' },
  { value: 'use_with_team', label: 'Usarla con mi equipo' },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Tu iniciativa queda guardada',
    description: 'Conserva el one-pager y el avance que ya construiste.',
  },
  {
    icon: Map,
    title: 'Guía paso a paso',
    description: 'Sigue desarrollándola con estructura, evidencia y criterio.',
  },
  {
    icon: FileDown,
    title: 'One-pager compartible',
    description: 'Prepara una versión clara para líder, sponsor o equipo.',
  },
];

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function savePendingConversion(draftId: string, intent: UseIntent) {
  window.sessionStorage.setItem(
    PENDING_CONVERSION_KEY,
    JSON.stringify({
      draftId,
      intent,
      createdAt: new Date().toISOString(),
      next: 'convert_to_project_step0',
    }),
  );
}

function formatAuthError(error: AuthError | undefined, fallback: string) {
  if (!error) return fallback;
  if (error.code === 'NETWORK_ERROR') return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  if (error.code === 'AUTH_INVALID_CREDENTIALS') return 'El correo o la contraseña no coinciden. Revisa los datos e intenta nuevamente.';
  return error.message || fallback;
}

function challengeTypeLabel(value: PublicDraft['aiOutput']['suggestedChallengeType']) {
  if (value === 'growth') return 'Crecimiento';
  if (value === 'exploration') return 'Exploración';
  return 'Corrección';
}

function valueOrPending(value: string | undefined, fallback = 'Pendiente por completar.') {
  return value?.trim() || fallback;
}

function EmptyContinueState({ title, description }: { title: string; description: string }) {
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <AlertCircle size={22} />
      </div>
      <h1 className="text-2xl text-slate-950" style={{ fontWeight: 850 }}>{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={() => navigate('/public/start')}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700"
        style={{ fontWeight: 850 }}
      >
        <ArrowLeft size={15} />
        Crear nueva propuesta
      </button>
    </section>
  );
}

export function ProgressiveSignupPage() {
  const { draftId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authLoading, isAuthenticated, login, register, user, createProjectFromPublicDraft } = useApp();
  const [state, setState] = useState<ContinueState>({ status: 'loading' });
  const [mode, setMode] = useState<AuthMode>('register');
  const [intent, setIntent] = useState<UseIntent>('develop_initiative');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(searchParams.get('ready') === '1');

  useEffect(() => {
    if (!draftId) {
      setState({ status: 'missing' });
      return;
    }
    const draft = getPublicDraft(draftId);
    if (!draft) {
      setState({ status: 'missing' });
      return;
    }
    if (draft.status === 'discarded') {
      setState({ status: 'discarded' });
      return;
    }
    if (isPublicDraftExpired(draft) || draft.status === 'expired') {
      setState({ status: 'expired' });
      return;
    }
    setState({ status: 'ready', draft });
  }, [draftId]);

  const draft = state.status === 'ready' ? state.draft : null;
  const canSubmit = useMemo(() => {
    if (loadingSubmit) return false;
    if (!validateEmail(email.trim())) return false;
    if (!password.trim()) return false;
    if (mode === 'register' && !name.trim()) return false;
    return true;
  }, [email, loadingSubmit, mode, name, password]);

  const markPending = () => {
    if (!draftId) return;
    savePendingConversion(draftId, intent);
    setSuccess(true);
  };

  const handleConvert = async () => {
    if (!draftId) return;
    setConversionError(null);

    const latestDraft = getPublicDraft(draftId);
    if (latestDraft?.status === 'converted' && latestDraft.convertedProjectId) {
      navigate(`/projects/${latestDraft.convertedProjectId}/step/0`);
      return;
    }

    markPending();
    setConversionLoading(true);
    try {
      const project = await createProjectFromPublicDraft(draftId);
      navigate(`/projects/${project.id}/step/0`);
    } catch {
      const convertedDraft = getPublicDraft(draftId);
      if (convertedDraft?.status === 'converted' && convertedDraft.convertedProjectId) {
        navigate(`/projects/${convertedDraft.convertedProjectId}/step/0`);
        return;
      }
      setConversionError('No pudimos guardar tu iniciativa. Intenta nuevamente.');
    } finally {
      setConversionLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    if (!validateEmail(email.trim())) {
      setFieldError('El correo no tiene un formato válido.');
      return;
    }
    if (!password.trim()) {
      setFieldError('La contraseña es requerida.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setFieldError('El nombre es requerido para crear tu cuenta.');
      return;
    }

    setLoadingSubmit(true);
    const result = mode === 'register'
      ? await register(name.trim(), email.trim(), password, { loadProjects: false })
      : await login(email.trim(), password, { loadProjects: false });
    setLoadingSubmit(false);

    if (!result.success) {
      setSubmitError(formatAuthError(result.error, mode === 'register' ? 'No pudimos crear tu cuenta.' : 'No pudimos iniciar sesión.'));
      return;
    }

    markPending();
    navigate(`/auth/continue/${draftId}?ready=1`, { replace: true });
  };

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(buildPublicProposalMarkdown(draft));
  };

  if (state.status === 'loading' || authLoading) {
    return <div className="p-6 text-sm text-slate-500">Cargando propuesta...</div>;
  }

  if (state.status === 'missing') {
    return <EmptyContinueState title="No encontramos esta propuesta." description="Puede que el borrador no exista en esta sesión o que se haya descartado." />;
  }

  if (state.status === 'expired') {
    return <EmptyContinueState title="Esta propuesta expiró." description="Las propuestas públicas son temporales. Crea una nueva para continuar con información no sensible." />;
  }

  if (state.status === 'discarded') {
    return <EmptyContinueState title="Esta propuesta fue descartada." description="Puedes crear una nueva propuesta cuando quieras volver a ordenar una idea." />;
  }

  if (draft?.status === 'converted') {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={22} />
        </div>
        <h1 className="text-2xl text-slate-950" style={{ fontWeight: 850 }}>Esta propuesta ya fue convertida.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">La iniciativa en borrador ya está lista en tu espacio de trabajo.</p>
        <button
          type="button"
          onClick={() => draft.convertedProjectId && navigate(`/projects/${draft.convertedProjectId}/step/0`)}
          disabled={!draft.convertedProjectId}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ fontWeight: 850 }}
        >
          Abrir iniciativa
          <ArrowRight size={15} />
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-[1500px] gap-6 px-3 py-4 lg:grid-cols-[minmax(360px,44fr)_minmax(0,56fr)] lg:px-5">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => draft && navigate(`/public/draft/${draft.id}/edit`)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          style={{ fontWeight: 750 }}
        >
          <ArrowLeft size={15} />
          Volver a la propuesta
        </button>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Lock size={22} />
          </div>
          <p className="text-xs uppercase text-indigo-600" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Guardar propuesta</p>
          <h1 className="mt-3 text-3xl text-slate-950 md:text-4xl" style={{ fontWeight: 900, lineHeight: 1.05 }}>
            Tu propuesta está lista. Guárdala para seguir avanzando
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Crea una cuenta para convertir este one-pager en una iniciativa editable, sumar evidencia y prepararla para presentar a un líder, sponsor o equipo.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {BENEFITS.map(benefit => (
            <div key={benefit.title} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <benefit.icon size={17} />
              </div>
              <h2 className="text-sm text-slate-950" style={{ fontWeight: 850 }}>{benefit.title}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{benefit.description}</p>
            </div>
          ))}
        </div>

        {success && isAuthenticated ? (
          <ReadyToConvertCard
            conversionError={conversionError}
            conversionLoading={conversionLoading}
            onConvert={handleConvert}
          />
        ) : isAuthenticated ? (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <h2 className="text-lg text-slate-950" style={{ fontWeight: 850 }}>Continuar con tu cuenta actual</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Estás usando la cuenta de {user?.name ?? 'Starteria'}. Guardaremos esta propuesta como iniciativa editable.
            </p>
            <IntentSelector intent={intent} onChange={setIntent} />
            {conversionError && <ErrorBox text={conversionError} />}
            <PrimaryConvertButton loading={conversionLoading} onClick={handleConvert} />
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              {(['register', 'login'] as const).map(nextMode => (
                <button
                  key={nextMode}
                  type="button"
                  onClick={() => {
                    setMode(nextMode);
                    setFieldError(null);
                    setSubmitError(null);
                  }}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${mode === nextMode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  style={{ fontWeight: 850 }}
                >
                  {nextMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' && <InputField label="Nombre" value={name} onChange={setName} placeholder="Ana Rodríguez" autoComplete="name" />}
              <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" autoComplete="email" />
              <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />

              {mode === 'register' && <IntentSelector intent={intent} onChange={setIntent} />}
              {(fieldError || submitError) && <ErrorBox text={fieldError ?? submitError ?? ''} />}

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ fontWeight: 900 }}
              >
                {loadingSubmit ? (mode === 'register' ? 'Creando cuenta...' : 'Iniciando sesión...') : mode === 'register' ? 'Crear cuenta y guardar iniciativa' : 'Iniciar sesión y guardar iniciativa'}
                <ArrowRight size={15} />
              </button>
              <p className="text-center text-xs leading-5 text-slate-500">
                Te llevaremos a tu espacio de trabajo con esta propuesta precargada.
              </p>
            </form>
          </div>
        )}
      </div>

      {draft && (
        <SignupOnePager
          draft={draft}
          onCopy={handleCopy}
          onDownload={() => downloadPublicProposal(draft)}
        />
      )}
    </section>
  );
}

function ReadyToConvertCard({
  conversionError,
  conversionLoading,
  onConvert,
}: {
  conversionError: string | null;
  conversionLoading: boolean;
  onConvert: () => void;
}) {
  return (
    <div className="rounded-[2rem] bg-emerald-50 p-6 shadow-sm ring-1 ring-emerald-200">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <h2 className="text-lg text-emerald-950" style={{ fontWeight: 850 }}>Cuenta lista. Ahora guarda tu iniciativa.</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-800">Tu propuesta está intacta y lista para pasar a tu espacio de trabajo.</p>
        </div>
      </div>
      {conversionError && <ErrorBox text={conversionError} />}
      <PrimaryConvertButton loading={conversionLoading} onClick={onConvert} />
    </div>
  );
}

function PrimaryConvertButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
        style={{ fontWeight: 900 }}
      >
        {loading ? 'Guardando tu iniciativa...' : 'Crear cuenta y guardar iniciativa'}
        <ArrowRight size={15} />
      </button>
      <p className="mt-2 text-center text-xs leading-5 text-slate-500">
        Te llevaremos a tu espacio de trabajo con esta propuesta precargada.
      </p>
    </>
  );
}

function IntentSelector({ intent, onChange }: { intent: UseIntent; onChange: (intent: UseIntent) => void }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm text-slate-700" style={{ fontWeight: 850 }}>¿Qué quieres hacer con esta propuesta?</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {INTENT_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
              intent === option.value ? 'border-indigo-300 bg-indigo-50 text-indigo-950' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            }`}
            style={{ fontWeight: 800 }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SignupOnePager({ draft, onCopy, onDownload }: { draft: PublicDraft; onCopy: () => void; onDownload: () => void }) {
  const output = draft.aiOutput;
  const supportAndDecision = [output.supportNeeded, output.decisionRequested].filter(Boolean).join(' ');

  return (
    <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white/85 p-2.5 shadow-sm ring-1 ring-slate-200/80">
        <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 850 }}>
          <Copy size={14} />
          Copiar resumen
        </button>
        <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50" style={{ fontWeight: 850 }}>
          <FileDown size={14} />
          Descargar PDF
        </button>
        <button
          type="button"
          title="Crea una cuenta para compartir un enlace seguro."
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-400"
          style={{ fontWeight: 850 }}
        >
          <Link2 size={14} />
          Compartir enlace seguro
        </button>
      </div>

      <article className="overflow-hidden rounded-[2.25rem] bg-white shadow-2xl shadow-slate-200/80 ring-1 ring-slate-200/80">
        <header className="relative overflow-hidden bg-slate-950 px-8 py-8 text-white">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-500/35 to-transparent" />
          <div className="relative">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase text-indigo-100" style={{ fontWeight: 900, letterSpacing: '0.12em' }}>
              PROPUESTA DE INICIATIVA
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl" style={{ fontWeight: 900, lineHeight: 1.04 }}>
              {output.proposalTitle || 'Propuesta de iniciativa'}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">
              {valueOrPending(output.whatToMove, 'Una base inicial para ordenar el problema, el impacto y la decisión necesaria.')}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-indigo-50">
              <span className="rounded-full bg-white/12 px-3 py-1.5">Tipo sugerido: {challengeTypeLabel(output.suggestedChallengeType)}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">Estado: preliminar</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">Claridad inicial</span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 p-6 xl:grid-cols-2">
          <PreviewPanel title="Resumen ejecutivo" value={output.whatToMove} />
          <PreviewPanel title="Insights Starteria" value={output.suggestedKpiOrSignal || output.nextRecommendedAction} />
          <PreviewPanel title="Qué quiere mover" value={output.whatToMove} />
          <PreviewPanel title="Por qué importa ahora" value={output.whyNow} />
          <PreviewPanel title="A quién impacta" value={output.impactedAudience} />
          <PreviewPanel title="Evidencia/señal" value={output.initialEvidence} fallback="Aún falta documentar evidencia o señales iniciales." />
          <PreviewPanel title="Apoyo necesario" value={supportAndDecision} />
          <PreviewPanel title="Siguiente paso" value={output.nextRecommendedAction} />
        </div>
        <footer className="border-t border-slate-200 px-6 py-4 text-xs text-slate-400">
          Propuesta preliminar · No validada aún
        </footer>
      </article>
    </aside>
  );
}

function PreviewPanel({ title, value, fallback }: { title: string; value?: string; fallback?: string }) {
  return (
    <section className="rounded-3xl bg-white/78 p-5 shadow-sm ring-1 ring-slate-200/80">
      <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{valueOrPending(value, fallback)}</p>
    </section>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{text}</div>;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700" style={{ fontWeight: 800 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}
