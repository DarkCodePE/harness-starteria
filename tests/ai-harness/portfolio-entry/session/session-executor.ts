import { DeterministicSessionAdapter } from '../agent/deterministic-session-adapter';
import type { PortfolioEntryAgentAdapterV2 } from '../agent/portfolio-entry-agent-adapter-v0.2';
import type { MultiTurnFixtureV2 } from '../schemas/session-fixture.schema';
import { PortfolioEntrySessionController } from './portfolio-entry-session-controller';
import { respondToQuestions, createScriptedResponderState } from './scripted-user-responder';
import { SESSION_SAFETY_LIMITS } from './session-safety-limits';
import { createInitialSessionContext, type SessionExecutionResult } from './session-types';

type ExecuteSessionOptions = {
  runId?: string;
  candidateId?: string;
  adapter?: PortfolioEntryAgentAdapterV2;
  safetyLimits?: Partial<typeof SESSION_SAFETY_LIMITS>;
};

export async function executePortfolioEntrySession(
  fixture: MultiTurnFixtureV2,
  options: ExecuteSessionOptions = {},
): Promise<SessionExecutionResult> {
  const runId = options.runId ?? createSessionRunId();
  const candidateId = options.candidateId ?? 'portfolio-entry-deterministic-baseline-v0.1-session-wrapper';
  const controller = new PortfolioEntrySessionController(
    options.adapter ?? new DeterministicSessionAdapter(),
    {
      runId,
      candidateId,
      safetyLimits: options.safetyLimits,
    },
  );
  const responderState = createScriptedResponderState();

  return controller.execute({
    caseId: fixture.case_id,
    runId,
    candidateId,
    initialUserInput: fixture.initial_user_message,
    initialContext: createInitialSessionContext(fixture.session),
    guidedExplorationChoice: fixture.session.exploration_policy === 'accept_if_offered' ? 'accept' : 'reject',
    followUpResponder: (questions) => respondToQuestions(questions, fixture.response_rules, responderState),
  });
}

function createSessionRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
