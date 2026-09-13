---
id: ADR-006
title: "Un solo cuerpo de markdown para Claude Code y ChatGPT, con el renombrado como precio"
status: superseded
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: ADR-010
aprobado_por: null
aprobado_en: null
review_trigger: "primer armado real del Proyecto de ChatGPT por alguien que no escribió el harness"
tags: [harness, portabilidad, runtime]
---

# ADR-006: Un solo cuerpo de markdown para Claude Code y ChatGPT, con el renombrado como precio

## 1. Contexto y problema

Los usuarios de este harness ya tienen un chat abierto, y no siempre el mismo: unos usan Claude
Code, otros ChatGPT. El pedido fue explícito, "que pueda correr en claude o chatgpt, que ya usan".

Los dos runtimes cargan instrucciones distinto. Claude Code descubre carpetas con `SKILL.md`
declaradas por un plugin (antes del 2026-09-11, sueltas en `.claude/skills/`; ver `ADR-008`) y las
expone como `/comando`. ChatGPT no tiene skills ni carpetas: tiene archivos
de Proyecto e instrucciones de Proyecto.

## 2. Decisión

**Un solo cuerpo de markdown, sin ramas por runtime.** Cada `SKILL.md` está escrito para que
funcione leído por cualquiera de los dos, y donde la diferencia es inevitable el texto la nombra en
una línea ("en Claude Code, un subagente; en ChatGPT, otro chat").

**El armado de ChatGPT es manual y está documentado**, en `PARA-CHATGPT.md`: qué subir, con qué
nombre, y el bloque de instrucciones de Proyecto listo para pegar.

**El renombrado es la parte fea y es obligatoria.** Las ocho skills se llaman `SKILL.md` y se
distinguen por carpeta; en un Proyecto de ChatGPT serían ocho archivos homónimos indistinguibles.
La tabla de renombrado (`starteria-probar/SKILL.md` sube como `starteria-probar.md`) resuelve eso.

## 3. Alternativas consideradas

- **Dos versiones, una por runtime:** rechazada. Duplica catorce archivos y garantiza que se
  desincronicen, con la agravante de que la versión menos usada se pudre sin que nadie lo note.
- **Un bundle concatenado, generado, para pegar en ChatGPT:** rechazada. Es una copia más que
  envejece, y generarlo pide un script que `ADR-003` no quiere.
- **Solo Claude Code:** rechazada por el pedido. Deja afuera a parte de los usuarios.
- **Un `agents/openai.yaml` por skill**, como hace el repo de Matt: rechazada. Ese formato sirve
  para Codex y plugins de OpenAI, no para un Proyecto de ChatGPT, que es donde va a estar esta
  gente.

## 4. Consecuencias

**Positivas**
- Un solo lugar para editar. Un cambio vale en los dos runtimes.
- En Claude Code no hay instalación: los comandos aparecen solos.
- El bloque de instrucciones de Proyecto lleva las reglas duras (no inventar, no crear objetos
  canónicos, no decidir), así que en ChatGPT valen aunque la persona no invoque ningún comando.

**Negativas y trade-offs aceptados**
- **El armado de ChatGPT son catorce archivos renombrados a mano.** Es tedioso, se hace una vez, y
  es donde más probable es que alguien abandone.
- Los enlaces relativos entre archivos se rompen en ChatGPT. Aceptado: el modelo tiene todo a la
  vista y los encuentra por nombre.
- En ChatGPT nada se guarda: `/starteria-cierre` devuelve el bloque y lo pega la persona.
- Un comando nuevo obliga a actualizar la tabla de renombrado además del router.

## 5. Criterios de aceptación de la decisión

- [x] Ningún `SKILL.md` asume herramientas que solo existen en un runtime sin nombrar la
      alternativa.
- [x] `PARA-CHATGPT.md` tiene la tabla completa de los 14 archivos.
- [x] El bloque de instrucciones de Proyecto incluye las reglas que valen sin comando.
- [ ] Alguien que no escribió el harness monta el Proyecto siguiendo solo ese documento.

## 6. Gatillos de revisión

El primer armado real por alguien de afuera. Si se traba en el renombrado, hay que buscar cómo
abaratarlo, aunque sea con un zip preparado.

## Historial

- 2026-09-10 · proposed · el renombrado apareció al ver que ocho `SKILL.md` en un Proyecto son
  indistinguibles.
- 2026-09-11 · actualizado · el empaquetado como plugin (`ADR-008`) no cambia esta decisión: sigue
  siendo un solo cuerpo de markdown. Solo cambió cómo lo carga Claude Code.
- 2026-09-11 · actualizado · **el armado sigue siendo manual, pero ya no puede quedar viejo en
  silencio.** `scripts/sync-para-chatgpt.py` genera los dos bloques derivados de `PARA-CHATGPT.md`
  —la lista de contratos de `doc/` y la tabla de renombrado de `skills/`— y `scripts/verify.sh`
  falla si el archivo commiteado no coincide. Eso cierra lo que `ADR-008` §4 anotó como "una cuarta
  cosa a mantener sincronizada". El gatillo de revisión del §6 **no** se cumple con esto: sigue
  esperando el primer armado real por alguien de afuera, porque abaratar el renombrado y evitar que
  la instrucción mienta son dos problemas distintos.
  El patrón es de `token-optimizer/scripts/check-mirror-sync.sh`: regenerar y diffear en vez de
  mantener una lista de excepciones. Con una divergencia deliberada: allá el chequeo regenera sobre
  el working tree, acá no escribe nada, porque `PARA-CHATGPT.md` es un archivo del producto y
  `ADR-009` §5 sostiene que el gate del productor no toca el producto.
  El generador **no** genera el bloque de instrucciones del Proyecto ni el orden de los archivos
  dentro de cada skill: ese orden es de uso, no alfabético (`MAPA` antes que `GLOSARIO`, `RUBRICA`
  antes que `REGISTRO`), y alfabetizarlo habría perdido esa información.
- 2026-09-12 · superseded · `ADR-010` abandona ChatGPT y deja un solo runtime. El criterio de
  aceptación abierto del §5 —que alguien de afuera montara el Proyecto siguiendo solo
  `PARA-CHATGPT.md`— nunca se cumplió, y el foco de producto se movió a empresas, donde la gente ya
  trabaja con Claude Code. El cuerpo de este ADR **no se reescribe**: registra lo que se decidió el
  2026-09-10, con la información que había entonces.
