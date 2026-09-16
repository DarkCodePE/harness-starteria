import { derivePortfolioAnchor } from './anchor';
import type { PortfolioBootstrapState } from './types';

const confirmedAt = '2026-09-14T10:00:00.000Z';
const humanConfirmation = { confirmedBy: 'portfolio-lead-1', confirmedAt };

export const portfolioBootstrapFixtures: Record<string, PortfolioBootstrapState> = {
  vagueEntryNoAnchor: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({ desiredOutcome: 'innovar mas' }),
  },
  sufficientProxySignal: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Ventas y customer success detectan perdida de cuentas medianas durante onboarding.',
      businessSignal: { status: 'proxy', value: 'Aumento de tickets y retrasos', provenance: 'AI_INFERRED' },
    }),
  },
  confirmedAnchorNoWork: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Ventas y customer success detectan perdida de cuentas medianas durante onboarding.',
      businessSignal: { status: 'known', value: 'Churn onboarding 18%', provenance: 'USER_CONFIRMED' },
      humanConfirmation,
    }),
    detectedWorkItems: [],
  },
  workDetectedReviewPending: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Hay tres lineas activas relacionadas con soporte, producto y ventas.',
      decisionToEnable: 'Decidir que lineas merecen foco este trimestre',
      humanConfirmation,
    }),
    detectedWorkItems: [{ id: 'w1', label: 'Onboarding guiado', provenance: 'AI_INFERRED', materialReviewRequired: true }],
    materialReviewPending: true,
  },
  firstReadingNoAttention: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Acelerar revenue expansion en cuentas enterprise',
      contextSummary: 'El portfolio contiene trabajo de pricing, soporte premium y adoption.',
      businessSignal: { status: 'known', value: 'Expansion neta bajo objetivo', provenance: 'USER_CONFIRMED' },
      humanConfirmation,
    }),
    detectedWorkItems: [{ id: 'w1', label: 'Pricing enterprise', provenance: 'USER_CONFIRMED' }],
    firstReadingPublished: true,
  },
  firstReadingWithAttention: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Acelerar revenue expansion en cuentas enterprise',
      contextSummary: 'El portfolio contiene trabajo de pricing, soporte premium y adoption.',
      businessSignal: { status: 'known', value: 'Expansion neta bajo objetivo', provenance: 'USER_CONFIRMED' },
      humanConfirmation,
    }),
    detectedWorkItems: [{ id: 'w1', label: 'Pricing enterprise', provenance: 'USER_CONFIRMED' }],
    firstReadingPublished: true,
    attentionSignals: [{ type: 'critical_dependency', severity: 'attention', label: 'Legal pendiente' }],
  },
  decisionReadyReading: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Acelerar revenue expansion en cuentas enterprise',
      contextSummary: 'El portfolio contiene trabajo de pricing, soporte premium y adoption.',
      businessSignal: { status: 'known', value: 'Expansion neta bajo objetivo', provenance: 'USER_CONFIRMED' },
      humanConfirmation,
    }),
    detectedWorkItems: [{ id: 'w1', label: 'Pricing enterprise', provenance: 'USER_CONFIRMED' }],
    firstReadingPublished: true,
    decisionRequired: true,
  },
  criticalConflict: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Expandir enterprise y reducir ventas enterprise al mismo tiempo',
      contextSummary: 'Las fuentes discrepan sobre si enterprise es foco o area a pausar.',
      businessSignal: { status: 'proxy', value: 'Pipeline contradictorio', provenance: 'AI_INFERRED' },
      criticalContradictions: ['Enterprise aparece como prioridad y como trabajo a detener.'],
    }),
  },
  blockerAffectsMovement: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Reducir riesgo operacional en pagos',
      contextSummary: 'Operaciones, soporte y producto tienen iniciativas relacionadas.',
      decisionToEnable: 'Decidir inversiones para el siguiente trimestre',
      humanConfirmation,
    }),
    detectedWorkItems: [{ id: 'w1', label: 'Pagos resilientes', provenance: 'USER_CONFIRMED' }],
    attentionSignals: [{ type: 'critical_dependency', severity: 'blocking', label: 'Proveedor pendiente', affectsMovement: true }],
  },
  missingBusinessSignalOnlyAttention: {
    continuationExists: true,
    anchor: derivePortfolioAnchor({
      desiredOutcome: 'Mejorar conversion en checkout',
      contextSummary: 'Producto y growth tienen trabajo existente alrededor del funnel.',
      decisionToEnable: 'Decidir foco entre checkout, pricing y soporte',
      humanConfirmation,
    }),
    detectedWorkItems: [{ id: 'w1', label: 'Checkout simplificado', provenance: 'USER_CONFIRMED' }],
    attentionSignals: [{ type: 'business_signal', severity: 'attention', label: 'Senal de negocio pendiente' }],
  },
};
