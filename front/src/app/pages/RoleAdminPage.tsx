/**
 * RoleAdminPage — administración de roles de plataforma (ADR-029, PBA-08).
 *
 * ADR-029 hizo posible que un usuario tenga VARIOS roles, pero hasta aquí esa
 * capacidad sólo se alcanzaba con curl. Esta pantalla la pone en manos del admin:
 * marcar portfolio_lead SIN desmarcar participante, que es el caso que motivó todo.
 *
 * La autorización real vive en el servidor (`users:assign-roles` en GET /users y en
 * PATCH /users/:id/role). Aquí sólo se decide qué se PINTA.
 */
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Loader2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { can } from '../authz/permissions';
import {
  listUsers,
  updateUserRoles,
  PLATFORM_ROLES,
  ROLE_LABELS,
  ROLE_HINTS,
  type AdminUser,
  type PlatformRole,
} from '../services/userAdminService';

const mismosRoles = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function RoleAdminPage() {
  const { user } = useApp();
  const puedeAsignar = can(user, 'users:assign-roles');

  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [borrador, setBorrador] = useState<Record<string, PlatformRole[]>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);

  useEffect(() => {
    if (!puedeAsignar) {
      setCargando(false);
      return;
    }
    let cancelado = false;
    listUsers()
      .then((lista) => {
        if (cancelado) return;
        setUsuarios(lista);
        setBorrador(Object.fromEntries(lista.map((u) => [u.id, [...u.roles]])));
      })
      .catch(() => { if (!cancelado) setError('No se pudo cargar la lista de usuarios.'); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [puedeAsignar]);

  const sucios = useMemo(() => {
    const set = new Set<string>();
    for (const u of usuarios) {
      if (!mismosRoles(borrador[u.id] ?? [], u.roles)) set.add(u.id);
    }
    return set;
  }, [usuarios, borrador]);

  if (!puedeAsignar) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <ShieldCheck size={28} className="mx-auto text-slate-300" />
        <h1 className="mt-3 text-lg text-slate-900" style={{ fontWeight: 700 }}>
          No tienes acceso a esta sección
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          La administración de roles requiere permisos de administrador.
        </p>
      </div>
    );
  }

  const alternar = (userId: string, rol: PlatformRole) => {
    setGuardado(null);
    setBorrador((prev) => {
      const actuales = prev[userId] ?? [];
      const siguiente = actuales.includes(rol)
        ? actuales.filter((r) => r !== rol)
        : [...actuales, rol];
      return { ...prev, [userId]: siguiente };
    });
  };

  const guardar = async (u: AdminUser) => {
    const roles = borrador[u.id] ?? [];
    // Un conjunto vacío derivaría a cero permisos: cerraría la cuenta en silencio.
    // El servidor también lo rechaza (EMPTY_ROLE_SET); aquí se evita el viaje.
    if (roles.length === 0) {
      setError(`${u.name} necesita al menos un rol.`);
      return;
    }

    setError(null);
    setGuardando(u.id);
    try {
      const actualizado = await updateUserRoles(u.id, roles);
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...actualizado } : x)));
      setGuardado(u.id);
    } catch {
      setError(`No se pudieron guardar los roles de ${u.name}.`);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-xl text-slate-900" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          Roles de plataforma
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Un usuario puede tener varios roles a la vez. Dar Portfolio Lead no le quita Participante:
          conserva su workspace y suma la capa estratégica.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {cargando ? (
        <p className="py-12 text-center text-sm text-slate-500">Cargando usuarios…</p>
      ) : (
        <ul className="space-y-3">
          {usuarios.map((u) => {
            const roles = borrador[u.id] ?? [];
            const sucio = sucios.has(u.id);
            const esYo = u.id === user?.id;

            return (
              <li
                key={u.id}
                data-testid={`usuario-${u.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-700" style={{ fontWeight: 700 }}>
                      {u.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-900" style={{ fontWeight: 600 }}>
                        {u.name}
                        {esYo ? <span className="ml-2 text-xs text-slate-400">(tú)</span> : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => guardar(u)}
                    disabled={!sucio || guardando === u.id || esYo}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                    style={{ fontWeight: 600 }}
                  >
                    {guardando === u.id ? <Loader2 size={13} className="animate-spin" /> : null}
                    {guardado === u.id && !sucio ? <Check size={13} /> : null}
                    {guardando === u.id ? 'Guardando…' : guardado === u.id && !sucio ? 'Guardado' : 'Guardar'}
                  </button>
                </div>

                {/* Un admin no puede cambiar su PROPIO rol: el servicio lo rechaza con
                    CANNOT_CHANGE_OWN_ROLE (ADR-028) para que nadie se deje fuera por
                    accidente. La UI lo refleja en vez de reimplementar la regla. */}
                {esYo ? (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    No puedes cambiar tus propios roles. Pídeselo a otro administrador.
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {PLATFORM_ROLES.map((rol) => {
                    const activo = roles.includes(rol);
                    return (
                      <button
                        key={rol}
                        type="button"
                        role="checkbox"
                        aria-checked={activo}
                        aria-label={ROLE_LABELS[rol]}
                        title={ROLE_HINTS[rol]}
                        disabled={esYo}
                        onClick={() => alternar(u.id, rol)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                          activo
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                        style={{ fontWeight: activo ? 600 : 500 }}
                      >
                        {ROLE_LABELS[rol]}
                      </button>
                    );
                  })}
                </div>

                {roles.length === 0 ? (
                  <p className="mt-2 text-xs text-red-600">Necesita al menos un rol.</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RoleAdminPage;
