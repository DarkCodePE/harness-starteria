import { z } from 'zod';

export const strategicFramingStateParamsSchema = z.object({
  stateId: z.string().trim().min(1),
});

const nullableText = z.string().nullable().optional();

export const strategicFramingPromotionBodySchema = z.object({
  challengeCandidateId: z.string().trim().min(1),
  expectedVersion: z.number().int().positive(),
  strategicFrontId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  statement: z.string().trim().min(1),
  type: z.enum(['correccion', 'crecimiento', 'exploracion']),
  objective: nullableText,
  whyNow: nullableText,
  successCriteria: nullableText,
  rationale: nullableText,
}).strict();

const recommendationSnapshotSchema = z.object({
  recommendationVersion: z.string().trim().min(1),
  inputStateVersion: z.number().int().positive(),
  recommendedDisposition: z.enum(['address_now', 'observe', 'discard', 'uncertain', 'needs_clarification']),
  rationale: z.array(z.string()),
  sourceRefs: z.array(z.string()),
}).strict();

export const strategicFramingPrioritizationReviewBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  focusSlots: z.number().int().min(0).nullable().optional(),
  focusRationale: nullableText,
  decisions: z.array(z.object({
    candidateId: z.string().trim().min(1),
    disposition: z.enum(['address_now', 'observe', 'discard']),
    rationale: nullableText,
    recommendationSnapshot: recommendationSnapshotSchema,
  }).strict()).optional(),
  reason: nullableText,
}).strict();

export const strategicFramingChallengeStructureReviewBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  groups: z.array(z.object({
    challengeCandidateId: z.string().trim().min(1).optional(),
    sourceCandidateIds: z.array(z.string().trim().min(1)),
    relatedWorkRefs: z.array(z.string()).optional(),
    statement: z.string().trim().min(1),
    structureKind: z.enum(['lightweight_challenge', 'one_challenge', 'multiple_challenges']),
    structuralRecommendationRef: nullableText,
    structuralRecommendationVersion: nullableText,
  }).strict()),
  reason: nullableText,
}).strict();

export const strategicFramingCorrectionBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  intendedMovement: nullableText,
  whyItMatters: nullableText,
  movementSignalStatus: z.enum(['confirmed', 'proxy', 'suggested', 'unknown', 'conflicting']).nullable().optional(),
  movementSignalValue: nullableText,
  horizonContext: nullableText,
  decisionToEnable: nullableText,
  subjectLevel: z.enum(['front_like', 'challenge_like', 'initiative_like', 'unresolved']).optional(),
  parentStatus: z.enum(['known', 'provisional', 'unresolved']).optional(),
  parentLabel: nullableText,
  reason: nullableText,
}).strict();

const publicEntrySourceSchema = z.object({
  sourceMode: z.literal('public_entry'),
  bootstrapSessionId: z.string().trim().min(1),
}).strict();

const enterpriseDirectSourceSchema = z.object({
  sourceMode: z.literal('enterprise_direct'),
  intendedMovement: z.string().trim().min(1),
  whyItMatters: nullableText,
  movementSignalValue: nullableText,
  decisionToEnable: nullableText,
}).strict();

const existingPortfolioSourceSchema = z.object({
  sourceMode: z.literal('existing_portfolio'),
  sourceType: z.enum(['strategic_front', 'challenge', 'initiative']),
  sourceId: z.string().trim().min(1),
}).strict();

export const strategicFramingSourceBodySchema = z.discriminatedUnion('sourceMode', [
  publicEntrySourceSchema,
  enterpriseDirectSourceSchema,
  existingPortfolioSourceSchema,
]);

export type StrategicFramingSourceBody = z.infer<typeof strategicFramingSourceBodySchema>;

export type StrategicFramingCorrectionBody = z.infer<typeof strategicFramingCorrectionBodySchema>;
