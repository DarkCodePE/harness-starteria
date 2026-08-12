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
 * `admin` recibe el catálogo EXPANDIDO en vez de un centinela `'*'`. Con un
 * centinela, cada sitio de chequeo tendría que conocerlo
 * (`perms.has('*') || perms.has(p)`) y bastaría con que uno lo olvidara para
 * abrir un agujero; expandiéndolo, `can` es pertenencia a un set y no hay caso
 * especial que olvidar. El precio —que un permiso nuevo se le concede al admin
 * sin decisión explícita— queda registrado en ADR-029 §Consecuencias.
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
  admin: ALL_PERMISSIONS,
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
