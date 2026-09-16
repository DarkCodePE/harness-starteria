/**
 * RoleAdminPage.test.tsx — la pantalla de roles (ADR-029, PBA-08).
 *
 * El caso central es el que motivó todo el ADR: marcar Portfolio Lead SIN desmarcar
 * Participante, y que lo que viaje al servidor sea el CONJUNTO — mandar el escalar
 * reintroduciría el bug.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleAdminPage } from '../RoleAdminPage';

const listUsers = vi.fn();
const updateUserRoles = vi.fn();
vi.mock('../../services/userAdminService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/userAdminService')>()),
  listUsers: (...a: unknown[]) => listUsers(...a),
  updateUserRoles: (...a: unknown[]) => updateUserRoles(...a),
}));

let currentUser: { id: string; permissions: string[] } | null = {
  id: 'u-admin',
  permissions: ['users:assign-roles'],
};
vi.mock('../../context/AppContext', () => ({
  useApp: () => ({ user: currentUser }),
}));

const ANA = {
  id: 'u1',
  name: 'Ana Rodríguez',
  email: 'ana@x.com',
  role: 'participante' as const,
  roles: ['participante' as const],
  initials: 'AR',
};

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: 'u-admin', permissions: ['users:assign-roles'] };
  listUsers.mockResolvedValue([ANA]);
  updateUserRoles.mockImplementation((_id: string, roles: string[]) =>
    Promise.resolve({ ...ANA, role: roles[0], roles }),
  );
});

describe('acceso', () => {
  it('sin users:assign-roles no se pide la lista ni se pinta', async () => {
    currentUser = { id: 'u-x', permissions: ['project:own'] };

    render(<RoleAdminPage />);

    expect(await screen.findByText(/No tienes acceso/i)).toBeTruthy();
    expect(listUsers).not.toHaveBeenCalled();
  });
});

describe('conceder un segundo rol (la regresión de ADR-029)', () => {
  it('marcar Portfolio Lead NO desmarca Participante, y se envía el conjunto', async () => {
    const user = userEvent.setup();
    render(<RoleAdminPage />);
    await screen.findByText('Ana Rodríguez');

    await user.click(screen.getByRole('checkbox', { name: 'Portfolio Lead' }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(updateUserRoles).toHaveBeenCalled());
    const [, rolesEnviados] = updateUserRoles.mock.calls[0];
    // Lo que importa: viajan LOS DOS. Con el escalar era imposible de expresar.
    expect(rolesEnviados).toContain('participante');
    expect(rolesEnviados).toContain('portfolio_lead');
  });

  it('el estado marcado refleja los roles que el usuario ya tiene', async () => {
    render(<RoleAdminPage />);
    await screen.findByText('Ana Rodríguez');

    expect(screen.getByRole('checkbox', { name: 'Participante' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('checkbox', { name: 'Portfolio Lead' }).getAttribute('aria-checked')).toBe('false');
  });

  it('una fila sin cambios no se puede guardar', async () => {
    render(<RoleAdminPage />);
    await screen.findByText('Ana Rodríguez');

    expect(screen.getByRole('button', { name: /guardar/i }).hasAttribute('disabled')).toBe(true);
  });
});

describe('guardas', () => {
  it('no deja guardar un usuario sin ningún rol', async () => {
    const user = userEvent.setup();
    render(<RoleAdminPage />);
    await screen.findByText('Ana Rodríguez');

    // Quitarle el único rol: derivaría a cero permisos y cerraría la cuenta.
    await user.click(screen.getByRole('checkbox', { name: 'Participante' }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // El aviso sale por dos vías (el alert global y la marca en la fila); se afirma
    // el alert, que es el que nombra a la persona.
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toMatch(/Ana Rodríguez necesita al menos un rol/i);
    expect(updateUserRoles).not.toHaveBeenCalled();
  });

  it('un admin no puede editarse a sí mismo: el servicio lo rechaza y la UI lo refleja', async () => {
    currentUser = { id: ANA.id, permissions: ['users:assign-roles'] };

    render(<RoleAdminPage />);
    await screen.findByText('Ana Rodríguez');

    expect(screen.getByText(/No puedes cambiar tus propios roles/i)).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Portfolio Lead' }).hasAttribute('disabled')).toBe(true);
  });

  it('un fallo al guardar se muestra y no deja la fila en un estado mentiroso', async () => {
    updateUserRoles.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<RoleAdminPage />);
    await screen.findByText('Ana Rodríguez');

    await user.click(screen.getByRole('checkbox', { name: 'Mentor' }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    // Sigue marcado como pendiente: el cambio NO se aplicó en el servidor.
    expect(screen.getByRole('button', { name: /guardar/i }).hasAttribute('disabled')).toBe(false);
  });

  it('si la lista falla, se avisa en vez de mostrar una pantalla vacía', async () => {
    listUsers.mockRejectedValue(new Error('red caída'));

    render(<RoleAdminPage />);

    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
