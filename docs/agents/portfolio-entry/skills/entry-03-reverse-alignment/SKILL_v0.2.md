# Starteria — Skill Contract: entry-03-reverse-alignment

**Documento:** `SKILL_v0.2.md`
**Skill ID:** `entry-03-reverse-alignment`
**Versión:** v0.2
**Estado:** PROPUESTO PARA TESTING
**Fecha:** 2026-09-10
**Tipo:** Skill Contract
**Agente padre:** Portfolio Entry Agent / Orchestrator
**Vertical slice:** Portfolio Entry

---

## 0. Autoridad

Este skill está subordinado a:

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados
3. `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
4. `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
5. `entry-01-intent-detection/SKILL_v0.2.md`
6. `entry-02-context-extraction/SKILL_v0.2.md`

Este skill no redefine autoridad IA, taxonomías, dominio canónico ni lógica de Steps.

---

## 0.1. Cambios desde v0.1

Esta versión incorpora hallazgos derivados del testing de Portfolio Entry.

Cambios contractuales:

- reverse alignment deja de depender únicamente del estado del primer turno;
- puede activarse de forma tardía cuando aparece una solución o iniciativa durante la aclaración;
- utiliza `current_frame` y contexto actualizado, preservando `initial_entry_state`;
- puede usar `operating_context`, `success_conditions` y `quality_guardrails` como contexto, sin convertirlos en justificación automática;
- se refuerza la separación entre lo declarado, lo inferido y lo sugerido;
- se endurece la frontera para no convertir gaps de alineamiento en diseño de experimento, gates o Step 0.

### Trazabilidad de findings

- `FND-005` — una solución o iniciativa puede aparecer después del primer turno;
- `FND-002` — el origen de entrada no debe sobrescribirse cuando cambia el frame;
- `FND-008` — Portfolio Entry puede invadir diseño de experimento / Steps posteriores;
- `FND-009` — riesgo de mezclar declaración, inferencia y recomendación.

La evidencia detallada vive en:

`PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md`

Este documento conserva únicamente la decisión contractual resultante.

---

## 1. Propósito

Evaluar si una solución o iniciativa está suficientemente conectada con una razón de negocio como para que Starteria entienda por qué merece seguir siendo trabajada.

Debe responder:

> ¿Qué conexión existe entre esta solución/iniciativa y el cambio que el negocio necesita, y qué enlaces críticos siguen faltando?

No debe responder:

- si la solución es buena o mala;
- si debe implementarse;
- si la iniciativa debe continuar;
- si existe product-market fit;
- si hay evidencia suficiente para escalar;
- cómo diseñar el experimento;
- si debe entrar a Step 0.

---

## 2. Regla de activación

Reverse Alignment se activa cuando el **frame actual** o el contexto actualizado contienen una solución o iniciativa que todavía no está suficientemente conectada con su justificación de negocio.

Puede activarse:

```text
current_frame = solution_first
```

o:

```text
current_frame = initiative_first
```

También puede activarse aunque el usuario haya entrado originalmente desde:

- `problem_first`
- `strategy_first`
- `opportunity_first`
- `portfolio_first`
- otro state

si posteriormente aparece una solución o iniciativa concreta.

### Ejemplo normativo

Inicio:

```text
initial_entry_state = problem_first
current_frame = problem_first
```

Después:

> Ya estamos probando una tecnología para automatizar esta tarea.

Entonces:

```text
initial_entry_state = problem_first
current_frame = initiative_first
reverse_alignment_required = true
```

No debe cambiar `initial_entry_state`.

---

## 3. Cuándo puede no activarse

Puede concluir:

```text
reverse_alignment_required = false
```

o:

```text
status = partial
```

si la solución/iniciativa ya está suficientemente conectada con:

- cambio esperado;
- señal o métrica;
- intención de negocio;
- criterio para justificar continuidad.

No generar fricción artificial solo porque exista una solución.

---

## 4. Input

Input mínimo recomendado:

```text
raw_input
initial_entry_state
current_frame
primary_intent
secondary_intents
extracted_context
ambiguities
provenance
```

Campos especialmente relevantes desde Context Extraction:

- `solution`
- `initiatives_mentioned`
- `goal`
- `metric`
- `target`
- `problem`
- `opportunity`
- `decision_need`
- `constraints`
- `operating_context`
- `success_conditions`
- `quality_guardrails`
- `missing_obvious_context`

No requiere:

- Organization
- StrategicFront
- Challenge
- Project canónico
- Step
- Decision canónica
- archivos
- RAG
- evidencia externa

---

## 5. Output conceptual

```text
ReverseAlignmentResult
├── reverse_alignment_required
├── subject_type
├── subject
├── connection_state
├── present_links
├── missing_links
├── ambiguities
├── suggested_focus
├── provenance
├── activation_reason
└── status
```

### `status`

Valores conceptuales:

- `not_required`
- `partial`
- `required`
- `insufficient_input`

### `subject_type`

Valores conceptuales:

- `solution`
- `initiative`
- `unknown`

### `activation_reason`

Puede indicar conceptualmente:

- `initial_solution_or_initiative`
- `late_solution_detected`
- `late_initiative_detected`
- `existing_subject_reassessment`

No requiere todavía schema técnico final.

---

## 6. Cadena de alineamiento inverso

El skill evalúa esta secuencia:

```text
solución / iniciativa
→ cambio esperado
→ métrica o señal
→ intención de negocio
→ criterio para justificar continuidad
```

El objetivo no es completar la cadena por fuerza.

El objetivo es detectar:

```text
qué ya está conectado
qué sigue faltando
qué gap es realmente material
```

---

## 7. Definición de cada enlace

### 7.1. Solución / iniciativa

Qué quiere hacer el usuario o qué unidad de trabajo ya existe.

Ejemplos normativos:

- chatbot comercial;
- automatización de compras;
- piloto de inspección automatizada;
- nuevo canal digital.

### 7.2. Cambio esperado

Qué debería cambiar en la realidad si funciona.

Ejemplos:

- reducir tiempo de respuesta;
- disminuir trabajo manual;
- mejorar conversión;
- reducir errores;
- acelerar aprobación.

No confundir cambio con solución.

### 7.3. Métrica o señal

Cómo podría observarse que el cambio ocurrió.

Puede ser:

- métrica explícita;
- señal cualitativa;
- condición observable.

No inventar KPI.

### 7.4. Intención de negocio

Por qué ese cambio importa.

Ejemplos:

- crecer ingresos;
- reducir costos;
- reducir riesgo;
- mejorar experiencia;
- aumentar capacidad;
- proteger calidad.

No crear StrategicFront.

### 7.5. Criterio para justificar continuidad

Qué tendría que ser verdad para que tenga sentido seguir invirtiendo tiempo o recursos.

Puede expresarse como:

- demostrar una señal mínima;
- resolver una incertidumbre crítica;
- cumplir una condición;
- observar impacto suficiente.

No convertir todavía este criterio en:

- gate;
- threshold canónico;
- experimento;
- decisión.

---

## 8. Operating context no equivale a alineamiento

El skill puede utilizar `operating_context` para comprender restricciones o condiciones.

Ejemplo:

```text
operating_model = venture building
```

no significa automáticamente:

```text
business_intent = crear ventures
```

Ejemplo:

```text
existing_program_or_process = aceleradora interna
```

no significa automáticamente que la iniciativa esté alineada con esa aceleradora.

Contexto ayuda a interpretar.

No confirma alineamiento.

---

## 9. Success conditions y quality guardrails

`success_conditions` pueden aportar señales sobre el cambio esperado.

`quality_guardrails` pueden aportar restricciones sobre lo que no debe degradarse.

Pero no deben transformarse automáticamente en:

- KPI;
- target;
- criterio de continuidad;
- hard gate.

Ejemplo:

> Queremos automatizar sin perder precisión.

Puede interpretarse como:

```text
expected_change = reducir trabajo manual
quality_guardrail = precisión
```

No como:

```text
continuity_criterion = precisión > 95%
```

si el usuario nunca declaró ese umbral.

---

## 10. Activación tardía

### RA-01

Si una solución aparece después del primer turno, el skill puede activarse en esa actualización.

Ejemplo:

Turno inicial:

> Queremos reducir el tiempo dedicado a inspecciones.

Después:

> Ya estamos probando un robot móvil para hacer parte del recorrido.

Esperado:

```text
initial_entry_state = problem_first
current_frame = initiative_first
subject_type = initiative
reverse_alignment_required = true
activation_reason = late_initiative_detected
```

No esperado:

```text
initial_entry_state = initiative_first
```

---

## 11. Solution-first con justificación débil

### RA-02

Input:

> Quiero implementar un chatbot para ventas.

Esperado:

```text
reverse_alignment_required = true
subject_type = solution
subject = chatbot para ventas

missing_links:
- cambio esperado
- métrica/señal
- intención de negocio
- criterio de continuidad
```

---

## 12. Solution-first parcialmente conectada

### RA-03

Input:

> Quiero implementar un chatbot para responder más rápido a los leads.

Esperado:

```text
present_links:
- solution
- cambio esperado

missing_links:
- intención de negocio
- criterio de continuidad
```

Puede faltar una métrica/señal más explícita.

No inventar conversión.

---

## 13. Initiative-first suficientemente conectada

### RA-04

Input:

> Tenemos una iniciativa para automatizar aprobaciones. Queremos reducir el tiempo promedio de 5 días a 2 porque hoy perdemos ventas por demora.

Esperado:

```text
subject_type = initiative
reverse_alignment_required = false
```

o:

```text
status = partial
```

si falta un criterio explícito de continuidad pero la justificación ya es suficientemente clara para Portfolio Entry.

No exigir completitud metodológica.

---

## 14. Solución disfrazada de problema

### RA-05

Input:

> El problema es que no tenemos una app para clientes.

Esperado:

```text
subject_type = solution
subject = app para clientes
reverse_alignment_required = true
```

La ausencia de artefacto no debe aceptarse automáticamente como problema de negocio.

---

## 15. Iniciativa con nombre pero sin contenido

### RA-06

Input:

> Quiero revisar Proyecto Atlas.

Esperado:

```text
subject_type = initiative
subject = Proyecto Atlas
status = insufficient_input
```

No inferir qué hace Atlas.

---

## 16. Múltiples soluciones o iniciativas

Input:

> Estamos evaluando un chatbot y un nuevo canal digital para ventas.

El skill puede:

- identificar múltiples subjects;
- marcar ambigüedad;
- devolver `partial`;
- señalar que falta foco.

No puede:

- elegir cuál es mejor;
- priorizarlas;
- diseñar dos iniciativas;
- compararlas comercialmente.

---

## 17. No forzar completitud total

La cadena de reverse alignment es una guía de suficiencia.

No exigir siempre:

- target numérico;
- baseline;
- KPI formal;
- ROI;
- business case;
- evidencia validada;
- tamaño de mercado;
- diseño de piloto.

Portfolio Entry necesita entender la justificación, no completar un business case.

---

## 18. Suggested focus

Puede devolver un foco breve para Question Planner.

Ejemplos normativos:

```text
"Clarificar qué cambio debería producir la solución."
```

```text
"Conectar la iniciativa con una señal observable de valor."
```

```text
"Clarificar qué tendría que ser verdad para justificar continuar."
```

No debe formular todavía la pregunta final.

---

## 19. Provenance

Cada enlace detectado debe conservar origen.

Ejemplo:

Input:

> Quiero implementar un chatbot para responder más rápido.

```text
solution:
  value = chatbot
  origin = EXTRACTED_FROM_USER_TEXT

expected_change:
  value = responder más rápido
  origin = EXTRACTED_FROM_USER_TEXT
```

Si Starteria propone una posible señal:

```text
metric_signal:
  value = tiempo de respuesta
  origin = AI_SUGGESTED
  review_disposition = UNREVIEWED
```

No debe reaparecer después como:

```text
origin = USER_DECLARED
```

sin confirmación humana.

---

## 20. Regla de no invención

No inventar:

- KPI;
- target;
- baseline;
- ROI;
- impacto;
- business case;
- stakeholder;
- problema;
- causalidad;
- evidencia;
- criterio de continuidad;
- umbral de escalamiento.

Si falta un enlace:

```text
missing_links = [...]
```

Ese es un output correcto.

---

## 21. Frontera con diseño de experimento

Este skill puede decir:

```text
"Falta demostrar que la solución reduce el esfuerzo manual sin degradar precisión."
```

No puede decir:

```text
"Compara 10 recorridos manuales contra 10 recorridos automatizados y mide..."
```

Puede decir:

```text
"Falta una señal de intención de compra."
```

No puede diseñar:

- canal de prueba;
- muestra;
- experimento;
- protocolo;
- threshold;
- test card;
- MVP;
- piloto detallado.

Eso pertenece a etapas posteriores.

---

## 22. Boundary con Question Planner

Este skill determina:

- qué está conectado;
- qué falta;
- qué gap es material;
- por qué se activó.

`entry-04-question-planner` decide:

- si hace falta preguntar;
- cuál pregunta tiene mayor valor;
- wording;
- orden;
- cantidad.

---

## 23. Boundary con Clarification Session

Durante una sesión multi-turn, este skill puede volver a ejecutarse cuando:

- aparece una solución;
- aparece una iniciativa;
- cambia materialmente el contexto;
- el usuario responde una pregunta crítica.

Pero no gobierna:

- cuántas preguntas quedan;
- cuándo termina la sesión;
- qué CTA mostrar;
- cómo componer el handoff.

---

## 24. Boundary con Steps

Este skill NO es Step 0.

No puede:

- abrir cycle;
- crear Step state;
- definir success criteria canónicos;
- crear evidence requirements;
- convertir gaps en hard gates;
- diseñar experimentación;
- activar Step 0 o Step 2.

Su función termina antes de Initiative Core.

---

## 25. Casos mínimos de aceptación

Los siguientes son ejemplos normativos del contrato, no evidencia de testing.

### Caso A — solución sin justificación

Input:

> Quiero implementar un chatbot para ventas.

Esperado:

- reverse alignment requerido;
- solution detectada;
- falta cambio esperado;
- falta métrica/señal;
- falta intención de negocio;
- no crear Initiative.

### Caso B — solución parcialmente conectada

Input:

> Quiero implementar un chatbot para responder más rápido a los leads.

Esperado:

- solution presente;
- cambio esperado presente;
- faltan intención de negocio y criterio de continuidad;
- no inventar conversión.

### Caso C — solución mejor conectada

Input:

> Queremos un chatbot para responder leads en menos de 5 minutos porque perdemos oportunidades cuando demoramos.

Esperado:

- solution presente;
- cambio esperado presente;
- señal presente;
- intención de negocio presente/parcial;
- reverse alignment puede ser partial o no requerido;
- no inventar baseline.

### Caso D — iniciativa existente

Input:

> Tenemos una iniciativa de automatización de compras y no sabemos si deberíamos seguir.

Esperado:

- `subject_type = initiative`;
- reverse alignment requerido si no hay conexión con resultado;
- no decidir continuidad.

### Caso E — solución disfrazada de problema

Input:

> El problema es que no tenemos una app para clientes.

Esperado:

- detectar artefacto/solución implícita;
- no aceptar la ausencia de app como problema de negocio suficiente;
- reverse alignment requerido.

### Caso F — iniciativa suficientemente conectada

Input:

> La iniciativa busca reducir de 10 a 5 días el onboarding para reducir abandono de nuevos clientes.

Esperado:

- cadena suficientemente conectada;
- no forzar preguntas extra;
- reverse alignment no requerido o partial.

### Caso G — activación tardía

Turno inicial:

> Los equipos pierden tiempo haciendo inspecciones.

Después:

> Ya existe un piloto con una tecnología para automatizar los recorridos.

Esperado:

```text
initial_entry_state = problem_first
current_frame = initiative_first
reverse_alignment_required = true
activation_reason = late_initiative_detected
```

### Caso H — Step leakage prohibido

Input:

> Tenemos un piloto para automatizar inspecciones y queremos saber si vale la pena ampliarlo.

Esperado:

- identificar qué debe conectarse para justificar continuidad;
- no diseñar el experimento;
- no definir sample size;
- no definir threshold;
- no activar Step.

---

## 26. Operaciones prohibidas

Este skill no puede:

- decidir viabilidad;
- recomendar tecnología;
- descartar solución;
- comparar soluciones;
- priorizar iniciativas;
- validar fit;
- calcular ROI;
- crear Project;
- activar Step 0;
- definir gates;
- diseñar experimentos;
- crear success criteria canónicos;
- consultar fuentes externas;
- formular decisión final.

---

## 27. Criterios de aceptación

El skill cumple si:

- usa `current_frame` para activación;
- preserva `initial_entry_state`;
- puede activarse tarde;
- distingue solución de cambio esperado;
- distingue cambio de métrica/señal;
- distingue métrica de intención de negocio;
- identifica enlaces faltantes sin rellenarlos;
- usa operating context sin confundirlo con alineamiento;
- respeta success conditions y quality guardrails sin convertirlos en KPIs;
- conserva provenance;
- no invade Step 0/Step 2;
- puede concluir `not_required`.

---

## 28. Anti-patterns

No implementar:

- activar reverse alignment solo en el primer turno;
- cambiar `initial_entry_state` para poder activarlo;
- “toda solución está mal hasta demostrar lo contrario”;
- interrogatorio metodológico largo;
- business case automático;
- success criteria inventados;
- KPI sugerido como hecho;
- gate automático;
- diseño de experimento;
- recomendación de tecnología;
- benchmark externo;
- salto directo a Step 0.

---

## 29. Decisiones reservadas para testing

No congelar todavía:

- cuántos enlaces mínimos hacen suficiente la cadena;
- si `criterion_for_continuity` debe aparecer siempre;
- threshold de activación;
- score de completeness;
- confidence numérico;
- schema final de `activation_reason`;
- wording visible;
- modelo IA;
- prompt final.

Estas decisiones deben validarse con harness y casos reales.

---

## 30. Definition of Done

Antes de pasar a `entry-04-question-planner` v0.2:

- [ ] activación tardía aceptada;
- [ ] uso de `current_frame` aceptado;
- [ ] preservación de `initial_entry_state` aceptada;
- [ ] cadena de reverse alignment aceptada;
- [ ] regla de no completitud obligatoria aceptada;
- [ ] operating context no tratado como alineamiento;
- [ ] provenance reforzada aceptada;
- [ ] boundary con Question Planner aceptada;
- [ ] boundary con Clarification Session aceptada;
- [ ] frontera con diseño de experimento aceptada;
- [ ] no invasión de Step 0/Step 2 aceptada.

---

## 31. Principio final

> Starteria debe poder descubrir una solución tarde sin olvidar desde dónde empezó el usuario.

Y:

> Reverse Alignment identifica qué justificación falta; no diseña todavía cómo producir la evidencia para justificarla.
