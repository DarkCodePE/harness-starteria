/**
 * MockInitialReviewGenerator — generador determinista para IR-B2 (ADR-025).
 *
 * Permite que el flujo create→snapshot funcione end-to-end SIN IA real, para poder
 * verificar el service y las APIs de forma determinista. IR-B3 lo sustituye por el
 * generador real (ai-service). NO llama a ningún modelo; deriva la salida del input.
 *
 * Respeta los guardrails del PRD §25 por construcción: no declara validación, no
 * aprueba Step 0, no inventa evidencia (missingEvidence queda vacío).
 */
import type {
  GenerateInput,
  GeneratedReview,
  InitialReviewGenerator,
  CanonicalChallengeType,
} from './initial-review.types';

const ROUTE: GeneratedReview['routePreview'] = [
  { step: 0, name: 'Ordenar contexto', whatWillHappen: 'Aterrizar alcance, actores, sponsor, restricciones y tiempo.', expectedOutput: 'Card inicial clara y contexto base', status: 'active' },
  { step: 1, name: 'Definir y validar foco', whatWillHappen: 'Validar problema u oportunidad con evidencia.', expectedOutput: 'Foco validado', status: 'locked' },
  { step: 2, name: 'Diseñar apuesta', whatWillHappen: 'Convertir el foco en solución priorizada e hipótesis.', expectedOutput: 'Test Card o piloto pequeño', status: 'future' },
  { step: 3, name: 'Probar y aprender', whatWillHappen: 'Ejecutar una prueba y capturar evidencia.', expectedOutput: 'Aprendizajes y recomendación', status: 'future' },
  { step: 4, name: 'Presentar propuesta', whatWillHappen: 'Organizar historia, evidencia y siguiente paso.', expectedOutput: 'Reporte o pitch para sponsor', status: 'future' },
];

/** Heurística determinista de tipo de reto a partir de palabras del input. */
function classify(text: string): CanonicalChallengeType {
  const t = text.toLowerCase();
  if (/\b(oportunidad|crecer|crecimiento|adopci|conversi|ventas|expansi|mercado)\b/.test(t)) return 'growth';
  if (/\b(incertidumbre|explorar|no s[eé]|investigar|validar si|hip[oó]tesis|descubrir)\b/.test(t)) return 'exploration';
  return 'correction';
}

export class MockInitialReviewGenerator implements InitialReviewGenerator {
  async generate(input: GenerateInput): Promise<GeneratedReview> {
    const base = [input.originalInput, ...(input.addedContext ?? [])].join(' ').trim();
    const type = classify(base);
    const firstWords = input.originalInput.trim().split(/\s+/).slice(0, 8).join(' ');

    const reasonByType: Record<CanonicalChallengeType, string> = {
      correction: 'Tu propuesta busca reducir una fricción operativa existente.',
      growth: 'Tu propuesta busca capturar una oportunidad de crecimiento o adopción.',
      exploration: 'Tu propuesta busca reducir incertidumbre antes de decidir avanzar.',
    };

    return {
      understandingSummary: `Entiendo que quieres ordenar: "${firstWords}${input.originalInput.trim().split(/\s+/).length > 8 ? '…' : ''}".`,
      suggestedChallengeType: type,
      challengeTypeReason: reasonByType[type],
      informationReadiness: base.length > 220 ? 'medium' : 'low',
      critique: {
        solid: 'La propuesta aborda una necesidad concreta.',
        weak: 'Todavía falta precisar frecuencia, alcance e impacto.',
        risky: 'Podrías saltar a una solución antes de entender el problema real.',
        recommendedAdjustment: 'Antes de diseñar, delimita proceso, actores y señal de éxito.',
        mainRisk: 'Solución prematura sin evidencia del problema.',
        missingEvidence: [], // guardrail §25: no inventamos evidencia
      },
      strategicQuestions: [
        { id: 'q1', question: '¿Dónde debería empezar esta iniciativa?', options: ['Toda la empresa', 'Un área', 'Un proceso específico', 'No lo sé aún'], allowsUnknown: true, answerType: 'single_choice', status: 'unanswered', shouldCarryToStep0: true },
        { id: 'q2', question: '¿Qué señal demostraría que vale la pena avanzar?', options: ['Menos tiempo', 'Menos errores', 'Más adopción', 'Más conversión', 'No lo sé aún'], allowsUnknown: true, answerType: 'single_choice', status: 'unanswered', shouldCarryToStep0: true },
        { id: 'q3', question: '¿Quién debería apoyar o aprobar esto?', options: ['Mi jefe', 'Sponsor', 'Área operativa', 'Cliente', 'No lo sé aún'], allowsUnknown: true, answerType: 'single_choice', status: 'unanswered', shouldCarryToStep0: true },
      ],
      improvedProposal: {
        suggestedName: firstWords.length > 3 ? firstWords.replace(/^./, (c) => c.toUpperCase()) : 'Iniciativa sin nombre',
        improvedDescription: `${input.originalInput.trim()} — comenzando por delimitar dónde se rompe el proceso actual, qué actores intervienen y qué señal demostraría mejora.`,
        initialFocus: 'Proceso o área más afectada.',
        expectedImpact: 'Menor tiempo, menor retrabajo, mayor trazabilidad.',
        nextRecommendedStep: 'Completar Step 0 para aterrizar alcance, actores, sponsor y restricciones.',
      },
      routePreview: ROUTE.map((r) => ({ ...r })),
    };
  }
}
