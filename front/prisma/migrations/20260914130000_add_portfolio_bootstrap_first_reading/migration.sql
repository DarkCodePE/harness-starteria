-- PR-7 B5 First Portfolio Reading.
-- Publishes only a versioned Bootstrap reading. It does not create StrategicFront,
-- Challenge, Project, Step, InitiativePortfolioMeta, or activate initiatives.

ALTER TYPE "PortfolioBootstrapSessionStatus" ADD VALUE IF NOT EXISTS 'reading_published';

CREATE TABLE "PortfolioReading" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "anchorId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "summary" TEXT NOT NULL,
  "totalWorkItems" INTEGER NOT NULL,
  "confirmedConnections" INTEGER NOT NULL,
  "uncertainConnections" INTEGER NOT NULL,
  "signalGapCount" INTEGER NOT NULL,
  "unresolvedDependencyCount" INTEGER NOT NULL,
  "decisionPathGapCount" INTEGER NOT NULL,
  "requiredContextGapCount" INTEGER NOT NULL,
  "ownershipGapCount" INTEGER NOT NULL,
  "possibleMisalignmentCount" INTEGER NOT NULL,
  "confirmedMisalignmentCount" INTEGER NOT NULL,
  "primaryAttentionItems" JSONB NOT NULL,
  "nextBestAction" TEXT NOT NULL,
  "sourceBootstrapVersion" TEXT NOT NULL,
  "sourceAnchorVersion" INTEGER NOT NULL,
  "sourceSnapshot" JSONB NOT NULL,
  "stateHash" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "homeState" TEXT NOT NULL,
  "publishedBy" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioReading_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioReading_bootstrapSessionId_version_key"
  ON "PortfolioReading"("bootstrapSessionId", "version");
CREATE UNIQUE INDEX "PortfolioReading_bootstrapSessionId_stateHash_idempotencyKey_key"
  ON "PortfolioReading"("bootstrapSessionId", "stateHash", "idempotencyKey");
CREATE INDEX "PortfolioReading_bootstrapSessionId_idx"
  ON "PortfolioReading"("bootstrapSessionId");
CREATE INDEX "PortfolioReading_anchorId_idx"
  ON "PortfolioReading"("anchorId");
CREATE INDEX "PortfolioReading_homeState_idx"
  ON "PortfolioReading"("homeState");
CREATE INDEX "PortfolioReading_publishedBy_idx"
  ON "PortfolioReading"("publishedBy");
CREATE INDEX "PortfolioReading_publishedAt_idx"
  ON "PortfolioReading"("publishedAt");
CREATE INDEX "PortfolioReading_stateHash_idx"
  ON "PortfolioReading"("stateHash");

ALTER TABLE "PortfolioReading"
  ADD CONSTRAINT "PortfolioReading_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioReading"
  ADD CONSTRAINT "PortfolioReading_anchorId_fkey"
  FOREIGN KEY ("anchorId") REFERENCES "PortfolioAnchor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioReading"
  ADD CONSTRAINT "PortfolioReading_publishedBy_fkey"
  FOREIGN KEY ("publishedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
