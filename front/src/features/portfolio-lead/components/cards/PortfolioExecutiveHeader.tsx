import React from 'react';
import type { PortfolioHomeHeader } from '../../domain/types';

export function PortfolioExecutiveHeader({ header }: { header: PortfolioHomeHeader }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#fff4dc_0%,#ffffff_55%,#e9f1e8_100%)] p-6 md:p-8">
      <div className="max-w-4xl">
        <p className="text-xs text-amber-800" style={{ fontWeight: 700 }}>PORTFOLIO LEAD COMMAND CENTER</p>
        <h1 className="mt-2 text-3xl text-slate-950 md:text-4xl" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          {header.summaryLine}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          {header.supportingLine}
        </p>
      </div>
    </section>
  );
}
