export const PUBLIC_DRAFT_EXPIRATION_HOURS = 24;

export const PUBLIC_START_RULES = {
  publicModeDoesNotCreateProject:
    'El modo publico solo crea un PublicDraft temporal. No crea un Project real.',
  publicDraftExpires:
    'El PublicDraft expira y debe descartarse si supera su ventana de vigencia.',
  registrationRequired:
    'El usuario debe registrarse o iniciar sesion para guardar y continuar.',
  aiSuggestsUserConfirms:
    'La IA puede sugerir estructura, riesgos y siguientes pasos, pero el usuario confirma el contenido.',
  convertedProposalStartsUnapproved:
    'Una propuesta convertida nunca inicia aprobada. Debe continuar en Step 0 como borrador o trabajo en progreso.',
  forbiddenCopyGenerateInitiative:
    'No usar el copy "Generar iniciativa". Usar acciones de borrador o propuesta.',
} as const;

export const FORBIDDEN_PUBLIC_START_COPY = ['Generar iniciativa'] as const;

export function assertAllowedPublicStartCopy(label: string): void {
  if ((FORBIDDEN_PUBLIC_START_COPY as readonly string[]).includes(label)) {
    throw new Error(PUBLIC_START_RULES.forbiddenCopyGenerateInitiative);
  }
}
