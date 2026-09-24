export type StrategicFramingSourceMode =
  | 'public_entry'
  | 'enterprise_direct'
  | 'existing_portfolio'
  | 'bootstrap'
  | 'unknown';

export type FramingProvenance =
  | 'user_declared'
  | 'extracted'
  | 'ai_inferred'
  | 'ai_suggested'
  | 'user_confirmed'
  | 'unknown';

export type DerivedFramingItem = {
  id: string;
  kind: 'observation' | 'driver' | 'gap' | 'opportunity';
  statement: string;
  sourceRefs: string[];
  provenance: 'extracted' | 'ai_inferred' | 'ai_suggested' | 'user_confirmed' | 'derived';
  confidence?: 'low' | 'medium' | 'high' | null;
  canonical: false;
};

export type StrategicFramingReadModel = {
  context: {
    organizationId?: string | null;
    userId: string;
    bootstrapSessionId?: string | null;
    sourceContinuationId?: string | null;
    sourceMode: StrategicFramingSourceMode;
  };
  anchor: {
    id?: string | null;
    status: 'anchor_insufficient' | 'anchor_provisional' | 'anchor_sufficient' | 'anchor_confirmed' | 'anchor_conflicting' | 'unknown';
    intendedMovement?: string | null;
    whyItMatters?: string | null;
    signal: { status: 'confirmed' | 'proxy' | 'suggested' | 'unknown' | 'conflicting'; value?: string | null } | null;
    decisionToEnable?: string | null;
    parentContext: {
      status: 'known' | 'provisional' | 'unresolved' | 'unknown';
      label?: string | null;
      sourceRefs: string[];
    };
    provenance: ReadonlyArray<{ sourceRef: string; kind: FramingProvenance }>;
  };
  scopeAssessment: {
    level: 'front_like' | 'challenge_like' | 'initiative_like' | 'unresolved';
    confidence: 'low' | 'medium' | 'high' | 'unknown';
    rationale: string[];
    provenance: string[];
    canonicalized: false;
  };
  existingWork: Array<{
    id: string;
    label: string;
    stateHint?: string | null;
    ownerCandidate?: string | null;
    alignment: {
      status: 'confirmed_alignment' | 'probable_alignment' | 'partial_alignment' | 'alignment_unknown' | 'possible_misalignment' | 'confirmed_misalignment' | 'out_of_current_priority' | 'unknown';
      provenance?: string | null;
    };
    sourceRefs: string[];
  }>;
  framingSignals: {
    observations: DerivedFramingItem[];
    drivers: DerivedFramingItem[];
    gaps: DerivedFramingItem[];
    opportunities: DerivedFramingItem[];
  };
  sufficiency: {
    status: 'sufficient' | 'insufficient' | 'conflicting' | 'unknown';
    blockers: string[];
    softGaps: string[];
    optionalContext: string[];
  };
  nextBestAction: {
    kind: 'clarify_anchor' | 'review_parent_context' | 'review_alignment' | 'inspect_existing_work' | 'ready_for_structured_framing' | 'resolve_conflict' | 'unknown';
    reason: string;
  };
  generatedAt: string;
};

export type StrategicFramingReadInput = {
  context: StrategicFramingReadModel['context'];
  anchor?: {
    id?: string | null;
    status?: string | null;
    outcomeStatement?: string | null;
    contextSummary?: string | null;
    decisionToEnable?: string | null;
    businessSignalStatus?: string | null;
    businessSignalValue?: string | null;
    sourceRefs?: unknown;
    provenanceStatus?: string | null;
  } | null;
  workItems?: Array<{
    id: string;
    rawLabel: string;
    proposedName?: string | null;
    proposedPurpose?: string | null;
    currentStateHint?: string | null;
    ownerCandidate?: string | null;
    sourceRefs?: unknown;
  }>;
  strategicConnections?: Array<{
    workItemId: string;
    status?: string | null;
    provenanceStatus?: string | null;
    sourceRefs?: unknown;
    rationale?: string | null;
  }>;
  advancementConditions?: Array<{
    id?: string;
    type?: string | null;
    status?: string | null;
    statement: string;
    severity?: string | null;
    movementAffected?: string | null;
    provenanceStatus?: string | null;
    sourceRefs?: unknown;
  }>;
  proposedMutations?: Array<{
    id: string;
    status?: string | null;
    materiality?: string | null;
    uncertainty?: string | null;
    rationale?: string | null;
    sourceRefs?: unknown;
  }>;
  canonicalContext?: {
    strategicFrontId?: string | null;
    strategicFrontLabel?: string | null;
    challengeId?: string | null;
    initiativeId?: string | null;
    sourceRefs?: string[];
  } | null;
  now?: () => Date;
};
