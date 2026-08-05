import type { CapabilityDefinition, CapabilityValidationResult } from '../domain/capability.types';
import { CopilotErrors } from '../domain/copilot.errors';
import {
  createStrategicFrontCapabilityPayloadSchema,
  type CreateStrategicFrontCapabilityPayload,
} from '../schemas/copilot.schemas';

export const CREATE_STRATEGIC_FRONT_CAPABILITY_ID = 'CreateStrategicFront';
export const CREATE_STRATEGIC_FRONT_COMMAND_TYPE = 'CreateStrategicFrontCommand';
export const PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION = 'portfolio.strategicFront.create';

export const createStrategicFrontCapability: CapabilityDefinition<CreateStrategicFrontCapabilityPayload> = {
  id: CREATE_STRATEGIC_FRONT_CAPABILITY_ID,
  version: 1,
  ownerPrd: 'PRD-06',
  supportedIntents: ['create_strategic_front'],
  operation: 'create',
  requiredInputs: ['organizationId', 'name', 'createdBy'],
  optionalInputs: [
    'objective',
    'mainKpi',
    'baseline',
    'target',
    'horizon',
    'sponsor',
    'priority',
  ],
  requiredPermissions: [PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION],
  requiresConfirmation: true,
  commandType: CREATE_STRATEGIC_FRONT_COMMAND_TYPE,
  inputSchema: createStrategicFrontCapabilityPayloadSchema,
  resultProjection: [
    'portfolio.home.strategic_map',
    'portfolio.strategic_fronts.detail',
  ],
};

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, CapabilityDefinition>();

  constructor(definitions: CapabilityDefinition[] = []) {
    definitions.forEach((definition) => this.register(definition));
  }

  register(definition: CapabilityDefinition): void {
    if (this.capabilities.has(definition.id)) {
      throw CopilotErrors.duplicateCapability(definition.id);
    }
    this.capabilities.set(definition.id, definition);
  }

  getById(capabilityId: string): CapabilityDefinition {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) {
      throw CopilotErrors.capabilityNotFound(capabilityId);
    }
    return capability;
  }

  findByIntent(intent: string): CapabilityDefinition[] {
    return [...this.capabilities.values()].filter((capability) =>
      capability.supportedIntents.includes(intent),
    );
  }

  assertExists(capabilityId: string): void {
    this.getById(capabilityId);
  }

  validatePayload<T = unknown>(capabilityId: string, payload: unknown): CapabilityValidationResult<T> {
    const capability = this.getById(capabilityId);
    const parsed = capability.inputSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_CAPABILITY_PAYLOAD',
          message: 'Payload invalido para la capability.',
          details: parsed.error.flatten(),
        },
      };
    }
    return { success: true, data: parsed.data as T };
  }
}

export function createDefaultCapabilityRegistry(): CapabilityRegistry {
  return new CapabilityRegistry([createStrategicFrontCapability]);
}
