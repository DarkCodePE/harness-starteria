# Plan de benchmark del harness

**Versión:** v0.2 · **Fecha:** 2026-09-12 · **Estado:** propuesto, sin correr

Este documento responde tres preguntas que el harness no puede contestar hoy:

1. ¿Qué tan efectivo es el agente de Portfolio Entry, con un número que signifique algo?
2. ¿La rúbrica mide al agente, o mide al que puntúa?
3. ¿El agente se adapta cuando la persona **cambia de objetivo** a mitad de conversación?

> **Sigue siendo un plan, no una capacidad instalada.** Nada de acá corrió.
> `ADR-009 del harness` §5 dejó la suite de evals como criterio abierto y `verify.sh` sigue emitiendo
> ese aviso. Este documento lo especifica; no lo cierra.

## Qué cambió de v0.1 a v0.2

v0.1 se escribió sobre cuatro abstracts leídos a mano. v0.2 se escribió sobre un corpus de 42 fuentes
—el informe está en `research/notes/final_report_agent-harness-eval-metrics-b9db06.md`— y **corrige o
mejora cinco de sus afirmaciones**:

| v0.1 decía | v0.2 dice |
|---|---|
| Medir el objetivo acumulado esconde el cambio de objetivo | Correcto, **y hay cinco métricas propuestas**; v0.1 no nombraba ninguna. La que corresponde es **GCA** |
| Suite J con un fallo duro `F-SILENT-OVERWRITE` | La idea sirve, **la forma de puntuar era peor que la publicada**. Se reemplaza por el verificador secuencial de Gaia2 (§6) |
| El límite de 0–3 preguntas es una decisión de producto | Es un **eje de evaluación reconocido**: desempeño bajo presupuesto fijo de interacción, `b ∈ [0,100]` |
| "entre el 50% y el 90% de las citas no están sostenidas" | **Retirado.** No verificado. El número real es 50% (ALCE sobre ELI5) y 42–71% (FActScore) |
| El harness citaba el paper de "doble confound de medición" | **Retirado.** Esa frase no existe en ningún paper; era una paráfrasis. Lo que existe son `task validity` y `outcome validity` |

---

## 1. La tesis: fijar la unidad antes de instrumentar

**El problema no es que falten métricas.** Están formalizadas y tienen números medidos detrás. Lo que
casi nunca está fijado es **la unidad sobre la que se mide**, y cuando la unidad se mueve el número
deja de significar algo aunque la fórmula sea correcta.

Dos confirmaciones independientes, desde problemas distintos:

- **RefChecker** consiguió **95,0% de acuerdo entre anotadores** en detección de alucinaciones al
  cambiar la unidad de la oración a la **tripleta de claim**, con 19 a 26 puntos de ganancia de
  consistencia atribuidos a la granularidad.
- **GCA** resolvió la medición multi-turno cambiando la unidad del estado acumulado al **delta entre
  turnos**.

Ninguna inventó un algoritmo. Las dos redefinieron qué se cuenta.

**Para este harness eso es la mejor noticia del informe:** fijar la unidad es exactamente lo que un
contrato escrito puede hacer y un benchmark público casi nunca puede. La ventaja no está en tener
mejores métricas — está en tener `doc/`.

Y hay prueba de que sin unidad fija nada es comparable: un estudio de 41 modelos **tuvo que excluir un
modelo de su propia tabla** porque su puntaje de BANKING77 usó el split completo mientras los otros 40
usaron los primeros 500 ejemplos. La inconsistencia de splits ocurrió **entre modelos del mismo
experimento, con los mismos autores**.

---

## 2. Lo que el harness ya hacía bien, ahora con fuente

| Lo que el harness decidió | Cómo se llama afuera, y el número |
|---|---|
| Round 2: "tres corridas antes de concluir" | **`pass^k`**. Con tasa base 70%: `Pass@3 ≈ 97%` pero `Pass^3 = 34,3%` |
| Los nueve fallos duros, separados del puntaje | **Policy adherence.** τ-bench dice de su propia recompensa que es **necesaria pero no suficiente**: un agente puede pasar los chequeos y aun así violar la política, por ejemplo salteándose una confirmación requerida |
| La rúbrica de 14 puntos y no un PASS/FAIL binario | **FActScore rechaza el todo-o-nada por nombre**, porque asignar cero a dos generaciones distintas borra que una es más exacta |
| `ADR-002 del harness`: la fase 1 no ve la rúbrica | **Evaluator-decoupled audit**: usar para verificar un modelo que no participó de la selección, y tratar las anotaciones cruzadas como acuerdo entre anotadores y **nunca como verdad de oro** |
| `ADR-003 del harness`: nada se verifica solo, y se declara | **Ver abajo. Es el hallazgo más fuerte del informe para este repo** |
| `AI Harness §3`: no se exige coincidencia literal | En generación de preguntas, **un baseline ingenuo de plantilla+faceta encabeza BLEU, ROUGE y Coverage por puro calce léxico** |

### El número que justifica `ADR-003 del harness`

El checklist ABC —44 ítems, sintetizado sobre 17 benchmarks— aplicado a 10 benchmarks:

```text
7 de 10  fallan validez de tarea
7 de 10  fallan validez de resultado
10 de 10 fallan en REPORTE — el 80% no reconoció sus propias debilidades
```

Errores de estimación "hasta el 100% en términos relativos": un agente trivial saca 38% en τ-bench y
le gana a GPT-4o; KernelBench sobreestima 31% absoluto; OSWorld **subestima** a UI-TAR en 28%.

**Diez de diez fallan justo en la dimensión que este harness convirtió en costumbre.** `ADR-003 del
harness` declara que nada corre solo; el router dice qué NO cubre; `ADR-INDEX.md` tiene una columna
llamada "lo que se paga". Deja de ser una virtud blanda: es la dimensión donde el campo falla de forma
más uniforme.

### Y la afirmación de que el harness es el objeto medido

Verbatim, de Anthropic: **"the harness itself is part of what is being tested"** y **"we're evaluating
the harness and the model working together."**

La literatura todavía no controla ese eje, y lo admite. El marco de confiabilidad de Princeton lo
escribe como limitación propia: *"Scaffold diversity. We evaluate each benchmark using a single
scaffold... other scaffolds could yield qualitatively different reliability profiles."* La mitigación
aplicada es simple —fijar el andamiaje para todos los modelos, como hace Gaia2— y es la misma forma
que `ADR-002 del harness` ya usa para aislar la fase 1.

---

## 3. El instrumento: `pass^k`

Definición formal, del paper que la introdujo: `pass^k` es la probabilidad de que **las k** corridas
i.i.d. de una tarea sean exitosas, promediada sobre tareas.

```text
pass^k  = E_task[ C(c,k) / C(n,k) ]         confiabilidad
pass@k  = 1 − E_task[ C(n−c,k) / C(n,k) ]   capacidad
```

Medido: gpt-4o con function calling supera el 60% en `pass^1` sobre τ-retail y **cae por debajo del
25% en `pass^8`**.

### Por qué esto no es promediar suites

`/starteria-probar` prohíbe promediar suites y tiene razón. Son dos números distintos:

| | Qué es | ¿Sirve? |
|---|---|---|
| Promedio de suite | "70% de Suite B pasó" | **No.** Esconde qué caso falló y en qué capa. Sigue prohibido |
| `pass^k` de **un** caso | "PE-B03 pasó 3 de 3" | **Sí.** Mismo caso, misma capa, medido contra su propia varianza |

**Regla que lo ata a la rúbrica existente:** una corrida cuenta como éxito solo si no tiene ningún
fallo duro **y** puntúa 12–14. Un `REVIEW` es un fallo para `pass^k`.

### Presupuesto, y por qué `pass^3` y no `pass^8`

La fase 2 la puntúa una persona, así que ocho corridas por caso son ocho lecturas.

| Ronda | Casos | Corridas | Reporta |
|---|---|---|---|
| **R1** | 20–25 | 1 | `pass^1`. Errores gruesos |
| **R2** | los que fallaron o quedaron en `REVIEW` | 5 | `pass^3`. Separa fallo estable de ruido |
| **R3** | casos reales (`/starteria-caso`) | 3 | `pass^3` + utilidad |

### Por qué el campo tardó en medir esto

Los benchmarks se retiran convencionalmente al 90–95% de "saturación" atribuyendo los errores
residuales a ruido de etiqueta, **así que a los modelos nunca se los empujó a demostrar consistencia,
solo capacidad**. Re-etiquetados, ni los mejores llegan a 100%.

Y el dato que cierra el argumento: **24 meses de desarrollo de modelos produjeron solo mejoras
marginales de confiabilidad mientras los puntajes de capacidad subían.** Capacidad y confiabilidad
divergen, medido.

---

## 4. El caso de éxito: `PE-B03`

```text
PE-B03 — Solution-first puro
Input: "Quiero implementar un chatbot para ventas."
```

Es el único de las nueve suites que ejercita **los cuatro pasos, incluido el condicional**. Un caso
`strategy_first` saltea `entry-03` y no prueba la mitad del pipeline.

| Paso | Qué tiene que producir | Etiqueta si falla |
|---|---|---|
| `entry-01` | `entry_state = solution_first` · `primary_intent = initiative_governance` | `F-ENTRY_STATE` · `F-INTENT` |
| `entry-02` | `solution` extraída, **sin** goal ni metric inventados | `F-HALLUCINATION` · `F-PROVENANCE` |
| `entry-03` | `reverse_alignment_required = true`, enlaces faltantes nombrados | `F-REVERSE_ALIGNMENT` |
| `entry-04` | 1–2 preguntas, la primera por el cambio esperado de negocio | `F-QUESTION_WEAK` · `F-QUESTION_OVERLOAD` |
| agente | ninguna Initiative, ningún Step | `F-CANONICALIZATION` · `F-STEP_LEAK` |

**Definición de éxito de v0.2:** `pass^3 = 1.0` con aislamiento declarado en las tres corridas y
registro que **no** diga `CONTAMINADO`. Hasta que eso pase, cualquier otro número de este plan es
decorativo.

---

## 5. Validar la rúbrica: quién puntúa al que puntúa

**Ningún juez LLM evaluado resultó uniformemente confiable**, y la consistencia se rompe por cambios
simples de formato, paráfrasis, verbosidad y etiqueta invertida.

### El dato que decide la arquitectura

Sobre CiteME, ChatGPT-4o alcanza **precisión 1,0 en las cuatro variantes de prompt con recall de 0,16
a 0,38**. Casi no acepta nada incorrecto, pero **rechaza la mayoría de lo correcto**, por falta de
contexto de dominio.

**Un puntuador automático de esta rúbrica produciría falsos `FAIL`, no falsos `PASS`.** Es la dirección
más segura del error y a la vez vuelve el puntaje inservible como medida. Fallar cerrado no es medir
bien.

Y los sustitutos automáticos rinden poco donde se los midió contra personas: las dos métricas estándar
de diálogo multi-turno correlacionan con juicio humano en **0,33 y 0,37** sobre 11 evaluadores y 100
diálogos. El juez LLM evita los colapsos de los scorers pero **cuesta unas 100 veces más, no es
determinista y descarta el 15% de los casos**. El techo humano en CiteME es 69,7% a 38,2 s por
pregunta, contra 4,2–18,5% de los modelos frontera.

### Protocolo, y es barato

No hace falta correr el agente de nuevo. Se congela un `ACTUAL` que ya salió de una fase 1 y se lo
puntúa perturbado:

| Perturbación | Qué se cambia | Qué debería pasar |
|---|---|---|
| **Estabilidad** | nada; 3 veces en hilos distintos | el mismo veredicto |
| **Formato** | reordenar los campos del análisis | el mismo veredicto |
| **Paráfrasis** | reescribir la síntesis sin cambiar lo que afirma | el mismo veredicto |
| **Verbosidad** | tres párrafos que no agregan nada | el mismo veredicto; si sube, premia largo |
| **Etiqueta invertida** | plantar un `baseline` inventado a mano | **tiene** que caer a `FAIL` |

La última es la prueba negativa de la rúbrica, y la más fácil de saltear. Un juez que no detecta un
`baseline` plantado a propósito no mide nada, y todos los números anteriores se caen con él.

**Predicción anotada antes de correr, para no racionalizarla después:** de las siete dimensiones,
**síntesis UX va a ser la más inestable.** Las otras seis son checklist; esa es calidad lingüística, y
ahí los jueces son medidamente menos confiables.

### La objeción más seria que el corpus le hace a `ADR-002 del harness`

En 321 errores de evaluación de atribución analizados, **el 26,8% viene de desajuste de acceso a la
información entre humano y modelo** — el anotador ve la página completa, el modelo solo el fragmento.

En este harness esa asimetría es **deliberada**: la fase 1 ve los contratos y el input, la fase 2 ve la
rúbrica y el `EXPECTED`. No lo invalida —la asimetría corre al revés, acá el puntuador ve *más*— pero
es la objeción más fuerte que aparece, y queda escrita acá antes de que la encuentre alguien en tres
meses.

---

## 6. Adaptación a cambio de objetivo

**El contrato ya especifica el mecanismo y nadie lo probó nunca.** El Agent Contract §22 dice que
reanalizar genera nueva `analysis_version` y que *"un análisis nuevo no debe borrar silenciosamente el
anterior; el anterior puede quedar `SUPERSEDED`"*. `SUPERSEDED` está en la taxonomía desde el día uno.
**Las nueve suites son de un solo turno.**

### Las cinco métricas, y por qué cuatro se equivocan

| Métrica | Qué puntúa | Su falla |
|---|---|---|
| **JGA** | estado acumulado por turno | Un error pone en **cero casi todos los turnos siguientes**: la propagación castiga de más |
| **AGA** | solo slots con valor verdadero no vacío | **Orientada a recall y ciega a los falsos positivos** |
| **RSA** | denominador = slots únicos de la unión predicho ∪ verdadero | Mejor discriminación (spread de 10 modelos: 1,09 → 5,47 pts), pero sigue midiendo estado |
| **FGA** | error local vs heredado, con decaimiento exponencial | Sesgada por distribución desigual de errores (correlación 0,59 con no-uniformidad, contra 0,40 de GCA) |
| **GCA** | **el delta del turno**, promediado sobre alteraciones de estado y no sobre turnos | La que corresponde |

**El argumento a favor de GCA es un ejemplo de juguete, y es contundente:** entre dos predictores, uno
que acierta 5 de 7 y otro 1 de 7, **JGA, FGA, AGA y RSA las cuatro ordenan al peor por encima del
mejor**. Solo GCA ordena bien: 73,33 contra 15,49.

Si el harness mide cambio de objetivo con la métrica que elegiría por intuición, **va a premiar al peor
agente y no se va a enterar**.

### Ningún dataset público anota el turno del cambio

- **SGD** predice solo el delta por turno y reconstruye el objetivo sumando deltas. Su simulador cambia
  de intención hasta cinco veces por escenario, **pero no existe etiqueta de "cambio de objetivo"**.
- **MultiWOZ** lo produce a propósito —restricciones iniciales sin resultado en la base, que fuerzan un
  valor alternativo— y **tampoco lo anota**. Solo se recupera comparando estados consecutivos.
- **Gaia2** tiene un split de Adaptability de 160 escenarios, pero exige adaptarse a cambios del
  entorno que son **consecuencia de acciones previas del agente**: el objetivo general del usuario
  nunca cambia, y el dato que lo supera suele venir de **un tercero**. Su split de ambigüedad es
  explícitamente de un solo turno: *"they do not include a clarification message from the User."*

**Conclusión: la Suite J no es redundante.** Es el análogo que no existe.

### Suite J, con la forma de puntuar corregida

**v0.1 proponía un fallo duro `F-SILENT-OVERWRITE`. Se reemplaza**, porque Gaia2 resuelve mejor el
mismo problema. Su verificador **no chequea estado final**: es sensible a la secuencia y distingue una
trayectoria donde el agente se equivoca y se corrige de una donde acierta de entrada.

**La regla que la Suite J debe copiar:**

> Exigir que la acción correctiva aparezca **causalmente después** del evento que contradice, y **no
> penalizar la acción inicial** — era correcta según la instrucción original. No producir la corrección
> hace fallar el caso.

Es más preciso que castigar la sobrescritura: distingue "no se enteró" de "actuó con lo que tenía".

| Id | Turno 1 | Turno 2 | Qué se exige en el turno 2 |
|---|---|---|---|
| `PE-J01` | "Mañana tengo comité y necesito presentar el estado de mis iniciativas." | "En realidad necesito decidir cuáles cortamos." | `primary_intent` pasa a `portfolio_prioritization`; el anterior queda `SUPERSEDED` |
| `PE-J02` | "Quiero aumentar las ventas en 200 este trimestre." | "Ya elegimos: vamos con un chatbot." | `reverse_alignment_required` pasa a `true`. **El paso 3 se activa recién acá** |
| `PE-J03` | "Tengo 18 iniciativas y no sé cuáles están alineadas." | "Me equivoqué, son 30 y cuatro ya están cerradas." | Contradicción preservada; `portfolio_size` no se sobrescribe en silencio |
| `PE-J04` | "Necesito ordenar esto." *(el agente pregunta qué)* | "El presupuesto del año que viene, no las iniciativas." | `entry_state` sale de `unknown`; la pregunta ya hecha no se repite |

**Métrica: por delta, no por estado acumulado.** Y el crédito se da por la corrección presente y
causalmente ordenada.

> **Esto no lo puede agregar el harness.** Sumar una suite al AI Harness es un cambio de contrato y
> `ADR-007 del harness` lo prohíbe. El camino es `/starteria-autoridad` → `/starteria-decision` → **el
> primer ADR de producto**, y después lo integra una persona.

### La advertencia que hay que escribir antes de que pase

Cuando MultiWOZ 2.0 pasó a 2.1 se corrigieron **más del 32% de las anotaciones de estado en cerca del
40% de los turnos**, y **los cinco modelos evaluados bajaron su JGA**.

**Limpiar la verdad de referencia hizo empeorar los números.** Es la contracara de *"no ajustés el
`EXPECTED` para que el caso pase"*: si alguien corrige bien un `EXPECTED` y los puntajes caen, **no es
una regresión**. Conviene que esté escrito ahora, porque en el momento va a parecer una.

---

## 7. Qué skill falta: una

### `/starteria-medir`

Ninguna de las ocho corre un caso `n` veces ni agrega nada. El Round 2 pide tres corridas y **nadie las
junta**: hoy son tres registros que una persona compara de memoria.

| | Qué haría |
|---|---|
| **Entrada** | id de caso o suite, más `n` |
| **Hace** | `n` fases 1 aisladas → puntúa cada una → `pass^k` → las cinco perturbaciones de §5 sobre un `ACTUAL` congelado |
| **Devuelve** | `pass^1` y `pass^3` por caso, qué dimensión se movió entre corridas, y el veredicto de la prueba negativa |
| **No hace** | no promedia suites, no ajusta el `EXPECTED`, no repara, no promueve |

**Y para el plan de preguntas, dos instrumentos que v0.1 no tenía:**

- **Presupuesto fijo de interacción**, `b ∈ [0,100]`: el límite de 0–3 deja de ser una decisión de
  producto y pasa a ser un punto sobre un eje medible.
- **Sustitución oracle**, para romper una circularidad real: no se puede evaluar *cuándo* preguntar si
  las preguntas que se generarían son malas. Se fija la calidad de la pregunta y se mide solo la
  decisión.

Y un reencuadre que le cambia el significado a la rúbrica: **"cuándo preguntar" no es clasificación,
es estimación de incertidumbre**, y hay que separar la epistémica de la aleatoria. `question_count = 0`
no es "no encontré huecos": es "mi incertidumbre está debajo del umbral". La rúbrica hoy los puntúa
igual.

### Las otras dos no son skills

- **Suite J** es un cambio de contrato en `doc/`. `/starteria-caso` escribe casos de un turno y no
  tiene dónde poner un turno 2.
- **La validación del juez** es un procedimiento **dentro** de `/starteria-medir`.

### El costo exacto de la novena skill

`scripts/verify.sh:16` tiene `ESPERADAS=8` escrito a mano. Agregar `skills/starteria-medir/` **hace
fallar el gate** hasta tocar cuatro cosas:

1. `skills/starteria-medir/SKILL.md` con frontmatter y `disable-model-invocation: true`;
2. `scripts/verify.sh` → `ESPERADAS=9`;
3. `PARA-CHATGPT.md` §4 → `scripts/sync-para-chatgpt.py --write`;
4. la tabla de `AGENTS.md` → la comprueba el bloque 3b del gate.

Más el router, que pasa a mencionar nueve comandos. **Que el gate falle en los cuatro casos es la
noticia buena.**

---

## 8. Criterio de salida del benchmark

El harness está **medido**, y no solo escrito, cuando:

- [ ] `PE-B03` tiene `pass^3 = 1.0` con aislamiento declarado en las tres corridas;
- [ ] las 9 suites corrieron R1 completo, con `pass^1` por caso;
- [ ] ningún caso presenta fallo duro (`AI Harness §19`);
- [ ] **la prueba negativa de la rúbrica pasa**: un `baseline` plantado a mano produce `FAIL`;
- [ ] las cinco perturbaciones de §5 no mueven el veredicto de ningún caso en `PASS`;
- [ ] está registrado qué dimensión resultó más inestable, con su número;
- [ ] Suite J existe en `doc/` con ADR de producto firmado, **o** está registrado por qué se decidió no
      medir adaptación a cambio de objetivo, sabiendo que ningún dataset público la cubre.

El último admite las dos respuestas. No admite quedar sin contestar.

---

## 9. Fuentes

El corpus completo —42 fuentes, con los números y las citas verbatim— está en el informe:

```text
research/notes/final_report_agent-harness-eval-metrics-b9db06.md
```

Las que sostienen las afirmaciones de este plan:

| Tema | Fuente |
|---|---|
| `pass^k`, policy adherence | τ-bench · [arXiv:2406.12045](https://arxiv.org/abs/2406.12045) |
| Validez de benchmarks, ABC, 10/10 en reporte | [arXiv:2507.02825](https://arxiv.org/abs/2507.02825) |
| El harness como objeto medido | [Anthropic Engineering](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) |
| Capacidad ≠ confiabilidad, confound de scaffold | [arXiv:2602.16666](https://arxiv.org/abs/2602.16666) |
| Saturación y consistencia nunca medida | [arXiv:2502.03461](https://arxiv.org/abs/2502.03461) |
| **GCA** | [arXiv:2403.11123](https://arxiv.org/abs/2403.11123) |
| JGA, AGA, FGA | [arXiv:2204.03375](https://arxiv.org/abs/2204.03375) |
| RSA, desajuste multi-turno | [arXiv:2203.03123](https://arxiv.org/abs/2203.03123) |
| MultiWOZ y su corrección 2.1 | [arXiv:1810.00278](https://arxiv.org/abs/1810.00278) · [arXiv:1907.01669](https://arxiv.org/abs/1907.01669) |
| SGD | [arXiv:1909.05855](https://arxiv.org/abs/1909.05855) |
| Gaia2 / ARE | [arXiv:2602.11964](https://arxiv.org/abs/2602.11964) · [arXiv:2509.17158](https://arxiv.org/abs/2509.17158) |
| Confiabilidad del juez | [arXiv:2603.05399](https://arxiv.org/abs/2603.05399) · [arXiv:2510.17853](https://arxiv.org/abs/2510.17853) |
| Presupuesto de interacción, oracle | [arXiv:2311.09469](https://arxiv.org/abs/2311.09469) |
| Unidad de medición, tripletas | [arXiv:2405.14486](https://arxiv.org/abs/2405.14486) |
| Rechazo del todo-o-nada | [arXiv:2305.14251](https://arxiv.org/abs/2305.14251) |
| Desacople del evaluador | [arXiv:2606.23915](https://arxiv.org/abs/2606.23915) |

### Los límites del informe que produjo esto

El informe corrió en modo reducido, y eso tiene consecuencias que conviene no tapar:

- **Ninguna cita fue verificada contra el cuerpo de su fuente.** No corrió esa etapa. Y el corpus mide
  que eso falla seguido —los mejores modelos carecen de soporte completo de cita la mitad de las veces
  en respuestas largas— y que **la exactitud factual cae ~42% al pasar de 2 a 150 llamadas de
  herramienta mientras la validez de los links se mantiene sobre 92%**. Ese trabajo hizo decenas.
- **Seis fuentes entraron por curación manual**, sin puntaje de autoridad, por límite de tasa de la API
  de conteo de citas. Entre ellas el paper de validez y el trabajo original de atribución.
- **No corrió la etapa que pregunta "qué fuente, si existiera, daría vuelta esta conclusión"** — la que
  habría buscado evidencia contra la tesis de §1.
- **Cuatro datos que venían de resúmenes de búsqueda no sobrevivieron** al contacto con la fuente.
  Están retirados en la tabla de arriba.
