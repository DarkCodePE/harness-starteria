import { loadPortfolioEntryProviderConfig } from './provider-config';
import { loadResolvedPromptManifest } from '../prompts/prompt-manifest';

export function portfolioEntryLiveHealth(env: NodeJS.ProcessEnv = process.env) {
  const provider = env.PORTFOLIO_ENTRY_PROVIDER?.trim() || env.PORTFOLIO_ENTRY_HARNESS_PROVIDER?.trim() || 'openai_responses';
  const model = env.PORTFOLIO_ENTRY_MODEL?.trim() || env.PORTFOLIO_ENTRY_HARNESS_MODEL?.trim() || 'gpt-5.6-luna';
  const baseUrl = env.PORTFOLIO_ENTRY_BASE_URL?.trim() || env.PORTFOLIO_ENTRY_HARNESS_BASE_URL?.trim()
    || (provider === 'deepseek_responses' ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
  let baseUrlHost = 'invalid';
  try { baseUrlHost = new URL(baseUrl).host; } catch { /* No URL or credentials in diagnostics. */ }
  let ready = false;
  if ((env.PORTFOLIO_ENTRY_RUNTIME_MODE ?? 'live') === 'live') {
    try {
      const config = loadPortfolioEntryProviderConfig(env);
      const endpoint = new URL(config.baseUrl);
      if (endpoint.protocol !== 'https:' && endpoint.hostname !== 'localhost') throw new Error('Invalid provider URL');
      loadResolvedPromptManifest();
      ready = true;
    } catch { /* Health reports readiness without revealing the configuration error. */ }
  }
  return {
    providerConfigured: provider === 'openai_responses' || provider === 'deepseek_responses' ? 'YES' : 'NO',
    model,
    baseUrlHost,
    liveAdapterReady: ready ? 'YES' : 'NO',
  };
}
