# Portfolio Entry AI live audit — 2026-09-16

## Authority and scope

Portfolio Entry only. The approved Experience Contract is `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`; no Core, Project, Step 0, Prisma or AI service behavior was changed. This report describes observed runtime behavior, not product authority.

## Finding

`main` already contained commit `0b749d4`, which copies the prompt manifest into the backend image and logs adapter initialization errors. Without those files, adapter setup fell back to the unconfigured adapter and every analysis failed before a provider call. This is a credible cause of the earlier UI message, but the historical production error was not captured, so attribution remains an inference.

The current backend runs `PORTFOLIO_ENTRY_RUNTIME_MODE=live` by default. `deterministic` is forbidden in production. The live adapter calls `${PORTFOLIO_ENTRY_BASE_URL}/responses` directly from the backend; Portfolio Entry does not call `AI_SERVICE_URL`. Default provider/model are `openai_responses` and `gpt-5.6-luna`. The model is listed in OpenAI's model documentation as Responses API compatible. DeepSeek Responses uses `deepseek-flash` or `deepseek-v4-pro`; selecting DeepSeek while leaving the OpenAI model default would fail, so its model must be configured explicitly.

The local audit environment has a nonempty `PORTFOLIO_ENTRY_API_KEY`, but OpenAI returned `401 invalid_api_key` from `https://api.openai.com/v1/responses`. No key value was printed. The production backend could not be inspected directly because no Kubernetes context is configured here. Its successful live analysis and handoff prove that the deployed provider path is currently functional; they do not reveal which provider, model or secret the deployment uses.

## Production trace

Against `https://starter-ia.com/api/v1/public/portfolio-entry`, using the exact first message `Quiero generar 200 ventas de un nuevo producto hasta diciembre.`:

1. `POST /sessions` returned 201 and an anonymous session.
2. `POST /sessions/:id/messages` returned 200; initial frame `strategy_first`, three clarification questions, lifecycle `CLARIFYING`, revision 1.
3. `GET /sessions/:id` returned revision 1 and `CLARIFYING`, confirming persistence.
4. A follow-up explicitly kept demand and channel unverified. The backend offered guided exploration.
5. Accepting exploration and answering one further question produced `generate_handoff`.
6. `POST /sessions/:id/handoff` returned 200 with a handoff.

No `server_error`, unsupported `portfolio_first`, Project or Step 0 action was observed. The smoke creates an anonymous provisional session, with no canonical conversion request. Classification varied between `strategy_first` and `solution_first` on separate successful runs, both plausible for this input.

## Configuration and diagnostics

Required for live operation in the backend deployment: `PORTFOLIO_ENTRY_API_KEY`. Set it in the `starteria-backend-secrets` Kubernetes Secret used by `k8s/backend-deployment.yaml`, or in the deployment environment consumed by `docker-compose.yml`. Do not commit it. Set `PORTFOLIO_ENTRY_PROVIDER`, `PORTFOLIO_ENTRY_MODEL`, `PORTFOLIO_ENTRY_BASE_URL`, and `PORTFOLIO_ENTRY_TIMEOUT_MS` explicitly when deviating from the defaults. `PORTFOLIO_ENTRY_RUNTIME_MODE=live` is the production mode.

`GET /api/v1/public/portfolio-entry/health` reports only provider configured YES/NO, model, base URL host and live adapter ready YES/NO. Readiness checks configuration and prompt availability; it does not authenticate with the provider. The endpoint is part of this change and requires deployment before it can be queried in production.

Provider HTTP failures now record provider, sanitized endpoint, model, status and safe error type/code. Provider messages and bodies are not persisted in execution metadata. Existing session handling marks the idempotency operation failed without changing the semantic revision or lifecycle; a retry can reuse the idempotency key. Existing router tests assert that a provider failure leaves `ENTRY_CAPTURED` at revision 0.

## Conflict record

CONFLICT
Contract: Portfolio Entry Experience Contract v0.1, provisional AI interpretation and handoff.
Requirement: Live analysis must either return a provisional interpretation or a recoverable error.
Current document/code: `docker-compose.yml` and `backend/.env.example` had no Portfolio Entry deployment variables; the live provider requires an API key.
Observed mismatch: A deployment missing the key initializes an unconfigured adapter and returns 503 for analysis. Production secret contents were not available for direct inspection.
Risk: A healthy API process can still leave Portfolio Entry unusable.
Recommended treatment: Document and pass backend deployment variables; expose safe readiness diagnostics.
Treatment: UPDATE / ADD.
Requires ADR: no.

## Verification

- Backend typecheck passed.
- 26 targeted runtime/router tests passed, including sanitized 401/403/404/429/5xx handling and readiness output.
- Local real provider smoke failed with 401 `invalid_api_key`.
- Production HTTP smoke passed through analysis, persistence, clarification and handoff.
