/**
 * subscription.service.test.ts — TASK-018 (issue #79) lifecycle + idempotency.
 *
 * Uses a hand-rolled Prisma fake (no DB). Asserts the ADR-021 invariants:
 *  - activated/renewed → ACTIVE; payment.failed → PAST_DUE; canceled → CANCELED
 *  - no-op when the row already holds the target status
 *  - re-delivered eventId (UsageEvent.create throws P2002) → {applied:false}
 *  - unknown subscription / unknown event type / missing providerSubId → {applied:false}
 *  - canceledAt is stamped on CANCELED
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionService } from '../subscription.service';
import type { WebhookEvent } from '../types';

type SubStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

interface SubRow {
  id: string;
  providerSubId: string | null;
  status: SubStatus;
  canceledAt: Date | null;
}

/**
 * Minimal Prisma fake. `seenDedupe` simulates the @unique(dedupeKey) constraint
 * on UsageEvent: a second create with the same key throws a P2002-shaped error.
 */
function buildFakePrisma(subs: SubRow[]) {
  const rows = subs.map((s) => ({ ...s }));
  const seenDedupe = new Set<string>();

  const usageCreate = vi.fn(async ({ data }: { data: { dedupeKey: string } }) => {
    if (seenDedupe.has(data.dedupeKey)) {
      const err = new Error('Unique constraint failed') as Error & { code: string };
      err.code = 'P2002';
      throw err;
    }
    seenDedupe.add(data.dedupeKey);
    return { id: `ue-${seenDedupe.size}`, ...data };
  });

  const subUpdate = vi.fn(
    async ({ where, data }: { where: { id: string }; data: Partial<SubRow> }) => {
      const idx = rows.findIndex((r) => r.id === where.id);
      if (idx < 0) throw new Error('row not found');
      rows[idx] = { ...rows[idx], ...data };
      return rows[idx];
    },
  );

  const fake = {
    usageEvent: { create: usageCreate },
    subscription: {
      findFirst: async ({ where }: { where: { providerSubId?: string } }) =>
        rows.find((r) => r.providerSubId === where.providerSubId) ?? null,
      update: subUpdate,
    },
  };

  return { fake, rows, usageCreate, subUpdate };
}

function makeEvent(over: Partial<WebhookEvent> = {}): WebhookEvent {
  return {
    eventId: 'evt-1',
    type: 'subscription.activated',
    providerSubId: 'sub-ext-1',
    ...over,
  };
}

function makeService(subs: SubRow[]) {
  const fp = buildFakePrisma(subs);
  const service = new SubscriptionService(fp.fake as never);
  return { service, ...fp };
}

describe('SubscriptionService.applyProviderEvent — TASK-018 lifecycle', () => {
  let trialing: SubRow;

  beforeEach(() => {
    trialing = { id: 'sub-1', providerSubId: 'sub-ext-1', status: 'TRIALING', canceledAt: null };
  });

  it('maps subscription.activated → ACTIVE and applies', async () => {
    const { service, rows, subUpdate } = makeService([trialing]);

    const res = await service.applyProviderEvent(makeEvent({ type: 'subscription.activated' }));

    expect(res).toEqual({ applied: true });
    expect(rows[0].status).toBe('ACTIVE');
    expect(subUpdate).toHaveBeenCalledOnce();
  });

  it('maps subscription.renewed → ACTIVE', async () => {
    const pastDue: SubRow = { ...trialing, status: 'PAST_DUE' };
    const { service, rows } = makeService([pastDue]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-renew', type: 'subscription.renewed' }),
    );

    expect(res).toEqual({ applied: true });
    expect(rows[0].status).toBe('ACTIVE');
  });

  it('maps payment.failed → PAST_DUE', async () => {
    const active: SubRow = { ...trialing, status: 'ACTIVE' };
    const { service, rows } = makeService([active]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-fail', type: 'payment.failed' }),
    );

    expect(res).toEqual({ applied: true });
    expect(rows[0].status).toBe('PAST_DUE');
  });

  it('maps subscription.canceled → CANCELED and stamps canceledAt', async () => {
    const active: SubRow = { ...trialing, status: 'ACTIVE' };
    const { service, rows } = makeService([active]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-cancel', type: 'subscription.canceled' }),
    );

    expect(res).toEqual({ applied: true });
    expect(rows[0].status).toBe('CANCELED');
    expect(rows[0].canceledAt).toBeInstanceOf(Date);
  });

  it('maps subscription.expired → EXPIRED', async () => {
    const pastDue: SubRow = { ...trialing, status: 'PAST_DUE' };
    const { service, rows } = makeService([pastDue]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-exp', type: 'subscription.expired' }),
    );

    expect(res).toEqual({ applied: true });
    expect(rows[0].status).toBe('EXPIRED');
  });

  it('is a no-op when the subscription is already in the target status', async () => {
    const active: SubRow = { ...trialing, status: 'ACTIVE' };
    const { service, rows, subUpdate } = makeService([active]);

    const res = await service.applyProviderEvent(makeEvent({ type: 'subscription.activated' }));

    expect(res).toEqual({ applied: false });
    expect(rows[0].status).toBe('ACTIVE');
    expect(subUpdate).not.toHaveBeenCalled();
  });

  it('drops a re-delivered event (P2002 on the idempotency insert)', async () => {
    const { service, subUpdate } = makeService([trialing]);

    const first = await service.applyProviderEvent(makeEvent());
    const second = await service.applyProviderEvent(makeEvent()); // same eventId

    expect(first).toEqual({ applied: true });
    expect(second).toEqual({ applied: false });
    // Only the first delivery wrote a transition.
    expect(subUpdate).toHaveBeenCalledOnce();
  });

  it('returns {applied:false} when the subscription is not found', async () => {
    const { service, subUpdate } = makeService([trialing]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-missing', providerSubId: 'does-not-exist' }),
    );

    expect(res).toEqual({ applied: false });
    expect(subUpdate).not.toHaveBeenCalled();
  });

  it('ignores an unknown event type (no transition)', async () => {
    const { service, subUpdate } = makeService([trialing]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-unknown', type: 'unknown' }),
    );

    expect(res).toEqual({ applied: false });
    expect(subUpdate).not.toHaveBeenCalled();
  });

  it('returns {applied:false} when the event has no providerSubId', async () => {
    const { service, subUpdate } = makeService([trialing]);

    const res = await service.applyProviderEvent(
      makeEvent({ eventId: 'evt-no-sub', providerSubId: undefined }),
    );

    expect(res).toEqual({ applied: false });
    expect(subUpdate).not.toHaveBeenCalled();
  });

  it('rethrows non-P2002 errors from the idempotency insert', async () => {
    const { service, usageCreate } = makeService([trialing]);
    usageCreate.mockRejectedValueOnce(new Error('db down'));

    await expect(service.applyProviderEvent(makeEvent())).rejects.toThrow('db down');
  });
});
