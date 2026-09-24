# Strategic Framing â€” SF-0

**Estado:** `CANDIDATE` â€” contrato y escenarios congelados para revisiÃ³n humana
**Slice:** `SF-0 â€” Strategic Framing Contract + Scenario Freeze`
**Alcance:** exclusivamente documental; no implementa runtime ni modifica Core.

```text
SF-0 documentation package:
READY FOR FINAL HUMAN APPROVAL
NOT runtime
NOT SF-1
NOT canonical Core extension
```

SF-0 preserves the multi-entry boundary: Portfolio Entry is not the exclusive
gateway; Public Entry, Enterprise Direct and Existing Portfolio/imported work
may reuse Strategic Interpretation and converge on a sufficiently clear
Portfolio Anchor before Strategic Framing. Interpretation remains provisional
and does not confirm a Strategic Front, Gap or Challenge.

## PropÃ³sito

Este directorio define el bounded context **Strategic Framing** entre Portfolio Entry y el trabajo estratÃ©gico posterior. El paquete convierte los mental models `SF-MM-01...07` en reglas de experiencia comprobables sin promoverlos a autoridad de Core.

## Autoridad y lÃ­mites

- Core factual: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
- Authority map: `docs/STARTERIA_AUTHORITY.md`.
- Contexto/target de handoff: `STRATEGIC_FRAMING_CONTEXT_v0.1.md`.
- Esta documentaciÃ³n es una propuesta de Experience Contract subordinada al Core; no crea entidades, lifecycle, endpoints ni autoridad de IA.
- No se modifica `STRATEGIC_FRAMING_CONTEXT_v0.1.md`.

## Documentos

1. `STRATEGIC_FRAMING_EXPERIENCE_CONTRACT_v0.1.md` â€” reglas congeladas.
2. `STRATEGIC_FRAMING_MENTAL_MODEL_SCENARIOS_v0.1.md` â€” escenarios `SF-MM-01...07`.
3. `STRATEGIC_FRAMING_ACCEPTANCE_CHECKLIST_v0.1.md` â€” criterios de aceptaciÃ³n y negativos.
4. `STRATEGIC_FRAMING_TRACEABILITY_MATRIX_v0.1.md` â€” escenario a estado, UI, aplicaciÃ³n, test y slice.
5. `STRATEGIC_FRAMING_IMPLEMENTATION_SEQUENCE_v0.1.md` â€” secuencia futura, no ejecutada en SF-0.

## DeclaraciÃ³n de congelaciÃ³n

`SF-0` congela comportamiento de experiencia candidato. No autoriza implementaciÃ³n. Toda necesidad de cambiar semÃ¡ntica canÃ³nica, lifecycle, cardinalidad, persistencia o autoridad humana/AI debe detenerse y tratarse como `ADR CANDIDATE`.
