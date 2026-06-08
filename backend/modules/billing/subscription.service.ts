/**
 * SubscriptionService — subscription lifecycle driven by provider webhooks
 * (ADR-021). The single entry point is {@link applyProviderEvent}, which the
 * webhook controller calls with a verified, normalized {@link WebhookEvent}.
 *
 * Design invariants:
 *  - IDEMPOTENT (at-least-once delivery): every event is recorded once in
 *    UsageEvent keyed by the provider's eventId. A re-delivery hits the
 *    @unique(dedupeKey) constraint (Prisma P2002) and is dropped.
 *  - DETERMINISTIC mapping: event.type → target SubscriptionStatus. Unknown
 *    types are ignored (no state change).
 *  - NO-OP when the target equals the current status (re-delivery of a stale
 *    event, or a provider sending duplicate transitions).
 *
 * Dunning note (PRD-005): a `payment.failed` moves a subscription to PAST_DUE.
 * The PAST_DUE→EXPIRED escalation is NOT done here — it's a future scheduled
 * job (cron) that expires rows whose grace period elapsed. Functional
 * degradation to the Free plan is implicit: once a row is PAST_DUE/EXPIRED/
 * CANCELED, entitlement resolution stops treating it as the active paid plan
 * and falls through to Free (see entitlement.service.ts resolution order).
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import type { WebhookEvent } from './types';

/** The Subscription statuses this service can transition a row to. */
type TargetStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

/** Idempotency marker stored in UsageEvent. `feature` is a sentinel string. */
const BILLING_EVENT_FEATURE = 'billing_event';
const dedupeKeyFor = (eventId: string): string => `billing-event:${eventId}`;

/** Map a verified webhook type to the subscription status it drives. */
function targetStatusFor(type: WebhookEvent['type']): TargetStatus | null {
  switch (type) {
    case 'subscription.activated':
    case 'subscription.renewed':
      return 'ACTIVE';
    case 'payment.failed':
      return 'PAST_DUE';
    case 'subscription.canceled':
      return 'CANCELED';
    case 'subscription.expired':
      return 'EXPIRED';
    default:
      return null; // 'unknown' and any future-unhandled type → ignore.
  }
}

/** True when a Prisma "unique constraint failed" error is raised. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  );
}

export class SubscriptionService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Apply a verified provider event to the matching subscription, idempotently.
   * @returns {applied:true} only when a real status transition was written.
   */
  async applyProviderEvent(event: WebhookEvent): Promise<{ applied: boolean }> {
    // 1) Idempotency gate. Insert-or-fail keyed by the provider event id. If the
    //    row already exists (P2002), this event was already processed → drop it.
    try {
      await this.prisma.usageEvent.create({
        data: {
          feature: BILLING_EVENT_FEATURE,
          qty: 0,
          dedupeKey: dedupeKeyFor(event.eventId),
          sourceId: event.providerSubId ?? null,
        } as Prisma.UsageEventUncheckedCreateInput,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        logger.info({ eventId: event.eventId }, 'billing webhook re-delivery ignored');
        return { applied: false };
      }
      throw err;
    }

    // 2) Map the event to a target status. Unknown / unhandled → ignore.
    const target = targetStatusFor(event.type);
    if (!target) {
      logger.info({ eventId: event.eventId, type: event.type }, 'billing event ignored (no mapping)');
      return { applied: false };
    }

    // 3) Locate the subscription by provider ref. Without a providerSubId there
    //    is nothing to update.
    if (!event.providerSubId) {
      logger.warn({ eventId: event.eventId }, 'billing event missing providerSubId');
      return { applied: false };
    }
    const sub = await this.prisma.subscription.findFirst({
      where: { providerSubId: event.providerSubId },
    });
    if (!sub) {
      logger.warn(
        { eventId: event.eventId, providerSubId: event.providerSubId },
        'billing event for unknown subscription',
      );
      return { applied: false };
    }

    // 4) No-op when the row is already in the target state (stale/duplicate).
    if (sub.status === target) {
      logger.info(
        { subscriptionId: sub.id, status: target },
        'billing event no-op (status unchanged)',
      );
      return { applied: false };
    }

    // 5) Apply the transition. Stamp canceledAt on cancellation.
    const data: Prisma.SubscriptionUpdateInput = { status: target };
    if (target === 'CANCELED') {
      data.canceledAt = new Date();
    }

    await this.prisma.subscription.update({ where: { id: sub.id }, data });

    logger.info(
      { subscriptionId: sub.id, from: sub.status, to: target },
      'subscription status transitioned',
    );
    return { applied: true };
  }
}
