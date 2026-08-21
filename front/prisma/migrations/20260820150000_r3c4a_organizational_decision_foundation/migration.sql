-- R3-C4A Organizational Decision foundation.
-- Decision is a human-authorized historical record, not route/effects application.

CREATE TYPE "DecisionOutcome" AS ENUM (
  'continue_experimenting',
  'implement',
  'scale',
  'pause',
  'close_with_learning'
);

CREATE TABLE "Decision" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceCycleId" TEXT NOT NULL,
  "decisionRequestId" TEXT NOT NULL,
  "outcome" "DecisionOutcome" NOT NULL,
  "decidedById" TEXT NOT NULL,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rationale" TEXT NOT NULL,
  "conditionsJson" JSONB,
  "authoritySnapshotJson" JSONB NOT NULL,
  "readinessSnapshotJson" JSONB NOT NULL,
  "recommendationSnapshotJson" JSONB,
  "packageSnapshotJson" JSONB NOT NULL,
  "presentationSnapshotJson" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Decision_decisionRequestId_key" ON "Decision"("decisionRequestId");
CREATE UNIQUE INDEX "Decision_idempotencyKey_key" ON "Decision"("idempotencyKey");
CREATE INDEX "Decision_projectId_idx" ON "Decision"("projectId");
CREATE INDEX "Decision_sourceCycleId_idx" ON "Decision"("sourceCycleId");
CREATE INDEX "Decision_decidedById_idx" ON "Decision"("decidedById");
CREATE INDEX "Decision_outcome_idx" ON "Decision"("outcome");
CREATE INDEX "Decision_decidedAt_idx" ON "Decision"("decidedAt");

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_sourceCycleId_fkey"
  FOREIGN KEY ("sourceCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_decisionRequestId_fkey"
  FOREIGN KEY ("decisionRequestId") REFERENCES "DecisionRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_decidedById_fkey"
  FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
