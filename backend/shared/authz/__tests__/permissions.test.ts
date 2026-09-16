/**
 * permissions.test.ts — la tabla de derivación rol→permisos (ADR-029 §1, §2).
 *
 * Esta tabla es superficie de seguridad: un error aquí concede privilegios en
 * silencio y en TODAS las rutas a la vez, porque es la única fuente de la que
 * beben los guards. El ADR la marca como algo que se revisa como se revisa un
 * guard, así que la cobertura es exhaustiva por rol, no por muestreo.
 *
 * El test que de verdad importa es «la unión»: es la propiedad que rompe el
 * "gana acceso en una plataforma, lo pierde en la otra" que motiva ADR-029.
 */
import { describe, it, expect } from 'vitest';
import { PLATFORM_ROLES, type Role } from '../../types/user.types';
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsForRoles,
  rolesForUser,
  can,
  type Permission,
} from '../permissions';

describe('ROLE_PERMISSIONS — la tabla', () => {
  it('define TODOS los roles de plataforma', () => {
    // Sin esto, añadir un valor al enum Role lo dejaría sin permisos y en
    // silencio: el usuario perdería acceso sin que nada fallara al compilar.
    for (const role of PLATFORM_ROLES) {
      expect(ROLE_PERMISSIONS[role], `rol sin entrada en la tabla: ${role}`).toBeDefined();
    }
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual([...PLATFORM_ROLES].sort());
  });

  it('no concede ningún permiso fuera del catálogo', () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      for (const p of perms) {
        expect(ALL_PERMISSIONS, `${role} concede un permiso inexistente: ${p}`).toContain(p);
      }
    }
  });

  it('el catálogo no tiene duplicados', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });
});

describe('permissionsForRoles — derivación por rol', () => {
  const casos: Array<[Role, Permission[]]> = [
    ['participante', ['project:own']],
    ['colaborador', ['project:own']],
    ['viewer', []],
    ['mentor', ['mentor:panel']],
    ['sponsor', ['sponsor:decide']],
    ['portfolio_lead', ['portfolio:read', 'portfolio:write']],
  ];

  it.each(casos)('%s deriva exactamente sus permisos', (role, esperados) => {
    expect([...permissionsForRoles([role])].sort()).toEqual([...esperados].sort());
  });

  it('admin recibe todo MENOS sponsor:decide', () => {
    // Enumerado, no un centinela '*': así `can` sigue siendo pertenencia a un
    // set y ningún sitio de chequeo necesita conocer un caso especial.
    expect([...permissionsForRoles(['admin'])].sort()).toEqual([...ROLE_PERMISSIONS.admin].sort());
  });

  it('admin NO puede responder un checkpoint de sponsor', () => {
    // Fidelidad con el comportamiento real: `PATCH /sponsor/checkpoints/:id/respond`
    // usa requireRole('sponsor') y excluye al admin a propósito — el admin tiene
    // /skip, que es otro acto. Si alguien le da el catálogo entero al admin "por
    // comodidad", este test lo detiene.
    expect(can(permissionsForRoles(['admin']), 'sponsor:decide')).toBe(false);
    expect(can(permissionsForRoles(['sponsor']), 'sponsor:decide')).toBe(true);
  });

  it('viewer no obtiene permisos de plataforma: su acceso lo resuelve requireProjectAccess', () => {
    expect(permissionsForRoles(['viewer']).size).toBe(0);
  });
});

describe('permissionsForRoles — la UNIÓN (la regresión que motiva ADR-029)', () => {
  it('participante + portfolio_lead conserva las DOS pertenencias', () => {
    const perms = permissionsForRoles(['participante', 'portfolio_lead']);

    // Antes de ADR-029 esto era imposible de expresar: `role` era un escalar,
    // así que conceder portafolio REVOCABA participante.
    expect(can(perms, 'project:own')).toBe(true);
    expect(can(perms, 'portfolio:write')).toBe(true);
  });

  it('el orden de los roles no cambia el resultado', () => {
    const a = permissionsForRoles(['participante', 'portfolio_lead']);
    const b = permissionsForRoles(['portfolio_lead', 'participante']);
    expect([...a].sort()).toEqual([...b].sort());
  });

  it('un rol repetido no altera el resultado', () => {
    const una = permissionsForRoles(['portfolio_lead']);
    const dos = permissionsForRoles(['portfolio_lead', 'portfolio_lead']);
    expect([...dos].sort()).toEqual([...una].sort());
  });

  it('sumar un rol nunca QUITA un permiso (la unión es monótona)', () => {
    // Propiedad que impide reintroducir el bug: si alguien convirtiera esto en
    // una intersección o en un "último rol gana", este test lo detecta.
    for (const base of PLATFORM_ROLES) {
      for (const extra of PLATFORM_ROLES) {
        const solo = permissionsForRoles([base]);
        const ambos = permissionsForRoles([base, extra]);
        for (const p of solo) {
          expect(can(ambos, p), `${base} perdió ${p} al sumarle ${extra}`).toBe(true);
        }
      }
    }
  });
});

describe('permissionsForRoles — entradas degeneradas (falla cerrado)', () => {
  it('sin roles no hay permisos', () => {
    expect(permissionsForRoles([]).size).toBe(0);
  });

  it('un rol desconocido se ignora en vez de reventar', () => {
    // Puede llegar de un token viejo o de una fila con un valor retirado del
    // enum. La respuesta segura es no conceder nada, no lanzar: lanzar aquí
    // convertiría un dato raro en un 500 en cada petición del usuario.
    const perms = permissionsForRoles(['participante', 'rol_que_no_existe' as Role]);
    expect([...perms]).toEqual(['project:own']);
  });

  it('un rol desconocido a solas no concede nada', () => {
    expect(permissionsForRoles(['fantasma' as Role]).size).toBe(0);
  });
});

describe('rolesForUser — el shim de la fase 1', () => {
  it('usa roles cuando la fila ya está migrada', () => {
    expect(rolesForUser({ role: 'participante', roles: ['participante', 'portfolio_lead'] })).toEqual([
      'participante',
      'portfolio_lead',
    ]);
  });

  it('cae a role cuando roles está vacío (fila anterior al backfill)', () => {
    // Verificado contra Postgres: tras el ALTER TABLE sin default, las filas
    // viejas quedan en NULL. Si esto NO cayera a `role`, desplegar el código
    // antes del backfill dejaría a todo admin sin privilegios.
    expect(rolesForUser({ role: 'admin', roles: [] })).toEqual(['admin']);
  });

  it('cae a role cuando roles es null (lo que la columna tiene de verdad sin migrar)', () => {
    expect(rolesForUser({ role: 'portfolio_lead', roles: null })).toEqual(['portfolio_lead']);
  });

  it('cae a role cuando roles ni siquiera viene', () => {
    expect(rolesForUser({ role: 'mentor' })).toEqual(['mentor']);
  });

  it('un admin sin migrar conserva TODOS sus permisos', () => {
    // La propiedad concreta que impide la purga silenciosa de privilegios.
    const perms = permissionsForRoles(rolesForUser({ role: 'admin', roles: null }));
    expect([...perms].sort()).toEqual([...ROLE_PERMISSIONS.admin].sort());
  });
});

describe('can', () => {
  it('responde true solo si el permiso está en el conjunto', () => {
    const perms = permissionsForRoles(['portfolio_lead']);
    expect(can(perms, 'portfolio:write')).toBe(true);
    expect(can(perms, 'users:assign-roles')).toBe(false);
  });

  it('un permiso desconocido es false, nunca true', () => {
    expect(can(permissionsForRoles(['admin']), 'no:existe' as Permission)).toBe(false);
  });
});
