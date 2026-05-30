import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PUBLIC_START_COPY } from '../domain/copy';

export function PublicConfidentialityNotice() {
  return (
    <div className="mx-auto flex max-w-[980px] items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/45 px-3.5 py-2 text-xs text-amber-800">
      <ShieldCheck size={14} className="shrink-0" />
      <p className="leading-5">{PUBLIC_START_COPY.confidentialityNotice}</p>
    </div>
  );
}
