import React, { useEffect, useState } from 'react';
import { Building2, FileText, RefreshCw } from 'lucide-react';
import { Company, listCompanies, uploadCompanySource } from '../services/companyService';

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = companies.find((company) => company.id === selectedId) ?? companies[0] ?? null;

  const load = async () => {
    setLoading(true);
    try {
      const items = await listCompanies();
      setCompanies(items);
      if (!selectedId && items[0]) setSelectedId(items[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const upload = async (file: File) => {
    if (!selected) return;
    await uploadCompanySource(selected.id, file);
    await load();
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
        <aside className="rounded-xl border border-slate-200 bg-white p-3">
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

        <main className="rounded-xl border border-slate-200 bg-white p-5">
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
                    <p className="text-sm text-slate-500">{selected.sector} · {selected.country}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Nivel de contexto disponible: {selected.versions?.[0]?.contextScore ?? 0}%
                    </p>
                  </div>
                </div>
                <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <RefreshCw size={15} /> Actualizar
                </button>
              </div>

              <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No subas contrasenas, credenciales, datos personales innecesarios, secretos comerciales, informacion financiera no publica, bases de datos de clientes ni documentos que no tengas autorizacion para utilizar.
              </section>

              <section className="mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Fuentes y documentos</h3>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <FileText size={15} />
                    Subir archivo
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
                  {(selected.sources ?? []).length === 0 && <p className="p-3 text-sm text-slate-500">Sin fuentes registradas.</p>}
                  {(selected.sources ?? []).map((source) => (
                    <div key={source.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <span className="text-slate-700">{source.url ?? source.originalFilename ?? source.sourceType}</span>
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
