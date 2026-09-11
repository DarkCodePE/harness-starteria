---
id: ADR-008
title: "El harness se empaqueta como plugin de Claude Code; las skills pasan a `comandos/`"
status: proposed
type: standard
date: 2026-09-11
deciders: [producto]
supersedes: ADR-001
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "primera instalación del plugin en un repo que no sea este: si `doc/` ausente rompe los comandos en vez de degradarlos, la frontera está mal puesta"
tags: [harness, plugin, distribucion, runtime]
---

# ADR-008: El harness se empaqueta como plugin de Claude Code; las skills pasan a `comandos/`

## 1. Contexto y problema

`ADR-001` puso las skills en `.claude/skills/` y compró con eso cero instalación: Claude Code las
descubre solas al abrir el repo. Funcionó mientras el harness vivía en un solo lugar.

Dejó de alcanzar cuando aparecieron dos necesidades que esa forma no cubre:

- **Instalarlo desde el marketplace**, para que el harness llegue a quien no clona este repo.
- **Probarlo en otros harness de la misma máquina.** `.claude/skills/` es una carpeta de *este*
  proyecto; para usar los comandos en otro repo había que copiarlos, y una copia se desincroniza.

El propio `ADR-001` anotaba esto en su gatillo de revisión: "cuando haya que instalar el harness en
otro repo". Ese momento llegó.

## 2. Decisión

**El repositorio pasa a ser la raíz de un plugin de Claude Code.**

- `.claude-plugin/plugin.json` declara las ocho skills.
- `.claude-plugin/marketplace.json` lo hace instalable desde GitHub y desde una ruta local.
- Las ocho carpetas se mudan de `.claude/skills/starteria*` a **`comandos/starteria*`**.
- El plugin se lleva **solo las skills**. `doc/` y `docs/` quedan en el repo y fuera del plugin.

**Por qué `comandos/` y no `skills/`:** `skills/` es el clon de `mattpocock/skills`, que sigue siendo
referencia de estilo y no se toca. El array `skills` de `plugin.json` acepta rutas arbitrarias, así
que el nombre de la carpeta es libre y no hay razón para pelear por ese nombre. La parte central de
`ADR-001` (no escribir dentro del clon) sobrevive intacta; lo que cambió es el destino.

**Los clones de terceros se ignoran, todos.** `skills/` y `token-optimizer/` están en `.gitignore`.
Son repos de otra gente que viven adentro por conveniencia, no contenido de este proyecto.

## 3. Alternativas consideradas

- **Quedarse en `.claude/skills/`:** rechazada. No se puede publicar ni instalar en otro repo, que
  es exactamente lo que se necesita ahora.
- **Plugin en una subcarpeta `plugin/`:** rechazada. El marketplace queda un nivel adentro y la
  instalación desde GitHub se vuelve menos directa, a cambio de una prolijidad que hoy no compra
  nada: el repo no contiene otra cosa que el harness.
- **Mover el clon de Matt y usar `skills/` para lo nuestro:** rechazada. Es destructivo sobre un
  repo ajeno y completamente innecesario, porque `plugin.json` no obliga a ese nombre.
- **Dejar enlaces desde `.claude/skills/` a `comandos/`** para conservar el autodescubrimiento local:
  rechazada. Dos caminos al mismo archivo es cómo alguien edita el equivocado y no entiende por qué
  su cambio no aparece. Instalar desde ruta local cuesta un comando y no tiene esa trampa.

## 4. Consecuencias

**Positivas**
- Instalable desde el marketplace y desde ruta local, con un solo cuerpo de archivos.
- Se puede usar en otros harness de la misma máquina sin copiar nada.
- `plugin.json` es una declaración explícita de qué es una skill y qué no: una carpeta sin
  `SKILL.md` deja de ser ambigua.

**Negativas y trade-offs aceptados**
- **Se perdió el cero-instalación que `ADR-001` había comprado.** En este mismo repo los comandos ya
  no aparecen solos: hay que instalar el plugin. Es el costo directo de la decisión.
- Agregar un comando ahora exige tres pasos, no uno: la carpeta, el router, y la entrada en
  `plugin.json`. Un comando que existe y no está declarado no carga, y nada lo avisa.
- La tabla de renombrado de `PARA-CHATGPT.md` es una cuarta cosa a mantener sincronizada.
- Un plugin instalado donde no hay `doc/` no puede leer los contratos. Los comandos degradan bien
  (piden que se peguen) pero es una degradación real, no una ausencia de problema.

## 5. Criterios de aceptación de la decisión

- [x] `plugin.json` y `marketplace.json` son JSON válido.
- [x] Las 8 rutas del array `skills` tienen su `SKILL.md` en disco.
- [x] Los enlaces relativos entre skills siguen resolviendo después de la mudanza.
- [x] `skills/` y `token-optimizer/` están ignorados.
- [ ] `/plugin marketplace add` + `/plugin install` desde ruta local muestra los ocho comandos.
- [ ] Lo mismo desde GitHub.
- [ ] Instalado en un repo sin `doc/`, un comando pide el contrato en vez de inventarlo.

## 6. Gatillos de revisión

La primera instalación en un repo que no sea este. Si la ausencia de `doc/` rompe los comandos en
lugar de degradarlos, la frontera entre plugin y contratos está mal puesta y hay que rediscutir si
el plugin debe llevarse los contratos o un comando de arranque que los pida.

## Historial

- 2026-09-11 · proposed · supera a `ADR-001`, cuyo gatillo de revisión era exactamente este caso.
