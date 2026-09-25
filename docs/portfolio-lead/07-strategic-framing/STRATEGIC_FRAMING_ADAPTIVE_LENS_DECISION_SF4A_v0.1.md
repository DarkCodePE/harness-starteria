# Strategic Framing — Adaptive Lens Suggestion Decision SF-4A v0.1

**Estado:** `GO_WITH_GAPS` — decisión documental para revisión humana; no autoriza runtime por sí sola.

**Slice:** SF-4A — decisión de representación y límites para Adaptive Lens Suggestions.

**Base:** `094e348ac879b376034843aa2d89c90e778c26e9` (`HEAD` verificado).

## 1. Authority basis

Esta decisión aplica, en orden, `docs/STARTERIA_AUTHORITY.md`, el Core factual v0.2,
`STRATEGIC_FRAMING_EXPERIENCE_CONTRACT_v0.1.md`, los escenarios de mental model, el
checklist de aceptación, la matriz de trazabilidad, la secuencia de implementación y
la evidencia SF-2, SF-3A, SF-3B, SF-3C y SF-3D.

Preserva estas invariantes: los lenses son perspectivas adaptativas y vocabulario
candidate; no son secciones obligatorias, jerarquía canónica, Challenges ni criterio
de completitud; el workspace estructurado es el system of record; la suficiencia no
depende de cobertura de lenses; Copilot es advisory; y ninguna inferencia crea un
Challenge automáticamente.

## 2. Current-state evidence

- SF-2 produce un read model no canónico con movimiento, relevancia, señal/proxy,
  decisión, contexto, observaciones, drivers, gaps, oportunidades, provenance y
  `sourceRefs`. No implementa lenses ni persistencia propia para ellos.
- SF-3A decidió un estado provisional durable propiedad de Strategic Framing,
  separado de `StrategicFront`, `Challenge` y `Initiative`.
- SF-3B implementó ese estado con versión, historial, provenance y corrección humana;
  `StrategicFramingProvisionalState` es el lugar existente para reentrada y revisión.
- SF-3C expone el workspace editable y mantiene la suficiencia como evaluación
  independiente y de solo lectura desde la UI.
- SF-3D hace converger `public_entry`, `enterprise_direct` y `existing_portfolio`
  hacia el mismo estado provisional y la misma superficie. Su certificación humana y
  algunos E2E siguen pendientes.

## 3. Problem statement

SF-4 debe responder: **¿qué perspectiva, si alguna, mejora materialmente la
comprensión o la decisión ahora?** Debe hacerlo sin convertir el framing en nueve
secciones, sin fabricar una metodología completa y sin crear entidades canónicas.

## 4. Options considered

| Opción | Evaluación | Decisión |
|---|---|---|
| A. Read model efímero solamente | Bajo coste y seguro, pero pierde selección/dismissal y auditabilidad al reentrar. | Insuficiente como solución completa. |
| B. Sugerencias durables dentro del estado provisional SF | Reutiliza versión, provenance y reentrada sin crear una entidad lens. | Base recomendada. |
| C. Nueva persistencia SF-owned | Permite historial detallado, pero duplica ownership y eleva coste/schema. | Rechazada para SF-4. |
| D. Híbrido | Calcula sugerencias desde el snapshot vigente; deja la persistencia de decisiones humanas para una decisión explícita de SF-4C. | Seleccionada con esa reserva. |

## 5. Selected representation model

SF-4 usa un **read model derivado/efímero** para las sugerencias:

```text
SF provisional state + source evidence
  → suggestion evaluator
  → explainable adaptive lens suggestions
  → optional human selection/dismissal/exploration in the UI
  → SF-4C persistence decision, if any
```

La sugerencia no es una entidad `StrategicLens`. Las sugerencias son `DERIVED / EPHEMERAL`:
se recomputan desde el estado provisional vigente y no se persisten como entidades.
Su salida conceptual mínima es `lens key`, label, razón de relevancia, pregunta
material, `sourceRefs`, confidence advisory y versión del estado usada para el cálculo.

La interacción humana es una preocupación separada. SF-4A no decide que
`selected`, `dismissed` o `explored` puedan guardarse dentro del estado provisional.
SF-4C debe elegir explícitamente entre estado de interacción no persistido o un campo
aditivo explícito propiedad de `StrategicFramingProvisionalState`. No se autoriza
sobrecargar `scopeAssessment`, `provenance`, `parentContext`, `blockers`, `softGaps`
u `optionalContext` con esa interacción. Si SF-4C elige persistencia, puede requerir
un cambio de schema, pero no requiere un modelo canónico `StrategicLens` separado.

**Decisión explícita:**

- sugerencias persistidas: `NO`;
- owner de sugerencias: ninguno; son read model derivado desde el estado SF vigente;
- modelo Prisma nuevo para SF-4B: `NO`;
- persistencia de interacción: `NO DECIDIDA` y fuera de SF-4A; la resolverá SF-4C;
- schema para SF-4B: `NO`;
- schema potencial para SF-4C: `YES`, sólo si SF-4C elige un campo aditivo explícito;
- historial: no se persiste cada recomputación; tampoco se presume persistencia de
  interacción hasta la decisión de SF-4C.

## 6. Candidate lens vocabulary

La biblioteca candidate permanece:

`Value / Outcome`, `Customer / Opportunity`, `Process / Capability`,
`Learning / Evidence`, `Financial`, `Culture / Organization`, `Technology`,
`Risk / Compliance`, `Ecosystem / Partners`.

Es vocabulario analítico, no taxonomía de producto ni esquema canónico. Un lens puede
producir cero, una o varias observaciones; una misma brecha puede ser explicada por
varios lenses. Añadir o renombrar vocabulario no puede introducir por sí solo una
entidad, un Challenge ni una regla de suficiencia.

## 7. Adaptive depth relationship

La profundidad es conceptual y adaptativa; no se persiste como enum canónico y no es
una puerta metodológica.

- `LIGHT` puede devolver cero lenses y sólo sugiere una perspectiva si reduce una
  incertidumbre material.
- `STANDARD` puede devolver uno o varios lenses cuando outcome, áreas, señales o
  incertidumbre lo justifican; no tiene un número fijo.
- `DEEP` puede justificar varias perspectivas, dependencias y perspectivas
  especializadas; **no** significa todos los lenses ni cobertura completa.

La profundidad ajusta el umbral de recomendación y el nivel de explicación, no la
suficiencia ni la obligación de explorar.

## 8. Suggestion eligibility

Una sugerencia requiere una combinación de contexto estructurado y evidencia o
provenance disponible. No se autoriza routing basado sólo en keywords. La evaluación
debe considerar, cuando existan:

| Perspectiva | Señal material posible |
|---|---|
| Value / Outcome | movimiento, outcome o camino de valor poco claro |
| Customer / Opportunity | usuario, necesidad, oportunidad o adopción inciertos |
| Process / Capability | cuello de botella, capacidad o dependencia operativa |
| Learning / Evidence | señal débil, hipótesis no probada o aprendizaje insuficiente |
| Financial | inversión, coste, retorno esperado o restricción financiera material |
| Culture / Organization | ownership, capacidades, incentivos o cambio organizativo |
| Technology | dependencia técnica, arquitectura, datos o viabilidad |
| Risk / Compliance | restricción regulatoria, riesgo o control material |
| Ecosystem / Partners | dependencia externa, proveedor, partner o red |

La ausencia de una señal no debe presentarse como evidencia de irrelevancia. El
resultado puede ser no sugerir ningún lens.

## 9. Explainability contract

Cada sugerencia visible debe poder responder, en lenguaje de usuario:

1. **Por qué es relevante ahora:** relación con un campo, incertidumbre o dependencia.
2. **Qué evidencia la sustenta:** `sourceRefs` y provenance disponibles.
3. **Qué incertidumbre reduce:** pregunta o decisión que ayuda a aclarar.
4. **Qué podría cambiar:** framing, prioridad, alineamiento o interpretación que podría
   variar si se explora.

Forma conceptual mínima:

```text
lensId              candidate identifier, not canonical entity id
label
reason
materialQuestion
sourceRefs
confidence           advisory, never causal certainty
suggestionState      suggested | selected | dismissed | explored
```

`confidence` describe la fuerza de la recomendación, no la verdad del dominio. Si no
hay fuente suficiente, la salida debe expresar incertidumbre y no inventar evidencia.

## 10. Human interaction states

Se mantienen cuatro estados conceptuales mínimos para la interacción, sin decidir aún
si serán persistidos:

- `suggested`: el sistema ofrece la perspectiva;
- `selected`: la persona decide explorarla;
- `dismissed`: la persona decide no explorarla ahora;
- `explored`: la perspectiva fue usada para una exploración, sin significar completa.

Seleccionar no canoniza el lens. Descartar no borra source evidence. Explorar no
marca un checklist ni produce automáticamente una observación, gap o Challenge.
SF-4C debe decidir si estos estados viven sólo en la UI o en un campo aditivo explícito
del estado SF. En ningún caso se guardan en los campos semánticos existentes listados
en la sección de persistencia. Si se persisten, actor y timestamp serán requisitos de
esa decisión; la recomputación derivada no necesita historial propio.

## 11. Observation / gap boundary

SF-4 se limita a **Adaptive Lens Suggestions**. No genera observaciones durables ni
promueve gaps. La relación conceptual que queda protegida para una slice posterior es:

```text
Lens → zero / one / many provisional observations
Observation → Driver / Gap / Opportunity
```

La posible generación de prompts u observaciones lens-derived pertenece a SF-5 o a
una slice posterior con contrato propio. Ningún lens, inferencia AI o gap puede
crear un Challenge automáticamente. La creación canónica sigue requiriendo contexto
de Front válido y acción humana explícita.

## 12. UI placement

En el workspace SF-3C se recomienda una región advisory, no un paso del wizard:

```text
Main framing workspace
  └─ Perspectivas que podrían ayudarte
       ├─ label
       ├─ por qué ahora
       ├─ pregunta material
       └─ explorar / descartar (opcional)
```

Debe ser colapsable y claramente opcional. No se usarán nueve paneles fijos, tabs que
impliquen obligación, porcentajes de cobertura ni estados de “completado de lenses”.
La suficiencia existente permanece separada y visible como evaluación del framing.

## 13. No-Copilot path

Sin Copilot, la persona puede ver sugerencias, seleccionar o descartar cualquiera,
continuar sin seleccionar ninguna y guardar el mismo structured state. No hay CTA que
obligue a abrir conversación. Copilot futuro puede consumir el mismo evaluador y
proponer la misma estructura, pero su ausencia no reduce la capacidad ni cambia la
suficiencia.

## 14. Multi-entry behavior

La capacidad es única para `public_entry`, `enterprise_direct` y `existing_portfolio`.
Cada modo aporta evidencia y provenance mediante su adapter SF-3D; no existe una
biblioteca de lenses por modo. El evaluador recibe el mismo tipo de estado provisional
y aplica las mismas reglas, preservando el `sourceMode` y sus referencias.

## 15. Provenance

La sugerencia conserva referencias a la evidencia que activó la recomendación y marca
su origen `derived`. Debe incluir la versión del estado/cálculo que la produjo. Una
acción `user_selected`/`user_dismissed`/`explored` sólo tendrá provenance durable si
SF-4C decide persistirla explícitamente. No se afirma causalidad: “relevante porque”
significa explicación de la recomendación, no hecho probado.

## 16. Sufficiency boundary

```text
lens suggestions != sufficiency checklist
```

Puede haber framing suficiente con cero lenses seleccionados; un lens puede ser
suficiente como única perspectiva explorada; una perspectiva Financial ausente no
bloquea; `DEEP` no exige cobertura total; y una sugerencia puede aparecer después de
que el framing ya sea suficiente. La ausencia de lens sólo es un dato para la
decisión humana, nunca un blocker mecánico.

## 17. ADR / Core / schema classification

```text
Core change required: NO
ADR required now: NO
schema change required for SF-4B: NO
schema change potentially required for SF-4C: YES, only for an explicit additive
interaction field; no separate canonical StrategicLens model is required.
```

Se debe detener y elevar ADR si se requiere un `StrategicLens`,
`StrategicObservation` o `StrategicGap` canónico; nueva autoridad de IA; Challenge
automático; cambio de cardinalidad `Front → Challenge`; cambio de roles Core; o
alteración de identidad/lifecycle de Initiative.

## 18. Stop conditions

SF-4B no puede avanzar silenciosamente si:

- SF-4C intenta guardar interacción reutilizando o sobrecargando campos semánticos
  existentes (`scopeAssessment`, `provenance`, `parentContext`, `blockers`,
  `softGaps`, `optionalContext`);
- se necesita un modelo Prisma nuevo para las sugerencias derivadas de SF-4B;
- el ranking no puede explicar sus fuentes o depende sólo de keywords;
- seleccionar/explorar cambia suficiencia, ownership o relaciones canónicas;
- el evaluador crea o actualiza automáticamente Observation, Gap, Challenge o Front;
- una fuente de entrada es tratada como verdad sin preservar uncertainty/provenance;
- la UI convierte suggestions en formulario obligatorio o completion gate.

## 19. SF-4 implementation decomposition

Se recomienda:

1. **SF-4A — decision / representation:** este documento y contrato de límites.
2. **SF-4B — suggestion application/read capability:** evaluator determinista y
   explicable, lectura desde el estado SF y salida derivada/efímera; sin persistencia,
   nueva entidad, Copilot ni canonical writes.
3. **SF-4C — workspace UI interactions and persistence decision:** región advisory en
   SF-3C para ver, seleccionar, descartar y continuar; decidir estado no persistido o
   campo aditivo explícito, sin sobrecargar campos existentes, wizard, tabs obligatorios
   ni porcentaje.
4. **SF-4D — tests / negative boundaries:** elegibilidad con evidencia,
   explainability, refresh/re-entry, los tres modos, no-Copilot, cero lenses,
   múltiples lenses por una brecha y ausencia de auto-Challenge.

SF-5 puede decidir posteriormente si las observaciones derivadas requieren prompts o
otra capacidad; no se adelanta en SF-4.

## 20. Acceptance criteria for the next implementation slice

SF-4B debe demostrar, como mínimo:

- sugerencias calculadas desde el estado provisional y evidencia, no desde keywords
  únicamente;
- cero sugerencias como resultado válido;
- una o varias sugerencias con razón, pregunta material, source refs y confianza
  advisory;
- vocabulario candidate sin tabla/modelo `StrategicLens`;
- interacción `selected`/`dismissed`/`explored` separada de la sugerencia derivada;
- decisión explícita de SF-4C sobre persistencia, sin sobrecargar campos existentes;
- no cambio mecánico de suficiencia por selección, dismissal o ausencia;
- `LIGHT`, `STANDARD` y `DEEP` con semántica adaptativa y sin cuota fija;
- misma capacidad para `public_entry`, `enterprise_direct` y `existing_portfolio`;
- continuidad completa sin Copilot y sin seleccionar ningún lens;
- preservación de source evidence al descartar;
- ninguna escritura de Front, Challenge, Initiative, Observation o Gap canónico;
- tests de no-auto-Challenge y de múltiples lenses explicando una misma brecha;
- verificación de que el payload/versionado SF-3B es suficiente antes de cualquier
  edición de persistencia.

## 21. Explicit decision questions

```text
Should lens suggestions be persisted? NO
If persisted, where? Suggestions nowhere; SF-4C may later choose a separate additive interaction field.
Do we need a new Prisma model? NO
Can existing SF provisional state safely own lens interaction state? UNDECIDED; SF-4C must choose UI-only or explicit additive field.
Are lenses canonical entities? NO
Can zero lenses be valid? YES
Can one lens be sufficient? YES
Can multiple lenses explain one gap? YES
Can one lens produce multiple observations? YES, conceptually; observation generation is deferred.
Does lens completion determine sufficiency? NO
Can user continue without selecting a lens? YES
Can Copilot be absent? YES
Can a lens auto-create Challenge? NO
```

## Final report

```text
SF-4A STATUS: GO_WITH_GAPS

BRANCH: design/strategic-framing-sf4-lens-suggestions
BASE HEAD: 094e348ac879b376034843aa2d89c90e778c26e9

DECISION:
- lens suggestions persisted: NO
- persistence owner: none for suggestions; SF-4C decides interaction persistence separately
- new Prisma model required: NO
- existing SF provisional state reused: NO for suggestion persistence; possible additive owner for SF-4C interaction only
- ephemeral-only sufficient: YES for SF-4B suggestions
- candidate lens library canonical: NO

ADAPTIVE DEPTH:
- LIGHT may use zero lenses: YES
- STANDARD fixed lens count: NO
- DEEP requires all lenses: NO

BOUNDARIES:
- lenses determine sufficiency: NO
- missing lens blocks progress: NO
- lens can auto-create Challenge: NO
- canonical Lens/Observation/Gap introduced: NO
- Copilot required: NO
- multi-entry same capability: YES

AUTHORITY:
- Core change required: NO
- ADR required now: NO
- schema change required next slice: NO for SF-4B; potentially YES for SF-4C additive interaction field

IMPLEMENTATION DECOMPOSITION:
SF-4B evaluator/read capability → SF-4C advisory workspace interactions → SF-4D tests and negative boundaries.

DECISION ARTIFACT:
docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_ADAPTIVE_LENS_DECISION_SF4A_v0.1.md

FILES CHANGED:
- docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_ADAPTIVE_LENS_DECISION_SF4A_v0.1.md

READY FOR HUMAN REVIEW: YES
READY FOR SF-4B: YES, after human review; SF-4B must remain derived/ephemeral

Do not commit.
Do not push.
Do not merge.
```
