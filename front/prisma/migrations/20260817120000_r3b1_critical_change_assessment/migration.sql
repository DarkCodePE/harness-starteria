CREATE TYPE "CriticalChangeScope" AS ENUM ('execution', 'experiment', 'solution', 'hypothesis', 'focus', 'challenge');
CREATE TYPE "CriticalChangeStatus" AS ENUM ('detected', 'assessment_ready', 'confirmed', 'applied', 'dismissed');

CREATE TABLE "CriticalChange" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceCycleId" TEXT NOT NULL,
    "resultingCycleId" TEXT,
    "basedOnCycleId" TEXT,
    "detectedAtStep" INTEGER NOT NULL,
    "changeScope" "CriticalChangeScope" NOT NULL,
    "field" TEXT,
    "status" "CriticalChangeStatus" NOT NULL DEFAULT 'detected',
    "proposedById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "proposedReentryStep" INTEGER,
    "confirmedReentryStep" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "previousValueJson" JSONB,
    "nextValueJson" JSONB NOT NULL,
    "impactJson" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CriticalChange_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CriticalChange_idempotencyKey_key" ON "CriticalChange"("idempotencyKey");
CREATE INDEX "CriticalChange_projectId_idx" ON "CriticalChange"("projectId");
CREATE INDEX "CriticalChange_sourceCycleId_idx" ON "CriticalChange"("sourceCycleId");
CREATE INDEX "CriticalChange_resultingCycleId_idx" ON "CriticalChange"("resultingCycleId");
CREATE INDEX "CriticalChange_basedOnCycleId_idx" ON "CriticalChange"("basedOnCycleId");
CREATE INDEX "CriticalChange_projectId_status_idx" ON "CriticalChange"("projectId", "status");

ALTER TABLE "CriticalChange" ADD CONSTRAINT "CriticalChange_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CriticalChange" ADD CONSTRAINT "CriticalChange_sourceCycleId_fkey" FOREIGN KEY ("sourceCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CriticalChange" ADD CONSTRAINT "CriticalChange_resultingCycleId_fkey" FOREIGN KEY ("resultingCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CriticalChange" ADD CONSTRAINT "CriticalChange_basedOnCycleId_fkey" FOREIGN KEY ("basedOnCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
