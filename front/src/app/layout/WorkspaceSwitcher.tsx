/**
 * WorkspaceSwitcher — elegir entre las dos superficies de Starteria (ADR-029 §5).
 *
 * Sustituye al redirect por igualdad de rol que encerraba al portfolio lead en
 * /portfolio. Quien pertenece a una sola zona NO ve este control.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  availableWorkspaces,
  rememberWorkspace,
  shouldShowSwitcher,
  type WorkspaceId,
} from '../authz/workspaces';

export function WorkspaceSwitcher({ activa }: { activa: WorkspaceId }) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  // Quien no puede elegir no ve nada: su navegación queda idéntica a la de antes.
  if (!shouldShowSwitcher(user)) return null;

  const zonas = availableWorkspaces(user);
  const actual = zonas.find((z) => z.id === activa) ?? zonas[0];

  return (
    <div className="relative px-3 pt-3" data-testid="workspace-switcher">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:bg-slate-50"
        style={{ fontWeight: 600 }}
      >
        <span className="truncate">{actual.label}</span>
        <ChevronDown size={15} className="shrink-0 text-slate-400" />
      </button>

      {abierto ? (
        <ul
          role="listbox"
          className="absolute left-3 right-3 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {zonas.map((zona) => (
            <li key={zona.id}>
              <button
                type="button"
                role="option"
                aria-selected={zona.id === actual.id}
                onClick={() => {
                  setAbierto(false);
                  rememberWorkspace(zona.id);
                  navigate(zona.path);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                style={{ fontWeight: zona.id === actual.id ? 600 : 500 }}
              >
                {zona.label}
                {zona.id === actual.id ? <Check size={14} className="text-slate-500" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
