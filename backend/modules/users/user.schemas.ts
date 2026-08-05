import { z } from 'zod';
import { PLATFORM_ROLES } from '../../shared/types/user.types';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  skills: z.array(z.string()).optional(),
  initials: z.string().length(2).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['Owner', 'Editor', 'Viewer']).default('Editor'),
  name: z.string().min(2).max(100).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['Owner', 'Editor', 'Viewer']),
});

/**
 * ADR-028: asignación de rol de PLATAFORMA (los siete de `PLATFORM_ROLES`).
 * No confundir con `updateMemberRoleSchema`, que es el rol de PROYECTO
 * (`Owner | Editor | Viewer`) y vive en otro eje.
 */
export const updatePlatformRoleSchema = z.object({
  role: z.enum(PLATFORM_ROLES),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePlatformRoleInput = z.infer<typeof updatePlatformRoleSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
