# Starteria — Portfolio Entry Value Handoff Target

**Documento:** `PORTFOLIO_ENTRY_VALUE_HANDOFF_TARGET_v0.1.md`  
**Versión:** v0.1  
**Estado:** CANDIDATE / V2_TARGET_DEFINED / TESTABLE_HYPOTHESIS  
**Fecha:** 2026-09-18  
**Tipo:** Experience target / pre-implementation specification  
**Slice:** Portfolio Entry → Handoff  
**Authority:** subordinado a `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`; no reemplaza contratos, ADRs ni Core.

> Este documento define un target verificable a partir de evidencia de testing. No autoriza implementación por sí mismo y no convierte las hipótesis HYP-002/HYP-003 en reglas aprobadas.

## 1. Objetivo

Después de la conversación inicial, Portfolio Entry debe dejar al Portfolio Lead con una ganancia visible de claridad y con un siguiente camino razonable. El handoff no debe limitarse a repetir el relato del usuario ni cerrar la sesión antes de que exista una propuesta útil.

El target es:

```text
realidad del usuario
→ síntesis fiel
→ decisión que conviene habilitar
→ recomendación Starteria-específica
→ gaps y evidencia que faltan
→ camino de trabajo
→ siguiente acción proporcional
```

La experiencia debe responder, en una sola lectura:

1. qué entendió Starteria;
2. qué quiere conseguir el usuario;
3. qué decisión o resultado necesita habilitar;
4. qué recomienda Starteria hacer primero y por qué;
5. qué sigue incierto;
6. cómo Starteria puede estructurar, hacer visible, seguir o preparar ese trabajo.

## 2. Evidencia y trazabilidad

Este target deriva de:

| Evidencia | Implicación para el target |
|---|---|
| `FND-007` — el handoff no muestra suficiente valor específico de Starteria | La pantalla debe demostrar trabajo que Starteria ayuda a realizar, no solo entregar una opinión. |
| `HYP-002` — Recommended Approach + Alternatives | La recomendación debe ser protagonista y las alternativas solo deben aparecer cuando cambien materialmente el camino. Sigue pendiente de validación. |
| `HYP-003` — GapResolutionMap | Cada incertidumbre relevante debe conectarse con una capacidad o con una dependencia externa. Sigue pendiente de validación. |
| `FND-006` — hace falta gobierno de sesión | No cerrar automáticamente por haber hecho dos preguntas si el contexto material o la decisión siguen sin resolver y existe presupuesto contractual. |
| `FND-008` — frontera pre-Step | El handoff puede identificar gaps y orientar el camino, pero no diseñar experimentos detallados ni activar Steps. |
| `FND-009` — separar declaración, extracción, inferencia y sugerencia | La UI debe distinguir lo dicho por el usuario de lo propuesto por IA. |

La evidencia concreta del caso de Portfolio Lead se trata como input de prueba, no como verdad generalizable:

> Gestionar aproximadamente 40 iniciativas, con unas 20 inactivas, entender cuáles se relacionan con usuarios impactados y ventas, y decidir dónde concentrar atención.

## 3. Principios del target

### VHO-01 — Valor nuevo antes que repetición

La síntesis del usuario debe ser breve y servir de contexto para la lectura de Starteria. No puede ocupar el protagonismo visual ni repetir varios párrafos del input.

### VHO-02 — La recomendación es el centro de gravedad

Cuando exista contexto suficiente, `recommended_approach` debe aparecer antes de las listas secundarias y con una explicación concreta de:

- qué conviene hacer primero;
- qué problema de decisión aborda;
- qué señales o relación entre iniciativas conviene hacer visible;
- qué supuesto mantiene abierto.

Debe conservar `origin = AI_SUGGESTED` y `review_disposition = UNREVIEWED` hasta aceptación humana. Nunca debe expresarse como verdad objetiva ni como decisión ya tomada.

### VHO-03 — Starteria debe mostrar su trabajo específico

El handoff debe mostrar cómo Starteria convierte la situación en trabajo gestionable:

```text
estructurar el portfolio
→ relacionar iniciativas con objetivos y señales
→ hacer visibles evidencia, actividad y gaps
→ comparar o seguir lo que requiere atención
→ preparar decisiones de continuar, pausar, detener o escalar
```

No debe prometer resultados, ROI, viabilidad ni evidencia externa inexistente.

### VHO-04 — Incertidumbre accionable

`unresolved_context` no se muestra como una lista genérica de carencias. Cada gap material debe indicar si Starteria puede estructurarlo, guiarlo o seguirlo, o si requiere input organizacional/evidencia externa.

### VHO-05 — La decisión puede seguir unresolved

Si `decision_to_enable` no tiene soporte suficiente, la salida debe decirlo claramente y convertirlo en el foco de la siguiente aclaración o del camino provisional. No se debe inventar una decisión de priorización, inversión o escalado.

### VHO-06 — La sesión termina por suficiencia, no por premura

Quick Clarification tiene un máximo contractual de tres preguntas, no un objetivo de dos. Si después de dos preguntas `decision_to_enable` sigue unresolved y queda presupuesto, el controlador debe:

- hacer una tercera pregunta de alto valor; o
- ofrecer explícitamente una ruta provisional, Guided Exploration o reformulación;

según el estado de la sesión. No debe cerrar silenciosamente.

### VHO-07 — La ruta debe ser una sola fuente legible

El handoff debe presentar un camino Starteria coherente y contextual. No debe mostrar una taxonomía duplicada ni una ruta genérica como `Portfolio → Retos → Iniciativas → Evidencia → Decisiones` si no explica cómo responde al problema concreto.

Las rutas derivadas de estado de sesión, handoff y contexto deben resolverse desde el estado disponible, no desde un `StarteriaRoute` hardcoded que ignore `session` o `handoff`. Este requisito es de comportamiento objetivo y no prescribe una implementación.

### VHO-08 — Conversión después de demostrar valor

Registro, CTA de conversión y continuidad deben quedar subordinados al momento de valor. La acción principal del handoff debe expresar el trabajo recomendado; autenticarse no debe competir visualmente con la comprensión de la recomendación.

## 4. Modelo de contenido visible

El orden recomendado de lectura es:

```text
01 Esto entendí de tu situación
02 Así abordaría tu situación
03 Por qué empezaría por ahí
04 Lo que todavía puede cambiar la decisión
05 Cómo Starteria convierte esto en trabajo
06 Feedback de utilidad
07 Engagement + registro
```

Reglas de jerarquía visual:

- “Así abordaría tu situación” tiene la mayor jerarquía visual.
- “Esto entendí” es breve y sirve para alineamiento.
- Los gaps aparecen antes del bloque de conversión.
- El registro aparece después de que Starteria haya demostrado valor.
- No usar una card lateral grande de registro que compita permanentemente con la recomendación.
- Puede existir un CTA sticky compacto en desktop, pero no sustituye la narrativa principal.

### 4.1. Síntesis de situación

Mostrar una frase o dos con:

- el objeto de gestión relevante, por ejemplo un portfolio de iniciativas;
- el problema de decisión;
- la señal de negocio mencionada por el usuario.

Ejemplo de target para el caso de prueba:

> Tienes un portfolio amplio y parte de las iniciativas está inactiva. El reto no parece ser generar más iniciativas, sino hacer visible cuáles conectan con usuarios impactados y ventas para decidir dónde concentrar atención.

El ejemplo no debe convertirse automáticamente en contenido de producto ni en una inferencia confirmada.

### 4.2. Recomendación principal

Presentar una tarjeta o bloque principal con una recomendación específica, breve y completa en viewport normal. El texto no debe truncarse visualmente ni ocultar el motivo de la recomendación.

Forma mínima:

```text
Recommended approach
Qué haría Starteria primero
Por qué esta secuencia ayuda a la decisión actual
Qué supuesto o incertidumbre permanece
Propuesta de IA · pendiente de revisión
```

Para el caso de prueba, una recomendación candidata podría ser:

> Empezar por ordenar las iniciativas existentes según actividad, relación con las señales de negocio y evidencia disponible; después hacer visibles los grupos que justifican atención, pausa o profundización. Así la decisión parte del portfolio real en vez de abrir más trabajo antes de saber qué merece foco.

Esta redacción es un ejemplo de target, no una respuesta fija ni una heurística frontend autorizada.

### 4.3. Valor Starteria

Mostrar entre tres y cinco capacidades contextualizadas, por ejemplo:

- estructurar las iniciativas y el criterio de atención;
- relacionar señales de negocio con iniciativas sin afirmar causalidad;
- hacer visible actividad, evidencia y gaps;
- seguir qué necesita aclaración o validación;
- preparar una decisión de continuar, pausar, detener o escalar.

Evitar verbos vagos como “ayudar” sin describir qué queda estructurado o visible.

### 4.4. Gaps y resolución

Cada gap debe tener una descripción breve y una resolución legible:

| Gap | Tratamiento visible |
|---|---|
| No está claro qué iniciativas siguen activas o merecen atención | Starteria puede estructurar el portfolio y hacer comparables actividad y criterios. |
| No está demostrada la relación entre una iniciativa y usuarios impactados o ventas | Requiere evidencia o input organizacional; Starteria puede registrar y conectar esa evidencia con la decisión. |
| No está definido el umbral para concentrar atención | Starteria puede ayudar a explicitar el criterio; la decisión sigue siendo humana. |

No diseñar desde aquí un experimento, threshold, plan de medición ni Step concreto.

### 4.5. Alternativas

Mostrar alternativas solo cuando sean materialmente distintas. Cada una debe incluir:

- qué resuelve mejor;
- qué supuesto cambia;
- por qué la recomendación principal parece preferible con la información actual.

Si no existe una diferencia real, omitir el bloque. No crear alternativas cosméticas para llenar la pantalla.

### 4.6. Provenance

La provenance debe aparecer de forma compacta y agrupada, no repetida detrás de cada frase.

Usar lenguaje de usuario para declaraciones, por ejemplo:

- “Lo que nos contaste”;
- “Lo que Starteria organizó de tu respuesta”;
- “Propuesta de Starteria”;
- “Aún por confirmar”.

No mostrar al usuario rutas internas de código, nombres de archivos, `internal source path`, IDs técnicos ni etiquetas de implementación. La trazabilidad técnica pertenece al harness, auditoría o logs, no al handoff visible.

## 5. Estados de handoff

| Estado | Target visible |
|---|---|
| `ready` | Recomendación, camino, gaps y siguiente acción suficientemente concretos. |
| `ready_with_uncertainty` | Igual, pero la incertidumbre relevante se muestra y no se disfraza de conclusión. |
| `insufficient_input` | Explica qué falta para una salida útil y ofrece la siguiente aclaración o reformulación. |

`decision_to_enable = unresolved` es compatible con `ready_with_uncertainty`; no obliga a una falsa conclusión ni a un cierre inmediato.

## 6. Siguiente acción y CTA

El mensaje de engagement puede ser contextual y derivado del handoff. Para v0.1, los CTAs quedan congelados:

- CTA principal: `Continuar con mi portafolio`
- CTA secundario: `Ajustar esta lectura`

Los CTAs dinámicos derivados del `recommended_approach`, como `Estructurar mi portfolio` o `Preparar una decisión`, quedan registrados únicamente como hipótesis futuras de UX. No forman parte del target de CTA v0.1.

El CTA no debe:

- implicar creación de Initiative o Step;
- forzar la ruta `create Initiative → Step 0`;
- presentar registro como el valor principal;
- usar un texto genérico cuando la recomendación ya permite ser específica.

Si el siguiente paso requiere registro, el valor y la recomendación deben permanecer visibles antes de pedirlo. La continuidad Portfolio y cualquier frontera posterior quedan fuera de esta especificación candidata y deben respetar sus contratos propios.

## 7. Requisitos negativos

El target se considera incumplido si ocurre cualquiera de estos casos:

- la pantalla solo repite `understanding` sin producir una lectura o camino nuevo;
- el insight principal proviene de una heurística frontend genérica sin trazabilidad al handoff;
- `recommended_approach` existe en el estado pero no es visible o queda subordinado a un resumen repetitivo;
- el texto relevante se trunca, se oculta o requiere interacción accidental para leerse;
- “Tú nos dijiste” aparece como provenance repetida en múltiples bloques;
- se muestra un source path interno o una etiqueta técnica al usuario;
- la ruta visible se duplica o ignora `session` y `handoff`;
- la taxonomía de producto sustituye la explicación del problema concreto;
- el CTA/registro tiene más peso visual que la demostración de valor;
- el registro aparece antes de “Cómo Starteria convierte esto en trabajo”;
- una card lateral grande de registro compite permanentemente con la recomendación;
- la sesión cierra después de dos preguntas mientras quedan decisión material y budget disponible sin ofrecer una opción explícita;
- el handoff inventa evidencia, métricas, causalidad, ownership o decisión humana;
- el handoff activa o diseña Steps, crea objetos canónicos o modifica permisos, registro, Core o rutas productivas.

## 8. Acceptance criteria antes de implementación

### Contract conformance

- [ ] El handoff conserva `understanding`, `desired_outcome`, `decision_to_enable`, `recommended_approach`, `unresolved_context`, `gap_resolution_map`, `starteria_path`, `recommended_cta` y provenance separada.
- [ ] La recomendación queda marcada como propuesta de IA hasta revisión humana.
- [ ] `decision_to_enable` puede permanecer `unresolved`.
- [ ] La sesión distingue `quick_clarification` de `guided_exploration` y no supera tres preguntas dentro de Quick Clarification.
- [ ] No se crean Initiative, Step, Decision, Organization, StrategicFront ni Challenge desde este slice.

### Value validation

- [ ] Un usuario puede señalar qué ganó de claridad después del handoff.
- [ ] Puede repetir con sus palabras qué recomienda Starteria hacer primero.
- [ ] Puede explicar qué decisión ayuda a preparar el camino.
- [ ] Puede identificar al menos un gap y quién o qué debe resolverlo.
- [ ] La recomendación se percibe específica para su situación y no como consejo genérico de chatbot.
- [ ] Las alternativas, si aparecen, se perciben materialmente distintas y útiles.

### Visual and interaction validation

- [ ] El bloque de recomendación y su justificación se leen completos sin truncamiento.
- [ ] La provenance está agrupada y no repite “Tú nos dijiste” de forma mecánica.
- [ ] No aparecen paths internos ni nombres técnicos de origen.
- [ ] El CTA de trabajo recomendado tiene prioridad visual sobre registro/conversión.
- [ ] La ruta mostrada cambia de forma verificable según `session` y `handoff`; no es una copia hardcoded duplicada.

### Boundary validation

- [ ] El handoff no redefine Core, AI productiva, prompts, schemas, permisos, registro, rutas, Portfolio Bootstrap, Portfolio Home, Steps ni superficies productivas.
- [ ] El target no autoriza implementación; requiere una slice posterior con guardrail check, tests y autoridad explícita.

## 9. Métricas candidatas para la validación

Estas métricas no son criterios de aprobación automática; orientan el próximo harness o test cualitativo:

```text
clarity_gained
decision_framing_quality
value_delta
starteria_continuation_value
recommended_approach_relevance
recommended_approach_fidelity
starteria_value_visibility
alternative_approach_relevance
generic_chat_feeling
provenance_comprehension
route_context_fidelity
turns_to_first_useful_synthesis
turns_to_handoff
```

### `value_delta`

**Definición:**

> ¿Después del handoff el usuario sabe algo útil sobre cómo abordar su situación que no sabía antes de entrar?

**Evaluación humana:**

```text
PASS
PARTIAL
FAIL
```

- `PASS`: el usuario identifica una claridad nueva y concreta sobre cómo abordar su situación.
- `PARTIAL`: el usuario reconoce alguna claridad nueva, pero sigue siendo vaga, repetitiva o insuficiente para orientar el siguiente paso.
- `FAIL`: el handoff solo repite lo que el usuario ya había dicho o no deja una orientación nueva utilizable.

### `starteria_continuation_value`

**Definición:**

> ¿Después del handoff queda claro qué valor adicional obtiene el usuario al convertir esta lectura en trabajo continuo dentro de Starteria?

**Evaluación humana:**

```text
PASS
PARTIAL
FAIL
```

- `PASS`: el usuario entiende por qué Starteria aporta valor más allá de una conversación puntual.
- `PARTIAL`: el usuario ve valor, pero todavía no queda claro por qué necesita convertirlo en un sistema continuo.
- `FAIL`: la lectura puede ser útil, pero no demuestra por qué continuar dentro de Starteria.

Esta métrica mide valor de continuidad, no intención comercial ni intención de registro.

La hipótesis queda apoyada solo si mejora claridad y framing de decisión sin aumentar la sensación de prescripción infundada, leakage de Steps o consultoría exhaustiva.

## 10. V2 change guardrail check

```text
V2_CHANGE_GUARDRAIL_CHECK
slice: Portfolio Entry → Value Handoff
logic_status: TESTABLE_HYPOTHESIS / CANDIDATE
implementation_status: NOT_IMPLEMENTED
visual_status: V2_TARGET_DEFINED
evidence_status: SUPPORTED_FINDING + TESTING_REQUIRED
authority_source: PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md
supporting_evidence: FND-006, FND-007, FND-008, FND-009, HYP-002, HYP-003
product_code_changed: NO
core_changed: NO
ai_prompt_changed: NO
schema_changed: NO
route_changed: NO
permissions_changed: NO
steps_changed: NO
acceptance_tests_defined: YES
implementation_authorized: NO
```

## 11. Conflictos observados

```text
CONFLICT
Contract: STARTERIA_AUTHORITY.md references docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md
Requirement: leer la autoridad Core antes de definir un target dependiente de ella
Current document/code: la ruta docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md no existe en este checkout; CURRENT_STATE.md y STARTERIA_V2_MANIFEST.md declaran el Core como candidata / requiere re-test
Observed mismatch: la autoridad referenciada no está disponible en la ruta indicada
Risk: no debe tratarse la ausencia como aprobación ni inferir semántica Core desde la implementación
Recommended treatment: KEEP el target documental y BLOCK cualquier promoción de autoridad hasta reconciliar la ruta y el estado del Core
Requires ADR: no para este documento; sí si una implementación posterior modifica Core o semántica de producto
```

## 12. Handoff de implementación futura

Una implementación posterior de esta slice debe producir, antes de código:

1. lectura y reconciliación de la ruta real del Core;
2. current-state audit actualizado del handoff;
3. tests de contrato, valor, negativos y E2E separados;
4. decisión explícita sobre la promoción de HYP-002/HYP-003;
5. reporte de implementación que demuestre que las superficies excluidas permanecen intactas.

Hasta entonces, este documento es únicamente el target candidato verificable.
