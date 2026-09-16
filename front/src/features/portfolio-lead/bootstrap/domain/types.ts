export type EvidenceSource = 'entry' | 'ai' | 'user' | 'system';

export type ProvenanceStatus =
  | 'AI_SUGGESTED'
  | 'AI_INFERRED'
  | 'USER_CONFIRMED'
  | 'CANONICAL';

export type PortfolioAnchorStatus =
  | 'anchor_missing'
  | 'anchor_insufficient'
  | 'anchor_provisional'
  | 'anchor_sufficient'
  | 'anchor_confirmed'
  | 'anchor_conflicting';

export type BusinessSignalStatus = 'unknown' | 'proxy' | 'known';

export type BootstrapPhase = 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export type HomeState = 'HOME_A' | 'HOME_B' | 'HOME_C' | 'HOME_D' | 'HOME_E' | 'HOME_F';

export type StrategicConnectionStatus =
  | 'alignment_unknown'
  | 'probable_alignment'
  | 'partial_alignment'
  | 'possible_misalignment'
  | 'confirmed_alignment'
  | 'confirmed_misalignment';

export type ProposedMutationStatus = 'proposed' | 'confirmed' | 'rejected' | 'applied';

export type AdvancementConditionType =
  | 'business_signal'
  | 'decision_path'
  | 'critical_dependency'
  | 'required_context'
  | 'ownership_visibility';

export type AdvancementConditionSeverity = 'info' | 'attention' | 'blocking';

export type NextBestPortfolioActionId =
  | 'resolve_information_conflict'
  | 'complete_portfolio_anchor'
  | 'bring_existing_work'
  | 'review_proposed_structure'
  | 'review_blocking_condition'
  | 'review_decision'
  | 'review_portfolio_attention';

export interface HumanConfirmation {
  confirmedBy: string;
  confirmedAt: string;
}

export interface ProvenancedValue<T> {
  value: T;
  provenance: ProvenanceStatus;
  source?: EvidenceSource;
  humanConfirmation?: HumanConfirmation;
}

export interface PortfolioAnchorInput {
  desiredOutcome?: string | ProvenancedValue<string>;
  priority?: string | ProvenancedValue<string>;
  contextSummary?: string | ProvenancedValue<string>;
  decisionToEnable?: string | ProvenancedValue<string>;
  businessSignal?: {
    status: BusinessSignalStatus;
    value?: string;
    provenance?: ProvenanceStatus;
  };
  criticalContradictions?: string[];
  humanConfirmation?: HumanConfirmation;
}

export interface PortfolioAnchor {
  status: PortfolioAnchorStatus;
  desiredOutcome?: string;
  priority?: string;
  contextSummary?: string;
  decisionToEnable?: string;
  businessSignalStatus: BusinessSignalStatus;
  criticalContradictions: string[];
  missing: string[];
  provenance: ProvenanceStatus;
}

export interface DetectedWorkItem {
  id: string;
  label: string;
  provenance: ProvenanceStatus;
  materialReviewRequired?: boolean;
  strategicConnectionStatus?: StrategicConnectionStatus;
}

export interface AdvancementCondition {
  type: AdvancementConditionType;
  severity: AdvancementConditionSeverity;
  label: string;
  affectsMovement?: boolean;
}

export interface PortfolioBootstrapState {
  continuationExists: boolean;
  anchor?: PortfolioAnchor;
  existingWorkStatus?: 'unknown' | 'has_work' | 'no_existing_work';
  detectedWorkItems?: DetectedWorkItem[];
  materialReviewPending?: boolean;
  firstReadingPublished?: boolean;
  attentionSignals?: AdvancementCondition[];
  decisionRequired?: boolean;
}

export interface NextBestPortfolioAction {
  id: NextBestPortfolioActionId;
  label: string;
  reason: string;
}

export interface ProposedMutation<TValue = unknown> {
  id: string;
  fieldPath: string;
  proposedValue: TValue;
  status: ProposedMutationStatus;
  provenance: ProvenanceStatus;
  material: boolean;
  humanConfirmation?: HumanConfirmation;
}
