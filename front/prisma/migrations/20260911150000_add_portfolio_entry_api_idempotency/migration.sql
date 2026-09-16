-- Phase 6E: HTTP/application idempotency for public Portfolio Entry operations.
-- This is deliberately separate from pre-canonical semantic session state.
CREATE TABLE "PortfolioEntryApiIdempotency" (
  "id" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "sessionId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "requestPayloadHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioEntryApiIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioEntryApiIdempotency_operation_scope_idempotencyKey_key"
  ON "PortfolioEntryApiIdempotency"("operation", "scope", "idempotencyKey");
CREATE INDEX "PortfolioEntryApiIdempotency_sessionId_idx"
  ON "PortfolioEntryApiIdempotency"("sessionId");
CREATE INDEX "PortfolioEntryApiIdempotency_expiresAt_idx"
  ON "PortfolioEntryApiIdempotency"("expiresAt");
CREATE INDEX "PortfolioEntryApiIdempotency_operation_createdAt_idx"
  ON "PortfolioEntryApiIdempotency"("operation", "createdAt");
