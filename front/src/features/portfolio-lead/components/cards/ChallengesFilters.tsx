import React from 'react';

export interface ChallengesFilterOption {
  value: string;
  label: string;
}

export interface ChallengesFiltersValue {
  frontId: string;
  status: string;
  challengeType: string;
  activationMode: string;
  coverage: string;
  urgency: string;
  challengeOwner: string;
}

export function ChallengesFilters({
  value,
  onChange,
  options,
}: {
  value: ChallengesFiltersValue;
  onChange: (next: ChallengesFiltersValue) => void;
  options: {
    fronts: ChallengesFilterOption[];
    statuses: ChallengesFilterOption[];
    types: ChallengesFilterOption[];
    activationModes: ChallengesFilterOption[];
    coverages: ChallengesFilterOption[];
    urgencies: ChallengesFilterOption[];
    challengeOwners: ChallengesFilterOption[];
  };
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>FILTROS OPERATIVOS</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Filtra por frente, activacion y cobertura</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ajusta la vista para encontrar rapido los retos que necesitan activacion, seguimiento o una definicion.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField label="Frente" value={value.frontId} onChange={frontId => onChange({ ...value, frontId })} options={options.fronts} />
        <SelectField label="Estado" value={value.status} onChange={status => onChange({ ...value, status })} options={options.statuses} />
        <SelectField label="Tipo de reto" value={value.challengeType} onChange={challengeType => onChange({ ...value, challengeType })} options={options.types} />
        <SelectField label="Modalidad de activacion" value={value.activationMode} onChange={activationMode => onChange({ ...value, activationMode })} options={options.activationModes} />
        <SelectField label="Cobertura" value={value.coverage} onChange={coverage => onChange({ ...value, coverage })} options={options.coverages} />
        <SelectField label="Urgencia" value={value.urgency} onChange={urgency => onChange({ ...value, urgency })} options={options.urgencies} />
        <SelectField label="Challenge owner" value={value.challengeOwner} onChange={challengeOwner => onChange({ ...value, challengeOwner })} options={options.challengeOwners} />
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
  options: ChallengesFilterOption[];
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
