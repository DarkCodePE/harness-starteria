import React from 'react';

export function PortfolioLeadEmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-[#faf8f2] px-6 py-10">
      <p className="text-lg text-slate-900" style={{ fontWeight: 700 }}>{title}</p>
      <p className="mt-3 max-w-2xl text-sm text-slate-600">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={primaryAction.onClick}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white"
          style={{ fontWeight: 600 }}
        >
          {primaryAction.label}
        </button>
        {secondaryAction ? (
          <button
            onClick={secondaryAction.onClick}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            style={{ fontWeight: 600 }}
          >
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
