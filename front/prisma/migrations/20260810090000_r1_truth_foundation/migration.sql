CREATE TYPE "SourceRefType" AS ENUM (
  'USER_INPUT',
  'AI_OUTPUT',
  'PDF_PROPOSAL',
  'CONTEXT_SOURCE',
  'FILE_UPLOAD',
  'URL',
  'SYSTEM_RULE',
  'API',
  'OTHER'
);

CREATE TYPE "TruthClaimVerificationState" AS ENUM (
  'unvalidated',
  'supported',
  'contradicted',
  'insufficient'
);

CREATE TYPE "TruthEvidenceStatus" AS ENUM (
  'supports',
  'contradicts',
  'insufficient'
);

CREATE TYPE "TruthValidationResult" AS ENUM (
  'unvalidated',
  'supported',
  'contradicted',
  'insufficient'
);

CREATE TYPE "TruthValidatorType" AS ENUM (
  'human',
  'system_rule',
  'ai'
);

CREATE TYPE "AttentionItemStatus" AS ENUM (
  'open',
  'acknowledged',
  'resolved',
  'cancelled'
);

CREATE TYPE "AttentionItemSeverity" AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE "ImpactStatus" AS ENUM (
  'declared',
  'estimated',
  'validated',
  'realized'
);

CREATE TABLE "SourceRef" (
  "id" TEXT NOT NULL,
  "projectId" TEXT,
  "sourceType" "SourceRefType" NOT NULL,
  "reference" TEXT NOT NULL,
  "location" TEXT,
  "originActorId" TEXT,
  "originActorType" TEXT,
  "contentHash" TEXT,
  "version" TEXT,
  "metadataJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SourceRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TruthClaim" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT,
  "claimType" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "valueJson" JSONB,
  "createdById" TEXT NOT NULL,
  "createdByType" TEXT NOT NULL DEFAULT 'human',
  "verificationState" "TruthClaimVerificationState" NOT NULL DEFAULT 'unvalidated',
  "sourceRefsJson" JSONB,
  "currentValidationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TruthClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TruthValidation" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "claimId" TEXT,
  "evidenceId" TEXT,
  "sourceRefId" TEXT,
  "result" "TruthValidationResult" NOT NULL,
  "validatedById" TEXT NOT NULL,
  "validatorType" "TruthValidatorType" NOT NULL,
  "validatorRole" TEXT,
  "rationale" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TruthValidation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttentionItem" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "objectType" TEXT,
  "objectId" TEXT,
  "category" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "severity" "AttentionItemSeverity" NOT NULL DEFAULT 'medium',
  "sourceRefId" TEXT,
  "ownerId" TEXT,
  "status" "AttentionItemStatus" NOT NULL DEFAULT 'open',
  "exitCondition" TEXT NOT NULL,
  "nextAction" TEXT NOT NULL,
  "resolutionNote" TEXT,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttentionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImpactAssertion" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT,
  "claimId" TEXT,
  "metric" TEXT,
  "valueJson" JSONB,
  "status" "ImpactStatus" NOT NULL DEFAULT 'declared',
  "sourceRefId" TEXT,
  "validationId" TEXT,
  "transitionedById" TEXT,
  "transitionedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImpactAssertion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Evidence"
  ADD COLUMN "sourceRefId" TEXT,
  ADD COLUMN "targetClaimId" TEXT,
  ADD COLUMN "truthStatus" "TruthEvidenceStatus",
  ADD COLUMN "capturedAt" TIMESTAMP(3),
  ADD COLUMN "excerpt" TEXT,
  ADD COLUMN "provenance" JSONB,
  ADD COLUMN "metadataJson" JSONB;

CREATE INDEX "SourceRef_projectId_idx" ON "SourceRef"("projectId");
CREATE INDEX "SourceRef_sourceType_idx" ON "SourceRef"("sourceType");
CREATE INDEX "SourceRef_originActorId_idx" ON "SourceRef"("originActorId");
CREATE INDEX "SourceRef_contentHash_idx" ON "SourceRef"("contentHash");

CREATE INDEX "TruthClaim_projectId_idx" ON "TruthClaim"("projectId");
CREATE INDEX "TruthClaim_subjectType_subjectId_idx" ON "TruthClaim"("subjectType", "subjectId");
CREATE INDEX "TruthClaim_claimType_idx" ON "TruthClaim"("claimType");
CREATE INDEX "TruthClaim_verificationState_idx" ON "TruthClaim"("verificationState");
CREATE INDEX "TruthClaim_createdById_idx" ON "TruthClaim"("createdById");

CREATE INDEX "TruthValidation_projectId_idx" ON "TruthValidation"("projectId");
CREATE INDEX "TruthValidation_claimId_idx" ON "TruthValidation"("claimId");
CREATE INDEX "TruthValidation_evidenceId_idx" ON "TruthValidation"("evidenceId");
CREATE INDEX "TruthValidation_sourceRefId_idx" ON "TruthValidation"("sourceRefId");
CREATE INDEX "TruthValidation_result_idx" ON "TruthValidation"("result");
CREATE INDEX "TruthValidation_validatedById_idx" ON "TruthValidation"("validatedById");

CREATE INDEX "AttentionItem_projectId_idx" ON "AttentionItem"("projectId");
CREATE INDEX "AttentionItem_status_idx" ON "AttentionItem"("status");
CREATE INDEX "AttentionItem_severity_idx" ON "AttentionItem"("severity");
CREATE INDEX "AttentionItem_ownerId_idx" ON "AttentionItem"("ownerId");
CREATE INDEX "AttentionItem_sourceRefId_idx" ON "AttentionItem"("sourceRefId");

CREATE INDEX "ImpactAssertion_projectId_idx" ON "ImpactAssertion"("projectId");
CREATE INDEX "ImpactAssertion_subjectType_subjectId_idx" ON "ImpactAssertion"("subjectType", "subjectId");
CREATE INDEX "ImpactAssertion_claimId_idx" ON "ImpactAssertion"("claimId");
CREATE INDEX "ImpactAssertion_status_idx" ON "ImpactAssertion"("status");

CREATE INDEX "Evidence_sourceRefId_idx" ON "Evidence"("sourceRefId");
CREATE INDEX "Evidence_targetClaimId_idx" ON "Evidence"("targetClaimId");
CREATE INDEX "Evidence_truthStatus_idx" ON "Evidence"("truthStatus");

ALTER TABLE "SourceRef"
  ADD CONSTRAINT "SourceRef_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TruthClaim"
  ADD CONSTRAINT "TruthClaim_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TruthValidation"
  ADD CONSTRAINT "TruthValidation_claimId_fkey"
  FOREIGN KEY ("claimId") REFERENCES "TruthClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TruthValidation"
  ADD CONSTRAINT "TruthValidation_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AttentionItem"
  ADD CONSTRAINT "AttentionItem_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttentionItem"
  ADD CONSTRAINT "AttentionItem_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImpactAssertion"
  ADD CONSTRAINT "ImpactAssertion_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Evidence"
  ADD CONSTRAINT "Evidence_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Evidence"
  ADD CONSTRAINT "Evidence_targetClaimId_fkey"
  FOREIGN KEY ("targetClaimId") REFERENCES "TruthClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
