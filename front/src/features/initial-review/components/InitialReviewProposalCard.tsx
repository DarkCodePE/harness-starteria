import React from 'react';
import type { InitialReviewOutput } from '../domain/types';

export function InitialReviewProposalCard({
  proposal,
  onChange,
}: {
  proposal: InitialReviewOutput['improvedProposal'];
  onChange: (proposal: InitialReviewOutput['improvedProposal']) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base text-slate-900" style={{ fontWeight: 800 }}>Version mejorada de tu iniciativa</h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-800" style={{ fontWeight: 700 }}>Nombre sugerido</span>
          <input
            value={proposal.suggestedName}
            onChange={event => onChange({ ...proposal, suggestedName: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-800" style={{ fontWeight: 700 }}>Propuesta mejorada</span>
          <textarea
            rows={4}
            value={proposal.proposal}
            onChange={event => onChange({ ...proposal, proposal: event.target.value })}
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <Info label="Foco inicial" value={proposal.initialFocus} />
          <Info label="Impacto esperado" value={proposal.expectedImpact} />
          <Info label="Siguiente paso" value={proposal.nextRecommendedStep} />
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
