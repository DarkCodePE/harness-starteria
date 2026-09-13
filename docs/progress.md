# Progreso del harness

**Última actualización:** 2026-09-12

Este archivo registra el estado de **construir** el harness. No confundir con `estado/BITACORA.md`,
que registra el estado de **usarlo** (corridas de casos, decisiones de producto) y lo escribe
`/starteria-cierre`. Son dos relojes distintos, como dice `LIFECYCLE.md` §7 (§1 el del producto, §5 el del productor).

Dicho con los nombres de `ADR-009`: este archivo es el estado del **productor** (construir el
plugin) y `estado/BITACORA.md` es el estado del **producto** (usarlo). Cada columna se verifica
distinto y a propósito:

| | Productor (este archivo) | Producto (`estado/BITACORA.md`) |
|---|---|---|
| Qué registra | features y fixes del plugin | corridas de casos, decisiones |
| Quién verifica | `scripts/verify.sh`, mecánico | una persona, y lo declara (`ADR-003`) |
| Dónde vive | este repo, trackeado | el repo de quien usa el plugin |

Nada actualiza este archivo solo. Se llena a mano al cerrar una sesión de trabajo.

---

## Estado actual

**v0.1 escrito, empaquetado como plugin, verificado por estructura. Sin correr end to end.**

Los ocho comandos existen, el plugin instala y carga, y toda la documentación del porqué está
escrita. Lo que todavía no pasó es que alguien corra un caso de principio a fin. Hasta entonces el
harness está escrito, no probado, y esa es exactamente la distinción que le exige a todo lo demás.

| Pieza | Estado |
|---|---|
| 8 comandos (`skills/starteria*`) | hechos, 15 archivos |
| Plugin (`.claude-plugin/`) | instala y carga; inventario reporta `Skills (8)` |
| Documentos del harness (`docs/`) | PRD, DDD, ARCHITECTURE, LIFECYCLE, BLUEPRINT, PLAN, este |
| Contrato del productor (`AGENTS.md`) | escrito, con la tabla verificada por el gate |
| Plan de benchmark (`docs/BENCHMARK.md`) | **v0.2**, sobre un corpus de 42 fuentes; corrige 5 afirmaciones de v0.1. Sigue **sin correr** |
| Informe de investigación (`research/notes/final_report_*.md`) | 3.959 palabras, 37 citas; el resto de `research/` está ignorado |
| 9 ADR (`docs/adr/`) | todos en `proposed`, ninguno firmado |
| Gate del productor (`scripts/verify.sh`) | escrito y probado, verde con 2 avisos |
| Chequeo de deriva de ChatGPT (`sync-para-chatgpt.py`) | escrito y probado; cierra el costo de `ADR-006` |
| Fase 2 (probar) | **sin empezar** |
| Fase 3 (usar, Rounds 1 a 3) | bloqueada por la fase 2 |

---

## Lo hecho, por sesión

### 2026-09-10 · construir

- Ocho comandos en `.claude/skills/starteria*`, en español, sobre los contratos de `doc/`.
- Rúbrica, plantillas, glosario, mapa de autoridad y guía de ChatGPT.
- `ADR-001` a `ADR-007` con alternativas y costo.
- PRD, DDD, ARCHITECTURE, LIFECYCLE, PLAN.
- Repo inicializado, PR #1 abierta contra `main`.
- **Hallazgo:** `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` y `STARTERIA_AUTHORITY.md` no existen, y el
  AI Harness declara al primero como su fuente número uno. El nivel 3 de la cadena de autoridad está
  vacío. Anotado en `MAPA-DE-DOCUMENTOS.md`.

### 2026-09-11 · investigar, empaquetar, liberar el nombre

- **Fase 2 reescrita** con evidencia externa sobre cómo se prueban los harness de agentes. Tres
  cosas entraron: la prueba de trayectoria (verificar que la fase de responder corrió ciega, porque
  un registro se ve igual contaminado que aislado), el orden binario-primero al puntuar, y que
  `unknown` en la capa de fallo es la respuesta honesta más seguido de lo que parecía (el mejor
  método publicado acierta el paso decisivo el 14.2% de las veces).
- **Fase 3 ampliada** con tres reglas de curaduría: core congelado más set creciente aparte,
  clusterizar en vez de acumular, e incluir casos que pasan.
- **Empaquetado como plugin** (`ADR-008`, supera a `ADR-001`). Instalado y verificado.
- **Nombre `skills/` liberado** el mismo día, después de ver cómo lo resuelve `token-optimizer`: su
  `plugin.json` no declara skills porque Claude Code las autodescubre en `skills/`. El clon de
  mattpocock pasó a `referencia/`; las nuestras, de `comandos/` a `skills/`. Se eliminó el array
  manual y con él un modo de fallo silencioso.
- **Hallazgo:** el inventario del plugin reporta `MCP servers (1) claude-flow`. La raíz del repo es
  la raíz del plugin, así que está tomando el `.mcp.json` de ruflo. Desde GitHub no viaja (está
  ignorado), pero es la clase de fuga que produce empaquetar en la raíz. Anotado en `ADR-008`.

### 2026-09-11 · separar producto de productor

- **`ADR-009`:** el repo tiene dos harnesses y `ADR-003` gobierna solo el del producto. Sus tres
  razones para rechazar chequeos mecánicos son sobre el usuario del plugin (no tiene Node, usa
  ChatGPT, y el objeto verificado es una interpretación). Ninguna aplica a quien construye el
  plugin desde una terminal. El lado productor quedaba sin harness, no por decisión sino por no
  haberse nombrado.
- **`scripts/verify.sh`:** gate del productor. Manifiestos, ocho carpetas con `SKILL.md` y
  frontmatter completo, e inventario del plugin en `Skills (8)`. Probado en positivo y en negativo
  (sacándole el `SKILL.md` a una skill y borrando una carpeta: falla y dice cuál).
- **Correcciones en `ARCHITECTURE.md` §2:** el árbol decía que `plugin.json` "declara las 8 skills"
  cuando `ADR-008` eliminó ese array; faltaba `progress.md`; y `estado/BITACORA.md` figuraba como
  archivo de este repo sin la anotación "ignorado" que sí tienen `referencia/` y `token-optimizer/`.
- **Hallazgo sin resolver:** en una sesión, el inventario en disco reportaba `Skills (8)` mientras
  el registro de esa sesión listaba una sola skill del plugin. El gate no cubre esto: mira el disco.

### 2026-09-11 · el segundo runtime deja de poder quedar viejo

- **`scripts/sync-para-chatgpt.py`:** genera los dos bloques derivados de `PARA-CHATGPT.md` —la
  lista de contratos de `doc/` y la tabla de renombrado de `skills/`— y `verify.sh` falla si el
  archivo commiteado no coincide. Cierra lo que `ADR-008` §4 anotó como "una cuarta cosa a mantener
  sincronizada". Anotado en el Historial de `ADR-006`.
- **No genera todo, a propósito.** El bloque de instrucciones del Proyecto y el orden de los
  archivos dentro de cada skill quedan escritos a mano: ese orden es de uso, no alfabético (`MAPA`
  antes que `GLOSARIO`, `RUBRICA` antes que `REGISTRO`). El generador conserva el orden existente y
  agrega lo nuevo al final del grupo, para que una persona lo ubique.
- **Patrón tomado de `token-optimizer`,** que lo usa para el espejo de Codex: regenerar y diffear en
  vez de mantener una lista de excepciones. Divergencia deliberada: allá el chequeo regenera sobre
  el working tree; acá `--check` no escribe, porque `PARA-CHATGPT.md` es del producto.
- **Estado al momento de escribirlo: sin deriva.** Los 9 contratos y las 14 filas ya coincidían con
  el disco. El gate es preventivo, no correctivo.
- **Verificado en negativo:** archivo nuevo en una skill, contrato nuevo en `doc/`, skill en disco
  que §4 no lista, y skill listada que no existe. Los cuatro salen 1 y dicen cuál.

---

### 2026-09-12 · el blueprint, y el contrato del productor

- **`docs/BLUEPRINT.md`:** el workflow completo de `entry-01` a `entry-04` —qué recibe cada paso, qué
  produce, qué tiene prohibido— y los seis invariantes que lo sostienen. Parte 2 lee los ocho
  comandos como el **mismo** workflow un nivel más arriba, con las coincidencias una por una:
  "los hechos los buscás vos, las decisiones son de la persona" es provenance; el bloque `CONFLICT`
  es `missing_links`; "no lo podés pasar a `aceptado`" es `AI_INFERRED` que no se vuelve
  `USER_CONFIRMED`.
- **Cinco huecos, no cero.** El harness no cumple su propio workflow en cinco lugares, cada uno
  etiquetado con el fallo que le tocaría bajo su propia rúbrica: no clasifica su entrada
  (`F-ENTRY_STATE`), `/starteria-afilar` no tiene techo de preguntas (`F-QUESTION_OVERLOAD`) ni
  devuelve provenance (`F-PROVENANCE`), nadie corre reverse alignment sobre un cambio del harness
  (`F-REVERSE_ALIGNMENT`), y ninguna sesión puede cerrarse diciendo `insufficient_input` (`F-UX`).
  Cuatro son del producto, uno del productor.
- **`AGENTS.md`:** el contrato del productor, en la raíz y no en `CLAUDE.md` porque lo leen los dos
  runtimes. Catorce fases P0 a P13 donde **P1 a P5 son los cuatro pasos aplicados al pedido de
  cambio**, cuatro puntos de control humanos (P3, P7, P11, P13), los tres ciclos, la tabla de las
  ocho skills, y la frontera de agentes.
- **La tabla de agentes dice la verdad incómoda:** este repo define **cero** agentes propios.
  `.claude/agents/` está en `.gitignore` y son los genéricos de ruflo. La única frontera de agentes
  real y obligatoria es la fase 1 de `/starteria-probar`, que no puede ver la rúbrica (`ADR-002`).
  Y si alguien agrega un agente sin `tools:`, **nada lo verifica**: el gate mira `skills/` y
  `.claude/` está ignorado.
- **`LIFECYCLE.md` pasó de cuatro relojes a cinco.** El nuevo §5 es la unidad de trabajo del
  productor. §1 se renombró a "La sesión de producto": había dos cosas llamadas igual.
- **Gate extendido, y probado en negativo.** `verify.sh` bloque 3b compara la tabla de `AGENTS.md`
  contra el disco. Dos pruebas negativas —skill en disco que la tabla no lista, y fila que no existe
  en disco— salen 1 y dicen cuál. Sin el chequeo, la tabla era prosa que se podría.
- **Deriva encontrada y reconciliada, incluida una que no era mía.** `ADR-003` §5 decía
  "[x] No hay scripts, hooks ni dependencias de Node en el harness", y dejó de ser cierto el día
  anterior cuando `ADR-009` agregó `scripts/`. Llevaba un día sin registrar. Se acotó al producto,
  se reformularon dos criterios y se anotó en su Historial. No cambia la postura de `ADR-003`:
  cambia sobre qué manda.
- **Costo aceptado:** `AGENTS.md` manda citar las series de ADR con calificador
  (`ADR-009 del harness`), y los documentos existentes citan desnudo. Mientras la serie de producto
  esté vacía el número desnudo es inequívoco por accidente; deja de serlo el día que
  `/starteria-decision` escriba el primero. Queda como pendiente abajo, no como hueco oculto.

---

### 2026-09-12 · cómo se mediría esto, si alguien lo midiera

- **`docs/BENCHMARK.md`:** plan para las tres preguntas que el harness no podía contestar —qué tan
  efectivo es el agente, si la rúbrica mide al agente o al que puntúa, y si el agente se adapta
  cuando la persona cambia de objetivo.
- **Tres decisiones del harness ya tenían nombre afuera.** Round 2 ("tres corridas") es `pass^k` de
  τ-bench; los nueve fallos duros son *policy adherence*; y el rechazo a la coincidencia literal
  coincide con que las métricas de texto no sirven para generar preguntas de aclaración. El trabajo
  pendiente es instrumentar, no rediseñar.
- **`pass^k` por caso sí, promedio de suite no.** Son dos números distintos y el harness los
  conflaba: lo prohibido es "Suite B al 70%"; medir un caso contra su propia varianza es lo que
  faltaba. Presupuesto adaptado a que la fase 2 la puntúa una persona: `pass^3`, no `pass^8`.
- **Hallazgo grande, y peor que "falta una suite".** El Agent Contract §22 **ya especifica**
  `analysis_version` y que un análisis viejo queda `SUPERSEDED` en vez de borrarse. Las nueve suites
  son todas de **un turno**: el contrato especifica versionado y supersesión, y nadie comprobó nunca
  que existan. Propuesta: Suite J, cuatro casos multi-turno, más un fallo duro nuevo
  `F-SILENT-OVERWRITE`. Es cambio de contrato: va por `/starteria-autoridad` y sería el primer ADR
  de producto.
- **Falta una skill, no tres.** `/starteria-medir`: corre un caso n veces, calcula `pass^k`, y corre
  las cinco perturbaciones que validan la rúbrica misma. La Suite J no es una skill (es `doc/`) y la
  validación del juez es un procedimiento adentro de `/starteria-medir`, no una skill aparte.
- **Costo medido de la novena skill:** `verify.sh:16` tiene `ESPERADAS=8` escrito a mano, así que
  agregarla **rompe el gate** hasta tocar cuatro cosas: la skill, `ESPERADAS=9`, `PARA-CHATGPT.md` §4
  por el script, y la tabla de `AGENTS.md`. Que falle en los cuatro casos es la noticia buena.
- **Predicción anotada antes de correr, para no racionalizarla después:** de las siete dimensiones de
  la rúbrica, síntesis UX va a ser la más inestable. Las otras seis son checklist; esa no.
- **Herramienta:** `hyperresearch 0.11.1` por `pipx` — `pip` falla por PEP 668, y `hyperresearch
  install` se evitó a propósito porque inyecta en `CLAUDE.md` (trackeado) e instala 16 skills en
  `.claude/skills/`. Su provider `builtin` no busca solo, y al traer PDFs de arXiv guarda bytes sin
  extraer texto: las cuatro fuentes se leyeron de la página `/abs/`.

---

### 2026-09-12 · la investigación con pipeline, y BENCHMARK.md v0.2

- **`hyperresearch` instalado y corrido de verdad.** Su bloque de instrucciones salió de `CLAUDE.md`
  (377 → 204 líneas) y está en `AGENTS.md`, con las **40 rutas absolutas de pipx** reemplazadas por el
  comando del PATH. `CLAUDE.md` queda con un puntero que explica por qué no está ahí.
- **Corrida en tier `light` por decisión del usuario**, contra `full` que clasificó el paso 1. El
  downgrade quedó **registrado en el artefacto** con la tabla de los 8 pasos salteados y qué aporta
  cada uno, y `response_format` bajó de `argumentative` a `structured` en el mismo acto: declarar
  densidad argumentativa sin correr los críticos habría sido mentir en el artefacto.
- **42 fuentes, 146 claims, `retracted: []`.** Cuatro fetchers en paralelo, una ola 2 de relleno y un
  análisis profundo de Gaia2.
- **La tesis del informe:** el problema no es que falten métricas, es que **la unidad de medición no
  está fijada**. RefChecker llegó a 95,0% de acuerdo entre anotadores cambiando de oraciones a
  tripletas; GCA ordenó bien lo que cuatro métricas ordenaron mal, cambiando de estado a delta.
  Ninguna cambió el algoritmo. **Para este repo eso es la mejor noticia: fijar la unidad es lo que un
  contrato escrito puede hacer y un benchmark público casi nunca.**
- **`ADR-003 del harness` tiene número atrás.** El checklist ABC sobre 10 benchmarks: 7/10 fallan
  validez de tarea, 7/10 validez de resultado, y **10/10 fallan en reporte, con el 80% sin reconocer
  sus debilidades**. La costumbre de declarar lo que no se verifica es la dimensión donde el campo
  falla de forma más uniforme.
- **Cinco correcciones a v0.1, cuatro de ellas a datos que yo había afirmado.** El rango "50–90% de
  citas sin soporte" y la frase "doble confound de medición" venían de resúmenes de búsqueda y **no
  existen en las fuentes**; el checklist son 44 ítems y no 43. Cuarto patrón, ya no anécdota: **los
  resúmenes de búsqueda aciertan la forma y fallan el dato.**
- **La Suite J cambia de forma, no de necesidad.** Ni SGD ni MultiWOZ ni Gaia2 anotan el turno del
  cambio de objetivo, así que no es redundante. Pero el `F-SILENT-OVERWRITE` que propuse se reemplaza
  por el verificador secuencial de Gaia2: **exigir la acción correctiva causalmente después del evento
  que contradice, sin penalizar la acción inicial.** Distingue "no se enteró" de "actuó con lo que
  tenía", y eso mi versión no lo hacía.
- **Advertencia escrita antes de que pase:** corregir las anotaciones de MultiWOZ 2.0 → 2.1 cambió más
  del 32% de los estados y **los cinco modelos bajaron su JGA**. Si alguien corrige bien un `EXPECTED`
  y los puntajes caen, no es una regresión.
- **Cinco silencios de instrumentación**, anotados en las notas de la corrida: `note update` con flags
  inexistentes que no falló, mi propio `grep` filtrando ese error, `sources score` sin imprimir
  retracciones, `grep` sin `-a` devolviendo cero sobre notas de PDF, y `polish-log.json` pareciendo un
  audit trail cuando es un resumen por categoría con conteos falsos. **Los cinco se cazaron pidiendo la
  salida estructurada en vez de leer el silencio como éxito**, y ninguno lo habría cazado el pipeline.
- **Convención de citas de ADR aplicada** a `BENCHMARK.md`: cero citas desnudas. Quedan
  `BLUEPRINT.md`, `ARCHITECTURE.md` y `LIFECYCLE.md`.

---

### 2026-09-12 · un solo runtime, y la cadena de artefactos

El harness ya cubría casi todo el arco de trabajo, pero **seis de sus ocho comandos escribían a la
conversación y ahí se perdían**. Las diecinueve referencias cruzadas entre skills apuntaban a la
memoria de una persona, no a un archivo: por eso nada acumulaba, y por eso `estado/BITACORA.md`
nunca llegó a existir. Faltaba además una fase entera, la de revisar un caso antes de correrlo, que
es la pregunta 2 de `BENCHMARK.md` ("¿la rúbrica mide al agente, o al que puntúa?").

`ADR-010` decide las dos cosas juntas, porque una destraba la otra: se abandona ChatGPT, y el estado
pasa a ser un artefacto encadenado en `$STARTERIA_STATE_ROOT`, afuera del repo, que gbrain indexa.
Mientras hubiera un runtime que no puede leer rutas de disco, media cadena tenía que quedar manual.

**Es el primer ADR `accepted` del repo.** La aprobación se **transcribió** de la sesión, que es lo
que `AGENTS.md` permite; producir una que nadie dio es lo que prohíbe. Sin esa firma el borrado de
`PARA-CHATGPT.md` no se podía hacer: `ADR-007` ata cualquier borrado a una decisión aceptada.

Lo hecho:

- `ADR-010` escrito y firmado. `ADR-006` pasa a `superseded` **sin que se le toque el cuerpo**: un
  ADR registra lo que se decidió entonces. `ADR-009` suma una línea, porque gbrain cruza la frontera
  producto/productor que ese ADR había trazado.
- ChatGPT cortado entero: se fueron `PARA-CHATGPT.md`, `scripts/sync-para-chatgpt.py`, el chequeo de
  deriva de `verify.sh`, y las diez bifurcaciones por runtime dentro de las ocho skills.
  `grep -ri chatgpt skills/ scripts/` da cero; en `docs/adr/` quedan menciones y está bien.
- Dos skills nuevas. `/starteria-revisar` es la fase que faltaba: cuatro chequeos sobre un caso
  antes de correrlo, con veredicto `LISTO` / `AJUSTAR` / `HALLAZGO`. `/starteria-patron` lee varios
  registros y busca la causa común, **y es la única skill que no puede correr sin memoria**: es la
  que justifica gbrain y la vara para saber si sirvió.
- Las ocho existentes ahora escriben a `$STARTERIA_STATE_ROOT` y leen el artefacto anterior. Leen
  **si existe** y **dicen que falta si no está**, nunca bloquean: encadenar con una puerta sería un
  gate, y `ADR-003` decidió que acá no hay.
- `verify.sh` cuenta diez y perdió el chequeo de ChatGPT. Sale 0 con los dos avisos conocidos
  (fuga de `.mcp.json`, ausencia de evals) y ningún tercero. El plugin instalado reporta
  `Skills (10)` sin reinstalar.
- `gbrain` 0.50.0.0 instalado desde el clon local y enlazado en `~/.local/bin`, sin tocar `.bashrc`.
- `.gitignore` decía `gsstack/` (typo): por eso `gstack/` aparecía sin trackear. Corregido, y
  `gbrain/` agregado como clon de referencia.

- `gbrain` inicializado en PGLite sobre `~/.gbrain` (43 MB, afuera del repo), con embeddings
  `openrouter:openai/text-embedding-3-large` a 1536 dimensiones y chat `deepseek-v4.1-flash`.
  **Verificado contra el dato, no contra el mensaje del instalador**: escritura y lectura con un
  token aleatorio exacto, y después una consulta semántica **sin vocabulario compartido** con lo
  guardado, que trajo los dos registros de prueba con 0.84 y 0.82 de similitud. Los dos declaraban
  capas distintas (`skill` y `prompt`) y eran el mismo mecanismo, que es justo lo que el paso 2 de
  `/starteria-patron` pide encontrar. Las páginas de prueba se borraron.

**Dos cosas que se asumieron mal y se corrigieron.** La primera: se dio por cierto que OpenRouter no
servía embeddings, porque no figura en su API reference. **Sí los sirve**, por `/api/v1/embeddings`;
se probó contra la API real y devolvió un vector. No hizo falta una segunda clave. La segunda: se
subestimó lo que `gbrain init` toca. Escribe la clave del proveedor en un `.env` **en la raíz del
repo**, sin avisar, y `.gitignore` no lo cubría. Quedó cubierto, pero es una trampa que vuelve cada
vez que alguien corra `gbrain init` en un repo limpio.

**Y un riesgo que queda abierto.** gbrain lee `skills/` como si fuera suyo: su `doctor` reporta
"10/10 skills" sobre las nuestras y ofrece `gbrain skillpack sync`, que instalaría 63 skills de
gbrain ahí. Como `ADR-008` hace que el plugin autodescubra `skills/`, correr ese comando publicaría
63 comandos ajenos dentro del producto. **No se corre `gbrain skillpack sync` en este repo.**

**Lo que NO se hizo.** **La cadena no se corrió punta a punta.** Las skills llevan
`disable-model-invocation: true`, así que las invoca una persona: de los seis criterios de `ADR-010`
§5 hay **tres cumplidos y tres que dependen de que alguien corra el harness**. Eso es `ADR-003`
funcionando, no un olvido.

---

### 2026-09-13 · la integración con la plataforma: blueprint, sexto reloj, diagrama

- **Se leyó la plataforma antes de diseñar, y el primer hallazgo reordenó todo.** `grep` de
  `entry_state`, `reverse_alignment`, `question_planner`, `AI_INFERRED` y `USER_DECLARED` sobre todo
  `Dashboardstarteria/` (ts, tsx, py, md, prisma) devuelve **cero**. **Portfolio Entry está
  especificado en `doc/` y no implementado en la plataforma.** El harness hoy puntúa a un modelo
  leyendo el contrato, no a la Pantalla 1 que va a existir: es un ensayo válido del contrato y nulo
  del sistema.
- **La plataforma ya tiene un harness, y no es el nuestro.** `ai-service/harness/` es un pipeline de
  ocho etapas (`INTAKE → GROUND → INTERPRET → CONFIRM → CLASSIFY_ROUTE → METHOD_HINT → GATE → EMIT`)
  con gates de umbral, `routing_table`, `method_packs` y traza de auditoría — ADR-027 **de producto**.
  Y `ai-service/harness/eval/` ya corre golden cases con graders y métricas. Cada harness tiene lo
  que al otro le falta: el humano tiene los casos que valen, el de runtime sabe correrlos solo.
- **Hay dos vocabularios epistémicos para el mismo contrato.** `USER_DECLARED` /
  `EXTRACTED_FROM_USER_TEXT` / `AI_INFERRED` en `doc/`, contra `declared` / `extracted` / `inferred`
  / `confirmed` más un `authority_hierarchy` de seis niveles en `methodology.yaml`. Ya derivaron
  **entre repos** sin que nada fallara, que es exactamente el costo que `ADR-005` marcó para las
  copias.
- **El backend MCP no hay que construirlo.** gbrain 0.50 trae `serve` (stdio y http), seis perfiles
  verificados, cercos de escritura por prefijo de slug, lectura federada y TTL de token. Falta
  otorgarlo y cercarlo. Un segundo MCP sobre la plataforma **no se justifica todavía**; queda escrito
  el gatillo para revisarlo.
- **`BLUEPRINT-INTEGRACION.md` nuevo.** Cinco capas (proyección del contrato, Portfolio Entry en la
  plataforma, telemetría redactada, gbrain con dos fuentes, puente a golden case), la topología MCP
  con el `gbrain mcp grant` concreto, la taxonomía de páginas de la wiki, seis fases mapeadas al
  PLAN-MVP de la plataforma, y cuatro decisiones que **hay que firmar** — dos ADR del harness y dos
  de producto, que serían los primeros de esa serie.
- **Dos bloqueos declarados como bloqueos, no como avisos.** `pii.py` es un stub regex por admisión
  propia y no cubre nombres de persona ni de empresa: la telemetría no sale de producción hasta que
  haya NER o export manual revisado. Y F0 va primero porque tres de los seis criterios de `ADR-010`
  siguen abiertos, incluido el único que invalida el diseño si falla.
- **`LIFECYCLE.md` pasó de cinco relojes a seis, y le cambió la tesis.** El nuevo §6 es el pipeline de
  la integración, único con dos velocidades. La v0.1 cerraba con que ningún ciclo tiene alarma; el
  tramo caliente sí la tiene, porque corre cada vez que un usuario escribe. Aparece un modo de falla
  que el documento no contemplaba: **los otros cinco fallan quedándose quietos, este falla
  llenándose**, y un pipeline con quinientos análisis sin mirar se ve igual que uno al día.
- **`ADR-003` quedó con una premisa falsa y se corrigió como corresponde.** Su contexto decía
  "`LIFECYCLE.md` cierra con que ningún ciclo tiene alarma". Se agregó una segunda nota fechada
  —igual que la del 2026-09-12— en vez de reescribir el cuerpo. Su decisión no cambia: la selección
  humana del §6.2 es justamente lo que la sostiene, y queda escrito que **este es el ADR a revisar**
  si alguien propone abrir ese candado.
- **Primer diagrama del repo.** `docs/diagramas/pipeline-integracion.drawio`, dos páginas, escrito a
  mano en formato nativo de draw.io. Se eligió eso sobre generarlo con `next-ai-draw-io` porque su
  validador es VLM y necesita API key, y porque un round-trip por modelo degrada un diagrama cuyo
  contenido ya estaba decidido. Abre igual en la herramienta para editarlo por chat.
- **Deriva encontrada al correr el gate: el plugin publicado quedó dos skills atrás.**
  `verify.sh` pasó de `OK Skills (10)` a `FALLA Skills (8)` dentro de la misma sesión, sin que nadie
  tocara `skills/`. `claude plugin details` lee el **snapshot instalado**, no el árbol de trabajo:
  en disco hay diez skills y los manifiestos ya dicen "Diez comandos" (sin commitear), pero el
  instalado sigue en ocho y en "Ocho comandos". Las dos que faltan son **`starteria-patron` y
  `starteria-revisar`** — justo las que `ADR-010 §2.4` creó y las que justifican que gbrain esté acá.
  - **`ADR-010 §5` tiene un criterio verificado que dejó de ser cierto:**
    `[x] El plugin instalado reporta Skills (10) — verificado 2026-09-12, sin reinstalar el plugin`.
    Hoy reporta 8. Se deja **sin tocar el ADR** hasta que una persona decida: reinstalar cambia
    justamente la condición bajo la que ese criterio se verificó, y esa es su decisión, no la de la
    herramienta.
  - **El plugin instalado trae un agente que el repo ya no tiene:** `Agents (1)
    portfolio-entry-responder`, y `find` sobre el árbol no lo encuentra en ningún lado. `AGENTS.md`
    dice que este repo define cero agentes propios; el artefacto publicado lo contradice.
  - **Lo que esto enseña del gate:** `verify.sh` bloque 4 no verifica el repo, verifica **el entorno
    de quien lo corre**. Puede pasar en verde con un árbol roto o fallar en rojo con un árbol sano,
    según cuándo se refrescó el caché del plugin. No es un fallo del gate: es su alcance real, y
    hasta hoy no estaba escrito en ningún lado.
- **Costo aceptado:** este blueprint **propone**; nada está firmado. Mientras las cuatro decisiones
  de su §8 no tengan nombre y fecha, `docs/` describe una integración que nadie aprobó — y ese es
  exactamente el estado que `AGENTS.md` permite y el que `ADR-007` obliga a declarar en voz alta.

## Qué queda abierto

| Pendiente | Dueño | Qué desbloquea |
|---|---|---|
| Correr `PE-B03` de punta a punta (fase 2.2), con la prueba negativa | sin definir | todo lo demás: hasta que esto pase, el harness no está probado |
| Firmar los 9 ADR que siguen en `proposed`, o rechazar los que no vayan | una persona con autoridad | que las decisiones dejen de ser propuestas; `ADR-010` ya está firmado |
| Instalar el plugin desde GitHub, no solo desde ruta local | sin definir | criterio abierto de `ADR-008` |
| Probar el plugin en un repo **sin** `doc/` | sin definir | criterio abierto de `ADR-008`; puede mover la frontera entre plugin y contratos |
| Decidir si `doc/` debe ser público en el repo | sin definir | son contratos del cliente y hoy están visibles |
| Suite de evals del plugin (`claude plugin eval`) | sin definir | criterio abierto de `ADR-009`; que cambiar un comando tenga antes y después |
| Entender por qué una sesión cargó 1 de 8 skills | sin definir | el gate mira el disco; este síntoma era de sesión y sigue sin causa |
| Pasar `BLUEPRINT.md`, `ARCHITECTURE.md` y `LIFECYCLE.md` a la cita calificada de ADR (`BENCHMARK.md` ya está) | sin definir | que el primer ADR de producto no llegue a un repo ambiguo |
| Cerrar los cinco huecos de `BLUEPRINT.md` §2.3 | sin definir | que el harness cumpla el workflow que le exige al producto |
| Decidir si se construye `/starteria-medir` (novena skill, rompe el gate hasta tocar 4 cosas) | sin definir | `pass^k`, y validar la rúbrica misma |
| Llevar Suite J a `/starteria-autoridad` → primer ADR de producto | sin definir | medir adaptación a cambio de objetivo, hoy imposible |
| No correr `gbrain skillpack sync` en este repo, y ver si conviene mover el brain fuera de él | sin definir | que 63 skills de gbrain no se publiquen dentro del plugin por `ADR-008` |
| Correr la cadena punta a punta con un caso real y confirmar que cada paso encuentra el anterior | una persona | criterio de aceptación de `ADR-010`; hoy sin verificar |
| Cortar la cadena a propósito y confirmar que la skill siguiente lo dice y **sigue** | una persona | la invariante de `ADR-003`; si falla, el diseño de `ADR-010` está mal |

**El primero es el que importa.** Los otros cinco se pueden hacer en cualquier orden.

---

## Por dónde seguir

Instalar el plugin, abrir sesión nueva, y correr `/starteria-probar PE-B03` siguiendo la fase 2.2 de
`PLAN.md`. Lo primero que hay que mirar no es el veredicto: es si la fase de responder vio la
rúbrica. Después, la prueba negativa: correrlo todo en un hilo a propósito y confirmar que el
registro dice `CONTAMINADO`. Si no lo dice, eso se arregla antes que cualquier otra cosa.
