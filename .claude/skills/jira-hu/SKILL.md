---
name: jira-hu
description: >
  Lee y crea HU en el Jira del equipo de Starteria. Lectura: ubica una HU por clave (KAN-12) o por
  número y trae resumen, estado, descripción, hermanas y homónimas. Escritura: crea una HU con sus
  subtareas separadas en [Funcional] y [Técnica], con dry-run obligatorio antes de aplicar.
  Use when: hay que traer el contenido real de una HU antes de planificar, o el delivery-planner
  ya redactó un plan y hay que previsualizarlo o crearlo en Jira.
  Do not use for: redactar la HU (eso es el agente delivery-planner), mover estados ni cerrar
  tickets, ni nada del harness de producto de Portfolio Entry.
argument-hint: "<KAN-nnn | nnn> | crear <plan.json> [--aplicar] | --usuarios"
allowed-tools: Read Grep Glob
---

# Jira del equipo: leer y crear HU

Herramientas en `tools/`, junto a esta skill. Rutas relativas a esta carpeta:
`.claude/skills/jira-hu/tools/`.

## Credenciales

Tres variables, `JIRA_HOSTNAME`, `JIRA_USERNAME`, `JIRA_API_TOKEN`, y **lo exportado al entorno
gana sobre el `.env`**. Se busca el `.env` en `$JIRA_ENV_FILE`, junto a los scripts, y subiendo
desde el cwd. En un worktree el `.env` del checkout principal no está en ese camino:

```bash
export JIRA_ENV_FILE=/home/orlando/Desktop/harness-starteria/.env
```

Variables del equipo, en el mismo `.env` (plantilla en `tools/env.example`):

| Variable | Qué es |
|---|---|
| `JIRA_PROJECT` | proyecto donde nacen las HU (hoy `KAN`) |
| `JIRA_FUNCIONAL_ACCOUNT_ID` | quien lleva lo funcional (producto) |
| `JIRA_TECNICO_ACCOUNT_ID` | quien lleva lo técnico (desarrollo) |

Los `accountId` salen de `node tools/jira-hu-crear.mjs --usuarios`. Si una persona no aparece ahí,
no está invitada al proyecto y no se le puede asignar nada: la subtarea se crea sin asignar, con su
label, y el script lo avisa.

**Un 401 no es "no existe".** Si Jira rechaza, el script dice de dónde salió cada variable. Si el
token viene de `(entorno)` y el resto del `.env`, un token viejo exportado en el perfil del shell
está pisando al vigente: quitalo del perfil, o corré con `env -u JIRA_API_TOKEN node ...`.

## Leer una HU

```bash
node tools/jira-hu.mjs KAN-12          # clave directa
node tools/jira-hu.mjs 12              # número: busca en resúmenes y trae la épica con sus hijas
node tools/jira-hu.mjs KAN-12 --json   # salida estructurada
node tools/jira-hu.mjs --sonda         # ¿contesta Jira? solo /myself, JSON
```

Salida `0` encontrado · `1` no encontrado · `2` credenciales/red. Si la HU viene sin descripción,
trae las hermanas (mismo padre): el contenido puede estar en otra. Si hay homónimas (mismo resumen),
las lista: son dos tickets para un trabajo y alguien tiene que decir cuál manda.

`--a-fecha <ISO-8601>` devuelve la HU como estaba ese día, deshaciendo el changelog. Lo que no puede
reconstruir lo lista en `reconstruido.campos_no_reconstruidos`.

## Crear una HU

Forma en Jira (el proyecto es team-managed y no tiene tipo "Historia"):

```text
[Epic opcional]                      si el pedido agrupa varias HU
  └─ HU            Tarea,   label hu
       ├─ [Funcional] ...  Subtask, label funcional, asignada a JIRA_FUNCIONAL_ACCOUNT_ID
       └─ [Técnica] ...    Subtask, label tecnica,   asignada a JIRA_TECNICO_ACCOUNT_ID
```

```bash
node tools/jira-hu-crear.mjs estado/hu/<slug>.json            # dry-run: no escribe nada
node tools/jira-hu-crear.mjs estado/hu/<slug>.json --aplicar  # crea, y anota las claves en el JSON
```

El esquema del plan está en la cabecera del script. Cada subtarea puede declarar `bloqueadaPor`
(`["funcional#0"]`): se crean como enlaces `Blocks` de Jira. El dry-run valida el plan, resuelve tipos y
responsables, y **busca HU parecidas** (label `hu`, resumen similar): un pedido repetido en la daily
no merece un segundo ticket.

**`--aplicar` sólo con el sí explícito de una persona**, después de que vio el dry-run. Crear un
ticket es visible para todo el equipo. Un plan ya aplicado lleva `creado` y el script se niega a
aplicarlo otra vez.
