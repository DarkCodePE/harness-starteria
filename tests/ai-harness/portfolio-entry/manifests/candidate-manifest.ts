import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createContractManifest, hashContractManifest } from './contract-manifest';

export const candidateManifestSchema = z.object({
  candidate_id: z.string(),
  adapter_mode: z.enum(['deterministic_baseline', 'live_llm_candidate']),
  provider: z.string().optional(),
  model: z.string().optional(),
  model_version_if_available: z.string().optional(),
  temperature: z.number().optional(),
  seed: z.union([z.string(), z.number()]).optional(),
  seed_support: z.enum(['provided', 'unavailable', 'not_requested']).optional(),
  prompt_manifest_hash: z.string(),
  contract_manifest_hash: z.string(),
  code_commit: z.string().optional(),
  code_commit_status: z.enum(['available', 'unavailable', 'uncommitted']).optional(),
});

export type CandidateManifest = z.infer<typeof candidateManifestSchema>;

export function createDeterministicBaselineCandidateManifest(input: {
  candidateId?: string;
  codeCommit?: string;
} = {}): CandidateManifest {
  const contractManifest = createContractManifest();
  const manifest: CandidateManifest = {
    candidate_id: input.candidateId ?? 'portfolio-entry-experimental-v0.1',
    adapter_mode: 'deterministic_baseline',
    provider: 'deterministic-experimental',
    prompt_manifest_hash: hashStablePayload({
      prompt_manifest: 'not-applicable-in-fase-1',
      candidate_id: input.candidateId ?? 'portfolio-entry-experimental-v0.1',
    }),
    contract_manifest_hash: hashContractManifest(contractManifest),
    code_commit: input.codeCommit,
  };

  return candidateManifestSchema.parse(manifest);
}

export function createLiveCandidateManifest(input: {
  candidateId: string;
  provider: string;
  model: string;
  modelVersionIfAvailable?: string;
  temperature?: number;
  seed?: string | number;
  seedSupport: 'provided' | 'unavailable' | 'not_requested';
  promptManifestHash: string;
  codeCommit?: string;
  codeCommitStatus?: 'available' | 'unavailable' | 'uncommitted';
}): CandidateManifest {
  const contractManifest = createContractManifest();
  const manifest: CandidateManifest = {
    candidate_id: input.candidateId,
    adapter_mode: 'live_llm_candidate',
    provider: input.provider,
    model: input.model,
    model_version_if_available: input.modelVersionIfAvailable,
    ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
    seed: input.seed,
    seed_support: input.seedSupport,
    prompt_manifest_hash: input.promptManifestHash,
    contract_manifest_hash: hashContractManifest(contractManifest),
    code_commit: input.codeCommit,
    code_commit_status: input.codeCommitStatus,
  };

  return candidateManifestSchema.parse(manifest);
}

function hashStablePayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
