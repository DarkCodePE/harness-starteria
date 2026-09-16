/**
 * Roles de plataforma (ADR-009, ampliado a siete por ADR-028).
 *
 * Fuente única: el union se deriva de esta lista y los validadores Zod la consumen,
 * en vez de repetir los literales. Debe seguir en paralelo al `enum Role` de
 * `front/prisma/schema.prisma`.
 */
export const PLATFORM_ROLES = [
  'participante',
  'mentor',
  'admin',
  'sponsor',
  'colaborador',
  'viewer',
  'portfolio_lead',
] as const;

export type Role = (typeof PLATFORM_ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  skills: string[];
  cohort?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  status: 'Activo' | 'Pendiente';
  initials: string;
}
