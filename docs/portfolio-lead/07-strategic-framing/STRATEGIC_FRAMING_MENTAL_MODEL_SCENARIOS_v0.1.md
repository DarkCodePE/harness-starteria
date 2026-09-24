# Strategic Framing Mental Model Scenarios v0.1

**Estado:** `APPROVED SCENARIO BASELINE FOR SF IMPLEMENTATION/TESTING` — human-approved 2026-09-24
**Regla:** cada escenario debe poder rastrearse al Experience Contract, checklist, matriz y slice futuro.

**Status:** `APPROVED SCENARIO BASELINE FOR SF IMPLEMENTATION/TESTING`
**Human approval:** 2026-09-24
Runtime verification: PENDING

## SF-MM-01 â€” Expert / direct

- **Given:** outcome, KPI y driver estÃ¡n claros.
- **Mental model:** la persona experta quiere estructurar y avanzar con mÃ­nima intervenciÃ³n.
- **Available context:** outcome, KPI, driver y contexto aportado por Portfolio Entry.
- **Expected behavior:** framing `LIGHT` cuando sea suficiente; no fuerza lenses ni preguntas innecesarias; permite proponer un Challenge para confirmaciÃ³n humana.
- **Expected UI capability:** workspace directo, ediciÃ³n rÃ¡pida, suficiency visible y acciÃ³n explÃ­cita de promociÃ³n.
- **Expected Copilot behavior:** opcional; revisa o seÃ±ala incertidumbre si se solicita o resulta material.
- **Forbidden behavior:** `DEEP` obligatorio, chat obligatorio o Challenge automÃ¡tico.
- **Acceptance condition:** el usuario alcanza estado suficiente sin completar una metodologÃ­a fija.
- **Likely implementation slice:** `SF-3`, `SF-6`.

## SF-MM-02 â€” Outcome clear / causes uncertain

- **Given:** KPI claro, pero driver desconocido.
- **Mental model:** la persona conoce el resultado deseado y necesita explorar causas.
- **Available context:** outcome, KPI, seÃ±ales iniciales y contexto de Portfolio Entry.
- **Expected behavior:** propone 2â€“4 lenses relevantes como hipÃ³tesis de exploraciÃ³n; muestra observaciones y gaps; conserva incertidumbre.
- **Expected UI capability:** sugerencias explicables, observaciones editables y estado `OBSERVE`.
- **Expected Copilot behavior:** cuestiona y propone perspectivas; no decide ni crea Challenge.
- **Forbidden behavior:** convertir cada lens o inferencia en Challenge.
- **Acceptance condition:** causas/gaps quedan visibles y priorizables sin falsa certeza.
- **Likely implementation slice:** `SF-2`, `SF-4`, `SF-5`.

## SF-MM-03 â€” Portfolio-first

- **Given:** existen mÃºltiples iniciativas y la estrategia es poco clara.
- **Mental model:** la persona parte del portfolio y busca alinearlo hacia posibles resultados.
- **Available context:** iniciativas, seÃ±ales, aprendizaje y decisiones disponibles.
- **Expected behavior:** reverse alignment identifica patrones y propone posibles Fronts para confirmaciÃ³n humana.
- **Expected UI capability:** agrupaciÃ³n/alineamiento inverso y comparaciÃ³n de propuestas sin reescribir historia como certeza.
- **Expected Copilot behavior:** sintetiza patrones y alternativas; marca inferencias y pide confirmaciÃ³n.
- **Forbidden behavior:** fabricar estrategia Ãºnicamente desde el inventario o canonizar un Front automÃ¡ticamente.
- **Acceptance condition:** una persona confirma, ajusta o descarta la propuesta y queda structured state.
- **Likely implementation slice:** `SF-2`, `SF-3`, `SF-7`.

## SF-MM-04 â€” Speed / limited capacity

- **Given:** horizonte corto, un equipo, varios gaps y capacidad para uno.
- **Mental model:** la persona necesita foco operativo sin perder visibilidad del resto.
- **Available context:** gaps, capacidad, horizonte, urgencia y dependencias.
- **Expected behavior:** prioriza un candidato; mantiene restantes observables; recomienda profundidad `LIGHT` si basta.
- **Expected UI capability:** priorizaciÃ³n visible, capacidad/horizonte editables y estados `ADDRESS NOW`/`OBSERVE`/`DISCARD`.
- **Expected Copilot behavior:** explica trade-offs y recomienda foco, sin imponerlo.
- **Forbidden behavior:** cinco Challenges automÃ¡ticos o profundidad innecesaria.
- **Acceptance condition:** como mÃ¡ximo el foco humano-confirmado avanza; los demÃ¡s gaps permanecen trazables.
- **Likely implementation slice:** `SF-5`, `SF-6`.

## SF-MM-05 â€” Complex corporate front

- **Given:** mÃºltiples Ã¡reas, dependencias, iniciativas y decisiones de inversiÃ³n.
- **Mental model:** la persona necesita comprender un frente amplio sin perder relaciones ni cobertura.
- **Available context:** outcome, horizonte, dependencias, iniciativas, Ã¡reas y seÃ±ales financieras/operativas.
- **Expected behavior:** recomienda `DEEP`, activa varios lenses relevantes, hace visible coverage y permite mÃºltiples Challenges cuando se justifiquen.
- **Expected UI capability:** workspace por capas, relaciones, coverage y suficiencia diferenciada por incertidumbre.
- **Expected Copilot behavior:** sintetiza complejidad, detecta dependencias y propone preguntas/prioridades.
- **Forbidden behavior:** exigir el mismo depth a todos los contextos o tratar coverage como completitud.
- **Acceptance condition:** la persona entiende dependencias y confirma quÃ© Challenges, si alguno, son canÃ³nicos.
- **Likely implementation slice:** `SF-3`, `SF-4`, `SF-5`, `SF-6`.

## SF-MM-06 â€” Without Copilot

- **Given:** la persona edita directamente y no usa chat.
- **Mental model:** el workspace es la forma primaria de trabajo.
- **Available context:** contexto de entrada, campos estructurados, observaciones y prioridades.
- **Expected behavior:** framing completo y suficiente sin conversaciÃ³n.
- **Expected UI capability:** todas las acciones esenciales, feedback de suficiencia y promociÃ³n humana en workspace.
- **Expected Copilot behavior:** puede observar/revisar despuÃ©s, pero no es requisito.
- **Forbidden behavior:** bloquear avance hasta abrir Copilot o esconder estado material en conversaciÃ³n.
- **Acceptance condition:** el mismo structured state se alcanza sin Copilot.
- **Likely implementation slice:** `SF-3`, `SF-8`.

## SF-MM-07 â€” Specialized perspective

- **Given:** un factor financiero, cultural, tecnolÃ³gico, de riesgo o ecosistema es material.
- **Mental model:** una perspectiva especializada cambia la comprensiÃ³n del outcome.
- **Available context:** factor especializado, restricciones y seÃ±ales relacionadas.
- **Expected behavior:** activa la perspectiva relevante de forma adaptativa, sin imponer las demÃ¡s.
- **Expected UI capability:** lens especializado seleccionable/sugerido, evidencia asociada y contribuciÃ³n a observaciones/gaps.
- **Expected Copilot behavior:** explica por quÃ© la perspectiva parece material y mantiene la sugerencia advisory.
- **Forbidden behavior:** limitar el anÃ¡lisis a cuatro lenses fijos o canonizar el lens como jerarquÃ­a.
- **Acceptance condition:** la perspectiva puede contribuir a cero, uno o varios resultados sin crear Challenge automÃ¡tico.
- **Likely implementation slice:** `SF-4`, `SF-5`.

## SF-MM-08 — Challenge-first / parent unclear

- **Given:** the user brings a clear operational/strategic problem, likely Challenge-like, while the broader Front is unknown or provisional.
- **Expected behavior:** preserve the problem; identify why it matters and a movement signal/proxy; test whether broader parent context changes interpretation; produce a candidate Challenge-like state.
- **Forbidden behavior:** inventing a Front, creating an orphan canonical Challenge or forcing a corporate-strategy workshop before useful progress.
- **Acceptance condition:** no canonical Challenge exists until a Strategic Front is resolved/confirmed and a human explicitly promotes it.
- **Likely implementation slice:** `SF-2`, `SF-3`, `SF-6`.

## SF-MM-09 — Initiative/solution-first with value path uncertain

- **Given:** the user starts from a concrete solution/initiative and direct business value is not yet proven.
- **Expected behavior:** reverse-align expected change; separate movement, contribution and business outcome signals; preserve pending alignment when parent context is unresolved; do not fabricate ROI/business impact.
- **Forbidden behavior:** treating the initiative name as strategy, inferred KPI as confirmed or automatically creating a Front/Challenge.
- **Acceptance condition:** expected/observed/attributed contribution and unresolved parent context remain visible and reviewable.
- **Likely implementation slice:** `SF-2`, `SF-3`, `SF-5`, `SF-7`.
