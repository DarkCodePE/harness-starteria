-- Copilot Block 05 production hardening.
-- Additive only: execution recovery metadata and explicit ambiguous terminal state.

ALTER TYPE "ActionExecutionStatus" ADD VALUE IF NOT EXISTS 'manual_review_required';

ALTER TABLE "ActionExecution"
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "reconciliationClaimId" TEXT,
  ADD COLUMN "reconciliationClaimedAt" TIMESTAMP(3);

CREATE INDEX "ActionExecution_status_updatedAt_idx" ON "ActionExecution"("status", "updatedAt");
CREATE INDEX "ActionExecution_correlationId_idx" ON "ActionExecution"("correlationId");
CREATE INDEX "ActionExecution_reconciliationClaimId_idx" ON "ActionExecution"("reconciliationClaimId");
