/**
 * portfolio.schemas.activation.test.ts — MVP-P0-02.
 *
 * `Challenge.activationInputs` se persiste como columna Json, y Postgres no valida lo que
 * entra ahí: este schema es la ÚNICA barrera. Si se relaja, el front acaba leyendo un objeto
 * al que le faltan ejes y pintando selects vacíos sin que nada haya fallado por el camino.
 * Por eso los casos negativos importan tanto como los positivos.
 */
import { describe, it, expect } from 'vitest';
import { createChallengeSchema, updateChallengeSchema } from '../portfolio.schemas';

const FULL_INPUTS = {
  urgency: 'alta',
  timeAvailable: 'acotado',
  estimatedEffort: 'medio',
  challengeClarity: 'baja',
  informationSensitivity: 'alta',
  internalCapacity: 'media',
  technicalNeed: 'alta',
  sponsorStatus: 'confirmado',
  dependency: 'legal',
};

describe('createChallengeSchema — autoría de la activación (MVP-P0-02)', () => {
  it('acepta los 3 campos y los deja pasar intactos al service', () => {
    const parsed = createChallengeSchema.parse({
      title: 'Reducir esperas',
      activationInputs: FULL_INPUTS,
      activationRecommendationNote: 'Conviene squad asignado.',
      activationMessageDraft: 'Equipo, abrimos el reto.',
    });
    // El service hace `data: input as any`, así que lo que salga de aquí es lo que se escribe.
    expect(parsed.activationInputs).toEqual(FULL_INPUTS);
    expect(parsed.activationRecommendationNote).toBe('Conviene squad asignado.');
    expect(parsed.activationMessageDraft).toBe('Equipo, abrimos el reto.');
  });

  it('los 3 son opcionales: crear un reto sin tocar la activación sigue funcionando', () => {
    expect(() => createChallengeSchema.parse({ title: 'Reducir esperas' })).not.toThrow();
  });

  it('RECHAZA un activationInputs incompleto', () => {
    // El caso realista: mandar un parche en vez del objeto entero. La columna se reemplaza
    // completa, así que aceptarlo dejaría el reto con la activación a medio describir.
    expect(() =>
      createChallengeSchema.parse({ title: 'X', activationInputs: { urgency: 'alta' } }),
    ).toThrow();
  });

  it('RECHAZA un valor fuera del vocabulario de un eje', () => {
    expect(() =>
      createChallengeSchema.parse({ title: 'X', activationInputs: { ...FULL_INPUTS, urgency: 'urgentisima' } }),
    ).toThrow();
    expect(() =>
      createChallengeSchema.parse({ title: 'X', activationInputs: { ...FULL_INPUTS, dependency: 'marketing' } }),
    ).toThrow();
  });

  it('RECHAZA que activationInputs no sea un objeto', () => {
    for (const basura of ['alta', 42, [], null]) {
      expect(() => createChallengeSchema.parse({ title: 'X', activationInputs: basura })).toThrow();
    }
  });
});

describe('updateChallengeSchema — hereda la validación por .partial()', () => {
  it('permite actualizar SÓLO la nota, sin reenviar el reto entero', () => {
    const parsed = updateChallengeSchema.parse({ activationRecommendationNote: 'otra nota' });
    expect(parsed.activationRecommendationNote).toBe('otra nota');
    expect(parsed).not.toHaveProperty('title');
  });

  it('acepta la cadena vacía: borrar la nota es una edición, no una omisión', () => {
    expect(updateChallengeSchema.parse({ activationRecommendationNote: '' }).activationRecommendationNote).toBe('');
  });

  it('sigue rechazando un activationInputs incompleto en el update', () => {
    expect(() => updateChallengeSchema.parse({ activationInputs: { urgency: 'alta' } })).toThrow();
  });
});
