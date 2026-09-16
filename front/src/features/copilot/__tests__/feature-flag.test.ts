import { describe, expect, it, vi } from 'vitest';
import { isPortfolioCopilotEnabled } from '../../../app/services/featureFlags';

describe('portfolio copilot feature flag', () => {
  it('permanece apagado por defecto y se enciende por env', () => {
    vi.stubEnv('VITE_PORTFOLIO_COPILOT_ENABLED', '');
    expect(isPortfolioCopilotEnabled()).toBe(false);

    vi.stubEnv('VITE_PORTFOLIO_COPILOT_ENABLED', 'true');
    expect(isPortfolioCopilotEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });
});
