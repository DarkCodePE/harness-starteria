# Arquitectura del harness

**Versión:** v0.1
**Fecha:** 2026-09-10

## 1. Las cuatro capas

```text
┌──────────────────────────────────────────────────────────────┐
│  RUNTIME            Claude Code            ChatGPT           │
│                     comandos /             archivos de       │
│                     autodescubiertos       Proyecto          │
└───────────────────────────┬──────────────────────────────────┘
                            │ ambos leen el mismo markdown
┌───────────────────────────▼──────────────────────────────────┐
│  COMANDOS           8 carpetas en skills/starteria*          │
│                     cada una con su SKILL.md                 │
│                     el trabajo que hace una persona          │
└───────────────────────────┬──────────────────────────────────┘
                            │ citan y derivan
┌───────────────────────────▼──────────────────────────────────┐
│  REFERENCIA         MAPA-DE-DOCUMENTOS.md  GLOSARIO.md       │
│                     RUBRICA.md  plantillas                   │
│                     lo único que deriva contenido de doc/    │
└───────────────────────────┬──────────────────────────────────┘
                            │ cita, nunca copia
┌───────────────────────────▼──────────────────────────────────┐
│  CONTRATOS          doc/ (9 archivos)                        │
│                     la autoridad. El harness no los toca     │
└──────────────────────────────────────────────────────────────┘
```

La flecha va en un solo sentido. Un contrato nunca sabe que el harness existe, y por eso el harness
se puede tirar y volver a escribir sin tocar el producto.

## 2. Dónde está cada cosa

```text
harness-starteria/                        raíz del plugin
├── .claude-plugin/
│   ├── plugin.json                       identifica el plugin; NO declara skills
│   └── marketplace.json                  para instalar desde GitHub
├── AGENTS.md                             contrato del PRODUCTOR, ADR-009. Lo leen
│                                         los dos runtimes; por eso no es CLAUDE.md
├── doc/                                  contratos, autoridad, no se toca
├── docs/                                 documentos DEL harness (este)
│   ├── PRD.md  DDD.md  ARCHITECTURE.md  LIFECYCLE.md  PLAN.md  progress.md
│   ├── BLUEPRINT.md                      los 4 pasos de entry-0X, y el harness
│   │                                     leído como el mismo workflow
│   ├── BENCHMARK.md                      plan de medicion: pass^k, el caso de exito,
│                                         y la suite J que todavia no existe
│   └── adr/                              ADR-001..009 + ADR-INDEX.md
├── referencia/                           clon de mattpocock/skills, ignorado
├── token-optimizer/                      clon de terceros, ignorado
├── scripts/verify.sh                     gate del productor, ADR-009
├── estado/BITACORA.md                    runtime DEL PRODUCTO: lo escribe
│                                         /starteria-cierre en el repo de quien
│                                         usa el plugin. Acá, ignorado
└── skills/                               autodescubiertas por el plugin
    ├── starteria/                        router + los 3 archivos compartidos
    │   ├── SKILL.md                      /starteria
    │   ├── MAPA-DE-DOCUMENTOS.md         cadena de autoridad -> archivos reales
    │   ├── GLOSARIO.md                   jerga -> español llano
    │   └── PARA-CHATGPT.md               armado del Proyecto
    ├── starteria-afilar/SKILL.md
    ├── starteria-autoridad/SKILL.md
    ├── starteria-probar/                 SKILL.md + RUBRICA.md + REGISTRO.md
    ├── starteria-caso/                   SKILL.md + PLANTILLA.md
    ├── starteria-decision/               SKILL.md + PLANTILLA-ADR.md
    ├── starteria-cierre/SKILL.md
    └── starteria-glosario/SKILL.md
```

`skills/` porque es el nombre que Claude Code autodescubre en la raíz de un plugin: sin ese nombre
hay que declarar cada carpeta a mano en `plugin.json`, y un comando que existe pero nadie declaró no
carga y nada lo avisa. El clon de `mattpocock/skills` ocupaba el nombre y se movió a `referencia/`.

Vivieron en `.claude/skills/` hasta el 2026-09-11 (`ADR-001`), pasaron a `comandos/` al empaquetar
como plugin, y llegaron acá el mismo día al liberar el nombre (`ADR-008`).

## 3. Qué lee cada comando

| Comando | De `doc/` | De referencia | Escribe |
|---|---|---|---|
| `/starteria` | nada | mapa, glosario, ChatGPT | nada |
| `/starteria-afilar` | lo que la entrevista necesite | glosario | nada |
| `/starteria-autoridad` | el nivel que corresponda | mapa | nada |
| `/starteria-probar` | AI Harness (caso), Agent Contract y las 4 `entry-0X` (fase 1) | rúbrica, registro | el registro, afuera del repo |
| `/starteria-caso` | AI Harness (índice), Agent Contract, las 4 `entry-0X` | plantilla | el caso, sin integrarlo |
| `/starteria-decision` | el contrato afectado | plantilla ADR | ADR en `propuesto` |
| `/starteria-cierre` | nada | nada | `estado/BITACORA.md` |
| `/starteria-glosario` | donde esté la definición | glosario | nada |

**Ningún comando escribe en `doc/`.** `ADR-007`.

## 4. El único mecanismo real: el aislamiento de fases

Todo lo demás es prosa que el modelo sigue. Esto es lo único que tiene una consecuencia estructural,
y es lo que hace que un puntaje signifique algo.

```text
        hilo principal                          afuera
   ┌────────────────────┐
   │ /starteria-probar  │
   │ lee el caso        │
   │ arma el bloque ────┼──────────────►  ┌──────────────────────┐
   │                    │                 │ FASE 1: RESPONDER    │
   │ (acá viven la      │                 │                      │
   │  rúbrica y el      │                 │ ve: Agent Contract   │
   │  EXPECTED)         │                 │      4 entry-0X      │
   │                    │                 │      el INPUT        │
   │                    │                 │                      │
   │                    │                 │ NO ve: rúbrica,      │
   │                    │                 │  EXPECTED, ni que    │
   │                    │                 │  lo están evaluando  │
   │ ACTUAL     ◄───────┼─────────────────┤                      │
   │                    │                 └──────────────────────┘
   │ FASE 2: PUNTUAR    │
   │ registro           │      Claude Code: subagente
   └────────────────────┘      ChatGPT: otro chat del Proyecto
```

Sin esa separación el modelo ve la respuesta esperada antes de contestar y se saca la nota que
quiere. Con ella, el número mide algo.

**No es un candado.** Nada impide correr las dos fases en el mismo hilo. Lo que hace el comando es
obligar a que el registro diga `CONTAMINADO`, para que una corrida inflada no se compare de igual a
igual con una limpia. Está en `ADR-002`.

## 5. Un solo runtime

Claude Code, y nada más. `ADR-010`.

| | Claude Code |
|---|---|
| Cómo se cargan | plugin instalado desde el marketplace o desde una ruta local |
| Cómo se invocan | `/comando` |
| Enlaces entre archivos | funcionan |
| Leer `doc/` | directo del disco |
| Fase 1 de `/starteria-probar` | subagente |
| Dónde queda el estado | `$STARTERIA_STATE_ROOT`, afuera del repo |

Hubo un segundo runtime. `ADR-006` sostuvo ChatGPT con un solo cuerpo de markdown y una tabla de
renombrado de catorce archivos, y su criterio de aceptación —que alguien de afuera montara el
Proyecto siguiendo solo `PARA-CHATGPT.md`— nunca se cumplió. `ADR-010` lo abandonó cuando el foco de
producto se movió a empresas, donde la gente ya trabaja con Claude Code.

Con él se fueron `PARA-CHATGPT.md`, el script que lo mantenía en sync, el chequeo de deriva de
`verify.sh`, y las bifurcaciones por runtime dentro de cada `SKILL.md`. Lo que ganó el harness a
cambio es que el estado puede vivir en disco y una memoria puede indexarlo, que es lo que ChatGPT
nunca iba a poder alcanzar.

## 6. Por qué el trabajo compartido vive en `starteria/`

`GLOSARIO.md` y `MAPA-DE-DOCUMENTOS.md` los usan varios comandos. Podrían estar duplicados en cada
carpeta, o en una carpeta `_compartido/`.

Están dentro de `starteria/`, la carpeta del router, porque una carpeta sin `SKILL.md` no es una
skill: `plugin.json` no la declara, el runtime la ignora, y un mantenedor futuro no sabe si borrarla.
Ponerlos junto al router los ata a algo que sí existe y que sí está declarado.

**El costo:** los otros comandos los referencian con `../starteria/GLOSARIO.md`, así que copiar una
skill sola a otro lado le rompe los enlaces. Es aceptable porque no están pensadas para viajar
sueltas, y en ChatGPT los enlaces se rompen igual.

## 7. Dónde se extiende

- **Un comando nuevo:** carpeta con `SKILL.md`, frontmatter con `name` igual a la carpeta, y
  `disable-model-invocation: true` si se invoca a mano. Después agregarlo al router y a la tabla de
  `PARA-CHATGPT.md`: un router que no lo menciona es un router que miente.
- **Una experiencia nueva** (Pantalla 3, Steps): hoy `/starteria-probar` y `/starteria-caso` tienen
  la tabla de suites A a I adentro, que es de Portfolio Entry. Extender significa parametrizar eso,
  y ahí conviene una carpeta por experiencia. No se hizo ahora porque no hay contratos para otra
  experiencia. `ADR-004`.
- **Verificación mecánica:** si algún día se quiere, el punto natural es un chequeo de que cada
  `EXPECTED` referenciado exista en `doc/`. Sería el primer gate, y contradice `ADR-003`, así que va
  con ADR que lo reemplace.

## 8. Qué rompe esto

Con nombre, para que se reconozca cuando pase:

- **Renombrar o mover un archivo de `doc/`.** El mapa y varios comandos citan nombres exactos. No
  hay nada que lo detecte: los comandos van a decir que el documento no existe.
- **Cambiar los ids de caso o las suites del AI Harness.** La tabla de suites quedaría mintiendo.
- **Cambiar la rúbrica o los fallos duros en `doc/` sin tocar `RUBRICA.md`.** Es el peor de todos
  porque no falla: puntúa distinto y nadie se entera. `RUBRICA.md` declara que `doc/` gana, pero
  nadie compara.
- **Poner `disable-model-invocation: true` en `starteria-glosario`.** Dejaría de saltar solo, que es
  todo lo que hace.
