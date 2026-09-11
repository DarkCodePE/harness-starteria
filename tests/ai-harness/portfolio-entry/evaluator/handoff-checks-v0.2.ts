import { portfolioEntryHandoffV2Schema, type PortfolioEntryHandoffV2, type SuggestedApproachV2 } from '../schemas/handoff.schema';
import type { FailureCodeV2, HardCheckResultV2 } from './evaluation-types-v0.2';

const FORBIDDEN_CANONICAL_KEYS = new Set([
  'Organization',
  'StrategicFront',
  'Challenge',
  'Initiative',
  'Project',
  'Step',
  'Decision',
  'Accelerator',
  'organization',
  'strategic_front',
  'challenge',
  'initiative',
  'project',
  'step',
  'decision',
  'accelerator',
  'canonical_organization',
  'canonical_strategic_front',
  'canonical_challenge',
  'canonical_initiative',
  'canonical_project',
  'canonical_step',
  'canonical_decision',
  'canonical_accelerator',
  'experiment_card',
  'gate',
  'success_criteria',
]);

const STEP_ACTIVATION_KEYS = new Set([
  'activate_step',
  'activated_step',
  'step_activation',
  'create_step',
  'initialize_step',
  'create_cycle',
]);

const FORBIDDEN_EXTERNAL_EVIDENCE_CAPABILITY = new Set([
  'produce_market_evidence',
  'produce_customer_feedback',
  'produce_regulatory_validation',
  'produce_expert_certification',
  'make_organizational_decision',
]);

export function evaluateHandoffChecksV2(input: {
  handoff: unknown;
}): HardCheckResultV2[] {
  const parsed = portfolioEntryHandoffV2Schema.safeParse(input.handoff);
  const checks: HardCheckResultV2[] = [
    {
      check_id: 'HC-HANDOFF-SCHEMA',
      status: parsed.success ? 'PASS' : 'FAIL',
      severity: 'HARD_FAILURE',
      failure_code: parsed.success ? undefined : 'F-SCHEMA',
      evidence: [{
        source: 'handoff',
        path: 'PortfolioEntryHandoff',
        expected: 'portfolioEntryHandoffV2Schema',
        actual: parsed.success ? 'valid' : parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      }],
      rationale: parsed.success ? 'PortfolioEntryHandoff conforms to schema.' : 'PortfolioEntryHandoff does not conform to schema.',
    },
    checkForbiddenCanonicalObjects(input.handoff),
    checkStepActivation(input.handoff),
    checkNoExperimentArtifact(input.handoff),
  ];

  if (!parsed.success) {
    checks.push(notEvaluable('HC-18', 'F-PROVENANCE', 'Handoff schema failed; recommendation provenance cannot be evaluated safely.'));
    checks.push(notEvaluable('HC-GAP-MAP', 'F-GAP_MAPPING', 'Handoff schema failed; GapResolutionMap cannot be evaluated safely.'));
    checks.push(notEvaluable('HC-HANDOFF-STATUS', 'F-HANDOFF', 'Handoff schema failed; handoff_status cannot be evaluated safely.'));
    checks.push(notEvaluable('HC-EXISTING-DESIRED', 'F-CONTEXT_FIDELITY', 'Handoff schema failed; existing/desired fidelity cannot be evaluated safely.'));
    checks.push(notEvaluable('HC-CAPABILITY-OVERCLAIM-HANDOFF', 'F-CAPABILITY_OVERCLAIM', 'Handoff schema failed; structured capability claims cannot be evaluated safely.'));
    return checks;
  }

  checks.push(checkRecommendationProvenance(parsed.data));
  checks.push(checkAlternativeProvenance(parsed.data));
  checks.push(checkGapResolution(parsed.data));
  checks.push(checkHandoffStatus(parsed.data));
  checks.push(checkExistingDesiredFidelity(parsed.data));
  checks.push(checkExternalEvidenceCapabilities(parsed.data));
  checks.push(notEvaluable('HC-RECOMMENDATION-QUALITY', 'F-RECOMMENDATION_FIDELITY', 'Recommendation quality requires Human Review; no LLM judge is used.'));
  checks.push(notEvaluable('HC-PRODUCT-VALUE', 'F-PRODUCT_VALUE', 'Starteria value visibility requires Human Review; no LLM judge is used.'));

  return checks;
}

function checkRecommendationProvenance(handoff: PortfolioEntryHandoffV2): HardCheckResultV2 {
  if (!handoff.recommended_approach) {
    return pass('HC-18-RECOMMENDED', 'No recommended approach was provided, so recommendation provenance is not applicable in practice.', [{
      source: 'handoff',
      path: 'recommended_approach',
      actual: undefined,
    }]);
  }
  return checkApproachProvenance('HC-18-RECOMMENDED', 'recommended_approach', [handoff.recommended_approach]);
}

function checkAlternativeProvenance(handoff: PortfolioEntryHandoffV2): HardCheckResultV2 {
  return checkApproachProvenance('HC-18-ALTERNATIVES', 'alternative_approaches', handoff.alternative_approaches);
}

function checkApproachProvenance(checkId: string, path: string, approaches: SuggestedApproachV2[]): HardCheckResultV2 {
  const invalid = approaches.filter((approach) => approach.origin !== 'AI_SUGGESTED' || approach.review_disposition !== 'UNREVIEWED');
  return {
    check_id: checkId,
    status: invalid.length ? 'FAIL' : 'PASS',
    severity: 'HARD_FAILURE',
    failure_code: invalid.length ? 'F-PROVENANCE' : undefined,
    evidence: [{
      source: 'handoff',
      path,
      expected: 'AI_SUGGESTED + UNREVIEWED',
      actual: approaches.map((approach) => ({ origin: approach.origin, review_disposition: approach.review_disposition })),
    }],
    rationale: invalid.length ? 'AI suggestion provenance or review disposition is invalid.' : 'AI suggestions preserve AI_SUGGESTED + UNREVIEWED.',
  };
}

function checkGapResolution(handoff: PortfolioEntryHandoffV2): HardCheckResultV2 {
  const ids = handoff.gap_resolution_map.map((gap) => gap.gap_id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  return {
    check_id: 'HC-GAP-MAP',
    status: duplicateIds.length ? 'FAIL' : 'PASS',
    severity: duplicateIds.length ? 'HARD_FAILURE' : 'INFO',
    failure_code: duplicateIds.length ? 'F-GAP_MAPPING' : undefined,
    evidence: [{
      source: 'handoff',
      path: 'gap_resolution_map[].gap_id',
      expected: 'unique gap ids',
      actual: ids,
    }],
    rationale: duplicateIds.length ? 'GapResolutionMap contains duplicated gap ids.' : 'GapResolutionMap shape and ids are valid.',
  };
}

function checkHandoffStatus(handoff: PortfolioEntryHandoffV2): HardCheckResultV2 {
  const inconsistent = handoff.handoff_status === 'ready_with_uncertainty'
    && handoff.unresolved_context.length === 0
    && handoff.gap_resolution_map.length === 0;
  return {
    check_id: 'HC-HANDOFF-STATUS',
    status: inconsistent ? 'FAIL' : 'PASS',
    severity: inconsistent ? 'WARNING' : 'INFO',
    failure_code: inconsistent ? 'F-HANDOFF' : undefined,
    evidence: [{
      source: 'handoff',
      path: 'handoff_status/unresolved_context/gap_resolution_map',
      expected: 'ready_with_uncertainty carries observable uncertainty',
      actual: {
        handoff_status: handoff.handoff_status,
        unresolved_context_count: handoff.unresolved_context.length,
        gap_resolution_count: handoff.gap_resolution_map.length,
      },
    }],
    rationale: inconsistent ? 'handoff_status claims uncertainty but no structured uncertainty is present.' : 'handoff_status is structurally coherent.',
  };
}

function checkExistingDesiredFidelity(handoff: PortfolioEntryHandoffV2): HardCheckResultV2 {
  const existing = handoff.known_context.filter((item) => item.key === 'existing_program_or_process');
  const desired = handoff.known_context.filter((item) => item.key === 'desired_program_or_process');
  const contradiction = existing.length > 0
    && desired.length > 0
    && existing.some((existingItem) => desired.some((desiredItem) => existingItem.value === desiredItem.value));
  return {
    check_id: 'HC-EXISTING-DESIRED',
    status: contradiction ? 'FAIL' : 'PASS',
    severity: contradiction ? 'HARD_FAILURE' : 'INFO',
    failure_code: contradiction ? 'F-CONTEXT_FIDELITY' : undefined,
    evidence: [{
      source: 'handoff',
      path: 'known_context[existing_program_or_process|desired_program_or_process]',
      expected: 'existing and desired program/process remain distinct when both are structured',
      actual: { existing, desired },
    }],
    rationale: contradiction ? 'Structured existing program/process was collapsed into desired program/process.' : 'Structured existing/desired program or process fields remain distinct.',
  };
}

function checkExternalEvidenceCapabilities(handoff: PortfolioEntryHandoffV2): HardCheckResultV2 {
  const overclaims = handoff.gap_resolution_map.filter((gap) => (
    gap.resolution_type === 'REQUIRES_EXTERNAL_EVIDENCE'
    && gap.starteria_capability
    && FORBIDDEN_EXTERNAL_EVIDENCE_CAPABILITY.has(gap.starteria_capability)
  ));
  return {
    check_id: 'HC-CAPABILITY-OVERCLAIM-HANDOFF',
    status: overclaims.length ? 'FAIL' : 'PASS',
    severity: overclaims.length ? 'HARD_FAILURE' : 'INFO',
    failure_code: overclaims.length ? 'F-CAPABILITY_OVERCLAIM' : undefined,
    evidence: [{
      source: 'handoff',
      path: 'gap_resolution_map[resolution_type=REQUIRES_EXTERNAL_EVIDENCE].starteria_capability',
      expected: 'register, make visible, track, or connect evidence; not produce external evidence',
      actual: overclaims,
    }],
    rationale: overclaims.length ? 'Handoff claims Starteria can produce external evidence or external decisions.' : 'No structured external-evidence capability overclaim was observed.',
  };
}

function checkForbiddenCanonicalObjects(source: unknown): HardCheckResultV2 {
  const hits = collectKeyHits(source, FORBIDDEN_CANONICAL_KEYS);
  return structuredHitCheck(
    'HC-HANDOFF-CANONICALIZATION',
    hits,
    'F-CANONICALIZATION',
    'Raw Handoff candidate contains forbidden canonical/product object fields.',
    'Raw Handoff candidate contains no forbidden canonical/product object fields.',
  );
}

function checkStepActivation(source: unknown): HardCheckResultV2 {
  const hits = collectKeyHits(source, STEP_ACTIVATION_KEYS);
  return structuredHitCheck(
    'HC-HANDOFF-STEP-ACTIVATION',
    hits,
    'F-STEP_LEAK',
    'Raw Handoff candidate contains structured Step activation fields.',
    'Raw Handoff candidate contains no structured Step activation fields.',
  );
}

function checkNoExperimentArtifact(source: unknown): HardCheckResultV2 {
  const hits = collectKeyHits(source, new Set(['experiment_card']));
  return structuredHitCheck(
    'HC-HANDOFF-EXPERIMENT-ARTIFACT',
    hits,
    'F-STEP_LEAK',
    'Raw Handoff candidate contains structured experiment artifacts.',
    'Raw Handoff candidate contains no structured experiment artifacts.',
  );
}

function structuredHitCheck(
  checkId: string,
  hits: EvaluationHit[],
  failureCode: FailureCodeV2,
  failRationale: string,
  passRationale: string,
): HardCheckResultV2 {
  return {
    check_id: checkId,
    status: hits.length ? 'FAIL' : 'PASS',
    severity: hits.length ? 'HARD_FAILURE' : 'INFO',
    failure_code: hits.length ? failureCode : undefined,
    evidence: hits.map((hit) => ({ source: 'handoff', path: hit.path, actual: hit.value })),
    rationale: hits.length ? failRationale : passRationale,
  };
}

function pass(checkId: string, rationale: string, evidence: HardCheckResultV2['evidence']): HardCheckResultV2 {
  return {
    check_id: checkId,
    status: 'PASS',
    severity: 'INFO',
    evidence,
    rationale,
  };
}

function notEvaluable(checkId: string, failureCode: FailureCodeV2, rationale: string): HardCheckResultV2 {
  return {
    check_id: checkId,
    status: 'NOT_EVALUABLE',
    severity: 'INFO',
    failure_code: failureCode,
    evidence: [],
    rationale,
  };
}

type EvaluationHit = {
  path: string;
  value: unknown;
};

function collectKeyHits(source: unknown, keys: Set<string>, path = 'handoff'): EvaluationHit[] {
  if (!source || typeof source !== 'object') return [];
  if (Array.isArray(source)) {
    return source.flatMap((item, index) => collectKeyHits(item, keys, `${path}[${index}]`));
  }

  return Object.entries(source).flatMap(([key, value]) => {
    const currentPath = `${path}.${key}`;
    const currentHit = keys.has(key) ? [{ path: currentPath, value }] : [];
    return [...currentHit, ...collectKeyHits(value, keys, currentPath)];
  });
}
