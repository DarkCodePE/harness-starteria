> HISTORICAL: ver ../../CURRENT_STATE.md. Documento legacy de admision; reemplazo vigente: ../../CURRENT_STATE.md y ../STARTERIA_AUTHORITY.md.

# clean-state-checklist.md — Compuerta de cierre

> **Pregunta única que responde:** ¿El repo está realmente listo para entregar, sin deuda oculta?
> **Eje:** compuerta de cierre (verificación con `[x]`).
> **Consumidor:** antes de "fichar la salida" de cada sesión.
>
> Marca `[x]` solo lo verificado de verdad. Lo que quede en `[ ]` es deuda explícita que pasa a `session-handoff.md`.

---

## Documentación

- [x] El flujo está documentado (`flujo-admision.md`) con entidades, máquinas de estado y ambos contextos.
- [x] Cada feature tiene estado en `feature_list.json`.
- [x] El historial de la sesión está en `claude-progress.md` (append-only, 2 entradas).
- [x] `session-handoff.md` describe la frontera y el punto de retoma.
- [x] Las afirmaciones del doc citan archivo (y línea cuando aplica) o endpoint.

## Exactitud / verificación

- [x] Hallazgos de la app autenticada verificados en código (servicios + controladores).
- [x] Enums/estados tomados de `front/prisma/schema.prisma` (no inventados).
- [x] **Q1 — Autofill público:** RESUELTO con SPARC → es **real** (mock solo en flujo de texto/tests).
- [x] **Q2 — `currentStep`:** RESUELTO con SPARC → **1** explícito (sobreescribe `@default(0)`).
- [x] **Q3 — `ExtractionRunStatus`:** RESUELTO con SPARC → **no hay mapeo** en el flujo autenticado (= BUG-001).
- [x] Veredictos pasados por verificación adversarial (refinement); ninguno refutado.

## Bugs / deuda técnica

- [x] **BUG-001 documentado** (`feature_list.json:knownIssues` + `flujo-admision.md §6`) con evidencia.
- [x] **BUG-001 corregido en código** (Opción A: `toWireStatus()` en `pdf.service.ts`, 2026-06-19).
- [x] Tests del contrato corregidos/añadidos: `+ run-status-wire-mapping.test.ts` (6) + aserciones "wishful" corregidas en `integration-regression`/`pdf.service.test`. **394/394 backend + 212/212 front**.

## Higiene del repo

- [x] Sin archivos nuevos en el root (todo bajo `docs/admision/`).
- [x] Sin cambios en código de la app (solo documentación).
- [x] Sin secretos, credenciales ni `.env` añadidos.
- [x] `feature_list.json` es JSON válido.
- [ ] Documentación revisada/aprobada por el equipo. *(requiere revisión humana)*
- [ ] Cambios commiteados (si el equipo lo decide — no se commitea sin pedido explícito).

## Opción C — chooser de primer ingreso

- [x] Componente `InitiativeStartChooser` implementado (puro/prop-driven, tipado).
- [x] Gating en `ProjectHomePage` (first-run → chooser; recurrentes → uploader).
- [x] Test unitario (4 casos) + suite front completa **212/212** + `vite build` OK.
- [x] Import duplicado de lucide-react en `ProjectHomePage.tsx:16` deduplicado.
- [ ] Commiteado. *(no — a la espera de decisión del equipo.)*
- [ ] Refinar "acceso discreto" del uploader para usuarios recurrentes. *(mejora opcional.)*

## Veredicto de salida

> **Estado: DOCUMENTACIÓN + VERIFICACIONES + OPCIÓN C LISTAS.** Las 3 verificaciones resueltas; la Opción C implementada y verificada (212/212 tests + build). **Deuda abierta y explícita:** (1) BUG-001 (autofill autenticado) documentado pero **no corregido**; (2) cambios **no commiteados** (Opción C). No hay deuda oculta.
> HISTORICAL: ver `../../CURRENT_STATE.md`. Documento legacy de admision; reemplazo vigente: `../../CURRENT_STATE.md` y `../STARTERIA_AUTHORITY.md`.
