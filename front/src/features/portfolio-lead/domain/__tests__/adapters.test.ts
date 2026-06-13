/**
 * adapters.test.ts — issue #100.
 *
 * Pins the backend → domain mapping used to hydrate the portfolio-lead provider from
 * real data: real ids/projectId for deep-linking (#94), real squad for create-from-reto
 * (#96), and safe defaults for the rich fields the UI reads.
 */
import { describe, it, expect } from 'vitest';
import {
  adaptStrategicFront,
  adaptChallenge,
  adaptInitiative,
  toBackendStrategicFront,
  toBackendChallenge,
} from '../adapters';

describe('adaptStrategicFront', () => {
  it('maps columns and derives challengeCount from _count', () => {
    const front = adaptStrategicFront({
      id: 'f1',
      name: 'Operaciones',
      sponsor: 'Ana',
      _count: { challenges: 3 },
      createdAt: '2026-06-01T10:00:00.000Z',
    });
    expect(front.id).toBe('f1');
    expect(front.name).toBe('Operaciones');
    expect(front.challengeCount).toBe(3);
    expect(front.createdAt).toBe('2026-06-01');
    expect(front.initiativeCount).toBe(0);
  });
});

describe('adaptChallenge', () => {
  it('maps type→challengeType, squad, and fills activationInputs', () => {
    const challenge = adaptChallenge({
      id: 'c1',
      title: 'Reducir esperas',
      name: 'Reducir esperas',
      strategicFrontId: 'f1',
      type: 'crecimiento',
      assignedSquad: [{ id: 's1', value: 'a@x.com', role: 'lider' }, { id: 's2', value: 'b@x.com' }],
      _count: { initiativeMetas: 2 },
    });
    expect(challenge.id).toBe('c1');
    expect(challenge.challengeType).toBe('crecimiento');
    expect(challenge.strategicFrontId).toBe('f1');
    expect(challenge.initiativeCount).toBe(2);
    expect(challenge.assignedSquad).toEqual([
      { id: 's1', value: 'a@x.com', role: 'lider' },
      { id: 's2', value: 'b@x.com', role: 'colaborador' },
    ]);
    // computed field the UI reads must be present even though the backend omits it
    expect(challenge.activationInputs).toBeTruthy();
  });
});

describe('adaptInitiative', () => {
  it('maps projectId from the joined project and derives currentStep from status', () => {
    const init = adaptInitiative({
      id: 'meta1',
      challengeId: 'c1',
      strategicFrontId: 'f1',
      status: 'en_step_2',
      mainAlert: 'Falta sponsor',
      project: { id: 'proj-123', name: 'Mi iniciativa', currentStep: 2, owner: { name: 'Ana' } },
    });
    expect(init.projectId).toBe('proj-123'); // #94: enables deep-link
    expect(init.name).toBe('Mi iniciativa');
    expect(init.currentStep).toBe('Step 2');
    expect(init.status).toBe('en_step_2');
    expect(init.mainAlert).toBe('Falta sponsor');
    expect(init.teamOwner).toBe('Ana');
    expect(init.deliverables).toEqual([]); // safe default for missing arrays
    expect(init.requiresSponsor).toBe(false);
  });

  it('falls back to Step 0 when status is non-progression and no project step', () => {
    const init = adaptInitiative({ id: 'm', challengeId: 'c', status: 'draft', project: { id: 'p', name: 'X' } });
    expect(init.currentStep).toBe('Step 0');
    expect(init.projectId).toBe('p');
  });
});

describe('toBackendStrategicFront (write path #104)', () => {
  it('coerces status/priority to the backend-accepted enums and drops front-only fields', () => {
    const out = toBackendStrategicFront({
      name: 'F', strategicObjective: 'obj', sponsor: 'Ana',
      status: 'in_definition', priority: 'Critica',
      threshold: 'x', endDate: '2026-01-01', notes: 'n', // front-only → dropped
    });
    expect(out.status).toBe('draft');   // in_definition → draft
    expect(out.priority).toBe('Alta');  // Critica → Alta (backend has no Critica)
    expect(out.name).toBe('F');
    expect(out).not.toHaveProperty('threshold');
    expect(out).not.toHaveProperty('notes');
  });
});

describe('toBackendChallenge (write path #104)', () => {
  it('sets title from name and coerces type/status to legacy enums', () => {
    const out = toBackendChallenge({
      name: 'Reducir esperas',
      challengeType: 'growth',          // canonical → legacy
      status: 'ready_to_activate',      // canonical → legacy
      whatWeWantToMove: 'algo',
      challengeOwnerStatus: 'confirmado',
      activationInputs: { urgency: 'alta' }, // front-only → dropped
    });
    expect(out.title).toBe('Reducir esperas'); // backend REQUIRES title
    expect(out.name).toBe('Reducir esperas');
    expect(out.type).toBe('crecimiento');
    expect(out.status).toBe('listo_para_activar');
    expect(out.challengeOwnerStatus).toBe('confirmado');
    expect(out).not.toHaveProperty('activationInputs');
  });

  it('omits an activationMode the backend does not support', () => {
    const out = toBackendChallenge({ name: 'X', activationMode: 'equipo_core_encargado' });
    expect(out).not.toHaveProperty('activationMode');
    const ok = toBackendChallenge({ name: 'X', activationMode: 'squad_asignado' });
    expect(ok.activationMode).toBe('squad_asignado');
  });
});
