import { CopilotErrors } from '../domain/copilot.errors';
import { CREATE_STRATEGIC_FRONT_CAPABILITY_ID } from './capability-registry';
import {
  getCopilotRuntimeConfig,
  isOrganizationAllowed,
  type CopilotRuntimeConfig,
} from './copilot-runtime-config';

export class CopilotFeatureGuard {
  constructor(private readonly readConfig: () => CopilotRuntimeConfig = getCopilotRuntimeConfig) {}

  assertReadAllowed(): void {
    const config = this.readConfig();
    if (!config.enabled) {
      throw CopilotErrors.copilotDisabled();
    }
  }

  assertWriteAllowed(organizationId: string): void {
    const config = this.readConfig();
    if (!config.enabled) {
      throw CopilotErrors.copilotDisabled();
    }
    if (!config.writeEnabled) {
      throw CopilotErrors.copilotWriteDisabled();
    }
    if (!isOrganizationAllowed(config, organizationId)) {
      throw CopilotErrors.copilotOrganizationNotAllowlisted();
    }
  }

  assertCreateStrategicFrontAllowed(organizationId: string): void {
    this.assertWriteAllowed(organizationId);
    const config = this.readConfig();
    if (!config.createStrategicFrontEnabled) {
      throw CopilotErrors.copilotCapabilityDisabled(CREATE_STRATEGIC_FRONT_CAPABILITY_ID);
    }
  }
}
