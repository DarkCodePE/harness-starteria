import { describe, expect, it } from 'vitest';
import {
  hasCheckpointAnswer,
  mergeCheckpointResponses,
  projectCheckpointResponsesToFields,
} from '../checkpointResponses';

describe('hasCheckpointAnswer', () => {
  it('trata como vacio el string en blanco, null y undefined', () => {
    expect(hasCheckpointAnswer('')).toBe(false);
    expect(hasCheckpointAnswer('   ')).toBe(false);
    expect(hasCheckpointAnswer(null)).toBe(false);
    expect(hasCheckpointAnswer(undefined)).toBe(false);
  });

  it('acepta contenido real, incluido el 0 y los arrays vacios', () => {
    expect(hasCheckpointAnswer('alcance')).toBe(true);
    expect(hasCheckpointAnswer(0)).toBe(true);
    expect(hasCheckpointAnswer([])).toBe(true);
  });
});

describe('mergeCheckpointResponses — el checkpoint es la fuente de verdad', () => {
  it('la respuesta confirmada gana sobre la semilla del formulario legacy', () => {
    const merged = mergeCheckpointResponses(
      { scope: 'Alcance definido en CP-0.2' },
      { scope: 'Texto viejo del formulario', objective: 'Objetivo legacy' },
    );

    expect(merged.scope).toBe('Alcance definido en CP-0.2');
  });

  it('la semilla solo cubre variables que el recorrido todavia no respondio', () => {
    const merged = mergeCheckpointResponses(
      { scope: 'Alcance de CP-0.2' },
      { scope: 'ignorado', owner_and_actor_required: 'Owner comercial' },
    );

    expect(merged).toEqual({
      scope: 'Alcance de CP-0.2',
      owner_and_actor_required: 'Owner comercial',
    });
  });

  it('una respuesta confirmada en blanco no bloquea la semilla', () => {
    const merged = mergeCheckpointResponses({ scope: '   ' }, { scope: 'Alcance legacy' });

    expect(merged.scope).toBe('Alcance legacy');
  });

  it('sin respuestas confirmadas se comporta como la captura legacy (migracion)', () => {
    const seed = { objective: 'Mover adopcion', scope: 'Equipo comercial' };

    expect(mergeCheckpointResponses({}, seed)).toEqual(seed);
  });

  it('no muta los objetos recibidos', () => {
    const confirmed = { scope: 'CP-0.2' };
    const seed = { objective: 'legacy' };
    mergeCheckpointResponses(confirmed, seed);

    expect(confirmed).toEqual({ scope: 'CP-0.2' });
    expect(seed).toEqual({ objective: 'legacy' });
  });
});

describe('projectCheckpointResponsesToFields — las secciones legacy son una vista', () => {
  const map = {
    objective: 'quePasaQueQuieres',
    scope: 'specificChallengePart',
    owner_and_actor_required: 'quienEscuchar',
  } as const;

  it('proyecta cada variable respondida sobre su campo primario', () => {
    const projected = projectCheckpointResponsesToFields(
      { objective: 'Mover adopcion', scope: 'Equipo comercial', owner_and_actor_required: 'Owner' },
      map,
    );

    expect(Object.fromEntries(projected)).toEqual({
      quePasaQueQuieres: 'Mover adopcion',
      specificChallengePart: 'Equipo comercial',
      quienEscuchar: 'Owner',
    });
  });

  it('omite las variables sin respuesta para no borrar lo que la persona escribio', () => {
    const projected = projectCheckpointResponsesToFields(
      { objective: 'Mover adopcion', scope: '', owner_and_actor_required: null },
      map,
    );

    expect(Object.fromEntries(projected)).toEqual({ quePasaQueQuieres: 'Mover adopcion' });
  });

  it('devuelve vacio cuando el recorrido aun no confirmo nada', () => {
    expect(projectCheckpointResponsesToFields({}, map)).toEqual([]);
  });
});
