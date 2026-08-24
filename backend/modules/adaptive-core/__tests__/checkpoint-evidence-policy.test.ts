import { describe, expect, it } from 'vitest';
import { checkpointRequiresEvidenceReference, checkpointRequiresValidatedSupport, getCheckpointEvidencePolicy } from '../checkpoint-evidence-policy';

describe('checkpoint evidence policy', () => {
  it('requires validated support for CP-1.3 in Patch 1', () => {
    const policy = getCheckpointEvidencePolicy('CP-1.3');

    expect(policy.bindingRequired).toBe(true);
    expect(policy.requirements).toContain('structural');
    expect(policy.requirements).toContain('evidence_reference_required');
    expect(policy.requirements).toContain('validated_support_required');
    expect(policy.requirements).toContain('contradiction_must_be_resolved');
    expect(policy.requirements).toContain('human_confirmation_required');
    expect(checkpointRequiresValidatedSupport('CP-1.3')).toBe(true);
  });

  it('keeps CP-1.4 structural-only for Patch 1', () => {
    const policy = getCheckpointEvidencePolicy('CP-1.4');

    expect(policy.bindingRequired).toBe(false);
    expect(policy.requirements).toEqual(['structural', 'human_confirmation_required']);
    expect(checkpointRequiresValidatedSupport('CP-1.4')).toBe(false);
  });

  it('requires evidence references for evidence-sensitive Step 2, 3 and 4 checkpoints without validated support', () => {
    const evidenceSensitive = ['CP-2.2', 'CP-2.3', 'CP-3.2', 'CP-3.3', 'CP-3.4', 'CP-4.2', 'CP-4.4'];

    for (const checkpointKey of evidenceSensitive) {
      const policy = getCheckpointEvidencePolicy(checkpointKey);
      expect(policy.bindingRequired).toBe(true);
      expect(policy.requirements).toContain('evidence_reference_required');
      expect(policy.requirements).not.toContain('validated_support_required');
      expect(checkpointRequiresEvidenceReference(checkpointKey)).toBe(true);
      expect(checkpointRequiresValidatedSupport(checkpointKey)).toBe(false);
    }
  });

  it('keeps adjacent Step 2, 3 and 4 checkpoints structural-only for Patch 3', () => {
    const structuralOnly = ['CP-2.1', 'CP-2.4', 'CP-2.5', 'CP-3.1', 'CP-3.5', 'CP-4.1', 'CP-4.3', 'CP-4.5'];

    for (const checkpointKey of structuralOnly) {
      const policy = getCheckpointEvidencePolicy(checkpointKey);
      expect(policy.bindingRequired).toBe(false);
      expect(policy.requirements).toEqual(['structural', 'human_confirmation_required']);
      expect(checkpointRequiresEvidenceReference(checkpointKey)).toBe(false);
      expect(checkpointRequiresValidatedSupport(checkpointKey)).toBe(false);
    }
  });
});
