# Strategic Framing Acceptance Checklist v0.1

**Estado:** `APPROVED ACCEPTANCE BASELINE` — implementation verification `PENDING`; tests de implementaciÃ³n aÃºn `TBD`.

**Checklist status:** `APPROVED ACCEPTANCE BASELINE`
**Implementation verification:** PENDING
**Human approval:** 2026-09-24

## Core experience

- [ ] El framing puede completarse sin Copilot.
- [ ] `DIRECT`, `MIXED` y `COPILOT` convergen en el mismo structured state.
- [ ] El structured workspace es el system of record.
- [ ] La suficiencia no se evalÃºa como completitud de formulario o de lenses.
- [ ] `LIGHT` es vÃ¡lido cuando el contexto permite avanzar con lo mÃ­nimo suficiente.
- [ ] `DEEP` es vÃ¡lido cuando la complejidad, dependencias o incertidumbre lo justifican.
- [ ] No hay lenses fijos obligatorios.
- [ ] Perspectivas especializadas pueden activarse cuando son materiales.

## Boundaries and negative cases

- [ ] No se crea un Challenge por lens.
- [ ] No se crea un Challenge automÃ¡ticamente desde una inferencia AI.
- [ ] No se crea un Challenge automÃ¡ticamente desde un gap.
- [ ] Todo Challenge promovido requiere acciÃ³n humana explÃ­cita.
- [ ] Los gaps pueden permanecer en observaciÃ³n.
- [ ] La capacidad y el horizonte afectan la recomendaciÃ³n de priorizaciÃ³n.
- [ ] Con cinco gaps y capacidad para uno, no se crean cinco Challenges.
- [ ] AI suggestions permanecen advisory y separadas de canonical truth.
- [ ] Copilot no mantiene lifecycle privado.
- [ ] Challenge no equivale a Invitation.
- [ ] Challenge no equivale a Initiative.
- [ ] Strategic Framing no equivale a Steps ni activa Steps.

## Portfolio and sufficiency

- [ ] Portfolio-first reverse alignment puede proponer Fronts sin fabricarlos como verdad.
- [ ] Outcome, mÃ©trica/seÃ±al, driver principal e incertidumbre visible pueden bastar para avanzar.
- [ ] Se distinguen blocker, soft gap y optional context.
- [ ] La ausencia de un lens no bloquea automÃ¡ticamente.
- [ ] Drivers, gaps, opportunities, Challenges activos y decisiones conservan trazabilidad.

## SF-0.1 multi-entry and interpretation

- [ ] Public Entry, Enterprise Direct and Existing Portfolio/imported work are supported conceptually.
- [ ] Strategic Interpretation is distinct from Strategic Framing and canonical strategy.
- [ ] Strategic Interpretation Result supports `front_like`, `challenge_like`, `initiative_like` and `unresolved`.
- [ ] Scope classification is advisory until materially reviewed.
- [ ] Top-down and bottom-up/reverse-alignment paths are both preserved.
- [ ] Interpretation can question existing structures without silently rewriting or confirming them.
- [ ] Portfolio Anchor is minimum sufficient reference, not necessarily the highest-level corporate objective or a Strategic Front.
- [ ] Movement Signal, Contribution Signal and Business Outcome remain separate.
- [ ] A useful movement signal may suffice even when business outcome is unproven.
- [ ] No fabricated ROI, KPI or causal attribution is presented as fact.
- [ ] Root-cause exploration is adaptive and not mandatory consulting discovery.

## Candidate Challenge and Core/schema boundary

- [ ] A challenge-like input does not create an orphan canonical Challenge.
- [ ] Canonical Challenge still requires a resolved/confirmed Strategic Front and explicit human promotion.
- [ ] No inferred Front is created to satisfy the schema.
- [ ] `Challenge.strategicFrontId` remains required/unchanged.
- [ ] Initiative/work-item alignment may remain pending.
- [ ] Bottom-up learning can trigger strategic review without rewriting history.
- [ ] ADR is not required now; canonical Challenge without Strategic Front is the documented ADR trigger.

## Added scenarios

- [ ] SF-MM-08 is protected by contract and negative acceptance coverage.
- [ ] SF-MM-09 is protected by contract and negative acceptance coverage.

## Evidence to produce in later slices

- [ ] Contract tests: `TBD`.
- [ ] Negative tests: `TBD`.
- [ ] E2E harness: `TBD`.
- [ ] Current-state audit evidence: `TBD` (SF-1; no ejecutado en SF-0).
