/**
 * initiative-state-machine.test.ts — ADR-030 (MVP-P1-02), la mitad de la INICIATIVA.
 *
 * Esto es una RECONCILIACION, y los tests van dirigidos a lo que estaba roto:
 *
 *   1. Dos deletreos del mismo estado. `portfolioMetaCompletionUpdate` escribia `cerrada`
 *      mientras `updateDecisionLifecycleProjectionTx` escribia `closed`. Preguntar "¿esta
 *      cerrada?" exigia saber que camino la habia escrito. Ningun test cubria `cerrada`:
 *      por eso el split sobrevivio meses.
 *   2. `paused` mapeado a `bloqueada`. Son conceptos distintos y con consecuencias opuestas:
 *      `bloqueada` SIGUE aceptando escrituras (trabajar en ella es como se desbloquea),
 *      `paused` NO. Una iniciativa pausada por ese camino nunca quedaba en solo lectura.
 */
import { describe, it, expect } from 'vitest';
import {
  canonicalInitiativeStatus,
  initiativeAcceptsStepWrites,
  checkInitiativeTransition,
  isStepStatus,
} from '../initiative-state-machine';

describe('ADR-030 · reconciliacion del vocabulario', () => {
  it('`cerrada` y `closed` son el MISMO estado', () => {
    expect(canonicalInitiativeStatus('cerrada')).toBe('closed');
    expect(canonicalInitiativeStatus('closed')).toBe('closed');
  });

  it('normalizar deja intacto lo que no es alias', () => {
    for (const s of ['en_step_2', 'bloqueada', 'paused', 'lista_para_decision']) {
      expect(canonicalInitiativeStatus(s)).toBe(s);
    }
  });

  it('el backfill es inofensivo: cerrada → closed no es una transicion', () => {
    expect(checkInitiativeTransition('cerrada', 'closed').kind).toBe('ok');
  });
});

describe('ADR-030 · solo lectura', () => {
  it('pausada y cerrada NO aceptan escrituras de step', () => {
    expect(initiativeAcceptsStepWrites('paused')).toBe(false);
    expect(initiativeAcceptsStepWrites('closed')).toBe(false);
  });

  it('y `cerrada` congela igual que `closed` (el alias no abre una puerta trasera)', () => {
    expect(initiativeAcceptsStepWrites('cerrada')).toBe(false);
  });

  it('`bloqueada` SI acepta escrituras: trabajar en ella es como se desbloquea', () => {
    // Este es el assert que distingue los dos conceptos que antes se mapeaban al mismo valor.
    expect(initiativeAcceptsStepWrites('bloqueada')).toBe(true);
  });

  it('el eje progresivo acepta escrituras', () => {
    for (const s of ['en_step_0', 'en_step_1', 'en_step_2', 'en_step_3', 'en_step_4']) {
      expect(initiativeAcceptsStepWrites(s), s).toBe(true);
    }
  });
});

describe('ADR-030 · transiciones de la iniciativa', () => {
  it('closed es terminal, y `cerrada` tambien (es el mismo estado)', () => {
    expect(checkInitiativeTransition('closed', 'en_step_2').kind).toBe('illegal');
    expect(checkInitiativeTransition('cerrada', 'en_step_2').kind).toBe('illegal');
    expect(checkInitiativeTransition('closed', 'paused').kind).toBe('illegal');
  });

  it('desde el eje progresivo se puede entrar a los estados gestionados a mano', () => {
    for (const to of ['bloqueada', 'paused', 'lista_para_decision', 'closed']) {
      expect(checkInitiativeTransition('en_step_2', to).kind, `en_step_2 → ${to}`).toBe('ok');
    }
  });

  it('destrabar y reanudar devuelven al eje progresivo', () => {
    expect(checkInitiativeTransition('bloqueada', 'en_step_3').kind).toBe('ok');
    expect(checkInitiativeTransition('paused', 'en_step_3').kind).toBe('ok');
  });

  it('pero NO se vuelve al eje progresivo desde lista_para_decision sin pasar por otro estado', () => {
    const r = checkInitiativeTransition('lista_para_decision', 'en_step_2');
    expect(r.kind).toBe('illegal');
    if (r.kind === 'illegal') expect(r.allowed).toContain('bloqueada');
  });

  it('una decision aprobada solo puede cerrarse o pausarse', () => {
    expect(checkInitiativeTransition('implementation_approved', 'closed').kind).toBe('ok');
    expect(checkInitiativeTransition('scaling_approved', 'en_step_1').kind).toBe('illegal');
  });

  it('reescribir el mismo estado no es error', () => {
    expect(checkInitiativeTransition('paused', 'paused').kind).toBe('ok');
    expect(checkInitiativeTransition('closed', 'closed').kind).toBe('ok');
  });

  it('isStepStatus distingue el eje derivado del gestionado a mano', () => {
    expect(isStepStatus('en_step_0')).toBe(true);
    expect(isStepStatus('paused')).toBe(false);
  });
});
