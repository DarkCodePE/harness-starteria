/**
 * permissions.ts — catálogo de permisos y derivación rol→permiso (ADR-029).
 *
 * FUENTE ÚNICA de la autorización de plataforma. Los guards preguntan por
 * capacidad (`portfolio:write`), no por identidad (`eres portfolio_lead`), y
 * un usuario con varios roles obtiene la UNIÓN de sus permisos — que es lo
 * único que permite pertenecer a las dos superficies con un solo login.
 *
 * Esta tabla vive en CÓDIGO, no en base de datos: cambiarla no migra nada y
 * aplica en la siguiente petición, sin esperar a que expiren los tokens vivos.
 *
 * El eje de PROYECTO no se toca aquí: lo resuelve `requireProjectAccess` por
 * membresía de equipo (ADR-023). Son dos ejes ortogonales, a propósito.
 */
import { PLATFORM_ROLES, type Role } from '../types/user.types';

/**
 * Catálogo cerrado. Cada permiso existe porque hay una ruta real que lo
 * necesita — no se declaran permisos especulativos, que sólo servirían para
 * conceder algo sin que nadie lo haya decidido.
 */
export const ALL_PERMISSIONS = [
  /** Escribir la capa estratégica: frentes, retos, meta de iniciativas, squads, executive outputs. */
  'portfolio:write',
  /**
   * Leer la capa estratégica.
   *
   * DEUDA DECLARADA (ADR-028, heredada por ADR-029): las 7 rutas GET de
   * portfolio siguen SIN gate. El permiso se define para que la deuda tenga
   * dónde aterrizar, pero aplicarlo hoy rompería a los participantes, porque
   * `AppLayout` llama `getInitiativeMeta` para todo autenticado. Issue #161.
   */
  'portfolio:read',
  /** Asignar roles de plataforma. El permiso más sensible: concede privilegios. */
  'users:assign-roles',
  /** Administrar cohortes. */
  'cohort:manage',
  /** Panel de mentor. */
  'mentor:panel',
  /** Aprobar o rechazar checkpoints de sponsor. */
  'sponsor:decide',
  /** Administrar la configuración de sponsors. */
  'sponsor:manage',
  /** Crear y llevar iniciativas propias. El permiso base de todo participante. */
  'project:own',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

/**
 * Tabla de derivación.
 *
 * No hay centinela `'*'`: cada rol enumera sus permisos. Con un centinela, cada
 * sitio de chequeo tendría que conocerlo (`perms.has('*') || perms.has(p)`) y
 * bastaría con que uno lo olvidara para abrir un agujero; enumerando, `can` es
 * pertenencia a un set y no hay caso especial que olvidar.
 *
 * `viewer` no recibe permisos de PLATAFORMA a propósito: lo que puede ver lo
 * decide `requireProjectAccess` sobre cada proyecto concreto.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  participante: ['project:own'],
  colaborador: ['project:own'],
  viewer: [],
  mentor: ['mentor:panel'],
  sponsor: ['sponsor:decide'],
  portfolio_lead: ['portfolio:read', 'portfolio:write'],

  /**
   * El admin se enumera, NO recibe `ALL_PERMISSIONS`.
   *
   * ADR-029 asumía que "admin puede todo" era fiel al comportamiento de hoy. No lo
   * es: `PATCH /sponsor/checkpoints/:id/respond` está gateado con
   * `requireRole('sponsor')` y EXCLUYE al admin a propósito — responder un
   * checkpoint es la decisión del sponsor, y el admin tiene su propia ruta
   * `/skip` para saltarlo. Son dos actos de gobierno distintos.
   *
   * Darle el catálogo entero habría colado ese cambio de política dentro de una
   * migración que sólo debía cambiar CÓMO se decide. Enumerar cuesta una línea por
   * permiso nuevo y, a cambio, conceder algo al admin vuelve a ser una decisión
   * explícita en vez de un efecto secundario.
   */
  admin: [
    'portfolio:read',
    'portfolio:write',
    'users:assign-roles',
    'cohort:manage',
    'mentor:panel',
    'sponsor:manage',
    'project:own',
    // 'sponsor:decide' NO: ver arriba.
  ],
};

const CONOCIDOS = new Set<string>(PLATFORM_ROLES);

/**
 * Permisos efectivos de un conjunto de roles: la UNIÓN.
 *
 * La unión (y no un "rol principal" ni el último que gana) es la decisión
 * central de ADR-029. Es monótona: sumar un rol nunca quita un permiso, así
 * que conceder portafolio no puede revocar participante.
 *
 * Un rol desconocido —de un token viejo o de un valor retirado del enum— se
 * ignora en vez de lanzar: falla cerrado. Lanzar convertiría un dato raro en
 * un 500 en cada petición de ese usuario.
 */
export function permissionsForRoles(roles: readonly Role[]): Set<Permission> {
  const efectivos = new Set<Permission>();

  for (const role of roles) {
    if (!CONOCIDOS.has(role)) continue;
    for (const permiso of ROLE_PERMISSIONS[role]) efectivos.add(permiso);
  }

  return efectivos;
}

/** ¿El conjunto de permisos incluye este? Pertenencia simple, sin casos especiales. */
export function can(permisos: ReadonlySet<Permission>, permiso: Permission): boolean {
  return permisos.has(permiso);
}

/**
 * Roles efectivos de un usuario durante la FASE 1 de ADR-029.
 *
 * `roles` es la fuente de verdad; `role` es el respaldo mientras existan filas sin
 * migrar. Un `roles` vacío significa exactamente "esta fila es anterior al backfill"
 * (por eso la columna no lleva `@default`: un default la volvería indistinguible de
 * un participante real), así que caer a `role` es correcto y no adivina nada.
 *
 * El efecto importante: el orden de despliegue deja de ser una condición de
 * corrección. Si el código nuevo llega antes que el backfill, nadie pierde
 * privilegios — simplemente se sigue leyendo el escalar.
 *
 * DESAPARECE EN LA FASE 2, junto con la columna `role` (issue #160).
 */
export function rolesForUser(user: { role: Role; roles?: readonly Role[] | null }): readonly Role[] {
  return user.roles && user.roles.length > 0 ? user.roles : [user.role];
}
