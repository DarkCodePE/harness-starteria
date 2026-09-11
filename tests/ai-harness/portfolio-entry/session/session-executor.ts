import { DeterministicSessionAdapter } from '../agent/deterministic-session-adapter';
import type { PortfolioEntryAgentAdapterV2 } from '../agent/portfolio-entry-agent-adapter-v0.2';
import { PortfolioEntrySessionController } from './portfolio-entry-session-controller';
import { SESSION_SAFETY_LIMITS } from './session-safety-limits';
import type { PortfolioEntrySessionFixture, SessionExecutionResult } from './session-types';

type ExecuteSessionOptions = {
  runId?: string;
  candidateId?: string;
  adapter?: PortfolioEntryAgentAdapterV2;
  safetyLimits?: Partial<typeof SESSION_SAFETY_LIMITS>;
};

export async function executePortfolioEntrySession(
  fixture: PortfolioEntrySessionFixture,
  options: ExecuteSessionOptions = {},
): Promise<SessionExecutionResult> {
  const controller = new PortfolioEntrySessionController(
    options.adapter ?? new DeterministicSessionAdapter(),
    {
      runId: options.runId ?? createSessionRunId(),
      candidateId: options.candidateId ?? 'portfolio-entry-deterministic-baseline-v0.1-session-wrapper',
      safetyLimits: options.safetyLimits,
    },
  );
  return controller.execute(fixture);
}

function createSessionRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
