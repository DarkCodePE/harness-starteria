import { createHash } from 'node:crypto';
import { z } from 'zod';

export const CONTRACT_MANIFEST_VERSION = '0.2';

export const contractManifestSchema = z.object({
  manifest_version: z.literal('0.2'),
  contracts: z.object({
    core: z.string(),
    portfolio_entry_logic: z.string(),
    clarification_handoff: z.literal('0.2.1'),
    agent: z.literal('0.2'),
    skill_01: z.literal('0.2'),
    skill_02: z.literal('0.2'),
    skill_03: z.literal('0.2'),
    skill_04: z.literal('0.2'),
    harness: z.literal('0.2'),
    execution_spec: z.literal('0.2'),
  }),
  hashes: z.record(z.string()).optional(),
});

export type ContractManifest = z.infer<typeof contractManifestSchema>;

export function createContractManifest(): ContractManifest {
  const manifest: ContractManifest = {
    manifest_version: CONTRACT_MANIFEST_VERSION,
    contracts: {
      core: '0.3-candidate',
      portfolio_entry_logic: '0.1',
      clarification_handoff: '0.2.1',
      agent: '0.2',
      skill_01: '0.2',
      skill_02: '0.2',
      skill_03: '0.2',
      skill_04: '0.2',
      harness: '0.2',
      execution_spec: '0.2',
    },
  };

  return contractManifestSchema.parse(manifest);
}

export function hashContractManifest(manifest: ContractManifest): string {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}
