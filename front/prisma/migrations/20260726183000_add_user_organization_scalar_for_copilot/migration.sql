-- Copilot Block 02 organizational validation support.
-- The Prisma schema already contains User.organizationId as a scalar logical
-- reference. Historical migrations did not create it, so clean PostgreSQL
-- deployments could not validate organization scope from User.
-- No Organization table, relation, or foreign key is introduced here.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

