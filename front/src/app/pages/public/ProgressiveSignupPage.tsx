import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileDown,
  Loader2,
} from 'lucide-react';
import type { PublicDraft } from '../../../features/public-start/domain/types';
import { getPublicDraft, isPublicDraftExpired } from '../../../features/public-start/services/publicDraftStorage';
import { inferPublicDraftNarrative } from '../../../features/public-start/services/publicDraftService';
import { downloadPublicProposal } from '../../../features/public-start/services/publicProposalExportService';
import {
  getPilotInterestByDraftId,
  submitPilotInterest,
  trackPilotInterestEvent,
  type PublicPilotLead,
} from '../../../features/public-start/services/publicPilotLeadService';

type ContinueState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'expired' }
  | { status: 'discarded' }
  | { status: 'ready'; draft: PublicDraft };

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  const navigate = useNavigate();
  const startedTrackedRef = useRef(false);
  const [state, setState] = useState<ContinueState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<PublicPilotLead | null>(null);

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

    const existingLead = getPilotInterestByDraftId(draftId);
    if (existingLead) setSubmittedLead(existingLead);
    setState({ status: 'ready', draft });
  }, [draftId]);

  useEffect(() => {
    if (state.status === 'ready' && !startedTrackedRef.current) {
      startedTrackedRef.current = true;
      trackPilotInterestEvent('pilot_interest_started', { draftId: state.draft.id });
    }
  }, [state]);

  const draft = state.status === 'ready' ? state.draft : null;
  const canSubmit = !loadingSubmit && Boolean(name.trim()) && validateEmail(email.trim()) && consentAccepted;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    if (!draftId) return;
    if (!name.trim()) {
      setFieldError('Escribe tu nombre para postular la iniciativa.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setFieldError('El correo no tiene un formato válido.');
      return;
    }
    if (!consentAccepted) {
      setFieldError('Necesitamos tu consentimiento para contactarte sobre el primer piloto.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const lead = await submitPilotInterest(draftId, {
        name,
        email,
        phone,
        organization,
        consentAccepted,
      });
      setSubmittedLead(lead);
      const updatedDraft = getPublicDraft(draftId);
      if (updatedDraft) setState({ status: 'ready', draft: updatedDraft });
      trackPilotInterestEvent('pilot_interest_submitted', { draftId, leadId: lead.id });
    } catch (error) {
      setSubmitError('No pudimos registrar tu postulación. Intenta nuevamente.');
      trackPilotInterestEvent('pilot_interest_failed', {
        draftId,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (state.status === 'loading') {
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

        <p className="text-xs uppercase text-indigo-600" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Postulación al piloto</p>
        <h1 className="mt-3 text-3xl text-slate-950 md:text-4xl" style={{ fontWeight: 900, lineHeight: 1.05 }}>
          Tu propuesta inicial está lista.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Postúlala al primer piloto de Starteria y te avisaremos cuando puedas trabajarla con IA, mentoría y próximos pasos claros.
        </p>

        {submittedLead ? (
          <SuccessState lead={submittedLead} />
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <InputField label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" autoComplete="name" required />
            <InputField label="Correo" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" autoComplete="email" required />
            <InputField label="Celular / WhatsApp" type="tel" value={phone} onChange={setPhone} placeholder="+51 999 999 999" autoComplete="tel" />
            <InputField label="Organización" value={organization} onChange={setOrganization} placeholder="Empresa, equipo o institución" autoComplete="organization" />

            <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={event => setConsentAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span style={{ fontWeight: 650 }}>Acepto que Starteria me contacte sobre el primer piloto.</span>
            </label>

            {(fieldError || submitError) && <ErrorBox text={fieldError ?? submitError ?? ''} />}
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontWeight: 900 }}
            >
              {loadingSubmit ? <Loader2 size={15} className="animate-spin" /> : null}
              {loadingSubmit ? 'Registrando postulación...' : 'Postular iniciativa al piloto'}
              <ArrowRight size={15} />
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

function SuccessState({ lead }: { lead: PublicPilotLead }) {
  return (
    <div className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <h2 className="text-lg text-emerald-950" style={{ fontWeight: 850 }}>Listo, tu propuesta quedó registrada para el piloto.</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            Te enviaremos una confirmación a {lead.email}. Cuando abramos cupos, te avisaremos para continuar tu iniciativa dentro de Starteria.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
        <p className="text-xs uppercase text-emerald-700" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>Código de postulación</p>
        <p className="mt-1 text-xl text-emerald-950" style={{ fontWeight: 900 }}>{lead.id}</p>
      </div>
    </div>
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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700" style={{ fontWeight: 800 }}>
        {label}
        {required ? <span className="text-indigo-600"> *</span> : null}
      </span>
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
