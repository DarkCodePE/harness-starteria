import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { prisma } from '../../shared/db/prisma';
import type { StrategicFramingProvisionalStateService } from './strategic-framing.provisional-state.service';
import type { StrategicFramingEntryService } from './strategic-framing.entry.service';
import type { StrategicFramingLensSuggestionEvaluator } from './strategic-framing.lens-suggestions';
import type { StrategicFramingPrioritizationRecommendationEvaluator } from './strategic-framing.prioritization-recommendation';
import type { StrategicFramingPromotionService } from './strategic-framing.promotion.service';
import { strategicFramingCorrectionBodySchema, strategicFramingPromotionBodySchema, strategicFramingSourceBodySchema, strategicFramingStateParamsSchema } from './strategic-framing.schemas';

export class StrategicFramingController {
  constructor(private readonly service: StrategicFramingProvisionalStateService, private readonly entryService?: StrategicFramingEntryService, private readonly lensEvaluator?: StrategicFramingLensSuggestionEvaluator, private readonly prioritizationRecommendationEvaluator?: StrategicFramingPrioritizationRecommendationEvaluator, private readonly promotionService?: StrategicFramingPromotionService) {}

  promoteChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) throw AppError.unauthorized('No autorizado.', 'PROMOTION_FORBIDDEN');
      if (!this.promotionService) throw AppError.internal('La promoción SF-6C no está configurada.');
      const { stateId } = strategicFramingStateParamsSchema.parse(req.params);
      const parsed = strategicFramingPromotionBodySchema.safeParse(req.body);
      if (!parsed.success) throw AppError.badRequest('El payload de promoción no es válido.', 'INVALID_PROMOTION_PAYLOAD');
      const body = parsed.data;
      const result = await this.promotionService.promote({
        stateId,
        challengeCandidateId: body.challengeCandidateId,
        expectedVersion: body.expectedVersion,
        strategicFrontId: body.strategicFrontId,
        title: body.title,
        statement: body.statement,
        type: body.type,
        objective: body.objective,
        whyNow: body.whyNow,
        successCriteria: body.successCriteria,
        rationale: body.rationale,
        actor: { id: req.user.id, roles: req.user.roles, permissions: req.user.permissions },
      });
      res.status(result.retry ? 200 : 201).json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  createOrReuseFromSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) throw AppError.unauthorized('No autorizado.', 'SF3D_AUTH_REQUIRED');
      if (!this.entryService) throw AppError.internal('La orquestación SF-3D no está configurada.');
      const body = strategicFramingSourceBodySchema.parse(req.body);
      const actor = await this.resolveActor(req);
      const data = await this.entryService.createOrReuse({ source: body, actor, permissions: req.user.permissions, idempotencyKey: req.get('Idempotency-Key') ?? undefined });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  getState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = await this.resolveActor(req);
      const { stateId } = strategicFramingStateParamsSchema.parse(req.params);
      const data = await this.service.getCurrent({ stateId, actorUserId: actor.id, organizationId: actor.organizationId, permissions: req.user!.permissions });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  getLensSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = await this.resolveActor(req);
      const { stateId } = strategicFramingStateParamsSchema.parse(req.params);
      const state = await this.service.getCurrent({ stateId, actorUserId: actor.id, organizationId: actor.organizationId, permissions: req.user!.permissions });
      if (!this.lensEvaluator) throw AppError.internal('El evaluador de lenses no está configurado.');
      res.json({ success: true, data: this.lensEvaluator.evaluate(state) });
    } catch (error) { next(error); }
  };

  getPrioritizationRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = await this.resolveActor(req);
      const { stateId } = strategicFramingStateParamsSchema.parse(req.params);
      const state = await this.service.getCurrent({ stateId, actorUserId: actor.id, organizationId: actor.organizationId, permissions: req.user!.permissions });
      if (!this.prioritizationRecommendationEvaluator) throw AppError.internal('El evaluador de recomendación SF-5C no está configurado.');
      res.json({ success: true, data: this.prioritizationRecommendationEvaluator.evaluate(state) });
    } catch (error) { next(error); }
  };

  updateState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = await this.resolveActor(req);
      const { stateId } = strategicFramingStateParamsSchema.parse(req.params);
      const body = strategicFramingCorrectionBodySchema.parse(req.body);
      const data = await this.service.correct({
        stateId,
        actorUserId: actor.id,
        organizationId: actor.organizationId,
        permissions: req.user!.permissions,
        expectedVersion: body.expectedVersion,
        reason: body.reason,
        correction: {
          intendedMovement: body.intendedMovement,
          whyItMatters: body.whyItMatters,
          movementSignalStatus: body.movementSignalStatus,
          movementSignalValue: body.movementSignalValue,
          horizonContext: body.horizonContext,
          decisionToEnable: body.decisionToEnable,
          subjectLevel: body.subjectLevel,
          parentStatus: body.parentStatus,
          parentContext: body.parentLabel === undefined ? undefined : { label: body.parentLabel },
        },
      });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  private async resolveActor(req: Request): Promise<{ id: string; organizationId: string | null }> {
    if (!req.user?.id) throw AppError.unauthorized('No autorizado.', 'SF_PROVISIONAL_STATE_AUTH_REQUIRED');
    const actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, organizationId: true } });
    if (!actor) throw AppError.unauthorized('No autorizado.', 'SF_PROVISIONAL_STATE_AUTH_REQUIRED');
    return actor;
  }
}
