/**
 * Public pilot-lead capture service (PRD-003 / SPEC-003 / ADR-015).
 *
 * Persists anonymous "interés en piloto" submissions, replacing the public
 * draft→project conversion funnel. Idempotent by `draftId` (a resend never
 * duplicates a lead). PII (email/phone) is persisted but never logged in clear;
 * the AuditLog `details` carries only ids/metadata.
 *
 * Dependency-injected over a minimal Prisma surface so the router tests stay
 * hermetic (no real DB), mirroring `PublicPdfService`.
 */
import { randomUUID } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError';
import { RETENTION_DAYS, type PilotLeadBody } from './pilot-lead.schemas';

export interface PilotLeadDTO {
  id: string;
  pilotCode: string;
  status: string;
  createdAt: string;
}

/**
 * What redeeming a pilotCode returns. Deliberately carries the PUBLIC proposal
 * (the one-pager, so the initiative can be resumed) + low-risk personalization
 * (name, organization), but NOT the contactable PII (email/phone): the pilotCode
 * is a short bearer token, so a public lookup must not become a PII-harvesting
 * oracle. The applicant re-confirms contact details on resume.
 */
export interface PilotResumeDTO {
  pilotCode: string;
  status: string;
  name: string;
  organization?: string | null;
  proposal: unknown;
  createdAt: string;
}

interface PilotLeadRecord {
  id: string;
  draftId: string;
  pilotCode: string;
  status: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  proposal?: unknown;
  createdAt: Date | string;
}

/** Minimal Prisma surface this service needs (DI-friendly, hermetic tests). */
export interface PilotLeadStore {
  pilotLead: {
    findUnique(
      args: { where: { draftId: string } | { pilotCode: string } },
    ): Promise<PilotLeadRecord | null>;
    create(args: { data: Record<string, unknown> }): Promise<PilotLeadRecord>;
  };
  auditLog: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
}

/**
 * Payload handed to the notifier. Unlike the AuditLog (which stays PII-free),
 * this DOES carry the lead's contact details: the team notification's purpose is
 * to let a human follow up — exactly what the lead consented to
 * ("…para contactarte sobre el primer piloto"). Recipients are a trusted
 * internal inbox (issue #54). Notifiers MUST still keep PII out of logs.
 */
export interface PilotLeadNotice {
  id: string;
  pilotCode: string;
  draftId: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
}
export type PilotLeadNotifier = (lead: PilotLeadNotice) => void | Promise<void>;

function createPilotCode(): string {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `ST-PILOT-${suffix}`;
}

function toDto(lead: PilotLeadRecord): PilotLeadDTO {
  const created = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
  return { id: lead.id, pilotCode: lead.pilotCode, status: lead.status, createdAt: created.toISOString() };
}

export class PilotLeadService {
  constructor(
    private readonly store: PilotLeadStore,
    private readonly notify: PilotLeadNotifier = () => undefined,
  ) {}

  async submit(
    input: PilotLeadBody,
    ctx: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<PilotLeadDTO> {
    if (input.consentAccepted !== true) {
      throw AppError.conflict(
        'Necesitamos tu consentimiento para contactarte sobre el primer piloto.',
        'PILOT_CONSENT_REQUIRED',
      );
    }

    // Idempotencia por draftId: un reenvío devuelve el lead existente.
    const existing = await this.store.pilotLead.findUnique({ where: { draftId: input.draftId } });
    if (existing) return toDto(existing);

    const now = new Date();
    const retentionUntil = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);

    let lead: PilotLeadRecord;
    try {
      lead = await this.store.pilotLead.create({
        data: {
          draftId: input.draftId,
          pilotCode: createPilotCode(),
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          organization: input.organization ?? null,
          consentAccepted: true,
          consentAt: now,
          status: 'submitted',
          source: 'public_landing',
          retentionUntil,
          // Persist the one-pager snapshot so the pilotCode can later be redeemed
          // to resume the initiative. Omit when absent (legacy/partial captures)
          // so the nullable Json column stays NULL without a Prisma null sentinel.
          ...(input.proposal ? { proposal: input.proposal } : {}),
        },
      });
    } catch (err) {
      // Concurrent identical submit → unique(draftId) violation (Prisma P2002).
      // Re-read and return the winner so the contract stays idempotent.
      if ((err as { code?: string })?.code === 'P2002') {
        const raced = await this.store.pilotLead.findUnique({ where: { draftId: input.draftId } });
        if (raced) return toDto(raced);
      }
      throw err;
    }

    // Audit — ids/metadata only, never the PII payload.
    await this.store.auditLog.create({
      data: {
        action: 'pilot.lead.captured',
        resource: 'PilotLead',
        resourceId: lead.id,
        details: { draftId: lead.draftId, pilotCode: lead.pilotCode, source: 'public_landing' },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });

    // Fire-and-forget notification (channel TBD — issue #54). Never blocks/throws
    // the user's submit on a notification failure.
    try {
      await this.notify({
        id: lead.id,
        pilotCode: lead.pilotCode,
        draftId: lead.draftId,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        organization: input.organization ?? null,
      });
    } catch {
      /* swallow: a notification failure must not fail lead capture */
    }

    return toDto(lead);
  }

  /**
   * Redeem a pilotCode to resume the initiative. Returns the persisted public
   * proposal + light personalization so the frontend can rehydrate the
   * one-pager. Unknown code → 404 PILOT_CODE_NOT_FOUND. Audited (non-PII).
   */
  async resume(
    pilotCode: string,
    ctx: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<PilotResumeDTO> {
    const lead = await this.store.pilotLead.findUnique({ where: { pilotCode } });
    if (!lead) {
      throw AppError.notFound('Código de postulación', 'PILOT_CODE_NOT_FOUND');
    }

    await this.store.auditLog.create({
      data: {
        action: 'pilot.lead.resumed',
        resource: 'PilotLead',
        resourceId: lead.id,
        details: { pilotCode: lead.pilotCode, hasProposal: lead.proposal != null },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });

    const created = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
    return {
      pilotCode: lead.pilotCode,
      status: lead.status,
      name: lead.name,
      organization: lead.organization ?? null,
      proposal: lead.proposal ?? null,
      createdAt: created.toISOString(),
    };
  }
}
