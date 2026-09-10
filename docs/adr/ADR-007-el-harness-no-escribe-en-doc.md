---
id: ADR-007
title: "El harness no escribe en `doc/`, y ningún comando promueve un ADR a `aceptado`"
status: proposed
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "si los casos redactados se acumulan sin integrarse, la fricción de integrar a mano se volvió el cuello de botella"
tags: [harness, autoridad, frontera]
---

# ADR-007: El harness no escribe en `doc/`, y ningún comando promueve un ADR a `aceptado`

## 1. Contexto y problema

Varios comandos producen cosas que naturalmente irían a parar a un contrato: `/starteria-caso`
redacta un caso que pertenece al AI Harness, `/starteria-decision` escribe un ADR que después
modifica el Core, `/starteria-autoridad` detecta contradicciones que alguien va a tener que
resolver editando un documento.

Lo cómodo sería que el comando lo escriba directo. Es un archivo, está ahí.

El problema es que **cada archivo de `doc/` tiene autoridad**, y editarlos es cambiar el producto.
El Core Contract lo dice en INV-03: la IA extrae, organiza, infiere, compara, sugiere y recomienda,
y no aprueba frentes, no aprueba retos, no decide inversión de portafolio ni ejecuta decisiones de
sponsor. Un harness que edita el contrato que lo gobierna se dio autoridad a sí mismo.

## 2. Decisión

**Ningún comando escribe en `doc/`.** Producen texto y lo entregan; integrarlo es de una persona.

**Y ningún comando pone un ADR en `aceptado`.** `/starteria-decision` redacta en `propuesto`. Puede
transcribir una aprobación que una persona dio en esa misma conversación, con nombre y fecha, y no
puede producir una que nadie dio. Un ADR con preguntas abiertas adentro no puede estar en
`aceptado` ni aunque alguien lo pida: una firma sobre un hueco es peor que un hueco.

Los ADR de este repo llegan en `proposed` por la misma razón. Este incluido.

**Lo único que el harness escribe** es `estado/BITACORA.md`, que es suyo y no tiene autoridad sobre
nada.

## 3. Alternativas consideradas

- **Dejar que los comandos editen `doc/` directamente:** rechazada. Contradice INV-03 y borra el
  rastro de quién decidió qué.
- **Escribir en una carpeta de propuestas, tipo `doc/pendientes/`, para que alguien mueva después:**
  rechazada por ahora. Suena inofensiva y crea un segundo lugar con casos y contratos a medio
  aprobar; en la práctica alguien termina leyendo el pendiente como si fuera el contrato.
- **Permitir `aceptado` cuando la persona lo pide explícitamente en el chat:** adoptada
  parcialmente, y con el límite claro. Se puede transcribir una aprobación dada; no se puede
  producir una. La diferencia es fina y es toda la decisión.

## 4. Consecuencias

**Positivas**
- La frontera de autoridad queda donde el Core Contract la puso, y el harness se la aplica a sí
  mismo.
- `doc/` sigue siendo editable solo por personas, así que su historial dice quién cambió qué.
- Un caso o un ADR mal redactado no contamina el contrato: se queda afuera hasta que alguien lo mire.

**Negativas y trade-offs aceptados**
- **Fricción real.** Un caso nuevo de Round 3 queda en el chat hasta que alguien lo copie al AI
  Harness. Si esa persona no aparece, el caso se pierde igual que si no se hubiera escrito.
- No hay lista de lo pendiente de integrar. La bitácora es el único lugar donde puede quedar
  anotado, y se llena a mano.

## 5. Criterios de aceptación de la decisión

- [x] Ningún `SKILL.md` instruye escribir en `doc/`.
- [x] `/starteria-caso` dice explícitamente que no integra el caso.
- [x] `/starteria-decision` dice que no puede promover a `aceptado`.
- [x] Los 7 ADR de este repo están en `proposed` con `aprobado_por: null`.

## 6. Gatillos de revisión

Si los casos redactados se acumulan sin integrarse, la fricción se volvió el cuello de botella y hay
que discutir un lugar de tránsito, sabiendo por qué se descartó hoy.

## Historial

- 2026-09-10 · proposed · INV-03 aplicado a la herramienta que gobierna INV-03.
