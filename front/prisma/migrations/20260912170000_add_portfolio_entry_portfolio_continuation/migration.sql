-- Portfolio Entry -> Portfolio continuation boundary.
-- Keeps Entry context pre-canonical and separate from Project/Steps conversion.

CREATE TYPE "PortfolioEntryProfile" AS ENUM ('PORTFOLIO_LEAD_ENTRY', 'INITIATIVE_ENTRY');

ALTER TABLE "PortfolioEntrySession"
  ADD COLUMN "continuationProfile" "PortfolioEntryProfile";

CREATE INDEX "PortfolioEntrySession_continuationProfile_idx"
  ON "PortfolioEntrySession"("continuationProfile");

CREATE TABLE "PortfolioEntryPortfolioContinuation" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "handoffId" TEXT NOT NULL,
  "confirmationId" TEXT NOT NULL,
  "continuedByUserId" TEXT NOT NULL,
  "portfolioScope" JSONB NOT NULL,
  "sourceSnapshot" JSONB NOT NULL,
  "pendingItems" JSONB NOT NULL,
  "mappingVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONTINUED',
  "destinationRoute" TEXT NOT NULL,
  "continuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioEntryPortfolioContinuation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioEntryPortfolioContinuation_sessionId_key"
  ON "PortfolioEntryPortfolioContinuation"("sessionId");

CREATE INDEX "PortfolioEntryPortfolioContinuation_continuedByUserId_idx"
  ON "PortfolioEntryPortfolioContinuation"("continuedByUserId");

CREATE INDEX "PortfolioEntryPortfolioContinuation_continuedAt_idx"
  ON "PortfolioEntryPortfolioContinuation"("continuedAt");

CREATE INDEX "PortfolioEntryPortfolioContinuation_status_idx"
  ON "PortfolioEntryPortfolioContinuation"("status");

ALTER TABLE "PortfolioEntryPortfolioContinuation"
  ADD CONSTRAINT "PortfolioEntryPortfolioContinuation_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PortfolioEntrySession"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioEntryPortfolioContinuation"
  ADD CONSTRAINT "PortfolioEntryPortfolioContinuation_continuedByUserId_fkey"
  FOREIGN KEY ("continuedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
