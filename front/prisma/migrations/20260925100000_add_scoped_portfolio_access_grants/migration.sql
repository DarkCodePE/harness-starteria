-- Scoped Portfolio authority: membership plus an explicit organization grant.
-- This does not modify User.roles or OrganizationMember.role.

CREATE TABLE "OrganizationPortfolioAccessGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "grantedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrganizationPortfolioAccessGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationPortfolioAccessGrant_capability_check"
    CHECK ("capability" IN ('portfolio:read', 'portfolio:write'))
);

CREATE UNIQUE INDEX "OrganizationPortfolioAccessGrant_userId_organizationId_capability_key"
  ON "OrganizationPortfolioAccessGrant"("userId", "organizationId", "capability");

CREATE INDEX "OrganizationPortfolioAccessGrant_organizationId_capability_idx"
  ON "OrganizationPortfolioAccessGrant"("organizationId", "capability");

CREATE INDEX "OrganizationPortfolioAccessGrant_userId_organizationId_idx"
  ON "OrganizationPortfolioAccessGrant"("userId", "organizationId");

ALTER TABLE "OrganizationPortfolioAccessGrant"
  ADD CONSTRAINT "OrganizationPortfolioAccessGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationPortfolioAccessGrant"
  ADD CONSTRAINT "OrganizationPortfolioAccessGrant_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationPortfolioAccessGrant"
  ADD CONSTRAINT "OrganizationPortfolioAccessGrant_grantedByUserId_fkey"
  FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
