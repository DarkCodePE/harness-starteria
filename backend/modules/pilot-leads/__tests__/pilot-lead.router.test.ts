/**
 * Contract tests for the PUBLIC (no-auth) pilot-lead capture surface.
 * PRD-003 / SPEC-003 / ADR-015.
 *
 * Hermetic: the Prisma surface is an in-memory fake (no real DB), mirroring the
 * dependency-injection style of public-pdf.router.test.ts. Locks:
 *   - happy path → 201 { id, pilotCode, status, createdAt }, lead persisted
 *   - 409 PILOT_CONSENT_REQUIRED when consent is not accepted
 *   - 422 when email is invalid (Zod boundary)
 *   - idempotency by draftId (resend never duplicates → create called once)
 *   - AuditLog carries ids/metadata only — never the PII payload
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

import { PilotLeadService, type PilotLeadStore } from '../pilot-lead.service';
import { buildPilotLeadRouter } from '../pilot-lead.router';
import { errorHandler } from '../../../shared/errors/error-handler';

interface Row {
  id: string;
  draftId: string;
  pilotCode: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  consentAccepted: boolean;
  consentAt: Date;
  status: string;
  source: string;
  retentionUntil: Date;
  createdAt: Date;
}

function makeStore() {
  const rows: Row[] = [];
  const audits: Array<Record<string, unknown>> = [];
  let seq = 0;
  const store: PilotLeadStore = {
    pilotLead: {
      findUnique: vi.fn(async ({ where }) => rows.find(r => r.draftId === where.draftId) ?? null),
      create: vi.fn(async ({ data }) => {
        const row = { id: `lead-${++seq}`, createdAt: new Date('2026-05-29T12:00:00Z'), ...(data as object) } as Row;
        rows.push(row);
        return row;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }) => {
        audits.push(data as Record<string, unknown>);
        return data;
      }),
    },
  };
  return { store, rows, audits };
}

function makeApp(store: PilotLeadStore, notify = vi.fn()) {
  const service = new PilotLeadService(store, notify);
  const app = express();
  app.use(express.json());
  // High rate-limit cap so tests never trip the limiter.
  app.use('/api/v1/public/pilot-leads', buildPilotLeadRouter(service, { maxRequests: 1000 }));
  app.use(errorHandler);
  return { app, notify };
}

const VALID = {
  draftId: 'draft-pilot-1',
  name: 'Ana Rodríguez',
  email: 'ana@example.com',
  phone: '+51 999 888 777',
  organization: 'Efectiva',
  consentAccepted: true,
};

describe('POST /api/v1/public/pilot-leads', () => {
  let ctx: ReturnType<typeof makeStore>;
  beforeEach(() => {
    ctx = makeStore();
  });

  it('persists a valid lead and returns 201 with id/pilotCode/status', async () => {
    const { app } = makeApp(ctx.store);
    const res = await request(app).post('/api/v1/public/pilot-leads').send(VALID);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.pilotCode).toMatch(/^ST-PILOT-[0-9A-Z]{4}$/);
    expect(res.body.data.status).toBe('submitted');
    expect(typeof res.body.data.createdAt).toBe('string');

    expect(ctx.rows).toHaveLength(1);
    expect(ctx.rows[0].consentAccepted).toBe(true);
    expect(ctx.rows[0].consentAt).toBeInstanceOf(Date);
    expect(ctx.rows[0].retentionUntil.getTime()).toBeGreaterThan(ctx.rows[0].consentAt.getTime());
  });

  it('rejects without consent → 409 PILOT_CONSENT_REQUIRED, nothing persisted', async () => {
    const { app } = makeApp(ctx.store);
    const res = await request(app)
      .post('/api/v1/public/pilot-leads')
      .send({ ...VALID, consentAccepted: false });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('PILOT_CONSENT_REQUIRED');
    expect(ctx.rows).toHaveLength(0);
  });

  it('rejects an invalid email → 400 (Zod boundary)', async () => {
    const { app } = makeApp(ctx.store);
    const res = await request(app)
      .post('/api/v1/public/pilot-leads')
      .send({ ...VALID, email: 'not-an-email' });

    // Codebase convention: ZodError → 400 VALIDATION_ERROR (central handler).
    expect(res.status).toBe(400);
    expect(ctx.rows).toHaveLength(0);
  });

  it('is idempotent by draftId — a resend returns the same lead, creates once', async () => {
    const { app } = makeApp(ctx.store);
    const first = await request(app).post('/api/v1/public/pilot-leads').send(VALID);
    const second = await request(app).post('/api/v1/public/pilot-leads').send(VALID);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(second.body.data.pilotCode).toBe(first.body.data.pilotCode);
    expect(ctx.store.pilotLead.create).toHaveBeenCalledTimes(1);
    expect(ctx.rows).toHaveLength(1);
  });

  it('writes an AuditLog with ids/metadata only — no PII (email/phone/name)', async () => {
    const { app } = makeApp(ctx.store);
    await request(app).post('/api/v1/public/pilot-leads').send(VALID);

    expect(ctx.audits).toHaveLength(1);
    const audit = ctx.audits[0];
    expect(audit.action).toBe('pilot.lead.captured');
    expect(audit.resource).toBe('PilotLead');
    const serialized = JSON.stringify(audit);
    expect(serialized).not.toContain(VALID.email);
    expect(serialized).not.toContain(VALID.phone);
    expect(serialized).not.toContain(VALID.name);
  });

  it('fires the notifier with non-PII metadata on success', async () => {
    const notify = vi.fn();
    const { app } = makeApp(ctx.store, notify);
    await request(app).post('/api/v1/public/pilot-leads').send(VALID);

    expect(notify).toHaveBeenCalledTimes(1);
    const arg = notify.mock.calls[0][0];
    expect(arg.pilotCode).toMatch(/^ST-PILOT-/);
    expect(arg).not.toHaveProperty('email');
  });
});
