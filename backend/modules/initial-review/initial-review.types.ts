/**
 * Tipos del dominio "revisión inicial guiada" (ADR-025, PRD §18/§25).
 *
 * Contrato IA canónico (inglés) ↔ enum de DB legacy (español). El schema reusa el
 * `ChallengeType` existente en español (correccion/crecimiento/exploracion); el
 * frontend y el PRD hablan en inglés (correction/growth/exploration). Este módulo
 * traduce en la frontera del servicio (hallazgo adversarial #5).
 */
import type { ChallengeType } from '@prisma/client';

export type CanonicalChallengeType = 'correction' | 'growth' | 'exploration';
export type InformationReadiness = 'very_low' | 'low' | 'medium' | 'high';

const CANON_TO_DB: Record<CanonicalChallengeType, ChallengeType> = {
  correction: 'correccion',
  growth: 'crecimiento',
  exploration: 'exploracion',
};
const DB_TO_CANON: Record<ChallengeType, CanonicalChallengeType> = {
  correccion: 'correction',
  crecimiento: 'growth',
  exploracion: 'exploration',
};

export const toDbChallengeType = (c: CanonicalChallengeType): ChallengeType => CANON_TO_DB[c];
export const toCanonicalChallengeType = (d: ChallengeType): CanonicalChallengeType => DB_TO_CANON[d];

/** Bloques congelados de una revisión (PRD §11) — forma canónica (API/frontend). */
export interface ExpertCritique {
  solid: string;
  weak: string;
  risky: string;
  recommendedAdjustment: string;
  mainRisk?: string;
  missingEvidence?: string[];
}

export interface StrategicQuestion {
  id: string;
  question: string;
  options: string[];
  allowsUnknown: boolean;
  answer?: string;
  answerType: 'single_choice' | 'multi_choice' | 'free_text';
  status: 'unanswered' | 'answered' | 'unknown';
  shouldCarryToStep0: boolean;
}

export interface ImprovedProposal {
  suggestedName: string;
  improvedDescription: string;
  initialFocus: string;
  expectedImpact: string;
  nextRecommendedStep: string;
}

export interface StepRoutePreviewItem {
  step: 0 | 1 | 2 | 3 | 4;
  name: string;
  whatWillHappen: string;
  expectedOutput: string;
  status: 'active' | 'locked' | 'future';
}

/** Salida que produce la IA (PRD §25 `AIInitialReviewOutput`). Tipo de reto canónico. */
export interface GeneratedReview {
  understandingSummary: string;
  suggestedChallengeType: CanonicalChallengeType;
  challengeTypeReason: string;
  informationReadiness?: InformationReadiness;
  critique: ExpertCritique;
  strategicQuestions: StrategicQuestion[];
  improvedProposal: ImprovedProposal;
  routePreview: StepRoutePreviewItem[];
}

export interface GenerateInput {
  originalInput: string;
  addedContext?: string[];
}

/**
 * Frontera IA inyectable (DI). IR-B2 usa un generador determinista (mock);
 * IR-B3 inyecta el generador real contra el ai-service (ADR-011/013) con
 * los guardrails del PRD §25 (no validar, no aprobar Step 0, no inventar evidencia).
 */
export interface InitialReviewGenerator {
  generate(input: GenerateInput): Promise<GeneratedReview>;
}
