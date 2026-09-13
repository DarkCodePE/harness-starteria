> HISTORICAL: ver ../../CURRENT_STATE.md. Esta matriz registra una conciliacion observada; no convierte runtime ni tests productivos en superficie activa de este repositorio.

# Portfolio Entry - matriz de conciliacion pack / contrato / runtime / test v0.3


Estado: auditoria documental y de harness acotado, 2026-09-12.
Checkout: rama `audit/portfolio-entry-current-state`, commit base observado `099f3b2f12a5e5a78ebcaa0ff43320a8412c11fb`.
Limite: no instala el pack 00-14 literal, no aprueba contratos propuestos y no habilita cambios funcionales de produccion.

## Baseline y delta

- El pack 00-14 no existe literalmente en el checkout con esos nombres. Existen equivalentes parciales v0.1/v0.2 en `docs/experience`, `docs/agents`, `docs/ai-harness`, `backend/modules/portfolio-entry-runtime` y `tests/ai-harness/portfolio-entry`.
- `docs/STARTERIA_AUTHORITY.md` fue conciliado para dejar de describir Agent/Skills como futuros cuando ya existen y tienen consumidores parciales. Sigue diferenciando implementado, aprobado y probado.
- La conversion actual de Portfolio Entry crea `Project`, Step rows, `step0Status = IN_PROGRESS` y Adaptive Core; eso queda documentado como continuidad Initiative existente, no como continuidad Portfolio aprobada.
- Las pruebas locales ejecutadas en la conciliacion anterior fueron `npm.cmd run test:backend -- portfolio-entry` con 158 passed y 19 skipped, y `npm.cmd run harness:portfolio-entry -- --case PE-B03` con PASS. Esta entrega anade cobertura semantica de drift, pero no certifica E2E de DB.

## Estado de autoridad

| Artefacto | Ruta | Estado real |
|---|---|---|
| Core global | `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` | v0.3 candidata; gobierna invariantes solo cuando sea ratificada por el proceso vigente |
| Authority map | `docs/STARTERIA_AUTHORITY.md` | base de gobernanza; actualizado para reflejar documentos existentes sin aprobarlos |
| Experience Contract activo | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | aprobado como base de experiencia para Pantalla 1 |
| Agent Contract | `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | propuesto para revision; parcialmente implementado por runtime/prompts |
| Skill Contracts | `docs/agents/portfolio-entry/skills/entry-01-intent-detection/SKILL.md` a `entry-04-question-planner/SKILL.md` | propuestos para revision; parcialmente implementados por prompts v0.2 |
| Handoff 08 del pack | equivalente en `backend/modules/portfolio-entry-runtime/domain/handoff.schema.ts` | implementado como schema v0.2; no prueba por si mismo calidad semantica |
| Continuidad post-entry | `docs/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` | nuevo contrato propuesto, no implementado |
| ADR continuidad | `backend/docs/adr/ADR-031-portfolio-entry-continuation-to-portfolio.md` | propuesto, no aprobado |

## Matriz

| Regla/ID | pack/seccion | contrato instalado/version/estado | archivo:linea que la implementa | consumidor harness | consumidor aplicacion | prueba(s) | modo/resultado/artefacto | diferencia | accion minima |
|---|---|---|---|---|---|---|---|---|---|
| PL-AUTH-01 autoridad local no sustituye Core global | 00, 01 | Authority v0.1; Experience v0.1 aprobado; Agent/Skills propuestos | `docs/STARTERIA_AUTHORITY.md:34`, `docs/STARTERIA_AUTHORITY.md:61` | N/A | N/A | revision documental | implementado documentalmente | el pack se autodenomina baseline pero no esta instalado literal | mantener referencia y ratificar cualquier ascenso de autoridad |
| PL-AGENT-04 cuatro skills | 03, 04-07 | Agent Contract v0.1 propuesto | `backend/modules/portfolio-entry-runtime/prompts/prompt-manifest.ts:20` | `tests/ai-harness/portfolio-entry/live/live-runner.ts` consume manifest | `backend/modules/portfolio-entry/portfolio-entry.router.ts` carga manifest | `portfolio-entry-live-candidate-v0.2.test.ts` | implementado y probado unitariamente | no demuestra aprobacion normativa | conservar cuatro skills; no crear quinto agente |
| PL-HANDOFF-08 campos conceptuales | 08 | Handoff schema v0.2 implementado | `backend/modules/portfolio-entry-runtime/domain/handoff.schema.ts:56`, `:58`, `:59` | `portfolio-entry-handoff-v0.2.test.ts` | `portfolio-entry-conversion.mapper.ts` consume handoff | `portfolio-entry-provider-schema-compatibility.test.ts`, `portfolio-entry-handoff-v0.2.test.ts` | implementado y probado con schema | schema no decide destino Portfolio | preservar schema; no reemplazar por schema paralelo |
| PL-QP-07 prioridad de preguntas | 07 | Skill 04 propuesto; runtime de sesion v0.2 | `backend/modules/portfolio-entry-runtime/domain/session.types.ts:28`, `tests/ai-harness/portfolio-entry/evaluator/hard-checks-v0.2.ts:106` | session engine y evaluator | API experimental de session | `portfolio-entry-session-engine.test.ts:17`, `portfolio-entry-evaluation-v0.2.test.ts:103` | implementado y probado unitariamente | prioridad exacta de 07 no queda trazada como PL-ID | anadir mapping PL-07 a PE cases antes de declararlo cubierto |
| PL-RESP-01 `responded_resolves` no equivale a `answered_gaps` | 10, 13 | Session model v0.2 | `backend/modules/portfolio-entry-runtime/domain/session.types.ts:33`, `:54` | session engine | persisted projection | `portfolio-entry-session-engine.test.ts:130`, `:131` | implementado y probado unitariamente | no se ejecutaron integraciones DB relacionadas | mantener test y agregar caso PL equivalente |
| PL-STATE-01 `initial_entry_state` estable y `current_frame` evolutivo | 02, 13 | Analysis/session v0.2 | `backend/modules/portfolio-entry-runtime/session/session-controller.ts:124`, `:125` | evaluator HC-11/current-frame | runtime session | `portfolio-entry-session-engine.test.ts:192`, `:193`; `portfolio-entry-evaluation-v0.2.test.ts:74` | implementado y probado unitariamente | DS-OBS-02 abierto sobre frame conservador | conservar como REVIEW cuando evolucion esperada no ocurra |
| PL-GUIDED-01 Guided Exploration con opt-in | 02, 10 | Session controller/evaluator v0.2 | `tests/ai-harness/portfolio-entry/evaluator/hard-checks-v0.2.ts:122` | evaluator HC-14/HC-15 | runtime session | `portfolio-entry-evaluation-v0.2.test.ts:129`, `:148` | implementado y probado unitariamente | no certifica UX productiva | mantener como contract con pruebas de UI si se expone |
| PL-ROLE-01 solution_first/initiative_first son estados, no cambio de rol | 02, 11, 12 | Experience v0.1 aprobado; harness v0.2 | `tests/ai-harness/portfolio-entry/evaluator/evaluate-session.ts` | nuevo `portfolio_lead_alignment` / `initiative_owner_drift` | N/A en produccion | `portfolio-entry-evaluation-v0.2.test.ts` | implementado en harness en esta entrega | no cambia runtime ni conversion | usar como guard antes de tocar prompts/conversion |
| PL-GAP-01 `INITIATIVE_SETUP` no es destino generico Portfolio | 08, 12, 13 | Gap schema v0.2 permite el enum | `backend/modules/portfolio-entry-runtime/domain/gap-resolution.schema.ts:15` | handoff evaluator | Handoff schema/API | finding `DS-OBS-03` en `PORTFOLIO_ENTRY_FINDINGS_REGISTER.md:9` | parcial | enum existe; uso prematuro observado | especificar politica de routing y test negativo por caso Portfolio |
| PL-CONTEXT-01 programa/capacidad existente se conserva como contexto | 05, 06, 08 | Handoff evaluator v0.2 | `tests/ai-harness/portfolio-entry/evaluator/handoff-checks-v0.2.ts` | `HC-EXISTING-DESIRED` | Handoff DTO/UI | `portfolio-entry-handoff-v0.2.test.ts` | implementado y probado unitariamente | no demuestra cobertura de todos los PL-13 | mapear a PL-case explicito |
| PL-INVENTORY-01 inventario declarado no equivale a inventario analizado | 05, 12, 13 | Experience v0.1; harness fixtures PE | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | PE fixtures | N/A | PE-A02/portfolio fixtures | parcial | no existe ID PL literal | crear mapping PL-xx sin renombrar PE |
| PL-CONFIRM-01 confirmacion de comprension no aprueba autoridad organizacional | 08, 11, 12 | Session lifecycle v0.2 | `backend/modules/portfolio-entry-conversion/portfolio-entry-conversion.service.ts:112`, `:156` | conversion tests | conversion service | conversion integration skipped en suite seleccionada | implementado sin prueba ejecutada en esta entrega | conversion permite Project tras confirmacion/eligibilidad | ADR-031 + contrato post-entry antes de nueva conversion |
| PL-CONVERT-01 continuidad principal Portfolio, no Project/Step0 | 00, 01, 11, 14 | no existe contrato instalado previo completo; contrato propuesto v0.1 | `backend/modules/portfolio-entry-conversion/portfolio-entry-conversion.service.ts:174`, `:175`, `:188`, `:376` evidencia estado actual | N/A | conversion service actual | integration tests existen pero fueron skipped en `test:backend -- portfolio-entry` | no implementado para Portfolio | estado actual es Initiative conversion | implementar despues de ADR/contrato y pruebas DB autorizadas |
| PL-TEST-13 PL-01...PL-10 | 13 | no instalado como IDs | busqueda `rg PL-01` solo encuentra Core/PRDs, no harness PL | PE harness existe | N/A | PE-* fixtures y v0.2 tests | parcial/no verificable como PL suite | equivalencia no demostrada | anadir mapping PL->PE y casos faltantes antes de declarar cobertura |
| PL-HARNESS-09 conformance separado de hypothesis validation | 09 | evaluator v0.2 | `tests/ai-harness/portfolio-entry/evaluator/evaluate-session.ts` | evaluator | N/A | `portfolio-entry-evaluation-v0.2.test.ts:42`, `:50` | implementado y probado unitariamente | no incluye todos los PL IDs | mantener separacion en reportes |
| PL-LIVE-OBS observabilidad de modelo/proveedor | 09, 10, 14 | Findings register | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_FINDINGS_REGISTER.md:11` | live runner | N/A | Phase 5 report | parcial | modelo solicitado/reportado no siempre separado | no inferir modo live por nombre de comando |

## Cobertura PL-01...PL-10 propuesta

Los IDs PL no estan instalados. Para evitar renombrar o sustituir PE, la cobertura queda como mapping pendiente de ratificacion:

| PL | expectativa del pack 13 | PE/test equivalente | estado |
|---|---|---|---|
| PL-01 | portfolio lead alignment claro | PE-A02/PE-I01 + handoff checks | parcial |
| PL-02 | solution-first con reverse alignment sin ejecucion | PE-B03, PE-G01 | implementado en harness PE |
| PL-03 | programa existente no se recrea | handoff `HC-EXISTING-DESIRED` | parcial |
| PL-04 | inventario declarado no se afirma analizado | PE-A02 + context fidelity | parcial |
| PL-05 | desconocido sigue desconocido | PE-D04 y provenance checks | parcial |
| PL-06 | correccion material conserva estado/revision | session service tests | implementado sin mapping PL |
| PL-07 | multiple iniciativas parciales no extrapolan cartera | falta caso PL dedicado | no implementado |
| PL-08 | current_frame evoluciona sin mutar initial_entry_state | session engine/evaluator | implementado |
| PL-09 | drift material impide PASS | nuevo control `initiative_owner_drift = material` | implementado en harness |
| PL-10 | no Project/Step desde sesion Portfolio | no existe conversion Portfolio; conversion actual crea Project | no implementado |

## Skips y entorno

En la ejecucion reportada `npm.cmd run test:backend -- portfolio-entry` quedaron 19 skipped. Los skips relevantes incluyen integraciones Prisma de conversion y repositorios (`portfolio-entry-conversion.integration.test.ts`, `prisma-portfolio-entry-session.repository.integration.test.ts`, `prisma-portfolio-entry-idempotency.repository.integration.test.ts`). Para declaracion E2E se requiere una base PostgreSQL autorizada, migrada y aislada; no debe simularse certificacion con tests skipped.
