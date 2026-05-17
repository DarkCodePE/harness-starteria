import React from 'react';

export function ChallengeActivationMessageDraft({
  value,
  onChange,
  onGenerate,
}: {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Mensaje editable de activacion</p>
          <p className="mt-2 text-sm text-slate-600">Usa este borrador para invitar, alinear o activar a las personas correctas segun la modalidad elegida.</p>
        </div>
        <button onClick={onGenerate} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-100" style={{ fontWeight: 700 }}>
          Regenerar borrador
        </button>
      </div>

      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={10}
        className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}
