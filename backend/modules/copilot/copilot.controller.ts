import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Role } from '../../shared/types/user.types';
import { CopilotErrors } from './domain/copilot.errors';
import type { CopilotActor, CopilotConversation } from './domain/copilot.types';
import type { ConversationService } from './application/conversation.service';
import type { ActionPlanService } from './application/action-plan.service';
import type { ApprovalService } from './application/approval.service';
import type { ActionExecutor } from './application/action-executor';
import type { CopilotOrchestrationService } from './application/copilot-orchestration.service';
import type { CopilotFeatureGuard } from './application/copilot-feature-guard';
import type { CopilotRepository } from './infrastructure/copilot.repository';
import {
  toActionExecutionDto,
  toActionPlanDto,
  toConversationDto,
  toIntentAssessmentDto,
  toMessageDto,
  toProposedActionDto,
} from './copilot.dto';

export class CopilotController {
  constructor(
    private readonly repository: CopilotRepository,
    private readonly conversationService: ConversationService,
    private readonly actionPlanService: ActionPlanService,
    private readonly approvalService: ApprovalService,
    private readonly actionExecutor: ActionExecutor,
    private readonly orchestrationService: CopilotOrchestrationService,
    private readonly featureGuard: CopilotFeatureGuard,
  ) {}

  createConversation = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const actor = await this.getActor(req);
      await this.assertWriteAllowedWithAudit(actor, 'copilot.feature_flag.denied.create_conversation', 'CopilotConversation');
      const conversation = await this.conversationService.createConversation(actor, {
        organizationId: actor.organizationId!,
        contextObjectType: req.body.contextObjectType,
        contextObjectId: req.body.contextObjectId,
      });
      res.status(201).json({ success: true, data: toConversationDto(conversation) });
    } catch (err) {
      next(err);
    }
  };

  getConversation = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      const conversation = await this.loadConversationForActor(req.params.conversationId, actor);
      res.json({ success: true, data: toConversationDto(conversation) });
    } catch (err) {
      next(err);
    }
  };

  getMessages = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      await this.loadConversationForActor(req.params.conversationId, actor);
      const messages = await this.conversationService.listMessages(req.params.conversationId);
      res.json({ success: true, data: messages.map(toMessageDto) });
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const actor = await this.getActor(req);
      await this.assertWriteAllowedWithAudit(actor, 'copilot.feature_flag.denied.send_message', 'CopilotMessage', req.params.conversationId);
      const result = await this.orchestrationService.sendMessage({
        conversationId: req.params.conversationId,
        actor,
        content: req.body.content,
      });
      res.status(201).json({
        success: true,
        data: {
          conversation: toConversationDto(result.conversation),
          userMessage: toMessageDto(result.userMessage),
          assistantMessage: toMessageDto(result.assistantMessage),
          assessment: toIntentAssessmentDto(result.assessment),
          actionPlan: result.actionPlan ? toActionPlanDto(result.actionPlan) : null,
          missingInformation: result.missingInformation,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getLatestIntentAssessment = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      await this.loadConversationForActor(req.params.conversationId, actor);
      const assessment = await this.repository.findLatestIntentAssessmentByConversation(req.params.conversationId);
      if (!assessment) {
        throw CopilotErrors.assessmentNotEvaluable();
      }
      res.json({ success: true, data: toIntentAssessmentDto(assessment) });
    } catch (err) {
      next(err);
    }
  };

  getCurrentActionPlan = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      await this.loadConversationForActor(req.params.conversationId, actor);
      const plan = await this.repository.findCurrentActionPlanByConversation(req.params.conversationId);
      if (!plan) {
        throw CopilotErrors.actionPlanNotFound(req.params.conversationId);
      }
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.plan.resumed',
        resource: 'ActionPlan',
        resourceId: plan.id,
        details: { analyticsEvent: 'copilot_plan_resumed', conversationId: req.params.conversationId },
      });
      res.json({ success: true, data: toActionPlanDto(plan) });
    } catch (err) {
      next(err);
    }
  };

  getActionPlan = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      const plan = await this.loadPlanForActor(req.params.actionPlanId, actor);
      res.json({ success: true, data: toActionPlanDto(plan) });
    } catch (err) {
      next(err);
    }
  };

  editAction = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const actor = await this.getActor(req);
      await this.assertWriteAllowedWithAudit(actor, 'copilot.feature_flag.denied.edit_action', 'ProposedAction', req.params.actionId);
      await this.loadActionForActor(req.params.actionId, actor);
      const action = await this.actionPlanService.editProposedPayload(
        req.params.actionId,
        req.body.expectedVersion,
        req.body.proposedPayload,
      );
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.action.edited',
        resource: 'ProposedAction',
        resourceId: action.id,
        details: { analyticsEvent: 'copilot_action_edited', version: action.version },
      });
      res.json({ success: true, data: toProposedActionDto(action) });
    } catch (err) {
      next(err);
    }
  };

  approveAction = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const actor = await this.getActor(req);
      await this.assertCreateStrategicFrontAllowedWithAudit(actor, 'copilot.feature_flag.denied.approve_action', req.params.actionId);
      const action = await this.approvalService.approveProposedAction({
        actionId: req.params.actionId,
        expectedVersion: req.body.expectedVersion,
        approvedBy: actor,
        organizationId: actor.organizationId!,
      });
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.action.approved',
        resource: 'ProposedAction',
        resourceId: action.id,
        details: { analyticsEvent: 'copilot_action_approved', version: action.version },
      });
      res.json({ success: true, data: toProposedActionDto(action) });
    } catch (err) {
      next(err);
    }
  };

  rejectAction = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const actor = await this.getActor(req);
      await this.assertWriteAllowedWithAudit(actor, 'copilot.feature_flag.denied.reject_action', 'ProposedAction', req.params.actionId);
      const action = await this.approvalService.rejectProposedAction({
        actionId: req.params.actionId,
        expectedVersion: req.body.expectedVersion,
        rejectedBy: actor,
        organizationId: actor.organizationId!,
        reason: req.body.reason,
      });
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.action.rejected',
        resource: 'ProposedAction',
        resourceId: action.id,
        details: { analyticsEvent: 'copilot_action_rejected', version: action.version },
      });
      res.json({ success: true, data: toProposedActionDto(action) });
    } catch (err) {
      next(err);
    }
  };

  executeAction = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const actor = await this.getActor(req);
      await this.assertCreateStrategicFrontAllowedWithAudit(actor, 'copilot.feature_flag.denied.execute_action', req.params.actionId);
      const idempotencyKey = this.getIdempotencyKey(req);
      const execution = await this.actionExecutor.executeApprovedAction({
        actionId: req.params.actionId,
        expectedVersion: req.body.expectedVersion,
        idempotencyKey,
        executedBy: actor,
        organizationId: actor.organizationId!,
        correlationId: req.correlationId,
      });
      await this.syncConversationStatusFromAction(req.params.actionId);
      await this.repository.writeAudit({
        userId: actor.id,
        action: execution.status === 'failed' ? 'copilot.action.execution_failed' : 'copilot.action.execution_completed',
        resource: 'ActionExecution',
        resourceId: execution.id,
        details: {
          analyticsEvent: execution.status === 'failed'
            ? 'copilot_action_execution_failed'
            : 'copilot_action_execution_completed',
          status: execution.status,
          idempotencyKeyLength: idempotencyKey.length,
          correlationId: req.correlationId,
        },
      });
      res.status(execution.status === 'idempotent_replay' ? 200 : 201).json({
        success: true,
        data: toActionExecutionDto(execution),
      });
    } catch (err) {
      next(err);
    }
  };

  getExecution = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      const execution = await this.repository.findExecutionById(req.params.executionId);
      if (!execution) {
        throw CopilotErrors.actionExecutionNotFound(req.params.executionId);
      }
      await this.loadActionForActor(execution.proposedActionId, actor);
      res.json({ success: true, data: toActionExecutionDto(execution) });
    } catch (err) {
      next(err);
    }
  };

  listActionExecutions = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      this.featureGuard.assertReadAllowed();
      const actor = await this.getActor(req);
      await this.loadActionForActor(req.params.actionId, actor);
      const executions = await this.repository.listExecutionsByAction(req.params.actionId);
      res.json({ success: true, data: executions.map(toActionExecutionDto) });
    } catch (err) {
      next(err);
    }
  };

  private async getActor(req: Request): Promise<CopilotActor> {
    if (!req.user) {
      throw CopilotErrors.permissionDenied('authenticated');
    }
    const organizationId = await this.repository.getActorOrganizationId(req.user.id);
    if (!organizationId) {
      throw CopilotErrors.organizationAccessDenied('unknown', 'authenticated_user_without_organization');
    }
    return {
      id: req.user.id,
      role: req.user.role as Role,
      organizationId,
    };
  }

  private async loadConversationForActor(
    conversationId: string,
    actor: CopilotActor,
  ): Promise<CopilotConversation> {
    const conversation = await this.conversationService.getConversation(conversationId);
    if (conversation.organizationId !== actor.organizationId) {
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.organization_access.denied',
        resource: 'CopilotConversation',
        resourceId: conversation.id,
        details: {
          organizationId: actor.organizationId,
          conversationOrganizationId: conversation.organizationId,
          reason: 'conversation_organization_mismatch',
        },
      });
      throw CopilotErrors.organizationAccessDenied(actor.organizationId ?? 'unknown', 'conversation_organization_mismatch');
    }
    if (conversation.userId !== actor.id && actor.role !== 'admin' && actor.role !== 'mentor') {
      throw CopilotErrors.conversationNotFound(conversationId);
    }
    return conversation;
  }

  private async loadPlanForActor(actionPlanId: string, actor: CopilotActor) {
    const plan = await this.actionPlanService.getPlan(actionPlanId);
    await this.loadConversationForActor(plan.conversationId, actor);
    return plan;
  }

  private async loadActionForActor(actionId: string, actor: CopilotActor) {
    const action = await this.repository.findProposedActionById(actionId);
    if (!action) {
      throw CopilotErrors.proposedActionNotFound(actionId);
    }
    const plan = await this.loadPlanForActor(action.actionPlanId, actor);
    return { action, plan };
  }

  private getIdempotencyKey(req: Request): string {
    const header = req.header('Idempotency-Key');
    const key = header?.trim();
    if (!key) {
      throw CopilotErrors.idempotencyKeyRequired();
    }
    if (!/^[A-Za-z0-9._:-]{8,200}$/.test(key)) {
      throw CopilotErrors.idempotencyConflict(key);
    }
    return key;
  }

  private async syncConversationStatusFromAction(actionId: string): Promise<void> {
    const action = await this.repository.findProposedActionById(actionId);
    if (!action) return;
    const plan = await this.repository.findActionPlanById(action.actionPlanId);
    if (!plan) return;

    const nextStatus = plan.status === 'completed'
      ? 'completed'
      : plan.status === 'executing'
        ? 'executing'
        : plan.status === 'partially_completed'
          ? 'partially_completed'
          : plan.status === 'failed'
            ? 'blocked'
            : 'awaiting_confirmation';
    await this.repository.updateConversationStatus(plan.conversationId, nextStatus);
  }

  private async assertWriteAllowedWithAudit(
    actor: CopilotActor,
    action: string,
    resource: string,
    resourceId?: string | null,
  ): Promise<void> {
    try {
      this.featureGuard.assertWriteAllowed(actor.organizationId!);
    } catch (err) {
      await this.auditFeatureFlagDenial(actor, action, resource, resourceId ?? null, err);
      throw err;
    }
  }

  private async assertCreateStrategicFrontAllowedWithAudit(
    actor: CopilotActor,
    action: string,
    resourceId: string,
  ): Promise<void> {
    try {
      this.featureGuard.assertCreateStrategicFrontAllowed(actor.organizationId!);
    } catch (err) {
      await this.auditFeatureFlagDenial(actor, action, 'ProposedAction', resourceId, err);
      throw err;
    }
  }

  private async auditFeatureFlagDenial(
    actor: CopilotActor,
    action: string,
    resource: string,
    resourceId: string | null,
    err: unknown,
  ): Promise<void> {
    if (!(err instanceof AppError) || !String(err.code).startsWith('COPILOT_')) {
      return;
    }
    await this.repository.writeAudit({
      userId: actor.id,
      action,
      resource,
      resourceId,
      details: {
        event: 'CopilotFeatureFlagDenied',
        organizationId: actor.organizationId,
        code: err.code,
      },
    });
  }
}
