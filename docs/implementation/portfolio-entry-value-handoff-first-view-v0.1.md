# Portfolio Entry — First-view Information Hierarchy

**Slice:** VH-1  
**Estado:** Implementado en presentación frontend  
**Fecha:** 2026-09-20  
**Alcance:** handoff/análisis posterior a clarification y Guided Exploration.

## Scope guard

Esta slice modifica únicamente la composición visual del handoff en `PortfolioEntryExperience.tsx`, sus tests focales y una assertion E2E dependiente del heading antiguo. No modifica backend, DTOs, handoff runtime, clarification, Guided Exploration, prompts, Prisma, Core, Steps, Portfolio Home, auth flow ni conversion semantics.

## Before

La primera vista de `HandoffReview` tenía:

1. `InsightPanel`: headline dinámico, support text, provenance chips y explicación extensa de provenance.
2. `BriefSection`: objetivo, decisión, situación y pendientes.
3. `StarteriaRoute`: cinco cards visibles.
4. `EarlyAccessCard`: promesa, cinco beneficios, una segunda ruta anidada, CTA y guardrails.

Esto mezclaba comprensión, decisión, approach, ruta futura y conversión en una misma jerarquía. `understanding`, `desired_outcome`, `decision_to_enable`, gaps, path y provenance podían repetirse antes del CTA.

## After

La primera vista ahora tiene exactamente cuatro bloques principales:

1. **Esto estoy entendiendo** — `understanding` visible en una o dos frases, con `desired_outcome` solo cuando añade contexto no repetido y provenance compacta.
2. **Decisión que necesitas habilitar** — `decision_to_enable`, manteniendo `Aun por aclarar` cuando está unresolved.
3. **Cómo lo abordaría Starteria** — bloque dominante con hasta tres items.
4. **Lo que todavía puede cambiar la decisión** — hasta tres gaps, priorizando `unresolved_context` y después `evidence_or_clarity_needed`.

La ruta completa se conserva debajo de la primera vista como `handoff-starteria-path-secondary`. El CTA continúa funcionando y queda en la zona secundaria, sin cambio de destino, copy funcional, auth ni semantics.

## Merges and duplication removed from primary hierarchy

- `InsightPanel` + `BriefSection` se fusionaron en bloques directos de understanding y decision.
- El resumen de situación ya no aparece como una fila adicional.
- El bloque de pendientes ya no concatena cuatro elementos en primera vista; queda limitado a tres gaps.
- La ruta de cinco pasos dejó de estar dentro del CTA y dejó de competir con la propuesta principal.
- La explicación extensa de provenance permanece disponible, pero no se repite en cada bloque.
- `EarlyAccessCard` mantiene sus datos y acciones; solo deja de renderizar una ruta anidada duplicada.

## Content preserved

No se eliminó información contractual ni se cambió ningún significado. Se conservan:

- `understanding`;
- `desired_outcome`;
- `decision_to_enable`;
- `recommended_approach` y su fallback textual corto;
- `rationale`, `assumption` y `alternative_approaches` en las estructuras del handoff para VH-2;
- `known_context`;
- todos los `unresolved_context` y `evidence_or_clarity_needed` en el handoff;
- `starteria_path` completo;
- `recommended_cta`;
- provenance origins y resumen de procedencia;
- correction flow y `ConfirmedSummary`.

Cuando `starteria_path` no contiene una secuencia, VH-1 no intenta parsear semánticamente `recommended_approach.description`: muestra un único foco inicial truncado de forma segura y deja documentada la limitación para VH-2.

## Responsive treatment

- La primera vista usa una sola columna y los cuatro bloques se apilan.
- El approach usa hasta tres cards y puede apilarse en mobile.
- Los gaps se limitan a tres items.
- El path secundario usa la estructura existente responsive y ya no usa un grid horizontal de cinco pasos.
- No se añadieron breakpoints ni un lenguaje visual nuevo.

## Validation

| Check | Result |
|---|---|
| `npm run typecheck:front` | **PASS** |
| Focused `PortfolioEntryExperience.test.tsx` | **PASS** — 13 tests |
| `git diff --check` | **PASS** |
| Portfolio Entry E2E | **FAIL (infra/base)** — PostgreSQL y migraciones pasaron, pero el backend aislado no arrancó porque faltan archivos backend no trackeados en la base (`backend/modules/portfolio/invitation-recipient.router`); no corresponde a esta slice |

Los tests focales validan los cuatro bloques, una aparición de understanding/decision en first view, máximo tres pasos y gaps, provenance, path secundario, CTA, correction flow y confirmación.

## Remaining risks

### VH-2

- El detalle completo de rationale, assumptions, alternatives, evidence y provenance todavía no tiene disclosure único de análisis completo.
- Los gaps que exceden los tres visibles siguen preservados en memoria/DTO, pero aún requieren una superficie secundaria explícita.

### VH-3

- `EarlyAccessCard` conserva el copy y la lista de beneficios actuales.
- La compresión conceptual del CTA, su reassurance line y la unificación final con `ConfirmedSummary` quedan para VH-3.

## Contract / ADR

No se requiere ADR: el cambio es de jerarquía, composición y responsive presentation, sin alterar semántica, autoridad humana/IA, lifecycle, permisos, Core ni cardinalidades.
