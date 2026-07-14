import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, CircleAlert, Plus, Search, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../ui/utils';
import {
  Company,
  CompanyArea,
  ContextScore,
  createArea,
  createCompany,
  getCompanyScore,
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

function scoreValue(company: Company): number {
  return company.versions?.[0]?.contextScore ?? 0;
}

function compactCompanyLabel(company: Company, area?: CompanyArea | null): string {
  return [company.name, area?.name, `${scoreValue(company)}% contexto`].filter(Boolean).join(' - ');
}

function scopeLabel(scope: Company['scope']): string {
  return scope === 'ORGANIZATION' ? 'Contexto organizacional' : 'Contexto personal';
}

function levelLabel(company: Company): string {
  const version = company.versions?.[0];
  const labels: Record<string, string> = {
    INITIAL: 'Contexto inicial',
    BASIC: 'Contexto basico',
    USEFUL: 'Contexto util',
    SOLID: 'Contexto solido',
  };
  return `${labels[version?.contextLevel ?? 'INITIAL'] ?? 'Contexto inicial'} - ${scoreValue(company)}%`;
}

function scoreLabel(score?: ContextScore | null, company?: Company | null): string {
  if (score) return `${score.label} - ${score.score}%`;
  if (!company) return 'Contexto inicial - 0%';
  return levelLabel(company);
}

function bandLabel(value: number, high: number, medium: number): string {
  if (value >= high) return 'alta';
  if (value >= medium) return 'media';
  return 'inicial';
}

function compactScoreExplanation(score: ContextScore): string {
  if (score.score >= 80) {
    return 'Representa alta confiabilidad contextual, pero si viene de fuentes automaticas todavia conviene confirmar cultura, estructura y reglas internas.';
  }
  if (score.score >= 60) {
    return 'Representa una base util para adaptar la revision, aunque todavia falta profundidad para decisiones especificas.';
  }
  if (score.score >= 30) {
    return 'Representa contexto inicial: sirve como referencia, pero la revision seguira siendo general si no agregas mas detalle.';
  }
  return 'Representa contexto insuficiente para adaptar bien la revision a esta empresa.';
}

function CompanyRow({
  company,
  selected,
  onSelect,
}: {
  company: Company;
  selected: boolean;
  onSelect: () => void;
}) {
  const recentArea = company.areas?.[0]?.name;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left outline-none transition hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500',
        selected && 'bg-indigo-50',
      )}
    >
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
        <Building2 size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900">{company.name}</span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {scopeLabel(company.scope)} - {levelLabel(company)}
        </span>
        {recentArea && <span aria-hidden="true" className="mt-0.5 block truncate text-xs text-slate-400">Area reciente: {recentArea}</span>}
      </span>
      {selected && <Check size={16} className="mt-1 shrink-0 text-indigo-600" aria-hidden="true" />}
    </button>
  );
}

export function CompanyContextSelector({
  value,
  onChange,
  onEmptySubmitMessage,
}: {
  value: SelectedCompanyContext | null;
  onChange: (value: SelectedCompanyContext | null) => void;
  onEmptySubmitMessage?: string | null;
}) {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingArea, setCreatingArea] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<ContextScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [form, setForm] = useState({
    name: '',
    sector: '',
    country: '',
    employeeRange: 'unknown',
    websiteUrl: '',
    linkedinUrl: '',
    areaName: '',
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setCompanies(await listCompanies());
    } catch {
      setCompanies([]);
      setError('No pudimos cargar tus empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listCompanies()
      .then((items) => { if (mounted) setCompanies(items); })
      .catch(() => { if (mounted) setError('No pudimos cargar tus empresas.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  const selected = useMemo(
    () => companies.find((company) => company.id === value?.companyId) ?? null,
    [companies, value?.companyId],
  );
  const selectedArea = selected?.areas?.find((area) => area.id === value?.areaId) ?? null;
  const filtered = companies.filter((company) => {
    const text = `${company.name} ${company.sector} ${company.country}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });
  const recent = filtered.slice(0, 3);
  const recentIds = new Set(recent.map((company) => company.id));
  const personal = filtered.filter((company) => company.scope === 'PERSONAL' && !recentIds.has(company.id));
  const organizational = filtered.filter((company) => company.scope === 'ORGANIZATION' && !recentIds.has(company.id));

  useEffect(() => {
    let mounted = true;
    if (!selected?.id) {
      setSelectedScore(null);
      setScoreLoading(false);
      return () => { mounted = false; };
    }
    setScoreLoading(true);
    getCompanyScore(selected.id)
      .then((score) => { if (mounted) setSelectedScore(score); })
      .catch(() => { if (mounted) setSelectedScore(null); })
      .finally(() => { if (mounted) setScoreLoading(false); });
    return () => { mounted = false; };
  }, [selected?.id]);

  const selectCompany = (company: Company) => {
    onChange({ companyId: company.id });
  };

  const submitCompany = async () => {
    if (!form.name.trim() || !form.sector.trim() || !form.country.trim()) {
      setError('Nombre, sector y pais son obligatorios.');
      return;
    }
    setCreating(true);
    setError(null);
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
      setCompanies((prev) => [company, ...prev.filter((item) => item.id !== company.id)]);
      onChange({ companyId: company.id, areaId: company.areas?.[0]?.id });
      setForm({ name: '', sector: '', country: '', employeeRange: 'unknown', websiteUrl: '', linkedinUrl: '', areaName: '' });
      setDialogOpen(false);
      setOpen(false);
    } catch {
      setError('No pudimos crear la empresa. Revisa los datos e intenta nuevamente.');
    } finally {
      setCreating(false);
    }
  };

  const submitArea = async () => {
    if (!selected || !areaName.trim()) return;
    setCreatingArea(true);
    setError(null);
    try {
      const area = await createArea(selected.id, { name: areaName.trim() });
      setCompanies((prev) => prev.map((company) => (
        company.id === selected.id ? { ...company, areas: [...(company.areas ?? []), area] } : company
      )));
      onChange({ companyId: selected.id, areaId: area.id });
      setAreaName('');
    } catch {
      setError('No pudimos crear el area.');
    } finally {
      setCreatingArea(false);
    }
  };

  const openCompanyDialog = () => {
    setError(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn(
                'inline-flex min-h-10 max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500',
                selected && 'border-indigo-200 bg-indigo-50 text-indigo-900',
              )}
            >
              <Building2 size={16} className="shrink-0 text-indigo-600" />
              <span className="truncate">{selected ? compactCompanyLabel(selected, selectedArea) : 'Empresa o contexto'}</span>
              <ChevronDown size={15} className="shrink-0 text-slate-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(92vw,440px)] p-0" onEscapeKeyDown={() => setOpen(false)}>
            <div className="border-b border-slate-100 p-3">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-indigo-500">
                <Search size={15} className="text-slate-400" />
                <span className="sr-only">Buscar empresas</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar empresas"
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {loading && <p className="px-3 py-6 text-center text-sm text-slate-500">Cargando empresas...</p>}
              {!loading && error && companies.length === 0 && (
                <div className="px-3 py-5 text-sm text-red-600" role="alert">
                  {error}
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={refresh}>Reintentar</Button>
                </div>
              )}
              {!loading && !error && companies.length === 0 && (
                <div className="px-4 py-7 text-center">
                  <p className="text-sm font-semibold text-slate-900">Aun no has registrado empresas</p>
                  <p className="mt-1 text-sm text-slate-500">Agrega contexto para obtener recomendaciones mas realistas y aplicables.</p>
                  <Button type="button" size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={openCompanyDialog}>
                    <Plus size={15} />
                    Agregar una empresa
                  </Button>
                </div>
              )}
              {!loading && companies.length > 0 && filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No encontramos empresas con esa busqueda.</p>
              )}

              {recent.length > 0 && (
                <section aria-label="Empresas recientes">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Empresas recientes</p>
                  <div className="space-y-1">
                    {recent.map((company) => (
                      <CompanyRow key={`recent-${company.id}`} company={company} selected={company.id === selected?.id} onSelect={() => selectCompany(company)} />
                    ))}
                  </div>
                </section>
              )}
              {personal.length > 0 && (
                <section aria-label="Empresas personales" className="mt-2 border-t border-slate-100 pt-2">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Empresas personales</p>
                  <div className="space-y-1">
                    {personal.map((company) => (
                      <CompanyRow key={`personal-${company.id}`} company={company} selected={company.id === selected?.id} onSelect={() => selectCompany(company)} />
                    ))}
                  </div>
                </section>
              )}
              {organizational.length > 0 && (
                <section aria-label="Contextos organizacionales disponibles" className="mt-2 border-t border-slate-100 pt-2">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contextos organizacionales disponibles</p>
                  <div className="space-y-1">
                    {organizational.map((company) => (
                      <CompanyRow key={`org-${company.id}`} company={company} selected={company.id === selected?.id} onSelect={() => selectCompany(company)} />
                    ))}
                  </div>
                </section>
              )}

              {selected && (
                <section className="mt-3 border-t border-slate-100 px-3 pt-3">
                  <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{scopeLabel(selected.scope)} - {scoreLabel(selectedScore, selected)}</p>
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-900">Que significa este porcentaje</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Estima la confiabilidad del contexto para adaptar la revision. No es avance del registro ni valida la iniciativa.
                    </p>
                    {scoreLoading && <p className="mt-2 text-xs text-slate-500">Calculando desglose...</p>}
                    {selectedScore && (
                      <>
                        <p className="mt-2 rounded-md bg-white p-2 text-xs text-slate-700">
                          {compactScoreExplanation(selectedScore)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Senales: cobertura {bandLabel(selectedScore.breakdown.coverage, 45, 25)}, respaldo {bandLabel(selectedScore.breakdown.evidence, 18, 9)} y actualizacion {bandLabel(selectedScore.breakdown.freshness, 12, 7)}.
                        </p>
                        {selectedScore.missing.length > 0 && (
                          <p className="mt-2 text-xs text-amber-700">
                            Por confirmar o profundizar: {selectedScore.missing.slice(0, 3).join(', ')}{selectedScore.missing.length > 3 ? '...' : ''}.
                          </p>
                        )}
                      </>
                    )}
                    <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/companies')}>
                      <Settings2 size={14} />
                      Completar contexto
                    </Button>
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Area opcional</p>
                  <div className="mt-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => onChange({ companyId: selected.id })}
                      className={cn('flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500', !value?.areaId && 'bg-indigo-50 text-indigo-900')}
                    >
                      Sin area especifica
                      {!value?.areaId && <Check size={15} />}
                    </button>
                    {(selected.areas ?? []).map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => onChange({ companyId: selected.id, areaId: area.id })}
                        className={cn('flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500', value?.areaId === area.id && 'bg-indigo-50 text-indigo-900')}
                      >
                        {area.name}
                        {value?.areaId === area.id && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={areaName}
                      onChange={(event) => setAreaName(event.target.value)}
                      placeholder="Agregar area"
                      className="h-9 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={submitArea} disabled={!areaName.trim() || creatingArea}>
                      {creatingArea ? '...' : 'Agregar'}
                    </Button>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-2 px-2 text-slate-600" onClick={() => onChange(null)}>
                    Cambiar empresa
                  </Button>
                </section>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" size="sm" onClick={openCompanyDialog}>
                <Plus size={15} />
                Agregar una empresa
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/companies')}>
                <Settings2 size={15} />
                Administrar empresas
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {onEmptySubmitMessage && (
          <p className="mt-2 text-xs text-slate-500" role="status">{onEmptySubmitMessage}</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar una empresa</DialogTitle>
            <DialogDescription>
              Crea un contexto inicial. Si agregas sitio web o LinkedIn, Starteria iniciara el procesamiento automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input aria-label="Nombre de empresa" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input aria-label="Sector" placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            <Input aria-label="Pais principal" placeholder="Pais principal" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Tamaño de empresa
              <select
                aria-label="Tamaño de empresa"
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={form.employeeRange}
                onChange={(e) => setForm({ ...form, employeeRange: e.target.value })}
              >
                {employeeRanges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <Input aria-label="Sitio web" placeholder="Sitio web" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            <Input aria-label="LinkedIn" placeholder="LinkedIn" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
            <Input aria-label="Area del usuario" className="md:col-span-2" placeholder="Area del usuario" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} />
          </div>
          <p className="flex gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <CircleAlert size={14} className="mt-0.5 shrink-0 text-slate-500" />
            No incluyas contrasenas, credenciales, datos personales innecesarios ni documentos sin autorizacion.
          </p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="button" className="bg-indigo-600 hover:bg-indigo-700" onClick={submitCompany} disabled={creating}>
              {creating ? 'Creando...' : 'Agregar una empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
