-- PRD: Contexto de empresa para iniciativas.
-- Idempotent migration: production may already have partial objects from db push.

DO $$ BEGIN
  CREATE TYPE "CompanyScope" AS ENUM ('PERSONAL', 'ORGANIZATION');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyMembershipRole" AS ENUM ('OWNER', 'CURATOR', 'EDITOR', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyMembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContextVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContextLevel" AS ENUM ('INITIAL', 'BASIC', 'USEFUL', 'SOLID');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContextSourceType" AS ENUM ('USER_INPUT', 'WEBSITE', 'LINKEDIN', 'FILE', 'PROJECT_NOTE', 'AGENT_INFERENCE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContextDimension" AS ENUM ('IDENTITY', 'CULTURE', 'STRUCTURE', 'POLICIES', 'INNOVATION', 'RESOURCES', 'AREA', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContextVerificationStatus" AS ENUM ('UNVERIFIED', 'USER_CONFIRMED', 'INFERRED', 'NEEDS_REVIEW');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyAreaStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContextSourceStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'PARTIAL', 'BLOCKED', 'ERROR', 'NEEDS_REVIEW', 'STALE', 'DELETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContextExtractionRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContributionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "normalizedDomain" TEXT,
  "sector" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "employeeRange" TEXT,
  "websiteUrl" TEXT,
  "linkedinUrl" TEXT,
  "ownerUserId" TEXT,
  "organizationId" TEXT,
  "scope" "CompanyScope" NOT NULL DEFAULT 'PERSONAL',
  "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
  "originCompanyId" TEXT,
  "originAuthorId" TEXT,
  "clonedFromAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InitialReview"
  ADD COLUMN IF NOT EXISTS "companyContextSelection" JSONB;

ALTER TABLE "InitialReviewSnapshot"
  ADD COLUMN IF NOT EXISTS "companyContextSelection" JSONB;

CREATE TABLE IF NOT EXISTS "CompanyMembership" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "CompanyMembershipRole" NOT NULL DEFAULT 'VIEWER',
  "status" "CompanyMembershipStatus" NOT NULL DEFAULT 'PENDING',
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyContextVersion" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "status" "CompanyContextVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "contextScore" INTEGER NOT NULL DEFAULT 0,
  "contextLevel" "CompanyContextLevel" NOT NULL DEFAULT 'INITIAL',
  "snapshotJson" JSONB NOT NULL,
  "scoreBreakdownJson" JSONB,
  "missingJson" JSONB,
  "createdByUserId" TEXT NOT NULL,
  "publishedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "CompanyContextVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyContextEntry" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "versionId" TEXT,
  "dimension" "CompanyContextDimension" NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "sourceType" "CompanyContextSourceType" NOT NULL,
  "sourceId" TEXT,
  "confidence" DOUBLE PRECISION,
  "verificationStatus" "ContextVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyContextEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyArea" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "leadRole" TEXT,
  "status" "CompanyAreaStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyAreaContext" (
  "id" TEXT NOT NULL,
  "areaId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "purpose" TEXT,
  "autonomyLevel" TEXT,
  "dependenciesJson" JSONB,
  "prioritiesJson" JSONB,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyAreaContext_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContextSource" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "areaId" TEXT,
  "initiativeId" TEXT,
  "challengeId" TEXT,
  "sourceType" "CompanyContextSourceType" NOT NULL,
  "url" TEXT,
  "storageKey" TEXT,
  "mimeType" TEXT,
  "originalFilename" TEXT,
  "status" "ContextSourceStatus" NOT NULL DEFAULT 'PENDING',
  "rawContent" TEXT,
  "cleanContent" TEXT,
  "contentHash" TEXT,
  "metadataJson" JSONB,
  "extractedDataJson" JSONB,
  "createdByUserId" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ContextSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContextExtractionRun" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "status" "ContextExtractionRunStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "model" TEXT,
  "extractorVersion" TEXT NOT NULL,
  "tokensUsed" INTEGER,
  "estimatedCost" DECIMAL(10,4),
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContextExtractionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InitiativeContextSnapshot" (
  "id" TEXT NOT NULL,
  "initiativeId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "companyVersionId" TEXT NOT NULL,
  "areaId" TEXT,
  "areaVersion" INTEGER,
  "snapshotJson" JSONB NOT NULL,
  "contextScore" INTEGER NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InitiativeContextSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InitiativeContextNote" (
  "id" TEXT NOT NULL,
  "initiativeId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sourceType" "CompanyContextSourceType" NOT NULL DEFAULT 'PROJECT_NOTE',
  "promotedToCompanyAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InitiativeContextNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyContribution" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "submittedByUserId" TEXT NOT NULL,
  "targetDimension" "CompanyContextDimension" NOT NULL,
  "proposedValueJson" JSONB NOT NULL,
  "evidenceSourceId" TEXT,
  "status" "CompanyContributionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyContribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Company_ownerUserId_idx" ON "Company"("ownerUserId");
CREATE INDEX IF NOT EXISTS "Company_organizationId_idx" ON "Company"("organizationId");
CREATE INDEX IF NOT EXISTS "Company_scope_idx" ON "Company"("scope");
CREATE INDEX IF NOT EXISTS "Company_status_idx" ON "Company"("status");
CREATE INDEX IF NOT EXISTS "Company_normalizedDomain_idx" ON "Company"("normalizedDomain");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_companyId_userId_key" ON "CompanyMembership"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_idx" ON "CompanyMembership"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx" ON "CompanyMembership"("userId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_status_idx" ON "CompanyMembership"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyContextVersion_companyId_versionNumber_key" ON "CompanyContextVersion"("companyId", "versionNumber");
CREATE INDEX IF NOT EXISTS "CompanyContextVersion_companyId_idx" ON "CompanyContextVersion"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyContextVersion_status_idx" ON "CompanyContextVersion"("status");
CREATE INDEX IF NOT EXISTS "CompanyContextEntry_companyId_idx" ON "CompanyContextEntry"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyContextEntry_versionId_idx" ON "CompanyContextEntry"("versionId");
CREATE INDEX IF NOT EXISTS "CompanyContextEntry_sourceId_idx" ON "CompanyContextEntry"("sourceId");
CREATE INDEX IF NOT EXISTS "CompanyContextEntry_dimension_fieldKey_idx" ON "CompanyContextEntry"("dimension", "fieldKey");
CREATE INDEX IF NOT EXISTS "CompanyArea_companyId_idx" ON "CompanyArea"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyArea_status_idx" ON "CompanyArea"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyAreaContext_areaId_version_key" ON "CompanyAreaContext"("areaId", "version");
CREATE INDEX IF NOT EXISTS "CompanyAreaContext_areaId_idx" ON "CompanyAreaContext"("areaId");
CREATE INDEX IF NOT EXISTS "ContextSource_companyId_idx" ON "ContextSource"("companyId");
CREATE INDEX IF NOT EXISTS "ContextSource_areaId_idx" ON "ContextSource"("areaId");
CREATE INDEX IF NOT EXISTS "ContextSource_initiativeId_idx" ON "ContextSource"("initiativeId");
CREATE INDEX IF NOT EXISTS "ContextSource_challengeId_idx" ON "ContextSource"("challengeId");
CREATE INDEX IF NOT EXISTS "ContextSource_status_idx" ON "ContextSource"("status");
CREATE INDEX IF NOT EXISTS "ContextSource_contentHash_idx" ON "ContextSource"("contentHash");
CREATE INDEX IF NOT EXISTS "ContextExtractionRun_sourceId_idx" ON "ContextExtractionRun"("sourceId");
CREATE INDEX IF NOT EXISTS "ContextExtractionRun_status_idx" ON "ContextExtractionRun"("status");
CREATE INDEX IF NOT EXISTS "InitiativeContextSnapshot_initiativeId_idx" ON "InitiativeContextSnapshot"("initiativeId");
CREATE INDEX IF NOT EXISTS "InitiativeContextSnapshot_companyId_idx" ON "InitiativeContextSnapshot"("companyId");
CREATE INDEX IF NOT EXISTS "InitiativeContextSnapshot_companyVersionId_idx" ON "InitiativeContextSnapshot"("companyVersionId");
CREATE INDEX IF NOT EXISTS "InitiativeContextSnapshot_areaId_idx" ON "InitiativeContextSnapshot"("areaId");
CREATE INDEX IF NOT EXISTS "InitiativeContextNote_initiativeId_idx" ON "InitiativeContextNote"("initiativeId");
CREATE INDEX IF NOT EXISTS "InitiativeContextNote_authorUserId_idx" ON "InitiativeContextNote"("authorUserId");
CREATE INDEX IF NOT EXISTS "CompanyContribution_companyId_idx" ON "CompanyContribution"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyContribution_submittedByUserId_idx" ON "CompanyContribution"("submittedByUserId");
CREATE INDEX IF NOT EXISTS "CompanyContribution_status_idx" ON "CompanyContribution"("status");

DO $$ BEGIN
  ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyContextVersion" ADD CONSTRAINT "CompanyContextVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyContextEntry" ADD CONSTRAINT "CompanyContextEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyContextEntry" ADD CONSTRAINT "CompanyContextEntry_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CompanyContextVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyContextEntry" ADD CONSTRAINT "CompanyContextEntry_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContextSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyArea" ADD CONSTRAINT "CompanyArea_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyAreaContext" ADD CONSTRAINT "CompanyAreaContext_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "CompanyArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "ContextSource" ADD CONSTRAINT "ContextSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "ContextSource" ADD CONSTRAINT "ContextSource_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "CompanyArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "ContextSource" ADD CONSTRAINT "ContextSource_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "ContextExtractionRun" ADD CONSTRAINT "ContextExtractionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContextSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "InitiativeContextSnapshot" ADD CONSTRAINT "InitiativeContextSnapshot_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "InitiativeContextSnapshot" ADD CONSTRAINT "InitiativeContextSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "InitiativeContextSnapshot" ADD CONSTRAINT "InitiativeContextSnapshot_companyVersionId_fkey" FOREIGN KEY ("companyVersionId") REFERENCES "CompanyContextVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "InitiativeContextSnapshot" ADD CONSTRAINT "InitiativeContextSnapshot_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "CompanyArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "InitiativeContextNote" ADD CONSTRAINT "InitiativeContextNote_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyContribution" ADD CONSTRAINT "CompanyContribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompanyContribution" ADD CONSTRAINT "CompanyContribution_evidenceSourceId_fkey" FOREIGN KEY ("evidenceSourceId") REFERENCES "ContextSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
