-- H-TECH-02: bounded Portfolio Handoff Assignment persistence.
CREATE TYPE "PortfolioHandoffTargetKind" AS ENUM ('EXISTING_INITIATIVE', 'CHALLENGE');
CREATE TYPE "PortfolioHandoffState" AS ENUM ('CREATED');
CREATE TYPE "PortfolioHandoffMemberRole" AS ENUM ('OWNER', 'EXECUTOR', 'OBSERVER');

CREATE TABLE "PortfolioHandoffAssignment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "portfolioScopeRef" TEXT,
  "challengeId" TEXT NOT NULL,
  "targetKind" "PortfolioHandoffTargetKind" NOT NULL,
  "initiativeId" TEXT,
  "invitedEmailNormalized" TEXT NOT NULL,
  "invitedIdentityRef" TEXT,
  "state" "PortfolioHandoffState" NOT NULL DEFAULT 'CREATED',
  "createdByActorId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioHandoffAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioHandoffMember" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "identityKey" TEXT NOT NULL,
  "userId" TEXT,
  "emailNormalized" TEXT,
  "label" TEXT,
  "role" "PortfolioHandoffMemberRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioHandoffMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioHandoffMember_assignmentId_identityKey_key" ON "PortfolioHandoffMember"("assignmentId", "identityKey");
CREATE INDEX "PortfolioHandoffAssignment_challengeId_idx" ON "PortfolioHandoffAssignment"("challengeId");
CREATE INDEX "PortfolioHandoffAssignment_initiativeId_idx" ON "PortfolioHandoffAssignment"("initiativeId");
CREATE INDEX "PortfolioHandoffAssignment_organizationId_idx" ON "PortfolioHandoffAssignment"("organizationId");
CREATE INDEX "PortfolioHandoffAssignment_createdByActorId_idx" ON "PortfolioHandoffAssignment"("createdByActorId");
CREATE INDEX "PortfolioHandoffMember_assignmentId_role_idx" ON "PortfolioHandoffMember"("assignmentId", "role");
CREATE INDEX "PortfolioHandoffMember_userId_idx" ON "PortfolioHandoffMember"("userId");

ALTER TABLE "PortfolioHandoffAssignment" ADD CONSTRAINT "PortfolioHandoffAssignment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortfolioHandoffAssignment" ADD CONSTRAINT "PortfolioHandoffAssignment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortfolioHandoffAssignment" ADD CONSTRAINT "PortfolioHandoffAssignment_createdByActorId_fkey" FOREIGN KEY ("createdByActorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortfolioHandoffMember" ADD CONSTRAINT "PortfolioHandoffMember_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "PortfolioHandoffAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioHandoffMember" ADD CONSTRAINT "PortfolioHandoffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
