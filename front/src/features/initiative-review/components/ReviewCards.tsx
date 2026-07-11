import React from 'react';
import type { ReviewSnapshot, CanonicalChallengeType } from '../services/initiativeReviewClient';

const CHALLENGE_LABEL: Record<CanonicalChallengeType, { label: string; hint: string }> = {
  correction: { label: 'Corrección', hint: 'Reducir una fricción o ineficiencia existente.' },
  growth: { label: 'Crecimiento', hint: 'Capturar una oportunidad de negocio o adopción.' },
  exploration: { label: 'Exploración', hint: 'Reducir incertidumbre antes de decidir avanzar.' },
};

function Card({ title, testid, children }: { title: string; testid: string; children: React.ReactNode }) {
  return (
    <section data-testid={testid} className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

export function UnderstandingSummaryCard({ snapshot }: { snapshot: ReviewSnapshot }) {
  return (
    <Card title="Lo que Starteria entendió" testid="card-understanding">
      <p>{snapshot.understandingSummary}</p>
    </Card>
  );
}

export function ChallengeTypeCard({ snapshot }: { snapshot: ReviewSnapshot }) {
  const t = CHALLENGE_LABEL[snapshot.suggestedChallengeType] ?? { label: snapshot.suggestedChallengeType, hint: '' };
  return (
    <Card title="Tipo de reto sugerido" testid="card-challenge-type">
      <p className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">{t.label}</span>
        <span className="text-slate-500">{t.hint}</span>
      </p>
      {snapshot.challengeTypeReason && <p className="mt-2 text-slate-600">{snapshot.challengeTypeReason}</p>}
    </Card>
  );
}

export function CritiqueCard({ snapshot }: { snapshot: ReviewSnapshot }) {
  const c = snapshot.critique;
  const rows: Array<[string, string | undefined]> = [
    ['Lo sólido', c.solid],
    ['Lo débil', c.weak],
    ['Lo riesgoso', c.risky],
    ['Conviene ajustar', c.recommendedAdjustment],
  ];
  return (
    <Card title="Mirada crítica" testid="card-critique">
      <dl className="grid gap-2">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-semibold text-slate-500">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function QuestionsCard({
  snapshot,
  answeringQuestionId,
  onAnswer,
}: {
  snapshot: ReviewSnapshot;
  answeringQuestionId?: string | null;
  onAnswer?: (questionId: string, answer: string, unknown?: boolean) => void;
}) {
  return (
    <Card title="Preguntas estratégicas" testid="card-questions">
      <ul className="grid gap-3">
        {snapshot.strategicQuestions.slice(0, 3).map((q) => (
          <li key={q.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">{q.question}</p>
            {q.status === 'answered' && q.answer && <p className="mt-1 text-xs text-emerald-700">Respondida: {q.answer}</p>}
            {q.status === 'unknown' && <p className="mt-1 text-xs text-amber-700">Marcada como "No lo sé aún".</p>}
            {onAnswer && q.status !== 'answered' && q.status !== 'unknown' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.slice(0, 6).map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={answeringQuestionId === q.id}
                    onClick={() => onAnswer(q.id, option)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
                {q.allowsUnknown && (
                  <button
                    type="button"
                    disabled={answeringQuestionId === q.id}
                    onClick={() => onAnswer(q.id, 'No lo sé aún', true)}
                    className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    No lo sé aún
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ImprovedProposalCard({ snapshot }: { snapshot: ReviewSnapshot }) {
  const p = snapshot.improvedProposal;
  return (
    <Card title="Versión mejorada de tu iniciativa" testid="card-proposal">
      <p className="font-medium text-slate-900">{p.suggestedName}</p>
      {p.improvedDescription && <p className="mt-1">{p.improvedDescription}</p>}
      {p.expectedImpact && <p className="mt-1 text-slate-600"><span className="font-medium">Impacto esperado:</span> {p.expectedImpact}</p>}
    </Card>
  );
}

export function RoutePreviewCard({ snapshot }: { snapshot: ReviewSnapshot }) {
  return (
    <Card title="Ruta recomendada Step 0-4" testid="card-route">
      <ol className="grid gap-1">
        {snapshot.routePreview.map((r) => (
          <li key={r.step} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p><span className="font-medium">Step {r.step}</span> - {r.name}</p>
            <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Qué pasará:</span> {r.whatWillHappen}</p>
            <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Output esperado:</span> {r.expectedOutput}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
