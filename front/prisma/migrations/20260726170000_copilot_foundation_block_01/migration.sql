-- Copilot-first foundation block 01.
-- Adds orchestration persistence only. StrategicFront remains unchanged and owned by Portfolio.

CREATE TYPE "CopilotConversationStatus" AS ENUM (
  'collecting_context',
  'interpreting',
  'asking_clarification',
  'proposal_ready',
  'awaiting_confirmation',
  'executing',
  'completed',
  'partially_completed',
  'blocked',
  'cancelled'
);

CREATE TYPE "CopilotMessageRole" AS ENUM (
  'user',
  'assistant',
  'system'
);

CREATE TYPE "CopilotMessageType" AS ENUM (
  'free_text',
  'clarification',
  'plan_summary',
  'approval_request',
  'execution_result',
  'error'
);

CREATE TYPE "CopilotIntent" AS ENUM (
  'create_strategic_front'
);

CREATE TYPE "CopilotOperation" AS ENUM (
  'create'
);

CREATE TYPE "CopilotConfidence" AS ENUM (
  'low',
  'medium',
  'high',
  'not_evaluable'
);

CREATE TYPE "CopilotAdapterType" AS ENUM (
  'deterministic'
);

CREATE TYPE "ActionPlanStatus" AS ENUM (
  'draft',
  'awaiting_confirmation',
  'partially_approved',
  'approved',
  'executing',
  'partially_completed',
  'completed',
  'failed',
  'cancelled',
  'superseded'
);

CREATE TYPE "ProposedActionStatus" AS ENUM (
  'proposed',
  'edited',
  'approved',
  'rejected',
  'executing',
  'completed',
  'failed',
  'blocked',
  'cancelled'
);

CREATE TYPE "ActionExecutionStatus" AS ENUM (
  'pending',
  'validating',
  'executing',
  'completed',
  'failed',
  'idempotent_replay',
  'partially_completed'
);

CREATE TABLE "CopilotConversation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "CopilotConversationStatus" NOT NULL DEFAULT 'collecting_context',
  "contextObjectType" TEXT,
  "contextObjectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CopilotConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CopilotMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "CopilotMessageRole" NOT NULL,
  "messageType" "CopilotMessageType" NOT NULL,
  "content" TEXT NOT NULL,
  "sourceReferences" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CopilotMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntentAssessment" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "originalMessageId" TEXT NOT NULL,
  "primaryIntent" "CopilotIntent" NOT NULL,
  "operation" "CopilotOperation" NOT NULL,
  "detectedEntities" JSONB NOT NULL,
  "ambiguousObjects" JSONB NOT NULL,
  "missingInformation" JSONB NOT NULL,
  "recommendedCapabilities" JSONB NOT NULL,
  "confidence" "CopilotConfidence" NOT NULL,
  "sourceReferences" JSONB NOT NULL,
  "adapterType" "CopilotAdapterType" NOT NULL,
  "rubricVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntentAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionPlan" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "intentAssessmentId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "status" "ActionPlanStatus" NOT NULL DEFAULT 'draft',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "supersededById" TEXT,

  CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposedAction" (
  "id" TEXT NOT NULL,
  "actionPlanId" TEXT NOT NULL,
  "capabilityId" TEXT NOT NULL,
  "ownerPrd" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "commandType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "proposedPayload" JSONB NOT NULL,
  "editableFields" JSONB NOT NULL,
  "requiredPermissions" JSONB NOT NULL,
  "requiresConfirmation" BOOLEAN NOT NULL,
  "dependencyActionIds" JSONB NOT NULL,
  "status" "ProposedActionStatus" NOT NULL DEFAULT 'proposed',
  "version" INTEGER NOT NULL DEFAULT 1,
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProposedAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionExecution" (
  "id" TEXT NOT NULL,
  "proposedActionId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "ActionExecutionStatus" NOT NULL DEFAULT 'pending',
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "approvedBy" TEXT NOT NULL,
  "executedBy" TEXT,
  "commandPayload" JSONB NOT NULL,
  "result" JSONB,
  "error" JSONB,
  "createdObjectReferences" JSONB NOT NULL,
  "updatedObjectReferences" JSONB NOT NULL,
  "projectionLinks" JSONB NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ActionExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActionPlan_conversationId_version_key" ON "ActionPlan"("conversationId", "version");
CREATE UNIQUE INDEX "ActionExecution_idempotencyKey_key" ON "ActionExecution"("idempotencyKey");

CREATE INDEX "CopilotConversation_organizationId_idx" ON "CopilotConversation"("organizationId");
CREATE INDEX "CopilotConversation_userId_idx" ON "CopilotConversation"("userId");
CREATE INDEX "CopilotConversation_status_idx" ON "CopilotConversation"("status");
CREATE INDEX "CopilotConversation_organizationId_status_idx" ON "CopilotConversation"("organizationId", "status");
CREATE INDEX "CopilotConversation_userId_status_idx" ON "CopilotConversation"("userId", "status");

CREATE INDEX "CopilotMessage_conversationId_idx" ON "CopilotMessage"("conversationId");
CREATE INDEX "CopilotMessage_conversationId_createdAt_idx" ON "CopilotMessage"("conversationId", "createdAt");
CREATE INDEX "CopilotMessage_role_idx" ON "CopilotMessage"("role");
CREATE INDEX "CopilotMessage_messageType_idx" ON "CopilotMessage"("messageType");

CREATE INDEX "IntentAssessment_conversationId_idx" ON "IntentAssessment"("conversationId");
CREATE INDEX "IntentAssessment_originalMessageId_idx" ON "IntentAssessment"("originalMessageId");
CREATE INDEX "IntentAssessment_primaryIntent_idx" ON "IntentAssessment"("primaryIntent");
CREATE INDEX "IntentAssessment_operation_idx" ON "IntentAssessment"("operation");
CREATE INDEX "IntentAssessment_confidence_idx" ON "IntentAssessment"("confidence");

CREATE INDEX "ActionPlan_conversationId_idx" ON "ActionPlan"("conversationId");
CREATE INDEX "ActionPlan_intentAssessmentId_idx" ON "ActionPlan"("intentAssessmentId");
CREATE INDEX "ActionPlan_status_idx" ON "ActionPlan"("status");
CREATE INDEX "ActionPlan_createdBy_idx" ON "ActionPlan"("createdBy");
CREATE INDEX "ActionPlan_supersededById_idx" ON "ActionPlan"("supersededById");

CREATE INDEX "ProposedAction_actionPlanId_idx" ON "ProposedAction"("actionPlanId");
CREATE INDEX "ProposedAction_capabilityId_idx" ON "ProposedAction"("capabilityId");
CREATE INDEX "ProposedAction_status_idx" ON "ProposedAction"("status");
CREATE INDEX "ProposedAction_actionPlanId_status_idx" ON "ProposedAction"("actionPlanId", "status");

CREATE INDEX "ActionExecution_proposedActionId_idx" ON "ActionExecution"("proposedActionId");
CREATE INDEX "ActionExecution_status_idx" ON "ActionExecution"("status");
CREATE INDEX "ActionExecution_proposedActionId_status_idx" ON "ActionExecution"("proposedActionId", "status");

ALTER TABLE "CopilotConversation"
  ADD CONSTRAINT "CopilotConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CopilotMessage"
  ADD CONSTRAINT "CopilotMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "CopilotConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IntentAssessment"
  ADD CONSTRAINT "IntentAssessment_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "CopilotConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IntentAssessment"
  ADD CONSTRAINT "IntentAssessment_originalMessageId_fkey"
  FOREIGN KEY ("originalMessageId") REFERENCES "CopilotMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionPlan"
  ADD CONSTRAINT "ActionPlan_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "CopilotConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionPlan"
  ADD CONSTRAINT "ActionPlan_intentAssessmentId_fkey"
  FOREIGN KEY ("intentAssessmentId") REFERENCES "IntentAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionPlan"
  ADD CONSTRAINT "ActionPlan_supersededById_fkey"
  FOREIGN KEY ("supersededById") REFERENCES "ActionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProposedAction"
  ADD CONSTRAINT "ProposedAction_actionPlanId_fkey"
  FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionExecution"
  ADD CONSTRAINT "ActionExecution_proposedActionId_fkey"
  FOREIGN KEY ("proposedActionId") REFERENCES "ProposedAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
