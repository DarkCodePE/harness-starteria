import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  { value: '1000+', label: 'Más de 1,000' },
  { value: 'unknown', label: 'No lo sé' },
];

function scopeLabel(scope: Company['scope']): string {
  return scope === 'ORGANIZATION' ? 'Contexto organizacional' : 'Contexto personal';
}

function contextLevelLabel(level: ContextScore['level']): string {
  const labels: Record<ContextScore['level'], string> = {
    INITIAL: 'Contexto inicial',
    BASIC: 'Contexto básico',
    USEFUL: 'Contexto útil',
    SOLID: 'Contexto sólido',
  };
  return labels[level];
}

function roundedScore(score: ContextScore): number {
  return Math.round(score.score);
}

function scoreSummary(score?: ContextScore | null): string | null {
  if (!score) return null;
  return `${roundedScore(score)}% · ${contextLevelLabel(score.level)}`;
}

function compactCompanyLabel(
  company: Company,
  area: CompanyArea | null | undefined,
  score: ContextScore | null | undefined,
  loading: boolean,
): string {
  const scoreText = loading ? 'Calculando contexto...' : scoreSummary(score);
  return [company.name, area?.name, scoreText ?? 'Contexto aún no evaluado'].filter(Boolean).join(' · ');
}

function bandLabel(value: number, high: number, medium: number): string {
  if (value >= high) return 'alta';
  if (value >= medium) return 'media';
  return 'inicial';
}

function signalText(score: ContextScore): string | null {
  const breakdown = score.breakdown;
  if (!breakdown) return null;
  return `Cobertura ${bandLabel(breakdown.coverage, 45, 25)}, respaldo ${bandLabel(breakdown.evidence, 18, 9)} y actualización ${bandLabel(breakdown.freshness, 12, 7)}.`;
}

function levelExplanation(score: ContextScore): string {
  if (score.level === 'BASIC') {
    return 'Con un contexto básico, ya existe una referencia inicial, pero la revisión será más precisa cuando completes la información pendiente.';
  }
  if (score.level === 'INITIAL') {
    return 'Con un contexto inicial, la revisión seguirá siendo general hasta que agregues información sobre cómo funciona la empresa.';
  }
  if (score.level === 'USEFUL') {
    return 'Con un contexto útil, la revisión puede adaptarse mejor, pero todavía conviene confirmar la información pendiente.';
  }
  return 'Con un contexto sólido, la revisión cuenta con una base amplia. Mantén actualizada la información cuando cambien prioridades, políticas o estructura.';
}

function CompanyRow({
  company,
  selected,
  score,
  scoreLoading,
  onSelect,
}: {
  company: Company;
  selected: boolean;
  score: ContextScore | null | undefined;
  scoreLoading: boolean;
  onSelect: () => void;
}) {
  const recentArea = company.areas?.[0]?.name;
  const scoreText = scoreLoading ? 'Calculando contexto...' : scoreSummary(score) ?? 'Contexto aún no evaluado';

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
          {scopeLabel(company.scope)} · {scoreText}
        </span>
        {recentArea && <span aria-hidden="true" className="mt-0.5 block truncate text-xs text-slate-400">Área reciente: {recentArea}</span>}
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
  const [scoresByCompanyId, setScoresByCompanyId] = useState<Record<string, ContextScore | null>>({});
  const [scoreLoadingIds, setScoreLoadingIds] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingArea, setCreatingArea] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  const loadScore = useCallback(async (companyId: string) => {
    setScoreLoadingIds((prev) => new Set(prev).add(companyId));
    try {
      const score = await getCompanyScore(companyId);
      setScoresByCompanyId((prev) => ({ ...prev, [companyId]: score }));
    } catch {
      setScoresByCompanyId((prev) => ({ ...prev, [companyId]: null }));
    } finally {
      setScoreLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    }
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listCompanies();
      setCompanies(items);
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
    companies.forEach((company) => {
      if (!(company.id in scoresByCompanyId) && !scoreLoadingIds.has(company.id)) {
        void loadScore(company.id);
      }
    });
  }, [companies, loadScore, scoreLoadingIds, scoresByCompanyId]);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  const selected = useMemo(
    () => companies.find((company) => company.id === value?.companyId) ?? null,
    [companies, value?.companyId],
  );
  const selectedArea = selected?.areas?.find((area) => area.id === value?.areaId) ?? null;
  const selectedScore = selected ? scoresByCompanyId[selected.id] : null;
  const isScoreLoading = (companyId: string) => scoreLoadingIds.has(companyId) || !(companyId in scoresByCompanyId);
  const selectedScoreLoading = selected ? isScoreLoading(selected.id) : false;

  const filtered = companies.filter((company) => {
    const text = `${company.name} ${company.sector} ${company.country}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });
  const recent = filtered.slice(0, 3);
  const recentIds = new Set(recent.map((company) => company.id));
  const personal = filtered.filter((company) => company.scope === 'PERSONAL' && !recentIds.has(company.id));
  const organizational = filtered.filter((company) => company.scope === 'ORGANIZATION' && !recentIds.has(company.id));

  const selectCompany = (company: Company) => {
    onChange({ companyId: company.id });
    void loadScore(company.id);
  };

  const submitCompany = async () => {
    if (!form.name.trim() || !form.sector.trim() || !form.country.trim()) {
      setError('Nombre, sector y país son obligatorios.');
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
      void loadScore(company.id);
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
      void loadScore(selected.id);
      setAreaName('');
    } catch {
      setError('No pudimos crear el área.');
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
              <span className="truncate">
                {selected ? compactCompanyLabel(selected, selectedArea, selectedScore, selectedScoreLoading) : 'Empresa o contexto'}
              </span>
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
                  <p className="text-sm font-semibold text-slate-900">Aún no has registrado empresas</p>
                  <p className="mt-1 text-sm text-slate-500">Agrega contexto para obtener recomendaciones más realistas y aplicables.</p>
                  <Button type="button" size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={openCompanyDialog}>
                    <Plus size={15} />
                    Agregar una empresa
                  </Button>
                </div>
              )}
              {!loading && companies.length > 0 && filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No encontramos empresas con esa búsqueda.</p>
              )}

              {recent.length > 0 && (
                <section aria-label="Empresas recientes">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Empresas recientes</p>
                  <div className="space-y-1">
                    {recent.map((company) => (
                      <CompanyRow
                        key={`recent-${company.id}`}
                        company={company}
                        selected={company.id === selected?.id}
                        score={scoresByCompanyId[company.id]}
                        scoreLoading={isScoreLoading(company.id)}
                        onSelect={() => selectCompany(company)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {personal.length > 0 && (
                <section aria-label="Empresas personales" className="mt-2 border-t border-slate-100 pt-2">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Empresas personales</p>
                  <div className="space-y-1">
                    {personal.map((company) => (
                      <CompanyRow
                        key={`personal-${company.id}`}
                        company={company}
                        selected={company.id === selected?.id}
                        score={scoresByCompanyId[company.id]}
                        scoreLoading={isScoreLoading(company.id)}
                        onSelect={() => selectCompany(company)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {organizational.length > 0 && (
                <section aria-label="Contextos organizacionales disponibles" className="mt-2 border-t border-slate-100 pt-2">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contextos organizacionales disponibles</p>
                  <div className="space-y-1">
                    {organizational.map((company) => (
                      <CompanyRow
                        key={`org-${company.id}`}
                        company={company}
                        selected={company.id === selected?.id}
                        score={scoresByCompanyId[company.id]}
                        scoreLoading={isScoreLoading(company.id)}
                        onSelect={() => selectCompany(company)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {selected && (
                <section className="mt-3 border-t border-slate-100 px-3 pt-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{selected.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{scopeLabel(selected.scope)}</p>
                  </div>

                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm font-semibold text-slate-900">¿Qué significa este porcentaje?</p>
                      <p className="shrink-0 text-sm font-semibold text-indigo-700">
                        {selectedScoreLoading ? 'Calculando contexto...' : scoreSummary(selectedScore) ?? 'Contexto aún no evaluado'}
                      </p>
                    </div>

                    {selectedScore ? (
                      <>
                        <p className="mt-3 text-xs leading-5 text-slate-600">
                          Este porcentaje refleja qué tan completo y confiable es el contexto disponible de la empresa para adaptar el análisis de la iniciativa.
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {levelExplanation(selectedScore)}
                        </p>

                        {selectedScore.missing.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-amber-800">Por confirmar o profundizar</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-800">
                              {selectedScore.missing.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {signalText(selectedScore) && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-700">Señales identificadas</p>
                            <p className="mt-1 text-xs text-slate-500">{signalText(selectedScore)}</p>
                          </div>
                        )}
                      </>
                    ) : !selectedScoreLoading ? (
                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        Todavía no existe una evaluación del contexto para esta empresa.
                      </p>
                    ) : null}

                    <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/companies')}>
                      <Settings2 size={14} />
                      Completar contexto
                    </Button>
                  </div>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Área opcional</p>
                  <div className="mt-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => onChange({ companyId: selected.id })}
                      className={cn('flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500', !value?.areaId && 'bg-indigo-50 text-indigo-900')}
                    >
                      Sin área específica
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
                      placeholder="Agregar área"
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
              Crea un contexto inicial. Si agregas sitio web o LinkedIn, Starteria iniciará el procesamiento automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input aria-label="Nombre de empresa" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input aria-label="Sector" placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            <Input aria-label="País principal" placeholder="País principal" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
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
            <Input aria-label="Área del usuario" className="md:col-span-2" placeholder="Área del usuario" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} />
          </div>
          <p className="flex gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <CircleAlert size={14} className="mt-0.5 shrink-0 text-slate-500" />
            No incluyas contraseñas, credenciales, datos personales innecesarios ni documentos sin autorización.
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
