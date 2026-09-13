# Blueprint: el workflow de los cuatro pasos, y por qué el harness corre el mismo

**Versión:** v0.1
**Fecha:** 2026-09-11

Este documento hace dos cosas. Primero describe el workflow completo de Portfolio Entry: los cuatro
pasos `entry-01` a `entry-04`, qué recibe cada uno, qué produce y qué tiene prohibido hacer.
Después muestra que **el harness de `skills/` es el mismo workflow aplicado un nivel más arriba**, y
nombra los cinco lugares donde todavía no lo cumple.

La fuente es `doc/`: el Agent Contract y los cuatro Skill Contracts. Acá no hay reglas nuevas. Si
algo de este archivo contradice `doc/`, gana `doc/`.

---

# Parte 1 — El workflow de los cuatro pasos

## 1.1 Qué es este pipeline

Una máquina que convierte **texto humano ambiguo** en **una interpretación provisional, estructurada
y trazable**, sin producir una sola afirmación que el usuario no haya respaldado.

```text
raw_input: string
   │  (lo único obligatorio; sin Organization, sin Initiative, sin RAG, sin archivos)
   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Portfolio Entry Agent — orquestador cognitivo liviano                    │
│                                                                          │
│  [1] entry-01-intent-detection    ¿desde dónde entra y qué necesita?     │
│            │                                                             │
│            │ entry_state, primary_intent, secondary_intents              │
│            ▼                                                             │
│  [2] entry-02-context-extraction  ¿qué sabemos realmente?                │
│            │                                                             │
│            │ extracted_context, contradictions, provenance               │
│            ▼                                                             │
│  [3] entry-03-reverse-alignment   ¿qué falta para justificarlo?          │
│            │        (solo si solution_first / initiative_first)          │
│            │ present_links, missing_links, suggested_focus               │
│            ▼                                                             │
│  [4] entry-04-question-planner    ¿qué es lo mínimo que hay que aclarar? │
│            │                                                             │
│            │ 0–3 questions, cada una con reason_to_ask                   │
└────────────┼─────────────────────────────────────────────────────────────┘
             ▼
      PortfolioEntryAnalysis  (analysis_status: pending | ready |
             │                 insufficient_input | failed | superseded)
             ▼
      Pantalla 2 — acá pregunta una persona y acá se confirma.
                   Pantalla 1 planifica; nunca confirma.
```

`ready` significa *alcanza para seguir*. No significa *confirmado*. Es la distinción que sostiene
todo lo demás.

La secuencia canónica de orquestación son diez pasos (Agent Contract §13): validar input, detectar
intent + entry state, extraer contexto, detectar ambigüedad y contradicción, evaluar si hace falta
reverse alignment, determinar contexto crítico faltante, planificar 0–3 preguntas, ensamblar el
análisis, validar invariantes, devolver. El Tech Spec puede optimizar las llamadas; no puede sacar
ninguna de esas responsabilidades. **No se permiten loops cognitivos abiertos.**

## 1.2 Paso 1 — `entry-01-intent-detection`

**La pregunta:** ¿desde qué estado entra este usuario y cuál parece ser su necesidad principal?

**Entra:** `raw_input`. Nada más.

**Sale:** `primary_intent`, `secondary_intents`, `entry_state`, `ambiguities`,
`supporting_signals`, `status` (`classified` | `ambiguous` | `insufficient_input`).

Las dos taxonomías son **dimensiones distintas** y no se colapsan en una etiqueta:

| `entry_state` — desde dónde entra | `intent` — qué trabajo quiere resolver |
|---|---|
| `strategy_first` · `portfolio_first` | `strategic_goal` · `portfolio_alignment` |
| `initiative_first` · `solution_first` | `portfolio_tracking` · `portfolio_prioritization` |
| `problem_first` · `opportunity_first` | `portfolio_reporting` · `initiative_governance` |
| `decision_first` · `reporting_first` · `unknown` | `unknown` |

El ejemplo que fija la regla:

```text
"Tengo 18 iniciativas y mañana debo explicar a dirección cuáles deberíamos mantener."

entry_state       = portfolio_first        ← desde dónde
primary_intent    = portfolio_reporting    ← el job de ahora
secondary_intents = [portfolio_prioritization]
```

Las reglas que hacen el trabajo real son ID-01 a ID-10. Las tres que más se violan:

- **ID-04 — el vocabulario no es verdad.** "estrategia", "innovación", "IA", "proyecto" no clasifican
  nada por sí solas.
- **ID-05 — clasificar el job de *ahora*,** no el tema general del texto. "Tenemos iniciativas de IA
  y mañana presento su estado" es reporting, no IA.
- **ID-03 — `unknown` es válido.** No se inventa una intención para evitarlo.

**Prohibido:** extraer el contexto completo, generar preguntas, correr reverse alignment, decidir.
Una contradicción numérica en el input **no es asunto de este paso**: la maneja el paso 2.

## 1.3 Paso 2 — `entry-02-context-extraction`

**La pregunta:** ¿qué se puede estructurar de lo que el usuario dijo, sin inventar?

**Entra:** `raw_input` + `entry_state` e intents del paso 1 (ayudan a interpretar; **no autorizan a
inventar**: `strategy_first` no implica que existan metric, baseline, target ni horizon).

**Sale:** `extracted_context`, `ambiguities`, `contradictions`, `missing_obvious_context`,
`provenance`, `status` (`extracted` | `partial` | `insufficient_input`).

Campos extraíbles, **solo con soporte en el texto**: `goal`, `metric`, `target`, `baseline`,
`horizon`, `problem`, `opportunity`, `solution`, `portfolio_size`, `initiatives_mentioned`,
`decision_need`, `reporting_need`, `constraints`. **La ausencia de un campo no es un error.**

Este paso existe para no colapsar cuatro cosas distintas en una:

```text
1. lo que el usuario declaró literalmente     USER_DECLARED
2. lo que se extrae de su texto               EXTRACTED_FROM_USER_TEXT
3. lo que requiere inferencia                 AI_INFERRED
4. lo que todavía no sabemos                  (ausencia, o baseline_known = false)
```

Más `review_disposition`: `UNREVIEWED` | `USER_CONFIRMED` | `USER_REJECTED` | `SUPERSEDED`.
Pantalla 1 produce `UNREVIEWED`. **Este paso nunca puede producir `USER_CONFIRMED`.**

Lo que separa extracción de autofill:

- **CE-01 — solo con soporte.** De "aumentar las ventas en 200 este trimestre" salen goal, target y
  horizon. **No** sale `baseline = 1000` ni `metric = revenue_growth_rate`.
- **CE-02 — la inferencia se conserva marcada.** `metric = ventas` con `origin = AI_INFERRED` es
  legítimo; presentarlo como dato confirmado no.
- **CE-03 — no sobre-normalizar.** "este trimestre" se guarda como "este trimestre", no como fechas.
- **CE-06 — preservar la literalidad cuando la precisión importa.** "mejorar mucho" no se convierte
  en un número.
- **CE-07 — la ausencia explícita es información.** "No tenemos baseline" se registra como tal.
- **Contradicción: se preservan los dos valores.** "Tenemos 12, en realidad creo que son 20" guarda
  `12` y `~20` y marca el conflicto. **No se elige en silencio.**

`missing_obvious_context` es un **inventario**, no una lista de preguntas: describir ausencias es de
este paso, priorizarlas es de los pasos 3 y 4.

## 1.4 Paso 3 — `entry-03-reverse-alignment`

**La pregunta:** ¿esta solución o iniciativa está conectada con una razón de negocio comprensible?

**Se activa** cuando `entry_state` es `solution_first` o `initiative_first` **y** falta conexión
suficiente. No se activa por defecto para los otros seis entry states.

**Sale:** `reverse_alignment_required`, `subject_type` (`solution` | `initiative` | `unknown`),
`subject`, `connection_state`, `present_links`, `missing_links`, `ambiguities`, `suggested_focus`,
`provenance`, `status` (`not_required` | `partial` | `required` | `insufficient_input`).

La cadena que recorre:

```text
solución / iniciativa
   → cambio esperado          qué sería distinto en la realidad si funciona
   → métrica o señal          cómo se notaría, observable
   → intención de negocio     por qué le importa al negocio
   → criterio de continuidad  qué habría que ver para justificar que siga
```

**La cadena es una guía de suficiencia, no un formulario.** No se exige siempre target numérico,
baseline, KPI formal, business case, ROI ni evidencia validada. Si la lógica ya está conectada
—"Atlas busca reducir de 10 a 5 días el onboarding para reducir abandono este trimestre"— el
resultado correcto es `not_required` o `partial`: **no se genera fricción artificial.**

El caso que justifica que este paso exista por separado es la **solución disfrazada de problema**:

```text
"El problema es que no tenemos una app para clientes."

subject_type = solution        ← es una ausencia de solución
subject      = app para clientes
reverse_alignment_required = true
missing: qué cambiaría si existiera
```

**Prohibido:** rechazar la solución, validarla, compararla con otra, calcular ROI, crear Initiative,
activar Step 0, definir gates. Si falta un enlace, la salida correcta es `missing_links = [...]`,
**no rellenarlo**. Este paso termina *antes* del Initiative Core.

## 1.5 Paso 4 — `entry-04-question-planner`

**La pregunta:** ¿qué es lo mínimo que hay que preguntar para no orientar mal la siguiente pantalla?

**Sale:** `QuestionPlan` con `questions`, `question_count`, `planner_status`, `rationale_summary`.
Cada `QuestionItem`: `id`, `question`, `reason_to_ask`, `resolves`, `priority`,
`expected_answer_type`.

**Límite duro: 0–3.** `0` cuando ya alcanza. `3` es el máximo excepcional. Más de 3 no está
permitido en este slice, y producir más es uno de los nueve fallos duros.

Prioridad: intención de negocio ambigua → cambio esperado desconocido → señal crítica faltante →
confusión problema/solución → necesidad concreta de decisión o reporting → contexto cuya ausencia
desviaría materialmente lo que viene.

Las reglas QP-01 a QP-08, y las dos que cambian más el resultado:

- **QP-03 — una pregunta puede resolver varios huecos.** Si faltan `expected_change` y
  `business_intent`, la pregunta correcta es una: *"Si esto funciona, ¿qué tendría que cambiar y por
  qué le importa al negocio?"* No una por enlace.
- **QP-04 — no sugerir la respuesta.** "¿Tu KPI debería ser conversión?" está mal. "¿Qué señal te
  indicaría que esto está funcionando?" está bien.

Y la **stopping rule**: dejar de preguntar cuando ya alcanza para Pantalla 2, cuando lo que queda es
*nice to have*, cuando la incertidumbre pertenece a una etapa posterior, o cuando resolverla
implicaría entrar en Step 0 o en Portfolio setup.

**Prohibido:** responder las preguntas por el usuario, inventar huecos, usar taxonomía interna en el
copy visible (`entry_state`, `StrategicFront`, "¿qué Step corresponde?"), pedir sponsor, presupuesto,
equipo, cronograma o hipótesis de experimento.

## 1.6 Los seis invariantes del workflow

Los cuatro pasos son la forma. Esto es el contenido, y es lo único que transfiere a otro dominio.

| | Invariante | Cómo se rompe | Etiqueta de fallo |
|---|---|---|---|
| **I-1** | Dos dimensiones que se colapsan fácil se mantienen separadas | una sola etiqueta para "desde dónde" y "qué necesita" | `F-INTENT` · `F-ENTRY_STATE` |
| **I-2** | Cuatro grados de certeza, no uno: declarado / extraído / inferido / desconocido | autofill por sentido común | `F-HALLUCINATION` · `F-PROVENANCE` |
| **I-3** | El hueco se nombra, no se llena | inventar el enlace faltante en vez de listarlo | `F-REVERSE_ALIGNMENT` |
| **I-4** | Se pregunta lo mínimo material, y se para | interrogatorio de completitud | `F-QUESTION_OVERLOAD` · `F-QUESTION_WEAK` |
| **I-5** | Quien interpreta no confirma | `AI_INFERRED` tratado como confirmado | `F-AUTHORITY` · `F-CANONICALIZATION` |
| **I-6** | Un registro honesto gana a un registro prolijo | elegir en silencio entre dos valores en conflicto | `F-HALLUCINATION` |

I-5 es `INV-03` del Core Contract: *la IA propone, la autoridad organizacional se queda con la
persona.* Los otros cinco existen para que I-5 sea verificable en vez de decorativo.

---

# Parte 2 — El harness corre el mismo workflow

## 2.1 La tesis

El producto toma la situación de negocio de un usuario, ambigua, y devuelve una interpretación
provisional que una persona confirma. **El harness toma el pedido de un mantenedor, ambiguo, y
devuelve una interpretación provisional que una persona aprueba.** Mismo tipo de máquina, un nivel
más arriba.

No es una analogía: las reglas coinciden una por una.

```text
PRODUCTO                                  HARNESS
raw_input del usuario                     "quiero cambiar algo" del mantenedor
      ▼                                         ▼
entry-01  clasificar                      /starteria            enrutar
entry-02  extraer con provenance          /starteria-afilar     hecho vs decisión
entry-03  cadena de justificación         /starteria-autoridad  cadena de autoridad
entry-04  0–3 preguntas materiales        /starteria-afilar     la frontera
      ▼                                         ▼
PortfolioEntryAnalysis (provisional)      /starteria-probar   medir, no reparar
                                          /starteria-caso     el caso, sin integrarlo
                                          /starteria-cierre   el estado, a mano
      ▼                                         ▼
Pantalla 2: la persona confirma           /starteria-decision: ADR en `propuesto`,
                                          la persona firma
```

## 2.2 Paso por paso, con la regla que coincide

| Paso del producto | Comando | La misma regla, dicha de otra forma |
|---|---|---|
| `entry-01` clasifica dos dimensiones y admite `unknown` | `/starteria` | La tabla "qué comando para qué situación" **es** una taxonomía de entry states del mantenedor: "tenés una idea difusa", "querés cambiar algo", "un usuario real dijo algo". Y el router dice qué **no** cubre el harness, que es el `unknown` explícito. |
| `entry-02` separa declarado de extraído de inferido | `/starteria-afilar` | *"Los hechos los buscás vos. Las decisiones son de la persona."* Es provenance con otro nombre: lo que está en `doc/` es `EXTRACTED_FROM_USER_TEXT` y lo busca el agente; lo que decide el negocio es `USER_DECLARED` y se pregunta. Y `/starteria-decision`: **"Si no hay evidencia, escribí `ninguna`"** es CE-07, la ausencia explícita como información. |
| `entry-03` recorre la cadena y nombra los enlaces faltantes | `/starteria-autoridad` | La cadena de autoridad se recorre igual que la de alineamiento inverso, y termina igual: el bloque `CONFLICT` **nombra la contradicción sin elegir una lectura**. Es I-3 literal. Y: *"si el documento que le tocaría al cambio no existe, decilo con todas las letras"* es `missing_links`. |
| `entry-04` pregunta 0–3 y para | `/starteria-afilar` | La frontera es la stopping rule: se pregunta lo que se puede contestar **ahora**, una ronda, y se termina cuando la frontera está vacía. *"No hagas veinte preguntas de una"* es QP-07. *"No cierres una pregunta por la persona"* es "no responder las preguntas por el usuario". |
| ensamblar sin confirmar | `/starteria-probar` | *"Este comando mide, no repara."* Y **"no ajustés lo esperado para que el caso pase"** es I-6: preservar el registro incómodo. `CONTAMINADO` es la misma idea en su forma más cruda —*"un registro que miente es peor que no tener registro"*—, y que la capa de fallo pueda ser `unknown` es ID-03. |
| `status = insufficient_input` es un resultado | `/starteria-caso` | *"Si al leer los contratos no queda claro qué debería hacer el agente, el hueco no está en el caso, está en el contrato."* Se escribe el caso con el esperado **abierto**. Es `insufficient_input` como hallazgo, no como falla. |
| Pantalla 1 planifica, Pantalla 2 confirma | `/starteria-decision` | *"Vos podés escribir el ADR en `propuesto`. No lo podés pasar a `aceptado`."* Es I-5 palabra por palabra, y el ADR lo cita: `INV-03`. |
| el agente no muta objetos canónicos | todos | **Ningún comando escribe en `doc/`** (`ADR-007`). `doc/` es al harness lo que los objetos canónicos son al agente. |

Dos coincidencias más, que no son de paso sino de postura:

- **No escalar un fallo aislado.** El AI Harness §17 dice que un cambio de contrato sale de un
  *patrón* de fallos. `/starteria-autoridad` lo repite como "el error más caro de este harness".
  El producto lo dice de la incertidumbre; el harness, de sí mismo.
- **Buscar dónde deja de funcionar.** *"El harness no existe para demostrar que el agente funciona"*
  (§22) y *"Starteria no debe empezar ayudando a ejecutar una solución que todavía no sabe
  justificar"* (`entry-03` §27) son la misma frase apuntando a objetos distintos.

## 2.3 Los cinco lugares donde el harness todavía no cumple su propio workflow

Esto es la parte útil del blueprint. Cada hueco está nombrado con la etiqueta de fallo que le
correspondería si el harness fuera evaluado con su propia rúbrica.

**H-1 · El harness no clasifica su propia entrada.** `F-ENTRY_STATE`
El producto tiene un paso dedicado a separar "desde dónde entra" de "qué necesita", y lo registra.
El harness enruta y no anota nada. Un pedido `solution_first` al harness —"quiero que el harness
tenga un comando que haga X"— entra sin que nadie lo marque como tal, y es **exactamente** el
disparador de `entry-03` del lado producto. Hoy se trata igual que un pedido `problem_first`.

**H-2 · `/starteria-afilar` no tiene techo de preguntas.** `F-QUESTION_OVERLOAD`
El producto corta en 3 y escribe su stopping rule. "Toda la frontera en una ronda" acota la *forma*,
no la *cantidad*: una frontera ancha son doce preguntas y el comando no lo prohíbe. Del lado
producto eso invalida el caso aunque el puntaje sea alto.

**H-3 · La salida de `/starteria-afilar` no lleva provenance.** `F-PROVENANCE`
Devuelve "cinco líneas con el entendimiento al que llegaron". No marca qué línea dijo la persona,
cuál se leyó de `doc/` y cuál dedujo el agente. La regla hecho-vs-decisión gobierna **cómo se
pregunta** pero no sobrevive en **lo que se entrega**, y es en la entrega donde la distinción sirve:
la próxima sesión lee las cinco líneas sin saber qué está confirmado.

**H-4 · Nadie corre reverse alignment sobre un cambio del harness.** `F-REVERSE_ALIGNMENT`
El producto exige la cadena para cualquier entrada `solution_first`. Del lado harness la cadena
equivalente —*cambio en el harness → qué cambia para quien usa el plugin → qué señal lo mostraría →
por qué importa → criterio para justificar que siga*— no se recorre en ningún comando. "Agregar un
comando" se acepta sin enlaces. `ADR-009` tiene el síntoma anotado: el plugin publica ocho skills y
**cero evals**, así que cambiar el cuerpo de un comando no tiene antes ni después medible.

**H-5 · No existe `analysis_status` de una sesión.** `F-UX`
`PortfolioEntryAnalysis` declara si alcanza para seguir. `estado/BITACORA.md` tiene "qué quedó
abierto" y "por dónde seguir", pero ninguna sesión puede cerrarse diciendo `insufficient_input`:
*no aprendimos lo suficiente para que la próxima arranque*. Hoy toda sesión cerrada se lee como
`ready`.

## 2.4 De qué lado cae cerrar cada hueco

`ADR-009` parte el repo en dos harnesses con reglas distintas. Los cinco huecos no caen todos del
mismo lado, y confundirlo es cómo se rompe `ADR-003`:

| Hueco | Lado | Qué implica cerrarlo |
|---|---|---|
| H-1, H-2, H-3, H-5 | **producto** | editar `SKILL.md` de comandos existentes. Verificación **humana y declarada**: no hay gate, y si nadie corre nada nadie se entera. |
| H-4 | **productor** | la suite de evals que `ADR-009` dejó sin marcar. Corre en una terminal con Node, y ahí sí hay gate. |

Y una advertencia que se desprende sola: cerrar H-1 a H-3 **cambia el comportamiento de comandos del
producto**, que es la invariante continua del criterio de aceptación de `ADR-009`. No la prohíbe:
obliga a decirlo en voz alta cuando pase.

---

## 3. Cómo usar este documento

- **Para implementar Portfolio Entry:** Parte 1 es el mapa; `doc/` es la autoridad. Los cuatro
  Skill Contracts tienen los casos de aceptación que este blueprint resume.
- **Para probar el agente:** los seis invariantes de §1.6 son la lectura corta de la rúbrica. Las
  siete dimensiones y los nueve fallos duros están en `skills/starteria-probar/RUBRICA.md`, y `doc/`
  manda sobre ella.
- **Para cambiar el harness:** §2.3 es la lista de trabajo pendiente, ya ordenada por etiqueta de
  fallo. Antes de tocar un comando, `/starteria-autoridad`; después, `docs/adr/`.

> Un harness que le exige al producto una disciplina que él mismo no cumple enseña la disciplina
> mal: enseña que se declara, no que se practica.
