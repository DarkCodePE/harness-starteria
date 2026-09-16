/**
 * permissions.ts (frontend) — ADR-029.
 *
 * El frontend NO deriva permisos: los recibe ya derivados del backend, en el
 * payload del usuario. Aquí sólo vive el VOCABULARIO (los literales) y el `can`.
 *
 * Es deliberado. La tabla rol→permiso es superficie de seguridad y vive en un
 * único sitio (`backend/shared/authz/permissions.ts`). Duplicarla aquí repetiría
 * exactamente el defecto que ADR-028 denunció: la misma regla en dos archivos que
 * no se enteran el uno del otro.
 *
 * Si esta lista se quedara corta respecto al backend, `can` devuelve `false` para
 * el permiso que falta: el fallo es CERRADO (se oculta algo que debería verse),
 * nunca abierto. Y el servidor sigue siendo quien autoriza de verdad: lo de aquí
 * decide qué se PINTA, no a qué se accede.
 */
export const PERMISSIONS = [
  'portfolio:write',
  'portfolio:read',
  'users:assign-roles',
  'cohort:manage',
  'mentor:panel',
  'sponsor:decide',
  'sponsor:manage',
  'project:own',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** ¿El usuario tiene este permiso? Sin sesión (o sin permisos) es `false`. */
export function can(
  user: { permissions?: readonly string[] | null } | null | undefined,
  permission: Permission,
): boolean {
  return !!user?.permissions?.includes(permission);
}
