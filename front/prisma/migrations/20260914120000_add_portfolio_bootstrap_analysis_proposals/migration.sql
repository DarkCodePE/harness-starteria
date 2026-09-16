-- Portfolio Bootstrap + Home V1 PR-5: B3 provisional structuring.
-- Adds only Bootstrap-owned analysis/proposal state. No StrategicFront, Challenge,
-- Project, Step, InitiativePortfolioMeta, or PortfolioReading records are created.

ALTER TYPE "PortfolioBootstrapSessionStatus" ADD VALUE 'awaiting_material_review';
ALTER TYPE "PortfolioBootstrapPhase" ADD VALUE 'B4_MATERIAL_REVIEW';

CREATE TYPE "PortfolioBootstrapAnalysisRunStatus" AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE "PortfolioBootstrapAnalyzerMode" AS ENUM (
  'deterministic',
  'real_ai'
);

CREATE TYPE "PortfolioBootstrapProposedMutationTargetType" AS ENUM (
  'work_item',
  'strategic_connection',
  'advancement_condition',
  'portfolio_anchor'
);

CREATE TYPE "PortfolioBootstrapProposedMutationType" AS ENUM (
  'create',
  'update',
  'classify',
  'link',
  'unlink',
  'confirm',
  'reject'
);

CREATE TYPE "PortfolioBootstrapProposedMutationProvenanceStatus" AS ENUM (
  'ai_inferred',
  'ai_suggested'
);

CREATE TYPE "PortfolioBootstrapUncertainty" AS ENUM (
  'low',
  'medium',
  'high'
);

CREATE TYPE "PortfolioBootstrapMateriality" AS ENUM (
  'low',
  'material'
);

CREATE TYPE "PortfolioBootstrapProposedMutationStatus" AS ENUM (
  'proposed',
  'reviewed',
  'confirmed',
  'rejected',
  'superseded',
  'expired'
);

CREATE TABLE "PortfolioBootstrapAnalysisRun" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "status" "PortfolioBootstrapAnalysisRunStatus" NOT NULL DEFAULT 'pending',
  "analyzerMode" "PortfolioBootstrapAnalyzerMode" NOT NULL,
  "inputVersion" TEXT NOT NULL,
  "outputVersion" TEXT,
  "error" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "PortfolioBootstrapAnalysisRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioBootstrapProposedMutation" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "analysisRunId" TEXT NOT NULL,
  "targetType" "PortfolioBootstrapProposedMutationTargetType" NOT NULL,
  "targetId" TEXT,
  "mutationType" "PortfolioBootstrapProposedMutationType" NOT NULL,
  "currentValue" JSONB,
  "proposedValue" JSONB NOT NULL,
  "rationale" TEXT,
  "sourceRefs" JSONB NOT NULL,
  "provenanceStatus" "PortfolioBootstrapProposedMutationProvenanceStatus" NOT NULL,
  "uncertainty" "PortfolioBootstrapUncertainty" NOT NULL,
  "materiality" "PortfolioBootstrapMateriality" NOT NULL,
  "confirmationRequired" BOOLEAN NOT NULL DEFAULT true,
  "status" "PortfolioBootstrapProposedMutationStatus" NOT NULL DEFAULT 'proposed',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PortfolioBootstrapProposedMutation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioBootstrapAnalysisRun_bootstrapSessionId_inputVersion_key"
  ON "PortfolioBootstrapAnalysisRun"("bootstrapSessionId", "inputVersion");
CREATE INDEX "PortfolioBootstrapAnalysisRun_bootstrapSessionId_idx" ON "PortfolioBootstrapAnalysisRun"("bootstrapSessionId");
CREATE INDEX "PortfolioBootstrapAnalysisRun_status_idx" ON "PortfolioBootstrapAnalysisRun"("status");
CREATE INDEX "PortfolioBootstrapAnalysisRun_analyzerMode_idx" ON "PortfolioBootstrapAnalysisRun"("analyzerMode");
CREATE INDEX "PortfolioBootstrapAnalysisRun_createdBy_idx" ON "PortfolioBootstrapAnalysisRun"("createdBy");
CREATE INDEX "PortfolioBootstrapAnalysisRun_createdAt_idx" ON "PortfolioBootstrapAnalysisRun"("createdAt");

CREATE INDEX "PortfolioBootstrapProposedMutation_bootstrapSessionId_idx" ON "PortfolioBootstrapProposedMutation"("bootstrapSessionId");
CREATE INDEX "PortfolioBootstrapProposedMutation_analysisRunId_idx" ON "PortfolioBootstrapProposedMutation"("analysisRunId");
CREATE INDEX "PortfolioBootstrapProposedMutation_targetType_idx" ON "PortfolioBootstrapProposedMutation"("targetType");
CREATE INDEX "PortfolioBootstrapProposedMutation_targetId_idx" ON "PortfolioBootstrapProposedMutation"("targetId");
CREATE INDEX "PortfolioBootstrapProposedMutation_status_idx" ON "PortfolioBootstrapProposedMutation"("status");
CREATE INDEX "PortfolioBootstrapProposedMutation_provenanceStatus_idx" ON "PortfolioBootstrapProposedMutation"("provenanceStatus");
CREATE INDEX "PortfolioBootstrapProposedMutation_createdAt_idx" ON "PortfolioBootstrapProposedMutation"("createdAt");

ALTER TABLE "PortfolioBootstrapAnalysisRun"
  ADD CONSTRAINT "PortfolioBootstrapAnalysisRun_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapProposedMutation"
  ADD CONSTRAINT "PortfolioBootstrapProposedMutation_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId") REFERENCES "PortfolioBootstrapSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapProposedMutation"
  ADD CONSTRAINT "PortfolioBootstrapProposedMutation_analysisRunId_fkey"
  FOREIGN KEY ("analysisRunId") REFERENCES "PortfolioBootstrapAnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
