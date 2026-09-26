import type { PrismaClient } from '@prisma/client';

export type StrategicFramingPromotionSummary = {
  promotionId: string;
  challengeCandidateId: string;
  challengeId: string;
  challengeTitle: string | null;
  strategicFrontId: string;
  status: string;
  promotedAt: string;
};

export class StrategicFramingPromotionReadService {
  constructor(private readonly prisma: PrismaClient) {}

  async listForState(stateId: string): Promise<StrategicFramingPromotionSummary[]> {
    const rows = await (this.prisma as any).strategicFramingPromotion.findMany({
      where: { stateId },
      select: { id: true, challengeCandidateId: true, challengeId: true, strategicFrontId: true, status: true, promotedAt: true },
      orderBy: { promotedAt: 'asc' },
    });
    return Promise.all(rows.map(async (row: any) => ({
      promotionId: row.id,
      challengeCandidateId: row.challengeCandidateId,
      challengeId: row.challengeId,
      challengeTitle: (await (this.prisma as any).challenge.findUnique({ where: { id: row.challengeId }, select: { title: true } }))?.title ?? null,
      strategicFrontId: row.strategicFrontId,
      status: String(row.status).toLowerCase(),
      promotedAt: new Date(row.promotedAt).toISOString(),
    })));
  }
}
