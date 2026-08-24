CREATE TYPE "CycleStatus" AS ENUM ('active', 'completed', 'superseded');
CREATE TYPE "CycleTriggerType" AS ENUM ('initial', 'critical_change', 'decision', 'return_to_prior_direction');
CREATE TYPE "CycleStepStateValue" AS ENUM ('inherited', 'confirmed', 'active', 'reopened', 'pending', 'historical_only');

CREATE TABLE "InitiativeCycle" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InitiativeCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CycleStepState" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "state" "CycleStepStateValue" NOT NULL,
    "inheritedFromCycleId" TEXT,
    "inheritedFromOutputId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CycleStepState_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdaptiveStepConfiguration" ADD COLUMN "cycleId" TEXT;
ALTER TABLE "AdaptiveCheckpointInstance" ADD COLUMN "cycleId" TEXT;
ALTER TABLE "AdaptiveStepOutput" ADD COLUMN "cycleId" TEXT;
ALTER TABLE "AdaptiveProgressSignal" ADD COLUMN "cycleId" TEXT;

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
    'initial',
    0,
    p."currentStep",
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
          ), p."lastModified")
        ELSE NULL
    END,
    COALESCE((
        SELECT MIN(ascfg."createdAt")
        FROM "AdaptiveStepConfiguration" ascfg
        WHERE ascfg."projectId" = p."id"
    ), p."createdAt"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Project" p
WHERE EXISTS (SELECT 1 FROM "AdaptiveStepConfiguration" ascfg WHERE ascfg."projectId" = p."id")
   OR EXISTS (SELECT 1 FROM "AdaptiveCheckpointInstance" aci WHERE aci."projectId" = p."id")
   OR EXISTS (SELECT 1 FROM "AdaptiveStepOutput" aso WHERE aso."projectId" = p."id")
   OR EXISTS (SELECT 1 FROM "AdaptiveProgressSignal" aps WHERE aps."projectId" = p."id");

UPDATE "AdaptiveStepConfiguration" ascfg
SET "cycleId" = ic."id"
FROM "InitiativeCycle" ic
WHERE ascfg."projectId" = ic."projectId"
  AND ic."cycleNumber" = 1
  AND ascfg."cycleId" IS NULL;

UPDATE "AdaptiveCheckpointInstance" aci
SET "cycleId" = ic."id"
FROM "InitiativeCycle" ic
WHERE aci."projectId" = ic."projectId"
  AND ic."cycleNumber" = 1
  AND aci."cycleId" IS NULL;

UPDATE "AdaptiveStepOutput" aso
SET "cycleId" = ic."id"
FROM "InitiativeCycle" ic
WHERE aso."projectId" = ic."projectId"
  AND ic."cycleNumber" = 1
  AND aso."cycleId" IS NULL;

UPDATE "AdaptiveProgressSignal" aps
SET "cycleId" = ic."id"
FROM "InitiativeCycle" ic
WHERE aps."projectId" = ic."projectId"
  AND ic."cycleNumber" = 1
  AND aps."cycleId" IS NULL;

INSERT INTO "CycleStepState" ("id", "cycleId", "stepNumber", "state", "createdAt", "updatedAt")
SELECT
    'r3a_css_' || substr(md5(ic."id" || ':' || steps.step::TEXT), 1, 20),
    ic."id",
    steps.step,
    CASE
        WHEN steps.step < ic."currentStep"
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
CROSS JOIN (VALUES (0), (1), (2), (3), (4)) AS steps(step);

ALTER TABLE "AdaptiveStepConfiguration" ALTER COLUMN "cycleId" SET NOT NULL;
ALTER TABLE "AdaptiveCheckpointInstance" ALTER COLUMN "cycleId" SET NOT NULL;
ALTER TABLE "AdaptiveStepOutput" ALTER COLUMN "cycleId" SET NOT NULL;

DROP INDEX IF EXISTS "AdaptiveStepConfiguration_projectId_stepNumber_version_key";
DROP INDEX IF EXISTS "AdaptiveCheckpointInstance_projectId_stepConfigurationId_checkpointKey_key";
DROP INDEX IF EXISTS "AdaptiveStepOutput_projectId_stepNumber_version_key";

CREATE UNIQUE INDEX "InitiativeCycle_projectId_cycleNumber_key" ON "InitiativeCycle"("projectId", "cycleNumber");
CREATE UNIQUE INDEX "InitiativeCycle_one_active_per_project_key" ON "InitiativeCycle"("projectId") WHERE "status" = 'active';
CREATE INDEX "InitiativeCycle_projectId_idx" ON "InitiativeCycle"("projectId");
CREATE INDEX "InitiativeCycle_projectId_status_idx" ON "InitiativeCycle"("projectId", "status");

CREATE UNIQUE INDEX "CycleStepState_cycleId_stepNumber_key" ON "CycleStepState"("cycleId", "stepNumber");
CREATE INDEX "CycleStepState_cycleId_idx" ON "CycleStepState"("cycleId");
CREATE INDEX "CycleStepState_cycleId_stepNumber_idx" ON "CycleStepState"("cycleId", "stepNumber");

CREATE UNIQUE INDEX "AdaptiveStepConfiguration_cycleId_stepNumber_version_key" ON "AdaptiveStepConfiguration"("cycleId", "stepNumber", "version");
CREATE INDEX "AdaptiveStepConfiguration_cycleId_idx" ON "AdaptiveStepConfiguration"("cycleId");
CREATE INDEX "AdaptiveStepConfiguration_cycleId_stepNumber_idx" ON "AdaptiveStepConfiguration"("cycleId", "stepNumber");

CREATE UNIQUE INDEX "ACI_cycle_config_checkpoint_key" ON "AdaptiveCheckpointInstance"("cycleId", "stepConfigurationId", "checkpointKey");
CREATE INDEX "AdaptiveCheckpointInstance_cycleId_idx" ON "AdaptiveCheckpointInstance"("cycleId");
CREATE INDEX "AdaptiveCheckpointInstance_cycleId_stepNumber_idx" ON "AdaptiveCheckpointInstance"("cycleId", "stepNumber");

CREATE UNIQUE INDEX "AdaptiveStepOutput_cycleId_stepNumber_version_key" ON "AdaptiveStepOutput"("cycleId", "stepNumber", "version");
CREATE INDEX "AdaptiveStepOutput_cycleId_idx" ON "AdaptiveStepOutput"("cycleId");
CREATE INDEX "AdaptiveStepOutput_cycleId_stepNumber_idx" ON "AdaptiveStepOutput"("cycleId", "stepNumber");

CREATE INDEX "AdaptiveProgressSignal_cycleId_idx" ON "AdaptiveProgressSignal"("cycleId");

ALTER TABLE "InitiativeCycle" ADD CONSTRAINT "InitiativeCycle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InitiativeCycle" ADD CONSTRAINT "InitiativeCycle_parentCycleId_fkey" FOREIGN KEY ("parentCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InitiativeCycle" ADD CONSTRAINT "InitiativeCycle_basedOnCycleId_fkey" FOREIGN KEY ("basedOnCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CycleStepState" ADD CONSTRAINT "CycleStepState_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveStepConfiguration" ADD CONSTRAINT "AdaptiveStepConfiguration_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointInstance" ADD CONSTRAINT "AdaptiveCheckpointInstance_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveStepOutput" ADD CONSTRAINT "AdaptiveStepOutput_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveProgressSignal" ADD CONSTRAINT "AdaptiveProgressSignal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
