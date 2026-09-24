# Strategic Framing — Provisional State Decision SF-3A v0.1

**Estado:** `GO_WITH_GAPS` — decisión documental para revisión humana; no autoriza runtime.

**Slice:** SF-3A — estado provisional gobernado para Strategic Framing.

**Base auditada:** `main @ e3c2c2ff4e51cfb945795073ac0c5a2ebaa5ec00`.

## 1. Decision status

SF-3A concluye que el siguiente paso seguro es definir un estado provisional durable, propiedad del bounded context Strategic Framing, separado de los registros canónicos de Portfolio. Ese estado puede reutilizar patrones de Bootstrap —provenance, revisión humana, corrección, historial y snapshots—, pero no debe reutilizar `PortfolioBootstrapProposedMutation` como modelo de dominio ni ampliar su enum para resolver SF.

La decisión es `GO_WITH_GAPS` porque la dirección está suficientemente determinada para diseñar SF-3B, pero quedan por especificar en esa slice los límites de autorización, ownership multi-tenant, retención/versionado exactos y el adaptador de entrada para Enterprise Direct y Existing Portfolio.

SF-3A no implementa SF-3 ni modifica autoridad aprobada.

## 2. Authority basis

Se aplicó la jerarquía indicada en `docs/STARTERIA_AUTHORITY.md`:

1. Core factual v0.2 en `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
2. Experience Contract aprobado `STRATEGIC_FRAMING_EXPERIENCE_CONTRACT_v0.1.md`.
3. Mental models, checklist, traceability matrix, implementation sequence y context de Strategic Framing.
4. Auditoría actual SF-1 y evidencia de implementación SF-2.

Se preservan estas reglas: `Portfolio Anchor != Strategic Front`; inferencia de IA != confirmación humana; `Work Item != Initiative`; `Structured workspace = system of record`; Copilot es una capa cognitiva; y no hay creación automática de Challenge.

## 3. Problem statement

SF-2 produce una lectura provisional, pero no ofrece todavía un lugar gobernado donde la persona pueda corregir, completar y revisar esa comprensión sin crear prematuramente un Front o Challenge canónico.

El estado necesario debe permitir que una entrada `front_like`, `challenge_like`, `initiative_like` o `unresolved` continúe el framing. En particular, `challenge_like` no puede obligar a inventar un Front solo para satisfacer la relación obligatoria `Challenge.strategicFrontId`.

## 4. Current-state evidence

### SF-2

`StrategicFramingReadService` es una composición request-scoped/in-memory. Puede entregar:

- contexto y modo de origen;
- Anchor interpretado con movimiento, relevancia, señal/proxy, decisión, provenance y parent context;
- evaluación provisional `front_like`, `challenge_like`, `initiative_like` o `unresolved`;
- trabajo existente con estado, `ownerCandidate`, alignment y source refs;
- observaciones, drivers, gaps y oportunidades derivadas, siempre `canonical: false`;
- blockers, soft gaps, optional context y next best action.

No persiste ediciones, no crea rutas, no invoca Copilot y no ejecuta mutaciones.

### Portfolio Bootstrap

`PortfolioBootstrapSession` exige en su modelo un contexto de Bootstrap y puede referenciar `sourceContinuationId`. `PortfolioAnchor` es uno por sesión, con status, source refs, provenance, confirmación y `PortfolioAnchorHistory`. Work Items, conexiones y advancement conditions tienen staging y revisión gobernada.

`PortfolioBootstrapProposedMutation` ofrece un buen patrón de revisión: valor original/propuesto/corregido, rationale, provenance, uncertainty, materiality, actor, timestamp y estado. Sin embargo, depende de `bootstrapSessionId` y `analysisRunId`, y su enum solo admite:

```text
work_item | strategic_connection | advancement_condition | portfolio_anchor
```

No representa candidato Front ni candidato Challenge. El análisis actual tampoco los produce.

### Canonical Portfolio

`StrategicFront` se escribe directamente mediante `PortfolioService.createStrategicFront/updateStrategicFront`. `Challenge.strategicFrontId` es obligatorio y `createChallenge` primero requiere un Front válido. La UI existente crea/actualiza directamente y además conserva un mismatch separado entre campos visuales y persistidos.

Por tanto, esos servicios y adapters no son staging reutilizable para SF. SF1-F02 permanece fuera de alcance.

### Multi-entry

Public Entry tiene continuación real hacia Bootstrap. Enterprise Direct no tiene todavía una frontera de interpretación gobernada y Existing Portfolio no tiene caller de interpretación/reverse alignment. Hacer obligatorio `sourceContinuationId` convertiría Bootstrap en gateway universal y no cubriría los tres modos aprobados.

## 5. Option comparison

| Opción | Resultado | Motivo decisivo |
|---|---|---|
| A. Adaptar `PortfolioBootstrapProposedMutation` | `PARTIAL`, no recomendada como modelo | Reutiliza revisión/provenance, pero acopla SF a sesión y análisis Bootstrap, carece de targets SF y hace ambiguo si Enterprise Direct/Existing Portfolio deben fabricar una continuación. Ampliar el enum no es automáticamente correcto. |
| B. Persistencia provisional propiedad de SF | `RECOMMENDED` | Soporta los tres orígenes, refresh/re-entry, edición directa, contexto padre conocido/provisional/no resuelto y una futura promoción sin escribir entidades canónicas. Es una nueva frontera de staging, no una redefinición de Core por sí misma. |
| C. Estado efímero frontend/request-scoped | `INSUFFICIENT` | No sobrevive refresh/re-entry, no ofrece auditabilidad ni provenance durable y rompe la convergencia Direct/Mixed/Copilot. Contradice el structured workspace como system of record. |
| D. Híbrido con adapter | `RECOMMENDED AS INPUT PATTERN` | Leer Anchor/Work Items/Entry evidence desde sus propietarios y proyectarlos a un estado SF propio minimiza duplicación sin hacer de Bootstrap el gateway. No debe crear dos estados editables paralelos. |

## 6. Recommended target

SF debe tener una frontera conceptual de **Strategic Framing provisional workspace/session**. El nombre de modelo Prisma queda deliberadamente abierto para SF-3B; no se fija aquí como hecho.

El estado debe:

- ser durable y reentrante, con una instancia de framing por contexto de trabajo/origen gobernado;
- conservar source mode, source refs y provenance por valor material;
- almacenar la snapshot inicial de SF-2 y una versión editable separada;
- distinguir `derived/source`, `human_corrected`, `human_confirmed` y `unresolved`;
- representar parent context `known`, `provisional` o `unresolved`;
- conservar un sujeto de framing aunque todavía no sea Front, Challenge o Initiative;
- permitir edición directa sin Copilot;
- aceptar más tarde propuestas de Copilot sobre el mismo estado estructurado;
- conservar suficiente history para reconstruir correcciones y supersession;
- exponer una frontera explícita para promoción humana posterior.

La reutilización recomendada es de patrones y adaptadores, no de ownership de persistencia:

```text
Entry / Bootstrap / Portfolio snapshots
        → SF input adapter
        → SF provisional structured state
        → human review/correction
        → governed promotion boundary
```

## 7. Conceptual provisional state

Estos son conceptos requeridos, no nombres obligatorios de campos.

### Source/context

- source mode: `Public Entry`, `Enterprise Direct` o `Existing Portfolio/imported work`;
- source references y provenance;
- actor, timestamps y contexto organizativo/autorización;
- snapshot de entrada y referencia de la última composición SF-2.

### Strategic understanding

- intended movement;
- why it matters;
- movement signal/proxy, separado de contribution signal y business outcome;
- horizon/context cuando sea material;
- decision to enable cuando exista.

### Scope assessment

Debe conservar `front_like`, `challenge_like`, `initiative_like` o `unresolved`, junto con confianza, rationale, source/derived provenance y corrección humana. La clasificación no puede depender solo de palabras ni convertirse en entidad canónica.

### Parent context

Debe conservar estado `known`, `provisional` o `unresolved`, referencias a un padre existente cuando corresponda y rationale de alineamiento. Una referencia provisional no es un FK canónico ni confirma una relación.

### Editable framing subject

Para `front_like`, el workspace puede editar una forma provisional de: resultado deseado, por qué importa, señal/KPI o proxy, baseline/target cuando existan, horizonte, restricciones/contexto, gobernanza sugerida, drivers, gaps y oportunidades.

Para `challenge_like`, debe conservar el problema, fricción, riesgo o bloqueo, su movimiento afectado, evidencia, drivers/gaps, prioridad provisional y relación padre pendiente; no debe crear un Challenge canónico. Para `initiative_like`, debe conservar el trabajo/intervención y hacer visible el outcome o parent context que falta. Para `unresolved`, debe conservar la intención y las incertidumbres sin forzar clasificación.

### Sufficiency and alignment

Debe separar `blocker`, `soft gap` y `optional context`. La suficiencia no es completitud de formulario ni cobertura de lenses. El alignment debe soportar al menos `aligned`, `partially aligned`, `pending/unknown` y `not aligned/out of priority` cuando Core lo permita.

`ownerCandidate` continúa siendo una sugerencia de procedencia, nunca ownership.

## 8. Multi-entry behavior

### Public Entry

La continuación existente puede aportar handoff, provenance y Bootstrap Anchor/Work Items. SF debe leer esos snapshots mediante adapter y crear/abrir su propio estado provisional. La continuación puede ser una fuente de entrada, no una dependencia universal del estado SF.

### Enterprise Direct

Un usuario autenticado debe poder iniciar framing con un contexto de organización/permisos y una interpretación directa, sin inventar estado público ni `sourceContinuationId`. SF-3D deberá definir el adaptador y el control de autorización antes de implementar la ruta.

### Existing Portfolio

SF puede leer Fronts, Challenges, Initiatives o trabajo importado para reverse alignment. Puede cuestionar o reinterpretar, pero no reescribe silenciosamente estructuras existentes. Las relaciones pendientes deben permanecer en el estado provisional, con source refs a los registros inspeccionados.

Los tres caminos producen el mismo structured state y no tres modelos de edición.

## 9. Human/Copilot interaction boundary

`DIRECT` cambia directamente el valor editable y dispara una nueva evaluación de suficiencia/alignment.

`MIXED` permite que Copilot proponga una modificación o una observación; la persona acepta, corrige o descarta. La propuesta queda registrada antes de aplicarse si es material.

`COPILOT` solo puede proponer estructura sobre el mismo workspace. No obtiene lifecycle privado, no confirma por sí mismo y no crea Front/Challenge.

Todo valor material debe mostrar, conceptualmente, su origen, incertidumbre y estado de revisión. El workspace sigue siendo el system of record y el framing debe poder completarse sin Copilot.

## 10. Persistence/history requirements

SF-3B debe incluir el mínimo durable siguiente:

- identidad del estado provisional y vínculo a usuario/organización con autorización;
- source mode, source refs y snapshot de entrada;
- versión actual editable y valores de provenance;
- actor y timestamp por corrección/confirmación material;
- original derived value frente a corrected value cuando difieran;
- estado de revisión, superseded/active y motivo de descarte si aplica;
- linkage a propuestas futuras de Copilot sin convertirlas en verdad;
- idempotencia/reentrada para no duplicar una sesión lógica.

Debe reutilizar el rigor de `PortfolioAnchorHistory` y de `ProposedMutation`, pero no copiar todo su esquema ni duplicar un historial por cada subsistema. El nivel exacto de event sourcing, retención y granularidad queda para SF-3B; no es necesario sobrediseñarlo en SF-3A.

## 11. Canonical promotion boundary

SF-3 puede llegar conceptualmente hasta:

```text
SF-2 read snapshot
  → editable provisional state
  → human correction/review
  → sufficient provisional framing
```

Queda fuera de la edición ordinaria: crear/actualizar Strategic Front canónico, crear Challenge, Invitation, Accept, Initiative activation, Project, Step o Portfolio Home integration.

Incluso si una persona confirma que un estado `front_like` está suficientemente claro, la escritura canónica debe ser una acción de promoción explícita y una sub-slice separada, con revisión de permisos, mapping y evidencia. No pertenece automáticamente a SF-3C.

## 12. Candidate Challenge treatment

No se necesita una entidad durable `candidate Challenge` separada en SF-3. Es suficiente un sujeto de framing `challenge_like` dentro del estado provisional, con evidencia, gaps, prioridad, parent context y estado de revisión.

El candidato durable puede evaluarse en SF-5/SF-6 si las necesidades de priorización/promoción lo demuestran. La frontera aprobada permanece:

```text
candidate Challenge
  → resolve/select/confirm Strategic Front
  → explicit human promotion
  → canonical Challenge
```

Mientras el Front siga no resuelto, `Challenge.strategicFrontId` continúa obligatorio y no se crea Challenge huérfano ni se inventa un Front.

## 13. ADR classification

```text
ADR REQUIRED FOR SF-3 IMPLEMENTATION: NO, condicionado.
```

Una persistencia provisional no canónica propiedad de SF es, en principio, una decisión normal de implementación/bounded context y no cambia Core, roles, identidad de Initiative, cardinalidad Front → Challenge ni autoridad de IA.

Debe detenerse y elevarse un ADR si SF-3 requiere cualquiera de estos cambios: entidad canónica `StrategicLens`, `StrategicObservation` o `StrategicGap`; nueva autoridad de IA; creación automática de Challenge; Front → Challenge nullable o nueva cardinalidad; cambio de roles Core; nueva identidad/lifecycle de Initiative; o promoción automática/materialmente implícita.

```text
Core change required: NO.
Approved SF-0 amendment required: NO for the provisional-state clarification; YES only if the approved sequence is formally renamed or its semantics are changed.
```

La aclaración recomendada es semántica: interpretar el aprobado `Editable Front Workspace` como `Editable Strategic Framing Workspace / provisional Front-shaped state` para cubrir entradas no `front_like`. No se reescribe silenciosamente el documento aprobado; se registra esta aclaración para la siguiente decisión de implementación.

## 14. Explicit non-actions

SF-3A no modifica Core, Prisma, migraciones, backend/frontend runtime, rutas/endpoints, Portfolio Entry, Bootstrap, Portfolio Home, Copilot capabilities, Fronts, Challenges, Projects, Initiatives, Steps, Kubernetes/CD, SF-2 ni tests.

No amplía `PortfolioBootstrapProposedMutationTargetType`, no reutiliza servicios canónicos como staging y no crea candidato Challenge persistido.

## 15. SF-3 implementation decomposition

Se recomienda esta descomposición controlada:

1. **SF-3A — provisional state decision:** este documento; opción, semántica, límites y criterios.
2. **SF-3B — SF-owned staging/application state:** contrato de persistencia, adapter de snapshots, authorization, version/history y read/write service; sin promoción canónica.
3. **SF-3C — structured editable workspace:** edición Direct, suficiencia, provenance, unresolved parent y sujetos `front_like`/`challenge_like`/`initiative_like`/`unresolved`; sin Copilot obligatorio.
4. **SF-3D — multi-entry orchestration:** Public Entry adapter, Enterprise Direct y Existing Portfolio/reverse alignment; sin fabricar continuación pública.
5. **SF-3E — boundary tests:** refresh/re-entry, provenance, human correction, no canonicalization, unresolved parent, all three modes and no-Copilot completion.

Copilot proposal integration y promoción a entidades canónicas permanecen en slices posteriores cuando exista contrato y autorización explícitos.

## 16. Acceptance criteria for the next implementation slice

SF-3B no estará lista para revisión si no demuestra:

- un estado provisional durable separado de `StrategicFront` y `Challenge`;
- creación/continuación segura para Public Entry, Enterprise Direct y Existing Portfolio;
- refresh/re-entry sin perder correcciones ni source refs;
- valores derived, corrected, confirmed y unresolved distinguibles;
- parent context `known`, `provisional` y `unresolved` sin FK canónico inventado;
- `front_like`, `challenge_like`, `initiative_like` y `unresolved` editables sin forced Front;
- alignment y sufficiency con blocker/soft gap/optional context;
- `ownerCandidate` no tratado como ownership;
- Direct funcional sin Copilot;
- una futura propuesta Copilot dirigida al mismo estado, con aceptación humana explícita;
- ausencia verificable de creación de Front/Challenge/Initiative/Project/Step;
- controles de permisos, actor, timestamp, idempotencia y revisión de materialidad;
- boundary tests para no-auto-Challenge y `Challenge.strategicFrontId` obligatorio;
- ningún cambio de Core o schema no justificado por una decisión posterior.

## Final report

```text
SF-3A STATUS: GO_WITH_GAPS

BRANCH: design/strategic-framing-sf3-provisional-state
BASE HEAD: e3c2c2ff4e51cfb945795073ac0c5a2ebaa5ec00

DECISION ARTIFACT:
docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_PROVISIONAL_STATE_DECISION_SF3A_v0.1.md

FILES CHANGED:
- decision document: YES
- runtime files: NO
- schema/migrations: NO
- any unrelated files: NO

CURRENT STATE:
- Bootstrap ProposedMutation reusable as-is: NO
- Bootstrap ProposedMutation suitable with adapter: PARTIAL
- ephemeral-only state sufficient: NO
- Strategic Framing-owned provisional state needed: YES

TARGET:
- canonical Front written during ordinary editing: NO
- canonical Challenge written during ordinary editing: NO
- parent context may remain unresolved: YES
- challenge_like may continue without invented Front: YES
- structured state supports Direct without Copilot: YES
- future Copilot converges on same state: YES

CANDIDATE CHALLENGE:
- required as durable SF-3 entity now: NO
- deferred safely: YES
- canonical Challenge still requires confirmed/resolved Front: YES

MULTI-ENTRY:
- Public Entry covered conceptually: YES
- Enterprise Direct covered conceptually: YES
- Existing Portfolio covered conceptually: YES
- Public Entry continuation required for all paths: NO

AUTHORITY:
- Core change required: NO
- ADR required for SF-3 implementation: NO, unless a stop condition is triggered
- approved SF-0 amendment required: NO for clarification; YES if the sequence is formally renamed/semantically changed
- reason: provisional non-canonical staging preserves current Core and SF-0 boundaries; canonical entities, AI authority and lifecycle changes remain ADR stop conditions.

NEXT IMPLEMENTATION SLICE:
SF-3B — Strategic Framing-owned durable provisional staging/application state, with input adapters for SF-2/Entry/Bootstrap/Portfolio, provenance/history/review and no canonical promotion.

VALIDATION:
- git diff --check: PASS (to be verified after write)
- only decision artifact changed: YES (to be verified after write)

READY FOR HUMAN REVIEW:
YES

READY TO IMPLEMENT SF-3:
NO — ready only for the separately reviewed SF-3B implementation slice.
```
