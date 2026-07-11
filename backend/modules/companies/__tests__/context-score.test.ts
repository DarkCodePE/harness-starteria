import { describe, expect, it } from 'vitest';
import { calculateContextScore } from '../context-score';

describe('company context score', () => {
  it('keeps empty context non-blocking and initial', () => {
    const score = calculateContextScore([], []);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.level).toBe('INITIAL');
    expect(score.missing).toContain('cultura y apertura al cambio');
  });

  it('rewards confirmed coverage and processed evidence', () => {
    const score = calculateContextScore(
      [
        { dimension: 'IDENTITY', fieldKey: 'name', valueJson: 'Acme', sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'CULTURE', fieldKey: 'ideas', valueJson: 'Se exige evidencia', sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'STRUCTURE', fieldKey: 'approvals', valueJson: ['Gerencia'], sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'POLICIES', fieldKey: 'validations', valueJson: ['Legal'], sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'INNOVATION', fieldKey: 'pilotScale', valueJson: 'Caso por caso', sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'RESOURCES', fieldKey: 'available', valueJson: ['Datos'], sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
      ],
      [{ status: 'PROCESSED', sourceType: 'WEBSITE', processedAt: new Date() }],
    );
    expect(score.score).toBeGreaterThanOrEqual(80);
    expect(score.level).toBe('SOLID');
  });
});
