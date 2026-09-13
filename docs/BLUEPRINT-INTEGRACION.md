# Blueprint de integración: harness, plataforma, plugin y wiki gbrain

**Versión:** v0.1 · **Fecha:** 2026-09-13 · **Estado:** propuesto — nada de acá está firmado

Cómo se conectan cuatro cosas que hoy no se hablan: el **harness de Portfolio Entry**
(`harness-starteria/skills/`), la **plataforma** (`Dashboardstarteria/`), el **plugin** que
empaqueta el harness, y **gbrain** como wiki y memoria. Incluye el backend MCP, porque hace falta
uno y ya existe.

No inventa reglas. Donde este documento contradiga `doc/`, gana `doc/`. Donde contradiga un ADR
aceptado, gana el ADR y este documento está mal.

El pipeline que sale de acá está en [`LIFECYCLE.md` §6](LIFECYCLE.md) como ciclo de vida, y dibujado
en [`diagramas/pipeline-integracion.drawio`](diagramas/pipeline-integracion.drawio).

---

## 0. Lo que se verificó antes de diseñar

Todo lo de abajo se comprobó contra los dos repos el 2026-09-13. Lo que no se comprobó, se dice.

| Afirmación | Cómo se verificó | Resultado |
|---|---|---|
| Portfolio Entry **no está implementado** en la plataforma | `grep -rn "entry_state\|entryState\|reverse_alignment\|question_planner\|intent_detection"` sobre `.ts .tsx .py .md .prisma` de todo `Dashboardstarteria/` | **cero coincidencias** |
| El vocabulario de provenance del contrato tampoco está | `grep -rn "AI_INFERRED\|USER_DECLARED\|EXTRACTED_FROM"` sobre lo mismo | **cero coincidencias** |
| La plataforma tiene **su propio harness de runtime** | `ai-service/harness/`: `state_machine.py`, `gates.py`, `contracts.py`, `epistemic.py`, `trace.py`, `config/methodology.yaml` | existe, es ADR-027 del producto |
| Ese harness ya **evalúa solo** | `ai-service/harness/eval/`: `dataset.py` (golden cases), `runner.py`, `graders.py`, `metrics.py` | existe y corre hermético |
| gbrain **ya expone MCP** | `gbrain mcp grant --help`, `gbrain mcp profiles`, `gbrain mcp adapters` | 6 perfiles, adapter `claude-code` en `local-cli\|stdio\|http` |
| gbrain está **vacío y mal cableado** acá | `gbrain sources list` → `default, 0 pages, never synced`; `ls ~/.starteria` → no existe; `gbrain doctor --fast` | ningún artefacto ingestado todavía |
| La plataforma ya tiene máquinas de estado de portfolio | `backend/modules/portfolio/challenge-state-machine.ts`, `initiative-state-machine.ts` + sus tests | PLAN-MVP fases 0–3 parcialmente aterrizadas |

---

## 1. Las cuatro piezas, y qué es cada una realmente

Nombrarlas mal es el origen de la mitad de la confusión, así que primero esto.

### 1.1 El harness de `skills/` — **el producto**

Diez comandos de chat para gente de producto y lead, sobre los nueve contratos de `doc/`. No
ejecuta nada del producto: **acompaña a una persona que razona sobre el producto**. Su verificación
es humana por decisión explícita (`ADR-003 del harness`). Se instala como plugin de Claude Code
(`ADR-008`).

### 1.2 `ai-service/harness/` — **el harness de runtime, y no es el mismo**

Un pipeline Python de ocho etapas (`INTAKE → GROUND → INTERPRET → CONFIRM → CLASSIFY_ROUTE →
METHOD_HINT → GATE → EMIT`) que corre **en producción, en cada request**. Tiene gates duros y
blandos con umbrales numéricos, un `routing_table` que mapea a step y agente, `method_packs` con
evidencia requerida, y una traza de auditoría por corrida.

Esto es lo que más cuesta ver desde el repo del harness: **la plataforma ya tiene un harness, y no
es el nuestro**. Son dos implementaciones del mismo principio epistémico, escritas por separado,
que hoy no se conocen.

### 1.3 La plataforma — **donde el usuario realmente entra**

`front/` (React + Prisma), `backend/` (módulos, entre ellos `portfolio/`, `truth/`, `evidence/`),
`ai-service/` (agentes + harness). La jerarquía `StrategicFront → Challenge →
InitiativePortfolioMeta ↔ Project` existe en schema y API. El PLAN-MVP la está completando.

### 1.4 gbrain — **wiki y memoria, todavía vacía**

`ADR-010` la aceptó como capa de memoria con una frontera dura: indexa
`$STARTERIA_STATE_ROOT`, **nunca `doc/`**. Hoy tiene cero páginas y `~/.starteria` no existe: la
decisión está firmada y sin ejecutar.

---

## 2. Los cuatro hallazgos que mandan sobre el diseño

### H1 — El harness prueba un agente que la plataforma no tiene

`doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` especifica `entry-01` a `entry-04`, `entry_state`,
`missing_links`, `analysis_status`. La plataforma no implementa **nada** de eso (verificado en §0).

Consecuencia directa: hoy `/starteria-probar` puntúa el comportamiento de **el modelo leyendo el
contrato**, no el de la Pantalla 1 que va a existir. Es un ensayo válido del contrato y un ensayo
nulo del sistema. La integración no puede empezar por conectar cables: **tiene que empezar por
implementar el agente**, o todo lo demás mide humo.

### H2 — Hay dos vocabularios epistémicos para la misma idea

| Concepto | `doc/` (harness) | `methodology.yaml` (plataforma) |
|---|---|---|
| Lo que el usuario dijo | `USER_DECLARED` | `declared` |
| Lo que se sacó del texto | `EXTRACTED_FROM_USER_TEXT` | `extracted` |
| Lo que el modelo supuso | `AI_INFERRED` | `inferred` / `suggested` |
| Datos en conflicto | `contradictions` | `conflicting` |
| Confirmado por persona | Pantalla 2 confirma | `confirmed` + `promotion_rule.requires_human_action: true` |
| Quién manda | cadena de autoridad (`/starteria-autoridad`) | `authority_hierarchy` de 6 niveles |

Son **el mismo contrato dicho dos veces**. Ninguna de las dos versiones sabe de la otra, y ninguna
falla si se separan. Eso es exactamente la deriva silenciosa que `ADR-005 del harness` quiso evitar
al decidir "citar, no copiar" — y acá ya ocurrió, entre repos.

### H3 — Cada harness tiene lo que al otro le falta

| | `skills/` (humano) | `ai-service/harness/eval/` (automático) |
|---|---|---|
| Casos | conversaciones reales, redactadas a mano | golden cases escritos por devs desde §21/§26 |
| Rúbrica | rica, con criterios cualitativos | graders + métricas numéricas |
| Ejecución | **ninguna, si nadie la corre** (`ADR-003`) | hermética, reproducible, en CI |
| Cobertura | Portfolio Entry (Pantalla 1) | el harness de diagnóstico (GROUND→EMIT) |

El premio de la integración está acá: **el harness humano produce los casos que valen; el harness de
runtime sabe correrlos solo.** Pero `ADR-003` decidió que acá no hay gates, a propósito. Conectarlos
no es un detalle técnico: es una decisión que hay que firmar (§8).

### H4 — El backend MCP no hay que construirlo

`gbrain` ya trae servidor MCP (`gbrain serve`, stdio o `--http`) y un sistema de concesión con
perfiles, cercos de escritura por prefijo de slug, lectura federada por fuente, presupuesto diario y
TTL de token. Lo que falta no es código: es **otorgarlo y cercarlo bien** (§5).

---

## 3. El modelo: dos loops, un contrato, una memoria

```text
        ┌──────────────────────── doc/ ────────────────────────┐
        │  9 contratos · fuente única · se CITA, no se copia    │
        └───────┬──────────────────────────────┬───────────────┘
                │ (proyección verificable)     │ (lectura en vivo)
                ▼                              ▼
   ┌────────────────────────┐      ┌──────────────────────────────┐
   │  LOOP DE RUNTIME       │      │  LOOP DE DISEÑO              │
   │  (la plataforma)       │      │  (el harness, plugin)        │
   │                        │      │                              │
   │  usuario escribe       │      │  pedido de cambio            │
   │    → Pantalla 1        │      │    → /starteria-afilar       │
   │    → entry-01..04      │      │    → /starteria-autoridad    │
   │    → Analysis          │      │    → /starteria-caso         │
   │    → Pantalla 2 (firma)│      │    → /starteria-probar       │
   │    → Challenge/Project │      │    → /starteria-patron       │
   └───────────┬────────────┘      │    → /starteria-decision     │
               │                   └──────────┬───────────────────┘
               │  análisis de prod            │  artefactos de estado
               │  (redactados)                │  ($STARTERIA_STATE_ROOT)
               ▼                              ▼
        ┌────────────────────────────────────────────┐
        │   gbrain — wiki + memoria + servidor MCP    │
        │   dos fuentes, una frontera: doc/ NO entra  │
        └────────────────────────────────────────────┘
```

Las dos flechas que hoy **no existen** y son toda la integración:

1. **`doc/` → plataforma**: el contrato baja a código ejecutable, con una proyección que falla si
   deriva.
2. **producción → harness**: los análisis reales se vuelven casos, en vez de morir en logs.

---

## 4. Las capas

### C0 — La proyección del contrato (bloqueante para todo)

**Problema:** `doc/` es markdown para humanos. Dos runtimes lo leen y cada uno lo interpreta.

**Decisión propuesta:** un solo archivo generado, `doc/generated/portfolio-entry.schema.json`,
derivado de los contratos y versionado con ellos. Es la **única** copia permitida de `doc/`, y se
permite porque falla ruidosamente: si el markdown cambia y el schema no, un chequeo rompe.

- La plataforma valida `PortfolioEntryAnalysis` contra ese schema en `ai-service`.
- El harness lo usa en `/starteria-probar` para chequear **forma** antes de puntuar **contenido**.
- `scripts/verify.sh` del harness compara hash del contrato contra hash registrado en el schema.

**Por qué no es "copiar `doc/`":** `ADR-005` prohíbe copias que envejecen en silencio. Esta envejece
a los gritos, y esa es la diferencia entera. Igual **necesita ADR** (§8), porque roza el límite.

**Lo que NO va en el schema:** las reglas ID-01..ID-10, la rúbrica, los ejemplos. Eso se sigue
citando en vivo. El schema lleva estructura y enums, nada de juicio.

### C1 — Portfolio Entry implementado en la plataforma

**Dónde:** `ai-service/agents/portfolio_entry/`, con las cuatro etapas como stages del harness
existente. No un pipeline nuevo: **reusar `harness/state_machine.py`, `trace.py` y `gates.py`**, que
ya hacen traza de auditoría y gates con umbrales.

**Mapeo de vocabularios (C0 lo fija, esto lo aplica):**

| `doc/` | `methodology.yaml` | Quién adapta |
|---|---|---|
| `USER_DECLARED` | `declared` | adaptador único en `ai-service`, un solo lugar |
| `EXTRACTED_FROM_USER_TEXT` | `extracted` | ídem |
| `AI_INFERRED` | `inferred` | ídem |
| `contradictions[]` | gate `contradiction` (`any_conflicting`) | ídem |
| `analysis_status: ready` | **no es `confirmed`** | ídem, y es el error más caro de cometer |

La última fila es la que hay que vigilar: `ready` significa *alcanza para seguir*, no *confirmado*.
Si el adaptador la mapea a `confirmed`, se rompe `INV-03` y la plataforma empieza a firmar por el
usuario. Debe haber un test que lo prohíba explícitamente.

**Dónde entra en el flujo de producto:** es la puerta de `MVP-P4-02` del PLAN-MVP — invitado abre el
link de convocatoria → **Pantalla 1 (raw_input)** → análisis → **Pantalla 2 (confirma)** → se crea la
iniciativa con Step 0 prefilled. Hoy ese tramo va directo del link al formulario.

**Dónde NO entra:** Steps 0–4, el portafolio completo, las otras siete pantallas del Crazy 8s.
`ADR-004 del harness` fija el alcance y esta integración no lo amplía.

**Reuso que ya está:** `ADR-005 del producto` ya define el patrón visual de provenance con
confirmar / editar / descartar, accesible y sin señal solo por color. Pantalla 2 es ese patrón
aplicado al análisis. No se diseña de nuevo.

### C2 — Telemetría: cada análisis de producción es un caso candidato

**Qué se emite:** por cada `PortfolioEntryAnalysis` producido, un registro con `raw_input`
redactado, el análisis completo, la `HarnessTrace`, versiones de prompt/modelo/config, y — cuando
existe — **lo que la persona confirmó o corrigió en Pantalla 2**.

Ese último campo es el más valioso de todo el diseño: es la única señal de verdad que no viene de
un agente. Un análisis que el usuario corrigió es un caso fallado, con su respuesta correcta
adjunta, gratis.

**Redacción:** reusar `ai-service/agents/pdf_extractor/pii.py` (DNI/RUC, email, teléfono PE). Su
propio docstring admite que es un stub V1 con regex y que el objetivo es Presidio con recall ≥ 0.95.
**Para este uso ese stub no alcanza**: `raw_input` es prosa libre con nombres de personas, empresas
y clientes, que ninguna regex toma. La telemetría no sale del entorno de producción hasta que la
redacción cubra entidades nombradas, o hasta que el export sea manual y revisado por una persona.
Esto es un bloqueo, no una advertencia.

**Dónde se deposita:** `$STARTERIA_STATE_ROOT/produccion/`, el mismo árbol que `ADR-010` fijó.
Afuera del repo, por la misma razón: son conversaciones reales.

### C3 — gbrain como memoria de los dos loops

Dos fuentes registradas, una frontera:

| Fuente | Qué ingesta | Escribe |
|---|---|---|
| `harness-estado` | `$STARTERIA_STATE_ROOT/{entendimiento,conflictos,casos,revisiones,registros,patrones}/` + `BITACORA.md` | el plugin, vía MCP |
| `produccion` | `$STARTERIA_STATE_ROOT/produccion/` (redactado) | un job de export, no un agente |
| ~~`doc/`~~ | **prohibido** — `ADR-010 §2.3` | — |

`/starteria-patron` pasa a leer sobre las dos fuentes. Ahí deja de ser teatro: "¿qué casos fallaron
por la misma causa?" sobre cuarenta registros del equipo **más** doscientos análisis reales es una
pregunta que hoy nadie contesta.

**Higiene obligatoria, ya observada:** `gbrain doctor` reclama nuestras diez `skills/` como suyas
(20 avisos `UNREACHABLE`) y ofrece `gbrain skillpack sync`. Como `ADR-008` hace que el plugin
autodescubra `skills/`, correr ese comando **publicaría 63 comandos ajenos dentro del producto**.
`ADR-010` ya lo prohíbe; la integración lo hace imposible: gbrain se apunta a
`$STARTERIA_STATE_ROOT`, nunca a la raíz del repo.

### C4 — El puente de vuelta: de patrón a caso automático

El cierre del círculo, y la parte que **no se debe automatizar sola**.

```text
análisis de prod corregido por el usuario
   → export redactado → $STARTERIA_STATE_ROOT/produccion/
   → /starteria-patron agrupa por causa común
   → una persona elige cuáles valen        ← control humano, no negociable
   → /starteria-caso redacta el caso
   → golden case en ai-service/harness/eval/dataset.py
   → corre en CI para siempre
```

El paso subrayado existe porque `ADR-003` decidió que la verificación es humana. Un pipeline que
convierte producción en golden cases sin que nadie mire es un gate, y encima uno que aprende de sus
propios errores sin supervisión.

---

## 5. El backend MCP

**Sí hace falta, y ya existe: `gbrain serve`.** No hay que escribir un servidor.

### 5.1 Por qué hace falta

Sin MCP, el plugin lee y escribe archivos sueltos en `$STARTERIA_STATE_ROOT`. Eso encadena las fases
(que era el problema de `ADR-010 §2.2`) pero no da búsqueda semántica: `/starteria-patron` sobre
cuarenta registros en markdown plano es un `grep`, y la pregunta que justifica la memoria —causa
común entre casos que **no comparten vocabulario**— es justamente la que `grep` no contesta.
`ADR-010` ya verificó ese punto: dos páginas sin vocabulario compartido se recuperaron con similitud
0.84 y 0.82.

### 5.2 Topología

```text
  ┌─────────────────┐   stdio    ┌──────────────────┐
  │ Claude Code     │◄──────────►│  gbrain serve    │
  │ (plugin)        │            │                  │
  │ perfil:         │            │  fuentes:        │
  │  memory-writer  │            │   harness-estado │
  │  fence: casos/, │            │   produccion     │
  │   registros/,   │            │                  │
  │   patrones/     │            └────────┬─────────┘
  └─────────────────┘                     │
                                          │ http (fase 3, condicional)
  ┌─────────────────┐                     │
  │ ai-service      │◄────────────────────┘
  │ perfil:         │   solo lectura, fuente `produccion`
  │  memory-reader  │
  └─────────────────┘
```

### 5.3 Concesiones concretas

Perfiles disponibles verificados: `memory-reader`, `memory-writer`, `coding-agent`, `operator`,
`delegating-agent`, `full`.

**Cliente 1 — el plugin (obligatorio, fase 1):**

```bash
gbrain mcp grant harness-plugin \
  --harness claude-code \
  --profile memory-writer \
  --bound-slug-prefixes casos/,registros/,patrones/,revisiones/,conflictos/,entendimiento/ \
  --federated-read harness-estado,produccion \
  --bound-max-concurrent 1 \
  --credentials-out ~/.starteria/.mcp-credentials
```

El cerco de prefijos es lo que impide que una skill escriba fuera de su tipo de artefacto. `--profile
full` sería cómodo y sería un error: le daría al plugin permiso de borrar la memoria del equipo.

**Cliente 2 — `ai-service` (opcional, fase 3):** `--profile memory-reader`, sin cerco de escritura,
solo para que el producto pueda preguntar "¿ya vimos este tipo de entrada antes?". Es la única
lectura de gbrain desde runtime, y **no debe estar en el camino crítico de un request**: si gbrain no
responde, el análisis se emite igual.

### 5.4 Lo que este MCP **no** es

No es un backend de la plataforma. El portfolio, los retos y las iniciativas siguen viviendo en
`backend/modules/portfolio/` con sus guards de permiso. gbrain no ve datos de negocio: ve artefactos
del harness y análisis redactados.

### 5.5 ¿Hace falta un segundo MCP, del lado de la plataforma?

**Todavía no.** Se justificaría si el operador del harness necesitara consultar la plataforma en vivo
("traeme los cinco análisis de esta semana con `analysis_status: failed`"). Hoy eso se cubre con un
export por lote hacia `$STARTERIA_STATE_ROOT/produccion/`, que además es más fácil de auditar.

El gatillo para revisarlo: **la primera vez que alguien pida un caso de producción y el export por
lote sea demasiado lento o demasiado ciego.** Ahí un MCP de solo-lectura sobre
`backend/modules/portfolio/` gana su lugar — con los mismos guards `requirePermission` que ya existen,
nunca esquivándolos.

---

## 6. La wiki: taxonomía de páginas y fronteras

gbrain es una wiki de verdad —páginas con slug, links tipados, backlinks, grafo, tags, timeline— y
esa estructura hay que decidirla, no dejarla emerger.

### 6.1 Slugs

```text
entendimiento/<fecha>-<tema>        de /starteria-afilar
conflictos/<fecha>-<tema>           de /starteria-autoridad
casos/<id-caso>                     de /starteria-caso
revisiones/<id-caso>-<n>            de /starteria-revisar
registros/<id-caso>-<fecha>         de /starteria-probar  ← el que más crece
patrones/<id-patron>                de /starteria-patron
decisiones/<adr-id>                 de /starteria-decision
produccion/<fecha>/<analysis-id>    del export redactado
bitacora/<fecha>                    de /starteria-cierre
```

### 6.2 Links tipados: el grafo es el producto

```text
registros/X-2026-09-13  --verifica-->    casos/X
casos/X                 --deriva-de-->   produccion/2026-09-10/a7f3
patrones/P-002          --agrupa-->      registros/X-…, registros/Y-…
decisiones/ADR-011      --responde-a-->  patrones/P-002
conflictos/2026-09-13-… --resuelto-por-->decisiones/ADR-011
```

Con eso, "¿por qué decidimos esto?" se contesta caminando el grafo hacia atrás hasta un análisis real
de un usuario real. Hoy esa cadena existe solo en la memoria de quien estuvo en la sesión — que es,
palabra por palabra, el problema que `ADR-010 §1` describe.

### 6.3 Las dos fronteras

1. **`doc/` no entra.** `ADR-010 §2.3`, y la alternativa rechazada más peligrosa por ser la más útil
   a primera vista.
2. **`skills/` no es de gbrain.** Nunca `gbrain skillpack sync` en este repo.

---

## 7. Fases, y cómo se enganchan con el PLAN-MVP

| Fase | Qué | Depende de | PLAN-MVP |
|---|---|---|---|
| **F0** | `~/.starteria/` existe; gbrain con fuente `harness-estado`; grant del plugin; una corrida punta a punta | nada | — |
| **F1** | Proyección C0 del contrato + chequeo de deriva en `verify.sh` | F0 | — |
| **F2** | Portfolio Entry en `ai-service` sobre el harness existente + Pantalla 1/2 | F1 | habilita `MVP-P4-02` |
| **F3** | Telemetría redactada → `produccion/`; segunda fuente en gbrain | F2 + redacción NER | — |
| **F4** | Puente patrón→golden case, con selección humana | F3 + ADR de §8 | alimenta `ai-service/harness/eval/` |
| **F5** | MCP de lectura desde `ai-service` (condicional, §5.5) | F3 | — |

**F0 primero y sin discusión.** Tres de los seis criterios de `ADR-010 §5` siguen abiertos, incluido
el único que *invalida el diseño* si falla: cortar la cadena a propósito y ver que la skill siguiente
**lo dice y sigue**. Integrar sobre una cadena que nunca corrió entera es construir sobre un supuesto.

---

## 8. Lo que hay que firmar antes de codificar

Este blueprint **propone**; nada de acá está decidido. Cuatro decisiones no son de implementación:

| # | Decisión | Serie | Por qué no la puede tomar la herramienta |
|---|---|---|---|
| **D1** | La proyección `schema.json` es la única copia permitida de `doc/` | harness (ADR-011) | roza `ADR-005`; hay que aceptar el costo explícitamente |
| **D2** | El harness humano puede alimentar el eval automático, y con qué control | harness (ADR-012) | `ADR-003` decidió que no hay gates; esto los toca |
| **D3** | El mapeo de vocabularios epistémicos, y quién es la fuente | **producto** (ADR-001 de esa serie) | es una regla de producto, no de la herramienta |
| **D4** | Qué se redacta antes de que un `raw_input` real salga de producción | producto | es una decisión de privacidad sobre datos de terceros |

**D3 merece una nota.** El índice de ADR dice que la serie de producto **no tiene ninguno todavía**.
Este sería el primero, y se numera `ADR-001` de esa serie, no después del décimo del harness. También
convive con el `ADR-030` que el PLAN-MVP ya pide para la máquina de estados: son distintos, pero
quien firme uno debería ver el otro.

---

## 9. Riesgos

| Riesgo | Por qué duele | Mitigación |
|---|---|---|
| **Se integra antes de implementar Portfolio Entry** | todo lo demás mide humo (H1) | F2 es previa a F3/F4, sin excepción |
| **Los dos vocabularios derivan más** | ya derivaron sin que nada fallara | C0 + un solo adaptador + test que prohíbe `ready → confirmed` |
| **`raw_input` real se filtra** | son conversaciones de clientes de un cliente | F3 bloqueada hasta NER; export manual revisado mientras tanto |
| **`gbrain skillpack sync` por accidente** | publica 63 comandos ajenos dentro del producto | gbrain nunca apunta a la raíz del repo; dejarlo escrito donde se lee |
| **El brain se vuelve dependencia dura** | `ADR-010` aceptó una dependencia de servicio | lectura desde runtime nunca en camino crítico (§5.3) |
| **La automatización se come el control humano** | es el gatillo de revisión de `ADR-003` | D2 firmada antes de F4, no después |
| **Nadie consulta gbrain en un mes** | es el segundo gatillo de revisión de `ADR-010` | si pasa, volver a archivos planos y cerrar el brain |

---

## 10. Criterios de aceptación

- [ ] **F0:** la cadena corre punta a punta con un caso real y cada paso encuentra el anterior.
- [ ] **F0:** se borra un artefacto intermedio a propósito y la skill siguiente **lo dice y sigue**.
- [ ] **F0:** `/starteria-patron` sobre dos registros devuelve una causa común citando los dos.
- [ ] **F1:** cambiar un enum en `doc/` sin regenerar el schema **rompe** `verify.sh`.
- [ ] **F2:** una entrada real produce un `PortfolioEntryAnalysis` válido contra el schema, con las
      cuatro etapas visibles en la traza.
- [ ] **F2:** un test prueba que `analysis_status: ready` **nunca** se mapea a `confirmed`.
- [ ] **F2:** el e2e de `MVP-P4-02` pasa por Pantalla 1 y Pantalla 2 y termina en `in_step_0`.
- [ ] **F3:** un `raw_input` con nombre de persona y empresa sale redactado; se verifica sobre el
      texto redactado, no sobre el mensaje de éxito del redactor.
- [ ] **F4:** un caso nacido de una corrección real de un usuario corre como golden case en CI, y
      su cadena se camina hacia atrás en la wiki hasta el análisis original.

Los últimos dos criterios son los que dicen si esta integración sirvió. El resto es plomería.

---

## Anexo — qué se leyó

`Dashboardstarteria/docs/PLAN-MVP-portafolio-retos-iniciativas.md`, `AGENTS.md`,
`ai-service/harness/{config/methodology.yaml,state_machine.py,trace.py,eval/dataset.py}`,
`ai-service/agents/pdf_extractor/pii.py`, `backend/modules/{portfolio,truth}/`,
`front/src/features/`, `docs/adr/ADR-005-autofill-provenance-ux.md`;
`harness-starteria/AGENTS.md`, `docs/BLUEPRINT.md`, `docs/adr/ADR-INDEX.md`,
`docs/adr/ADR-010-…md`, `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md`, `skills/`;
y la CLI de gbrain 0.50.0.0 (`--help`, `mcp grant --help`, `mcp profiles`, `mcp adapters`,
`sources list`, `doctor --fast`).
