# claude-progress.md — Historial del trabajo (admisión / onboarding)

> **Pregunta única que responde:** ¿Qué pasó, paso a paso, a lo largo de las sesiones?
> **Eje:** proceso / película (narrativa, **append-only** — nunca se reescribe lo anterior, solo se agrega abajo).
> **Consumidor:** auditoría; cuando el agente necesita el historial profundo de cómo se llegó al estado actual.
>
> Formato por entrada: fecha · objetivo · qué se hizo · evidencia/archivos · resultado · decisiones.

---

## Sesión 1 — 2026-06-19

**Objetivo:** Entender el flujo de admisión (Paso 0 "Base estratégica inicial"): resolver si el flujo de *PDF + autofill por agente* y el de *rellenado manual* requieren un proyecto creado; luego **documentar el flujo** y montar el kit de continuidad.

**Qué se hizo:**
1. Pregunta de arranque del equipo: *"¿ambos procesos (PDF-autofill y manual) requieren crear un proyecto?"*.
2. Investigación con workflow de 5 agentes (4 exploradores en paralelo + síntesis) sobre 4 ejes: creación de proyecto, autofill autenticado, rellenado manual, variante pública/draft.
3. Verificación directa de detalles: `step0Config.ts` (modos y campos requeridos), `pdfAutofillService.ts` / `usePdfAutofill.ts` (ciclo de vida y estados del autofill) y `front/prisma/schema.prisma` (enums/máquinas de estado).
4. Redacción de la documentación del flujo y creación del kit de tracking en `docs/admision/`.

**Hallazgos (verificados en código):**
- **App autenticada:** AMBOS métodos operan sobre un **proyecto ya existente**. El proyecto se crea antes en `CreateProjectPage` → `POST /projects`. Autofill exige `initiativeId`; manual exige `projectId`; el backend lanza `PROJECT_NOT_FOUND` si no existe.
- **`initiativeId === projectId`** — solo cambia el nombre de la ruta (`/initiatives/:id` vs `/projects/:id`).
- **Flujo público (`/public`):** NO crea proyecto al inicio; usa un `PublicDraft` en `sessionStorage`. El proyecto se crea al registrarse (consume-claim → `createProject` + `updateStep0`).
- Autofill autenticado: extracción real DeepSeek (~5min), propuestas por campo con procedencia y banda de confianza; el usuario confirma/edita cada campo.

**Archivos creados:**
- `docs/admision/flujo-admision.md` — documentación del flujo.
- `docs/admision/feature_list.json` — estado por feature.
- `docs/admision/claude-progress.md` — este historial.
- `docs/admision/session-handoff.md` — frontera para la siguiente sesión.
- `docs/admision/clean-state-checklist.md` — compuerta de cierre.

**Resultado:** Pregunta respondida + flujo documentado + kit de continuidad inicializado. Sin cambios en código de la app.

**Decisiones:**
- Ubicación `docs/admision/` (la regla del proyecto prohíbe el root y manda docs a `/docs`).
- Documentación en español (consistente con la UX y el equipo); nombres de archivos del kit en el formato pedido (`feature_list.json`, etc.).
- 3 supuestos quedaron **sin verificar en runtime** (ver `feature_list.json` y §6 de `flujo-admision.md`): autofill público mock, default de `currentStep`, mapeo `ExtractionRunStatus` front↔backend.

---

## Sesión 1 (cont.) — 2026-06-19 · Verificaciones con SPARC (S/P/A/R/C)

**Objetivo:** resolver las 3 verificaciones que quedaron abiertas, usando SPARC.

**Método (mapeo de fases):**
- **S — Specification:** se definió, por verificación, la pregunta exacta + criterio de aceptación binario.
- **P — Pseudocode / A — Architecture:** un agente por verificación leyó front+backend y mapeó la cadena de llamadas real (con archivo:línea).
- **R — Refinement:** pase **adversarial** por veredicto (segundo agente intentando refutar). Las 3 se sostuvieron (refuted=false), alta confianza.
- **C — Completion:** actualización de `flujo-admision.md` (§6 + nota en §3.3 + intro), `feature_list.json` (verificationLog + knownIssues + features), este historial, `session-handoff.md` y `clean-state-checklist.md`.

**Veredictos:**
1. **Autofill público = REAL** (no mock). `public-pdf.router.ts:108-115` arma un `AiServiceClient` real → `fetch` a `${AI_SERVICE_URL}/api/v1/ai/pdf-extract` (`ai-client.ts:78-102`). El mock (`generateMockPublicDraftOutput`) es solo del flujo de **texto** y de tests. → corrige el `implemented-with-mock` previo a `implemented`.
2. **`currentStep` = 1 al crear** (no 0). Asignación explícita `project.service.ts:88`, sobreescribe `@default(0)`. Iniciales: `DRAFT` / `1` / `NOT_STARTED`.
3. **`ExtractionRunStatus`: sin mapeo en el flujo autenticado → BUG-001.** Backend devuelve MAYÚSCULAS (`pdf.service.ts:89,339`), el hook compara minúsculas (`usePdfAutofill.ts:174,178`) → la rama de finalización nunca se cumple, polling hasta timeout. El flujo público no sufre esto (`public-pdf.service.ts:85-99` mapea a minúsculas).

**Resultado:** 3/3 verificaciones resueltas (alta confianza). Se **descubrió BUG-001** (severidad alta) en el autofill autenticado. **No se corrigió código** (fuera del alcance de "verificar"; pendiente de decisión del equipo). Sin cambios en la app; solo documentación.

**Decisiones:**
- Documentar BUG-001 como `knownIssue` y marcar `PDF-AUTOFILL-AUTH` como `implemented-with-bug`, en vez de silenciarlo.
- No aplicar el fix sin pedido explícito (regla del proyecto: "nada más, nada menos").

---

## Sesión 1 (cont.) — 2026-06-19 · Opción C (chooser de primer ingreso) con SPARC

**Objetivo:** implementar la Opción C de UX — en el primer ingreso a la iniciativa, ofrecer la elección "subir documento vs empezar en blanco" en vez de mostrar el uploader de PDF siempre arriba.

**SPARC:**
- **S — Specification:** en primer ingreso (`step0Status='No iniciado'` && `overallProgress===0`, no-sponsor) mostrar un chooser con 2 opciones; "manual"→Paso 0, "documento"→uploader; opción IA solo si `autofillEnabled`; recurrentes conservan acceso; sin romper build ni tests.
- **P — Pseudocode:** estado `startMode∈{choose,upload}`; `isFirstRun`; render: si first-run && choose → chooser; uploader si `autofillEnabled && (!isFirstRun || startMode==='upload')`; back-button cuando first-run && upload.
- **A — Architecture:** componente nuevo `InitiativeStartChooser` (puro/prop-driven) en `components/`; gating en `ProjectHomePage`; reutiliza `openStep0()` y el bloque `PdfInitiativeUploader` existentes. Hooks declarados antes del early-return de sponsor (rules-of-hooks).
- **R — Refinement:** test unitario London (4 casos, mocks vi.fn). Resultado: **4/4** + **212/212** suite front + `vite build` OK. Incidental: se **dedupló** el import duplicado de `lucide-react` (`ProjectHomePage.tsx:16`, `Sparkles`/`CheckCircle2` ya venían arriba) — `tsc` lo marcaba aunque esbuild lo toleraba.
- **C — Completion:** docs actualizados (este log, `feature_list.json` STEP0-START-CHOOSER, `flujo-admision.md §3.2`, handoff, checklist).

**Archivos:** + `front/src/app/components/InitiativeStartChooser.tsx`, + `…/__tests__/InitiativeStartChooser.test.tsx`, ~ `front/src/app/pages/ProjectHomePage.tsx`.

**Resultado:** Opción C funcional y verificada. Sin commit (a la espera de decisión). BUG-001 sigue abierto (no tocado en esta sesión).

**Decisiones:**
- Para usuarios recurrentes se mantuvo el banner del uploader como estaba (cambio mínimo); el "acceso discreto" más refinado queda como mejora opcional futura.
- Se arregló el import duplicado por estar en el archivo editado y ser corrección trivial; se documenta por transparencia.

---

## Sesión 1 (cont.) — 2026-06-19 · Fix BUG-001 (estado del autofill) con SPARC

**Objetivo:** corregir BUG-001 (el polling del autofill autenticado no detectaba el fin por desajuste mayúsculas/minúsculas) y meterlo en la PR.

**SPARC:**
- **S — Specification:** el wire de `GET /initiatives/:id/pdfs/runs/:runId` debe devolver el estado en minúsculas que el front compara (`completed|running|queued|failed`); el enum de BD se mantiene en MAYÚSCULAS; `COST_CAPPED`→`failed`; no romper otros consumidores; pinear con test.
- **P — Pseudocode:** `toWireStatus(dbEnum) → wire`; usarlo en `toRunDTO`; tipo del DTO → `ExtractionRunWireStatus`.
- **A — Architecture:** un único chokepoint = `toRunDTO` (lo usan getRun, startExtraction y el webhook reply). Front sin cambios (ya esperaba minúsculas). Se exporta `toWireStatus` para testearlo directo.
- **R — Refinement:** + `run-status-wire-mapping.test.ts` (6). Las aserciones "wishful" en MAYÚSCULAS de `integration-regression.test.ts` (6) y `pdf.service.test.ts` (1) — que ocultaban el bug — se corrigieron a minúsculas (las aserciones sobre `updateArgs.data.status`, que son la fila de BD, se mantienen en MAYÚSCULAS). Resultado: **394/394 backend + 212/212 front + vite build OK**. `tsc` backend tiene 175 errores PRE-EXISTENTES (typing global de `AuthenticatedRequest`); mis archivos (`pdf.service.ts`, `pdf.types.ts`) suman **0** errores.
- **C — Completion:** docs actualizados (BUG-001 → RESUELTO) + commit/PR.

**Archivos:** ~ `backend/modules/initiative-pdfs/pdf.types.ts`, ~ `pdf.service.ts`, ~ `__tests__/integration-regression.test.ts`, ~ `__tests__/pdf.service.test.ts`, + `__tests__/run-status-wire-mapping.test.ts`.

**Decisiones:**
- Fix en el **backend** (Opción A): un solo contrato de wire para ambos flujos (público y autenticado), en vez de parchar el front.
- `COST_CAPPED`→`failed` en el wire (el front no tiene estado de cost-cap). Mejora futura: mensaje específico + alinear `errorMessage`/`errorReason`.
- No se tocó el baseline de 175 errores tsc (fuera de alcance).

<!-- Próximas sesiones: AGREGAR debajo, no editar lo anterior. -->
