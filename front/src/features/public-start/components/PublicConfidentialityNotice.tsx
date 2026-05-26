import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PUBLIC_START_COPY } from '../domain/copy';

export function PublicConfidentialityNotice() {
  return (
    <div className="mx-auto flex max-w-4xl items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-800">
      <ShieldCheck size={15} className="mt-0.5 shrink-0" />
      <p className="leading-5">{PUBLIC_START_COPY.confidentialityNotice}</p>
    </div>
  );
}
