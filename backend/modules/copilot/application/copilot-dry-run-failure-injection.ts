import { AppError } from '../../../shared/errors/AppError';
import { CopilotErrors } from '../domain/copilot.errors';

const allowedEnvironments = new Set(['test', 'development']);

function assertDryRunInjectionAllowed(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV === 'production') {
    throw new AppError(
      500,
      'Copilot dry-run failure injection is not allowed in production.',
      'DRY_RUN_FAILURE_INJECTION_FORBIDDEN',
      false,
    );
  }
  if (!allowedEnvironments.has(env.NODE_ENV ?? 'development')) {
    throw new AppError(
      500,
      'Copilot dry-run failure injection requires test or development NODE_ENV.',
      'DRY_RUN_FAILURE_INJECTION_FORBIDDEN',
      false,
    );
  }
  if (env.COPILOT_DRY_RUN_FAILURE_INJECTION_ENABLED !== 'true') {
    throw new AppError(
      500,
      'Copilot dry-run failure injection requires COPILOT_DRY_RUN_FAILURE_INJECTION_ENABLED=true.',
      'DRY_RUN_FAILURE_INJECTION_FORBIDDEN',
      false,
    );
  }
}

export function shouldFailPortfolioCreateBeforeCreate(env: NodeJS.ProcessEnv = process.env): boolean {
  const mode = env.COPILOT_DRY_RUN_PORTFOLIO_FAILURE_MODE;
  if (!mode) return false;
  assertDryRunInjectionAllowed(env);
  if (mode !== 'before_create') {
    throw new AppError(
      500,
      `Unsupported Copilot dry-run portfolio failure mode: ${mode}.`,
      'DRY_RUN_FAILURE_INJECTION_UNSUPPORTED',
      false,
    );
  }
  return true;
}

export function shouldFailStrategicFrontProjectionRead(env: NodeJS.ProcessEnv = process.env): boolean {
  const mode = env.COPILOT_DRY_RUN_PROJECTION_FAILURE_MODE;
  if (!mode) return false;
  assertDryRunInjectionAllowed(env);
  if (mode !== 'strategic_fronts_read') {
    throw new AppError(
      500,
      `Unsupported Copilot dry-run projection failure mode: ${mode}.`,
      'DRY_RUN_FAILURE_INJECTION_UNSUPPORTED',
      false,
    );
  }
  return true;
}

export function dryRunPortfolioCreateFailure(): AppError {
  return CopilotErrors.commandExecutionFailed(
    'Dry run: PortfolioService fallo antes de crear el frente estrategico.',
  );
}

export function dryRunProjectionReadFailure(): AppError {
  return new AppError(
    503,
    'Dry run: la lectura de frentes estrategicos no esta disponible temporalmente.',
    'DRY_RUN_PROJECTION_READ_FAILED',
    true,
  );
}
