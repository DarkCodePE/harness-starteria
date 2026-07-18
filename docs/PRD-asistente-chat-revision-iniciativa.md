---
id: PRD-IRCHAT-001
title: Asistente conversacional en la revisión inicial de iniciativa
status: draft
date: 2026-07-18
parent_artifacts:
  - "docs/PRD — Revisión inicial guiada de iniciativa + Overview post-confirmación (2).md"
  - "backend/docs/adr/ADR-025-initial-review-to-project-reconciliation.md"
child_artifacts:
  - "backend/docs/adr/ADR-026-conversational-initial-review-chat.md"
owner: Producto Starteria
---

# PRD — Asistente conversacional en "Revisemos tu iniciativa antes de empezar"

## 1. Problema

Hoy la pantalla de resultado de la revisión inicial (`InitiativeReviewResultPage`) es un
**reporte estático de una sola columna**: "Lo que Starteria entendió", tipo de reto, mirada
crítica, preguntas estratégicas, versión mejorada, ruta Step 0-4 y el bloque "Cómo influyó
el contexto de tu empresa".

Consecuencias observadas:

1. El usuario no sabe **qué información falta ni por qué importa**. El bloque "Agregar
   contexto antes de confirmar" es un textarea pasivo al final de la página.
2. Las preguntas estratégicas se sienten como formulario, no como conversación — contradice
   el principio UX del PRD padre ("Conversacional, no un formulario pesado").
3. Cuando el usuario agrega contexto y el snapshot se regenera, **nada le comunica qué
   cambió**: la página se re-renderiza sin señal de qué secciones se actualizaron ni por qué.
4. Las dudas del usuario ("¿qué significa tipo de reto Corrección?", "¿por qué recomiendan
   reducir el piloto?") no tienen dónde resolverse sin salir del flujo.

## 2. Objetivo

Convertir la revisión inicial en una **experiencia guiada de dos paneles**:

- **Panel izquierdo — la iniciativa viva**: las cards del snapshot actual (versionado),
  que se actualizan en caliente cuando el snapshot se regenera, resaltando qué cambió.
- **Panel derecho — el asistente**: un chat que guía a la persona a completar su
  iniciativa, hace las preguntas estratégicas una por una, recibe contexto adicional,
  anuncia explícitamente qué secciones del panel izquierdo cambiaron tras cada
  regeneración, y resuelve dudas sobre el análisis.

> Nota de layout: el mockup de referencia dibuja el chat a la izquierda, pero el
> requerimiento explícito del usuario es **asistente a la derecha** ("asistente debe estar
> a la derecha para poder asistir sobre dudas"). Se implementa asistente a la derecha;
> en viewport < 1024px el chat colapsa a un drawer/bottom-sheet.

## 3. Alcance (v1)

### Incluye

- **F1 — Layout dividido**: snapshot a la izquierda, chat a la derecha, en
  `InitiativeReviewResultPage`. Header y CTA de confirmación persistentes.
- **F2 — Mensaje de apertura del asistente**: resume lo que Starteria entendió (1-2
  frases, no duplica la card), lista la **información faltante** detectada
  (`informationReadiness` + faltantes del snapshot: aprobaciones internas, recursos
  disponibles, criterios de escalamiento) y propone el primer paso de la agenda.
- **F3 — Preguntas estratégicas conversacionales**: el asistente presenta las
  `strategicQuestions` de una en una dentro del chat; cada respuesta llama a
  `saveStrategicAnswers` (soporta "No lo sé aún" cuando `allowsUnknown`). Las cards de
  preguntas del panel izquierdo reflejan el estado (pendiente/respondida).
- **F4 — Contexto adicional por chat**: cualquier mensaje libre del usuario que aporte
  información (restricciones, recursos, alcance, señales esperadas) se envía como
  `addContext` → el backend regenera el snapshot (nueva `version`).
- **F5 — Anuncio de cambios**: tras cada regeneración, el asistente publica en el chat un
  mensaje del tipo *"Con lo que me contaste actualicé: Mirada crítica y Versión mejorada.
  El tipo de reto se mantiene en Corrección."* El panel izquierdo hace scroll/resalta las
  secciones cambiadas (diff por sección entre versión n y n+1).
- **F6 — Puente a contexto de empresa**: el asistente comunica lo que hoy dice el bloque
  estático ("la información agregada aquí no actualiza el contexto de empresa") y ofrece
  las dos salidas existentes: *Agregar solo a este análisis* (chat, F4) o
  *Completar contexto de empresa* (link a `/companies`).
- **F7 — Confirmación de ruta desde el chat**: cuando la agenda está completa (o el
  usuario lo decide), el asistente ofrece confirmar la ruta Step 0-4 → `confirmRoute` →
  navegación al Overview (flujo ADR-025 sin cambios).
- **F8 — Dudas sobre el análisis**: preguntas del usuario que no aportan contexto
  ("¿qué significa growth?") se responden con contenido explicativo. v1: respuestas
  deterministas desde un catálogo (tipos de reto, secciones, ruta de steps) + fallback
  "agrega esto como contexto o márcalo como duda"; la respuesta LLM libre queda para v2
  (ver ADR-026).

### No incluye (v1)

- Chat LLM de propósito general con streaming (v2; requiere endpoint nuevo — ADR-026).
- Actualización automática del contexto de empresa desde el chat (regla vigente: snapshot
  versionado, contexto de empresa solo se edita en `/companies`).
- Cambios al pipeline de IA de regeneración de snapshot ni al modelo de datos de ADR-025.
- Edición inline de las cards del panel izquierdo (se mantiene el botón "editar" actual).

## 4. Comportamiento clave (historia de referencia)

1. Usuario llega al resultado. Chat (derecha) abre: *"Revisé tu propuesta RIHU. La entendí
   como un reto de Crecimiento. Antes de confirmar la ruta me falta saber: disponibilidad
   de tu equipo, política de uso de LLMs y recursos aprobados. ¿Empezamos con la primera
   pregunta?"*
2. Usuario responde la pregunta 1 en el chat → se persiste como respuesta estratégica →
   card de preguntas marca 1/3.
3. Usuario escribe: *"Ah, ya validé con el CTO: podemos usar un LLM on-premise y tenemos
   2 devs por 6 semanas."* → `addContext` → snapshot v3.
4. Asistente: *"Con esa validación actualicé **Mirada crítica** (el riesgo regulatorio
   baja) y **Versión mejorada** (piloto con 2 devs / 6 semanas). Revisa el panel — resalté
   lo que cambió."* Panel izquierdo resalta ambas secciones y muestra `v3`.
5. Asistente: *"Sigue faltando: criterios de escalamiento. ¿Los agregamos, o confirmamos
   la ruta y lo resolvemos en el Step 0?"*
6. Usuario confirma → iniciativa Draft creada → Overview.

## 5. Métricas de éxito (bandas probabilísticas)

| Métrica | Baseline (hoy) | Banda objetivo v1 |
|---|---|---|
| Reviews con ≥1 contexto agregado antes de confirmar | por medir (instrumentado) | 40-60% |
| Preguntas estratégicas respondidas por review | por medir | ≥2 de 3 en 50-70% de reviews |
| Tasa de confirmación de ruta (resultado → confirm) | por medir | +10-20% relativo |
| Anuncio de cambios correcto (secciones anunciadas = secciones con diff real) | n/a | ≥95% (test automatizado) |
| Errores de regeneración visibles al usuario sin salida | n/a | 0 (siempre hay retry en chat) |

Telemetría: extender `initialReviewTelemetry` con `chat_message_sent`,
`chat_context_added`, `chat_question_answered`, `snapshot_diff_announced`,
`chat_confirm_route`.

## 6. Criterios de aceptación

1. Con un review API-backed real (sin mocks), el chat guía las 3 preguntas estratégicas y
   persiste respuestas vía `POST /initial-reviews/:id/strategic-answers`.
2. Un mensaje de contexto libre dispara `POST /initial-reviews/:id/add-context`, el panel
   izquierdo muestra la nueva versión del snapshot y el chat anuncia las secciones cuyo
   contenido cambió (diff real, no hardcodeado).
3. El estado del chat sobrevive un refresh de página (recargable desde backend/estado
   persistido — ver ADR-026; no se pierde la agenda ni las respuestas ya dadas).
4. La ruta de smoke de referencia (`reference_smoke_path`: PDF autofill → Step 0) sigue
   verde: `cd front && npm test` y `npm run test:e2e`.
5. En viewport móvil el chat es accesible (drawer) y el confirm sigue alcanzable.
6. Copys en español conforme a `docs/starteria-ux-writing.md`.

## 7. Riesgos

- **Doble fuente de verdad chat vs. cards**: mitigado — el chat nunca almacena contenido
  del snapshot; solo referencia secciones por id y la card es la única fuente.
- **Regeneración lenta** (pipeline IA): el chat muestra estado "Starteria está
  actualizando tu iniciativa…" con el mismo patrón de espera del flujo actual; timeout
  → mensaje con retry (ver memoria del proyecto: truncation/latencia de OpenRouter).
- **Confusión contexto-de-análisis vs contexto-de-empresa**: F6 hace explícita la
  distinción en el primer mensaje donde aplique.
