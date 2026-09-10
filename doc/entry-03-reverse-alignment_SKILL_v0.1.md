# Starteria — Skill Contract: entry-03-reverse-alignment

**Documento:** `SKILL.md`
**Skill ID:** `entry-03-reverse-alignment`
**Versión:** v0.1
**Estado:** PROPUESTO PARA REVISIÓN
**Fecha:** 2026-09-09
**Tipo:** Skill Contract
**Agente padre:** Portfolio Entry Agent / Orchestrator
**Vertical slice:** Pantalla 1 — Portfolio Entry

---

## 0. Autoridad

Este skill está subordinado a:

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados
3. `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
4. `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md`
5. `entry-01-intent-detection/SKILL.md`
6. `entry-02-context-extraction/SKILL.md`

Este skill no redefine autoridad IA, taxonomías, dominio canónico ni lógica de Steps.

---

## 1. Propósito

Evaluar si una entrada `solution_first` o `initiative_first` tiene suficiente conexión con una intención de negocio como para continuar sin confundir una solución o iniciativa con su justificación.

Debe responder:

> ¿Qué tendría que estar conectado entre esta solución/iniciativa y el resultado de negocio para que tenga sentido seguir trabajándola?

No debe responder:

- si la solución es buena o mala;
- si debe implementarse;
- si la iniciativa debe continuar;
- si existe fit;
- si hay evidencia suficiente para escalar;
- si debe entrar a Step 0.

---

## 2. Cuándo se activa

Se activa cuando:

```text
entry_state = solution_first
```

o:

```text
entry_state = initiative_first
```

y falta una conexión suficiente con:

- cambio esperado;
- métrica o señal;
- intención de negocio;
- criterio para justificar continuidad.

Puede no activarse si la cadena ya está suficientemente expresada en el input.

---

## 3. Input

Input mínimo recomendado:

```text
raw_input
entry_state
primary_intent
secondary_intents
extracted_context
ambiguities
provenance
```

Campos especialmente relevantes desde context extraction:

- `solution`
- `initiatives_mentioned`
- `goal`
- `metric`
- `target`
- `problem`
- `opportunity`
- `decision_need`
- `constraints`
- `missing_obvious_context`

No requiere:

- Organization
- StrategicFront
- Challenge
- Project
- Step
- Decision
- archivos
- RAG
- evidencia externa

---

## 4. Output conceptual

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

---

## 5. Cadena de alineamiento inverso

El skill evalúa esta secuencia:

```text
solución / iniciativa
→ cambio esperado
→ métrica o señal
→ intención de negocio
→ criterio para justificar continuidad
```

No es obligatorio que todos los elementos estén explícitos para continuar.

El objetivo es identificar **qué enlaces críticos faltan**, no rellenarlos.

---

## 6. Definición de cada enlace

### 6.1 Solución / iniciativa

Qué quiere hacer o qué unidad de trabajo ya existe.

Ejemplos:

- chatbot comercial;
- automatización de compras;
- proyecto Atlas;
- nuevo canal digital.

### 6.2 Cambio esperado

Qué debería cambiar en la realidad si funciona.

Ejemplos:

- reducir tiempo de respuesta;
- aumentar conversión;
- reducir errores;
- mejorar retención;
- acelerar aprobación.

No confundir con la solución.

### 6.3 Métrica o señal

Cómo podría observarse que ese cambio ocurrió.

Puede ser:

- una métrica explícita;
- una señal cualitativa;
- una condición observable.

No inventar KPI técnico.

### 6.4 Intención de negocio

Por qué ese cambio importa al negocio.

Ejemplos:

- crecer ingresos;
- mejorar margen;
- reducir riesgo;
- mejorar experiencia;
- aumentar capacidad;
- cumplir regulación.

No crear StrategicFront.

### 6.5 Criterio para justificar continuidad

Qué tendría que ser verdad para que tenga sentido seguir invirtiendo tiempo o recursos.

No equivale a una decisión final.

Puede expresarse como:

- demostrar señal mínima;
- resolver una incertidumbre crítica;
- cumplir una condición;
- mostrar impacto suficiente.

No debe convertirse todavía en gate de Step.

---

## 7. Regla fundamental

> El skill no cuestiona la existencia de la solución; cuestiona si su justificación está suficientemente conectada.

Su función es **hacer explícita la lógica faltante**, no desacreditar la idea del usuario.

---

## 8. Reglas de activación

### RA-01 — solution-first con justificación débil

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

### RA-02 — solution-first con parte de la cadena presente

Input:

> Quiero implementar un chatbot para responder más rápido a los leads y mejorar conversión.

Esperado:

```text
reverse_alignment_required = true
present_links:
- solution
- cambio esperado
- intención/resultado parcial
missing_links:
- métrica/señal concreta o criterio de continuidad
```

### RA-03 — initiative-first con lógica suficiente

Input:

> Tenemos una iniciativa para automatizar aprobaciones. Buscamos reducir el tiempo promedio de 5 días a 2 este trimestre porque hoy estamos perdiendo ventas por demora.

Esperado:

```text
reverse_alignment_required = false o partial
```

No generar fricción artificial si la lógica ya está suficientemente conectada.

---

## 9. No forzar completitud total

La cadena es una guía de suficiencia, no un formulario obligatorio.

No exigir siempre:

- target numérico;
- baseline;
- KPI formal;
- business case;
- ROI;
- evidencia validada.

Pantalla 1 solo necesita detectar si existe una justificación suficientemente comprensible para continuar.

---

## 10. Manejo de problem-first y opportunity-first

Este skill no se activa por defecto para:

```text
problem_first
opportunity_first
strategy_first
portfolio_first
reporting_first
decision_first
```

salvo que el orquestador detecte que el usuario introdujo además una solución o iniciativa concreta cuya justificación deba revisarse.

---

## 11. Manejo de múltiples soluciones/iniciativas

Input:

> Estamos evaluando un chatbot y un nuevo canal de WhatsApp para ventas.

El skill debe evitar diseñar dos iniciativas completas.

Puede:

- identificar múltiples subjects;
- marcar que existe más de una solución;
- devolver `ambiguous` o `partial`;
- preparar foco para question planning.

No debe elegir automáticamente cuál es mejor.

---

## 12. Manejo de solución disfrazada de problema

Input:

> El problema es que no tenemos chatbot.

El skill debe detectar que la formulación representa una **ausencia de solución**, no necesariamente un problema de negocio.

Esperado:

```text
subject_type = solution
subject = chatbot
reverse_alignment_required = true
```

Y señalar que falta describir el cambio o problema que justificaría esa solución.

---

## 13. Manejo de iniciativa con nombre pero sin contenido

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

## 14. Manejo de ambigüedad

Input:

> Tenemos una iniciativa para mejorar ventas.

No está claro si:

- “mejorar ventas” es la solución;
- es el goal;
- falta describir la iniciativa.

El skill debe preservar ambigüedad y no inventar estructura.

---

## 15. Manejo de contradicción

Input:

> Queremos reducir tiempos, aunque el objetivo principal en realidad es aumentar margen.

El skill puede conservar ambos enlaces si no son incompatibles.

Si existe conflicto material, lo reporta como ambigüedad.

No decide cuál es la intención correcta.

---

## 16. Suggested focus

El skill puede devolver un foco breve para ayudar al question planner.

Ejemplos:

```text
"Clarificar qué cambio de negocio debería producir el chatbot."
```

```text
"Conectar la iniciativa Atlas con una señal observable de impacto."
```

No debe formular todavía la pregunta final al usuario.

---

## 17. Provenance

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

Si se infiere que “tiempo de respuesta” podría ser una señal:

```text
metric_signal:
value = tiempo de respuesta
origin = AI_INFERRED
review_disposition = UNREVIEWED
```

No confirmar automáticamente.

---

## 18. Regla de no invención

No inventar:

- KPI;
- target;
- baseline;
- ROI;
- impacto;
- business case;
- stakeholder;
- criterio de éxito;
- problema;
- causalidad;
- evidencia.

Si falta un enlace, el output correcto es:

```text
missing_links = [...]
```

no rellenarlo.

---

## 19. Boundary con question planner

Este skill determina:

- qué está conectado;
- qué falta;
- qué enlace es materialmente importante.

`entry-04-question-planner` decide:

- si hace falta preguntar;
- cuál pregunta tiene mayor valor;
- orden;
- cantidad;
- wording.

---

## 20. Boundary con Steps

Este skill NO es Step 0.

No puede:

- abrir un cycle;
- crear Step state;
- definir success criteria canónicos;
- crear evidence requirements;
- convertir gaps en hard gates;
- iniciar experimentation.

Su función termina antes del Initiative Core.

---

## 21. Casos mínimos de aceptación

### Caso A — solución sin justificación

Input:
> Quiero implementar un chatbot para ventas.

Esperado:
- reverse alignment requerido;
- solution detectada;
- falta cambio esperado;
- falta métrica/señal;
- falta intención de negocio;
- no Initiative.

### Caso B — solución parcialmente conectada

Input:
> Quiero implementar un chatbot para responder más rápido a los leads.

Esperado:
- solution presente;
- cambio esperado presente;
- faltan business intent y criterio de continuidad;
- no inventar conversión como objetivo.

### Caso C — solución mejor conectada

Input:
> Queremos un chatbot para responder leads en menos de 5 minutos porque estamos perdiendo oportunidades comerciales cuando demoramos.

Esperado:
- solution presente;
- expected change presente;
- signal presente;
- business intent parcial/presente;
- reverse alignment puede ser partial o no requerido;
- no inventar baseline.

### Caso D — iniciativa existente

Input:
> Tenemos una iniciativa de automatización de compras y no sabemos si deberíamos seguir.

Esperado:
- subject_type = initiative;
- initiative governance context;
- reverse alignment requerido si no hay conexión a resultado;
- no decidir continuidad.

### Caso E — solución disfrazada de problema

Input:
> El problema es que no tenemos una app para clientes.

Esperado:
- detectar solución/artefacto implícito;
- no aceptar “falta app” automáticamente como problema de negocio;
- reverse alignment requerido.

### Caso F — initiative-first suficientemente conectada

Input:
> Atlas busca reducir de 10 a 5 días el onboarding para reducir abandono de nuevos clientes este trimestre.

Esperado:
- cadena suficientemente conectada;
- no forzar preguntas extra;
- reverse alignment no requerido o partial.

### Caso G — input insuficiente

Input:
> Proyecto Atlas.

Esperado:
- subject_type = initiative;
- status = insufficient_input;
- no inferir propósito.

---

## 22. Operaciones prohibidas

Este skill no puede:

- decidir viabilidad;
- recomendar solución;
- descartar solución;
- comparar soluciones;
- priorizar iniciativas;
- validar fit;
- calcular ROI;
- crear Project;
- activar Step 0;
- definir gates;
- consultar fuentes externas;
- formular la decisión final.

---

## 23. Criterios de aceptación

El skill cumple si:

- se activa principalmente en solution-first / initiative-first;
- distingue solución de cambio esperado;
- distingue cambio de métrica/señal;
- distingue métrica de intención de negocio;
- identifica enlaces faltantes sin rellenarlos;
- no fuerza completitud total;
- no convierte la cadena en formulario;
- no invade Step 0;
- conserva provenance;
- resiste solución disfrazada de problema;
- puede concluir `not_required`.

---

## 24. Anti-patterns

No implementar:

- “toda solución está mal hasta demostrar lo contrario”;
- interrogatorio metodológico largo;
- business case automático;
- success criteria inventados;
- KPI sugerido como hecho;
- gate automático;
- scoring de calidad;
- recomendación de tecnología;
- benchmark externo;
- salto directo a Step 0.

---

## 25. Decisiones reservadas para test/harness

No congelar todavía:

- cuántos enlaces mínimos hacen suficiente la cadena;
- si `criterion_for_continuity` debe aparecer siempre;
- threshold de activación;
- score de completeness;
- confidence numérico;
- wording visible;
- modelo IA;
- prompt final.

Estas decisiones deben validarse con casos reales.

---

## 26. Definition of Done

Antes de pasar a `entry-04-question-planner`:

- [ ] trigger aceptado;
- [ ] cadena de reverse alignment aceptada;
- [ ] definición de cada enlace aceptada;
- [ ] regla de no completitud obligatoria aceptada;
- [ ] manejo de solución disfrazada de problema aceptado;
- [ ] boundary con Step 0 aceptada;
- [ ] boundary con question planner aceptada;
- [ ] no existen decisiones técnicas prematuras.

---

## 27. Principio final

> Starteria no debe empezar ayudando a ejecutar una solución que todavía no sabe justificar.

Y:

> Reverse alignment conecta una solución con una razón de negocio; no convierte esa razón en una verdad confirmada.
