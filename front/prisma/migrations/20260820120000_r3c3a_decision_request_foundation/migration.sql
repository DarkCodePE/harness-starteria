-- R3-C3A DecisionRequest foundation.
-- DecisionRequest is a portfolio review bridge, not an Organizational Decision.

CREATE TYPE "DecisionRequestStatus" AS ENUM (
  'pending',
  'resolved',
  'cancelled',
  'superseded'
);

CREATE TABLE "DecisionRequest" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceCycleId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "DecisionRequestStatus" NOT NULL DEFAULT 'pending',
  "authorityType" TEXT NOT NULL,
  "authorityUserId" TEXT,
  "readinessSnapshotJson" JSONB NOT NULL,
  "authoritySnapshotJson" JSONB NOT NULL,
  "decisionPackageSnapshotJson" JSONB NOT NULL,
  "recommendationSnapshotJson" JSONB,
  "presentationSnapshotJson" JSONB,
  "requestVersion" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DecisionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionRequest_idempotencyKey_key" ON "DecisionRequest"("idempotencyKey");
CREATE UNIQUE INDEX "DecisionRequest_one_pending_per_presentation_key" ON "DecisionRequest"("projectId", "sourceCycleId") WHERE "status" = 'pending';
CREATE INDEX "DecisionRequest_projectId_sourceCycleId_status_idx" ON "DecisionRequest"("projectId", "sourceCycleId", "status");
CREATE INDEX "DecisionRequest_projectId_idx" ON "DecisionRequest"("projectId");
CREATE INDEX "DecisionRequest_sourceCycleId_idx" ON "DecisionRequest"("sourceCycleId");
CREATE INDEX "DecisionRequest_requestedById_idx" ON "DecisionRequest"("requestedById");
CREATE INDEX "DecisionRequest_authorityUserId_idx" ON "DecisionRequest"("authorityUserId");
CREATE INDEX "DecisionRequest_status_idx" ON "DecisionRequest"("status");
CREATE INDEX "DecisionRequest_requestedAt_idx" ON "DecisionRequest"("requestedAt");

ALTER TABLE "DecisionRequest"
  ADD CONSTRAINT "DecisionRequest_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DecisionRequest"
  ADD CONSTRAINT "DecisionRequest_sourceCycleId_fkey"
  FOREIGN KEY ("sourceCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DecisionRequest"
  ADD CONSTRAINT "DecisionRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DecisionRequest"
  ADD CONSTRAINT "DecisionRequest_authorityUserId_fkey"
  FOREIGN KEY ("authorityUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
