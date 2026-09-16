-- Portfolio Bootstrap + Home V1 PR-4: provisional B2 work intake.
-- Adds only Bootstrap-owned intake state. No StrategicFront, Challenge, Project,
-- Step, or InitiativePortfolioMeta semantics are changed or backfilled.

ALTER TYPE "PortfolioBootstrapSessionStatus" ADD VALUE 'awaiting_structuring';
ALTER TYPE "PortfolioBootstrapPhase" ADD VALUE 'B3_PROVISIONAL_STRUCTURING';

CREATE TYPE "PortfolioBootstrapExistingWorkStatus" AS ENUM (
  'unknown',
  'has_work',
  'no_existing_work'
);

CREATE TYPE "PortfolioBootstrapWorkItemSourceType" AS ENUM (
  'pasted_text',
  'manual_entry',
  'entry_context'
);

CREATE TYPE "PortfolioBootstrapWorkItemStatus" AS ENUM (
  'detected',
  'needs_review',
  'pending',
  'confirmed_in_portfolio',
  'rejected'
);

CREATE TYPE "PortfolioBootstrapWorkItemStateHint" AS ENUM (
  'idea',
  'candidate',
  'active',
  'paused',
  'completed',
  'unknown'
);

ALTER TABLE "PortfolioBootstrapSession"
  ADD COLUMN "existingWorkStatus" "PortfolioBootstrapExistingWorkStatus" NOT NULL DEFAULT 'unknown';

CREATE TABLE "PortfolioBootstrapWorkIntakeSource" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "sourceType" "PortfolioBootstrapWorkItemSourceType" NOT NULL,
  "rawInput" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortfolioBootstrapWorkIntakeSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioBootstrapWorkItem" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "rawLabel" TEXT NOT NULL,
  "proposedName" TEXT,
  "proposedPurpose" TEXT,
  "sourceType" "PortfolioBootstrapWorkItemSourceType" NOT NULL,
  "status" "PortfolioBootstrapWorkItemStatus" NOT NULL DEFAULT 'detected',
  "currentStateHint" "PortfolioBootstrapWorkItemStateHint",
  "ownerCandidate" TEXT,
  "sourceRefs" JSONB NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioBootstrapWorkItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioBootstrapSession_existingWorkStatus_idx" ON "PortfolioBootstrapSession"("existingWorkStatus");

CREATE UNIQUE INDEX "PortfolioBootstrapWorkIntakeSource_bootstrapSessionId_requestHash_key"
  ON "PortfolioBootstrapWorkIntakeSource"("bootstrapSessionId", "requestHash");
CREATE INDEX "PortfolioBootstrapWorkIntakeSource_bootstrapSessionId_idx" ON "PortfolioBootstrapWorkIntakeSource"("bootstrapSessionId");
CREATE INDEX "PortfolioBootstrapWorkIntakeSource_sourceType_idx" ON "PortfolioBootstrapWorkIntakeSource"("sourceType");
CREATE INDEX "PortfolioBootstrapWorkIntakeSource_createdBy_idx" ON "PortfolioBootstrapWorkIntakeSource"("createdBy");
CREATE INDEX "PortfolioBootstrapWorkIntakeSource_createdAt_idx" ON "PortfolioBootstrapWorkIntakeSource"("createdAt");

CREATE INDEX "PortfolioBootstrapWorkItem_bootstrapSessionId_idx" ON "PortfolioBootstrapWorkItem"("bootstrapSessionId");
CREATE INDEX "PortfolioBootstrapWorkItem_sourceId_idx" ON "PortfolioBootstrapWorkItem"("sourceId");
CREATE INDEX "PortfolioBootstrapWorkItem_sourceType_idx" ON "PortfolioBootstrapWorkItem"("sourceType");
CREATE INDEX "PortfolioBootstrapWorkItem_status_idx" ON "PortfolioBootstrapWorkItem"("status");
CREATE INDEX "PortfolioBootstrapWorkItem_createdBy_idx" ON "PortfolioBootstrapWorkItem"("createdBy");
CREATE INDEX "PortfolioBootstrapWorkItem_createdAt_idx" ON "PortfolioBootstrapWorkItem"("createdAt");

ALTER TABLE "PortfolioBootstrapWorkIntakeSource"
  ADD CONSTRAINT "PortfolioBootstrapWorkIntakeSource_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapWorkItem"
  ADD CONSTRAINT "PortfolioBootstrapWorkItem_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapWorkItem"
  ADD CONSTRAINT "PortfolioBootstrapWorkItem_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "PortfolioBootstrapWorkIntakeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
