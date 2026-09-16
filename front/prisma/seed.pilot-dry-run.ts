import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_HASH = '$2b$12$kbkpUcaftAa.43pNHcFSoO24/pHvJAJSixTO1gTlR0pzovdD8beZG'; // demo123
export const PILOT_DRY_RUN_ORG_ID = 'org-pilot-dry-run';
export const PILOT_DRY_RUN_OTHER_ORG_ID = 'org-pilot-dry-run-other';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run pilot dry-run seed in production.');
  }

  const organization = await prisma.organization.upsert({
    where: { id: PILOT_DRY_RUN_ORG_ID },
    update: { name: 'Starteria Pilot Dry Run', slug: 'starteria-pilot-dry-run', seatLimit: 8 },
    create: {
      id: PILOT_DRY_RUN_ORG_ID,
      name: 'Starteria Pilot Dry Run',
      slug: 'starteria-pilot-dry-run',
      seatLimit: 8,
    },
  });

  const otherOrganization = await prisma.organization.upsert({
    where: { id: PILOT_DRY_RUN_OTHER_ORG_ID },
    update: { name: 'Starteria Pilot Dry Run Other Org', slug: 'starteria-pilot-dry-run-other', seatLimit: 3 },
    create: {
      id: PILOT_DRY_RUN_OTHER_ORG_ID,
      name: 'Starteria Pilot Dry Run Other Org',
      slug: 'starteria-pilot-dry-run-other',
      seatLimit: 3,
    },
  });

  const portfolioLead = await prisma.user.upsert({
    where: { email: process.env.COPILOT_SMOKE_EMAIL ?? 'pilot.portfolio@starteria.test' },
    update: {
      name: 'Pilot Portfolio Lead',
      role: Role.mentor,
      isActive: true,
      organizationId: organization.id,
    },
    create: {
      email: process.env.COPILOT_SMOKE_EMAIL ?? 'pilot.portfolio@starteria.test',
      name: 'Pilot Portfolio Lead',
      passwordHash: TEST_HASH,
      role: Role.mentor,
      initials: 'PL',
      skills: ['Portfolio strategy'],
      isActive: true,
      organizationId: organization.id,
    },
  });

  const noPermission = await prisma.user.upsert({
    where: { email: 'pilot.viewer@starteria.test' },
    update: {
      name: 'Pilot Viewer',
      role: Role.viewer,
      isActive: true,
      organizationId: organization.id,
    },
    create: {
      email: 'pilot.viewer@starteria.test',
      name: 'Pilot Viewer',
      passwordHash: TEST_HASH,
      role: Role.viewer,
      initials: 'PV',
      skills: ['Observation'],
      isActive: true,
      organizationId: organization.id,
    },
  });

  const otherOrgUser = await prisma.user.upsert({
    where: { email: 'pilot.other-org@starteria.test' },
    update: {
      name: 'Pilot Other Org User',
      role: Role.viewer,
      isActive: true,
      organizationId: otherOrganization.id,
    },
    create: {
      email: 'pilot.other-org@starteria.test',
      name: 'Pilot Other Org User',
      passwordHash: TEST_HASH,
      role: Role.viewer,
      initials: 'PO',
      skills: ['Observation'],
      isActive: true,
      organizationId: otherOrganization.id,
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: organization.id, userId: portfolioLead.id, role: 'admin' },
      { organizationId: organization.id, userId: noPermission.id, role: 'member' },
      { organizationId: otherOrganization.id, userId: otherOrgUser.id, role: 'member' },
    ],
    skipDuplicates: true,
  });

  await prisma.strategicFront.upsert({
    where: { id: 'front-pilot-dry-run-existing' },
    update: {
      name: 'Dry Run Existing Front',
      organizationId: organization.id,
      ownerId: portfolioLead.id,
    },
    create: {
      id: 'front-pilot-dry-run-existing',
      name: 'Dry Run Existing Front',
      strategicObjective: 'Controlled baseline front for pilot dry run.',
      mainKpi: 'Portfolio cycle time',
      baseline: '30 days',
      target: '20 days',
      horizon: '1 quarter',
      sponsor: 'Dry Run Sponsor',
      priority: 'Media',
      organizationId: organization.id,
      ownerId: portfolioLead.id,
    },
  });

  console.log('[seed:pilot-dry-run] Seed completed.');
  console.log(`[seed:pilot-dry-run] org=${organization.id}`);
  console.log(`[seed:pilot-dry-run] otherOrg=${otherOrganization.id}`);
  console.log(`[seed:pilot-dry-run] smokeEmail=${portfolioLead.email}`);
  console.log('[seed:pilot-dry-run] smokePassword=demo123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
