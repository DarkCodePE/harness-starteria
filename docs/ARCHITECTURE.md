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
│  COMANDOS           8 carpetas en .claude/skills/starteria*  │
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
harness-starteria/
├── doc/                                  contratos, autoridad, no se toca
├── docs/                                 documentos DEL harness (este)
│   ├── PRD.md  DDD.md  ARCHITECTURE.md  LIFECYCLE.md  PLAN.md
│   └── adr/                              ADR-001..007 + ADR-INDEX.md
├── skills/                               clon de mattpocock/skills, referencia de estilo
├── estado/BITACORA.md                    lo escribe /starteria-cierre
└── .claude/skills/
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

`.claude/skills/` y no `skills/` porque `skills/` es un clon limpio de `mattpocock/skills`:
escribir ahí adentro mezcla nuestro trabajo con el suyo y se rompe en el primer `git pull`.
Está en `ADR-001`.

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

## 5. Los dos runtimes

Un solo cuerpo de markdown, dos formas de cargarlo. `ADR-006`.

| | Claude Code | ChatGPT |
|---|---|---|
| Cómo se cargan | autodescubiertos desde `.claude/skills/` | archivos subidos a un Proyecto |
| Cómo se invocan | `/comando` | escribir el nombre del comando |
| Nombres | la carpeta distingue, todos son `SKILL.md` | hay que renombrar al subir |
| Enlaces entre archivos | funcionan | rotos, el modelo busca por nombre |
| Leer `doc/` | directo del disco | desde los archivos del Proyecto |
| Fase 1 de `/starteria-probar` | subagente | otro chat |
| Escribir la bitácora | sí | no, devuelve el bloque |

La diferencia de nombres es la trampa práctica: ocho archivos llamados `SKILL.md` en un Proyecto de
ChatGPT son indistinguibles. La tabla de renombrado está en `PARA-CHATGPT.md`.

## 6. Por qué el trabajo compartido vive en `starteria/`

`GLOSARIO.md` y `MAPA-DE-DOCUMENTOS.md` los usan varios comandos. Podrían estar duplicados en cada
carpeta, o en una carpeta `_compartido/`.

Están dentro de `starteria/`, la carpeta del router, porque en Claude Code una carpeta de
`.claude/skills/` que no tiene `SKILL.md` no es una skill: sería una carpeta suelta que el runtime
ignora y que un mantenedor futuro no sabe si borrar. Ponerlos junto al router los ata a algo que sí
existe.

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
