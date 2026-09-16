-- Portfolio Bootstrap + Home V1 PR-2: pre-canonical bootstrap session and anchor.
-- Adds only Bootstrap-owned tables/enums. No StrategicFront, Challenge, Project,
-- Step, or InitiativePortfolioMeta semantics are changed or backfilled.

CREATE TYPE "PortfolioBootstrapSessionStatus" AS ENUM (
  'active',
  'awaiting_anchor_review',
  'awaiting_work_intake',
  'abandoned'
);

CREATE TYPE "PortfolioBootstrapPhase" AS ENUM (
  'B0_CONTINUE',
  'B1_ANCHOR',
  'B2_WORK_INTAKE'
);

CREATE TYPE "PortfolioAnchorStatus" AS ENUM (
  'anchor_insufficient',
  'anchor_provisional',
  'anchor_sufficient',
  'anchor_confirmed',
  'anchor_conflicting'
);

CREATE TYPE "PortfolioAnchorBusinessSignalStatus" AS ENUM (
  'confirmed',
  'proxy',
  'suggested',
  'unknown',
  'conflicting'
);

CREATE TYPE "PortfolioAnchorProvenanceStatus" AS ENUM (
  'raw_entry',
  'extracted',
  'ai_inferred',
  'ai_suggested',
  'user_confirmed'
);

CREATE TABLE "PortfolioBootstrapSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT,
  "sourceContinuationId" TEXT,
  "status" "PortfolioBootstrapSessionStatus" NOT NULL DEFAULT 'active',
  "bootstrapPhase" "PortfolioBootstrapPhase" NOT NULL DEFAULT 'B0_CONTINUE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioBootstrapSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioAnchor" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "outcomeStatement" TEXT NOT NULL,
  "contextSummary" TEXT,
  "decisionToEnable" TEXT,
  "businessSignalStatus" "PortfolioAnchorBusinessSignalStatus" NOT NULL DEFAULT 'unknown',
  "businessSignalValue" TEXT,
  "status" "PortfolioAnchorStatus" NOT NULL,
  "sourceRefs" JSONB NOT NULL,
  "provenanceStatus" "PortfolioAnchorProvenanceStatus" NOT NULL,
  "confirmedBy" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioAnchor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioAnchorHistory" (
  "id" TEXT NOT NULL,
  "anchorId" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortfolioAnchorHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioBootstrapSession_userId_sourceContinuationId_key"
  ON "PortfolioBootstrapSession"("userId", "sourceContinuationId");
CREATE INDEX "PortfolioBootstrapSession_userId_idx" ON "PortfolioBootstrapSession"("userId");
CREATE INDEX "PortfolioBootstrapSession_sourceContinuationId_idx" ON "PortfolioBootstrapSession"("sourceContinuationId");
CREATE INDEX "PortfolioBootstrapSession_status_idx" ON "PortfolioBootstrapSession"("status");
CREATE INDEX "PortfolioBootstrapSession_bootstrapPhase_idx" ON "PortfolioBootstrapSession"("bootstrapPhase");

CREATE UNIQUE INDEX "PortfolioAnchor_bootstrapSessionId_key" ON "PortfolioAnchor"("bootstrapSessionId");
CREATE INDEX "PortfolioAnchor_bootstrapSessionId_idx" ON "PortfolioAnchor"("bootstrapSessionId");
CREATE INDEX "PortfolioAnchor_status_idx" ON "PortfolioAnchor"("status");
CREATE INDEX "PortfolioAnchor_provenanceStatus_idx" ON "PortfolioAnchor"("provenanceStatus");
CREATE INDEX "PortfolioAnchor_confirmedBy_idx" ON "PortfolioAnchor"("confirmedBy");

CREATE UNIQUE INDEX "PortfolioAnchorHistory_anchorId_version_key" ON "PortfolioAnchorHistory"("anchorId", "version");
CREATE INDEX "PortfolioAnchorHistory_bootstrapSessionId_idx" ON "PortfolioAnchorHistory"("bootstrapSessionId");
CREATE INDEX "PortfolioAnchorHistory_actorUserId_idx" ON "PortfolioAnchorHistory"("actorUserId");
CREATE INDEX "PortfolioAnchorHistory_createdAt_idx" ON "PortfolioAnchorHistory"("createdAt");

ALTER TABLE "PortfolioBootstrapSession"
  ADD CONSTRAINT "PortfolioBootstrapSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapSession"
  ADD CONSTRAINT "PortfolioBootstrapSession_sourceContinuationId_fkey"
  FOREIGN KEY ("sourceContinuationId") REFERENCES "PortfolioEntryPortfolioContinuation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioAnchor"
  ADD CONSTRAINT "PortfolioAnchor_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioAnchor"
  ADD CONSTRAINT "PortfolioAnchor_confirmedBy_fkey"
  FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioAnchorHistory"
  ADD CONSTRAINT "PortfolioAnchorHistory_anchorId_fkey"
  FOREIGN KEY ("anchorId") REFERENCES "PortfolioAnchor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
