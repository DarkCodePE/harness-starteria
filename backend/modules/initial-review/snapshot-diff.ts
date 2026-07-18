/**
 * ADR-026 (IRC-02): diff por sección entre dos versiones de snapshot de revisión inicial.
 *
 * Puro y sin dependencias de Prisma: recibe la forma estructural de un snapshot y
 * devuelve las "secciones" (cards del panel izquierdo) cuyo contenido cambió. El backend
 * es quien calcula el diff porque tiene ambas versiones de forma atómica; el frontend usa
 * el resultado para el anuncio del asistente (IRC-05) y el resaltado.
 */

/** Cards canónicas del panel de revisión (1:1 con ReviewCards en el front). */
export const SNAPSHOT_SECTION_IDS = [
  'understanding',
  'challengeType',
  'critique',
  'questions',
  'improvedProposal',
  'routePreview',
] as const;

export type SnapshotSectionId = (typeof SNAPSHOT_SECTION_IDS)[number];

/** Subconjunto estructural de un snapshot suficiente para el diff. */
export interface DiffableSnapshot {
  understandingSummary: string;
  suggestedChallengeType: string;
  challengeTypeReason: string;
  informationReadiness?: string | null;
  critique: unknown;
  strategicQuestions: unknown;
  improvedProposal: unknown;
  routePreview: unknown;
}

/** Serialización estable (claves ordenadas) para comparar objetos independientemente del
 * orden de propiedades entre una fila JSON de Postgres y un objeto recién generado. */
function stable(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Devuelve las secciones cuyo contenido difiere entre `prev` y `next`, en el orden
 * canónico de SNAPSHOT_SECTION_IDS. `prev === null` (no había versión previa) trata todo
 * como cambiado. Determinista: mismo par de entradas → misma lista.
 */
export function diffSections(prev: DiffableSnapshot | null, next: DiffableSnapshot): SnapshotSectionId[] {
  if (prev === null) return [...SNAPSHOT_SECTION_IDS];

  const changed: SnapshotSectionId[] = [];

  if (prev.understandingSummary !== next.understandingSummary) changed.push('understanding');

  // La card de tipo de reto agrupa tipo sugerido + su justificación + readiness.
  if (
    prev.suggestedChallengeType !== next.suggestedChallengeType ||
    prev.challengeTypeReason !== next.challengeTypeReason ||
    (prev.informationReadiness ?? null) !== (next.informationReadiness ?? null)
  ) {
    changed.push('challengeType');
  }

  if (stable(prev.critique) !== stable(next.critique)) changed.push('critique');
  if (stable(prev.strategicQuestions) !== stable(next.strategicQuestions)) changed.push('questions');
  if (stable(prev.improvedProposal) !== stable(next.improvedProposal)) changed.push('improvedProposal');
  if (stable(prev.routePreview) !== stable(next.routePreview)) changed.push('routePreview');

  return changed;
}
