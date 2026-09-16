import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Edit3, Save, Trash2 } from 'lucide-react';
import { PUBLIC_START_COPY } from '../../../features/public-start/domain/copy';
import type { PublicDraft } from '../../../features/public-start/domain/types';
import { discardDraft } from '../../../features/public-start/services/publicDraftService';
import { getPublicDraft, isPublicDraftExpired } from '../../../features/public-start/services/publicDraftStorage';
import { downloadPublicProposal } from '../../../features/public-start/services/publicProposalExportService';

type ResultState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'expired' }
  | { status: 'discarded' }
  | { status: 'ready'; draft: PublicDraft };

function challengeTypeLabel(value: PublicDraft['aiOutput']['suggestedChallengeType']) {
  switch (value) {
    case 'growth':
      return 'Crecimiento';
    case 'exploration':
      return 'Exploración';
    case 'correction':
    default:
      return 'Corrección';
  }
}

function FieldValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value?.trim() || 'Pendiente por completar.'}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map(item => (
          <li key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyResultState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <AlertCircle size={22} />
      </div>
      <h1 className="text-2xl text-slate-950" style={{ fontWeight: 800 }}>{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={() => navigate('/public/start')}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700"
        style={{ fontWeight: 800 }}
      >
        <ArrowLeft size={15} />
        Crear nueva propuesta
      </button>
    </section>
  );
}

export function PublicProposalResultPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState>({ status: 'loading' });

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

  if (state.status === 'loading') {
    return <div className="p-6 text-sm text-slate-500">Cargando propuesta...</div>;
  }

  if (state.status === 'missing') {
    return (
      <EmptyResultState
        title="No encontramos esta propuesta."
        description="Puede que el borrador no exista en esta sesión o que se haya descartado."
      />
    );
  }

  if (state.status === 'expired') {
    return (
      <EmptyResultState
        title="Esta propuesta expiró."
        description="Las propuestas públicas son temporales. Crea una nueva para seguir trabajando con información no sensible."
      />
    );
  }

  if (state.status === 'discarded') {
    return (
      <EmptyResultState
        title="Esta propuesta fue descartada."
        description="Puedes crear una nueva propuesta cuando quieras volver a ordenar una idea."
      />
    );
  }

  const { draft } = state;
  const output = draft.aiOutput;
  const supportAndDecision = [output.supportNeeded, output.decisionRequested].filter(Boolean).join(' ');
  const hasMissing = output.missingCriticalFields.length > 0 || output.risks.length > 0;

  const handleDiscard = () => {
    discardDraft(draft.id);
    navigate('/public/start');
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={22} />
        </div>
        <p className="text-xs uppercase text-emerald-600" style={{ fontWeight: 800, letterSpacing: '0.08em' }}>
          Propuesta lista
        </p>
        <h1 className="mt-3 text-3xl text-slate-950 md:text-4xl" style={{ fontWeight: 820 }}>
          Tu propuesta de iniciativa está lista
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Ya tienes una base inicial para presentarla, pedir feedback o seguir desarrollándola en Starteria.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(`/auth/continue/${draft.id}`)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700"
            style={{ fontWeight: 800 }}
          >
            <Save size={15} />
            {PUBLIC_START_COPY.saveAndContinueStep0}
          </button>
          <button
            type="button"
            onClick={() => downloadPublicProposal(draft)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            style={{ fontWeight: 750 }}
          >
            <Download size={15} />
            Descargar propuesta
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg text-slate-950" style={{ fontWeight: 800 }}>Lo que ya tienes</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <FieldValue label="Qué quieres mover" value={output.whatToMove} />
              <FieldValue label="A quién impacta" value={output.impactedAudience} />
              <FieldValue label="Por qué importa ahora" value={output.whyNow} />
              <FieldValue label="Qué respaldo inicial existe" value={output.initialEvidence} />
              <FieldValue label="Qué decisión o apoyo necesitas" value={supportAndDecision} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg text-slate-950" style={{ fontWeight: 800 }}>Propuesta estructurada</h2>
            <h3 className="mt-4 text-2xl text-slate-950" style={{ fontWeight: 820 }}>
              {output.proposalTitle || 'Propuesta de iniciativa'}
            </h3>
            <div className="mt-5 grid gap-3">
              <FieldValue label="Qué quiere mover" value={output.whatToMove} />
              <FieldValue label="Por qué importa ahora" value={output.whyNow} />
              <FieldValue label="A quién impacta" value={output.impactedAudience} />
              <FieldValue label="Evidencia o respaldo inicial" value={output.initialEvidence} />
              <FieldValue label="Stakeholder sugerido" value={output.suggestedStakeholder} />
              <FieldValue label="Apoyo o decisión requerida" value={supportAndDecision} />
              <FieldValue label="Tipo de reto sugerido" value={challengeTypeLabel(output.suggestedChallengeType)} />
              <FieldValue label="KPI o señal sugerida" value={output.suggestedKpiOrSignal} />
              <FieldValue label="Siguiente paso recomendado" value={output.nextRecommendedAction} />
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base text-slate-950" style={{ fontWeight: 800 }}>Faltantes recomendados</h2>
            {hasMissing ? (
              <div className="mt-5 space-y-5">
                <ListBlock title="Faltantes detectados" items={output.missingCriticalFields} />
                <ListBlock title="Riesgos o supuestos" items={output.risks} />
                <div>
                  <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>Siguiente acción</p>
                  <p className="mt-2 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-sm leading-6 text-indigo-800">
                    {output.nextRecommendedAction}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                Tu propuesta tiene una base suficiente para continuar al Step 0. Allí podrás completar evidencia, contexto y card compartible.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => navigate(`/public/draft/${draft.id}/edit`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                style={{ fontWeight: 750 }}
              >
                <Edit3 size={15} />
                Seguir editando
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 transition-colors hover:bg-red-100"
                style={{ fontWeight: 750 }}
              >
                <Trash2 size={15} />
                Descartar propuesta
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
