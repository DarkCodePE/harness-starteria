# Strategic Framing Experience Contract v0.1

**Estado:** `APPROVED EXPERIENCE CONTRACT — SF-0` — human-approved 2026-09-24
**Bounded context:** `Strategic Framing`
**Autoridad superior:** Core factual v0.2; este contrato no lo modifica.

**Status:** `APPROVED EXPERIENCE CONTRACT — SF-0`
**Human approval:** 2026-09-24
**Core factual authority:** v0.2
**Core modified:** NO
**ADR required by SF-0:** NO

## 1. PropÃ³sito y frontera

Strategic Framing transforma contexto de Portfolio Entry en una comprensiÃ³n estratÃ©gica suficiente para orientar foco:

```text
Portfolio Entry context
  â†’ strategic framing
  â†’ Strategic Front
  â†’ relevant lenses
  â†’ drivers / gaps / opportunities
  â†’ prioritization
  â†’ human-confirmed Challenges
```

La experiencia evalÃºa suficiencia para avanzar. No impone una metodologÃ­a ni convierte una pantalla, conversaciÃ³n o lens en autoridad canÃ³nica.

## 2. Strategic Front

Un **Strategic Front** representa un resultado estratÃ©gico que la organizaciÃ³n quiere mover. Puede ser pequeÃ±o y enfocado o amplio y complejo.

Contexto esperado cuando exista: outcome deseado, KPI o seÃ±al, baseline/target, horizonte, restricciones/contexto material y responsable de gobernanza. Estos elementos no implican que todos sean obligatorios en cada profundidad.

Reglas:

- puede existir sin mÃºltiples Challenges;
- no exige todos los lenses;
- su profundidad es variable;
- `Front â†’ Challenge` no se altera en SF-0;
- una propuesta de Front requiere confirmaciÃ³n humana cuando derive de alineamiento inverso o inferencia.

## 3. Adaptive framing depth

`LIGHT`, `STANDARD` y `DEEP` son profundidades conceptuales adaptativas de experiencia. No se define todavÃ­a `FramingDepth` como entidad persistida ni como enum canÃ³nico.

La recomendaciÃ³n considera, de forma contextual, claridad, complejidad, horizonte, urgencia, capacidad, volumen de iniciativas, dependencias e incertidumbre.

- `LIGHT`: resultado claro, baja complejidad o poco tiempo; permite avanzar con el mÃ­nimo suficiente.
- `STANDARD`: varias iniciativas, Ã¡reas o incertidumbre moderada.
- `DEEP`: frente corporativo amplio, dependencias, decisiones de inversiÃ³n o incertidumbre alta.

La profundidad no es una puerta metodolÃ³gica rÃ­gida: `LIGHT` sigue siendo vÃ¡lido y `DEEP` sigue siendo vÃ¡lido cuando el contexto lo justifica.

## 4. Strategic Lenses

Los Strategic Lenses son perspectivas analÃ­ticas adaptativas. No son mandatory form sections, jerarquÃ­a canÃ³nica, Challenges ni requisitos de completitud.

LibrerÃ­a candidate:

- Value / Outcome
- Customer / Opportunity
- Process / Capability
- Learning / Evidence
- Financial
- Culture / Organization
- Technology
- Risk / Compliance
- Ecosystem / Partners

Regla: usar el mÃ­nimo nÃºmero de lenses materialmente necesario para comprender el outcome.

- un lens puede producir cero, una o mÃºltiples observaciones;
- un gap o Challenge puede estar explicado por varios lenses;
- la ausencia de un lens no bloquea por sÃ­ misma el avance;
- la biblioteca es candidate y no crea una entidad canÃ³nica `StrategicLens`.

## 5. Observation â†’ Challenge boundary

La transiciÃ³n congelada es:

```text
Observation
  â†’ Driver / Gap / Opportunity
  â†’ Prioritization
  â†’ explicit human confirmation
  â†’ canonical Challenge
```

EstÃ¡ prohibido:

```text
Lens â†’ automatic Challenge
AI inference â†’ automatic Challenge
Gap â†’ automatic Challenge
```

Strategic Framing puede proponer un Challenge, pero solo una acciÃ³n humana explÃ­cita puede promoverlo a Challenge canÃ³nico. Crear un Challenge no implica Invitation, Accept, Initiative, Initiative active ni Step activation.

## 6. Strategic backlog

El backlog pertenece al Strategic Front:

```text
Strategic Front
â”œâ”€â”€ Active Challenges
â””â”€â”€ Gaps / Opportunities in observation
```

Los gaps pueden quedar en `ADDRESS NOW`, `OBSERVE` o `DISCARD`. No se asume una entidad canÃ³nica `StrategicGap` en SF-0.

Con capacidad limitada, el sistema recomienda foco y mantiene el resto observable. Cinco gaps y capacidad para uno deben producir una recomendaciÃ³n priorizada, no cinco Challenges.

## 7. Sufficiency

Suficiencia significa que existe base suficiente para el siguiente avance, no que se completÃ³ un formulario ni una cuota de lenses.

SeÃ±ales de suficiencia pueden incluir: outcome claro, mÃ©trica/seÃ±al clara, driver principal entendido y incertidumbre restante visible.

Debe distinguir:

- `blocker`: impide el avance actual;
- `soft gap`: incertidumbre o informaciÃ³n faltante que no bloquea automÃ¡ticamente;
- `optional context`: contexto Ãºtil pero no requerido.

La regla `3 of 4 lenses completed` no es criterio de suficiencia.

## 8. Interaction model

Existen tres caminos equivalentes hacia el mismo structured state:

- `DIRECT`: ediciÃ³n del workspace y reevaluaciÃ³n del sistema.
- `MIXED`: ediciÃ³n, observaciÃ³n del Copilot y decisiÃ³n humana de incorporar o descartar.
- `COPILOT`: conversaciÃ³n que propone estructura, aplicada o corregida por la persona.

`Structured workspace = system of record`. `Copilot = cognitive/advisory layer`.

Todo framing debe poder completarse sin chat. Todo insight material del Copilot debe poder convertirse en estado estructurado. Copilot no mantiene lifecycle privado, no decide el foco final y no convierte inferencia en verdad.

## 9. Relationship with Portfolio Home

La integraciÃ³n futura puede exponer outcome, strategic health, drivers, gaps observados, Challenges activos, coverage, learning y decisions. Esa reconciliaciÃ³n pertenece a `SF-7`; SF-0 no modifica PH-3A ni inicia PH-3B.

## 10. ADR stop conditions

Marcar `ADR CANDIDATE` y detener la resoluciÃ³n silenciosa si aparece necesidad de:

- canonical `StrategicLens`, `StrategicObservation` o `StrategicGap`;
- nuevo lifecycle;
- cambio de cardinalidad Front â†’ Challenge u opcionalidad de Challenge;
- nueva autoridad de AI o creaciÃ³n automÃ¡tica de Challenge;
- cambio de roles Core;
- cambio de identidad de Initiative;
- cambio material de invariantes Core.

## 11. SF-0.1 Strategic Interpretation amendment

Strategic Interpretation is a shared capability for Public Entry, Enterprise
Direct and Existing Portfolio/imported work. It precedes Strategic Framing:

```text
Public Entry / Enterprise Direct / Existing Portfolio
  → Strategic Interpretation
  → sufficient strategic reference / Portfolio Anchor
  → Strategic Framing
```

Portfolio Entry is not the exclusive gateway. Interpretation is not Framing and
neither is canonical strategy. The non-canonical **Strategic Interpretation
Result** may contain intended movement, why it matters, signal/proxy, scope
assessment, parent context, existing structures, reverse-alignment findings,
provenance and open uncertainties.

Scope assessment is advisory/provisional and may be `front_like`,
`challenge_like`, `initiative_like` or `unresolved`. It must consider outcome
scope, governed decisions, possible child Challenges, intervention/solution
nature, broader parent outcome, organizational horizon/context and existing work
patterns; it must not classify from wording alone. It does not create or change
a canonical Front, Challenge or Initiative, and exact persistence is deferred
to SF-1+. Human confirmation remains required when material.

`SF-BOUND-09`: Strategic Interpretation may question, reinterpret or
reverse-align existing strategic structures, but cannot silently rewrite or
confirm them.

`SF-BOUND-10`: A challenge-like or initiative-like input may continue framing
before full parent context is known, but canonical corporate hierarchy must be
resolved before canonical Challenge creation.

## 12. Portfolio Anchor, signals and candidate Challenge

Portfolio Anchor is the minimum sufficiently clear strategic reference required
to responsibly organize current work and make the next governance decision. It
may include intended movement, why it matters, signal/proxy, horizon/context,
the decision to enable, parent relationship (`known`, `provisional` or
`unresolved`), provenance and uncertainty. `Anchor != Strategic Front` and
`anchor sufficient != all parent hierarchy resolved`. Initiative/work-item
alignment may remain pending where Core permits it.

Keep distinct:

- **Movement Signal:** whether the specific outcome/problem is moving.
- **Contribution Signal:** whether an Initiative is contributing to that movement.
- **Business Outcome:** whether the movement translates into business value.

`movement signal != contribution signal != business outcome`. Business outcome
may remain unproven; do not fabricate ROI or causal attribution, and preserve
expected/observed/attributed contribution distinctions.

Root-cause depth is adaptive. Deepen only if it may materially change level
classification, prioritization, parent alignment, governance/investment or
value/risk interpretation. A sufficiently clear problem, understood relevance,
useful signal/proxy and visible parent alignment may be enough.

A `candidate Challenge` is a structured proposal inside Strategic Framing, not
a canonical `Challenge` row/entity:

```text
candidate Challenge
  → resolve/select/confirm Strategic Front
  → explicit human promotion
  → canonical Challenge
```

Do not make `Challenge.strategicFrontId` nullable, persist an orphan Challenge,
invent a Front to satisfy the foreign key or silently link to an inferred Front.
If the parent is unclear, preserve the problem, mark alignment provisional or
unresolved and continue reverse alignment without canonicalization.
