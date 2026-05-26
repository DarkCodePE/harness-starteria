import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { PublicProposalEditor } from '../../../features/public-start/components';
import type { PublicDraft } from '../../../features/public-start/domain/types';
import { getPublicDraft, isPublicDraftExpired } from '../../../features/public-start/services/publicDraftStorage';

type EditorPageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'expired' }
  | { status: 'ready'; draft: PublicDraft };

function EmptyDraftState({
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

export function PublicProposalEditorPage() {
  const { draftId } = useParams();
  const [state, setState] = useState<EditorPageState>({ status: 'loading' });

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
      <EmptyDraftState
        title="No encontramos esta propuesta."
        description="Puede que el borrador no exista en esta sesión o que se haya descartado."
      />
    );
  }

  if (state.status === 'expired') {
    return (
      <EmptyDraftState
        title="Esta propuesta expiró."
        description="Las propuestas públicas son temporales. Crea una nueva para seguir trabajando con información no sensible."
      />
    );
  }

  return <PublicProposalEditor initialDraft={state.draft} />;
}
