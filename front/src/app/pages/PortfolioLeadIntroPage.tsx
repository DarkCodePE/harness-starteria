import React from 'react';
import { ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

const BULLETS = [
  'Convierte prioridades de negocio en retos accionables.',
  'Da seguimiento a iniciativas por frente o reto.',
  'Identifica bloqueos, evidencia faltante y decisiones pendientes.',
  'Genera reportes claros para sponsor o gerencia.',
];

export function PortfolioLeadIntroPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-full max-w-4xl items-center px-6 py-10">
      <section className="w-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          style={{ fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Volver a mis proyectos
        </button>

        <div className="max-w-2xl">
          <p className="text-xs uppercase text-indigo-600" style={{ fontWeight: 800, letterSpacing: '0.08em' }}>Portfolio Lead</p>
          <h1 className="mt-3 text-3xl text-slate-950" style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
            Gestiona iniciativas desde una mirada estratégica
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Portfolio Lead te ayuda a conectar objetivos estratégicos, retos e iniciativas para dar seguimiento, revisar evidencia y tomar decisiones.
          </p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {BULLETS.map(item => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-indigo-600" />
              <p className="text-sm leading-5 text-slate-700">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm text-white shadow-sm transition-colors hover:bg-indigo-700"
            style={{ fontWeight: 700 }}
          >
            <MessageCircle size={16} /> Contactar / Solicitar acceso
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            style={{ fontWeight: 700 }}
          >
            Volver a mis proyectos
          </button>
        </div>
      </section>
    </div>
  );
}
