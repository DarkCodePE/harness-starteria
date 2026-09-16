import { describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import { deriveAnchorStatus, derivePortfolioAnchorFromContinuation } from '../portfolio-anchor-derivation';

describe('derivePortfolioAnchorFromContinuation', () => {
  it('maps vague intent to insufficient without inventing canonical objects', () => {
    const anchor = derivePortfolioAnchorFromContinuation(makeContinuation({
      handoff: { desired_outcome: { value: 'innovar mas' } },
    }));

    expect(anchor.status).toBe('anchor_insufficient');
    expect(anchor.outcomeStatement).toBe('innovar mas');
    expect(JSON.stringify(anchor.sourceRefs)).toContain('PortfolioEntryPortfolioContinuation');
  });

  it('maps outcome plus decision to sufficient', () => {
    const anchor = derivePortfolioAnchorFromContinuation(makeContinuation({
      handoff: {
        desired_outcome: { value: 'Reducir abandono en onboarding B2B' },
        known_context: [{ description: 'Customer success y producto reportan retrasos en activacion.' }],
        decision_to_enable: { value: 'Decidir que iniciativas merecen foco este trimestre' },
      },
    }));

    expect(anchor.status).toBe('anchor_sufficient');
    expect(anchor.businessSignalStatus).toBe('unknown');
  });

  it('maps outcome plus proxy business signal to sufficient', () => {
    const anchor = derivePortfolioAnchorFromContinuation(makeContinuation({
      handoff: {
        desired_outcome: { value: 'Reducir abandono en onboarding B2B' },
        known_context: [{ description: 'Customer success y producto reportan retrasos en activacion.' }],
        business_signal: { value: 'Aumento sostenido de tickets durante onboarding' },
      },
    }));

    expect(anchor.status).toBe('anchor_sufficient');
    expect(anchor.businessSignalStatus).toBe('proxy');
  });

  it('maps conflicting material context to conflicting', () => {
    const anchor = derivePortfolioAnchorFromContinuation(makeContinuation({
      handoff: {
        desired_outcome: { value: 'Expandir ventas enterprise' },
        known_context: [{ description: 'Ventas y producto tienen iniciativas enterprise activas.' }],
        business_signal: { value: 'Pipeline enterprise en riesgo' },
        unresolved_context: [{ severity: 'critical', description: 'Contradiccion: enterprise es foco y tambien area a pausar.' }],
      },
    }));

    expect(anchor.status).toBe('anchor_conflicting');
    expect(anchor.businessSignalStatus).toBe('conflicting');
  });
});

describe('deriveAnchorStatus', () => {
  it('does not require baseline, target, sponsor, StrategicFront, Challenge, or KPI confirmation', () => {
    expect(deriveAnchorStatus({
      outcomeStatement: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Customer success y producto reportan retrasos en activacion.',
      decisionToEnable: 'Decidir foco del trimestre',
      businessSignalStatus: 'unknown',
    })).toBe('anchor_sufficient');
  });

  it('keeps AI_INFERRED away from CANONICAL by never producing canonical state', () => {
    const status = deriveAnchorStatus({
      outcomeStatement: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Customer success y producto reportan retrasos en activacion.',
      businessSignalStatus: 'proxy',
    });

    expect(status).toBe('anchor_sufficient');
    expect(status).not.toBe('anchor_confirmed');
  });
});

function makeContinuation(overrides: { handoff?: Record<string, unknown>; confirmation?: Record<string, unknown> }) {
  return {
    id: 'cont-1',
    sessionId: 'entry-session-1',
    sourceSnapshot: {
      session: { rawEntry: 'Entrada original' },
      handoff: overrides.handoff ?? {},
      confirmation: overrides.confirmation ?? {},
    } as Prisma.JsonValue,
    pendingItems: {} as Prisma.JsonValue,
  };
}
