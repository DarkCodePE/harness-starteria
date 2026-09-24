# Portfolio Entry — zero-question checkpoint fix v0.1

## Alcance

Slice: Portfolio Entry Quick Clarification. No se modificaron Portfolio Home, Core, Steps, Prisma, Handoff visual ni ADR-002.

## Root cause

El flujo real era:

`analyzeTurn()` → `question_plan` → `applyQuestionBudget()` → `transitionFromStructuredOutput()` → `appendTurn()` → `deriveLifecycleFromRuntimeStatus()` → DTO `nextAction` → `renderMain()`.

El controlador solo convergía cuando el proveedor devolvía `sufficient_context`, cuando había overflow o cuando el plan declaraba `questions_required` sin emisiones. Si el proveedor devolvía `questions=[]`, `status=no_questions_required` y `stop_reason` indefinido, caía en `in_progress`. La sesión persistía como `CLARIFYING`; el frontend no tenía una pregunta en el último turno, pero seguía presentando el composer.

## Estado antes / después

| Punto | Antes | Después |
|---|---|---|
| Tercera respuesta / budget agotado | `quickQuestionsAsked=3`, cero emisiones, `in_progress` posible | cero emisiones → `exploration_offered` |
| Plan vacío sin stop | `in_progress` | `exploration_offered`, razón `no_new_material_question` |
| DTO | podía dejar `submit_message`/`answer_clarification` en estado inconsistente | el último turno sin preguntas no se presenta como respuesta activa |
| UI sin active question | textarea, enviar y “No lo sé todavía” | fallback seguro, sin composer inválido |
| Comprensión | copy operacional genérico | lectura estructurada visible antes de la pregunta |

## Fix de convergencia

En Quick Clarification, cualquier turno con `emitted_questions.length === 0` converge a `exploration_offered`, salvo que posteriormente existiera un stop técnico/safety. Se conserva `sufficient_context_checkpoint` y se añade la razón conservadora `no_new_material_question`; con budget cero se usa `quick_budget_exhausted`.

El checkpoint conserva:

- `Ver mi propuesta de abordaje`
- `Seguir aterrizando mi necesidad`

## Síntesis conversacional

La auditoría encontró análisis estructurado persistido en `latestAnalysis.extracted_context`, pero no una síntesis textual dedicada utilizable directamente antes de Handoff. Se añadió una proyección DTO determinista, sin nueva semántica de modelo ni llamada LLM, a partir de anchors existentes como portfolio size, iniciativas, goal, decision need, problem, metric, constraints o reporting need. Solo se muestra cuando hay al menos dos anchors concretos; mantiene la procedencia `latestAnalysis.extracted_context`.

La UI presenta `Así estoy entendiendo lo que me dices` y después la pregunta activa. No crea `partialSummary()` ni taxonomía frontend.

## Tests

- Controller: plan vacío sin stop → `exploration_offered` / `no_new_material_question`.
- Controller: budget consumido hasta tres y sin cuarta emisión → checkpoint.
- Controller existente: budget agotado no emite cuarta pregunta.
- Frontend: sin active question no renderiza textarea, enviar ni “No lo sé todavía”.
- Frontend: síntesis estructurada y pregunta activa se muestran juntas.
- Router Portfolio Entry: regresión completa focalizada.

## E2E

`front/e2e/portfolio-entry-conversion.spec.ts` ahora verifica durante una pregunta la presencia de comprensión estructurada y, tras la tercera respuesta, la ausencia de active question/composer y la visibilidad del checkpoint. La conversación continúa separada mediante `Ver conversación`.

## Riesgos restantes

- El texto de comprensión depende de que el runtime extraiga al menos dos anchors; si no existen, se omite para no inventar contexto.
- La E2E completa requiere el entorno autorizado de backend/DB y proveedor configurado.
- Este fix no promueve contratos candidate ni modifica autoridad de producto.

## V2_CHANGE_GUARDRAIL_CHECK

```text
Slice: PORTFOLIO_ENTRY clarification convergence
Authority: Portfolio Entry Experience Contract + approved runtime decisions in main
Manifest status: Clarification CANDIDATE / EXPERIMENTAL / TESTING
Current route: Portfolio Entry public session API + front ConversationPanel
Legacy dependencies: existing session repository and DTO contracts
Semantic owner: V2 runtime behavior; reusable persistence infrastructure
V1 assumptions detected: empty question plan could remain in_progress; frontend inferred composer from route state
Adapter required: no
Tests protecting current behavior: session-controller, router, PortfolioEntryExperience, conversion E2E
Tests required for V2: zero-question convergence, active question guard, structured understanding, third-answer checkpoint
Authority conflict: none introduced
Proceed: YES
```

## V2_CHANGE_CLOSURE_CHECK

```text
V2 contract satisfied: yes for this bounded clarification invariant
V2 route active: yes
V1 consumer remaining: none identified in touched surface
Legacy compatibility documented: existing conversation history retained
E2E passed: focal unit/component/typecheck passed; full E2E requires configured environment
Manifest updated: no; status remains candidate/testing
Retirement action: KEEP_COMPAT
Migration status: PARTIAL
```
