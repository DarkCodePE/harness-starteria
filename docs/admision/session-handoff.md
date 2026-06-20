# session-handoff.md — Punto de retoma

> **Pregunta única que responde:** Si soy la sesión 2 ahora mismo, ¿dónde retomo y por qué se decidió así?
> **Eje:** frontera actual + por qué (ventana deslizante — se **reescribe** cada sesión).
> **Consumidor:** lo PRIMERO que lee la siguiente sesión — minimiza el Costo de Reconstrucción.

---

## Estado actual (al cierre de la sesión 1 + verificaciones SPARC · 2026-06-19)

Flujo de admisión **documentado y verificado**, y las **3 verificaciones abiertas están RESUELTAS** (SPARC + adversarial, alta confianza). Entregables en `docs/admision/`:
- `flujo-admision.md` — referencia técnica (incluye §6 con verdictos SPARC y **BUG-001**).
- `feature_list.json` — 12 features + `verificationLog` + `knownIssues`.
- `claude-progress.md` — historial (append-only, 2 entradas).
- `clean-state-checklist.md` — compuerta de cierre.

## Lo que ya está resuelto (NO re-investigar)

- **App autenticada:** PDF-autofill y manual requieren proyecto existente; se crea antes en `CreateProjectPage` (`POST /projects`).
- **Público:** empieza con `PublicDraft` (sessionStorage); el proyecto se crea al registrarse (consume-claim).
- `initiativeId === projectId`.
- **Q1:** autofill público = **REAL** (mock solo en flujo de texto/tests).
- **Q2:** `currentStep` = **1** al crear (explícito).
- **Q3:** **no hay mapeo** de estado en el flujo autenticado → **BUG-001**.

## Frontera: dónde retomar

**Opción C (chooser de primer ingreso) ya está implementada y verificada** (4 tests del componente + **212/212** suite front + `vite build` OK) — ver `claude-progress.md` y `feature_list.json: STEP0-START-CHOOSER`. Pendiente solo: **decidir si se commitea** (NO commiteado aún) y, opcional, refinar el "acceso discreto" del uploader para usuarios recurrentes.

**BUG-001 (desajuste de mayúsculas en el polling autenticado) está RESUELTO** (2026-06-19, Opción A: `toWireStatus()` en `pdf.service.ts`; 394/394 backend + 212/212 front). Detalle histórico abajo (se conserva para contexto):

- **BUG-001 — desajuste de mayúsculas en el polling del autofill autenticado** (severidad alta).
  - Síntoma: el polling de `GET /initiatives/:id/pdfs/runs/:runId` nunca detecta `completed` porque el backend devuelve `COMPLETED` (MAYÚSCULA) y el hook compara `'completed'` → timeout aunque la extracción termine.
  - Archivos: `backend/.../pdf.service.ts:84-89,339` (devuelve crudo) vs `front/.../usePdfAutofill.ts:174,178,189`. Referencia de cómo hacerlo bien: `backend/.../public-pdf.service.ts:85-99`.
  - **Fix sugerido (no aplicado):** mapear en el backend autenticado a minúsculas (reutilizar el patrón del público) **o** `.toLowerCase()` en el front; además **alinear** `pdf-autofill-integration.test.tsx` (hoy mockea minúsculas y oculta el bug).
  - **Decisión pendiente del equipo:** ¿se corrige ahora? ¿en backend o front? ¿se abre issue?

## Por qué se decidió así

- Las verificaciones eran de lectura de código; se resolvieron sin tocar la app.
- BUG-001 se documentó pero **no se corrigió**: corregir no estaba pedido y la regla del proyecto es "lo que se pide, nada más". Queda como decisión explícita.

## Costo de reconstrucción si se ignora este archivo

Medio-alto: re-mapear el contrato de estado del autofill (front↔backend↔ai-service) y volver a distinguir el camino público del autenticado. Empezar por `flujo-admision.md` §6 (BUG-001) evita rehacerlo.
