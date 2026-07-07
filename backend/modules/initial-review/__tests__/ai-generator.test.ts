/**
 * ai-generator.test.ts — IR-B3 (ADR-025, PRD §25).
 *
 * Fija los GUARDRAILS del generador real con un caller inyectado (sin red): la IA
 * orienta pero no decide. Prueba que salidas hostiles/malformadas del modelo se sanean.
 */
import { describe, it, expect, vi } from 'vitest';
import { AiInitialCritiqueService, InitialReviewAiCaller } from '../ai-generator';

function svc(raw: unknown): AiInitialCritiqueService {
  const caller: InitialReviewAiCaller = vi.fn(async () => raw);
  return new AiInitialCritiqueService(caller);
}

const WELL_FORMED = {
  understandingSummary: 'Entiendo tu propuesta.',
  suggestedChallengeType: 'growth',
  challengeTypeReason: 'Busca capturar una oportunidad.',
  informationReadiness: 'medium',
  critique: { solid: 's', weak: 'w', risky: 'r', recommendedAdjustment: 'a', mainRisk: 'mr', missingEvidence: ['falta frecuencia'] },
  strategicQuestions: [{ id: 'q1', question: '¿Dónde?', options: ['Un área'] }],
  improvedProposal: { suggestedName: 'Mi iniciativa', improvedDescription: 'd', initialFocus: 'f', expectedImpact: 'i', nextRecommendedStep: 'Step 0' },
  routePreview: [{ step: 2, name: 'HACKEADO', whatWillHappen: 'x', expectedOutput: 'y', status: 'active' }],
};

describe('AiInitialCritiqueService — mapeo + guardrails (IR-B3)', () => {
  it('mapea una salida bien formada y respeta el tipo canónico', async () => {
    const out = await svc(WELL_FORMED).generate({ originalInput: 'algo' });
    expect(out.understandingSummary).toBe('Entiendo tu propuesta.');
    expect(out.suggestedChallengeType).toBe('growth');
    expect(out.improvedProposal.suggestedName).toBe('Mi iniciativa');
  });

  it('IGNORA el routePreview del modelo y fuerza la ruta canónica Step 0–4 (§8, RB-IR-013)', async () => {
    const out = await svc(WELL_FORMED).generate({ originalInput: 'algo' });
    expect(out.routePreview.map((r) => r.step)).toEqual([0, 1, 2, 3, 4]);
    expect(out.routePreview[0]).toMatchObject({ step: 0, status: 'active', name: 'Ordenar contexto' });
    // el nombre "HACKEADO" del modelo no sobrevive
    expect(out.routePreview.some((r) => r.name === 'HACKEADO')).toBe(false);
  });

  it('coacciona un tipo de reto inválido a "exploration" (default seguro)', async () => {
    const out = await svc({ ...WELL_FORMED, suggestedChallengeType: 'VALIDATED' }).generate({ originalInput: 'x' });
    expect(out.suggestedChallengeType).toBe('exploration');
  });

  it('trunca a un máximo de 3 preguntas (§11) y siempre permite "No lo sé aún"', async () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ id: `q${i}`, question: `p${i}`, options: [] }));
    const out = await svc({ ...WELL_FORMED, strategicQuestions: many }).generate({ originalInput: 'x' });
    expect(out.strategicQuestions.length).toBe(3);
    expect(out.strategicQuestions.every((q) => q.allowsUnknown)).toBe(true);
  });

  it('neutraliza lenguaje de validación/aprobación en la crítica (§25)', async () => {
    const hostile = { ...WELL_FORMED, critique: { ...WELL_FORMED.critique, recommendedAdjustment: 'Tu iniciativa está validada y aprobada para escalar.' } };
    const out = await svc(hostile).generate({ originalInput: 'x' });
    expect(out.critique.recommendedAdjustment).not.toMatch(/validad|aprobad|escal/i);
    expect(out.critique.recommendedAdjustment).toContain('[revisar]');
  });

  it('no propaga evidencia inventada cuando missingEvidence no es un arreglo (§25)', async () => {
    const out = await svc({ ...WELL_FORMED, critique: { ...WELL_FORMED.critique, missingEvidence: 'confío en que hay datos' } }).generate({ originalInput: 'x' });
    expect(out.critique.missingEvidence).toEqual([]);
  });

  it('rechaza una respuesta malformada (sin understanding o sin nombre de propuesta)', async () => {
    await expect(svc({ suggestedChallengeType: 'growth' }).generate({ originalInput: 'x' })).rejects.toMatchObject({ code: 'INITIAL_REVIEW_AI_MALFORMED' });
    await expect(svc({ understandingSummary: 'ok', improvedProposal: {} }).generate({ originalInput: 'x' })).rejects.toMatchObject({ code: 'INITIAL_REVIEW_AI_MALFORMED' });
  });
});
