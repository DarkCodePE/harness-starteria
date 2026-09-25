# Strategic Framing — Gap Prioritization Decision SF-5A v0.1

## HUMAN REVIEW CLARIFICATION

This clarification governs any less-specific wording elsewhere in this decision.

### Recommendation persistence

The live/current recommendation is **DERIVED**, recalculable, and never organizational truth. When a human confirms or changes a disposition, persist the recommendation snapshot that informed that decision for auditability, including recommendation version/context, rationale, and `sourceRefs` alongside the human decision snapshot. A later recomputation may differ without rewriting history.

`current recommendation != persisted human disposition != historical recommendation snapshot`

### Candidate identity and initial sources

Every durable noncanonical candidate requires `candidateId`, `kind: gap | opportunity`, statement snapshot, source candidate reference when available, source version, `sourceRefs`, provenance, and uncertainty/confidence when available. Text alone is not identity. Recalculation must not silently overwrite a human-reviewed candidate. No canonical `StrategicGap` is introduced.

Initial candidates are SF-derived Gaps and Opportunities. Bootstrap `AdvancementCondition` and existing portfolio context may support as evidence through governed adapters. Arbitrary manually-created candidates, lens-generated observations/candidates, and Copilot-created candidates are deferred unless repository evidence later requires them. A lens suggestion alone never creates a candidate.

### Capacity and dispositions

The representation remains `focusSlots: number | null`. When known, the recommender must not recommend more `ADDRESS NOW` candidates than declared capacity; human override is allowed and over-capacity produces an explicit warning, not a hard block. When null, the system may rank/explain materiality and trade-offs, must expose capacity uncertainty, and must not fabricate organizational capacity.

`ADDRESS NOW` is provisional focus, not Challenge. `OBSERVE` remains visible and reviewable indefinitely. `DISCARD` excludes the candidate from current focus, is reversible, and preserves history/evidence. Changing disposition creates versioned/auditable history when persisted.

### Persistence owner and SF-6 eligibility

SF-5B may add a dedicated additive JSON field/block such as `prioritizationState` to `StrategicFramingProvisionalState`. It must not overload sufficiency, provenance, blockers, softGaps, optionalContext, or lens-related state, and must participate in existing optimistic versioning/history semantics. No separate Prisma model is required unless implementation evidence proves the JSON block cannot preserve the required invariants.

Exact SF-6 eligibility:

`human-confirmed ADDRESS NOW + preserved candidate identity + provenance/evidence + current prioritization/framing version -> eligible for SF-6 promotion review`

`ADDRESS NOW != Challenge`. SF-6 must separately resolve/confirm Strategic Front and require explicit promotion.

### Clarification answers

- live recommendation persisted: NO; derived and recalculable
- recommendation snapshot with human decision: YES
- historical recommendation overwritten: NO
- stable identity required: YES
- text-only identity allowed: NO
- initial candidate kinds: SF-derived `gap`, `opportunity`
- lens suggestion can create candidate: NO
- `focusSlots`: `number | null`
- recommender respects known capacity: YES
- human override allowed: YES
- over-capacity behavior: explicit warning, no hard block
- unknown capacity behavior: uncertainty visible; no fabricated limit
- persistence owner: `StrategicFramingProvisionalState` additive noncanonical block
- dedicated additive field: YES
- existing semantic fields overloaded: NO
- participates in version/history: YES
- new Prisma model required: NO, unless JSON invariants prove insufficient
- schema change expected for SF-5B: YES, likely additive JSON field
- ADDRESS NOW equals Challenge: NO
- promotion eligibility: the exact SF-6 boundary above

**Estado:** GO_WITH_GAPS — decisión de diseño para revisión humana. No autoriza runtime.
**Slice:** SF-5A — decisión de estado y límites de priorización provisional.

## 1. Base de autoridad

Esta decisión aplica, en orden, `docs/STARTERIA_AUTHORITY.md`, el Core factual v0.2, el glosario/context map, el Experience Contract de Strategic Framing, los escenarios mentales, el acceptance checklist y la matriz de trazabilidad. También usa la auditoría SF-1, la decisión SF-3A, los reportes SF-2/SF-3B/SF-3C/SF-3D y la evidencia SF-4A/SF-4B/SF-4C.

Se preservan estas invariantes:

- `Gap != Challenge`; Opportunity tampoco es Challenge automáticamente.
- La IA o el sistema pueden recomendar; la autoridad organizacional material permanece humana.
- Cinco gaps con capacidad para uno no producen cinco Challenges.
- Un `ADDRESS NOW` es foco provisional, no trabajo activado, Invitation, Initiative, Step ni Challenge.
- Un Challenge canónico sigue perteneciendo a SF-6, requiere promoción humana explícita y Strategic Front resuelto/confirmado.
- Lenses son perspectivas, no gaps ni candidatos de prioridad.
- Suficiencia y priorización son evaluaciones distintas.

## 2. Evidencia del estado actual

### SF-2

`backend/modules/strategic-framing/strategic-framing.read-service.ts` compone un read model request-scoped. `framingSignals` contiene `observations`, `drivers`, `gaps` y `opportunities`; cada elemento es `DerivedFramingItem`, conserva `sourceRefs` y provenance y lleva `canonical: false`. Las condiciones de Bootstrap pueden adaptarse mediante `derived-condition:*`, pero siguen siendo señales derivadas, no estado de priorización.

El reporte SF-2 declara explícitamente que clustering, priorización, staging de Front/Challenge y Copilot quedan fuera. Bootstrap aporta Work Items, Strategic Connections, Advancement Conditions y Proposed Mutations como fuentes/evidencia; SF-1 clasifica Proposed Mutations como patrón reutilizable con adapter, no como modelo SF reutilizable sin adaptación.

### SF-3 provisional

`StrategicFramingProvisionalState` es un agregado SF-owned con scope de usuario/organización, `sourceMode`, clave lógica, `sourceRefs`, provenance, movimiento, por qué importa, señal, `horizonContext`, decisión, scope, parent context, suficiencia, versión e historial (`StrategicFramingProvisionalStateHistory`). El servicio soporta inicialización, re-entry, corrección humana, control de versión optimista y trazabilidad de actor/razón.

Actualmente no persiste una colección gobernada de gaps/opportunities ni decisiones de priorización. `horizonContext` ya existe y no debe duplicarse.

### SF-4

SF-4B devuelve sugerencias de lenses deterministas, derivadas y efímeras. SF-4C las presenta read-only; seleccionar/explorar/descartar no crea Observation, Gap, Challenge ni cambia suficiencia. Por tanto, la interacción lens no es storage de priorización ni fuente suficiente para fabricar un candidato.

### Multi-entry y límites

SF-3D converge `public_entry`, `enterprise_direct` y `existing_portfolio` al mismo estado provisional y superficie. La diferencia de entrada aporta provenance/evidencia, no una taxonomía distinta de prioridad. No hay escrituras canónicas de Front, Challenge, Initiative ni CandidateChallenge en esta superficie.

## 3. Problema

SF-5 debe permitir revisar varios gaps u opportunities bajo una restricción de foco —por ejemplo, cinco candidatos y `focusSlots = 1`— y producir una recomendación explicable junto con la disposición humana. Debe conservar incertidumbre, dependencias, horizonte y evidencia sin convertir ranking en verdad organizacional ni borrar candidatos no elegidos.

## 4. Identidad del candidato

El concepto mínimo es `StrategicFramingPriorityCandidate`, pero únicamente como nombre conceptual no canónico y SF-owned. Representa una referencia provisional a un `DerivedFramingItem` de tipo `gap` u `opportunity`, o a una fuente adaptada aprobada. No es `StrategicGap`, no es una nueva verdad de dominio y su persistencia no eleva su autoridad.

Un candidato conserva:

- `candidateId` estable dentro del estado y `kind: gap | opportunity`;
- statement/label provisional;
- `sourceRefs[]`, provenance y nivel de evidencia disponible;
- `origin: derived | suggested | human_added | adapted_source`;
- snapshot/version de la fuente usada;
- dimensiones conocidas y uncertainty visible;
- disposición actual y recommendation snapshot, separadas.

Drivers y Observations explican o respaldan; no se convierten automáticamente en priority candidates.

## 5. Fuentes legales

Para SF-5 inicial:

1. `SF-2 DerivedFramingItem` de `gaps` y `opportunities`, con `canonical: false` y refs verificables.
2. Advancement Conditions de Bootstrap sólo mediante adapter explícito que preserve su origen y no los trate como estado SF canónico.
3. Evidencia existente expuesta por SF-3D/read model, sólo cuando el adapter pueda conservar identidad, origen e incertidumbre.

Se difieren para una slice posterior los candidatos añadidos manualmente como flujo nuevo, la generación desde exploración de lenses y fuentes nuevas de SF-5. Una lens suggestion sola nunca fabrica candidato.

## 6. Opciones de persistencia

| Opción | Evaluación |
|---|---|
| A. Sólo efímera | Insuficiente para re-entry, revisión material, historial y continuidad humana. |
| B. JSON aditivo en `StrategicFramingProvisionalState` | Reutiliza ownership, scope, versionado, historial, provenance y concurrencia; mantiene un único estado provisional. Es la opción mínima. |
| C. Agregado SF no canónico separado | Da aislamiento, pero duplica lifecycle, autorización, re-entry e historial sin evidencia de necesidad en SF-5. |
| D. Modelo canónico `StrategicGap` | Rechazado: introduce semántica no autorizada y acerca incorrectamente a SF-6. |

## 7. Modelo seleccionado

Seleccionar **B, parcialmente**: en SF-5B se añadirá un bloque JSON aditivo, explícitamente `nonCanonical`, dentro de `StrategicFramingProvisionalState`. No se reutilizarán semánticamente `sufficiencyStatus`, `blockers`, `softGaps`, `optionalContext`, `provenance` ni `horizonContext` para guardar la colección.

El bloque conceptual puede llamarse `prioritizationContext` y contener `schemaVersion`, candidatos, `focusCapacity`, `prioritizationHorizon` opcional, recommendation snapshots y metadatos de revisión. Su owner es el estado provisional SF existente. El bloque no cambia el significado de la entidad ni de sus campos actuales.

La persistencia debe ser versionada con el `expectedVersion` existente. Cada corrección material genera el snapshot histórico existente con actor, timestamp, acción y razón. El sistema debe conservar la versión de candidatos/evidencia sobre la que calculó una recomendación para detectar stale inputs; no debe presentar una recommendation snapshot como confirmación humana.

No se cambia Prisma en SF-5A. La probabilidad de una extensión JSON en el modelo existente para SF-5B+ es alta; no se necesita un nuevo modelo Prisma.

## 8. Recomendación frente a disposición humana

Separar obligatoriamente:

- `recommendedDisposition`: `address_now | observe | discard`, producida por reglas/advisor explicable;
- `humanDisposition`: `address_now | observe | discard | undecided`, inicialmente `undecided` si no hay acción humana;
- `recommendationRationale[]`, `recommendationVersion` y `inputSnapshotVersion`;
- `humanDecision`: actor, timestamp, razón opcional y versión aplicada.

La recommendation puede persistirse como snapshot parcial para re-entry y auditoría de qué sugirió el sistema; su validez debe poder recalcularse ante cambios de evidencia/capacidad/horizonte. Nunca se escribe `humanDisposition` automáticamente a partir de ella.

## 9. Capacidad

La mínima representación segura es `focusSlots: number | null` dentro de un contexto provisional, con `1` expresando exactamente el caso de cinco candidatos y capacidad para uno. `null` significa desconocida, no capacidad cero. Puede acompañarse de una nota/rationale humana; no representa headcount, presupuesto ni planificación empresarial.

No se introduce un modelo general de recursos ni una fórmula numérica universal.

### Múltiples ADDRESS NOW

Se permiten cuando `focusSlots > 1`. Si `focusSlots = 1`, el sistema recomienda como máximo uno. Si la persona confirma más, se conserva la autoridad humana pero se muestra conflicto explícito de capacidad, sin ocultar ni deshacer silenciosamente la selección. Con capacidad desconocida, se permiten disposiciones humanas y se muestra advertencia de que no existe validación de límite.

La regla por defecto es **WARN**, no hard block: el sistema recomienda respetar capacidad y hace visible el exceso; una autoridad humana puede override con razón.

## 10. Horizonte

SF-5 reutiliza `horizonContext` como contexto de la framing existente. No lo sobrescribe ni lo interpreta como una segunda fuente de verdad. Sólo si se demuestra una distinción material se permitirá un `prioritizationHorizon` opcional, con provenance y relación explícita con el contexto base; no es obligatorio para el primer corte.

## 11. Dimensiones de priorización

| Dimensión | Estado en SF-5 |
|---|---|
| Impact | input opcional; puede ser afirmado, derivado o incierto, siempre etiquetado. |
| Urgency | input opcional; evidencia/rationale visible. |
| Horizon | input contextual; reutiliza `horizonContext`; extensión opcional. |
| Capacity | constraint editable mínima: `focusSlots`. |
| Dependencies | contexto opcional y relación simple de precedencia/bloqueo. |
| Uncertainty | obligatorio como visibilidad de calidad/ausencia de evidencia, no como penalización automática. |

No hay score universal ni leaderboard. Una recomendación puede ser parcial si faltan dimensiones; la falta se explica como incertidumbre o información pendiente, no como bloqueo automático.

## 12. Semántica de recommendation

SF-5 puede devolver orden recomendado y disposición recomendada, porque el orden explica comparación y la disposición expresa la decisión provisional. Debe soportar empates, `uncertain` y `needs_clarification` cuando la evidencia no permite una preferencia defendible.

Cada recomendación debe responder, con datos disponibles:

- por qué ahora;
- por qué no ahora;
- qué restricción de capacidad/horizonte pesa;
- qué dependencia o incertidumbre cambia la recomendación;
- qué `sourceRefs` la sostienen.

Un orden no equivale a prioridad confirmada. Ningún score oculto puede presentarse como verdad organizacional.

## 13. Disposiciones

- **ADDRESS NOW:** foco provisional confirmado o recomendado para el horizonte actual. No crea Challenge, Invitation, Initiative, Step ni activa trabajo. Puede quedar sin promoción posterior.
- **OBSERVE:** visible y trazable, no promovido ahora; puede reconsiderarse si cambian evidencia, capacidad, dependencia u horizonte. Puede permanecer indefinidamente.
- **DISCARD:** no se mantiene en el foco de la priorización actual, por irrelevancia contextual o rechazo explícito por ahora. Es reversible/histórico; no borra el candidato, refs, evidencia ni decisiones anteriores.

## 14. Confirmación humana

Son acciones materiales y explícitas: aceptar recommendation; escoger otro candidato como `ADDRESS NOW`; mover a `OBSERVE`; marcar `DISCARD`; editar `focusSlots`/contexto; y añadir rationale. Cada acción persistida lleva actor, tiempo, versión esperada y razón cuando exista. Un refresh, ranking o cálculo del sistema no cuenta como confirmación.

## 15. Dependencias y incertidumbre

SF-5 usa relaciones simples: `blocked_by`, `precedes` o `related`, con refs y estado provisional. Una dependencia puede impedir recomendar `ADDRESS NOW`, justificar `OBSERVE` o explicar que otro candidato precede; no se crea un grafo empresarial completo.

La incertidumbre se muestra por candidato y por recommendation. Un impacto alto con evidencia débil puede quedar `OBSERVE`, `ADDRESS NOW` con rationale de “validar primero”, o `needs_clarification`; nunca se deduce automáticamente que incertidumbre equivale a baja prioridad.

## 16. Provenance

Cada candidato conserva refs de fuente, origen y provenance. Cada recommendation conserva algoritmo/regla y versión, timestamp, input snapshot y refs usadas. Cada disposición humana conserva actor, timestamp, rationale y versión/historial. No se fabrican refs ni se promueve provenance `derived`/`ai_suggested` a `user_confirmed` sin acción humana.

## 17. Suficiencia

`prioritization != sufficiency checklist`. Una framing puede ser suficiente para priorizar aunque tenga candidatos inciertos; un candidato `OBSERVE` no hace insuficiente toda la framing. La priorización no reescribe mecánicamente `sufficiencyStatus`, blockers, soft gaps ni optional context. Dimensiones faltantes son visibles y sólo bloquean si una autoridad posterior lo define explícitamente; SF-5A no lo define.

## 18. Lenses

La cadena protegida es:

`Lens suggestion != Observation != Gap/Opportunity != prioritization candidate`.

SF-4 no genera candidatos. Una futura exploración podría aportar evidencia o una observación provisional mediante contrato propio, pero la selección de una lens no entra automáticamente en la colección ni crea un Gap.

## 19. Handoff a SF-6

El límite exacto es:

`human-confirmed ADDRESS NOW noncanonical candidate + evidence/provenance + current provisional framing state`
`→ eligible input for SF-6 promotion review`.

`ADDRESS NOW != Challenge`. SF-6 debe todavía resolver o confirmar el Strategic Front, ejecutar una acción de promoción humana explícita, verificar sus criterios y crear el Challenge canónico sólo dentro de los límites Core. Si no hay promoción, la persona puede continuar, observar o revisar sin crear nada canónico.

## 20. UI conceptual

La UI objetivo muestra “Prioridades para este frente”, capacidad de foco y tres agrupaciones visibles: `ADDRESS NOW`, `OBSERVE`, `DISCARD`. Cada tarjeta muestra evidencia, rationale, incertidumbre, dependencias, provenance, recomendación vs decisión humana y acción de revisión/reasignación.

Debe conservar todos los candidatos en traceability, advertir exceso de capacidad y permitir continuar sin promover. No debe usar leaderboard de score como verdad, drag-and-drop como única autoridad, auto-promoción ni remainder oculto.

## 21. Multi-entry invariance

El mismo modelo, disposiciones, capacidad y límites se aplica a `public_entry`, `enterprise_direct` y `existing_portfolio`. Sólo cambian source mode, provenance y evidencia adapterizada. No se crean taxonomías ni reglas de prioridad por canal.

## 22. Clasificación ADR / Core / schema

- **Core change required:** NO.
- **ADR required now:** NO, mientras la solución permanezca como estado SF-owned no canónico y no altere Front/Challenge, roles, cardinalidades o lifecycle.
- **Schema change likely for SF-5B+:** YES — extensión JSON aditiva en el agregado existente es la opción probable; no es un nuevo modelo.
- **Canonical `StrategicGap` introduced:** NO.

Elevar a ADR y detenerse si aparece cualquier necesidad de `StrategicGap`/Observation canónico, Challenge automático o sin Front, nueva autoridad organizacional de IA, cambio Front→Challenge, cambio de identidad/lifecycle de Initiative o cambio material de roles.

## 23. Stop conditions

Detener SF-5B+ si:

- se propone borrar o reemplazar history/sourceRefs;
- una recommendation se guarda como confirmación humana;
- se sobrecargan suficiencia, provenance o lens interaction;
- un candidate derived se trata como canon por estar persistido;
- se introduce scoring opaco obligatorio o un modelo de capacidad empresarial;
- se auto-crea Front, Challenge, Initiative, Invitation o Step;
- se permite Challenge sin Front resuelto/confirmado;
- una lente sola fabrica un candidate;
- una entrada/source mode cambia la taxonomía de prioridad.

## 24. Descomposición recomendada

La descomposición propuesta es segura y debe mantenerse:

1. **SF-5A — decisión de estado:** este documento, invariantes, ownership y límites.
2. **SF-5B — persistencia/aplicación provisional:** bloque aditivo, re-entry, optimistic concurrency, history, provenance y acciones humanas; sin schema nuevo canónico.
3. **SF-5C — recomendación/read capability:** reglas deterministas y explicables, sin score obligatorio, con stale-input detection y multi-entry invariance.
4. **SF-5D — workspace UI:** revisión, reasignación, capacidad, tres disposiciones y evidencia; sin promoción canónica.
5. **SF-5E — verificación de límites:** negative tests para no auto-Challenge, no sufficiency rewrite, no lens candidate, capacidad visible y trazabilidad.

No se recomienda reducirla: persistencia, recommendation, UI y verificación tienen riesgos y contratos distintos. Ninguna se implementa en SF-5A.

## 25. Criterios de aceptación para la siguiente slice

- Five provisional gap/opportunity candidates with `focusSlots = 1` remain visible.
- Recommendation and `humanDisposition` are distinct; recommendation never confirms human priority.
- Re-entry returns candidates, dispositions, provenance, recommendation input/version and history.
- Human changes use optimistic versioning and preserve actor/time/rationale.
- Multiple `ADDRESS NOW` are allowed over capacity only with explicit warning/audit.
- Unknown capacity is visible and does not silently mean zero.
- `OBSERVE` can remain indefinitely and `DISCARD` preserves history/evidence.
- Missing dimensions and uncertainty are visible without an automatic sufficiency rewrite.
- Lenses do not become candidates automatically.
- Same behavior holds for all three entry modes.
- No write occurs to canonical Front, Challenge, Initiative, Invitation or Step; no Copilot is required.
- Human-confirmed `ADDRESS NOW` produces only an SF-6 eligibility handoff, never a Challenge.

## 26. Explicit answers

| Question | Answer |
|---|---|
| Are Gap/Opportunity candidates canonical? | NO |
| Should prioritization decisions survive re-entry? | YES |
| Should system recommendation be persisted? | PARTIAL — versioned recommendation snapshot/input provenance, never human confirmation |
| Should human disposition be persisted? | YES |
| Should human disposition be auditable/versioned? | YES |
| Do we need a new Prisma model? | NO |
| Can existing `StrategicFramingProvisionalState` safely own this state? | PARTIAL — via additive noncanonical prioritization block |
| Should existing sufficiency fields be overloaded? | NO |
| Should existing lens fields/interactions be reused? | NO |
| Can ADDRESS NOW exist without Challenge? | YES |
| Can OBSERVE remain indefinitely? | YES |
| Does DISCARD erase history? | NO |
| Can multiple ADDRESS NOW exist? | CONDITIONAL — yes when capacity allows; override remains possible with warning |
| Must ADDRESS NOW respect focus capacity? | WARN |
| Can system auto-create Challenge from ADDRESS NOW? | NO |
| Does SF-5 modify canonical Front/Challenge? | NO |
| Can user continue without promoting anything? | YES |

## 27. Estado de decisión

SF-5A queda **GO_WITH_GAPS** para revisión humana. Los gaps restantes son deliberados: el formato exacto del JSON aditivo, el catálogo mínimo de dimensiones y las reglas concretas de recommendation deben cerrarse en SF-5B/SF-5C sin cambiar las fronteras de este documento.
