/**
 * backfill-challenge-team.ts — ADR-023 migration (issue #112).
 *
 * Backfills the DEPRECATED ChallengeSquadMember rows (free-text strings) into the new
 * ChallengeTeamMember model:
 *   - value            → label
 *   - value (if email) → userId, when it matches an existing User.email
 *   - role (free text) → TeamRole (OWNER | EDITOR | VIEWER)
 *
 * Idempotent / re-runnable: skips a squad row when a ChallengeTeamMember with the same
 * (challengeId, label) already exists. Safe to run repeatedly during the transition.
 *
 * Usage (from front/, where the prisma client + .env live):
 *   cd front && npx tsx ../backend/scripts/backfill-challenge-team.ts
 *
 * Deploy: run post-`prisma db push` (the schema change is additive — ADR-018).
 */
import { PrismaClient, TeamRole } from '@prisma/client';

const prisma = new PrismaClient();

/** Map a free-text squad role to the TeamRole enum. Defaults to VIEWER. */
function mapRole(value: string | null | undefined): TeamRole {
  const v = (value ?? '').toLowerCase().trim();
  if (v.includes('owner') || v.includes('líder') || v.includes('lider') || v.includes('propietario')) {
    return TeamRole.OWNER;
  }
  if (v.includes('editor') || v.includes('colaborador') || v.includes('contribu')) {
    return TeamRole.EDITOR;
  }
  return TeamRole.VIEWER;
}

const isEmail = (s: string | null | undefined): boolean => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function backfillChallengeTeam(): Promise<{ migrated: number; skipped: number; errors: number }> {
  const squad = await prisma.challengeSquadMember.findMany();
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of squad) {
    try {
      const existing = await prisma.challengeTeamMember.findFirst({
        where: { challengeId: m.challengeId, label: m.value },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }

      let userId: string | null = null;
      if (isEmail(m.value)) {
        const user = await prisma.user.findUnique({ where: { email: m.value }, select: { id: true } });
        userId = user?.id ?? null;
      }

      await prisma.challengeTeamMember.create({
        data: {
          challengeId: m.challengeId,
          userId,
          label: m.value,
          role: mapRole(m.role),
          status: 'ACTIVE',
        },
      });
      migrated++;
    } catch (err) {
      errors++;
      // eslint-disable-next-line no-console
      console.error(`  ✗ squad ${m.id} (challenge ${m.challengeId}, value="${m.value}"):`, err instanceof Error ? err.message : err);
    }
  }

  return { migrated, skipped, errors };
}

// Run directly (not when imported by a test).
if (process.argv[1] && process.argv[1].includes('backfill-challenge-team')) {
  backfillChallengeTeam()
    .then(({ migrated, skipped, errors }) => {
      // eslint-disable-next-line no-console
      console.log(`Backfill ChallengeTeamMember complete: migrated=${migrated}, skipped=${skipped}, errors=${errors}`);
      return prisma.$disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Fatal:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
