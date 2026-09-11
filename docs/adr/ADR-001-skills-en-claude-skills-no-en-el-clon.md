---
id: ADR-001
title: "Las skills del harness viven en `.claude/skills/`, no dentro del clon de mattpocock"
status: superseded
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: ADR-008
# Este ADR llega en `proposed` a propósito. La decisión está tomada y argumentada, pero
# `accepted` significa que una persona la aprobó, y eso no lo puede hacer la herramienta.
# Para firmarlo: status: accepted · aprobado_por: <tu nombre> · aprobado_en: <fecha>
aprobado_por: null
aprobado_en: null
review_trigger: "cuando el harness tenga que instalarse en otro repo, o cuando `.claude/skills/` pase de ~30 carpetas"
tags: [harness, ubicacion, runtime]
---

# ADR-001: Las skills del harness viven en `.claude/skills/`, no dentro del clon de mattpocock

## 1. Contexto y problema

El pedido original nombró `/home/orlando/Desktop/harness-starteria/skills` como el lugar donde
tenían que ir las skills, "al estilo mattpock". Al mirarlo resultó ser un **clon limpio de
`github.com/mattpocock/skills`**: su `.git`, su CI, su `plugin.json`, sus reglas de buckets y su
`CLAUDE.md` exigiendo que cada skill promovida tenga entrada en el README y página en `docs/`.

O sea que el pedido apuntaba a dos cosas a la vez: el **estilo** de ese repo, y la **ruta** de ese
repo. El estilo se puede copiar. La ruta pertenece a otro proyecto.

La decisión es difícil de revertir porque define cómo se cargan los comandos, cómo se instalan en
otra máquina y qué pasa cuando alguien actualiza el clon.

## 2. Decisión

**Las skills van en `.claude/skills/`, con prefijo `starteria-`.** El clon de `skills/` queda
intacto, como referencia de estilo viva.

El prefijo hace dos cosas: las agrupa bajo un mismo autocompletado (`/starteria` muestra las ocho)
y las distingue de las ~20 skills de ruflo que ya viven ahí.

## 3. Alternativas consideradas

- **Escribir dentro de `skills/skills/starteria/`**, respetando sus buckets: rechazada. El working
  tree del clon es de otro proyecto; el primer `git pull` produce conflictos sobre archivos que
  upstream no conoce, y su `CLAUDE.md` obligaría a mantener README, `plugin.json` y páginas de docs
  que no son nuestras.
- **Mover el clon a un lado y usar `skills/` para lo nuestro**, que es lo que el pedido decía
  literal: rechazada por quien pidió. Se pierde el repo de Matt como referencia consultable, y
  habría que volver a clonarlo aparte para mirarlo.
- **Carpeta propia `harness/skills/` más un enlace a `.claude/skills/`**, como hace
  `link-skills.sh` en el repo de Matt: rechazada. Agrega un paso de instalación a un harness cuyo
  usuario primario no es técnico, y el propio Matt marca ese script como de uso interno, no como
  instalador soportado.

## 4. Consecuencias

**Positivas**
- Cero instalación: Claude Code las descubre solas, aparecen como `/comando` al abrir sesión.
- El clon queda comparable con upstream (`git status` limpio), o sea sigue sirviendo de referencia.
- El prefijo da un descubrimiento real: escribir `/starteria` lista el harness entero.

**Negativas y trade-offs aceptados**
- Quedan mezcladas con las ~20 skills de ruflo. No se leen como un cuerpo propio en el listado,
  solo el prefijo las agrupa. Fue el costo que se eligió a cambio de no tener paso de instalación.
- `.claude/skills/` es específico de Claude Code. En ChatGPT hay que subirlas a mano, con la tabla
  de renombrado de `PARA-CHATGPT.md`. Ver `ADR-006`.
- Instalar el harness en otro repo hoy es copiar carpetas. No hay empaquetado.

## 5. Criterios de aceptación de la decisión

- [x] Los 8 `name:` del frontmatter coinciden con su carpeta.
- [x] 7 con `disable-model-invocation: true`, glosario sin eso.
- [x] `git -C skills status --short` devuelve vacío.
- [ ] Una sesión nueva de Claude Code muestra los 8 al escribir `/starteria`.

## 6. Gatillos de revisión

Cuando haya que instalar el harness en otro repo, o cuando `.claude/skills/` crezca al punto de que
el prefijo ya no alcance para encontrarlos. Ahí conviene empaquetado, y esta decisión se pone a
prueba.

## Historial

- 2026-09-10 · proposed · decisión tomada al descubrir que `skills/` era un clon de terceros.
- 2026-09-11 · superseded por `ADR-008` · el harness se empaquetó como plugin y las skills pasaron
  a `comandos/`. Lo que este ADR decidió sigue valiendo en su parte central: no escribir dentro del
  clon de Matt. Lo que cambió es el destino, de `.claude/skills/` a un plugin instalable, y con eso
  se pagó justamente el costo que la sección 4 anotaba como aceptado: dejaron de autodescubrirse.
