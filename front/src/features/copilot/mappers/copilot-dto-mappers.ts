import type {
  CreateStrategicFrontPayload,
  ProjectionLinkDto,
  ProposedActionDto,
} from '../domain/copilot.types';

const STRATEGIC_FRONT_FIELDS = [
  'name',
  'objective',
  'mainKpi',
  'baseline',
  'target',
  'horizon',
  'sponsor',
  'priority',
] as const;

export type StrategicFrontEditableField = typeof STRATEGIC_FRONT_FIELDS[number];

export type StrategicFrontEditablePayload = Pick<
  CreateStrategicFrontPayload,
  StrategicFrontEditableField
>;

export function isCreateStrategicFrontAction(action: ProposedActionDto): boolean {
  return action.capabilityId === 'CreateStrategicFront' && action.commandType === 'CreateStrategicFrontCommand';
}

export function getStrategicFrontPayload(action: ProposedActionDto): CreateStrategicFrontPayload {
  return action.proposedPayload as CreateStrategicFrontPayload;
}

export function toEditableStrategicFrontPayload(
  payload: CreateStrategicFrontPayload,
): StrategicFrontEditablePayload {
  return {
    name: payload.name ?? '',
    objective: payload.objective ?? '',
    mainKpi: payload.mainKpi ?? '',
    baseline: payload.baseline ?? '',
    target: payload.target ?? '',
    horizon: payload.horizon ?? '',
    sponsor: payload.sponsor ?? '',
    priority: payload.priority ?? 'Media',
  };
}

export function mergeStrategicFrontPayload(
  base: CreateStrategicFrontPayload,
  edits: StrategicFrontEditablePayload,
): CreateStrategicFrontPayload {
  return {
    organizationId: base.organizationId,
    createdBy: base.createdBy,
    name: edits.name.trim(),
    objective: edits.objective?.trim(),
    mainKpi: edits.mainKpi?.trim(),
    baseline: edits.baseline?.trim(),
    target: edits.target?.trim(),
    horizon: edits.horizon?.trim(),
    sponsor: edits.sponsor?.trim(),
    priority: edits.priority,
  };
}

export function getCreatedStrategicFrontName(action: ProposedActionDto): string {
  return getStrategicFrontPayload(action).name || 'Frente estratégico';
}

export function getProjectionLinks(links: ProjectionLinkDto[]): ProjectionLinkDto[] {
  return links.filter((link) => link.href.trim().length > 0);
}

