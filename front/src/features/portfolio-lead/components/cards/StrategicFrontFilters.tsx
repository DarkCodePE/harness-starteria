import React from 'react';

export interface StrategicFrontFilterOption {
  value: string;
  label: string;
}

export interface StrategicFrontFiltersValue {
  status: string;
  priority: string;
  sponsor: string;
  coverage: string;
  area: string;
}

export function StrategicFrontFilters({
  value,
  onChange,
  options,
}: {
  value: StrategicFrontFiltersValue;
  onChange: (next: StrategicFrontFiltersValue) => void;
  options: {
    statuses: StrategicFrontFilterOption[];
    priorities: StrategicFrontFilterOption[];
    sponsors: StrategicFrontFilterOption[];
    coverages: StrategicFrontFilterOption[];
    areas: StrategicFrontFilterOption[];
  };
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>FILTROS OPERATIVOS</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Filtra por foco, cobertura y responsables</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ajusta la vista para encontrar rapido los frentes que necesitan activacion, seguimiento o decision.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SelectField label="Estado" value={value.status} onChange={status => onChange({ ...value, status })} options={options.statuses} />
        <SelectField label="Prioridad" value={value.priority} onChange={priority => onChange({ ...value, priority })} options={options.priorities} />
        <SelectField label="Sponsor" value={value.sponsor} onChange={sponsor => onChange({ ...value, sponsor })} options={options.sponsors} />
        <SelectField label="Cobertura" value={value.coverage} onChange={coverage => onChange({ ...value, coverage })} options={options.coverages} />
        <SelectField label="Area" value={value.area} onChange={area => onChange({ ...value, area })} options={options.areas} />
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: StrategicFrontFilterOption[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-700" style={{ fontWeight: 600 }}>{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
