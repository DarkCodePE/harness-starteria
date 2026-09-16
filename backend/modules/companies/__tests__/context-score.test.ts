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

  it('does not treat inferred source coverage as fully reliable context', () => {
    const score = calculateContextScore(
      [
        { dimension: 'IDENTITY', fieldKey: 'name', valueJson: 'Acme', sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'IDENTITY', fieldKey: 'sector', valueJson: 'Retail', sourceType: 'USER_INPUT', verificationStatus: 'USER_CONFIRMED', createdAt: new Date() },
        { dimension: 'CULTURE', fieldKey: 'ideas', valueJson: 'Parece abierta al cambio', sourceType: 'WEBSITE', verificationStatus: 'INFERRED', createdAt: new Date() },
        { dimension: 'STRUCTURE', fieldKey: 'approvals', valueJson: ['Gerencia'], sourceType: 'WEBSITE', verificationStatus: 'INFERRED', createdAt: new Date() },
        { dimension: 'POLICIES', fieldKey: 'validations', valueJson: ['Legal'], sourceType: 'LINKEDIN', verificationStatus: 'INFERRED', createdAt: new Date() },
        { dimension: 'INNOVATION', fieldKey: 'pilotScale', valueJson: 'Menciona pilotos', sourceType: 'LINKEDIN', verificationStatus: 'INFERRED', createdAt: new Date() },
        { dimension: 'RESOURCES', fieldKey: 'available', valueJson: ['Datos'], sourceType: 'WEBSITE', verificationStatus: 'INFERRED', createdAt: new Date() },
      ],
      [
        { status: 'PROCESSED', sourceType: 'WEBSITE', processedAt: new Date() },
        { status: 'PROCESSED', sourceType: 'LINKEDIN', processedAt: new Date() },
      ],
    );
    expect(score.score).toBeLessThan(70);
    expect(score.level).toBe('BASIC');
    expect(score.missing).toContain('cultura y apertura al cambio');
    expect(score.missing).toContain('estructura y toma de decisiones');
  });
});
