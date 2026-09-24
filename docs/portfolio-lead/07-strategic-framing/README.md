# Strategic Framing â€” SF-0

**Estado:** `APPROVED` â€” human-approved SF-0 Experience baseline (2026-09-24)
**Slice:** `SF-0 â€” Strategic Framing Contract + Scenario Freeze`
**Alcance:** contrato y estado documental del bounded context; SF-1, SF-2 y
SF-3B tienen evidencia de implementación separada y no modifican Core.

```text
SF-0 documentation package:
HUMAN APPROVAL RECORDED
NOT runtime
NOT SF-1
NOT canonical Core extension
```

SF-0 preserves the multi-entry boundary: Portfolio Entry is not the exclusive
gateway; Public Entry, Enterprise Direct and Existing Portfolio/imported work
may reuse Strategic Interpretation and converge on a sufficiently clear
Portfolio Anchor before Strategic Framing. Interpretation remains provisional
and does not confirm a Strategic Front, Gap or Challenge. The result may assess
the input as `front_like`, `challenge_like`, `initiative_like` or `unresolved`.

## PropÃ³sito

Este directorio define el bounded context **Strategic Framing** entre las rutas de entrada y el trabajo estratÃ©gico posterior. El paquete convierte los mental models `SF-MM-01...09` en reglas de experiencia comprobables sin promoverlos a autoridad de Core.

## Autoridad y lÃ­mites

- Core factual: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
- Authority map: `docs/STARTERIA_AUTHORITY.md`.
- Contexto/target de handoff: `STRATEGIC_FRAMING_CONTEXT_v0.1.md`.
- Esta documentaciÃ³n es una propuesta de Experience Contract subordinada al Core; no crea entidades, lifecycle, endpoints ni autoridad de IA.
- La interpretaciÃ³n puede cuestionar o reverse-align estructuras existentes, pero no reescribirlas ni confirmarlas silenciosamente.

**Estado vigente:** `APPROVED` — human-approved SF-0 Experience baseline
**Approval date:** 2026-09-24
**Scope:** Experience Contract, scenarios and acceptance baseline only
**Runtime:** PARTIAL / IMPLEMENTED_UNVERIFIED · **SF-1:** COMPLETED · **SF-2:** IMPLEMENTED · **SF-3A:** APPROVED · **SF-3B:** IMPLEMENTED_UNVERIFIED · **SF-3C+:** NOT IMPLEMENTED · **Core change:** NO · **ADR blocker:** NO

## SF-0 HUMAN APPROVAL

Date: 2026-09-24
Decision: APPROVED
ADR blocker: NO
Core change: NO
Schema change: NO
Current implementation boundary: SF-3B provisional persistence/application state.
No routes, frontend UI, Copilot integration or canonical promotion are
implemented; end-to-end Strategic Framing runtime is not implemented. SF-3C+
remains unimplemented.

## Documentos

1. `STRATEGIC_FRAMING_EXPERIENCE_CONTRACT_v0.1.md` â€” reglas congeladas.
2. `STRATEGIC_FRAMING_MENTAL_MODEL_SCENARIOS_v0.1.md` â€” escenarios `SF-MM-01...09`.
3. `STRATEGIC_FRAMING_ACCEPTANCE_CHECKLIST_v0.1.md` â€” criterios de aceptaciÃ³n y negativos.
4. `STRATEGIC_FRAMING_TRACEABILITY_MATRIX_v0.1.md` â€” escenario a estado, UI, aplicaciÃ³n, test y slice.
5. `STRATEGIC_FRAMING_IMPLEMENTATION_SEQUENCE_v0.1.md` â€” secuencia futura, no ejecutada en SF-0.

## DeclaraciÃ³n de congelaciÃ³n

`SF-0` congela comportamiento de experiencia candidato. No autoriza implementaciÃ³n. Toda necesidad de cambiar semÃ¡ntica canÃ³nica, lifecycle, cardinalidad, persistencia o autoridad humana/AI debe detenerse y tratarse como `ADR CANDIDATE`.

ADR assessment: `ADR REQUIRED NOW: NO`. If implementation requires a canonical
Challenge without a Strategic Front, stop and raise an ADR candidate.

Implementation truth is `SF-0 approved contract -> SF-1 completed audit ->
SF-2 implemented read model -> SF-3A approved provisional-state decision ->
SF-3B implemented provisional persistence/application state -> SF-3C+ not
implemented`.
