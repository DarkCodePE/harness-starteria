/**
 * require-permission.test.ts — el guard de plataforma de ADR-029.
 *
 * Cubre las dos propiedades que el modelo anterior no podía cumplir:
 *  1. un usuario con DOS roles conserva los permisos de ambos (la regresión que
 *     motiva el ADR: conceder portafolio revocaba participante);
 *  2. un token emitido ANTES de ADR-029 —sin `roles`— sigue autorizando, en vez
 *     de echar a la calle a toda sesión viva en el momento del despliegue.
 */
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { buildRequestUser, requirePermission, requireRole } from '../auth.middleware';
import type { Role } from '../../../shared/types/user.types';

function correr(
  user: Request['user'] | undefined,
  guard: (req: Request, res: Response, next: NextFunction) => void,
): { ok: boolean; status?: number } {
  const next = vi.fn();
  guard({ user } as Request, {} as Response, next as unknown as NextFunction);

  const err = next.mock.calls[0]?.[0];
  return err ? { ok: false, status: err.statusCode } : { ok: true };
}

const sesion = (role: Role, roles?: Role[]) =>
  buildRequestUser({ id: 'u1', email: 'u@x.com', role, roles });

describe('buildRequestUser', () => {
  it('deriva roles y permisos de una sesión moderna', () => {
    const u = sesion('participante', ['participante', 'portfolio_lead']);
    expect(u.roles).toEqual(['participante', 'portfolio_lead']);
    expect(u.permissions.has('portfolio:write')).toBe(true);
    expect(u.permissions.has('project:own')).toBe(true);
  });

  it('cae al rol primario cuando la sesión no trae conjunto (token pre-ADR-029)', () => {
    const u = sesion('admin');
    expect(u.roles).toEqual(['admin']);
    expect(u.permissions.has('users:assign-roles')).toBe(true);
  });
});

describe('requirePermission', () => {
  it('deja pasar a quien tiene el permiso', () => {
    expect(correr(sesion('portfolio_lead'), requirePermission('portfolio:write')).ok).toBe(true);
  });

  it('403 a quien no lo tiene', () => {
    expect(correr(sesion('mentor'), requirePermission('portfolio:write'))).toEqual({
      ok: false,
      status: 403,
    });
  });

  it('401 sin sesión', () => {
    expect(correr(undefined, requirePermission('portfolio:write'))).toEqual({
      ok: false,
      status: 401,
    });
  });

  it('el admin conserva todo el acceso que tenía', () => {
    // Equivalencia de comportamiento: ADR-029 cambia CÓMO se decide, no a quién
    // se le concede. Si esto se rompe, la migración cambió la política.
    for (const p of ['portfolio:write', 'users:assign-roles', 'cohort:manage'] as const) {
      expect(correr(sesion('admin'), requirePermission(p)).ok, p).toBe(true);
    }
  });

  it('el admin NO gana la decisión del sponsor por la puerta de atrás', () => {
    // `PATCH /sponsor/checkpoints/:id/respond` usa requireRole('sponsor') y excluye
    // al admin a propósito; el admin tiene /skip, que es otro acto de gobierno.
    // Un comodín "admin puede todo" habría colado ese cambio de política dentro de
    // una migración que sólo debía cambiar cómo se decide.
    expect(correr(sesion('admin'), requirePermission('sponsor:decide'))).toEqual({
      ok: false,
      status: 403,
    });
    expect(correr(sesion('sponsor'), requirePermission('sponsor:decide')).ok).toBe(true);
  });
});

describe('la regresión que motiva ADR-029', () => {
  it('participante + portfolio_lead entra a portafolio Y conserva lo suyo', () => {
    const dobleRol = sesion('participante', ['participante', 'portfolio_lead']);

    expect(correr(dobleRol, requirePermission('portfolio:write')).ok).toBe(true);
    expect(correr(dobleRol, requirePermission('project:own')).ok).toBe(true);
  });

  it('el rol primario ya no decide: importa el conjunto', () => {
    // Con el escalar, este usuario era "participante" y punto: el guard de
    // portafolio lo rechazaba aunque se le hubiera concedido el rol.
    const u = sesion('participante', ['participante', 'portfolio_lead']);
    expect(u.role).toBe('participante');
    expect(correr(u, requirePermission('portfolio:write')).ok).toBe(true);
  });
});

describe('requireRole (deprecado) durante la transición', () => {
  it('también mira el conjunto, no sólo el rol primario', () => {
    // Mientras queden call sites sin migrar, el guard viejo no puede quedarse
    // ciego al conjunto: si no, un doble rol fallaría según qué ruta tocara.
    const u = sesion('participante', ['participante', 'portfolio_lead']);
    expect(correr(u, requireRole('portfolio_lead')).ok).toBe(true);
  });

  it('sigue rechazando a quien no tiene ninguno de los roles pedidos', () => {
    expect(correr(sesion('mentor'), requireRole('admin', 'portfolio_lead'))).toEqual({
      ok: false,
      status: 403,
    });
  });
});
