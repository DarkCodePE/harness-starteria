# ADR-027: Harness diagnóstico anclado en la metodología frente al orquestador Step 0–4

## Status

Accepted — 2026-07-24

## Date

2026-07-24

## Context

El orquestador (`ai-service/agents/orchestrator.py`) enruta **mecánicamente**: dado un
`(step, action, module)` ya conocido, `tools/context_tools.get_agent_routing_hint(step,
action, module)` devuelve el `agent_id` y el prompt le pide "usa `get_agent_routing_hint`
para confirmar el agente correcto". El orquestador **confía en un step pre-conocido y nunca
diagnostica qué trabajo necesita realmente la solicitud**: no hay grounding de la
información (qué es dato declarado vs. inferido vs. desconocido), no hay estatus epistémico,
no hay gates, no hay confirmación humana, ni clasificación de `challenge_type` / `route` /
`depth` / `horizon`. Si la entrada es ambigua o contradictoria, el modelo **adivina** el
paso y sigue.

El equipo tiene una metodología escrita —`docs/methodology/Starteria_Agent_Methodology_OS_v1.md`
(complementada por `Starteria_Ecosistema_Logico_Metodologico_v1.md`)— que define
explícitamente lo que el enrutamiento mecánico ignora:

- **§27** — el pipeline diagnóstico (intake → grounding → interpretación → confirmación →
  clasificación → hint de método → gate → emisión).
- **§3** — los estados epistémicos (`declared`, `extracted`, `inferred`, `suggested`,
  `unknown`, `conflicting`, `confirmed`, `outdated`) y la **regla de promoción** (solo un
  actor humano autorizado promueve a `confirmed`).
- **§9** — "la IA propone, el humano confirma": ante gaps/contradicciones se devuelve una
  revisión de interpretación, no una respuesta adivinada.
- **§14** — gates (condiciones que bloquean/degradan el enrutamiento).
- **§19** — comportamientos prohibidos (términos como *validada*, *aprobada*, *escalable*
  que la IA no debe emitir).
- **§21 / §26** — los casos dorados (taxonomía + concretos) contra los que se puede medir.

**Framing** (LangChain, *"Agent = Model + Harness"*): un agente competente no es solo un
modelo con un prompt; es un modelo guiado por un **harness** que lo mantiene sobre los
rieles de la metodología. Lo que falta no es un prompt más grande, es el harness.

Fuerzas en tensión:

- **No adivinar sobre entrada ambigua.** El flujo actual enruta aunque falte información
  crítica o haya contradicciones.
- **Gobernanza y auditabilidad.** No existe rastro de *por qué* se eligió un agente, ni
  distinción entre lo confirmado y lo inferido.
- **La metodología ya está escrita**, pero vive en un `.md` que el código no consulta; el
  conocimiento de enrutamiento está hard-codeado en `get_agent_routing_hint`.
- **No romper lo que funciona.** El path actual (deepagents, ADR-008/011/013) está en
  producción y alimenta el e2e de referencia; cualquier harness debe ser **aditivo** y
  medible contra ese baseline.

---

## Decision

Introducir un **harness diagnóstico anclado en la metodología** que corre **antes** del
enrutamiento, empaquetado en `ai-service/harness/`. El harness diagnostica qué trabajo
necesita la solicitud —con estatus epistémico, gates y confirmación— y solo entonces
enruta. Se expone de forma **aditiva**: el path crudo queda intacto como baseline A/B.

*(El razonamiento se estructura con SPARC: Specification → Pseudocode → Architecture →
Refinement → Completion.)*

### S — Specification (qué debe cumplir)

1. **Pipeline diagnóstico de 8 etapas** (§27), como state machine explícita
   (`harness/state_machine.py`, enum `HarnessStage`):

   `INTAKE → GROUND → INTERPRET → CONFIRM → CLASSIFY_ROUTE → METHOD_HINT → GATE → EMIT`

   | Etapa | Módulo que la implementa | Rol |
   | --- | --- | --- |
   | `INTAKE` | `stages/deterministic.py::run_intake` | Normaliza la request al `DiagnosisState`. |
   | `GROUND` | `stages/llm_stages.py::run_ground` | Extrae `GroundedField`s con estatus epistémico; **nunca inventa** (ausente ⇒ `status=unknown`, `value=None`). Corre `detect_conflicts()`. |
   | `INTERPRET` | `stages/llm_stages.py::run_interpret` | Produce el `RouteProfile` multidimensional (`intent`, `unit`, `challenge_type`, `route`, `depth`, `uncertainty`, `horizon`, `step`, `confidence`). |
   | `CONFIRM` | `stages/deterministic.py::run_confirm` | Gate duro §9: si el enrutamiento está bloqueado, construye un `ConfirmationRequest` y **corta hacia EMIT** (única transición no lineal). |
   | `CLASSIFY_ROUTE` | `stages/deterministic.py::run_classify_route` | Mapea `RouteProfile` → agente + method pack vía la **tabla de routing** (§10). |
   | `METHOD_HINT` | `stages/deterministic.py::run_method_hint` | Valida/adjunta el method pack (§11.3); registra evidencia requerida. |
   | `GATE` | `stages/deterministic.py::run_gate` | Veredicto final + escaneo de términos prohibidos (§19). |
   | `EMIT` | `stages/deterministic.py::run_emit` | Ensambla la `HarnessDecision` (`route` / `confirm` / `escalate`) y finaliza el `AuditRecord`. |

2. **"Configuración, no prompts monolíticos".** Todo el conocimiento metodológico vive en
   `harness/config/methodology.yaml`, validado a modelos tipados (`harness/config_models.py`,
   cargado por `harness/config_loader.py` con chequeo de versión contra `config/version.txt`).
   La **`routing_table` del YAML supersede a `get_agent_routing_hint`**. Los system prompts
   por etapa son archivos pequeños (`config/prompts/ground.system.md`,
   `interpret.system.md`) — nunca un mega-prompt.

3. **Gates como predicados nombrados, jamás `eval()`.** La condición de cada gate es un
   predicado del registro fijo `harness/gates.py::PREDICATES` (`any_critical_unknown`,
   `any_conflicting`, `confidence_low`, `field_flag`, `field_status_in`, `unit_status_not`,
   `horizon_is`, …). Un gate que referencie un predicado desconocido levanta
   `UnknownPredicateError` al cargar — la config **no puede inyectar código ejecutable**.

4. **CONFIRM duro = "IA propone, humano confirma" (§9).** Cuando disparan unknowns críticos,
   contradicciones o un objetivo/unidad no confirmados, el harness **devuelve un
   `ConfirmationRequest`** (objetivo entendido, información explícita/inferida/desconocida,
   contradicciones, sugerencias marcadas como propuestas, ≤3 preguntas estratégicas) **en
   lugar de** invocar un step agent. No adivina.

5. **Estatus epistémico rastreado (§3), el primitivo que ECC no tenía.**
   `harness/epistemic.py::EpistemicTracker` mantiene los `GroundedField`s y **hace cumplir la
   regla de promoción**: solo `inferred | suggested | conflicting` pueden promoverse a
   `confirmed`, y solo mediante un **actor humano autorizado** (`promote(key, actor)` levanta
   `PromotionError` si falta el actor o el estatus no es promovible). Esto no se deja a un
   prompt; se enforcea en código.

6. **Severidad de gate categórica, NO aditiva-al-Block** (`harness/gates.py::GateLadder`):
   - Cualquier **hard gate** disparado fuerza al menos `RequireConfirmation`.
   - Un hard gate marcado `severity: block` (línea roja, p.ej. `red_line` sobre el flag
     `sensitive`) escala a `Block` → `escalate`.
   - Los **soft gates** solo acumulan `score` (bandas `review`/`confirm`).

   Así dos señales duras benignas-pero-relacionadas **no** se suman hasta `Block`; el Block
   es categórico (una línea roja), no la suma de puntajes.

7. **Llamadas LLM por etapa reutilizando el patrón `initial_reviewer`**
   (`harness/llm.py`): `ChatOpenAI` apuntado a OpenRouter,
   `.with_structured_output(method="json_schema")`, retry de 2 intentos por truncation,
   `deepseek/deepseek-v4-flash` por defecto (el modelo que `initial_reviewer` midió como
   fiable para `json_schema`; qwen falla). Solo `GROUND` e `INTERPRET` son etapas LLM; las
   otras seis son deterministas y unit-testeables.

8. **Integración aditiva.** `schemas/requests.py::InvokeRequest.mode` es
   `Literal["baseline","harness"]` con default `"baseline"` (el path crudo, sin cambios = el
   baseline A/B). `mode="harness"` corre el harness antes de enrutar; el nuevo
   `POST /ai/diagnose` (`DiagnoseRequest`) expone el diagnóstico **sin** llamar a un step
   agent (no requiere `step` — el punto es que el harness diagnostica qué step/route toca).

### P — Pseudocode (flujo del harness)

```
POST /ai/invoke  { mode: "harness", agentHint?, payload }        # o POST /ai/diagnose
  → OrchestratorAgent.invoke(request):
      if request.mode == "harness":
          return await self.invoke_harnessed(request)             # ADR-027
      return await self._run_deepagent(request)                   # baseline, sin cambios

  invoke_harnessed(request):
      decision = get_harness().diagnose(request_ref, raw_input, project_id)
      # StageDriver.run recorre INTAKE..EMIT; CONFIRM puede cortar a EMIT
      switch decision.kind:
        case "route":                                             # gate permitió enrutar
            routed = request con agentHint = decision.target_agent
            resp = await self._run_deepagent(routed)              # AHORA sí el step agent
            resp.data["_diagnosis"] = decision                    # trace adjunto
            return resp   # agent = f"harness→{decision.target_agent}"
        case "confirm" | "escalate":                              # §9 / línea roja
            return diagnosis_payload                              # NO se invoca step agent
                                                                  # (costo ahorrado)
```

`get_harness()` es un singleton (`harness/harness.py::MethodologyHarness`);
`diagnose()` construye el `DiagnosisState` + `AuditRecord`, y `StageDriver`
(`harness/driver.py`, portado de `ReActAgent.run`) recorre las etapas con un tope de
iteraciones como backstop y registra un `StageTrace` por etapa.

### A — Architecture (dónde vive cada cosa)

- **Paquete nuevo `ai-service/harness/`** (sin dependencias hacia el dominio backend):
  - `contracts.py` — value objects Pydantic v2 (`EpistemicStatus`, `GroundedField`,
    `RouteProfile`, `GateVerdict`, `ConfirmationRequest`, `DiagnosisState`). Vocabulario
    fijo por `Literal`s (`Route`, `ChallengeType`, `Depth`, `Horizon`, …).
  - `trace.py` — `StageTrace`, `AuditRecord` (§20), `HarnessTrace`, `HarnessDecision`,
    `TraceRecorder`. Aislado de `contracts` para mantener el grafo de imports acíclico.
  - `state_machine.py`, `driver.py`, `epistemic.py`, `gates.py`, `prompts.py`, `llm.py`,
    `harness.py`, `config_models.py`, `config_loader.py`.
  - `stages/` — `__init__.py` (registro + `StageContext`), `llm_stages.py`,
    `deterministic.py`.
  - `config/methodology.yaml` (+ `config/version.txt`, `config/prompts/*.system.md`).
  - `eval/` — la suite A/B (ver Effectiveness).
- **Orquestador** (`agents/orchestrator.py`): métodos nuevos `invoke_harnessed` +
  `_run_deepagent`, y la rama `mode` en `invoke`. El path baseline queda idéntico.
- **Router** (`routers/ai.py`): `POST /ai/diagnose` (`response_model=HarnessDecision`),
  protegido por `X-Internal-Token`, corriendo `harness.diagnose` en `run_in_threadpool`.
- **Reuso directo**: el patrón `initial_reviewer` (json_schema + retry), OpenRouter
  (langchain-openai), el `CostTracker` del orquestador (budget/costo pre-flight).

### R — Refinement (aristas y compatibilidad)

- **`get_agent_routing_hint` deprecado para el path harness.** La `routing_table` del YAML
  es autoritativa. Riesgo de config-drift entre ambos ⇒ se resuelve con la YAML como fuente
  única + un test de consistencia + deprecación del hint (el baseline lo sigue usando hasta
  su retiro).
- **El harness cierra su propio texto.** Los gates §19 (términos prohibidos) y la confirmación
  aplican al **texto de enrutamiento/confirmación del harness**; la prosa del `deep_agent`
  downstream sigue gobernada por los guardrails del backend Express (ADR-011/013). El harness
  no reemplaza esos guardrails, los complementa aguas arriba.
- **Modo determinista/hermético.** `diagnose(..., mocks={"ground": fn, "interpret": fn})` y
  `stage_structured_call(..., mock=…)` cortan la red por completo — usado por el eval runner
  y los tests. Sin mock y sin `OPENROUTER_API_KEY`, la llamada levanta un error de
  configuración claro en vez de inventar un diagnóstico.
- **Costo.** El harness agrega **2 llamadas LLM** (GROUND, INTERPRET) antes de enrutar. Se
  mitiga con el pre-flight de costo del `CostTracker` y con el **corte de CONFIRM**: en
  `confirm`/`escalate` **no** se invoca el step agent (se ahorra la llamada cara).

### C — Completion (criterios de aceptación del ADR)

El ADR se considera implementado cuando:

1. `mode="baseline"` (default) enruta exactamente como antes (baseline A/B intacto), y
   `mode="harness"` + `POST /ai/diagnose` producen una `HarnessDecision` con su
   `HarnessTrace`.
2. Una entrada con un unknown crítico o contradicción devuelve `kind="confirm"` con un
   `ConfirmationRequest` y **no** invoca step agent (verificado por test).
3. Un flag de línea roja (`sensitive`) produce `kind="escalate"` (Block categórico).
4. La promoción a `confirmed` sin actor humano levanta `PromotionError`.
5. Un gate con predicado desconocido en la YAML falla al cargar (`UnknownPredicateError`).
6. El scorecard A/B (§21/§26) corre determinista/hermético en CI.

## ECC — provenance (primitivos portados, NO importados)

El harness **porta** (reimplementa), no importa, cinco primitivos probados de ECC
(`/home/orlando/Desktop/ia-master/ECC`):

| Primitivo ECC | Portado a | Qué se reusa |
| --- | --- | --- |
| `ReActAgent.run` (loop) | `harness/driver.py::StageDriver.run` | Recorrido de etapas con tope de iteraciones + trace por etapa. |
| `SessionState` machine | `harness/state_machine.py` | Matriz de transiciones explícita; movimientos ilegales levantan `InvalidTransition`. |
| `compute_risk → SuggestedAction` (ladder) | `harness/gates.py::GateLadder` | Score ponderado → `Allow/Review/RequireConfirmation/Block`. |
| `PromptBuilder` (`src/llm/prompt/builder.py`) | `harness/prompts.py::StagePromptBuilder` | (system, human) por etapa desde config; el texto de usuario se cita como DATA, no como instrucciones. |
| GAN weighted-rubric grader | `harness/eval/graders.py` | Rúbrica ponderada para el scorecard A/B. |

**Decisión explícita de NO depender de ECC `src/llm/`**: ese paquete usa los SDKs de
anthropic/openai directamente y está en estado Alpha; ai-service ya está estandarizado en
`langchain-openai` sobre OpenRouter (el patrón `initial_reviewer`). Depender de `src/llm/`
introduciría un segundo cliente LLM, un segundo proveedor y una dependencia Alpha. Se
portan los **patrones**, no el paquete.

## Effectiveness / criterio de aceptación (eval A/B)

Existe una eval A/B en `harness/eval/` sobre los **casos dorados** de la metodología
(§21 taxonomía + §26 concretos): **baseline = enrutamiento mecánico** (`get_agent_routing_hint`)
**vs. harness**. Se mide sobre:

- **Precisión de enrutamiento** (agente/step correcto por caso).
- **Cumplimiento de gates** (que dispare confirmación/escalación cuando la metodología lo
  exige).
- **Tasa de alucinación** (objetivo **0**: ningún campo inventado; ausente ⇒ `unknown`).
- **Exactitud de clasificación** (`challenge_type` / `route` / `depth` / `horizon`).
- **Calibración de confianza** (que `confidence=low` correlacione con casos que sí requieren
  confirmación).

La suite corre **determinista/hermética en CI** (outputs de etapa desde fixtures embebidos
en el dataset, sin red) y **live opt-in** (llama a OpenRouter). **El scorecard es la puerta
de aceptación**: el harness se acepta solo si supera al baseline en el scorecard.

## Consequences

### Positivas

- **Enrutamiento anclado (grounded).** La ruta se deriva de un `RouteProfile` explícito y de
  hechos con estatus epistémico, no de un step pre-asumido.
- **Gobernanza y trazabilidad (§20).** Cada diagnóstico emite un `AuditRecord` (versiones de
  config/prompt/modelo, campos inferidos vs. confirmados, confianza,
  `requires_human_confirmation`) — la evidencia de "por qué tomó este camino".
- **No adivina sobre entrada ambigua.** CONFIRM devuelve un `ConfirmationRequest` en lugar de
  enrutar a ciegas ("IA propone, humano confirma").
- **Escalación de línea roja.** Los flags `severity: block` producen `escalate` hacia un rol
  autorizado, categóricamente.
- **Medible.** El scorecard A/B convierte "¿mejora?" en un número contra los casos dorados.

### Negativas / costos / riesgos

- **2 llamadas LLM extra** (GROUND, INTERPRET) antes de enrutar — mitigado por el pre-flight
  de costo del `CostTracker` y el corte de CONFIRM (en `confirm`/`escalate` no se invoca step
  agent).
- **Config-drift** entre `methodology.yaml` y el legacy `get_agent_routing_hint` — resuelto
  haciendo la YAML autoritativa + un test de consistencia + deprecando el hint.
- **Alcance de los guardrails.** El harness cierra su propio texto de enrutamiento/confirmación
  (§19); la prosa del `deep_agent` downstream sigue siendo responsabilidad del backend Express
  (ADR-011/013). No es un reemplazo de esos guardrails.
- **Doble mantenimiento temporal.** Mientras baseline y harness coexisten (para el A/B), hay
  dos paths de enrutamiento vivos.

## Alternatives considered

1. **Ampliar el prompt del orquestador con toda la metodología.** Rechazado: un mega-prompt no
   es auditable, no enforcea la regla de promoción epistémica ni los gates en código, y no da
   un trace ni un scorecard. "Configuración, no prompts monolíticos".
2. **Importar ECC `src/llm/` directamente.** Rechazado: segundo cliente LLM + segundo
   proveedor + dependencia Alpha; ai-service ya está en langchain-openai/OpenRouter. Se portan
   los patrones, no el paquete.
3. **Gates como expresiones evaluadas desde la config (`eval()`).** Rechazado: superficie de
   inyección de código. Se usan predicados nombrados de un registro fijo.
4. **Reemplazar el path baseline de una vez.** Rechazado: rompería el e2e de referencia y no
   dejaría baseline contra el cual medir. La integración es aditiva por diseño (`mode` default
   `baseline`).

## Related

- **ADR-002** — tabla de routing (`(step, action) → agent`); el harness **cumple** esa tabla
  desde `methodology.yaml::routing_table` en vez de un mapa hard-codeado.
- **ADR-008** — integración IA (ai-service); el harness vive dentro de ese servicio.
- **ADR-011 / ADR-013** — bridge front↔ai-service y webhook push; los guardrails de prosa
  downstream siguen siendo del backend Express, el harness solo cierra su propio texto.
- **ADR-025 / ADR-026** — revisión inicial guiada; comparte el vocabulario
  `challenge_type` / readiness que el `RouteProfile` reusa.
- `tools/context_tools.get_agent_routing_hint` queda **deprecado para el path harness**
  (superado por `routing_table`); permanece solo para el baseline hasta su retiro.
