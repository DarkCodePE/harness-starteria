import React from 'react';
import { BriefcaseBusiness, FolderKanban, ShieldCheck, Target } from 'lucide-react';
import type { PortfolioHomeSummaryCard } from '../../domain/types';

const ICONS = {
  fronts: Target,
  challenges: BriefcaseBusiness,
  blockers: FolderKanban,
  decisions: ShieldCheck,
  activation: BriefcaseBusiness,
} as const;

const TONE_CLASSES: Record<PortfolioHomeSummaryCard['tone'], string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  rose: 'border-rose-200 bg-rose-50 text-rose-900',
  violet: 'border-violet-200 bg-violet-50 text-violet-900',
  sky: 'border-sky-200 bg-sky-50 text-sky-900',
  slate: 'border-slate-200 bg-white text-slate-900',
};

export function PortfolioSummaryCards({
  items,
}: {
  items: PortfolioHomeSummaryCard[];
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(item => {
        const Icon = ICONS[item.icon];
        return (
          <article key={item.id} className={`rounded-[22px] border p-4 ${TONE_CLASSES[item.tone]}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-black/5">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{item.label}</p>
                <p className="mt-1 text-2xl text-slate-950" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>{item.value}</p>
                <p className="mt-2 text-xs text-slate-500">{item.microcopy}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
