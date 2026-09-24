# Starteria — HYP-005 Decision Readiness Test Report

**Estado:** `TESTING`  
**Branch:** `feat/portfolio-entry-decision-readiness-harness`  
**Base:** `main @ 44c2307`  
**Runtime productivo modificado:** `NO`

## Hypothesis

HYP-005 propone un `DecisionReadinessMap` experimental para que Question
Planning reevalúe Relevance, Decision, Execution Reality, Evidence/Authority y
Routing después de cada respuesta. El planner debe preguntar únicamente por el
gap más material y detenerse cuando el gap pertenece a otra etapa, fuente o
autoridad.

El mapa es un read model cognitivo: no es objeto canónico, entidad, formulario,
DTO, persistencia ni UI requerida. No hay scoring numérico productivo.

## Development fixtures

Se crearon cinco fixtures multi-turn en
`PORTFOLIO_ENTRY_DECISION_READINESS_FIXTURES_v0.1.json`:

| ID | Dominant signal | Expected boundary |
|---|---|---|
| DR-01 | capacity / ownership | execution readiness, organizational input |
| DR-02 | value uncertainty | business value vs operational signal |
| DR-03 | adoption | later-stage routing, no rollout design |
| DR-04 | governance | authority vs recommendation vs accountability |
| DR-05 | annual-plan alignment | fixed commitment, external dependency, formal authority |

Los invariantes evalúan conducta, no wording literal.

## Holdouts

Hay tres holdouts nuevos, separados de development:

- `H5-HO-A`: capacity/ownership es más material que KPI/strategy.
- `H5-HO-B`: unknown explícito sin loop de reformulación.
- `H5-HO-C`: stop temprano porque solo queda detalle de etapa posterior.

Sus expected invariants quedan congelados antes de cualquier ejecución live.

## Baseline findings

Se ejecutó el baseline aislado existente con:

```text
front: npm.cmd exec -- vitest run --config vitest.backend.config.ts ../test/portfolio-entry-v02-isolated-validation/isolated-validation.test.ts
```

Resultado observado:

```text
1 test file passed
2 tests passed
promotion_status = BLOCKED_PENDING_VALIDATION
```

El baseline separa correctamente contract conformance de hypothesis validation,
mantiene la regresión v0.1 aislada y preserva el initial state. En el fixture
guiado existente, sin embargo, el adapter construye tres preguntas en un mismo
turno; eso no demuestra una violación del runtime productivo, pero sí muestra
que el baseline disponible no implementa ni evalúa aún H5-R1, H5-R2, H5-R3 o
H5-R4. Tampoco contiene fixtures DR-01…DR-05.

No se ejecutó un baseline semántico sobre los nuevos fixtures: el harness
existente no tiene un runner HYP-005 ni un output DecisionReadinessMap.

## Candidate findings

Resultado: `INCONCLUSIVE`.

No existe todavía un candidate live o deterministic adapter que implemente el
mapa y sus reglas. Se documentó la especificación y los fixtures, pero no se
simuló una validación candidate inexistente. Las cinco development fixtures y
los tres holdouts están preparados para una futura extensión del harness.

La comparación actual es, por tanto:

| Dimension | Baseline disponible | HYP-005 candidate |
|---|---|---|
| Cross-dimension reassessment | no observado | definido, no ejecutado |
| Explicit unknown handling | regla general existente; no H5 fixture | esperado, no ejecutado |
| Local depth control | no observado | esperado, no ejecutado |
| Routing/stop | stop baseline básico | rutas H5 definidas, no ejecutadas |
| Strategy-first bias | no cubierto por estos fixtures | holdout preparado |
| Authority of interpretation | provenance general | regla H5 definida, no ejecutada |

No hay evidencia suficiente para declarar `SUPPORTED`.

## Deterministic experimental execution

Se implementó un adapter determinístico únicamente en
`test/portfolio-entry-decision-readiness/decision-readiness-adapter.ts`. No
importa frontend, backend productivo, Prisma, prompts ni contratos. El
entrypoint de test vive bajo la ruta experimental aislada ya incluida por
Vitest.

Comando ejecutado:

```text
front: npm.cmd exec -- vitest run --config vitest.backend.config.ts ../test/portfolio-entry-v02-isolated-validation/decision-readiness-adapter.test.ts
```

Resultado: `1 test file passed`, `5 tests passed`.

La salida por caso fue:

| Caso | Actions observadas | Resultado final |
|---|---|---|
| DR-01 | ASK → ASK → REQUIRE_ORGANIZATIONAL_INPUT | ownership/capacity requiere input organizacional |
| DR-02 | ASK → ROUTE → ROUTE | valor de negocio queda en Portfolio, sin loop de pregunta |
| DR-03 | STOP → ASK → ROUTE | adoption se enruta a `STEPS_LATER_STAGE` |
| DR-04 | STOP → REQUIRE_ORGANIZATIONAL_INPUT → REQUIRE_ORGANIZATIONAL_INPUT | decision authority requiere input organizacional |
| DR-05 | ASK → ASK → REQUIRE_ORGANIZATIONAL_INPUT | autoridad y capacity no se convierten en hecho formal |

Los tres holdouts se ejecutaron sin modificar sus invariants:

| Holdout | Resultado |
|---|---|
| H5-HO-A | execution reality priorizado sobre strategy/KPI |
| H5-HO-B | unknown explícito → `REQUIRE_ORGANIZATIONAL_INPUT`; no loop |
| H5-HO-C | `STOP` inicial y `ROUTE` a etapa posterior; no diseño de experimento |

Todos los runs produjeron trace con las cinco dimensiones reconsideradas en
cada turno, `why_not_ask` para gaps no seleccionados y cero violaciones
experimentales.

### Comparison: baseline vs deterministic candidate

| Aspecto | Baseline existente | Candidate determinístico |
|---|---|---|
| Cross-dimension trace | no observable | cinco dimensiones por turno |
| Candidate gaps | no Decision Readiness output | gaps con resolución, impacto, stage fit y evidencia |
| Unknown handling | no evaluado en HYP-005 | organizational input sin repetir ASK |
| Local depth | no evaluado | guard que convierte repetición en defer/route |
| Stop/routing | stop básico | STOP, ROUTE y organizational input diferenciados |
| Human review | no HYP-005 package | campos 1–5 preparados por caso |

Mejora más fuerte: hace visible por qué un gap material de execution,
authority o adoption cambia el routing, en lugar de seguir el último hilo.

Regresión/limitación más fuerte: el adapter sigue siendo heurístico y puede
producir ASK iniciales discutibles cuando señales técnicas y de readiness
aparecen en el mismo turno; DR-01 y DR-05 muestran que la priorización depende
de una señal lexical limitada. Esto requiere revisión humana, no promoción.

El resultado candidate permanece `INCONCLUSIVE`; el status de HYP-005 se
mantiene `TESTING`.

## Human-review dimensions

Escala 1–5, con anchors:

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| `cross_dimension_prioritization` | sigue el último hilo sin reevaluar | detecta otra dimensión pero la prioriza débilmente | reevalúa las cinco y elige el gap material |
| `local_depth_control` | loop o profundización redundante | limita parte de la repetición | solo profundiza si cambia decisión/routing/handoff |
| `explicit_unknown_handling` | repite o inventa autoridad | registra incertidumbre pero deja ambigüedad | enruta a input organizacional, no repite y marca sugerencias |
| `routing_quality` | ruta incorrecta o canónica | ruta plausible pero imprecisa | distingue Portfolio, Initiative, later stage, org input y evidence |
| `stop_quality` | sigue preguntando por completitud | se detiene tarde o sin razón | se detiene cuando el route/contexto es suficiente |
| `strategy_execution_balance` | siempre fuerza KPI/strategy | reconoce execution pero tarde | prioriza el gap que cambia la decisión, aunque sea operativo |

También registrar los checks existentes de provenance, canonicalization,
capability overclaim y Step leakage.

## Regressions

No se observaron regresiones en la ejecución baseline aislada (2/2 tests).
HYP-005 no ha tenido candidate execution, por lo que no se puede afirmar
ausencia de regresiones en esa superficie.

## False positives / false negatives

No medidos todavía. Riesgos a observar:

- falso positivo: tratar toda falta de KPI como gap material aunque la decisión
  sea de capacidad o autoridad;
- falso negativo: aceptar una mejora operacional como business value;
- falso positivo: enviar a Steps cualquier gap de adopción sin verificar si el
  routing ya está claro;
- falso negativo: aceptar “flexible” como interpretación formal de compliance;
- falso positivo: pedir otra pregunta después de un unknown explícito.

## Unresolved questions

- ¿Qué representación mínima de los cinco ejes necesita el evaluator sin crear
  un nuevo contrato?
- ¿Puede el harness deterministic adapter producir decisiones de routing sin
  codificar semántica productiva?
- ¿Cómo se mide cross-dimension reassessment sin almacenar chain-of-thought?
- ¿Cuál es el umbral humano para considerar suficiente un handoff con gaps
  organizacionales abiertos?
- ¿Qué casos requieren external evidence frente a organizational input?

## Authority gaps

```text
AUTHORITY_GAP
Requirement: DecisionReadinessMap y CandidateGap para HYP-005.
Current authority: no existe objeto ni regla aprobada equivalente; el stack
Portfolio Entry v0.2 y el harness están en estado candidato/testing.
Risk: implementar el mapa en runtime podría crear una nueva semántica de
producto, entidad o prompt sin ADR/contrato.
Treatment: KEEP experimental; no promover; no modificar runtime.
```

```text
AUTHORITY_GAP
Requirement: validación live del candidate.
Current environment: el harness aislado disponible no implementa HYP-005 y no
hay autorización para cambiar prompts activos.
Risk: fingir validación live o ajustar producto para hacer posible el test.
Treatment: STOP productivo; documentar y preparar fixtures/human review.
```

El Core candidato/requiere re-test y la reconciliación del stack Portfolio
Entry siguen siendo gaps preexistentes y se mantienen explícitos.

## Adversarial update

La siguiente ronda está documentada en
`PORTFOLIO_ENTRY_DECISION_READINESS_ADVERSARIAL_REPORT_v0.1.md`. Tras ejecutar
18 casos adversariales, 3 pares anti-keyword y 3 nuevos holdouts, HYP-005 pasa
a `ITERATE`: los nuevos holdouts estrictos obtuvieron 1/3. El adapter sigue
siendo harness-only y no hay promoción a runtime ni contratos.

## Recommendation

`KEEP EXPERIMENTAL` / `ITERATE`.

Siguiente paso recomendado: añadir un adapter deterministic-only dentro del
harness experimental, con trace estructurado de reevaluación por dimensión,
CandidateGap y route/stop; ejecutar primero development, después revisión
humana ciega y finalmente holdouts. No conectar el candidate al runtime ni
declarar soporte hasta contar con evidencia multi-turn, revisión humana y una
decisión explícita de autoridad.
