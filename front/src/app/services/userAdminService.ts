/**
 * userAdminService.ts — administración de roles de plataforma (ADR-029).
 *
 * Habla con `GET /users` y `PATCH /users/:id/role`, ambos gateados en el servidor
 * con `users:assign-roles`. El cliente NO decide quién puede: pinta u oculta, y el
 * backend autoriza.
 */
import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Los 7 roles de plataforma, en el orden en que se muestran. */
export const PLATFORM_ROLES = [
  'participante',
  'colaborador',
  'viewer',
  'mentor',
  'sponsor',
  'portfolio_lead',
  'admin',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const ROLE_LABELS: Record<PlatformRole, string> = {
  participante: 'Participante',
  colaborador: 'Colaborador',
  viewer: 'Observador',
  mentor: 'Mentor',
  sponsor: 'Sponsor',
  portfolio_lead: 'Portfolio Lead',
  admin: 'Administrador',
};

/** Qué desbloquea cada rol, en lenguaje de producto y no de permisos. */
export const ROLE_HINTS: Record<PlatformRole, string> = {
  participante: 'Crea y lleva sus propias iniciativas.',
  colaborador: 'Trabaja en iniciativas de otros.',
  viewer: 'Sólo lectura; su acceso lo decide cada proyecto.',
  mentor: 'Panel de revisiones y acompañamiento.',
  sponsor: 'Responde los checkpoints que se le asignan.',
  portfolio_lead: 'Capa estratégica: frentes, retos y decisiones de portafolio.',
  admin: 'Administra la plataforma. No responde checkpoints de sponsor.',
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /** Rol primario — etiqueta, no autorización. */
  role: PlatformRole;
  /** El conjunto: es lo que autoriza y lo que esta pantalla edita. */
  roles: PlatformRole[];
  initials: string;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<ApiResponse<AdminUser[]>>('/users');
  return data.data;
}

/**
 * Reemplaza el CONJUNTO de roles del usuario.
 *
 * Se envía `roles` (no `role`): mandar el escalar dejaría al usuario con un único
 * rol y volvería a producir el bug que ADR-029 arregla.
 */
export async function updateUserRoles(userId: string, roles: PlatformRole[]): Promise<AdminUser> {
  const { data } = await api.patch<ApiResponse<AdminUser>>(`/users/${userId}/role`, { roles });
  return data.data;
}
