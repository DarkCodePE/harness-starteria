---
id: ADR-008
title: "El harness se empaqueta como plugin de Claude Code, con las skills autodescubiertas en `skills/`"
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

# ADR-008: El harness se empaqueta como plugin de Claude Code, con las skills autodescubiertas en `skills/`

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

- `.claude-plugin/plugin.json` identifica el plugin y **no declara las skills**.
- `.claude-plugin/marketplace.json` lo hace instalable desde GitHub y desde una ruta local.
- Las ocho carpetas se mudan de `.claude/skills/starteria*` a **`skills/starteria*`**, en la raíz.
- El clon de `mattpocock/skills`, que ocupaba ese nombre, se mueve a **`referencia/`**.
- El plugin se lleva **solo las skills**. `doc/` y `docs/` quedan en el repo y fuera del plugin.

**Por qué `skills/` y no otro nombre:** Claude Code autodescubre las skills en `skills/` de la raíz
del plugin. Con ese nombre, `plugin.json` no necesita enumerarlas; con cualquier otro hay que
declarar cada carpeta a mano en un array, y entonces **un comando que existe pero que nadie declaró
no carga, y nada lo avisa**. Ese modo de fallo silencioso es peor que el costo de mover un clon.

La parte central de `ADR-001` (no escribir dentro del clon de Matt) sobrevive intacta: el clon no se
tocó, se movió entero con su `.git` y sigue siendo la referencia de estilo.

**Los clones de terceros se ignoran, todos.** `referencia/` y `token-optimizer/` están en
`.gitignore`. Son repos de otra gente que viven adentro por conveniencia, no contenido de este
proyecto.

## 3. Alternativas consideradas

- **Quedarse en `.claude/skills/`:** rechazada. No se puede publicar ni instalar en otro repo, que
  es exactamente lo que se necesita ahora.
- **Plugin en una subcarpeta `plugin/`:** rechazada. El marketplace queda un nivel adentro y la
  instalación desde GitHub se vuelve menos directa, a cambio de una prolijidad que hoy no compra
  nada: el repo no contiene otra cosa que el harness.
- **Mover el clon de Matt y usar `skills/` para lo nuestro:** rechazada primero, **adoptada
  después, el mismo día.** El rechazo inicial decía que era destructivo e innecesario "porque
  `plugin.json` no obliga a ese nombre". Lo segundo resultó verdad a medias: no obliga, pero
  `skills/` es el nombre que activa el autodescubrimiento, y sin él queda un array manual cuyo modo
  de fallo es silencioso. Lo primero resultó falso: mover un clon con `mv` conserva su `.git` entero
  y no destruye nada. Ver el Historial.
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
- Agregar un comando exige dos pasos: la carpeta y el router. `plugin.json` no hay que tocarlo, y
  liberar el nombre `skills/` fue exactamente para eso.
- La tabla de renombrado de `PARA-CHATGPT.md` es una cuarta cosa a mantener sincronizada.
- **La raíz del repo es la raíz del plugin, así que el plugin ve todo lo que hay en la raíz.** Al
  instalarlo desde ruta local, el inventario reporta `MCP servers (1) claude-flow`: está tomando el
  `.mcp.json` de ruflo, que es configuración de este proyecto y no del harness. Desde GitHub no pasa,
  porque `.mcp.json` está en `.gitignore` y no viaja. Queda anotado porque es la clase de fuga que
  produce empaquetar en la raíz, y la próxima cosa que alguien deje en la raíz va a viajar igual.
  **Cerrado estructuralmente el 2026-09-13 por `ADR-011 §2.4`:** el paquete dejó de ser la raíz.
  `plugins/starteria-harness/` lleva solo `skills/`, `agents/` y los manifiestos, lo genera un script
  que es dueño de esa exclusión, y `verify.sh` bloque 6 falla si deriva. La predicción de esta línea
  —que la próxima cosa dejada en la raíz iba a viajar igual— deja de cumplirse por diseño y no por
  suerte de `.gitignore`.
- Un plugin instalado donde no hay `doc/` no puede leer los contratos. Los comandos degradan bien
  (piden que se peguen) pero es una degradación real, no una ausencia de problema.

## 5. Criterios de aceptación de la decisión

- [x] `plugin.json` y `marketplace.json` son JSON válido.
- [x] El autodescubrimiento encuentra exactamente 8, sin arrastrar las 25 de `referencia/skills/`.
- [x] Los enlaces relativos entre skills siguen resolviendo después de la mudanza.
- [x] `referencia/` y `token-optimizer/` están ignorados.
- [x] `/plugin marketplace add` + `/plugin install` desde ruta local: instala y el inventario
      reporta `Skills (8)`, ~989 tokens siempre presentes.
- [x] Lo mismo desde GitHub. Verificado el 2026-09-13: `marketplace add DarkCodePE/harness-starteria`
      + `install` reporta `Skills (8)`, `Agents (1)`, `MCP servers (0)`.
- [ ] Instalado en un repo sin `doc/`, un comando pide el contrato en vez de inventarlo.

## 6. Gatillos de revisión

La primera instalación en un repo que no sea este. Si la ausencia de `doc/` rompe los comandos en
lugar de degradarlos, la frontera entre plugin y contratos está mal puesta y hay que rediscutir si
el plugin debe llevarse los contratos o un comando de arranque que los pida.

## Historial

- 2026-09-11 · proposed · supera a `ADR-001`, cuyo gatillo de revisión era exactamente este caso.
  Primera forma: skills en `comandos/`, declaradas a mano en un array de `plugin.json`, para no
  tocar el clon de Matt.
- 2026-09-11 · revisado el mismo día · se movieron a `skills/` y se eliminó el array. Lo que cambió
  la decisión fue mirar cómo lo resuelve `token-optimizer`, un plugin que soporta once runtimes: su
  `.claude-plugin/plugin.json` **no declara skills**, porque Claude Code las autodescubre en
  `skills/`. Con eso el array manual dejó de ser un detalle de forma y pasó a ser un modo de fallo
  silencioso que no había razón para aceptar. El clon de Matt se movió a `referencia/` con `mv`,
  conservando su `.git`. Verificado: el inventario del plugin reporta `Skills (8)`.
- 2026-09-13 · el plugin dejó de llevar **sólo** skills: ahora también lleva `agents/`, con
  `portfolio-entry-responder`, que es la fase 1 de `/starteria-probar` aislada por construcción. El
  subagente no ve el hilo que lo invoca, y además tiene `PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` fuera de
  su alcance de lectura, así que no puede abrir el archivo donde vive el `EXPECTED`. Eso contradice
  la letra de §2, que dice que el plugin se lleva las skills. **Debe un ADR que lo extienda**, y el
  número queda por asignar: `009` y `010` ya están tomados, y el blueprint de integración §8 reservó
  `011` y `012` para dos decisiones que todavía no se escribieron. Se anota acá para que la
  contradicción no quede invisible, que es lo que `/starteria-autoridad` prohíbe hacer.
  De paso, instalar desde GitHub ya no arrastra `.mcp.json`: el inventario reporta
  `MCP servers (0)`, con lo que la fuga descrita en §4 queda cerrada por el lado de GitHub y sigue
  viva al instalar desde una ruta local con ese archivo presente.
