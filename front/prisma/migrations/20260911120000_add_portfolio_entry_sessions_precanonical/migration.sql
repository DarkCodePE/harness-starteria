-- Portfolio Entry Sessions (Phase 6D): pre-canonical persistence boundary.
-- This migration introduces new tables only. It does not backfill or connect to
-- Project, Initiative, Step, PublicDraft, PilotLead, or conversion flows.

CREATE TYPE "PortfolioEntryOwnershipState" AS ENUM (
  'ANONYMOUS',
  'CLAIMED',
  'LOCKED',
  'ABANDONED'
);

CREATE TYPE "PortfolioEntryLifecycleStatus" AS ENUM (
  'ENTRY_CAPTURED',
  'ANALYZING',
  'CLARIFYING',
  'HANDOFF_ELIGIBLE',
  'HANDOFF_GENERATING',
  'HANDOFF_READY',
  'AWAITING_CONFIRMATION',
  'REVISIONS_REQUESTED',
  'CONFIRMED',
  'CONVERSION_ELIGIBLE',
  'EXPIRED',
  'ABANDONED'
);

CREATE TYPE "PortfolioEntryExecutionStatus" AS ENUM (
  'NOT_STARTED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED_RETRYABLE',
  'FAILED_FINAL',
  'SCHEMA_ERROR',
  'TECHNICAL_ERROR'
);

CREATE TYPE "PortfolioEntryConfirmationStatus" AS ENUM (
  'UNREVIEWED',
  'PARTIALLY_CONFIRMED',
  'CONFIRMED',
  'REVISIONS_REQUESTED'
);

CREATE TABLE "PortfolioEntrySession" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "publicAccessTokenHash" TEXT,
  "ownershipState" "PortfolioEntryOwnershipState" NOT NULL DEFAULT 'ANONYMOUS',
  "rawEntry" TEXT NOT NULL,
  "entryOrigin" TEXT NOT NULL,
  "sourceMetadata" JSONB,
  "lifecycleStatus" "PortfolioEntryLifecycleStatus" NOT NULL DEFAULT 'ENTRY_CAPTURED',
  "executionStatus" "PortfolioEntryExecutionStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "interactionMode" TEXT NOT NULL,
  "semanticState" JSONB NOT NULL,
  "questionBudget" JSONB NOT NULL,
  "latestAnalysis" JSONB,
  "contractVersion" TEXT NOT NULL,
  "runtimeVersion" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "promptManifestId" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastActivityAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "expiredAt" TIMESTAMP(3),

  CONSTRAINT "PortfolioEntrySession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioEntryTurn" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "turnIndex" INTEGER NOT NULL,
  "userInput" TEXT NOT NULL,
  "emittedQuestions" JSONB NOT NULL,
  "matchedQuestionIds" JSONB NOT NULL,
  "respondedResolves" JSONB NOT NULL,
  "analysisSnapshot" JSONB NOT NULL,
  "semanticStateAfter" JSONB NOT NULL,
  "questionBudgetBefore" JSONB NOT NULL,
  "questionBudgetAfter" JSONB NOT NULL,
  "transition" JSONB NOT NULL,
  "provenanceDelta" JSONB,
  "contractVersion" TEXT NOT NULL,
  "runtimeVersion" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "promptManifestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioEntryTurn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioEntryHandoff" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "sourceTurnId" TEXT,
  "handoffPayload" JSONB NOT NULL,
  "handoffStatus" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "runtimeVersion" TEXT NOT NULL,
  "promptManifestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioEntryHandoff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioEntryConfirmation" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "handoffId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "PortfolioEntryConfirmationStatus" NOT NULL,
  "acceptedFields" JSONB NOT NULL,
  "correctedFields" JSONB NOT NULL,
  "rejectedFields" JSONB NOT NULL,
  "notes" TEXT,
  "confirmedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioEntryConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioEntryModelExecution" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "turnId" TEXT,
  "handoffId" TEXT,
  "purpose" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "requestedModel" TEXT NOT NULL,
  "providerReportedModel" TEXT,
  "callId" TEXT,
  "durationMs" INTEGER NOT NULL,
  "retryCount" INTEGER NOT NULL,
  "retryReason" TEXT,
  "usage" JSONB,
  "technicalError" JSONB,
  "schemaErrors" JSONB NOT NULL,
  "parsedOutputPresent" BOOLEAN NOT NULL,
  "validatedOutputPresent" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortfolioEntryModelExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioEntrySession_publicAccessTokenHash_key"
  ON "PortfolioEntrySession"("publicAccessTokenHash");
CREATE INDEX "PortfolioEntrySession_ownerUserId_idx"
  ON "PortfolioEntrySession"("ownerUserId");
CREATE INDEX "PortfolioEntrySession_ownershipState_idx"
  ON "PortfolioEntrySession"("ownershipState");
CREATE INDEX "PortfolioEntrySession_lifecycleStatus_idx"
  ON "PortfolioEntrySession"("lifecycleStatus");
CREATE INDEX "PortfolioEntrySession_expiresAt_idx"
  ON "PortfolioEntrySession"("expiresAt");
CREATE INDEX "PortfolioEntrySession_lastActivityAt_idx"
  ON "PortfolioEntrySession"("lastActivityAt");
CREATE INDEX "PortfolioEntrySession_lifecycleStatus_expiresAt_idx"
  ON "PortfolioEntrySession"("lifecycleStatus", "expiresAt");

CREATE UNIQUE INDEX "PortfolioEntryTurn_sessionId_turnIndex_key"
  ON "PortfolioEntryTurn"("sessionId", "turnIndex");
CREATE INDEX "PortfolioEntryTurn_sessionId_createdAt_idx"
  ON "PortfolioEntryTurn"("sessionId", "createdAt");

CREATE UNIQUE INDEX "PortfolioEntryHandoff_sessionId_version_key"
  ON "PortfolioEntryHandoff"("sessionId", "version");
CREATE INDEX "PortfolioEntryHandoff_sessionId_createdAt_idx"
  ON "PortfolioEntryHandoff"("sessionId", "createdAt");
CREATE INDEX "PortfolioEntryHandoff_sourceTurnId_idx"
  ON "PortfolioEntryHandoff"("sourceTurnId");
CREATE INDEX "PortfolioEntryHandoff_handoffStatus_idx"
  ON "PortfolioEntryHandoff"("handoffStatus");

CREATE UNIQUE INDEX "PortfolioEntryConfirmation_sessionId_version_key"
  ON "PortfolioEntryConfirmation"("sessionId", "version");
CREATE INDEX "PortfolioEntryConfirmation_sessionId_status_idx"
  ON "PortfolioEntryConfirmation"("sessionId", "status");
CREATE INDEX "PortfolioEntryConfirmation_handoffId_idx"
  ON "PortfolioEntryConfirmation"("handoffId");
CREATE INDEX "PortfolioEntryConfirmation_confirmedByUserId_idx"
  ON "PortfolioEntryConfirmation"("confirmedByUserId");

CREATE INDEX "PortfolioEntryModelExecution_sessionId_createdAt_idx"
  ON "PortfolioEntryModelExecution"("sessionId", "createdAt");
CREATE INDEX "PortfolioEntryModelExecution_turnId_idx"
  ON "PortfolioEntryModelExecution"("turnId");
CREATE INDEX "PortfolioEntryModelExecution_handoffId_idx"
  ON "PortfolioEntryModelExecution"("handoffId");
CREATE INDEX "PortfolioEntryModelExecution_purpose_createdAt_idx"
  ON "PortfolioEntryModelExecution"("purpose", "createdAt");
CREATE INDEX "PortfolioEntryModelExecution_provider_createdAt_idx"
  ON "PortfolioEntryModelExecution"("provider", "createdAt");

ALTER TABLE "PortfolioEntryTurn"
  ADD CONSTRAINT "PortfolioEntryTurn_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PortfolioEntrySession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryHandoff"
  ADD CONSTRAINT "PortfolioEntryHandoff_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PortfolioEntrySession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryHandoff"
  ADD CONSTRAINT "PortfolioEntryHandoff_sourceTurnId_fkey"
  FOREIGN KEY ("sourceTurnId") REFERENCES "PortfolioEntryTurn"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryConfirmation"
  ADD CONSTRAINT "PortfolioEntryConfirmation_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PortfolioEntrySession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryConfirmation"
  ADD CONSTRAINT "PortfolioEntryConfirmation_handoffId_fkey"
  FOREIGN KEY ("handoffId") REFERENCES "PortfolioEntryHandoff"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryModelExecution"
  ADD CONSTRAINT "PortfolioEntryModelExecution_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PortfolioEntrySession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryModelExecution"
  ADD CONSTRAINT "PortfolioEntryModelExecution_turnId_fkey"
  FOREIGN KEY ("turnId") REFERENCES "PortfolioEntryTurn"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryModelExecution"
  ADD CONSTRAINT "PortfolioEntryModelExecution_handoffId_fkey"
  FOREIGN KEY ("handoffId") REFERENCES "PortfolioEntryHandoff"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
