import { describe, expect, it } from 'vitest';
import { getCopilotRuntimeConfig, isOrganizationAllowed } from '../application/copilot-runtime-config';

describe('Copilot runtime config', () => {
  it('habilita defaults de test para no bloquear pruebas', () => {
    const config = getCopilotRuntimeConfig({ NODE_ENV: 'test' });

    expect(config.enabled).toBe(true);
    expect(config.writeEnabled).toBe(true);
    expect(config.createStrategicFrontEnabled).toBe(true);
    expect(config.assessmentAdapter).toBe('unavailable');
  });

  it('desactiva deterministic en production aunque se configure por error', () => {
    const config = getCopilotRuntimeConfig({
      NODE_ENV: 'production',
      COPILOT_ENABLED: 'true',
      COPILOT_WRITE_ENABLED: 'true',
      COPILOT_CREATE_STRATEGIC_FRONT_ENABLED: 'true',
      COPILOT_ASSESSMENT_ADAPTER: 'deterministic',
    });

    expect(config.assessmentAdapter).toBe('unavailable');
    expect(config.createStrategicFrontEnabled).toBe(false);
  });

  it('aplica allowlist por organizacion', () => {
    const config = getCopilotRuntimeConfig({
      NODE_ENV: 'production',
      COPILOT_ALLOWED_ORGANIZATION_IDS: 'org-a, org-b',
    });

    expect(isOrganizationAllowed(config, 'org-a')).toBe(true);
    expect(isOrganizationAllowed(config, 'org-x')).toBe(false);
  });
});
