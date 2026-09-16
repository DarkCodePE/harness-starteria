-- CreateTable
CREATE TABLE "PilotLead" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "pilotCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "consentAccepted" BOOLEAN NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "source" TEXT NOT NULL DEFAULT 'public_landing',
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PilotLead_draftId_key" ON "PilotLead"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "PilotLead_pilotCode_key" ON "PilotLead"("pilotCode");

-- CreateIndex
CREATE INDEX "PilotLead_email_idx" ON "PilotLead"("email");

-- CreateIndex
CREATE INDEX "PilotLead_createdAt_idx" ON "PilotLead"("createdAt");

-- CreateIndex
CREATE INDEX "PilotLead_retentionUntil_idx" ON "PilotLead"("retentionUntil");
