export type CheckpointEvidenceRequirement =
  | 'structural'
  | 'evidence_reference_required'
  | 'validated_support_required'
  | 'contradiction_must_be_resolved'
  | 'human_confirmation_required';

export interface CheckpointEvidencePolicy {
  checkpointKey: string;
  requirements: CheckpointEvidenceRequirement[];
  bindingRequired: boolean;
}

const DEFAULT_POLICY: CheckpointEvidencePolicy = {
  checkpointKey: '*',
  requirements: ['structural', 'human_confirmation_required'],
  bindingRequired: false,
};

const POLICIES: Record<string, CheckpointEvidencePolicy> = {
  'CP-1.3': {
    checkpointKey: 'CP-1.3',
    requirements: [
      'structural',
      'evidence_reference_required',
      'validated_support_required',
      'contradiction_must_be_resolved',
      'human_confirmation_required',
    ],
    bindingRequired: true,
  },
  'CP-2.2': {
    checkpointKey: 'CP-2.2',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
  'CP-2.3': {
    checkpointKey: 'CP-2.3',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
  'CP-3.2': {
    checkpointKey: 'CP-3.2',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
  'CP-3.3': {
    checkpointKey: 'CP-3.3',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
  'CP-3.4': {
    checkpointKey: 'CP-3.4',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
  'CP-4.2': {
    checkpointKey: 'CP-4.2',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
  'CP-4.4': {
    checkpointKey: 'CP-4.4',
    requirements: ['structural', 'evidence_reference_required', 'human_confirmation_required'],
    bindingRequired: true,
  },
};

export function getCheckpointEvidencePolicy(checkpointKey: string): CheckpointEvidencePolicy {
  return POLICIES[checkpointKey] ?? { ...DEFAULT_POLICY, checkpointKey };
}

export function checkpointRequiresValidatedSupport(checkpointKey: string): boolean {
  return getCheckpointEvidencePolicy(checkpointKey).requirements.includes('validated_support_required');
}

export function checkpointRequiresEvidenceReference(checkpointKey: string): boolean {
  return getCheckpointEvidencePolicy(checkpointKey).requirements.includes('evidence_reference_required');
}
