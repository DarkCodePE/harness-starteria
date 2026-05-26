import React from 'react';
import { Link, Outlet } from 'react-router';
import { Zap } from 'lucide-react';
import { PUBLIC_START_COPY } from '../../features/public-start/domain/copy';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/public/start" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Starteria</p>
              <p className="text-xs text-slate-500">Entrada publica</p>
            </div>
          </Link>
          <Link
            to="/auth"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            style={{ fontWeight: 600 }}
          >
            Iniciar sesion
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-5 pb-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {PUBLIC_START_COPY.confidentialityNotice}
        </div>
      </footer>
    </div>
  );
}
