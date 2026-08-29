/**
 * ADR-030 — Maquina de estados del RETO. La transicion la decide el SERVIDOR.
 *
 * Antes de esto `PortfolioService.updateChallenge` hacia `data: input as any`: aceptaba
 * cualquier `status` que pasara el enum de zod, viniera de donde viniera. Quien decidia
 * la transicion era el CLIENTE — el provider del front calculaba el siguiente estado y el
 * servidor obedecia. Una pestaña vieja, un doble clic o un `curl` podian llevar un reto de
 * `cerrado` a `draft` sin que nada se quejara. Es el mismo error que ADR-029 erradico en
 * autorizacion (decidir en el cliente lo que el servidor no comprueba), aplicado al ciclo
 * de vida.
 *
 * Vocabulario: los valores son los LEGACY (español) porque son los que viven en Postgres
 * (`enum ChallengeStatus` en schema.prisma). Migrar a canonico es deuda anotada en ADR-030
 * decision 5, fuera del alcance de MVP-P1-01.
 */

/** Los estados del reto, en la forma que persiste Postgres. */
export type ChallengeStatusValue =
  | 'draft'
  | 'listo_para_activar'
  | 'activo_interno'
  | 'publicado'
  | 'recibiendo_iniciativas'
  | 'con_iniciativas_activas'
  | 'pendiente_de_decision'
  | 'pausado'
  | 'cerrado';

/**
 * Transiciones legales, tal como las fija ADR-030.
 *
 * `pausado` es un caso aparte y NO se enumera aqui: su unico destino ademas de `cerrado`
 * es el estado del que vino (`pausedFromStatus`), que es un dato de la fila, no de la tabla.
 * Lo resuelve `assertChallengeTransition`.
 *
 * `cerrado` es terminal A PROPOSITO: reabrir un reto cerrado es una decision de gobierno,
 * no un PATCH. Si hace falta, se abre un reto nuevo que referencie al anterior.
 */
const CHALLENGE_TRANSITIONS: Record<ChallengeStatusValue, readonly ChallengeStatusValue[]> = {
  draft: ['listo_para_activar', 'cerrado'],
  listo_para_activar: ['activo_interno', 'publicado', 'recibiendo_iniciativas', 'pausado', 'cerrado'],
  activo_interno: ['recibiendo_iniciativas', 'con_iniciativas_activas', 'pausado', 'cerrado'],
  publicado: ['recibiendo_iniciativas', 'pausado', 'cerrado'],
  recibiendo_iniciativas: ['con_iniciativas_activas', 'pendiente_de_decision', 'pausado', 'cerrado'],
  con_iniciativas_activas: ['pendiente_de_decision', 'pausado', 'cerrado'],
  pendiente_de_decision: ['con_iniciativas_activas', 'pausado', 'cerrado'],
  // Resuelto dinamicamente contra `pausedFromStatus`; `cerrado` siempre disponible.
  pausado: ['cerrado'],
  cerrado: [],
};

/** Estados en los que el reto no acepta iniciativas nuevas (ADR-030 decision 4). */
const NON_ADMITTING_STATUSES: readonly ChallengeStatusValue[] = ['pausado', 'cerrado'];

export function challengeAdmitsInitiatives(status: ChallengeStatusValue): boolean {
  return !NON_ADMITTING_STATUSES.includes(status);
}

/**
 * Destinos legales desde `from`. Para `pausado` incluye el estado previo, que es el que
 * hace que reanudar devuelva al usuario donde estaba en vez de a un default inventado.
 */
export function allowedChallengeTransitions(
  from: ChallengeStatusValue,
  pausedFromStatus?: ChallengeStatusValue | null,
): readonly ChallengeStatusValue[] {
  const base = CHALLENGE_TRANSITIONS[from] ?? [];
  if (from !== 'pausado') return base;
  // Reanudar: el unico destino de vuelta es de donde vino. Si la fila no lo tiene
  // (pausada antes de ADR-030, o dato perdido), no se adivina: solo queda cerrar.
  return pausedFromStatus ? [...base, pausedFromStatus] : base;
}

/**
 * Discriminante de STRING, no booleano, a proposito: este paquete compila con
 * `strictNullChecks: false` (tsconfig.backend.json) y en ese modo TypeScript no estrecha
 * una union discriminada por un booleano literal — `if (!check.ok)` dejaria `check` como
 * la union entera y `check.reason` no compilaria. Un literal de string si estrecha.
 */
export type ChallengeTransitionCheck =
  | { kind: 'ok'; pausedFromStatus: ChallengeStatusValue | null }
  | { kind: 'illegal'; reason: string; allowed: readonly ChallengeStatusValue[] };

/**
 * Decide si `from → to` es legal y, de paso, que valor debe tomar `pausedFromStatus`:
 *
 *  - al pausar   → se graba el estado del que se viene (para poder volver)
 *  - al reanudar → se limpia (ya no hay pausa que recordar)
 *  - en el resto → se deja intacto
 *
 * Devolver el valor aqui, en vez de calcularlo en el service, mantiene junta la regla:
 * quien conoce la transicion es quien sabe que hacer con la memoria de la pausa.
 */
export function checkChallengeTransition(
  from: ChallengeStatusValue,
  to: ChallengeStatusValue,
  pausedFromStatus?: ChallengeStatusValue | null,
): ChallengeTransitionCheck {
  // Idempotencia: reescribir el mismo estado no es una transicion, y rechazarlo con 409
  // convertiria un doble clic o un reintento de red en un error visible sin que nada
  // este mal. No toca `pausedFromStatus`.
  if (from === to) return { kind: 'ok', pausedFromStatus: pausedFromStatus ?? null };

  const allowed = allowedChallengeTransitions(from, pausedFromStatus);
  if (!allowed.includes(to)) {
    const reason =
      from === 'cerrado'
        ? 'Un reto cerrado es terminal: para retomarlo se abre uno nuevo que lo referencie.'
        : from === 'pausado' && !pausedFromStatus
          ? 'Este reto esta en pausa y no registra desde que estado se pauso, asi que solo puede cerrarse.'
          : `Un reto en «${from}» no puede pasar a «${to}».`;
    return { kind: 'illegal', reason, allowed };
  }

  if (to === 'pausado') return { kind: 'ok', pausedFromStatus: from };
  if (from === 'pausado') return { kind: 'ok', pausedFromStatus: null };
  return { kind: 'ok', pausedFromStatus: pausedFromStatus ?? null };
}
