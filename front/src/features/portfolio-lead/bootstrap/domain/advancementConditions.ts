import type { AdvancementCondition, AdvancementConditionSeverity } from './types';

export function deriveAdvancementConditionSeverity(params: {
  type: AdvancementCondition['type'];
  missing: boolean;
  affectsMovement?: boolean;
  explicitlyBlocking?: boolean;
}): AdvancementConditionSeverity {
  if (!params.missing) return 'info';
  if (params.explicitlyBlocking || params.affectsMovement) return 'blocking';
  return 'attention';
}
