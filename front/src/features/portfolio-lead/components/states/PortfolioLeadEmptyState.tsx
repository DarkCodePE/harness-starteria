import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../../../../app/components/ui/badge';

export function PortfolioLeadEmptyState({
  eyebrow,
  title,
  description,
  steps,
  primaryAction,
  secondaryAction,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  steps?: string[];
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick?: () => void; disabled?: boolean; helper?: string };
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-[#faf8f2] px-6 py-6 md:px-7 md:py-7">
      {eyebrow ? (
        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
          {eyebrow}
        </Badge>
      ) : null}
      <p className="mt-3 text-lg text-slate-900" style={{ fontWeight: 700 }}>{title}</p>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>

      {steps?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {steps.map(step => (
            <Badge key={step} variant="outline" className="border-slate-200 bg-white text-slate-700">
              {step}
            </Badge>
          ))}
        </div>
      ) : null}

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
            disabled={secondaryAction.disabled}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontWeight: 600 }}
          >
            {secondaryAction.label}
            {secondaryAction.disabled ? null : <ArrowRight size={14} />}
          </button>
        ) : null}
      </div>

      {secondaryAction?.helper ? (
        <p className="mt-2 text-xs text-slate-500">{secondaryAction.helper}</p>
      ) : null}
    </div>
  );
}
