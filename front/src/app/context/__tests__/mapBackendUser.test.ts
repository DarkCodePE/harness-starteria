/**
 * mapBackendUser.test.ts — ADR-028.
 *
 * `mapBackendUser` decide el rol con el que se renderiza toda la app y hasta ahora no
 * tenía ninguna cobertura. Antes de ADR-028 sintetizaba `portfolio_lead` comparando el
 * correo del usuario contra un Set (con override por `VITE_PORTFOLIO_LEAD_EMAIL`); el
 * backend nunca se enteraba y devolvía 403 en las escrituras de portafolio.
 *
 * La aserción que fija el cambio es la segunda: el correo histórico del portfolio lead
 * ya NO otorga el rol por sí solo.
 */
import { describe, it, expect } from 'vitest';
import { mapBackendUser } from '../AppContext';
import type { AuthUser } from '../../services/auth.service';

function raw(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: 'u-1',
    name: 'Persona Cualquiera',
    email: 'cualquiera@x.com',
    role: 'participante',
    initials: 'PC',
    ...overrides,
  } as AuthUser;
}

describe('mapBackendUser — el rol viene del backend (ADR-028)', () => {
  it('un portfolio_lead del backend es portfolio_lead, con cualquier correo', () => {
    const user = mapBackendUser(raw({ role: 'portfolio_lead', email: 'cualquiera@x.com' }));

    expect(user.role).toBe('portfolio_lead');
  });

  it('el correo histórico ya NO otorga el rol: viewer sigue siendo owner', () => {
    const user = mapBackendUser(raw({ role: 'viewer', email: 'portfolio@starteria.io' }));

    expect(user.role).toBe('owner');
  });

  it.each([
    ['participante', 'owner'],
    ['colaborador', 'owner'],
    ['viewer', 'owner'],
    ['mentor', 'mentor'],
    ['admin', 'admin'],
    ['sponsor', 'sponsor'],
    ['portfolio_lead', 'portfolio_lead'],
  ] as const)('mapea %s -> %s', (backendRole, expected) => {
    expect(mapBackendUser(raw({ role: backendRole })).role).toBe(expected);
  });

  it('un rol desconocido cae en owner en vez de romper la app', () => {
    expect(mapBackendUser(raw({ role: 'rol_del_futuro' as never })).role).toBe('owner');
  });
});
