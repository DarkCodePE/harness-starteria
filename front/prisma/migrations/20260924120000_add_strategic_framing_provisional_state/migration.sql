-- SF-3B: Strategic Framing-owned provisional state. No canonical Portfolio rows are touched.
CREATE TYPE "StrategicFramingProvisionalSourceMode" AS ENUM ('public_entry', 'enterprise_direct', 'existing_portfolio');
CREATE TYPE "StrategicFramingProvisionalSubject" AS ENUM ('front_like', 'challenge_like', 'initiative_like', 'unresolved');
CREATE TYPE "StrategicFramingProvisionalParentStatus" AS ENUM ('known', 'provisional', 'unresolved');

CREATE TABLE "StrategicFramingProvisionalState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT,
  "sourceMode" "StrategicFramingProvisionalSourceMode" NOT NULL,
  "logicalContextKey" TEXT NOT NULL,
  "sourceRefs" JSONB NOT NULL,
  "provenance" JSONB NOT NULL,
  "intendedMovement" TEXT,
  "whyItMatters" TEXT,
  "movementSignalStatus" TEXT,
  "movementSignalValue" TEXT,
  "horizonContext" TEXT,
  "decisionToEnable" TEXT,
  "subjectLevel" "StrategicFramingProvisionalSubject" NOT NULL,
  "scopeAssessment" JSONB NOT NULL,
  "rationaleUncertainty" TEXT,
  "parentStatus" "StrategicFramingProvisionalParentStatus" NOT NULL,
  "parentContext" JSONB NOT NULL,
  "sufficiencyStatus" TEXT NOT NULL,
  "blockers" JSONB NOT NULL,
  "softGaps" JSONB NOT NULL,
  "optionalContext" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StrategicFramingProvisionalState_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StrategicFramingProvisionalStateHistory" (
  "id" TEXT NOT NULL,
  "stateId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StrategicFramingProvisionalStateHistory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StrategicFramingProvisionalState_userId_logicalContextKey_key" ON "StrategicFramingProvisionalState"("userId", "logicalContextKey");
CREATE INDEX "StrategicFramingProvisionalState_organizationId_idx" ON "StrategicFramingProvisionalState"("organizationId");
CREATE INDEX "StrategicFramingProvisionalState_sourceMode_idx" ON "StrategicFramingProvisionalState"("sourceMode");
CREATE INDEX "StrategicFramingProvisionalState_parentStatus_idx" ON "StrategicFramingProvisionalState"("parentStatus");
CREATE UNIQUE INDEX "StrategicFramingProvisionalStateHistory_stateId_version_key" ON "StrategicFramingProvisionalStateHistory"("stateId", "version");
CREATE INDEX "StrategicFramingProvisionalStateHistory_actorUserId_idx" ON "StrategicFramingProvisionalStateHistory"("actorUserId");
CREATE INDEX "StrategicFramingProvisionalStateHistory_createdAt_idx" ON "StrategicFramingProvisionalStateHistory"("createdAt");
ALTER TABLE "StrategicFramingProvisionalStateHistory" ADD CONSTRAINT "StrategicFramingProvisionalStateHistory_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StrategicFramingProvisionalState"("id") ON DELETE CASCADE ON UPDATE CASCADE;
