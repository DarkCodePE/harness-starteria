-- CreateEnum
CREATE TYPE "GovernanceMode" AS ENUM ('owner_governed', 'portfolio_governed');

-- CreateTable
CREATE TABLE "InitiativeGovernance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mode" "GovernanceMode" NOT NULL DEFAULT 'owner_governed',
    "portfolioLeadUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InitiativeGovernance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InitiativeGovernance_projectId_key" ON "InitiativeGovernance"("projectId");

-- CreateIndex
CREATE INDEX "InitiativeGovernance_mode_idx" ON "InitiativeGovernance"("mode");

-- CreateIndex
CREATE INDEX "InitiativeGovernance_portfolioLeadUserId_idx" ON "InitiativeGovernance"("portfolioLeadUserId");

-- AddForeignKey
ALTER TABLE "InitiativeGovernance" ADD CONSTRAINT "InitiativeGovernance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeGovernance" ADD CONSTRAINT "InitiativeGovernance_portfolioLeadUserId_fkey" FOREIGN KEY ("portfolioLeadUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
