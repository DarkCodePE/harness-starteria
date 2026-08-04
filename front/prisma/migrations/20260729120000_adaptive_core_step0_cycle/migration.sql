CREATE TABLE "AdaptiveStepConfiguration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "routeType" TEXT NOT NULL,
    "depthLevel" TEXT NOT NULL,
    "maturity" TEXT,
    "configurationJson" JSONB NOT NULL,
    "sourceContextJson" JSONB,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdaptiveStepConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveCheckpointInstance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepConfigurationId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "checkpointKey" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "materializedQuestionsJson" JSONB NOT NULL,
    "sufficiencyJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdaptiveCheckpointInstance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveCheckpointResponse" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "checkpointInstanceId" TEXT NOT NULL,
    "checkpointKey" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "answeredById" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdaptiveCheckpointResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveStepOutput" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceConfigurationId" TEXT,
    "stepNumber" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "outputKey" TEXT NOT NULL,
    "outputJson" JSONB NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdaptiveStepOutput_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveProgressSignal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "checkpointKey" TEXT,
    "health" TEXT NOT NULL,
    "signalJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdaptiveProgressSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdaptiveAdaptationEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventKey" TEXT,
    "summary" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdById" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdaptiveAdaptationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdaptiveStepConfiguration_projectId_stepNumber_version_key" ON "AdaptiveStepConfiguration"("projectId", "stepNumber", "version");
CREATE INDEX "AdaptiveStepConfiguration_projectId_idx" ON "AdaptiveStepConfiguration"("projectId");
CREATE INDEX "AdaptiveStepConfiguration_projectId_stepNumber_status_idx" ON "AdaptiveStepConfiguration"("projectId", "stepNumber", "status");

CREATE UNIQUE INDEX "AdaptiveCheckpointInstance_idempotencyKey_key" ON "AdaptiveCheckpointInstance"("idempotencyKey");
CREATE UNIQUE INDEX "AdaptiveCheckpointInstance_projectId_stepConfigurationId_checkpointKey_key" ON "AdaptiveCheckpointInstance"("projectId", "stepConfigurationId", "checkpointKey");
CREATE INDEX "AdaptiveCheckpointInstance_projectId_idx" ON "AdaptiveCheckpointInstance"("projectId");
CREATE INDEX "AdaptiveCheckpointInstance_projectId_status_idx" ON "AdaptiveCheckpointInstance"("projectId", "status");

CREATE UNIQUE INDEX "AdaptiveCheckpointResponse_idempotencyKey_key" ON "AdaptiveCheckpointResponse"("idempotencyKey");
CREATE INDEX "AdaptiveCheckpointResponse_projectId_idx" ON "AdaptiveCheckpointResponse"("projectId");
CREATE INDEX "AdaptiveCheckpointResponse_checkpointInstanceId_idx" ON "AdaptiveCheckpointResponse"("checkpointInstanceId");

CREATE UNIQUE INDEX "AdaptiveStepOutput_projectId_stepNumber_version_key" ON "AdaptiveStepOutput"("projectId", "stepNumber", "version");
CREATE INDEX "AdaptiveStepOutput_projectId_idx" ON "AdaptiveStepOutput"("projectId");
CREATE INDEX "AdaptiveStepOutput_projectId_stepNumber_status_idx" ON "AdaptiveStepOutput"("projectId", "stepNumber", "status");

CREATE UNIQUE INDEX "AdaptiveProgressSignal_projectId_key" ON "AdaptiveProgressSignal"("projectId");

CREATE UNIQUE INDEX "AdaptiveAdaptationEvent_idempotencyKey_key" ON "AdaptiveAdaptationEvent"("idempotencyKey");
CREATE INDEX "AdaptiveAdaptationEvent_projectId_idx" ON "AdaptiveAdaptationEvent"("projectId");
CREATE INDEX "AdaptiveAdaptationEvent_projectId_eventType_idx" ON "AdaptiveAdaptationEvent"("projectId", "eventType");
CREATE INDEX "AdaptiveAdaptationEvent_createdAt_idx" ON "AdaptiveAdaptationEvent"("createdAt");

ALTER TABLE "AdaptiveStepConfiguration" ADD CONSTRAINT "AdaptiveStepConfiguration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointInstance" ADD CONSTRAINT "AdaptiveCheckpointInstance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointInstance" ADD CONSTRAINT "AdaptiveCheckpointInstance_stepConfigurationId_fkey" FOREIGN KEY ("stepConfigurationId") REFERENCES "AdaptiveStepConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointResponse" ADD CONSTRAINT "AdaptiveCheckpointResponse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveCheckpointResponse" ADD CONSTRAINT "AdaptiveCheckpointResponse_checkpointInstanceId_fkey" FOREIGN KEY ("checkpointInstanceId") REFERENCES "AdaptiveCheckpointInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveStepOutput" ADD CONSTRAINT "AdaptiveStepOutput_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveStepOutput" ADD CONSTRAINT "AdaptiveStepOutput_sourceConfigurationId_fkey" FOREIGN KEY ("sourceConfigurationId") REFERENCES "AdaptiveStepConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdaptiveProgressSignal" ADD CONSTRAINT "AdaptiveProgressSignal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveAdaptationEvent" ADD CONSTRAINT "AdaptiveAdaptationEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
