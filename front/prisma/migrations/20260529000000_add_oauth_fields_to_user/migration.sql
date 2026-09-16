-- AlterTable: make passwordHash optional for Google-OAuth-only users
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable: add googleId column (nullable, unique)
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT;

-- CreateIndex: enforce uniqueness for non-null googleId values
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex: secondary index for googleId lookups (Prisma @@index)
CREATE INDEX "User_googleId_idx" ON "User"("googleId");
