import { z } from 'zod';

export const checkpointResponseSchema = z.object({
  idempotencyKey: z.string().min(6),
  checkpointKey: z.string().min(1),
  responses: z.record(z.unknown()).default({}),
  truthBindings: z.object({
    claimId: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)).min(1),
    sourceRefIds: z.array(z.string().min(1)).min(1),
  }).optional(),
  evidenceBindings: z.object({
    evidenceIds: z.array(z.string().min(1)).min(1),
    sourceRefIds: z.array(z.string().min(1)).min(1),
  }).optional(),
  confirmedAt: z.string().datetime().optional(),
});

export const criticalChangeSchema = z.object({
  idempotencyKey: z.string().min(6),
  field: z.enum(['scope', 'company_or_area', 'challenge_type', 'route', 'hypothesis', 'target_date', 'critical_restriction', 'selected_bet']),
  previousValue: z.unknown().optional(),
  nextValue: z.unknown(),
  reason: z.string().min(1).optional(),
  confirmed: z.boolean().default(false),
  action: z.enum(['update_route', 'keep_previous_route', 'split_phases', 'back_and_edit']).default('update_route'),
});

export const confirmBriefSchema = z.object({
  idempotencyKey: z.string().min(6),
  brief: z.record(z.unknown()),
  confirmed: z.boolean(),
});

export type CheckpointResponseInput = z.infer<typeof checkpointResponseSchema>;
export type CriticalChangeInput = z.infer<typeof criticalChangeSchema>;
export type ConfirmBriefInput = z.infer<typeof confirmBriefSchema>;
export type ConfirmStep1OutputInput = z.infer<typeof confirmBriefSchema>;
export type ConfirmStep2OutputInput = z.infer<typeof confirmBriefSchema>;
export type ConfirmStep3OutputInput = z.infer<typeof confirmBriefSchema>;
export type ConfirmStep4OutputInput = z.infer<typeof confirmBriefSchema>;
