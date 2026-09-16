import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { recreateDisposableDatabase, runChecked } from './test-database-utils';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(currentDir, '../..');
const targetUrl = process.env.E2E_DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/starteria_e2e';
const adminUrl = process.env.E2E_DATABASE_ADMIN_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/postgres';

const hotfixSql = path.join(
  frontRoot,
  'prisma/production-hotfixes/20260825_adaptive_cycle_backfill_before_db_push.sql',
);

const legacySchemaSql = String.raw`
CREATE TYPE "ProjectStatus" AS ENUM (
  'DRAFT',
  'IN_PROGRESS',
  'AI_REVIEW',
  'ITERATION',
  'EXPERT_SESSION_PENDING',
  'STEP_APPROVED',
  'COMPLETED',
  'IMPLEMENTATION_APPROVED',
  'SCALING_APPROVED',
  'PAUSED',
  'CLOSED'
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveStepConfiguration" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "routeType" TEXT NOT NULL,
  "depthLevel" TEXT NOT NULL,
  "maturity" TEXT,
  "configurationJson" JSONB NOT NULL,
  "sourceContextJson" JSONB,
  "requiresReview" BOOLEAN NOT NULL DEFAULT false,
  "supersededById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdaptiveStepConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveCheckpointInstance" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "stepConfigurationId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "checkpointKey" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ready',
  "materializedQuestionsJson" JSONB NOT NULL,
  "sufficiencyJson" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdaptiveCheckpointInstance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveStepOutput" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceConfigurationId" TEXT,
  "stepNumber" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "outputKey" TEXT NOT NULL,
  "outputJson" JSONB NOT NULL,
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "requiresReview" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdaptiveStepOutput_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveProgressSignal" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "checkpointKey" TEXT,
  "health" TEXT NOT NULL,
  "signalJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdaptiveProgressSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdaptiveStepConfiguration_projectId_stepNumber_version_key"
  ON "AdaptiveStepConfiguration"("projectId", "stepNumber", "version");
CREATE UNIQUE INDEX "AdaptiveCheckpointInstance_projectId_stepConfigurationId_checkpointKey_key"
  ON "AdaptiveCheckpointInstance"("projectId", "stepConfigurationId", "checkpointKey");
CREATE UNIQUE INDEX "AdaptiveStepOutput_projectId_stepNumber_version_key"
  ON "AdaptiveStepOutput"("projectId", "stepNumber", "version");
CREATE UNIQUE INDEX "AdaptiveProgressSignal_projectId_key" ON "AdaptiveProgressSignal"("projectId");

ALTER TABLE "AdaptiveStepConfiguration"
  ADD CONSTRAINT "AdaptiveStepConfiguration_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointInstance"
  ADD CONSTRAINT "AdaptiveCheckpointInstance_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointInstance"
  ADD CONSTRAINT "AdaptiveCheckpointInstance_stepConfigurationId_fkey"
  FOREIGN KEY ("stepConfigurationId") REFERENCES "AdaptiveStepConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveStepOutput"
  ADD CONSTRAINT "AdaptiveStepOutput_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveStepOutput"
  ADD CONSTRAINT "AdaptiveStepOutput_sourceConfigurationId_fkey"
  FOREIGN KEY ("sourceConfigurationId") REFERENCES "AdaptiveStepConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdaptiveProgressSignal"
  ADD CONSTRAINT "AdaptiveProgressSignal_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

const legacyDataSql = String.raw`
INSERT INTO "Project" ("id", "name", "status", "currentStep", "createdAt", "lastModified") VALUES
  ('legacy-active', 'Legacy active initiative', 'IN_PROGRESS', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('legacy-completed', 'Legacy completed initiative', 'COMPLETED', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "AdaptiveStepConfiguration" (
  "id", "projectId", "stepNumber", "version", "status", "routeType", "depthLevel", "configurationJson", "sourceContextJson"
) VALUES
  ('cfg-a-0', 'legacy-active', 0, 1, 'active', 'explore_validate', 'guided', '{"step":0}', '{"routeType":"explore_validate"}'),
  ('cfg-a-1', 'legacy-active', 1, 1, 'active', 'explore_validate', 'guided', '{"step":1}', '{"routeType":"explore_validate"}'),
  ('cfg-a-2', 'legacy-active', 2, 1, 'active', 'explore_validate', 'guided', '{"step":2}', '{"routeType":"explore_validate"}'),
  ('cfg-a-3', 'legacy-active', 3, 1, 'active', 'explore_validate', 'guided', '{"step":3}', '{"routeType":"explore_validate"}'),
  ('cfg-a-4', 'legacy-active', 4, 1, 'active', 'explore_validate', 'guided', '{"step":4}', '{"routeType":"explore_validate"}'),
  ('cfg-c-0', 'legacy-completed', 0, 1, 'active', 'design_solution', 'guided', '{"step":0}', '{"routeType":"design_solution"}'),
  ('cfg-c-1', 'legacy-completed', 1, 1, 'active', 'design_solution', 'guided', '{"step":1}', '{"routeType":"design_solution"}'),
  ('cfg-c-4', 'legacy-completed', 4, 1, 'active', 'design_solution', 'guided', '{"step":4}', '{"routeType":"design_solution"}');

INSERT INTO "AdaptiveCheckpointInstance" (
  "id", "projectId", "stepConfigurationId", "stepNumber", "checkpointKey", "sequence", "status", "materializedQuestionsJson"
) VALUES
  ('cp-a-01', 'legacy-active', 'cfg-a-0', 0, 'CP-0.1', 1, 'confirmed', '[]'),
  ('cp-a-02', 'legacy-active', 'cfg-a-0', 0, 'CP-0.2', 2, 'confirmed', '[]'),
  ('cp-a-03', 'legacy-active', 'cfg-a-0', 0, 'CP-0.3', 3, 'ready', '[]'),
  ('cp-a-11', 'legacy-active', 'cfg-a-1', 1, 'CP-1.1', 1, 'confirmed', '[]'),
  ('cp-a-12', 'legacy-active', 'cfg-a-1', 1, 'CP-1.2', 2, 'ready', '[]'),
  ('cp-a-21', 'legacy-active', 'cfg-a-2', 2, 'CP-2.1', 1, 'ready', '[]'),
  ('cp-a-31', 'legacy-active', 'cfg-a-3', 3, 'CP-3.1', 1, 'locked', '[]'),
  ('cp-a-41', 'legacy-active', 'cfg-a-4', 4, 'CP-4.1', 1, 'locked', '[]'),
  ('cp-c-01', 'legacy-completed', 'cfg-c-0', 0, 'CP-0.1', 1, 'confirmed', '[]'),
  ('cp-c-11', 'legacy-completed', 'cfg-c-1', 1, 'CP-1.1', 1, 'confirmed', '[]'),
  ('cp-c-41', 'legacy-completed', 'cfg-c-4', 4, 'CP-4.1', 1, 'confirmed', '[]');

INSERT INTO "AdaptiveStepOutput" (
  "id", "projectId", "sourceConfigurationId", "stepNumber", "version", "status", "outputKey", "outputJson", "confirmedAt"
) VALUES
  ('out-c-4', 'legacy-completed', 'cfg-c-4', 4, 1, 'confirmed', 'DecisionPackage', '{"decision":"complete"}', CURRENT_TIMESTAMP);

INSERT INTO "AdaptiveProgressSignal" ("id", "projectId", "stepNumber", "checkpointKey", "health", "signalJson") VALUES
  ('signal-a', 'legacy-active', 2, 'CP-2.1', 'healthy', '{}');
`;

const adaptiveRowCountSql = String.raw`
  SELECT 'AdaptiveStepConfiguration' AS table_name, COUNT(*)::bigint AS count FROM "AdaptiveStepConfiguration"
  UNION ALL
  SELECT 'AdaptiveCheckpointInstance', COUNT(*)::bigint FROM "AdaptiveCheckpointInstance"
  UNION ALL
  SELECT 'AdaptiveStepOutput', COUNT(*)::bigint FROM "AdaptiveStepOutput"
  UNION ALL
  SELECT 'AdaptiveProgressSignal', COUNT(*)::bigint FROM "AdaptiveProgressSignal"
  UNION ALL
  SELECT 'InitiativeCycle', COUNT(*)::bigint FROM "InitiativeCycle"
  UNION ALL
  SELECT 'CycleStepState', COUNT(*)::bigint FROM "CycleStepState"
  ORDER BY table_name
`;

async function runSqlFile(name: string, sql: string, databaseUrl: string): Promise<void> {
  const file = path.join(os.tmpdir(), name);
  fs.writeFileSync(file, sql, 'utf8');
  try {
    runChecked('npx', ['prisma', 'db', 'execute', '--schema=prisma/schema.prisma', `--file=${file}`], frontRoot, {
      ...process.env,
      DATABASE_URL: databaseUrl,
    });
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function countsByTable(rows: Array<{ table_name: string; count: bigint }>): Map<string, bigint> {
  return new Map(rows.map((row) => [row.table_name, row.count]));
}

function assertCount(rows: Map<string, bigint>, tableName: string, expected: bigint): void {
  const actual = rows.get(tableName);
  if (actual !== expected) throw new Error(`Expected ${tableName} count ${expected}, got ${actual}.`);
}

function assertCountsUnchanged(
  before: Map<string, bigint>,
  after: Map<string, bigint>,
): void {
  const keys = new Set([...before.keys(), ...after.keys()]);
  const changes = [...keys].filter((key) => before.get(key) !== after.get(key));
  if (changes.length > 0) {
    throw new Error(`Second hotfix run changed row counts: ${changes.map((key) => `${key} ${before.get(key)} -> ${after.get(key)}`).join(', ')}`);
  }
}

async function getAdaptiveRowCounts(prisma: PrismaClient): Promise<Map<string, bigint>> {
  return countsByTable(await prisma.$queryRawUnsafe<Array<{ table_name: string; count: bigint }>>(adaptiveRowCountSql));
}

async function assertNoCycleStepStateDuplicates(prisma: PrismaClient): Promise<void> {
  const duplicates = await prisma.$queryRawUnsafe<Array<{ cycleId: string; stepNumber: number; count: bigint }>>(String.raw`
    SELECT "cycleId", "stepNumber", COUNT(*)::bigint AS count
    FROM "CycleStepState"
    GROUP BY "cycleId", "stepNumber"
    HAVING COUNT(*) > 1
  `);
  if (duplicates.length > 0) {
    throw new Error(`CycleStepState duplicate (cycleId, stepNumber) rows: ${JSON.stringify(duplicates)}`);
  }
}

async function assertFiveDistinctStepStatesPerCycle(prisma: PrismaClient): Promise<void> {
  const invalidCycles = await prisma.$queryRawUnsafe<Array<{
    cycleId: string;
    projectId: string;
    cycleNumber: number;
    stepStateCount: bigint;
    distinctStepCount: bigint;
  }>>(String.raw`
    SELECT
      ic."id" AS "cycleId",
      ic."projectId",
      ic."cycleNumber",
      COUNT(css."id")::bigint AS "stepStateCount",
      COUNT(DISTINCT css."stepNumber")::bigint AS "distinctStepCount"
    FROM "InitiativeCycle" ic
    LEFT JOIN "CycleStepState" css ON css."cycleId" = ic."id"
    GROUP BY ic."id", ic."projectId", ic."cycleNumber"
    HAVING COUNT(css."id") <> 5
      OR COUNT(DISTINCT css."stepNumber") <> 5
  `);
  if (invalidCycles.length > 0) {
    throw new Error(`InitiativeCycle rows without exactly five distinct CycleStepState rows: ${JSON.stringify(invalidCycles)}`);
  }
}

async function main() {
  await recreateDisposableDatabase(adminUrl, targetUrl);
  await runSqlFile('starteria-legacy-adaptive-schema.sql', legacySchemaSql, targetUrl);
  await runSqlFile('starteria-legacy-adaptive-data.sql', legacyDataSql, targetUrl);

  runChecked('npx', ['prisma', 'db', 'execute', '--schema=prisma/schema.prisma', `--file=${hotfixSql}`], frontRoot, {
    ...process.env,
    DATABASE_URL: targetUrl,
  });

  const prisma = new PrismaClient({ datasources: { db: { url: targetUrl } } });
  try {
    const firstRunCounts = await getAdaptiveRowCounts(prisma);
    assertCount(firstRunCounts, 'AdaptiveStepConfiguration', 8n);
    assertCount(firstRunCounts, 'AdaptiveCheckpointInstance', 11n);
    assertCount(firstRunCounts, 'AdaptiveStepOutput', 1n);
    assertCount(firstRunCounts, 'AdaptiveProgressSignal', 1n);
    assertCount(firstRunCounts, 'InitiativeCycle', 2n);
    assertCount(firstRunCounts, 'CycleStepState', 10n);

    const nulls = await prisma.$queryRawUnsafe<Array<{ table_name: string; null_count: bigint }>>(String.raw`
      SELECT 'AdaptiveStepConfiguration' AS table_name, COUNT(*)::bigint AS null_count FROM "AdaptiveStepConfiguration" WHERE "cycleId" IS NULL
      UNION ALL
      SELECT 'AdaptiveCheckpointInstance', COUNT(*)::bigint FROM "AdaptiveCheckpointInstance" WHERE "cycleId" IS NULL
      UNION ALL
      SELECT 'AdaptiveStepOutput', COUNT(*)::bigint FROM "AdaptiveStepOutput" WHERE "cycleId" IS NULL
      UNION ALL
      SELECT 'AdaptiveProgressSignal', COUNT(*)::bigint FROM "AdaptiveProgressSignal" WHERE "cycleId" IS NULL
    `);
    const withNulls = nulls.filter((row) => row.null_count !== 0n);
    if (withNulls.length > 0) throw new Error(`Backfill left null cycleId rows: ${JSON.stringify(withNulls)}`);

    const notNullColumns = await prisma.$queryRawUnsafe<Array<{ table_name: string; column_name: string; is_nullable: string }>>(String.raw`
      SELECT table_name, column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('AdaptiveStepConfiguration', 'AdaptiveCheckpointInstance', 'AdaptiveStepOutput')
        AND column_name = 'cycleId'
      ORDER BY table_name
    `);
    if (notNullColumns.some((row) => row.is_nullable !== 'NO')) {
      throw new Error(`cycleId is still nullable: ${JSON.stringify(notNullColumns)}`);
    }

    const crossProject = await prisma.$queryRawUnsafe<Array<{ violations: bigint }>>(String.raw`
      SELECT COUNT(*)::bigint AS violations
      FROM (
        SELECT ascfg."id"
        FROM "AdaptiveStepConfiguration" ascfg
        JOIN "InitiativeCycle" ic ON ic."id" = ascfg."cycleId"
        WHERE ic."projectId" <> ascfg."projectId"
        UNION ALL
        SELECT aci."id"
        FROM "AdaptiveCheckpointInstance" aci
        JOIN "InitiativeCycle" ic ON ic."id" = aci."cycleId"
        WHERE ic."projectId" <> aci."projectId"
        UNION ALL
        SELECT aso."id"
        FROM "AdaptiveStepOutput" aso
        JOIN "InitiativeCycle" ic ON ic."id" = aso."cycleId"
        WHERE ic."projectId" <> aso."projectId"
      ) v
    `);
    if (crossProject[0].violations !== 0n) throw new Error('Found adaptive rows pointing to a cycle from another project.');

    const activeCycleViolations = await prisma.$queryRawUnsafe<Array<{ violations: bigint }>>(String.raw`
      SELECT COUNT(*)::bigint AS violations
      FROM (
        SELECT "projectId"
        FROM "InitiativeCycle"
        WHERE "status" = 'active'
        GROUP BY "projectId"
        HAVING COUNT(*) > 1
      ) v
    `);
    if (activeCycleViolations[0].violations !== 0n) throw new Error('More than one active cycle for a project.');

    await assertNoCycleStepStateDuplicates(prisma);
    await assertFiveDistinctStepStatesPerCycle(prisma);

    const constraints = await prisma.$queryRawUnsafe<Array<{ conname: string }>>(String.raw`
      SELECT conname
      FROM pg_constraint
      WHERE conname IN (
        'AdaptiveStepConfiguration_cycleId_fkey',
        'AdaptiveCheckpointInstance_cycleId_fkey',
        'AdaptiveStepOutput_cycleId_fkey',
        'CycleStepState_cycleId_fkey'
      )
    `);
    if (constraints.length !== 4) throw new Error(`Missing expected FK constraints: ${JSON.stringify(constraints)}`);

    runChecked('npx', ['prisma', 'db', 'execute', '--schema=prisma/schema.prisma', `--file=${hotfixSql}`], frontRoot, {
      ...process.env,
      DATABASE_URL: targetUrl,
    });

    const secondRunCounts = await getAdaptiveRowCounts(prisma);
    assertCountsUnchanged(firstRunCounts, secondRunCounts);
    await assertNoCycleStepStateDuplicates(prisma);
    await assertFiveDistinctStepStatesPerCycle(prisma);
  } finally {
    await prisma.$disconnect();
  }

  console.log('[adaptive-cycle-hotfix] OK: legacy rows preserved, cycleId backfilled, constraints, NOT NULL, and second-run idempotency verified.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
