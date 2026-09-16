-- Initial review guided flow (ADR-025).
-- Idempotent on purpose: some environments may already have these objects from
-- prisma db push. The migration makes the production contract explicit.

DO $$ BEGIN
  CREATE TYPE "InitialReviewStatus" AS ENUM ('draft', 'processing', 'generated', 'updated', 'route_confirmed', 'converted_to_initiative', 'abandoned', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RouteConfirmationStatus" AS ENUM ('pending', 'confirmed', 'initiative_created', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InitiativeOrigin" AS ENUM ('from_scratch', 'from_initial_review', 'from_public_draft', 'imported', 'linked_existing', 'independent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InformationReadinessStatus" AS ENUM ('very_low', 'low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "origin" "InitiativeOrigin" DEFAULT 'from_scratch',
  ADD COLUMN IF NOT EXISTS "initialReviewSnapshotId" TEXT;

CREATE TABLE IF NOT EXISTS "InitialReview" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" "InitialReviewStatus" NOT NULL DEFAULT 'draft',
  "originalInput" TEXT NOT NULL,
  "addedContext" JSONB,
  "sourceFileIds" JSONB,
  "challengeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InitialReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InitialReviewSnapshot" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "originalInput" TEXT NOT NULL,
  "addedContext" JSONB,
  "sourceFileIds" JSONB,
  "understandingSummary" TEXT NOT NULL,
  "understandingConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "suggestedChallengeType" "ChallengeType" NOT NULL,
  "selectedChallengeType" "ChallengeType" NOT NULL,
  "challengeTypeReason" TEXT NOT NULL,
  "informationReadiness" "InformationReadinessStatus",
  "critique" JSONB NOT NULL,
  "strategicQuestions" JSONB NOT NULL,
  "improvedProposal" JSONB NOT NULL,
  "routePreview" JSONB NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InitialReviewSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RouteConfirmation" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "confirmedBy" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "selectedChallengeType" "ChallengeType" NOT NULL,
  "acceptedImprovedProposal" BOOLEAN NOT NULL DEFAULT true,
  "createdProjectId" TEXT,
  "status" "RouteConfirmationStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RouteConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Project_initialReviewSnapshotId_idx" ON "Project"("initialReviewSnapshotId");
CREATE INDEX IF NOT EXISTS "InitialReview_ownerId_idx" ON "InitialReview"("ownerId");
CREATE INDEX IF NOT EXISTS "InitialReview_status_idx" ON "InitialReview"("status");
CREATE INDEX IF NOT EXISTS "InitialReview_challengeId_idx" ON "InitialReview"("challengeId");
CREATE UNIQUE INDEX IF NOT EXISTS "InitialReviewSnapshot_reviewId_version_key" ON "InitialReviewSnapshot"("reviewId", "version");
CREATE INDEX IF NOT EXISTS "InitialReviewSnapshot_reviewId_idx" ON "InitialReviewSnapshot"("reviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "RouteConfirmation_reviewId_key" ON "RouteConfirmation"("reviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "RouteConfirmation_createdProjectId_key" ON "RouteConfirmation"("createdProjectId");
CREATE INDEX IF NOT EXISTS "RouteConfirmation_snapshotId_idx" ON "RouteConfirmation"("snapshotId");
CREATE INDEX IF NOT EXISTS "RouteConfirmation_status_idx" ON "RouteConfirmation"("status");

DO $$ BEGIN
  ALTER TABLE "InitialReview"
    ADD CONSTRAINT "InitialReview_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "InitialReviewSnapshot"
    ADD CONSTRAINT "InitialReviewSnapshot_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "InitialReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RouteConfirmation"
    ADD CONSTRAINT "RouteConfirmation_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "InitialReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RouteConfirmation"
    ADD CONSTRAINT "RouteConfirmation_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "InitialReviewSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RouteConfirmation"
    ADD CONSTRAINT "RouteConfirmation_createdProjectId_fkey" FOREIGN KEY ("createdProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Project"
    ADD CONSTRAINT "Project_initialReviewSnapshotId_fkey" FOREIGN KEY ("initialReviewSnapshotId") REFERENCES "InitialReviewSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
