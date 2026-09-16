-- Phase 6G: Portfolio Entry explicit conversion boundary.

ALTER TYPE "InitiativeOrigin" ADD VALUE IF NOT EXISTS 'from_portfolio_entry';
ALTER TYPE "PortfolioEntryLifecycleStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';

CREATE TABLE "PortfolioEntryConversion" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "handoffId" TEXT NOT NULL,
  "confirmationId" TEXT NOT NULL,
  "convertedByUserId" TEXT NOT NULL,
  "sourceSnapshot" JSONB NOT NULL,
  "mappingVersion" TEXT NOT NULL,
  "adaptiveCoreInitializationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "adaptiveCoreInitializedAt" TIMESTAMP(3),
  "adaptiveCoreInitializationError" JSONB,
  "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioEntryConversion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioEntryConversion_sessionId_key" ON "PortfolioEntryConversion"("sessionId");
CREATE UNIQUE INDEX "PortfolioEntryConversion_projectId_key" ON "PortfolioEntryConversion"("projectId");
CREATE INDEX "PortfolioEntryConversion_convertedByUserId_idx" ON "PortfolioEntryConversion"("convertedByUserId");
CREATE INDEX "PortfolioEntryConversion_convertedAt_idx" ON "PortfolioEntryConversion"("convertedAt");
CREATE INDEX "PortfolioEntryConversion_adaptiveCoreInitializationStatus_idx" ON "PortfolioEntryConversion"("adaptiveCoreInitializationStatus");

ALTER TABLE "PortfolioEntryConversion"
  ADD CONSTRAINT "PortfolioEntryConversion_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PortfolioEntrySession"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryConversion"
  ADD CONSTRAINT "PortfolioEntryConversion_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryConversion"
  ADD CONSTRAINT "PortfolioEntryConversion_convertedByUserId_fkey"
  FOREIGN KEY ("convertedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
