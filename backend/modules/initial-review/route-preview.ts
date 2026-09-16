/**
 * Ruta Step 0–4 CANÓNICA (ADR-025, PRD §6/§8). Fuente única de verdad.
 *
 * Guardrail duro (RB-IR-013, §8, §25): la IA NO puede cambiar la estructura Step 0–4.
 * Tanto el generador mock como el real DEBEN devolver exactamente esta ruta; el
 * generador de IA IGNORA cualquier routePreview que proponga el modelo.
 */
import type { StepRoutePreviewItem } from './initial-review.types';

export const CANONICAL_ROUTE: readonly StepRoutePreviewItem[] = [
  { step: 0, name: 'Ordenar contexto', whatWillHappen: 'Aterrizar alcance, actores, sponsor, restricciones y tiempo.', expectedOutput: 'Card inicial clara y contexto base', status: 'active' },
  { step: 1, name: 'Definir y validar foco', whatWillHappen: 'Validar problema u oportunidad con evidencia.', expectedOutput: 'Foco validado', status: 'locked' },
  { step: 2, name: 'Diseñar apuesta', whatWillHappen: 'Convertir el foco en solución priorizada e hipótesis.', expectedOutput: 'Test Card o piloto pequeño', status: 'future' },
  { step: 3, name: 'Probar y aprender', whatWillHappen: 'Ejecutar una prueba y capturar evidencia.', expectedOutput: 'Aprendizajes y recomendación', status: 'future' },
  { step: 4, name: 'Presentar propuesta', whatWillHappen: 'Organizar historia, evidencia y siguiente paso.', expectedOutput: 'Reporte o pitch para sponsor', status: 'future' },
];

/** Copia mutable (los consumidores no deben mutar la constante compartida). */
export const canonicalRoute = (): StepRoutePreviewItem[] => CANONICAL_ROUTE.map((r) => ({ ...r }));
