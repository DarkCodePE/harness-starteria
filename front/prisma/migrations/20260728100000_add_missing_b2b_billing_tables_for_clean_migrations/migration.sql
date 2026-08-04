-- Additive repair for clean Prisma migration chains.
-- The schema already declared B2B billing and organization models, but no
-- historical migration created these tables. This migration does not change
-- StrategicFront and does not add a User -> Organization foreign key.

DO $$
BEGIN
  CREATE TYPE "BillingProvider" AS ENUM ('CULQI', 'STRIPE', 'YAPE', 'MERCADO_PAGO', 'MANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PlanInterval" AS ENUM ('MONTH', 'YEAR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "InitialReviewChatRole" AS ENUM ('assistant', 'user', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "InitialReviewChatEventKind" AS ENUM ('guide', 'answer', 'context', 'doubt', 'diff_announcement', 'confirm');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "pilotLeadId" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

ALTER TABLE "TeamMember"
  ADD COLUMN IF NOT EXISTS "inheritedFromChallenge" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Plan" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "interval" "PlanInterval" NOT NULL DEFAULT 'MONTH',
  "priceCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'PEN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "limits" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "seatLimit" INTEGER NOT NULL DEFAULT 1,
  "cohortId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "provider" "BillingProvider" NOT NULL DEFAULT 'MANUAL',
  "providerCustomerId" TEXT,
  "providerSubId" TEXT,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UsageCounter" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "used" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UsageEvent" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "feature" TEXT NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "dedupeKey" TEXT NOT NULL,
  "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChallengeTeamMember" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "userId" TEXT,
  "label" TEXT,
  "role" "TeamRole" NOT NULL DEFAULT 'VIEWER',
  "status" "TeamMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChallengeTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InitialReviewChatEvent" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "role" "InitialReviewChatRole" NOT NULL,
  "kind" "InitialReviewChatEventKind" NOT NULL,
  "payload" JSONB NOT NULL,
  "snapshotVersion" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InitialReviewChatEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Plan_code_key" ON "Plan"("code");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "Project_pilotLeadId_idx" ON "Project"("pilotLeadId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_provider_providerSubId_idx" ON "Subscription"("provider", "providerSubId");
CREATE INDEX IF NOT EXISTS "UsageCounter_subscriptionId_feature_periodKey_idx" ON "UsageCounter"("subscriptionId", "feature", "periodKey");
CREATE UNIQUE INDEX IF NOT EXISTS "UsageEvent_dedupeKey_key" ON "UsageEvent"("dedupeKey");
CREATE INDEX IF NOT EXISTS "UsageEvent_subscriptionId_feature_idx" ON "UsageEvent"("subscriptionId", "feature");
CREATE INDEX IF NOT EXISTS "Organization_cohortId_idx" ON "Organization"("cohortId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX IF NOT EXISTS "ChallengeTeamMember_challengeId_idx" ON "ChallengeTeamMember"("challengeId");
CREATE INDEX IF NOT EXISTS "ChallengeTeamMember_userId_idx" ON "ChallengeTeamMember"("userId");
CREATE INDEX IF NOT EXISTS "InitialReviewChatEvent_reviewId_createdAt_idx" ON "InitialReviewChatEvent"("reviewId", "createdAt");

DO $$
BEGIN
  ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "UsageCounter"
    ADD CONSTRAINT "UsageCounter_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ChallengeTeamMember"
    ADD CONSTRAINT "ChallengeTeamMember_challengeId_fkey"
    FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ChallengeTeamMember"
    ADD CONSTRAINT "ChallengeTeamMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "InitialReviewChatEvent"
    ADD CONSTRAINT "InitialReviewChatEvent_reviewId_fkey"
    FOREIGN KEY ("reviewId") REFERENCES "InitialReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
