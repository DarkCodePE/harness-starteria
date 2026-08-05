import type { CopilotConversationStatus } from './copilot.types';

export function getConversationStatusLabel(status: CopilotConversationStatus): string {
  const labels: Record<CopilotConversationStatus, string> = {
    collecting_context: 'Listo para recibir contexto',
    interpreting: 'Interpretando solicitud',
    asking_clarification: 'Necesita aclaración',
    proposal_ready: 'Propuesta lista',
    awaiting_confirmation: 'Esperando aprobación',
    executing: 'Ejecutando acción',
    completed: 'Completado',
    partially_completed: 'Completado parcialmente',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
  };
  return labels[status];
}

