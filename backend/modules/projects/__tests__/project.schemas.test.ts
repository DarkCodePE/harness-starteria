import { describe, it, expect } from 'vitest';
import { updateStep0Schema } from '../project.schemas';

describe('updateStep0Schema', () => {
  describe('legacy fields (back-compat)', () => {
    it('accepts the legacy field set with valid enums', () => {
      const parsed = updateStep0Schema.parse({
        nombreParticipante: 'Nancy',
        rolArea: 'Sub Gerente',
        origen: 'problema',
        quePasaQueQuieres: 'Las sucursales bloquean...',
        impacta: ['Operaciones', 'Ventas'],
        parteProceso: 'durante',
        impacto3meses: 'cliente',
        respaldo: 'datos',
        quienEscuchar: 'Jefes de Oficina',
        siMinimo: ['piloto', 'capacitacion'],
        status: 'En progreso',
      });
      expect(parsed.origen).toBe('problema');
      expect(parsed.impacta).toEqual(['Operaciones', 'Ventas']);
    });

    it('rejects an invalid origen enum', () => {
      const result = updateStep0Schema.safeParse({ origen: 'inventado' });
      expect(result.success).toBe(false);
    });
  });

  describe('new fields (public initiative start flow)', () => {
    it('accepts the full new field set', () => {
      const parsed = updateStep0Schema.parse({
        mode: 'independent',
        initiativeTitle: 'Protocolo de Autonomia',
        initiativeFrame: 'correccion',
        clarityLevel: 'hipotesis_clara',
        primaryObjective: 'eficiencia',
        specificChallengePart: '',
        challengeGoalConnection: '',
        linkedContributionType: 'resolver_parte',
        impactWho: 'Equipo de creditos',
        visibleMoment: 'Cierres de mes',
        whyNowText: 'Saturacion creciente',
        ifNotNowConsequence: 'Lead time se mantiene',
        evidenceType: 'datos',
        currentEvidence: '6,000+ excepciones',
        validationSignal: 'Piloto reduce lead time',
        sponsorInterestReason: 'Mejora confianza',
        supportNeeded: 'Reglas Nivel 2',
        decisionRequested: 'Luz verde piloto',
        deliveryEmail: 'sponsor@empresa.com',
        additionalStakeholders: 'si',
        additionalStakeholdersDetail: 'Lima/TI',
      });
      expect(parsed.initiativeFrame).toBe('correccion');
      expect(parsed.primaryObjective).toBe('eficiencia');
      expect(parsed.additionalStakeholders).toBe('si');
    });

    it('accepts empty-string sentinels for the new enum fields', () => {
      const parsed = updateStep0Schema.parse({
        initiativeFrame: '',
        clarityLevel: '',
        primaryObjective: '',
        evidenceType: '',
        additionalStakeholders: '',
      });
      expect(parsed.initiativeFrame).toBe('');
      expect(parsed.clarityLevel).toBe('');
    });

    it('rejects invalid initiativeFrame enum', () => {
      const result = updateStep0Schema.safeParse({ initiativeFrame: 'invalido' });
      expect(result.success).toBe(false);
    });

    it('rejects malformed deliveryEmail', () => {
      const result = updateStep0Schema.safeParse({ deliveryEmail: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('accepts an empty-string deliveryEmail', () => {
      const parsed = updateStep0Schema.parse({ deliveryEmail: '' });
      expect(parsed.deliveryEmail).toBe('');
    });

    it('accepts a partial payload mixing legacy + new fields', () => {
      const parsed = updateStep0Schema.parse({
        nombreParticipante: 'Ana',
        initiativeTitle: 'Reto X',
        primaryObjective: 'experiencia_cliente',
      });
      expect(parsed.nombreParticipante).toBe('Ana');
      expect(parsed.initiativeTitle).toBe('Reto X');
      expect(parsed.primaryObjective).toBe('experiencia_cliente');
    });
  });
});
