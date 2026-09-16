-- PR-6 B4 Human Material Review.
-- Stores only Bootstrap-governed review state. It does not create StrategicFront,
-- Challenge, Project, Step, InitiativePortfolioMeta, or PortfolioReading rows.

ALTER TYPE "PortfolioBootstrapSessionStatus" ADD VALUE IF NOT EXISTS 'awaiting_first_reading';
ALTER TYPE "PortfolioBootstrapPhase" ADD VALUE IF NOT EXISTS 'B5_FIRST_READING';

CREATE TYPE "PortfolioBootstrapStrategicConnectionStatus" AS ENUM (
  'confirmed_alignment',
  'partial_alignment',
  'alignment_unknown',
  'confirmed_misalignment',
  'out_of_current_priority'
);

CREATE TYPE "PortfolioBootstrapAdvancementConditionType" AS ENUM (
  'business_signal',
  'decision_path',
  'critical_dependency',
  'required_context',
  'ownership_visibility'
);

CREATE TYPE "PortfolioBootstrapAdvancementSeverity" AS ENUM (
  'info',
  'attention',
  'blocking'
);

CREATE TYPE "PortfolioBootstrapGovernedProvenanceStatus" AS ENUM (
  'user_confirmed'
);

ALTER TABLE "PortfolioBootstrapProposedMutation"
  ADD COLUMN "originalProposedValue" JSONB,
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "correctedBy" TEXT,
  ADD COLUMN "correctedAt" TIMESTAMP(3);

CREATE INDEX "PortfolioBootstrapProposedMutation_reviewedBy_idx"
  ON "PortfolioBootstrapProposedMutation"("reviewedBy");

CREATE TABLE "PortfolioStrategicConnection" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "anchorId" TEXT NOT NULL,
  "sourceMutationId" TEXT NOT NULL,
  "status" "PortfolioBootstrapStrategicConnectionStatus" NOT NULL,
  "rationale" TEXT,
  "provenanceStatus" "PortfolioBootstrapGovernedProvenanceStatus" NOT NULL,
  "sourceRefs" JSONB NOT NULL,
  "confirmedBy" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioStrategicConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioAdvancementCondition" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "workItemId" TEXT,
  "sourceMutationId" TEXT NOT NULL,
  "type" "PortfolioBootstrapAdvancementConditionType" NOT NULL,
  "status" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "severity" "PortfolioBootstrapAdvancementSeverity" NOT NULL,
  "movementAffected" TEXT,
  "provenanceStatus" "PortfolioBootstrapGovernedProvenanceStatus" NOT NULL,
  "sourceRefs" JSONB NOT NULL,
  "confirmedBy" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioAdvancementCondition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioStrategicConnection_sourceMutationId_key"
  ON "PortfolioStrategicConnection"("sourceMutationId");
CREATE INDEX "PortfolioStrategicConnection_bootstrapSessionId_idx"
  ON "PortfolioStrategicConnection"("bootstrapSessionId");
CREATE INDEX "PortfolioStrategicConnection_workItemId_idx"
  ON "PortfolioStrategicConnection"("workItemId");
CREATE INDEX "PortfolioStrategicConnection_anchorId_idx"
  ON "PortfolioStrategicConnection"("anchorId");
CREATE INDEX "PortfolioStrategicConnection_status_idx"
  ON "PortfolioStrategicConnection"("status");
CREATE INDEX "PortfolioStrategicConnection_confirmedBy_idx"
  ON "PortfolioStrategicConnection"("confirmedBy");

CREATE UNIQUE INDEX "PortfolioAdvancementCondition_sourceMutationId_key"
  ON "PortfolioAdvancementCondition"("sourceMutationId");
CREATE INDEX "PortfolioAdvancementCondition_bootstrapSessionId_idx"
  ON "PortfolioAdvancementCondition"("bootstrapSessionId");
CREATE INDEX "PortfolioAdvancementCondition_workItemId_idx"
  ON "PortfolioAdvancementCondition"("workItemId");
CREATE INDEX "PortfolioAdvancementCondition_type_idx"
  ON "PortfolioAdvancementCondition"("type");
CREATE INDEX "PortfolioAdvancementCondition_severity_idx"
  ON "PortfolioAdvancementCondition"("severity");
CREATE INDEX "PortfolioAdvancementCondition_confirmedBy_idx"
  ON "PortfolioAdvancementCondition"("confirmedBy");

ALTER TABLE "PortfolioStrategicConnection"
  ADD CONSTRAINT "PortfolioStrategicConnection_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioStrategicConnection"
  ADD CONSTRAINT "PortfolioStrategicConnection_workItemId_fkey"
  FOREIGN KEY ("workItemId") REFERENCES "PortfolioBootstrapWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioStrategicConnection"
  ADD CONSTRAINT "PortfolioStrategicConnection_anchorId_fkey"
  FOREIGN KEY ("anchorId") REFERENCES "PortfolioAnchor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioStrategicConnection"
  ADD CONSTRAINT "PortfolioStrategicConnection_sourceMutationId_fkey"
  FOREIGN KEY ("sourceMutationId") REFERENCES "PortfolioBootstrapProposedMutation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioAdvancementCondition"
  ADD CONSTRAINT "PortfolioAdvancementCondition_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioAdvancementCondition"
  ADD CONSTRAINT "PortfolioAdvancementCondition_workItemId_fkey"
  FOREIGN KEY ("workItemId") REFERENCES "PortfolioBootstrapWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioAdvancementCondition"
  ADD CONSTRAINT "PortfolioAdvancementCondition_sourceMutationId_fkey"
  FOREIGN KEY ("sourceMutationId") REFERENCES "PortfolioBootstrapProposedMutation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
