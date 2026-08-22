-- DropIndex
DROP INDEX "PdfFieldProposal_runId_fieldPath_idx";
-- AlterTable
ALTER TABLE "AdaptiveAdaptationEvent" ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "payloadJson" SET NOT NULL;
-- AlterTable
ALTER TABLE "PilotLead" ADD COLUMN     "proposal" JSONB;
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" "Role"[];
-- CreateTable
CREATE TABLE "PilotClaimToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pilotLeadId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PilotClaimToken_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "PilotClaimToken_tokenHash_key" ON "PilotClaimToken"("tokenHash");
-- CreateIndex
CREATE INDEX "PilotClaimToken_pilotLeadId_idx" ON "PilotClaimToken"("pilotLeadId");
-- CreateIndex
CREATE INDEX "PilotClaimToken_expiresAt_idx" ON "PilotClaimToken"("expiresAt");
-- CreateIndex
CREATE UNIQUE INDEX "PdfFieldProposal_runId_fieldPath_key" ON "PdfFieldProposal"("runId", "fieldPath");
-- RenameIndex (ELIMINADO en el rebase sobre main, 2026-08-28)
-- Renombraba el indice auto-truncado que creaba 20260729120000_adaptive_core_step0_cycle.
-- La migracion 20260816120000_r3a_cycle_foundation (main) lo DROPea y lo sustituye por
-- ACI_cycle_config_checkpoint_key sobre (cycleId, ...). Como r3a ordena ANTES que esta,
-- el ALTER INDEX apuntaba a un indice ya inexistente y rompia la cadena (P1014).
-- El schema ya no declara el nombre viejo: no hay nada que renombrar.
