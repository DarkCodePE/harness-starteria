# Portfolio Entry clarification convergence acceptance expectations

**Estado:** EXPECTATIVAS DE ACEPTACIÓN DOCUMENTALES  
**Autoridad:** subordinado a ADR-002 aceptado y a los contratos Portfolio Entry aplicables. No implementa runtime ni crea un evaluador nuevo.

Estas expectativas preservan `questions[]` y mantienen legibles los turnos históricos con más de una pregunta. Para nuevas ejecuciones de Quick Clarification, la invariante user-facing es `questions.length <= 1`.

## Contract expectations

| Expectation | Required behavior |
|---|---|
| `max_questions_per_turn` | `1` |
| `max_quick_questions_total` | `3`, contando preguntas efectivamente presentadas |
| Answer identity | Una respuesta mapea a `0..1` `matchedQuestionIds`; normalmente al ID de la active question |
| Answer vs resolution | `QUESTION ANSWERED != GAP RESOLVED`; `answered_gaps` contiene solo gaps resueltos |
| Previous-question protection | No reaparición por ID, wording, resolve target o equivalencia material determinista razonable |
| Active-question rendering | Solo current/latest active state; nunca fallback histórico |
| Legacy turns | `questions[]` con más de una entrada se lee como evidencia histórica; no se mutan ni se presentan como múltiples active questions nuevas |
| Convergence | Cada respuesta lleva a una pregunta nueva materialmente distinta, checkpoint `exploration_offered` o stop técnico/de seguridad |
| Checkpoint | Puede ocurrir tras 0, 1, 2 o 3 preguntas y conserva las dos acciones contractuales |

## Implementation impact map

| Area | Treatment | Future implementation |
|---|---|---|
| planner prompt | ADAPT | Instruir una sola pregunta de mayor prioridad y prohibir batching/reintento de “No lo sé todavía”. |
| question plan runtime validation | NEW | Normalizar o rechazar más de una pregunta user-facing antes de persistir o consumir budget. |
| question budget | ADAPT | Contar presentaciones reales, máximo 3; candidatos descartados no consumen. |
| SessionContext | ADAPT | Mantener `previous_questions` y `answered_gaps`; transportar evidencia de retiro/resolución si hace falta. |
| previous_questions | ADAPT | Proteger por ID, resolve target y equivalencia material conservadora. |
| answered_gaps | FIX | Unionar solo `respondedResolves` validados; no usarlo como historial de respuestas. |
| persisted turns | ADAPT | Conservar `questions[]`, `matchedQuestionIds`, `respondedResolves` y evidencia de answer/retirement sin mutar legacy. |
| DTO | ADAPT | Exponer latest-turn/active state suficiente para impedir fallback histórico y preservar conversación. |
| frontend active question | FIX | Renderizar solo latest active state y cero preguntas cuando el latest turn no tiene active question. |
| submit message | ADAPT | Enviar la identidad de la active question y los metadatos de resolve disponibles. |
| matchedQuestionIds | FIX | Validar cardinalidad `0..1` y rechazar múltiples matches para una respuesta. |
| respondedResolves | FIX | Derivar únicamente targets soportados; permitir lista vacía para incertidumbre. |
| controller convergence | FIX | Después de cada respuesta, seleccionar nueva pregunta materialmente distinta, checkpoint o stop técnico/de seguridad. |
| tests | NEW / ADAPT | Cubrir cardinalidad, budget, answer identity, unknown answer, gaps, legacy turns y no repetición. |
| E2E | NEW | Verificar secuencia completa, checkpoint antes de la tercera pregunta y ausencia de stale fallback. |

## Final implementation slices

1. Active-question cardinality + budget.
2. Answer matching + `answered_gaps` lifecycle.
3. Frontend active-question rendering / no stale fallback.
4. Semantic repetition safeguards + convergence.
5. Regression / E2E.
