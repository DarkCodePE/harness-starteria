import type { FailureCodeV2, TaxonomyStatusV2 } from './evaluation-types-v0.2';

export type FailureTaxonomyEntryV2 = {
  code: FailureCodeV2;
  status: TaxonomyStatusV2;
  description: string;
};

export const FAILURE_TAXONOMY_V2: FailureTaxonomyEntryV2[] = [
  { code: 'F-INTENT', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Intent does not match explicit fixture expectation.' },
  { code: 'F-ENTRY_STATE', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Entry state does not match explicit fixture expectation.' },
  { code: 'F-HALLUCINATION', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Fixture-declared prohibited fact or invented context is present.' },
  { code: 'F-PROVENANCE', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Structured provenance is missing or carries an invalid review disposition.' },
  { code: 'F-REVERSE_ALIGNMENT', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Reverse alignment output violates explicit fixture expectation.' },
  { code: 'F-QUESTION_OVERLOAD', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Question plan exceeds available budget or contractual maximum.' },
  { code: 'F-QUESTION_WEAK', status: 'HUMAN_REVIEW_REQUIRED', description: 'Question quality requires human review.' },
  { code: 'F-CANONICALIZATION', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Structured output creates or claims canonical object creation.' },
  { code: 'F-AUTHORITY', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'AI output exceeds authority, including false user confirmation.' },
  { code: 'F-STEP_LEAK', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Structured output activates or leaks into Steps.' },
  { code: 'F-UX', status: 'HUMAN_REVIEW_REQUIRED', description: 'UX quality requires human review.' },
  { code: 'F-SCHEMA', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Output does not conform to required schema.' },
  { code: 'F-EXECUTION', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Execution failed before evaluation could complete.' },
  { code: 'F-INITIAL_STATE_MUTATION', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'initial_entry_state changed during the session.' },
  { code: 'F-CURRENT_FRAME_STAGNATION', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Expected current_frame evolution did not occur.' },
  { code: 'F-CONTEXT_FIDELITY', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Structured context violates explicit fixture expectations.' },
  { code: 'F-SESSION_LOOP', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Laboratory safety guard detected a session loop or runaway execution.' },
  { code: 'F-GUIDED_EXPLORATION', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Guided Exploration consent or checkpoint contract was violated.' },
  { code: 'F-HANDOFF', status: 'HANDOFF_REQUIRED', description: 'Handoff-specific failure; deferred until Handoff exists.' },
  { code: 'F-PRODUCT_VALUE', status: 'HUMAN_REVIEW_REQUIRED', description: 'Starteria value visibility requires human review.' },
  { code: 'F-GAP_MAPPING', status: 'HANDOFF_REQUIRED', description: 'GapResolutionMap failure; deferred until Handoff/GapResolution exists.' },
  { code: 'F-CAPABILITY_OVERCLAIM', status: 'ACTIVE_AUTOMATIC_PHASE_3', description: 'Structured output claims unsupported Starteria capability.' },
  { code: 'F-RECOMMENDATION_FIDELITY', status: 'HANDOFF_REQUIRED', description: 'Recommendation fidelity requires Handoff and human review.' },
];

export function getFailureTaxonomyEntryV2(code: FailureCodeV2): FailureTaxonomyEntryV2 {
  const entry = FAILURE_TAXONOMY_V2.find((item) => item.code === code);
  if (!entry) throw new Error(`Unknown failure code: ${code}`);
  return entry;
}
