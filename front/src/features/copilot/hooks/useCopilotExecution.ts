import { useEffect, useRef } from 'react';
import type { CopilotClient } from '../api/copilot-client';
import type { ActionExecutionDto } from '../domain/copilot.types';
import { isExecutionTerminal } from '../domain/copilot.selectors';

export function useCopilotExecutionPolling({
  client,
  execution,
  onUpdate,
  enabled,
}: {
  client: CopilotClient;
  execution: ActionExecutionDto | null;
  onUpdate: (execution: ActionExecutionDto) => void;
  enabled: boolean;
}) {
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled || !execution || isExecutionTerminal(execution)) return;
    let cancelled = false;
    attemptsRef.current = 0;

    const poll = async () => {
      if (cancelled || attemptsRef.current >= 8) return;
      attemptsRef.current += 1;
      try {
        const next = await client.getExecution(execution.id);
        if (!cancelled) {
          onUpdate(next);
          if (!isExecutionTerminal(next)) {
            window.setTimeout(poll, Math.min(750 * attemptsRef.current, 3000));
          }
        }
      } catch {
        if (!cancelled && attemptsRef.current < 8) {
          window.setTimeout(poll, Math.min(1000 * attemptsRef.current, 4000));
        }
      }
    };

    const id = window.setTimeout(poll, 750);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [client, enabled, execution, onUpdate]);
}

