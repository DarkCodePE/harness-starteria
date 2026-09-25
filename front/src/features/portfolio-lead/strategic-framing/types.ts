export type SubjectLevel = 'front_like' | 'challenge_like' | 'initiative_like' | 'unresolved';
export type ParentStatus = 'known' | 'provisional' | 'unresolved';
export type SignalStatus = 'confirmed' | 'proxy' | 'suggested' | 'unknown' | 'conflicting';

export type StrategicFramingState = {
  id: string;
  sourceMode: string;
  intendedMovement: string | null;
  whyItMatters: string | null;
  movementSignalStatus: SignalStatus | null;
  movementSignalValue: string | null;
  horizonContext: string | null;
  decisionToEnable: string | null;
  subjectLevel: SubjectLevel;
  scopeAssessment: { confidence: string; rationale: string[] };
  parentStatus: ParentStatus;
  parentContext: { label: string | null; sourceRefs: string[] };
  sufficiency: { status: string; blockers: string[]; softGaps: string[]; optionalContext: string[] };
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type StrategicFramingDraft = Pick<StrategicFramingState, 'intendedMovement' | 'whyItMatters' | 'movementSignalStatus' | 'movementSignalValue' | 'horizonContext' | 'decisionToEnable' | 'subjectLevel' | 'parentStatus'> & { parentLabel: string | null };
