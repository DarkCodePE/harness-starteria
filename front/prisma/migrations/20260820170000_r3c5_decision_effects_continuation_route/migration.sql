-- R3-C5 DecisionEffects + ContinuationRoute.
-- Effects are derived from persisted Decision.outcome and remain distinct from Decision.

ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'IMPLEMENTATION_APPROVED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'SCALING_APPROVED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

ALTER TYPE "InitiativePortfolioStatus" ADD VALUE IF NOT EXISTS 'implementation_approved';
ALTER TYPE "InitiativePortfolioStatus" ADD VALUE IF NOT EXISTS 'scaling_approved';
ALTER TYPE "InitiativePortfolioStatus" ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE "InitiativePortfolioStatus" ADD VALUE IF NOT EXISTS 'closed';

CREATE TYPE "ContinuationRouteType" AS ENUM (
  'new_cycle',
  'implementation_handoff',
  'scaling_handoff',
  'paused',
  'closed'
);

CREATE TABLE "ContinuationRoute" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "routeType" "ContinuationRouteType" NOT NULL,
  "resultingCycleId" TEXT,
  "handoffId" TEXT,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ContinuationRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImplementationHandoff" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "approvedScopeJson" JSONB NOT NULL,
  "conditionsJson" JSONB,
  "metricsJson" JSONB,
  "evidenceSnapshotJson" JSONB,
  "risksJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImplementationHandoff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScalingHandoff" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "validatedScopeJson" JSONB NOT NULL,
  "scaleConditionsJson" JSONB,
  "impactSnapshotJson" JSONB,
  "dependenciesJson" JSONB,
  "risksJson" JSONB,
  "unvalidatedSegmentsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ScalingHandoff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClosureSummary" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "closureReason" TEXT NOT NULL,
  "learningSummaryJson" JSONB NOT NULL,
  "validatedClaimsJson" JSONB,
  "evidenceReferencesJson" JSONB,
  "reusableLearningJson" JSONB,
  "futureConsiderationsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClosureSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContinuationRoute_decisionId_key" ON "ContinuationRoute"("decisionId");
CREATE UNIQUE INDEX "ContinuationRoute_idempotencyKey_key" ON "ContinuationRoute"("idempotencyKey");
CREATE INDEX "ContinuationRoute_projectId_idx" ON "ContinuationRoute"("projectId");
CREATE INDEX "ContinuationRoute_resultingCycleId_idx" ON "ContinuationRoute"("resultingCycleId");
CREATE INDEX "ContinuationRoute_routeType_idx" ON "ContinuationRoute"("routeType");
CREATE INDEX "ContinuationRoute_appliedAt_idx" ON "ContinuationRoute"("appliedAt");

CREATE UNIQUE INDEX "ImplementationHandoff_decisionId_key" ON "ImplementationHandoff"("decisionId");
CREATE INDEX "ImplementationHandoff_projectId_idx" ON "ImplementationHandoff"("projectId");

CREATE UNIQUE INDEX "ScalingHandoff_decisionId_key" ON "ScalingHandoff"("decisionId");
CREATE INDEX "ScalingHandoff_projectId_idx" ON "ScalingHandoff"("projectId");

CREATE UNIQUE INDEX "ClosureSummary_decisionId_key" ON "ClosureSummary"("decisionId");
CREATE INDEX "ClosureSummary_projectId_idx" ON "ClosureSummary"("projectId");

ALTER TABLE "ContinuationRoute"
  ADD CONSTRAINT "ContinuationRoute_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContinuationRoute"
  ADD CONSTRAINT "ContinuationRoute_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContinuationRoute"
  ADD CONSTRAINT "ContinuationRoute_resultingCycleId_fkey"
  FOREIGN KEY ("resultingCycleId") REFERENCES "InitiativeCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImplementationHandoff"
  ADD CONSTRAINT "ImplementationHandoff_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImplementationHandoff"
  ADD CONSTRAINT "ImplementationHandoff_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScalingHandoff"
  ADD CONSTRAINT "ScalingHandoff_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScalingHandoff"
  ADD CONSTRAINT "ScalingHandoff_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClosureSummary"
  ADD CONSTRAINT "ClosureSummary_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClosureSummary"
  ADD CONSTRAINT "ClosureSummary_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
