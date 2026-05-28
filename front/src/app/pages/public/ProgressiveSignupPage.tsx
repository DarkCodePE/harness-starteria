import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileDown,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AuthError } from '../../services/api';
import type { PublicDraft } from '../../../features/public-start/domain/types';
import { getPublicDraft, isPublicDraftExpired } from '../../../features/public-start/services/publicDraftStorage';
import { downloadPublicProposal } from '../../../features/public-start/services/publicProposalExportService';
import { inferPublicDraftNarrative } from '../../../features/public-start/services/publicDraftService';

type ContinueState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'expired' }
  | { status: 'discarded' }
  | { status: 'ready'; draft: PublicDraft };

const PENDING_CONVERSION_KEY = 'starteria.publicStart.pendingConversion';

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function savePendingConversion(draftId: string) {
  window.sessionStorage.setItem(
    PENDING_CONVERSION_KEY,
    JSON.stringify({
      draftId,
      intent: 'develop_initiative',
      createdAt: new Date().toISOString(),
      next: 'convert_to_guided_initiative',
    }),
  );
}

function formatAuthError(error: AuthError | undefined, fallback: string) {
  if (!error) return fallback;
  if (error.code === 'NETWORK_ERROR') return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  return error.message || fallback;
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
  const { authLoading, isAuthenticated, register, createProjectFromPublicDraft } = useApp();
  const [state, setState] = useState<ContinueState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accessRequested, setAccessRequested] = useState(false);
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
  const temporaryPassword = useMemo(() => `Starteria-${draftId ?? 'public'}-${Math.random().toString(36).slice(2, 8)}`, [draftId]);
  const canSubmit = !loadingSubmit && Boolean(name.trim()) && validateEmail(email.trim());

  const markPending = () => {
    if (!draftId) return;
    savePendingConversion(draftId);
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

    if (!name.trim()) {
      setFieldError('Escribe tu nombre para crear la cuenta.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setFieldError('El correo no tiene un formato válido.');
      return;
    }

    setLoadingSubmit(true);
    const result = await register(name.trim(), email.trim(), temporaryPassword, { loadProjects: false });
    setLoadingSubmit(false);

    if (!result.success) {
      setSubmitError(formatAuthError(result.error, 'No pudimos crear tu cuenta.'));
      return;
    }

    markPending();
    navigate(`/auth/continue/${draftId}?ready=1`, { replace: true });
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
    <section className="mx-auto grid max-w-[1180px] gap-6 px-3 py-4 lg:grid-cols-[minmax(420px,1.15fr)_minmax(320px,0.85fr)] lg:px-5">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/80 md:p-8">
        <button
          type="button"
          onClick={() => draft && navigate(`/public/draft/${draft.id}/edit`)}
          className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          style={{ fontWeight: 750 }}
        >
          <ArrowLeft size={15} />
          Volver a la propuesta
        </button>

        <p className="text-xs uppercase text-indigo-600" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Guardar y continuar</p>
        <h1 className="mt-3 text-3xl text-slate-950 md:text-4xl" style={{ fontWeight: 900, lineHeight: 1.05 }}>
          Tu propuesta inicial está lista.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Crea tu cuenta para convertirla en una iniciativa guiada con IA, evidencia, mentoría y próximos pasos claros.
        </p>

        {success && isAuthenticated ? (
          <div className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <h2 className="text-lg text-emerald-950" style={{ fontWeight: 850 }}>Cuenta creada. Guarda tu iniciativa.</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-800">Tu propuesta está intacta y lista para pasar a Starteria.</p>
              </div>
            </div>
            {conversionError && <ErrorBox text={conversionError} />}
            <button
              type="button"
              onClick={handleConvert}
              disabled={conversionLoading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontWeight: 900 }}
            >
              {conversionLoading ? <Loader2 size={15} className="animate-spin" /> : null}
              Convertir en iniciativa y seguir en Starteria
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <InputField label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" autoComplete="name" />
            <InputField label="Correo" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" autoComplete="email" />
            {(fieldError || submitError) && <ErrorBox text={fieldError ?? submitError ?? ''} />}
            {accessRequested && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Solicitud recibida. Te contactaremos para habilitar el acceso a Starteria.
              </div>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontWeight: 900 }}
            >
              {loadingSubmit ? 'Creando cuenta...' : 'Crear cuenta y continuar'}
              <ArrowRight size={15} />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">o</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <button
              type="button"
              onClick={() => setAccessRequested(true)}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              style={{ fontWeight: 850 }}
            >
              Solicitar acceso a Starteria
            </button>
          </form>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Checklist
            title="Ya tienes:"
            items={[
              'Una propuesta preliminar ordenada',
              'Un primer foco de trabajo',
              'Próximos puntos por validar',
            ]}
          />
          <Checklist
            title="Después podrás:"
            items={[
              'Profundizar evidencia',
              'Ordenar responsables y decisiones',
              'Preparar una versión para tu líder o equipo',
            ]}
          />
        </div>
      </div>

      {draft && (
        <CompactOnePager
          draft={draft}
          onOpen={() => navigate(`/public/draft/${draft.id}/edit`)}
          onDownload={() => downloadPublicProposal(draft)}
        />
      )}
    </section>
  );
}

function CompactOnePager({ draft, onOpen, onDownload }: { draft: PublicDraft; onOpen: () => void; onDownload: () => void }) {
  const narrative = inferPublicDraftNarrative(draft.inputText, draft.aiOutput);

  return (
    <aside className="self-start rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/80 lg:sticky lg:top-4">
      <p className="text-xs uppercase text-slate-400" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Preview compacto del one-pager</p>
      <div className="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-indigo-950 p-5 text-white">
        <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase text-indigo-100" style={{ fontWeight: 900, letterSpacing: '0.1em' }}>
          Propuesta preliminar
        </p>
        <h2 className="mt-4 text-2xl" style={{ fontWeight: 900, lineHeight: 1.08 }}>{narrative.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-200">{narrative.subtitle}</p>
      </div>
      <div className="mt-4 grid gap-3">
        <PreviewLine label="Foco" value={narrative.focus} />
        <PreviewLine label="Primer paso" value={narrative.nextStep} />
        <PreviewLine label="Por validar" value={narrative.validationItems.slice(0, 2).join(' · ')} />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          style={{ fontWeight: 850 }}
        >
          Ver propuesta completa
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800"
          style={{ fontWeight: 850 }}
        >
          <FileDown size={15} />
          Descargar PDF
        </button>
      </div>
    </aside>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-400" style={{ fontWeight: 850 }}>{label}</p>
      <p className="mt-1 text-sm leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-sm text-slate-950" style={{ fontWeight: 900 }}>{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map(item => (
          <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{text}</div>;
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
