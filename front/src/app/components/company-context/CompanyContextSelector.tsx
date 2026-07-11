import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Plus, X, AlertCircle } from 'lucide-react';
import {
  Company,
  CompanyArea,
  createCompany,
  listCompanies,
} from '../../services/companyService';

export interface SelectedCompanyContext {
  companyId: string;
  areaId?: string;
}

const employeeRanges = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '501-1000', label: '501-1,000' },
  { value: '1000+', label: 'Mas de 1,000' },
  { value: 'unknown', label: 'No lo se' },
];

function scoreLabel(company: Company): string {
  const version = company.versions?.[0];
  if (!version) return 'Contexto inicial 0%';
  const labels: Record<string, string> = {
    INITIAL: 'Contexto inicial',
    BASIC: 'Contexto basico',
    USEFUL: 'Contexto util',
    SOLID: 'Contexto solido',
  };
  return `${labels[version.contextLevel] ?? 'Contexto inicial'} ${version.contextScore}%`;
}

function scopeLabel(scope: Company['scope']): string {
  return scope === 'ORGANIZATION' ? 'Disponible para la organizacion' : 'Privado';
}

export function CompanyContextSelector({
  value,
  onChange,
}: {
  value: SelectedCompanyContext | null;
  onChange: (value: SelectedCompanyContext | null) => void;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    sector: '',
    country: '',
    employeeRange: 'unknown',
    websiteUrl: '',
    linkedinUrl: '',
    areaName: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCompanies()
      .then((items) => { if (!cancelled) setCompanies(items); })
      .catch(() => { if (!cancelled) setCompanies([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(
    () => companies.find((company) => company.id === value?.companyId) ?? null,
    [companies, value?.companyId],
  );
  const selectedArea = selected?.areas?.find((area) => area.id === value?.areaId) ?? null;
  const filtered = companies.filter((company) =>
    company.name.toLowerCase().includes(query.toLowerCase()) ||
    company.sector.toLowerCase().includes(query.toLowerCase()),
  );

  const create = async () => {
    if (!form.name.trim() || !form.sector.trim() || !form.country.trim()) {
      setError('Nombre, sector y pais son obligatorios.');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const company = await createCompany({
        name: form.name.trim(),
        sector: form.sector.trim(),
        country: form.country.trim(),
        employeeRange: form.employeeRange,
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        areaName: form.areaName.trim() || undefined,
      });
      setCompanies((prev) => [company, ...prev]);
      onChange({ companyId: company.id, areaId: company.areas?.[0]?.id });
      setOpen(false);
      setForm({ name: '', sector: '', country: '', employeeRange: 'unknown', websiteUrl: '', linkedinUrl: '', areaName: '' });
    } catch {
      setError('No pudimos crear la empresa. Revisa los datos e intenta nuevamente.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Contexto de empresa</p>
            {selected ? (
              <div className="mt-1 text-sm text-slate-600">
                <p className="font-medium text-slate-800">{selected.name} · {scoreLabel(selected)}</p>
                <p className="text-xs text-slate-500">{scopeLabel(selected.scope)}{selectedArea ? ` · Area: ${selectedArea.name}` : ''}</p>
              </div>
            ) : (
              <div className="mt-1 text-sm text-slate-600">
                <p>Ayuda a Starteria a considerar como funciona tu organizacion y sus restricciones.</p>
                <p className="mt-1 text-xs text-amber-700">Puedes continuar sin empresa. El analisis sera mas general.</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {selected && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Quitar empresa"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {selected ? 'Cambiar' : 'Agregar contexto de empresa'}
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar empresa"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-3 max-h-56 space-y-2 overflow-auto">
            {loading && <p className="text-sm text-slate-500">Cargando empresas...</p>}
            {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">No hay empresas guardadas.</p>}
            {filtered.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => {
                  onChange({ companyId: company.id, areaId: company.areas?.[0]?.id });
                  setOpen(false);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-indigo-200 hover:bg-indigo-50"
              >
                <p className="text-sm font-semibold text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500">{scopeLabel(company.scope)} · {scoreLabel(company)}</p>
              </button>
            ))}
          </div>

          {selected?.areas && selected.areas.length > 0 && (
            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Area opcional
              <select
                value={value?.areaId ?? ''}
                onChange={(event) => onChange(value?.companyId ? { companyId: value.companyId, areaId: event.target.value || undefined } : null)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700"
              >
                <option value="">Sin area</option>
                {selected.areas.map((area: CompanyArea) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </label>
          )}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Nueva empresa</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Pais principal" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.employeeRange} onChange={(e) => setForm({ ...form, employeeRange: e.target.value })}>
                {employeeRanges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Sitio web" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="LinkedIn" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Area del usuario" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} />
            </div>
            <p className="mt-2 flex gap-1 text-xs text-amber-700">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              No subas contrasenas, credenciales, datos personales innecesarios, secretos comerciales, informacion financiera no publica ni documentos que no tengas autorizacion para utilizar.
            </p>
            {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
            <button
              type="button"
              onClick={create}
              disabled={creating}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus size={15} />
              {creating ? 'Creando...' : 'Crear empresa y continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
