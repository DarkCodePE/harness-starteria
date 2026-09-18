# STARTERIA — V2 Migration Guardrails

**Documento:** `STARTERIA_V2_MIGRATION_GUARDRAILS.md`  
**Versión:** v0.1  
**Estado:** Guardrail obligatorio para toda implementación V2  
**Fecha:** 2026-09-18  
**Aplicación:** Codex, Claude, desarrolladores, QA y cualquier agente que modifique Starteria  
**Repo objetivo:** `DarkCodePE/harness-starteria`

---

# 1. Propósito

Evitar que la migración Starteria V1 → V2:

- conserve silenciosamente semántica V1;
- reintroduzca comportamiento Initiative-first donde V2 requiere Portfolio Lead;
- trate compatibilidad como autoridad;
- use UI V2 sobre flujos V1 sin cambiar la lógica subyacente;
- mantenga redirects, estados, modelos o servicios legacy como comportamiento principal;
- considere “implementado” algo que solo fue migrado visualmente;
- use documentos históricos o superseded para definir comportamiento nuevo.

Regla central:

> **Preservar infraestructura útil no significa preservar semántica V1.**

---

# 2. Aplicación obligatoria

Este documento debe leerse ANTES de cualquier cambio que afecte:

- Landing;
- Portfolio Entry;
- Handoff;
- Registro / Continuation;
- Portfolio Bootstrap;
- Portfolio Home;
- Strategic Front;
- Challenge;
- Activation / Invitation;
- Initiative Overview;
- Step 0–4;
- Design System;
- Copilot;
- AI runtime;
- persistence;
- routes;
- permissions;
- APIs;
- data models;
- tests;
- migrations;
- cleanup legacy.

No existe excepción por tamaño del cambio.

---

# 3. Mandatory reading order

Antes de modificar producto:

1. `CURRENT_STATE.md`
2. `STARTERIA_V2_MANIFEST.md`
3. `docs/STARTERIA_AUTHORITY.md`
4. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
5. ADRs aprobados relevantes
6. Experience Contract del slice
7. Agent Contract / Skill Contracts aplicables
8. Tech Spec aplicable
9. Design System V2 Baseline si afecta frontend
10. este documento
11. implementación actual
12. tests actuales

Regla:

> Código existente, PRD antiguo, prompt, mockup o test legacy nunca puede reemplazar una autoridad superior.

---

# 4. V2-only development policy

Todo comportamiento nuevo debe cumplir:

```text
V2 authority exists
+
slice exists in STARTERIA_V2_MANIFEST
+
implementation target is explicit
+
tests protect V2 semantics
```

Si no existe autoridad V2 suficiente:

```text
STOP
→ classify as authority gap
→ do not invent behavior from V1
```

---

# 5. Legacy classification

Cada componente, route, service, schema, model o test legacy que se toque debe clasificarse:

```text
SEMANTIC_OWNER:
V2
LEGACY_COMPAT
UNKNOWN
```

Y:

```text
MAY_DEFINE_NEW_BEHAVIOR:
YES
NO
```

Reglas:

## V2

Puede definir comportamiento solo si está respaldado por autoridad activa.

## LEGACY_COMPAT

Puede mantenerse temporalmente para:

- compatibilidad;
- migración;
- adapters;
- lectura de datos existentes;
- soporte de rutas antiguas.

No puede definir comportamiento nuevo.

## UNKNOWN

Bloquea cambios funcionales hasta auditar.

---

# 6. Four mandatory migration gates

## Gate 1 — Contract Gate

Antes de implementar:

```text
¿Qué autoridad V2 gobierna este comportamiento?
```

Debe responderse con path concreto.

FAIL si:

- solo existe PRD legacy;
- solo existe comportamiento actual;
- solo existe mockup;
- solo existe un prompt;
- solo existe intuición de diseño.

---

## Gate 2 — Dependency Gate

Antes de reutilizar legacy:

```text
¿Qué supuestos V1 arrastra?
```

Revisar:

- redirects;
- ownership;
- role assumptions;
- state transitions;
- canonicalization;
- Step activation;
- persistence;
- object creation;
- permissions;
- event semantics;
- tests.

No reutilizar “porque funciona”.

---

## Gate 3 — E2E Gate

Después de implementar:

```text
¿El journey completo sigue respondiendo a V2?
```

No basta con que la pantalla sea correcta.

Ejemplo de FAIL:

```text
Landing V2
→ Portfolio Entry V2
→ Handoff V2
→ legacy handler
→ create Project
→ Step 0
```

aunque visualmente todo parezca V2.

---

## Gate 4 — Retirement Gate

Cuando un slice V2 reemplaza una superficie:

```text
¿qué consumidor V1 queda vivo?
```

Debe quedar:

- eliminado;
- adaptado;
- explícitamente documentado como compatibilidad temporal.

Nunca dejar legacy activo sin owner ni condición de retiro.

---

# 7. V1 leakage detectors

Si aparece cualquiera de estas señales, detener y revisar:

- “para no romper, dejamos el redirect anterior”;
- “la UI ya es V2, backend luego”;
- “seguimos creando Project igual por ahora”;
- “este test falla porque esperaba el flujo viejo”;
- “reutilicemos PublicDraft porque se parece”;
- “mantengamos Step 0 como entrada temporal”;
- “este PRD antiguo explica mejor el comportamiento”;
- “solo cambiamos layout/copy”;
- “limpiamos legacy después”;
- “no hace falta revisar consumers”.

Dos o más señales simultáneas:

```text
MIGRATION_RISK = HIGH
```

---

# 8. Initiative Owner drift guardrail

Starteria V2 corporativa parte del Portfolio Lead cuando el journey corresponde a portfolio.

No asumir:

```text
solution_first
→ initiative_owner
```

No asumir:

```text
initiative_first
→ Step 0
```

No asumir:

```text
registration
→ create Initiative
```

No asumir:

```text
handoff
→ Start Steps
```

El frame de entrada describe cómo entra el usuario.

No redefine automáticamente el actor principal ni la ruta.

---

# 9. Portfolio Entry hard guardrails

Portfolio Entry debe permanecer pre-Core hasta el checkpoint correspondiente.

No puede por sí solo:

- crear Organization;
- crear StrategicFront;
- crear Challenge;
- crear Initiative;
- crear Step;
- activar Step 0;
- confirmar alineamiento;
- confirmar KPI;
- convertir AI inference en canonical truth.

Si un legacy service hace cualquiera de estos comportamientos:

```text
SEMANTIC_OWNER = LEGACY_COMPAT
MAY_DEFINE_NEW_BEHAVIOR = NO
```

hasta que exista adapter o reemplazo V2 explícito.

---

# 10. Visual migration is not product migration

Una superficie NO se considera V2 solo porque use:

- V2 colors;
- V2 primitives;
- V2 layout;
- Landing V4 styling;
- Copilot UI;
- V2 cards.

Debe cumplir también:

```text
V2 contract
+
V2 behavior
+
V2 tests
+
no undocumented V1 consumer
```

Regla:

> Visual migration alone does not count as V2 migration.

---

# 11. Design System boundary

El Design System V2 gobierna presentación, no lógica de negocio.

No insertar en DS:

- Step gates;
- approval semantics;
- role authority;
- business transitions;
- evidence sufficiency;
- alignment rules;
- canonicalization.

Patterns pueden representar estado.

No definirlo.

---

# 12. Step platform guardrail

Hasta aprobar experiencia V2 de Initiative Overview / Steps:

```text
CORE LOGIC = preserve
DOMAIN LOGIC = audit
LEGACY UI = not visual authority
STEP WORKSPACE CONCEPT = hypothesis
```

No reconstruir Step 0–4 usando UI antigua como target.

No aplicar simplemente “las mismas cards del Portfolio”.

---

# 13. Test guardrails

Antes de confiar en tests existentes, clasificar cada suite:

```text
V2_CONFORMANCE
V1_REGRESSION
COMPATIBILITY
HYPOTHESIS
UNKNOWN
```

Un test V1 no puede bloquear una migración V2 solo porque espera comportamiento legacy.

Si falla un test:

1. identificar qué autoridad protege;
2. decidir si el test debe permanecer;
3. adaptar solo si V2 cambia legítimamente el comportamiento;
4. no modificar expected únicamente para obtener PASS.

---

# 14. Persistence guardrail

No reutilizar modelos por similitud de nombre.

Antes de reutilizar:

```text
lifecycle
semantics
ownership
provenance
review state
canonicalization
downstream consumers
expiration
permissions
```

Ejemplo:

```text
PublicDraft
≠
PortfolioEntryDraft
```

hasta demostrar equivalencia.

---

# 15. Adapter-first policy

Cuando lógica reusable está acoplada a V1:

Preferir:

```text
V2 experience
→ adapter
→ reusable legacy infrastructure
```

sobre:

```text
V2 experience
→ legacy behavior directly
```

El adapter debe:

- traducir inputs/outputs;
- bloquear semántica V1 no deseada;
- hacer explícito el compatibility boundary;
- ser temporal cuando corresponda.

---

# 16. Route migration policy

Cada route debe quedar clasificada:

```text
V2_ACTIVE
V1_COMPAT
V1_DEPRECATED
UNRESOLVED
```

No pueden existir dos rutas con autoridad equivalente para el mismo job.

Una V1_COMPAT debe declarar:

- consumers;
- replacement;
- retirement condition.

---

# 17. V2 slice completion rule

Un slice solo puede declararse `V2_MIGRATED` cuando:

1. V2 contract gobierna el comportamiento.
2. V2 implementation es la route activa.
3. V2 tests protegen la nueva semántica.
4. No existe consumer V1 no documentado.
5. Legacy restante está marcado `LEGACY_COMPAT` o eliminado.
6. `STARTERIA_V2_MANIFEST.md` está actualizado.
7. E2E del slice pasa.
8. No existe conflicto de autoridad abierto.

Si falla uno:

```text
slice_status != V2_MIGRATED
```

---

# 18. V1 retirement rule

Una pieza V1 puede eliminarse solo si:

```text
NO authority
+
NO active route
+
NO live consumer
+
NO required API dependency
+
NO DB migration dependency
+
NO required compatibility test
+
V2 replacement verified
```

Antes de eso:

```text
DEPRECATE
```

No:

```text
REMOVE
```

---

# 19. V1 retirement gate — final product

Starteria puede declarar:

```text
V1_ACTIVE = 0
```

solo cuando:

- [ ] ningún documento V1 es autoridad;
- [ ] ningún slice V1 está activo en Manifest;
- [ ] ningún nuevo PR depende de V1;
- [ ] no existen rutas V1 de usuario salvo compatibilidad explícita;
- [ ] no existen consumers V1 no documentados;
- [ ] no existen primitives V1 duplicados;
- [ ] Portfolio Entry es V2;
- [ ] Portfolio Lead journey es V2;
- [ ] Activation / Handoff es V2;
- [ ] Initiative Overview es V2;
- [ ] Steps 0–4 tienen experiencia V2 aprobada;
- [ ] E2E principal recorre únicamente V2;
- [ ] V1 restante es `HISTORICAL` / `ARCHIVED`;
- [ ] `CURRENT_STATE.md` declara V1 retired.

---

# 20. Required change report

Antes de cada implementación, el agente debe emitir:

```text
V2_CHANGE_GUARDRAIL_CHECK

Slice:
Authority:
Manifest status:
Current route:
Legacy dependencies:
Semantic owner:
V1 assumptions detected:
Adapter required:
Tests protecting current behavior:
Tests required for V2:
Authority conflict:
Proceed:
YES / NO
```

Después de implementar:

```text
V2_CHANGE_CLOSURE_CHECK

V2 contract satisfied:
V2 route active:
V1 consumer remaining:
Legacy compatibility documented:
E2E passed:
Manifest updated:
Retirement action:
KEEP_COMPAT / DEPRECATE / REMOVE
Migration status:
PARTIAL / V2_MIGRATED
```

---

# 21. Stop conditions

STOP implementation when:

- authority is ambiguous;
- V1 and V2 conflict without decision;
- a Core invariant would change without ADR;
- legacy behavior is being preserved only because it already exists;
- migration requires silent canonicalization;
- tests protect unknown semantics;
- route ownership is unclear;
- deleting legacy would break unknown consumers;
- implementation would make visual V2 hide functional V1.

---

# 22. Final rule

> Starteria V2 may reuse V1 infrastructure, but V1 must never regain semantic authority.

And:

> A migration is complete only when the active behavior, active route, active tests and active authority are all V2.
