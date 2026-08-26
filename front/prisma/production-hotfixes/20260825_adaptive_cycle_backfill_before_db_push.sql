-- Production hotfix for databases historically managed with `prisma db push`.
--
-- Context:
-- - R3A has a versioned migration that introduces InitiativeCycle and backfills
--   cycleId before making it NOT NULL.
-- - Production did not execute that migration history; CD used `prisma db push`.
-- - `db push` jumps directly to the final datamodel and aborts when adding
--   required cycleId columns to populated Adaptive Core tables.
--
-- This script is intentionally idempotent. It prepares the production database
-- to match the R3A cycle invariants before `prisma db push` completes the schema
-- reconciliation. It never deletes adaptive rows and never assigns arbitrary ids:
-- ids for initial legacy cycles are deterministic from Project.id.


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CycleStatus') THEN
    CREATE TYPE "CycleStatus" AS ENUM ('active', 'completed', 'superseded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CycleTriggerType') THEN
    CREATE TYPE "CycleTriggerType" AS ENUM ('initial', 'critical_change', 'decision', 'return_to_prior_direction');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CycleStepStateValue') THEN
    CREATE TYPE "CycleStepStateValue" AS ENUM ('inherited', 'confirmed', 'active', 'reopened', 'pending', 'historical_only');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "InitiativeCycle" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "cycleNumber" INTEGER NOT NULL,
  "parentCycleId" TEXT,
  "basedOnCycleId" TEXT,
  "triggerType" "CycleTriggerType" NOT NULL DEFAULT 'initial',
  "triggerRefId" TEXT,
  "startStep" INTEGER NOT NULL DEFAULT 0,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "status" "CycleStatus" NOT NULL DEFAULT 'active',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InitiativeCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CycleStepState" (
  "id" TEXT NOT NULL,
  "cycleId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "state" "CycleStepStateValue" NOT NULL,
  "inheritedFromCycleId" TEXT,
  "inheritedFromOutputId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CycleStepState_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdaptiveStepConfiguration" ADD COLUMN IF NOT EXISTS "cycleId" TEXT;
ALTER TABLE "AdaptiveCheckpointInstance" ADD COLUMN IF NOT EXISTS "cycleId" TEXT;
ALTER TABLE "AdaptiveStepOutput" ADD COLUMN IF NOT EXISTS "cycleId" TEXT;
ALTER TABLE "AdaptiveProgressSignal" ADD COLUMN IF NOT EXISTS "cycleId" TEXT;

-- One initial cycle for legacy projects that have adaptive rows but no cycle at all.
INSERT INTO "InitiativeCycle" (
  "id",
  "projectId",
  "cycleNumber",
  "triggerType",
  "startStep",
  "currentStep",
  "status",
  "completedAt",
  "startedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'r3a_cycle_' || substr(md5(p."id"), 1, 20),
  p."id",
  1,
  'initial'::"CycleTriggerType",
  0,
  COALESCE(p."currentStep", 0),
  CASE
    WHEN p."status" = 'COMPLETED'
      OR EXISTS (
        SELECT 1
        FROM "AdaptiveStepOutput" aso
        WHERE aso."projectId" = p."id"
          AND aso."stepNumber" = 4
          AND aso."status" = 'confirmed'
          AND aso."confirmedAt" IS NOT NULL
      )
    THEN 'completed'::"CycleStatus"
    ELSE 'active'::"CycleStatus"
  END,
  CASE
    WHEN p."status" = 'COMPLETED'
      OR EXISTS (
        SELECT 1
        FROM "AdaptiveStepOutput" aso
        WHERE aso."projectId" = p."id"
          AND aso."stepNumber" = 4
          AND aso."status" = 'confirmed'
          AND aso."confirmedAt" IS NOT NULL
      )
    THEN COALESCE((
      SELECT aso."confirmedAt"
      FROM "AdaptiveStepOutput" aso
      WHERE aso."projectId" = p."id"
        AND aso."stepNumber" = 4
        AND aso."status" = 'confirmed'
      ORDER BY aso."version" DESC
      LIMIT 1
    ), p."lastModified", CURRENT_TIMESTAMP)
    ELSE NULL
  END,
  COALESCE((
    SELECT MIN(ascfg."createdAt")
    FROM "AdaptiveStepConfiguration" ascfg
    WHERE ascfg."projectId" = p."id"
  ), p."createdAt", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Project" p
WHERE (
    EXISTS (SELECT 1 FROM "AdaptiveStepConfiguration" ascfg WHERE ascfg."projectId" = p."id")
    OR EXISTS (SELECT 1 FROM "AdaptiveCheckpointInstance" aci WHERE aci."projectId" = p."id")
    OR EXISTS (SELECT 1 FROM "AdaptiveStepOutput" aso WHERE aso."projectId" = p."id")
    OR EXISTS (SELECT 1 FROM "AdaptiveProgressSignal" aps WHERE aps."projectId" = p."id")
  )
  AND NOT EXISTS (SELECT 1 FROM "InitiativeCycle" ic WHERE ic."projectId" = p."id")
ON CONFLICT ("id") DO NOTHING;

-- Resolve the operational cycle per project:
-- 1. active cycle when present;
-- 2. otherwise latest existing cycle by cycleNumber;
-- 3. otherwise the deterministic initial cycle inserted above.
WITH operational_cycle AS (
  SELECT DISTINCT ON (ic."projectId")
    ic."projectId",
    ic."id" AS "cycleId"
  FROM "InitiativeCycle" ic
  ORDER BY
    ic."projectId",
    CASE WHEN ic."status" = 'active' THEN 0 ELSE 1 END,
    ic."cycleNumber" DESC
)
UPDATE "AdaptiveStepConfiguration" ascfg
SET "cycleId" = oc."cycleId"
FROM operational_cycle oc
WHERE ascfg."projectId" = oc."projectId"
  AND ascfg."cycleId" IS NULL;

-- Prefer the step configuration cycle for checkpoint instances, then fall back
-- to the project operational cycle for orphaned legacy rows.
UPDATE "AdaptiveCheckpointInstance" aci
SET "cycleId" = ascfg."cycleId"
FROM "AdaptiveStepConfiguration" ascfg
WHERE aci."stepConfigurationId" = ascfg."id"
  AND aci."cycleId" IS NULL
  AND ascfg."cycleId" IS NOT NULL;

WITH operational_cycle AS (
  SELECT DISTINCT ON (ic."projectId")
    ic."projectId",
    ic."id" AS "cycleId"
  FROM "InitiativeCycle" ic
  ORDER BY
    ic."projectId",
    CASE WHEN ic."status" = 'active' THEN 0 ELSE 1 END,
    ic."cycleNumber" DESC
)
UPDATE "AdaptiveCheckpointInstance" aci
SET "cycleId" = oc."cycleId"
FROM operational_cycle oc
WHERE aci."projectId" = oc."projectId"
  AND aci."cycleId" IS NULL;

-- Prefer the source configuration cycle for outputs, then fall back to the
-- project operational cycle.
UPDATE "AdaptiveStepOutput" aso
SET "cycleId" = ascfg."cycleId"
FROM "AdaptiveStepConfiguration" ascfg
WHERE aso."sourceConfigurationId" = ascfg."id"
  AND aso."cycleId" IS NULL
  AND ascfg."cycleId" IS NOT NULL;

WITH operational_cycle AS (
  SELECT DISTINCT ON (ic."projectId")
    ic."projectId",
    ic."id" AS "cycleId"
  FROM "InitiativeCycle" ic
  ORDER BY
    ic."projectId",
    CASE WHEN ic."status" = 'active' THEN 0 ELSE 1 END,
    ic."cycleNumber" DESC
)
UPDATE "AdaptiveStepOutput" aso
SET "cycleId" = oc."cycleId"
FROM operational_cycle oc
WHERE aso."projectId" = oc."projectId"
  AND aso."cycleId" IS NULL;

WITH operational_cycle AS (
  SELECT DISTINCT ON (ic."projectId")
    ic."projectId",
    ic."id" AS "cycleId"
  FROM "InitiativeCycle" ic
  ORDER BY
    ic."projectId",
    CASE WHEN ic."status" = 'active' THEN 0 ELSE 1 END,
    ic."cycleNumber" DESC
)
UPDATE "AdaptiveProgressSignal" aps
SET "cycleId" = oc."cycleId"
FROM operational_cycle oc
WHERE aps."projectId" = oc."projectId"
  AND aps."cycleId" IS NULL;

INSERT INTO "CycleStepState" ("id", "cycleId", "stepNumber", "state", "createdAt", "updatedAt")
SELECT
  'r3a_css_' || substr(md5(ic."id" || ':' || steps.step::TEXT), 1, 20),
  ic."id",
  steps.step,
  CASE
    WHEN ic."status" = 'completed'
      OR steps.step < ic."currentStep"
      OR EXISTS (
        SELECT 1
        FROM "AdaptiveStepOutput" aso
        WHERE aso."cycleId" = ic."id"
          AND aso."stepNumber" = steps.step
          AND aso."status" = 'confirmed'
      )
    THEN 'confirmed'::"CycleStepStateValue"
    WHEN steps.step = ic."currentStep" AND ic."status" = 'active'
    THEN 'active'::"CycleStepStateValue"
    ELSE 'pending'::"CycleStepStateValue"
  END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "InitiativeCycle" ic
CROSS JOIN (VALUES (0), (1), (2), (3), (4)) AS steps(step)
WHERE NOT EXISTS (
  SELECT 1
  FROM "CycleStepState" existing
  WHERE existing."cycleId" = ic."id"
    AND existing."stepNumber" = steps.step
);

-- Guardrails before enforcing NOT NULL.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "AdaptiveStepConfiguration" WHERE "cycleId" IS NULL) THEN
    RAISE EXCEPTION 'AdaptiveStepConfiguration has rows without cycleId after backfill';
  END IF;
  IF EXISTS (SELECT 1 FROM "AdaptiveCheckpointInstance" WHERE "cycleId" IS NULL) THEN
    RAISE EXCEPTION 'AdaptiveCheckpointInstance has rows without cycleId after backfill';
  END IF;
  IF EXISTS (SELECT 1 FROM "AdaptiveStepOutput" WHERE "cycleId" IS NULL) THEN
    RAISE EXCEPTION 'AdaptiveStepOutput has rows without cycleId after backfill';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "AdaptiveStepConfiguration" ascfg
    JOIN "InitiativeCycle" ic ON ic."id" = ascfg."cycleId"
    WHERE ic."projectId" <> ascfg."projectId"
  ) THEN
    RAISE EXCEPTION 'AdaptiveStepConfiguration cycleId points to another project';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "AdaptiveCheckpointInstance" aci
    JOIN "InitiativeCycle" ic ON ic."id" = aci."cycleId"
    WHERE ic."projectId" <> aci."projectId"
  ) THEN
    RAISE EXCEPTION 'AdaptiveCheckpointInstance cycleId points to another project';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "AdaptiveStepOutput" aso
    JOIN "InitiativeCycle" ic ON ic."id" = aso."cycleId"
    WHERE ic."projectId" <> aso."projectId"
  ) THEN
    RAISE EXCEPTION 'AdaptiveStepOutput cycleId points to another project';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "AdaptiveCheckpointInstance" aci
    JOIN "AdaptiveStepConfiguration" ascfg ON ascfg."id" = aci."stepConfigurationId"
    WHERE aci."cycleId" <> ascfg."cycleId"
  ) THEN
    RAISE EXCEPTION 'AdaptiveCheckpointInstance cycleId differs from its step configuration cycleId';
  END IF;
  IF EXISTS (
    SELECT "projectId"
    FROM "InitiativeCycle"
    WHERE "status" = 'active'
    GROUP BY "projectId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'More than one active InitiativeCycle for a project';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "CycleStepState"
    GROUP BY "cycleId", "stepNumber"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'CycleStepState contains duplicate (cycleId, stepNumber) rows';
  END IF;
END $$;

ALTER TABLE "AdaptiveStepConfiguration" ALTER COLUMN "cycleId" SET NOT NULL;
ALTER TABLE "AdaptiveCheckpointInstance" ALTER COLUMN "cycleId" SET NOT NULL;
ALTER TABLE "AdaptiveStepOutput" ALTER COLUMN "cycleId" SET NOT NULL;

DROP INDEX IF EXISTS "AdaptiveStepConfiguration_projectId_stepNumber_version_key";
DROP INDEX IF EXISTS "AdaptiveCheckpointInstance_projectId_stepConfigurationId_checkpointKey_key";
DROP INDEX IF EXISTS "AdaptiveStepOutput_projectId_stepNumber_version_key";

CREATE UNIQUE INDEX IF NOT EXISTS "InitiativeCycle_projectId_cycleNumber_key" ON "InitiativeCycle"("projectId", "cycleNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "InitiativeCycle_one_active_per_project_key" ON "InitiativeCycle"("projectId") WHERE "status" = 'active';
CREATE INDEX IF NOT EXISTS "InitiativeCycle_projectId_idx" ON "InitiativeCycle"("projectId");
CREATE INDEX IF NOT EXISTS "InitiativeCycle_projectId_status_idx" ON "InitiativeCycle"("projectId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "CycleStepState_cycleId_stepNumber_key" ON "CycleStepState"("cycleId", "stepNumber");
CREATE INDEX IF NOT EXISTS "CycleStepState_cycleId_idx" ON "CycleStepState"("cycleId");
CREATE INDEX IF NOT EXISTS "CycleStepState_cycleId_stepNumber_idx" ON "CycleStepState"("cycleId", "stepNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "AdaptiveStepConfiguration_cycleId_stepNumber_version_key" ON "AdaptiveStepConfiguration"("cycleId", "stepNumber", "version");
CREATE INDEX IF NOT EXISTS "AdaptiveStepConfiguration_cycleId_idx" ON "AdaptiveStepConfiguration"("cycleId");
CREATE INDEX IF NOT EXISTS "AdaptiveStepConfiguration_cycleId_stepNumber_idx" ON "AdaptiveStepConfiguration"("cycleId", "stepNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "ACI_cycle_config_checkpoint_key" ON "AdaptiveCheckpointInstance"("cycleId", "stepConfigurationId", "checkpointKey");
CREATE INDEX IF NOT EXISTS "AdaptiveCheckpointInstance_cycleId_idx" ON "AdaptiveCheckpointInstance"("cycleId");
CREATE INDEX IF NOT EXISTS "AdaptiveCheckpointInstance_cycleId_stepNumber_idx" ON "AdaptiveCheckpointInstance"("cycleId", "stepNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "AdaptiveStepOutput_cycleId_stepNumber_version_key" ON "AdaptiveStepOutput"("cycleId", "stepNumber", "version");
CREATE INDEX IF NOT EXISTS "AdaptiveStepOutput_cycleId_idx" ON "AdaptiveStepOutput"("cycleId");
CREATE INDEX IF NOT EXISTS "AdaptiveStepOutput_cycleId_stepNumber_idx" ON "AdaptiveStepOutput"("cycleId", "stepNumber");

CREATE INDEX IF NOT EXISTS "AdaptiveProgressSignal_cycleId_idx" ON "AdaptiveProgressSignal"("cycleId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InitiativeCycle_projectId_fkey') THEN
    ALTER TABLE "InitiativeCycle" ADD CONSTRAINT "InitiativeCycle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InitiativeCycle_parentCycleId_fkey') THEN
    ALTER TABLE "InitiativeCycle" ADD CONSTRAINT "InitiativeCycle_parentCycleId_fkey" FOREIGN KEY ("parentCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InitiativeCycle_basedOnCycleId_fkey') THEN
    ALTER TABLE "InitiativeCycle" ADD CONSTRAINT "InitiativeCycle_basedOnCycleId_fkey" FOREIGN KEY ("basedOnCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CycleStepState_cycleId_fkey') THEN
    ALTER TABLE "CycleStepState" ADD CONSTRAINT "CycleStepState_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdaptiveStepConfiguration_cycleId_fkey') THEN
    ALTER TABLE "AdaptiveStepConfiguration" ADD CONSTRAINT "AdaptiveStepConfiguration_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdaptiveCheckpointInstance_cycleId_fkey') THEN
    ALTER TABLE "AdaptiveCheckpointInstance" ADD CONSTRAINT "AdaptiveCheckpointInstance_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdaptiveStepOutput_cycleId_fkey') THEN
    ALTER TABLE "AdaptiveStepOutput" ADD CONSTRAINT "AdaptiveStepOutput_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdaptiveProgressSignal_cycleId_fkey') THEN
    ALTER TABLE "AdaptiveProgressSignal" ADD CONSTRAINT "AdaptiveProgressSignal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
