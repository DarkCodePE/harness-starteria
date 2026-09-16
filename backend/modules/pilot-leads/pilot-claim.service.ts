/**
 * Pilot claim service (ADR-018).
 *
 * `issue(pilotCode)` mints a single-use, server-stored claim token bound to the
 * lead and returns ONLY non-PII personalization (name/organization/proposal) —
 * never email/phone, so the short code never becomes a PII oracle.
 *
 * `consume(rawToken, user)` validates+consumes the token (single-use) and
 * imports the lead's proposal into a Project owned by the authenticated user.
 * Idempotent: a given lead produces at most one Project.
 *
 * DI over a minimal Prisma surface + a project-creation callback keeps tests
 * hermetic (no real DB), mirroring PilotLeadService.
 */
import { randomBytes } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError';
import { hashRefreshToken } from '../auth/token.service';
import { CLAIM_TTL_MS } from './pilot-claim.schemas';

export interface PilotLeadRow {
  id: string;
  pilotCode: string;
  name: string;
  organization?: string | null;
  proposal?: unknown;
  retentionUntil?: Date | string | null;
}

interface ClaimRow {
  tokenHash: string;
  pilotLeadId: string;
  expiresAt: Date | string;
  consumedAt?: Date | string | null;
  createdProjectId?: string | null;
}

interface ProjectRow {
  id: string;
}

export interface PilotClaimStore {
  pilotLead: {
    findUnique(args: { where: { pilotCode: string } | { id: string } }): Promise<PilotLeadRow | null>;
  };
  pilotClaimToken: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    findUnique(args: { where: { tokenHash: string } }): Promise<ClaimRow | null>;
    update(args: { where: { tokenHash: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
  project: {
    // findFirst (not findUnique): pilotLeadId is a plain index, not a unique key.
    findFirst(args: { where: { pilotLeadId: string } }): Promise<ProjectRow | null>;
  };
  auditLog: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
}

/** Creates the Project for the authenticated user from the lead's proposal → projectId. */
export type PilotProjectCreator = (
  userId: string,
  role: string,
  lead: PilotLeadRow,
) => Promise<string>;

export interface PilotClaimIssueDTO {
  claimToken: string;
  expiresAt: string;
  name: string;
  organization: string | null;
  proposal: unknown;
  hasProposal: boolean;
}

export interface PilotClaimConsumeDTO {
  projectId: string;
  alreadyExisted: boolean;
}

type Ctx = { ipAddress?: string; userAgent?: string };

export class PilotClaimService {
  constructor(
    private readonly store: PilotClaimStore,
    private readonly createProject: PilotProjectCreator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Mint a claim token for a redeemed pilot code. Returns NO contact PII. */
  async issue(pilotCode: string, ctx: Ctx = {}): Promise<PilotClaimIssueDTO> {
    const lead = await this.store.pilotLead.findUnique({ where: { pilotCode } });
    // Byte-identical to resume()'s 404 so this adds no oracle the resume route lacked.
    if (!lead) throw AppError.notFound('Código de postulación', 'PILOT_CODE_NOT_FOUND');

    if (lead.retentionUntil && new Date(lead.retentionUntil).getTime() < this.now().getTime()) {
      throw new AppError(410, 'Tu código de postulación expiró.', 'PILOT_RETENTION_EXPIRED');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashRefreshToken(rawToken);
    // If a project already exists for this lead, pre-bind it so consume short-circuits.
    const existingProject = await this.store.project.findFirst({ where: { pilotLeadId: lead.id } });
    const expiresAt = new Date(this.now().getTime() + CLAIM_TTL_MS);

    await this.store.pilotClaimToken.create({
      data: { tokenHash, pilotLeadId: lead.id, expiresAt, createdProjectId: existingProject?.id ?? null },
    });
    await this.store.auditLog.create({
      data: {
        action: 'pilot.claim.issued',
        resource: 'PilotLead',
        resourceId: lead.id,
        details: { pilotCode: lead.pilotCode, hasProposal: lead.proposal != null },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });

    return {
      claimToken: rawToken,
      expiresAt: expiresAt.toISOString(),
      name: lead.name,
      organization: lead.organization ?? null,
      proposal: lead.proposal ?? null,
      hasProposal: lead.proposal != null,
    };
  }

  /** Consume a claim (post-auth) → create/return the user's Project. Single-use + idempotent. */
  async consume(
    rawToken: string,
    user: { id: string; role: string },
    ctx: Ctx = {},
  ): Promise<PilotClaimConsumeDTO> {
    const tokenHash = hashRefreshToken(rawToken);
    const claim = await this.store.pilotClaimToken.findUnique({ where: { tokenHash } });
    if (!claim) throw AppError.notFound('Solicitud de continuación', 'PILOT_CLAIM_NOT_FOUND');

    // Already produced a project → idempotent return (covers double-submit / retried token).
    if (claim.createdProjectId) {
      return { projectId: claim.createdProjectId, alreadyExisted: true };
    }

    if (new Date(claim.expiresAt).getTime() < this.now().getTime()) {
      throw new AppError(410, 'Tu enlace de continuación expiró. Vuelve a ingresar tu código.', 'PILOT_CLAIM_EXPIRED');
    }

    // A project may already exist for this lead via another claim → reuse it.
    const existing = await this.store.project.findFirst({ where: { pilotLeadId: claim.pilotLeadId } });
    if (existing) {
      await this.store.pilotClaimToken.update({
        where: { tokenHash },
        data: { consumedAt: this.now(), createdProjectId: existing.id },
      });
      return { projectId: existing.id, alreadyExisted: true };
    }

    const lead = await this.store.pilotLead.findUnique({ where: { id: claim.pilotLeadId } });
    if (!lead) throw AppError.notFound('Código de postulación', 'PILOT_CODE_NOT_FOUND');

    const projectId = await this.createProject(user.id, user.role, lead);

    await this.store.pilotClaimToken.update({
      where: { tokenHash },
      data: { consumedAt: this.now(), createdProjectId: projectId },
    });
    await this.store.auditLog.create({
      data: {
        action: 'pilot.claim.consumed',
        resource: 'Project',
        resourceId: projectId,
        details: { pilotLeadId: lead.id, userId: user.id },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });

    return { projectId, alreadyExisted: false };
  }
}
