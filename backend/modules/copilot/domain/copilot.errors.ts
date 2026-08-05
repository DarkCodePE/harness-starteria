import { AppError } from '../../../shared/errors/AppError';

export const COPILOT_ERROR_CODES = {
  CAPABILITY_NOT_FOUND: 'CAPABILITY_NOT_FOUND',
  DUPLICATE_CAPABILITY: 'DUPLICATE_CAPABILITY',
  INVALID_CAPABILITY_PAYLOAD: 'INVALID_CAPABILITY_PAYLOAD',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  ACTION_PLAN_NOT_FOUND: 'ACTION_PLAN_NOT_FOUND',
  PROPOSED_ACTION_NOT_FOUND: 'PROPOSED_ACTION_NOT_FOUND',
  ACTION_EXECUTION_NOT_FOUND: 'ACTION_EXECUTION_NOT_FOUND',
  STALE_ACTION_VERSION: 'STALE_ACTION_VERSION',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  ORGANIZATION_ACCESS_DENIED: 'ORGANIZATION_ACCESS_DENIED',
  ACTION_NOT_APPROVED: 'ACTION_NOT_APPROVED',
  ACTION_ALREADY_COMPLETED: 'ACTION_ALREADY_COMPLETED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  EXECUTION_IN_PROGRESS: 'EXECUTION_IN_PROGRESS',
  DOMAIN_VALIDATION_FAILED: 'DOMAIN_VALIDATION_FAILED',
  COMMAND_EXECUTION_FAILED: 'COMMAND_EXECUTION_FAILED',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
  PARTIAL_EXECUTION: 'PARTIAL_EXECUTION',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  ADAPTER_NOT_AVAILABLE: 'ADAPTER_NOT_AVAILABLE',
  EMPTY_MESSAGE: 'EMPTY_MESSAGE',
  ASSESSMENT_NOT_EVALUABLE: 'ASSESSMENT_NOT_EVALUABLE',
  COPILOT_DISABLED: 'COPILOT_DISABLED',
  COPILOT_WRITE_DISABLED: 'COPILOT_WRITE_DISABLED',
  COPILOT_CAPABILITY_DISABLED: 'COPILOT_CAPABILITY_DISABLED',
  COPILOT_ORGANIZATION_NOT_ALLOWLISTED: 'COPILOT_ORGANIZATION_NOT_ALLOWLISTED',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
} as const;

export type CopilotErrorCode = (typeof COPILOT_ERROR_CODES)[keyof typeof COPILOT_ERROR_CODES];

export const CopilotErrors = {
  capabilityNotFound(capabilityId: string): AppError {
    return AppError.notFound('Capability', COPILOT_ERROR_CODES.CAPABILITY_NOT_FOUND, {
      hint: `Capability no registrada: ${capabilityId}.`,
    });
  },

  duplicateCapability(capabilityId: string): AppError {
    return AppError.conflict(
      `Capability duplicada: ${capabilityId}.`,
      COPILOT_ERROR_CODES.DUPLICATE_CAPABILITY,
    );
  },

  invalidCapabilityPayload(message = 'Payload invalido para la capability.'): AppError {
    return AppError.badRequest(message, COPILOT_ERROR_CODES.INVALID_CAPABILITY_PAYLOAD);
  },

  conversationNotFound(conversationId: string): AppError {
    return AppError.notFound('Conversacion Copilot', COPILOT_ERROR_CODES.CONVERSATION_NOT_FOUND, {
      hint: `No existe una conversacion accesible con id ${conversationId}.`,
    });
  },

  actionPlanNotFound(actionPlanId: string): AppError {
    return AppError.notFound('Action Plan', COPILOT_ERROR_CODES.ACTION_PLAN_NOT_FOUND, {
      hint: `No existe un Action Plan accesible con id ${actionPlanId}.`,
    });
  },

  proposedActionNotFound(proposedActionId: string): AppError {
    return AppError.notFound('ProposedAction', COPILOT_ERROR_CODES.PROPOSED_ACTION_NOT_FOUND, {
      hint: `No existe una ProposedAction accesible con id ${proposedActionId}.`,
    });
  },

  actionExecutionNotFound(actionExecutionId: string): AppError {
    return AppError.notFound('ActionExecution', COPILOT_ERROR_CODES.ACTION_EXECUTION_NOT_FOUND, {
      hint: `No existe una ActionExecution accesible con id ${actionExecutionId}.`,
    });
  },

  staleActionVersion(expectedVersion: number, currentVersion: number): AppError {
    return AppError.conflict(
      `La accion cambio de version. Esperada ${expectedVersion}, actual ${currentVersion}.`,
      COPILOT_ERROR_CODES.STALE_ACTION_VERSION,
      { hint: 'Recarga el plan antes de editar nuevamente.' },
    );
  },

  idempotencyConflict(idempotencyKey: string): AppError {
    void idempotencyKey;
    return AppError.conflict(
      'La idempotencyKey ya fue utilizada para otra ejecucion.',
      COPILOT_ERROR_CODES.IDEMPOTENCY_CONFLICT,
    );
  },

  organizationAccessDenied(organizationId: string, reason: string): AppError {
    return AppError.forbidden(
      `No tienes acceso suficiente a la organizacion ${organizationId}: ${reason}.`,
      COPILOT_ERROR_CODES.ORGANIZATION_ACCESS_DENIED,
      { hint: 'Usa una organizacion a la que pertenezcas o solicita acceso.' },
    );
  },

  actionNotApproved(actionId: string): AppError {
    return AppError.conflict(
      `La accion ${actionId} no tiene aprobacion vigente.`,
      COPILOT_ERROR_CODES.ACTION_NOT_APPROVED,
      { hint: 'Aprueba la accion antes de ejecutarla.' },
    );
  },

  actionAlreadyCompleted(actionId: string): AppError {
    return AppError.conflict(
      `La accion ${actionId} ya fue completada.`,
      COPILOT_ERROR_CODES.ACTION_ALREADY_COMPLETED,
      { hint: 'Consulta la ejecucion existente en lugar de ejecutar de nuevo.' },
    );
  },

  permissionDenied(permission: string): AppError {
    return AppError.forbidden(
      `No tienes el permiso requerido: ${permission}.`,
      COPILOT_ERROR_CODES.PERMISSION_DENIED,
      { hint: 'Solicita que un usuario autorizado apruebe o ejecute esta accion.' },
    );
  },

  executionInProgress(idempotencyKey: string): AppError {
    void idempotencyKey;
    return AppError.conflict(
      'La ejecucion ya esta en curso.',
      COPILOT_ERROR_CODES.EXECUTION_IN_PROGRESS,
      { hint: 'Espera el resultado de la ejecucion existente.' },
    );
  },

  domainValidationFailed(message = 'Portfolio rechazo el comando.'): AppError {
    return AppError.badRequest(message, COPILOT_ERROR_CODES.DOMAIN_VALIDATION_FAILED);
  },

  commandExecutionFailed(message = 'No se pudo ejecutar el comando de dominio.'): AppError {
    return new AppError(500, message, COPILOT_ERROR_CODES.COMMAND_EXECUTION_FAILED, true);
  },

  persistenceFailed(message = 'No se pudo persistir el estado de ejecucion.'): AppError {
    return new AppError(500, message, COPILOT_ERROR_CODES.PERSISTENCE_FAILED, true);
  },

  partialExecution(message = 'La accion quedo parcialmente ejecutada.'): AppError {
    return new AppError(500, message, COPILOT_ERROR_CODES.PARTIAL_EXECUTION, true);
  },

  idempotencyKeyRequired(): AppError {
    return AppError.badRequest(
      'Idempotency-Key es requerido para ejecutar acciones.',
      COPILOT_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED,
    );
  },

  adapterNotAvailable(): AppError {
    return new AppError(
      503,
      'El adapter de assessment Copilot no esta disponible en este entorno.',
      COPILOT_ERROR_CODES.ADAPTER_NOT_AVAILABLE,
      true,
    );
  },

  emptyMessage(): AppError {
    return AppError.badRequest('El mensaje no puede estar vacio.', COPILOT_ERROR_CODES.EMPTY_MESSAGE);
  },

  assessmentNotEvaluable(): AppError {
    return new AppError(
      422,
      'El mensaje no se pudo evaluar para una accion Copilot soportada.',
      COPILOT_ERROR_CODES.ASSESSMENT_NOT_EVALUABLE,
      true,
    );
  },

  copilotDisabled(): AppError {
    return AppError.forbidden(
      'Copilot no esta habilitado en este entorno.',
      COPILOT_ERROR_CODES.COPILOT_DISABLED,
      { hint: 'La funcionalidad esta desactivada por configuracion.' },
    );
  },

  copilotWriteDisabled(): AppError {
    return AppError.forbidden(
      'Las escrituras de Copilot estan deshabilitadas temporalmente.',
      COPILOT_ERROR_CODES.COPILOT_WRITE_DISABLED,
      { hint: 'Puedes consultar resultados previos, pero no crear ni ejecutar nuevas acciones.' },
    );
  },

  copilotCapabilityDisabled(capabilityId: string): AppError {
    return AppError.forbidden(
      `La capability ${capabilityId} esta deshabilitada temporalmente.`,
      COPILOT_ERROR_CODES.COPILOT_CAPABILITY_DISABLED,
      { hint: 'La propuesta permanece visible; intenta mas tarde o solicita soporte.' },
    );
  },

  copilotOrganizationNotAllowlisted(): AppError {
    return AppError.forbidden(
      'Copilot no esta habilitado para esta organizacion.',
      COPILOT_ERROR_CODES.COPILOT_ORGANIZATION_NOT_ALLOWLISTED,
      { hint: 'Solicita habilitacion para el piloto controlado.' },
    );
  },

  manualReviewRequired(message = 'La ejecucion requiere revision manual antes de reintentar.'): AppError {
    return AppError.conflict(message, COPILOT_ERROR_CODES.MANUAL_REVIEW_REQUIRED, {
      hint: 'No se reejecutara automaticamente para evitar duplicados.',
    });
  },
};
