import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { PrismaPortfolioEntryIdempotencyRepository } from '../infrastructure/prisma-portfolio-entry-idempotency.repository';

const describeIntegration = process.env.PORTFOLIO_ENTRY_DB_INTEGRATION === '1' ? describe : describe.skip;
const prisma = new PrismaClient();

describeIntegration('PrismaPortfolioEntryIdempotencyRepository', () => {
  afterEach(async () => {
    await prisma.portfolioEntryApiIdempotency.deleteMany({
      where: { operation: { startsWith: 'test_' } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores active idempotency records and replays safe response snapshots', async () => {
    const repository = new PrismaPortfolioEntryIdempotencyRepository(prisma);
    const expiresAt = new Date(Date.now() + 60_000);

    const created = await repository.create({
      operation: 'test_submit_message',
      scope: 'session-1',
      sessionId: 'session-1',
      idempotencyKey: 'idem-1',
      requestPayloadHash: 'payload-hash',
      expiresAt,
    });
    await repository.complete({
      id: created.id,
      responseSnapshot: { session: { id: 'session-1', revision: 2 }, publicAccessToken: undefined },
    });

    const replay = await repository.findActive('test_submit_message', 'session-1', 'idem-1', new Date());
    expect(replay).toMatchObject({
      operation: 'test_submit_message',
      scope: 'session-1',
      requestPayloadHash: 'payload-hash',
      status: 'COMPLETED',
    });
    expect(replay?.responseSnapshot).toMatchObject({ session: { id: 'session-1', revision: 2 } });
  });
});
