export type PortfolioEntryHarnessProviderConfig = {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature?: number;
  seed?: string | number;
  timeoutMs: number;
};

export function loadPortfolioEntryHarnessProviderConfig(env: NodeJS.ProcessEnv = process.env): PortfolioEntryHarnessProviderConfig {
  const provider = env.PORTFOLIO_ENTRY_HARNESS_PROVIDER;
  const model = env.PORTFOLIO_ENTRY_HARNESS_MODEL;
  const apiKey = env.PORTFOLIO_ENTRY_HARNESS_API_KEY;

  if (!provider) throw new Error('PORTFOLIO_ENTRY_HARNESS_PROVIDER is required for --adapter live.');
  if (!model) throw new Error('PORTFOLIO_ENTRY_HARNESS_MODEL is required for --adapter live.');
  if (!apiKey) throw new Error('PORTFOLIO_ENTRY_HARNESS_API_KEY is required for --adapter live.');

  if (provider !== 'openai_responses' && provider !== 'deepseek_responses') {
    throw new Error('PORTFOLIO_ENTRY_HARNESS_PROVIDER must be openai_responses or deepseek_responses.');
  }

  return {
    provider,
    model,
    apiKey,
    baseUrl: normalizeBaseUrl(env.PORTFOLIO_ENTRY_HARNESS_BASE_URL ?? defaultBaseUrl(provider)),
    temperature: parseOptionalNumber(env.PORTFOLIO_ENTRY_HARNESS_TEMPERATURE),
    seed: parseSeed(env.PORTFOLIO_ENTRY_HARNESS_SEED),
    timeoutMs: parseNumber(env.PORTFOLIO_ENTRY_HARNESS_TIMEOUT_MS, 30_000),
  };
}

export function sanitizeProviderConfig(config: PortfolioEntryHarnessProviderConfig): Omit<PortfolioEntryHarnessProviderConfig, 'apiKey'> & { api_key_configured: boolean } {
  return {
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
    seed: config.seed,
    timeoutMs: config.timeoutMs,
    api_key_configured: Boolean(config.apiKey),
  };
}

function defaultBaseUrl(provider: string): string {
  return provider === 'deepseek_responses'
    ? 'https://api.deepseek.com'
    : 'https://api.openai.com/v1';
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric Portfolio Entry harness config value: ${value}`);
  return parsed;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric Portfolio Entry harness config value: ${value}`);
  return parsed;
}

function parseSeed(value: string | undefined): string | number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}
