# Strategic Framing Mental Model Scenarios v0.1

**Estado:** `CANDIDATE` — escenarios congelados en SF-0  
**Regla:** cada escenario debe poder rastrearse al Experience Contract, checklist, matriz y slice futuro.

## SF-MM-01 — Expert / direct

- **Given:** outcome, KPI y driver están claros.
- **Mental model:** la persona experta quiere estructurar y avanzar con mínima intervención.
- **Available context:** outcome, KPI, driver y contexto aportado por Portfolio Entry.
- **Expected behavior:** framing `LIGHT` cuando sea suficiente; no fuerza lenses ni preguntas innecesarias; permite proponer un Challenge para confirmación humana.
- **Expected UI capability:** workspace directo, edición rápida, suficiency visible y acción explícita de promoción.
- **Expected Copilot behavior:** opcional; revisa o señala incertidumbre si se solicita o resulta material.
- **Forbidden behavior:** `DEEP` obligatorio, chat obligatorio o Challenge automático.
- **Acceptance condition:** el usuario alcanza estado suficiente sin completar una metodología fija.
- **Likely implementation slice:** `SF-3`, `SF-6`.

## SF-MM-02 — Outcome clear / causes uncertain

- **Given:** KPI claro, pero driver desconocido.
- **Mental model:** la persona conoce el resultado deseado y necesita explorar causas.
- **Available context:** outcome, KPI, señales iniciales y contexto de Portfolio Entry.
- **Expected behavior:** propone 2–4 lenses relevantes como hipótesis de exploración; muestra observaciones y gaps; conserva incertidumbre.
- **Expected UI capability:** sugerencias explicables, observaciones editables y estado `OBSERVE`.
- **Expected Copilot behavior:** cuestiona y propone perspectivas; no decide ni crea Challenge.
- **Forbidden behavior:** convertir cada lens o inferencia en Challenge.
- **Acceptance condition:** causas/gaps quedan visibles y priorizables sin falsa certeza.
- **Likely implementation slice:** `SF-2`, `SF-4`, `SF-5`.

## SF-MM-03 — Portfolio-first

- **Given:** existen múltiples iniciativas y la estrategia es poco clara.
- **Mental model:** la persona parte del portfolio y busca alinearlo hacia posibles resultados.
- **Available context:** iniciativas, señales, aprendizaje y decisiones disponibles.
- **Expected behavior:** reverse alignment identifica patrones y propone posibles Fronts para confirmación humana.
- **Expected UI capability:** agrupación/alineamiento inverso y comparación de propuestas sin reescribir historia como certeza.
- **Expected Copilot behavior:** sintetiza patrones y alternativas; marca inferencias y pide confirmación.
- **Forbidden behavior:** fabricar estrategia únicamente desde el inventario o canonizar un Front automáticamente.
- **Acceptance condition:** una persona confirma, ajusta o descarta la propuesta y queda structured state.
- **Likely implementation slice:** `SF-2`, `SF-3`, `SF-7`.

## SF-MM-04 — Speed / limited capacity

- **Given:** horizonte corto, un equipo, varios gaps y capacidad para uno.
- **Mental model:** la persona necesita foco operativo sin perder visibilidad del resto.
- **Available context:** gaps, capacidad, horizonte, urgencia y dependencias.
- **Expected behavior:** prioriza un candidato; mantiene restantes observables; recomienda profundidad `LIGHT` si basta.
- **Expected UI capability:** priorización visible, capacidad/horizonte editables y estados `ADDRESS NOW`/`OBSERVE`/`DISCARD`.
- **Expected Copilot behavior:** explica trade-offs y recomienda foco, sin imponerlo.
- **Forbidden behavior:** cinco Challenges automáticos o profundidad innecesaria.
- **Acceptance condition:** como máximo el foco humano-confirmado avanza; los demás gaps permanecen trazables.
- **Likely implementation slice:** `SF-5`, `SF-6`.

## SF-MM-05 — Complex corporate front

- **Given:** múltiples áreas, dependencias, iniciativas y decisiones de inversión.
- **Mental model:** la persona necesita comprender un frente amplio sin perder relaciones ni cobertura.
- **Available context:** outcome, horizonte, dependencias, iniciativas, áreas y señales financieras/operativas.
- **Expected behavior:** recomienda `DEEP`, activa varios lenses relevantes, hace visible coverage y permite múltiples Challenges cuando se justifiquen.
- **Expected UI capability:** workspace por capas, relaciones, coverage y suficiencia diferenciada por incertidumbre.
- **Expected Copilot behavior:** sintetiza complejidad, detecta dependencias y propone preguntas/prioridades.
- **Forbidden behavior:** exigir el mismo depth a todos los contextos o tratar coverage como completitud.
- **Acceptance condition:** la persona entiende dependencias y confirma qué Challenges, si alguno, son canónicos.
- **Likely implementation slice:** `SF-3`, `SF-4`, `SF-5`, `SF-6`.

## SF-MM-06 — Without Copilot

- **Given:** la persona edita directamente y no usa chat.
- **Mental model:** el workspace es la forma primaria de trabajo.
- **Available context:** contexto de entrada, campos estructurados, observaciones y prioridades.
- **Expected behavior:** framing completo y suficiente sin conversación.
- **Expected UI capability:** todas las acciones esenciales, feedback de suficiencia y promoción humana en workspace.
- **Expected Copilot behavior:** puede observar/revisar después, pero no es requisito.
- **Forbidden behavior:** bloquear avance hasta abrir Copilot o esconder estado material en conversación.
- **Acceptance condition:** el mismo structured state se alcanza sin Copilot.
- **Likely implementation slice:** `SF-3`, `SF-8`.

## SF-MM-07 — Specialized perspective

- **Given:** un factor financiero, cultural, tecnológico, de riesgo o ecosistema es material.
- **Mental model:** una perspectiva especializada cambia la comprensión del outcome.
- **Available context:** factor especializado, restricciones y señales relacionadas.
- **Expected behavior:** activa la perspectiva relevante de forma adaptativa, sin imponer las demás.
- **Expected UI capability:** lens especializado seleccionable/sugerido, evidencia asociada y contribución a observaciones/gaps.
- **Expected Copilot behavior:** explica por qué la perspectiva parece material y mantiene la sugerencia advisory.
- **Forbidden behavior:** limitar el análisis a cuatro lenses fijos o canonizar el lens como jerarquía.
- **Acceptance condition:** la perspectiva puede contribuir a cero, uno o varios resultados sin crear Challenge automático.
- **Likely implementation slice:** `SF-4`, `SF-5`.

