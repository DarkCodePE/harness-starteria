/**
 * ADR-030 — Estados de la INICIATIVA. Reconciliacion, no construccion desde cero.
 *
 * ## Por que esto no aplica el ADR literalmente
 *
 * ADR-030 (2026-08-22) decia "añadir `pausada` a `InitiativePortfolioStatus` en forma
 * legacy". Cuando se fue a implementar, el trabajo de adaptive-core mergeado DESPUES ya
 * habia cambiado el terreno:
 *
 *  - `updateDecisionLifecycleProjectionTx` ya transiciona la iniciativa dentro de la
 *    transaccion de la decision, escribiendo `paused` / `closed` — CANONICOS.
 *  - `portfolioMetaCompletionUpdate` escribe `cerrada` — LEGACY — para el MISMO concepto.
 *  - El zod de `upsertInitiativeMeta` no aceptaba ninguno de los dos canonicos, asi que la
 *    API del portafolio no sabia nombrar el estado en que la decision dejaba la iniciativa.
 *
 * Añadir `pausada` habria creado una TERCERA forma. La reconciliacion es al reves:
 *
 *  - Gana el CANONICO donde existe: `paused` y `closed`. `paused` ni siquiera tenia gemelo
 *    legacy, asi que inventarlo era puro coste.
 *  - `cerrada` queda como ALIAS DE LECTURA de `closed`: misma cosa, dos deletreos. Se lee,
 *    no se escribe. El backfill (`front/scripts/backfill-initiative-status.ts`) los unifica.
 *  - `bloqueada` SE QUEDA y no se toca: "bloqueada" no es "cerrada" — es un impedimento
 *    reversible, no un final. No tiene gemelo canonico porque es otro concepto.
 *
 * ## Que gobierna
 *
 * El eje `en_step_*` lo sigue derivando `initiative-progress.ts` desde el progreso real de
 * los steps; esta maquina NO se mete ahi. Gobierna solo las ENTRADAS y SALIDAS de los
 * estados gestionados a mano, que es donde el cliente podia escribir lo que quisiera.
 */

export type InitiativeStatusValue =
  | 'en_step_0'
  | 'en_step_1'
  | 'en_step_2'
  | 'en_step_3'
  | 'en_step_4'
  | 'bloqueada'
  | 'esperando_revision'
  | 'lista_para_decision'
  | 'implementation_approved'
  | 'scaling_approved'
  | 'paused'
  | 'closed'
  /** @deprecated alias de lectura de `closed`. No escribir: lo unifica el backfill. */
  | 'cerrada';

/** Los estados del eje progresivo, que deriva el progreso real de los steps. */
const STEP_STATUSES: readonly InitiativeStatusValue[] = [
  'en_step_0', 'en_step_1', 'en_step_2', 'en_step_3', 'en_step_4',
];

export function isStepStatus(status: InitiativeStatusValue): boolean {
  return STEP_STATUSES.includes(status);
}

/**
 * Normaliza el deletreo legacy al canonico. Es la funcion que hace posible la lectura dual:
 * el resto del sistema razona con UN solo vocabulario aunque la fila traiga el viejo.
 */
export function canonicalInitiativeStatus(status: string): InitiativeStatusValue {
  return (status === 'cerrada' ? 'closed' : status) as InitiativeStatusValue;
}

/**
 * Estados en los que la iniciativa es de SOLO LECTURA: no admite escrituras de step.
 *
 * `bloqueada` NO esta aqui a proposito: una iniciativa bloqueada sigue siendo trabajable
 * (de hecho, trabajar en ella es como se desbloquea). Lo que congela es pausar o cerrar.
 */
const READ_ONLY_STATUSES: readonly InitiativeStatusValue[] = ['paused', 'closed'];

export function initiativeAcceptsStepWrites(status: string): boolean {
  return !READ_ONLY_STATUSES.includes(canonicalInitiativeStatus(status));
}

/**
 * Transiciones de los estados gestionados a mano (ADR-030).
 *
 * Desde cualquier `en_step_*` se puede bloquear, pausar, mandar a decision o cerrar.
 * Volver al eje progresivo se permite desde `bloqueada` y `paused`: al destrabar o
 * reanudar, el step al que se vuelve lo dicta el progreso real, no esta tabla — por eso
 * el destino se expresa como "cualquier `en_step_*`" y no como un step concreto.
 */
const MANUAL_TRANSITIONS: Record<string, readonly InitiativeStatusValue[]> = {
  bloqueada: ['esperando_revision', 'lista_para_decision', 'paused', 'closed'],
  esperando_revision: ['bloqueada', 'lista_para_decision', 'paused', 'closed'],
  lista_para_decision: ['implementation_approved', 'scaling_approved', 'bloqueada', 'paused', 'closed'],
  implementation_approved: ['closed', 'paused'],
  scaling_approved: ['closed', 'paused'],
  paused: ['closed'],
  closed: [],
};

export type InitiativeTransitionCheck =
  | { kind: 'ok' }
  | { kind: 'illegal'; reason: string; allowed: readonly InitiativeStatusValue[] };

/**
 * Discriminante de string por la misma razon que en la maquina del reto: este paquete
 * compila con `strictNullChecks: false` y ahi TypeScript no estrecha uniones discriminadas
 * por un booleano literal.
 */
export function checkInitiativeTransition(from: string, to: string): InitiativeTransitionCheck {
  const f = canonicalInitiativeStatus(from);
  const t = canonicalInitiativeStatus(to);

  // Idempotencia: reescribir el mismo estado no es una transicion. `cerrada → closed`
  // cae aqui tambien, que es justo lo que hace inofensivo el backfill.
  if (f === t) return { kind: 'ok' };

  // `closed` es terminal, igual que en el reto: reabrir es gobierno, no un PATCH.
  if (f === 'closed') {
    return {
      kind: 'illegal',
      reason: 'Una iniciativa cerrada es terminal: para retomarla se abre una nueva.',
      allowed: [],
    };
  }

  // Volver al eje progresivo: legal desde bloqueada o paused. El step concreto lo decide
  // `initiative-progress.ts` desde el progreso real, no el cliente.
  if (isStepStatus(t)) {
    if (f === 'bloqueada' || f === 'paused' || isStepStatus(f)) return { kind: 'ok' };
    return {
      kind: 'illegal',
      reason: `Una iniciativa en «${f}» no vuelve al avance por steps sin destrabarse o reanudarse antes.`,
      allowed: MANUAL_TRANSITIONS[f] ?? [],
    };
  }

  // Desde el eje progresivo se puede entrar a cualquier estado gestionado a mano.
  if (isStepStatus(f)) return { kind: 'ok' };

  const allowed = MANUAL_TRANSITIONS[f] ?? [];
  if (!allowed.includes(t)) {
    return { kind: 'illegal', reason: `Una iniciativa en «${f}» no puede pasar a «${t}».`, allowed };
  }
  return { kind: 'ok' };
}
