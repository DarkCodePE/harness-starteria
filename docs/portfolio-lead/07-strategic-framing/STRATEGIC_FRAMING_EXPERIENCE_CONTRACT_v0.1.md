# Strategic Framing Experience Contract v0.1

**Estado:** `CANDIDATE` — SF-0 freeze; pendiente de revisión humana  
**Bounded context:** `Strategic Framing`  
**Autoridad superior:** Core factual v0.2; este contrato no lo modifica.

## 1. Propósito y frontera

Strategic Framing transforma contexto de Portfolio Entry en una comprensión estratégica suficiente para orientar foco:

```text
Portfolio Entry context
  → strategic framing
  → Strategic Front
  → relevant lenses
  → drivers / gaps / opportunities
  → prioritization
  → human-confirmed Challenges
```

La experiencia evalúa suficiencia para avanzar. No impone una metodología ni convierte una pantalla, conversación o lens en autoridad canónica.

## 2. Strategic Front

Un **Strategic Front** representa un resultado estratégico que la organización quiere mover. Puede ser pequeño y enfocado o amplio y complejo.

Contexto esperado cuando exista: outcome deseado, KPI o señal, baseline/target, horizonte, restricciones/contexto material y responsable de gobernanza. Estos elementos no implican que todos sean obligatorios en cada profundidad.

Reglas:

- puede existir sin múltiples Challenges;
- no exige todos los lenses;
- su profundidad es variable;
- `Front → Challenge` no se altera en SF-0;
- una propuesta de Front requiere confirmación humana cuando derive de alineamiento inverso o inferencia.

## 3. Adaptive framing depth

`LIGHT`, `STANDARD` y `DEEP` son profundidades conceptuales adaptativas de experiencia. No se define todavía `FramingDepth` como entidad persistida ni como enum canónico.

La recomendación considera, de forma contextual, claridad, complejidad, horizonte, urgencia, capacidad, volumen de iniciativas, dependencias e incertidumbre.

- `LIGHT`: resultado claro, baja complejidad o poco tiempo; permite avanzar con el mínimo suficiente.
- `STANDARD`: varias iniciativas, áreas o incertidumbre moderada.
- `DEEP`: frente corporativo amplio, dependencias, decisiones de inversión o incertidumbre alta.

La profundidad no es una puerta metodológica rígida: `LIGHT` sigue siendo válido y `DEEP` sigue siendo válido cuando el contexto lo justifica.

## 4. Strategic Lenses

Los Strategic Lenses son perspectivas analíticas adaptativas. No son mandatory form sections, jerarquía canónica, Challenges ni requisitos de completitud.

Librería candidate:

- Value / Outcome
- Customer / Opportunity
- Process / Capability
- Learning / Evidence
- Financial
- Culture / Organization
- Technology
- Risk / Compliance
- Ecosystem / Partners

Regla: usar el mínimo número de lenses materialmente necesario para comprender el outcome.

- un lens puede producir cero, una o múltiples observaciones;
- un gap o Challenge puede estar explicado por varios lenses;
- la ausencia de un lens no bloquea por sí misma el avance;
- la biblioteca es candidate y no crea una entidad canónica `StrategicLens`.

## 5. Observation → Challenge boundary

La transición congelada es:

```text
Observation
  → Driver / Gap / Opportunity
  → Prioritization
  → explicit human confirmation
  → canonical Challenge
```

Está prohibido:

```text
Lens → automatic Challenge
AI inference → automatic Challenge
Gap → automatic Challenge
```

Strategic Framing puede proponer un Challenge, pero solo una acción humana explícita puede promoverlo a Challenge canónico. Crear un Challenge no implica Invitation, Accept, Initiative, Initiative active ni Step activation.

## 6. Strategic backlog

El backlog pertenece al Strategic Front:

```text
Strategic Front
├── Active Challenges
└── Gaps / Opportunities in observation
```

Los gaps pueden quedar en `ADDRESS NOW`, `OBSERVE` o `DISCARD`. No se asume una entidad canónica `StrategicGap` en SF-0.

Con capacidad limitada, el sistema recomienda foco y mantiene el resto observable. Cinco gaps y capacidad para uno deben producir una recomendación priorizada, no cinco Challenges.

## 7. Sufficiency

Suficiencia significa que existe base suficiente para el siguiente avance, no que se completó un formulario ni una cuota de lenses.

Señales de suficiencia pueden incluir: outcome claro, métrica/señal clara, driver principal entendido y incertidumbre restante visible.

Debe distinguir:

- `blocker`: impide el avance actual;
- `soft gap`: incertidumbre o información faltante que no bloquea automáticamente;
- `optional context`: contexto útil pero no requerido.

La regla `3 of 4 lenses completed` no es criterio de suficiencia.

## 8. Interaction model

Existen tres caminos equivalentes hacia el mismo structured state:

- `DIRECT`: edición del workspace y reevaluación del sistema.
- `MIXED`: edición, observación del Copilot y decisión humana de incorporar o descartar.
- `COPILOT`: conversación que propone estructura, aplicada o corregida por la persona.

`Structured workspace = system of record`. `Copilot = cognitive/advisory layer`.

Todo framing debe poder completarse sin chat. Todo insight material del Copilot debe poder convertirse en estado estructurado. Copilot no mantiene lifecycle privado, no decide el foco final y no convierte inferencia en verdad.

## 9. Relationship with Portfolio Home

La integración futura puede exponer outcome, strategic health, drivers, gaps observados, Challenges activos, coverage, learning y decisions. Esa reconciliación pertenece a `SF-7`; SF-0 no modifica PH-3A ni inicia PH-3B.

## 10. ADR stop conditions

Marcar `ADR CANDIDATE` y detener la resolución silenciosa si aparece necesidad de:

- canonical `StrategicLens`, `StrategicObservation` o `StrategicGap`;
- nuevo lifecycle;
- cambio de cardinalidad Front → Challenge u opcionalidad de Challenge;
- nueva autoridad de AI o creación automática de Challenge;
- cambio de roles Core;
- cambio de identidad de Initiative;
- cambio material de invariantes Core.

