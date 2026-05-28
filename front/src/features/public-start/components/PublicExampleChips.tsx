import React from 'react';

export const PUBLIC_START_EXAMPLES = [
  'Reducir tiempos de aprobación interna',
  'Aumentar ventas de un producto nuevo',
  'Mejorar adopción del CRM comercial',
  'Automatizar reportes semanales',
  'Validar demanda de un nuevo servicio B2B',
  'Disminuir reclamos por demoras de atención',
];

interface PublicExampleChipsProps {
  onSelect: (value: string) => void;
}

export function PublicExampleChips({ onSelect }: PublicExampleChipsProps) {
  return (
    <div className="px-1">
      <div className="flex flex-col gap-1 text-center sm:flex-row sm:items-baseline sm:justify-center sm:gap-3">
        <h2 className="text-sm text-slate-800" style={{ fontWeight: 800 }}>
          Ejemplos para arrancar
        </h2>
        <p className="text-xs leading-5 text-slate-500 sm:text-sm">
          Elige uno como base o escribe tu propia iniciativa.
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_START_EXAMPLES.map(example => (
          <button
            key={example}
            type="button"
            onClick={() => onSelect(example)}
            className="min-h-9 rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-center text-xs leading-4 text-slate-600 shadow-sm shadow-slate-200/30 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500/25 md:text-sm"
            style={{ fontWeight: 650 }}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
