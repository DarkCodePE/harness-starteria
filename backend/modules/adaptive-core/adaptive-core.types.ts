export type AdaptiveQuestionSource =
  | 'core'
  | 'route'
  | 'method_catalog'
  | 'challenge_type'
  | 'company_context'
  | 'challenge_context'
  | 'previous_answer'
  | 'ai_generated';

export type AdaptiveRouteType =
  | 'explore_validate'
  | 'design_solution'
  | 'implement_handoff'
  | 'plan_coordinate'
  | 'reconstruct_existing'
  | 'lightweight_plan';

export type AdaptiveDepthLevel = 'essential' | 'standard' | 'extended';
export type AdaptiveHealth = 'healthy' | 'attention' | 'blocked' | 'ready_for_decision';

export interface MaterializedQuestion {
  id: string;
  prompt: string;
  purpose: string;
  clarifiesVariable: string;
  answerType: 'single_choice' | 'multi_choice' | 'free_text' | 'evidence_link' | 'date' | 'owner';
  reason: string;
  source: AdaptiveQuestionSource;
  sourceRefs: string[];
  required: boolean;
  checkpointKey: string;
  configurationVersion: number;
  allowsUnknown: boolean;
  contextDerived?: boolean;
  confirmationRequired?: boolean;
}

export interface Step0AlignmentBrief {
  intention: string;
  origin: string;
  challengeType: string;
  objective: string;
  scope: string;
  inclusions: string[];
  exclusions: string[];
  output: string;
  adoption: string;
  outcome: string;
  actors: string[];
  restrictions: string[];
  facts: string[];
  signals: string[];
  assumptions: string[];
  priorityHypothesis: string;
  validationQuestions: string[];
  decisionCriteria: string;
  availableEvidence: string[];
  missingInformation: string[];
}

export interface AdaptiveCoreState {
  schemaVersion: 'PRD-03-v0.4';
  masterContext: Record<string, unknown>;
  activeStepConfigurationId: string;
  stepConfigurations: Record<string, unknown>[];
  activeCheckpoint: Record<string, unknown> | null;
  checkpointInstances: Record<string, unknown>[];
  stepOutputs: Record<string, unknown>[];
  progressSignal: Record<string, unknown> | null;
  events: Record<string, unknown>[];
  legacyFallback: boolean;
}
