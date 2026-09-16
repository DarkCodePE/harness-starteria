import React from 'react';
import type { CopilotClient } from '../api/copilot-client';
import { useCopilotConversation } from '../hooks/useCopilotConversation';
import { CopilotComposer } from './CopilotComposer';
import { CopilotConversation } from './CopilotConversation';
import { CopilotStatusIndicator } from './CopilotStatusIndicator';
import { IntentAssessmentCard } from './IntentAssessmentCard';
import { ClarificationCard } from './ClarificationCard';
import { ActionPlanCard } from './ActionPlanCard';
import { ExecutionStatusCard } from './ExecutionStatusCard';
import { ExecutionResultCard } from './ExecutionResultCard';

export function PortfolioCopilotShell({
  client,
  onPortfolioRefresh,
}: {
  client?: CopilotClient;
  onPortfolioRefresh?: () => Promise<void> | void;
}) {
  const copilot = useCopilotConversation({ client, onPortfolioRefresh });
  const busy = copilot.isLoading || copilot.isSending || copilot.isMutating;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6" aria-label="Portfolio Copilot">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>PORTFOLIO COPILOT</p>
          <h2 className="mt-1 text-2xl text-slate-950 md:text-3xl" style={{ fontWeight: 700 }}>
            ¿Qué necesitas registrar, ordenar, priorizar, revisar o decidir hoy?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Starteria preparará una propuesta para revisar y aprobar antes de modificar el portafolio.
          </p>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
            Version piloto: no ingreses datos sensibles, personales o contractuales no autorizados. Revisa y edita la propuesta antes de aprobar; el Copiloto no ejecuta cambios por su cuenta.
          </div>
        </div>
        {copilot.conversation && <CopilotStatusIndicator status={copilot.conversation.status} />}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <CopilotConversation messages={copilot.messages} />
          <CopilotComposer disabled={busy} onSend={copilot.sendMessage} />
          {copilot.isSending && <p role="status" className="text-sm text-slate-500">Interpretando solicitud...</p>}
          {copilot.error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{copilot.error}</p>}
        </div>

        <div className="space-y-4">
          <IntentAssessmentCard assessment={copilot.assessment} />
          <ClarificationCard missingInformation={copilot.assessment?.missingInformation ?? []} />
          <ActionPlanCard
            plan={copilot.actionPlan}
            disabled={busy}
            activeExecution={copilot.activeExecution}
            onSaveAction={copilot.updateAction}
            onApproveAction={copilot.approveAction}
            onRejectAction={copilot.rejectAction}
            onExecuteAction={copilot.executeAction}
          />
          <ExecutionStatusCard execution={copilot.activeExecution} />
          <ExecutionResultCard
            action={copilot.primaryAction}
            execution={copilot.activeExecution}
            refreshWarning={copilot.pendingRefreshWarning}
          />
        </div>
      </div>
    </section>
  );
}
