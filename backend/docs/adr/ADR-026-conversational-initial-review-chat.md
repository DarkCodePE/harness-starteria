# ADR-026: Asistente conversacional en la revisión inicial (chat guiado sobre snapshot versionado)

- **Estado**: Propuesto
- **Fecha**: 2026-07-18
- **Trazabilidad**: `docs/PRD-asistente-chat-revision-iniciativa.md` (PRD-IRCHAT-001)
- **Relacionados**: ADR-008 (integración IA), ADR-011 (bridge frontend↔ai-service),
  ADR-013 (webhook push), ADR-025 (initial-review → project reconciliation)

## Contexto

Existen hoy dos implementaciones de la revisión inicial en el frontend:

- `front/src/features/initial-review/` (legacy): tiene un **scaffold conversacional
  completo** (`InitialReviewChatPanel`, `AssistantBubble`, `UserBubble`,
  `MinimalProgress`, preguntas por etapas con `acknowledgement`) pero corre contra
  `mockGenerator` + `localStorage`. No toca la API real.
- `front/src/features/initiative-review/` (vigente, ADR-025): consume la API real
  (`GET/POST /initial-reviews`, `add-context`, `strategic-answers`, `confirm-route`)
  con snapshots versionados (`ReviewSnapshot.version`), pero la UI es un reporte
  estático de cards (`ReviewCards.tsx`) con un textarea de contexto.

El PRD-IRCHAT-001 pide unir ambos mundos: UX conversacional (asistente a la derecha)
sobre el flujo API-backed, con el panel de iniciativa actualizándose en vivo y el
asistente anunciando qué cambió tras cada regeneración.

Decisiones a tomar: (a) ¿el chat es LLM libre o guiado determinista?, (b) ¿dónde vive el
estado de la conversación?, (c) ¿cómo se detecta "qué cambió" entre versiones de
snapshot?, (d) ¿qué se reutiliza del scaffold legacy?

## Decisión

1. **Chat guiado determinista en v1, LLM libre en v2.** El chat v1 es un
   **orquestador de agenda** derivado del snapshot: sus mensajes se generan en el
   frontend a partir del estado del review (preguntas pendientes, información faltante,
   diffs de versión). Cada turno del usuario se mapea a las operaciones REST existentes
   (`add-context`, `strategic-answers`, `confirm-route`). **No se crea ningún endpoint
   de chat nuevo en v1.** Esto elimina latencia/costo LLM por turno y el riesgo de
   truncation ya conocido con OpenRouter, y hace el comportamiento testeable.
2. **Clasificación de intención por UI, no por NLU.** El input del chat lleva un
   selector explícito de modo cuando hay ambigüedad: responder la pregunta activa,
   agregar contexto, o hacer una duda. Default contextual (si hay pregunta activa →
   respuesta). Las dudas (F8) se responden desde un catálogo estático versionado en el
   front (`assistantFaq.ts`). v2 podrá reemplazar esto por un endpoint
   `POST /initial-reviews/:id/chat` con LLM + streaming, sin cambiar el contrato de
   los otros endpoints.
3. **Persistencia de la conversación en backend, event-sourced.** Nueva tabla
   `InitialReviewChatEvent` (`id`, `reviewId`, `role: assistant|user|system`,
   `kind: guide|answer|context|doubt|diff_announcement|confirm`, `payload JSONB`,
   `snapshotVersion`, `createdAt`) con `@@index([reviewId, createdAt])` — **nunca
   `@@unique` sobre tabla existente** (restricción de CD: `prisma db push` sin
   `--accept-data-loss`). El historial se rehidrata en `GET /initial-reviews/:id`
   (campo `chatEvents`) para sobrevivir refresh y cambios de dispositivo. Los mensajes
   del asistente son reconstruibles (son función del estado), pero se persisten para
   auditabilidad y continuidad exacta.
4. **Diff de snapshot por sección, calculado en backend.** Al regenerar snapshot, el
   backend compara la versión n-1 vs n por sección canónica
   (`understandingSummary`, `suggestedChallengeType`, `critique.*`,
   `improvedProposal.*`, `routePreview`) y devuelve
   `changedSections: string[]` en la respuesta de `add-context` /
   `strategic-answers`. El asistente usa esa lista para el anuncio (F5) y el panel
   izquierdo para resaltar. Se calcula en backend porque es quien tiene ambas
   versiones de forma atómica; el front no debe diffear texto.
5. **Reutilizar presentación, no lógica, del scaffold legacy.** Los componentes
   visuales (`AssistantBubble`, `UserBubble`, `MinimalProgress`) se extraen a
   `features/initiative-review/components/chat/`; la lógica de
   preguntas hardcodeadas y `mockGenerator` **no** se migra. La feature
   `features/initial-review/` queda marcada deprecated y se elimina cuando la ruta
   legacy deje de estar montada.
6. **Layout**: asistente a la **derecha** (requerimiento explícito; el mockup lo dibuja
   a la izquierda pero prima el texto del requerimiento), panel snapshot a la
   izquierda, chat como drawer en < 1024px.

## SPARC

### S — Specification

- Entradas: `InitiativeReview` (con `snapshot` versionado, `strategicQuestions`,
  `addedContext[]`, `companyContext`, `chatEvents[]`).
- Invariantes:
  - El snapshot es la única fuente de verdad del contenido; el chat solo referencia
    secciones por id.
  - Toda mutación pasa por los endpoints ADR-025 existentes; el chat no introduce
    rutas de escritura nuevas en v1 (solo la tabla de eventos, escrita por el backend
    como efecto de esas mutaciones y de los turnos de usuario).
  - `changedSections` reportadas == secciones con contenido realmente distinto
    (criterio de aceptación ≥95%, verificado por test).
  - El contexto agregado por chat **no** modifica el contexto de empresa (regla
    vigente del snapshot versionado).
- Estados de la agenda del asistente:
  `opening → questions(i/n) → gaps(faltantes) → ready_to_confirm → confirmed`,
  con transiciones no lineales permitidas (el usuario puede agregar contexto o dudar
  en cualquier estado).

### P — Pseudocode (orquestador del chat, frontend)

```
state = { review, agenda, pendingOp }

deriveAgenda(review):
  missing   = faltantes(review.snapshot.informationReadiness, review.companyContext)
  pendingQs = review.snapshot.strategicQuestions.filter(q => q.status == 'pending')
  return { pendingQs, missing, canConfirm: true }

onUserMessage(text, mode):
  switch mode:
    case 'answer':   next = await saveStrategicAnswers(reviewId, [{id: activeQ, answer: text}])
    case 'context':  next = await addContext(reviewId, text)        // regenera snapshot
    case 'doubt':    pushAssistant(faqAnswer(text)); return
  applyReview(next)
  if next.changedSections.length > 0:
    pushAssistant(diffAnnouncement(next.changedSections, next.snapshot.version))
    highlightPanel(next.changedSections)
  pushAssistant(nextGuideMessage(deriveAgenda(next)))

onConfirm():
  result = await confirmRoute(reviewId)
  navigate(result.overviewUrl)
```

Backend (extensión de `add-context` / `strategic-answers`):

```
regenerated = aiService.regenerateSnapshot(review, newInput)
changed = diffSections(currentSnapshot, regenerated)     // comparación por sección
persist(snapshot=regenerated, chatEvents += [userEvent, diffEvent(changed)])
return { review, changedSections: changed }
```

### A — Architecture

```
front/src/features/initiative-review/
├── pages/InitiativeReviewResultPage.tsx     (split layout: SnapshotPanel | AssistantPanel)
├── components/
│   ├── ReviewCards.tsx                      (existente; + prop highlighted)
│   └── chat/
│       ├── AssistantPanel.tsx               (historial + input + selector de modo)
│       ├── AssistantBubble.tsx / UserBubble.tsx / MinimalProgress.tsx  (extraídos de legacy)
│       └── assistantFaq.ts                  (catálogo de dudas v1)
├── services/
│   ├── initiativeReviewClient.ts            (existente; + changedSections, chatEvents)
│   └── assistantOrchestrator.ts             (deriveAgenda, nextGuideMessage, reducer)

backend/
├── prisma: model InitialReviewChatEvent     (@@index, sin @@unique — regla CD)
├── initial-reviews module:
│   ├── add-context / strategic-answers      (+ diffSections + persistencia de eventos)
│   └── GET /initial-reviews/:id             (+ chatEvents)
```

- Sin cambios en ai-service ni en el contrato del webhook (ADR-013).
- `diffSections` vive junto al dominio del snapshot (backend), puro y unit-testeable.
- Tipado end-to-end: `changedSections: SnapshotSectionId[]` compartido en el envelope.

### R — Refinement (verificación)

- **Unit (front)**: reducer del orquestador — agenda derivada, transición por cada
  modo, anuncio de diff, estado tras refresh (rehidratación desde `chatEvents`).
- **Unit (backend)**: `diffSections` — casos: sin cambios, cambio en una sección,
  cambio de tipo de reto, snapshot regenerado idéntico (lista vacía → el asistente
  dice "revisé pero el análisis se mantiene").
- **Integración**: `add-context` devuelve `changedSections` consistentes y persiste
  eventos en la misma transacción.
- **E2E**: la ruta de smoke de referencia (PDF autofill → Step 0) debe seguir verde;
  se añade un e2e del camino: responder 1 pregunta por chat → agregar contexto →
  ver anuncio de diff → confirmar ruta → Overview.
- Gate del repo: `cd front && npm test` y `npm run docker:up && npm run test:e2e`;
  evidencia registrada en `feature_list.json` según `evaluator-rubric.md`.

### C — Completion (rollout)

1. Migración Prisma aditiva (`InitialReviewChatEvent`) — compatible con `db push`.
2. Backend: diff + eventos detrás de cambios retrocompatibles (campos nuevos en el
   envelope; el front viejo los ignora).
3. Front: split layout tras flag `initiativeReviewChat` (default off) → QA → on.
4. Telemetría nueva activa desde el flag on (PRD §5).
5. Deprecación: `features/initial-review` marcada y removida en una tarea posterior.

## Consecuencias

**Positivas**: comportamiento determinista y testeable; cero latencia LLM por turno de
guía; reutiliza todo el contrato ADR-025; el anuncio de cambios es exacto (diff real);
historial persistente habilita continuidad multi-dispositivo y auditoría.

**Negativas / deuda**: las dudas (F8) tienen cobertura limitada al catálogo hasta v2;
una tabla nueva de eventos que crece por review (mitigación: purga ligada al ciclo de
vida del review); doble mantenimiento temporal mientras el legacy no se elimina.

**Alternativas descartadas**:
- *Chat LLM libre desde v1*: costo/latencia por turno, riesgo de truncation
  (OpenRouter) y de respuestas que contradigan el snapshot; se pospone a v2 sobre un
  endpoint dedicado.
- *Estado del chat solo en frontend (localStorage)*: se pierde en refresh/dispositivo
  y repite el error del scaffold legacy.
- *Diff calculado en el frontend*: requiere retener la versión anterior en cliente y
  duplica lógica; el backend ya tiene ambas versiones de forma atómica.
