/**
 * challenge-state-machine.test.ts — ADR-030 (MVP-P1-01).
 *
 * Fija la tabla de transiciones del reto y las tres reglas que ADR-030 decide:
 *   1. `cerrado` es terminal (reabrir es gobierno, no un PATCH).
 *   2. La pausa RECUERDA de donde vino y reanudar vuelve exactamente ahi.
 *   3. Un reto en pausa o cerrado no admite iniciativas nuevas.
 *
 * La aserción raiz es la del agujero que motivo el ADR: `cerrado → draft` era posible
 * porque `updateChallenge` hacia `data: input as any` y obedecia al cliente.
 */
import { describe, it, expect } from 'vitest';
import {
  checkChallengeTransition,
  allowedChallengeTransitions,
  challengeAdmitsInitiatives,
  type ChallengeStatusValue,
} from '../challenge-state-machine';

describe('ADR-030 · maquina de estados del reto', () => {
  describe('el agujero que motivo el ADR', () => {
    it('rechaza cerrado → draft (un curl ya no resucita un reto cerrado)', () => {
      const r = checkChallengeTransition('cerrado', 'draft');
      expect(r.kind).toBe('illegal');
      if (r.kind === 'illegal') expect(r.allowed).toEqual([]);
    });

    it('cerrado es terminal hacia CUALQUIER estado', () => {
      const todos: ChallengeStatusValue[] = [
        'draft', 'listo_para_activar', 'activo_interno', 'publicado',
        'recibiendo_iniciativas', 'con_iniciativas_activas', 'pendiente_de_decision', 'pausado',
      ];
      for (const to of todos) {
        expect(checkChallengeTransition('cerrado', to).kind, `cerrado → ${to}`).toBe('illegal');
      }
    });
  });

  describe('transiciones legales', () => {
    it('acepta el camino feliz draft → listo_para_activar → activo_interno', () => {
      expect(checkChallengeTransition('draft', 'listo_para_activar').kind).toBe('ok');
      expect(checkChallengeTransition('listo_para_activar', 'activo_interno').kind).toBe('ok');
    });

    it('cualquier estado no-terminal puede cerrarse', () => {
      const noTerminales: ChallengeStatusValue[] = [
        'draft', 'listo_para_activar', 'activo_interno', 'publicado',
        'recibiendo_iniciativas', 'con_iniciativas_activas', 'pendiente_de_decision', 'pausado',
      ];
      for (const from of noTerminales) {
        expect(checkChallengeTransition(from, 'cerrado').kind, `${from} → cerrado`).toBe('ok');
      }
    });

    it('rechaza saltos que la tabla no contempla (draft → activo_interno)', () => {
      const r = checkChallengeTransition('draft', 'activo_interno');
      expect(r.kind).toBe('illegal');
      if (r.kind === 'illegal') expect(r.allowed).toEqual(['listo_para_activar', 'cerrado']);
    });

    it('draft no se puede pausar: no hay progreso que pausar todavia', () => {
      expect(checkChallengeTransition('draft', 'pausado').kind).toBe('illegal');
    });
  });

  describe('la pausa recuerda de donde vino', () => {
    it('al pausar graba el estado previo', () => {
      const r = checkChallengeTransition('recibiendo_iniciativas', 'pausado');
      expect(r.kind).toBe('ok');
      if (r.kind === 'ok') expect(r.pausedFromStatus).toBe('recibiendo_iniciativas');
    });

    it('reanudar vuelve al estado previo y limpia la memoria de la pausa', () => {
      const r = checkChallengeTransition('pausado', 'con_iniciativas_activas', 'con_iniciativas_activas');
      expect(r.kind).toBe('ok');
      if (r.kind === 'ok') expect(r.pausedFromStatus).toBeNull();
    });

    it('NO deja reanudar a un estado distinto del que se pauso', () => {
      // Esto es lo que evita que reanudar sea "elige tu estado favorito".
      const r = checkChallengeTransition('pausado', 'publicado', 'activo_interno');
      expect(r.kind).toBe('illegal');
      if (r.kind === 'illegal') expect(r.allowed).toEqual(['cerrado', 'activo_interno']);
    });

    it('sin pausedFromStatus (fila previa al ADR) solo queda cerrar: no se adivina', () => {
      expect(allowedChallengeTransitions('pausado', null)).toEqual(['cerrado']);
      const r = checkChallengeTransition('pausado', 'activo_interno', null);
      expect(r.kind).toBe('illegal');
    });

    it('una transicion normal no toca la memoria de la pausa', () => {
      const r = checkChallengeTransition('activo_interno', 'recibiendo_iniciativas', null);
      expect(r.kind).toBe('ok');
      if (r.kind === 'ok') expect(r.pausedFromStatus).toBeNull();
    });
  });

  describe('idempotencia', () => {
    it('reescribir el mismo estado no es error (doble clic / reintento de red)', () => {
      const r = checkChallengeTransition('activo_interno', 'activo_interno');
      expect(r.kind).toBe('ok');
    });

    it('incluso en cerrado, que es terminal', () => {
      expect(checkChallengeTransition('cerrado', 'cerrado').kind).toBe('ok');
    });

    it('y conserva pausedFromStatus si estaba pausado', () => {
      const r = checkChallengeTransition('pausado', 'pausado', 'publicado');
      expect(r.kind).toBe('ok');
      if (r.kind === 'ok') expect(r.pausedFromStatus).toBe('publicado');
    });
  });

  describe('un reto no-activo no admite iniciativas nuevas (decision 4)', () => {
    it('pausado y cerrado no admiten', () => {
      expect(challengeAdmitsInitiatives('pausado')).toBe(false);
      expect(challengeAdmitsInitiatives('cerrado')).toBe(false);
    });

    it('el resto si admite', () => {
      const admiten: ChallengeStatusValue[] = [
        'draft', 'listo_para_activar', 'activo_interno', 'publicado',
        'recibiendo_iniciativas', 'con_iniciativas_activas', 'pendiente_de_decision',
      ];
      for (const s of admiten) expect(challengeAdmitsInitiatives(s), s).toBe(true);
    });
  });
});
