import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, FileText, RefreshCw, Save, UploadCloud } from 'lucide-react';
import {
  Company,
  CompanyContextDetails,
  CompanyContextEntryInput,
  ContextScore,
  getCompanyScore,
  listCompanies,
  readCompanyContext,
  updateCompanyContext,
  uploadCompanySource,
} from '../services/companyService';

const contextFields: Array<{
  dimension: CompanyContextEntryInput['dimension'];
  fieldKey: string;
  label: string;
  prompt: string;
}> = [
  {
    dimension: 'CULTURE',
    fieldKey: 'change_openness',
    label: 'Cultura y apertura al cambio',
    prompt: 'Ejemplo: como se reciben ideas nuevas, que resistencia suele aparecer y que condiciones ayudan a probar cambios.',
  },
  {
    dimension: 'STRUCTURE',
    fieldKey: 'decision_structure',
    label: 'Estructura y toma de decisiones',
    prompt: 'Ejemplo: areas que deciden, niveles de aprobacion, sponsor o comites relevantes.',
  },
  {
    dimension: 'POLICIES',
    fieldKey: 'internal_validations',
    label: 'Politicas y validaciones internas',
    prompt: 'Ejemplo: legal, seguridad, compras, datos, riesgos, compliance o reglas que pueden condicionar una iniciativa.',
  },
  {
    dimension: 'INNOVATION',
    fieldKey: 'innovation_maturity',
    label: 'Madurez de innovacion y escalamiento',
    prompt: 'Ejemplo: como se pilotea, quien aprueba escalar, que aprendizajes o experimentos existen.',
  },
  {
    dimension: 'RESOURCES',
    fieldKey: 'available_resources',
    label: 'Recursos disponibles',
    prompt: 'Ejemplo: datos, expertos, presupuesto, tiempo de equipos, herramientas o canales disponibles.',
  },
];

function levelCopy(score?: ContextScore | null, context?: CompanyContextDetails | null): string {
  if (score) return `${score.label} - ${score.score}%`;
  if (context) return `${context.contextLevel} - ${context.contextScore}%`;
  return 'Sin contexto calculado';
}

function normalizeEntryValue(value: unknown): string {
  if (typeof value === 'object' && value && 'value' in value) {
    const nested = (value as { value?: unknown }).value;
    return Array.isArray(nested) ? nested.join(', ') : String(nested ?? '');
  }
  return Array.isArray(value) ? value.join(', ') : String(value ?? '');
}

function latestEntryByField(context: CompanyContextDetails | null, fieldKey: string): string {
  const entry = [...(context?.entries ?? [])].reverse().find((item) => item.fieldKey === fieldKey);
  return entry ? normalizeEntryValue(entry.value) : '';
}

function ScorePanel({
  score,
  context,
  loading,
}: {
  score: ContextScore | null;
  context: CompanyContextDetails | null;
  loading: boolean;
}) {
  const breakdown = score?.breakdown ?? context?.scoreBreakdown;
  const missing = score?.missing ?? context?.missing ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Claridad del contexto de empresa</h3>
          <p className="mt-1 text-sm text-slate-600">
            {loading ? 'Actualizando contexto...' : levelCopy(score, context)}
          </p>
        </div>
        <p className="max-w-md text-xs text-slate-500">
          Este porcentaje mide cobertura, evidencia y actualidad del contexto usado para adaptar la revision de iniciativas. No es avance del registro.
        </p>
      </div>

      {breakdown && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-white p-3">
            <p className="text-xs text-slate-500">Cobertura</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{breakdown.coverage}</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-xs text-slate-500">Evidencia</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{breakdown.evidence}</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-xs text-slate-500">Actualidad</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{breakdown.freshness}</p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {missing.length > 0
          ? `Para subir la claridad, falta contexto sobre: ${missing.join(', ')}.`
          : 'El contexto cubre las dimensiones principales. Mantén las fuentes actualizadas.'}
      </div>
    </section>
  );
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [context, setContext] = useState<CompanyContextDetails | null>(null);
  const [score, setScore] = useState<ContextScore | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected = companies.find((company) => company.id === selectedId) ?? companies[0] ?? null;

  const completedFields = useMemo(() => (
    contextFields.filter((field) => draft[field.fieldKey]?.trim()).length
  ), [draft]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const items = await listCompanies();
      setCompanies(items);
      if (!selectedId && items[0]) setSelectedId(items[0].id);
    } finally {
      setLoading(false);
    }
  };

  const loadContext = async (companyId: string) => {
    setContextLoading(true);
    setMessage(null);
    try {
      const [nextContext, nextScore] = await Promise.all([
        readCompanyContext(companyId),
        getCompanyScore(companyId),
      ]);
      setContext(nextContext);
      setScore(nextScore);
      setDraft(Object.fromEntries(contextFields.map((field) => [field.fieldKey, latestEntryByField(nextContext, field.fieldKey)])));
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => { void loadCompanies(); }, []);

  useEffect(() => {
    if (selected?.id) void loadContext(selected.id);
  }, [selected?.id]);

  const upload = async (file: File) => {
    if (!selected) return;
    setMessage('Subiendo fuente de contexto...');
    await uploadCompanySource(selected.id, file);
    await Promise.all([loadCompanies(), loadContext(selected.id)]);
    setMessage('Fuente registrada. El procesamiento puede tardar unos minutos.');
  };

  const saveContext = async () => {
    if (!selected) return;
    const entries = contextFields
      .map((field) => ({
        dimension: field.dimension,
        fieldKey: field.fieldKey,
        value: draft[field.fieldKey]?.trim(),
        sourceType: 'USER_INPUT' as const,
        verificationStatus: 'USER_CONFIRMED' as const,
      }))
      .filter((entry) => entry.value);

    if (entries.length === 0) {
      setMessage('Agrega al menos un dato de contexto antes de guardar.');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const nextContext = await updateCompanyContext(selected.id, entries);
      const nextScore = await getCompanyScore(selected.id);
      setContext(nextContext);
      setScore(nextScore);
      await loadCompanies();
      setMessage('Contexto complementado y score actualizado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Empresas</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona contexto privado, compartido con iniciativas y disponible para la organizacion.</p>
        </div>
        <a href="/initiatives/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Crear iniciativa
        </a>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="px-2 text-xs font-semibold uppercase text-slate-500">Mis empresas</p>
          {loading && <p className="p-2 text-sm text-slate-500">Cargando...</p>}
          {!loading && companies.length === 0 && <p className="p-2 text-sm text-slate-500">Aun no tienes empresas. Puedes crear una desde una iniciativa nueva.</p>}
          <div className="mt-2 space-y-1">
            {companies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedId(company.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${selected?.id === company.id ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-slate-50'}`}
              >
                <span className="font-semibold">{company.name}</span>
                <span className="block text-xs text-slate-500">{company.scope === 'ORGANIZATION' ? 'Disponible para la organizacion' : 'Privado'}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-lg border border-slate-200 bg-white p-5">
          {!selected ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Selecciona o crea una empresa.</div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{selected.name}</h2>
                    <p className="text-sm text-slate-500">{selected.sector} - {selected.country}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {levelCopy(score, context)}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => selected && loadContext(selected.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <RefreshCw size={15} /> Actualizar
                </button>
              </div>

              <div className="mt-6">
                <ScorePanel score={score} context={context} loading={contextLoading} />
              </div>

              <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No subas contrasenas, credenciales, datos personales innecesarios, secretos comerciales, informacion financiera no publica, bases de datos de clientes ni documentos que no tengas autorizacion para utilizar.
              </section>

              <section className="mt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Complementar contexto</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Estos datos ayudan a explicar el porcentaje. Son fuentes de contexto de empresa, no evidencias de validacion de la iniciativa.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <CheckCircle2 size={13} />
                    {completedFields}/{contextFields.length} campos con informacion
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {contextFields.map((field) => (
                    <label key={field.fieldKey} className="grid gap-1">
                      <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                      <textarea
                        value={draft[field.fieldKey] ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, [field.fieldKey]: event.target.value }))}
                        rows={3}
                        placeholder={field.prompt}
                        className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={saveContext}
                    disabled={saving || contextLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={15} />
                    {saving ? 'Guardando...' : 'Guardar contexto'}
                  </button>
                  {message && <p className="text-sm text-slate-600" role="status">{message}</p>}
                </div>
              </section>

              <section className="mt-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Fuentes de contexto de empresa</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Archivos o enlaces usados para enriquecer el contexto. No reemplazan las evidencias propias de una iniciativa.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <UploadCloud size={15} />
                    Subir fuente
                    <input
                      type="file"
                      accept=".pdf,.docx,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void upload(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {(context?.sources ?? selected.sources ?? []).length === 0 && <p className="p-3 text-sm text-slate-500">Sin fuentes registradas.</p>}
                  {(context?.sources ?? selected.sources ?? []).map((source) => (
                    <div key={source.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-slate-700">
                        <FileText size={15} className="shrink-0 text-indigo-500" />
                        <span className="truncate">{source.url ?? source.originalFilename ?? source.sourceType}</span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{source.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
