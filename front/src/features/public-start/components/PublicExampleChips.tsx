import React from 'react';

export const PUBLIC_START_EXAMPLES = [
  'Quiero reducir el tiempo de aprobación de solicitudes internas porque hoy se pierde seguimiento entre áreas y las personas no saben quién debe destrabar cada caso.',
  'Quiero aumentar ventas de un producto nuevo entendiendo qué segmento tiene más intención de compra y qué mensaje activa mejor una primera conversación comercial.',
  'Quiero mejorar la adopción del CRM comercial porque el equipo sigue registrando oportunidades en hojas sueltas y se pierde visibilidad del pipeline.',
  'Quiero automatizar reportes semanales en Excel para reducir horas operativas y evitar errores antes de las reuniones de seguimiento.',
  'Quiero validar demanda para un nuevo servicio B2B antes de invertir en desarrollo, usando entrevistas y señales tempranas de interés.',
  'Quiero disminuir reclamos por demoras de atención porque los clientes reportan poca claridad sobre tiempos y responsables.',
];

const EXAMPLE_LABELS = [
  'Reducir el tiempo de aprobación de solicitudes internas',
  'Aumentar ventas de un producto nuevo',
  'Mejorar adopción del CRM comercial',
  'Automatizar reportes semanales en Excel',
  'Validar demanda para un nuevo servicio B2B',
  'Disminuir reclamos por demoras de atención',
];

interface PublicExampleChipsProps {
  onSelect: (value: string) => void;
}

export function PublicExampleChips({ onSelect }: PublicExampleChipsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PUBLIC_START_EXAMPLES.map((example, index) => (
        <button
          key={example}
          type="button"
          onClick={() => onSelect(example)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          style={{ fontWeight: 650 }}
        >
          {EXAMPLE_LABELS[index]}
        </button>
      ))}
    </div>
  );
}
