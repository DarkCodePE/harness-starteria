import { describe, it, expect } from 'vitest';
import { diffSections, SNAPSHOT_SECTION_IDS, type DiffableSnapshot } from '../snapshot-diff';

function base(): DiffableSnapshot {
  return {
    understandingSummary: 'La propuesta busca X.',
    suggestedChallengeType: 'correction',
    challengeTypeReason: 'Reduce una fricción.',
    informationReadiness: 'low',
    critique: { solid: 's', weak: 'w', risky: 'r', recommendedAdjustment: 'a' },
    strategicQuestions: [{ id: 'q1', text: '¿Quién?', status: 'unanswered' }],
    improvedProposal: { suggestedName: 'RIHU', expectedImpact: 'menos bugs' },
    routePreview: [{ step: 0, name: 'Ordenar contexto' }],
  };
}

describe('diffSections (ADR-026, IRC-02)', () => {
  it('snapshots idénticos → sin cambios (lista vacía)', () => {
    expect(diffSections(base(), base())).toEqual([]);
  });

  it('prev === null → todas las secciones se consideran cambiadas', () => {
    expect(diffSections(null, base())).toEqual([...SNAPSHOT_SECTION_IDS]);
  });

  it('cambio solo en understandingSummary → ["understanding"]', () => {
    const next = { ...base(), understandingSummary: 'Otra cosa.' };
    expect(diffSections(base(), next)).toEqual(['understanding']);
  });

  it('cambio de tipo de reto o su razón → ["challengeType"]', () => {
    expect(diffSections(base(), { ...base(), suggestedChallengeType: 'growth' })).toEqual(['challengeType']);
    expect(diffSections(base(), { ...base(), challengeTypeReason: 'Otra razón.' })).toEqual(['challengeType']);
  });

  it('cambio en informationReadiness cuenta como challengeType; null y undefined son equivalentes', () => {
    expect(diffSections(base(), { ...base(), informationReadiness: 'high' })).toEqual(['challengeType']);
    const prevNull = { ...base(), informationReadiness: null };
    const nextUndef = { ...base(), informationReadiness: undefined };
    expect(diffSections(prevNull, nextUndef)).toEqual([]);
  });

  it('cambio profundo en critique se detecta pese a distinto orden de claves', () => {
    const prev = { ...base(), critique: { solid: 's', weak: 'w' } };
    const nextReordered = { ...base(), critique: { weak: 'w', solid: 's' } };
    expect(diffSections(prev, nextReordered)).toEqual([]); // mismo contenido, distinto orden → sin cambio
    const nextChanged = { ...base(), critique: { solid: 's', weak: 'DIFERENTE' } };
    expect(diffSections(prev, nextChanged)).toEqual(['critique']);
  });

  it('cambios en múltiples secciones se devuelven en orden canónico', () => {
    const next = {
      ...base(),
      routePreview: [{ step: 0, name: 'Otra' }],
      understandingSummary: 'Otra cosa.',
      improvedProposal: { suggestedName: 'RIHU-2' },
    };
    expect(diffSections(base(), next)).toEqual(['understanding', 'improvedProposal', 'routePreview']);
  });

  it('es determinista: mismas entradas → misma salida', () => {
    const next = { ...base(), critique: { solid: 'z' }, understandingSummary: 'y' };
    const a = diffSections(base(), next);
    const b = diffSections(base(), next);
    expect(a).toEqual(b);
  });
});
