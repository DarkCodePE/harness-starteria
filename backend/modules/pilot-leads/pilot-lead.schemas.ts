/**
 * Zod contract for the PUBLIC (no-auth) pilot-lead capture surface.
 * PRD-003 / SPEC-003 / ADR-015. PII fields (email, phone) validated at the
 * boundary; `consentAccepted` is required true (enforced in the service so the
 * rejection carries a stable PILOT_CONSENT_REQUIRED code).
 */
import { z } from 'zod';

/** Retention horizon for captured PII leads (ADR-015 §Compliance, proposal). */
export const RETENTION_DAYS = 180;

export const pilotLeadBodySchema = z.object({
  draftId: z.string().trim().min(1, 'Falta el identificador del borrador.').max(200),
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200),
  email: z.string().trim().email('Correo electrónico inválido.').max(320),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(200).optional(),
  consentAccepted: z.boolean(),
});

export type PilotLeadBody = z.infer<typeof pilotLeadBodySchema>;
