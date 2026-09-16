# STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1

**Estado:** Draft para validación de producto/diseño
**Propósito:** Definir cómo opera, se representa y cambia de función el Copilot de Starteria a lo largo de Portfolio Entry, Portfolio Lead, creación/activación, Initiative Overview, Steps, Review y Decision Brief.
**Ámbito:** Interacción IA visible + relación con UI estructurada + autoridad/provenance + comportamiento por contexto.
**Dependencias:**
- `STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
- `STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
- Portfolio Entry Agent / Skill / Clarification-Handoff Contracts vigentes
- Core Logic Contract de Starteria

**Regla:** Este documento define experiencia e interacción. No expande autoridad de IA, no redefine Core, no modifica Step 0â€“4 y no convierte recomendaciones IA en decisiones organizacionales.

---

# 0. Principio central

El Copilot de Starteria no es un chat genérico permanente.

Debe funcionar como una **capa cognitiva contextual** que cambia de job según el momento del journey.

```text
Landing
â†’ implícito

Portfolio Entry
â†’ entender

Clarification
â†’ aclarar

Handoff
â†’ orientar

Portfolio Home
â†’ priorizar atención

Strategic Front
â†’ leer cobertura

Challenge
â†’ estructurar

Activation
â†’ recomendar modalidad

Initiative Overview
â†’ contextualizar

Step 0â€“4
â†’ guiar el trabajo

Review
â†’ criticar / detectar gaps

Decision Brief
â†’ sintetizar / plantear preguntas estratégicas

Return to Portfolio
â†’ explicar impacto de la decisión
```

La experiencia debe sentirse consistente sin obligar a utilizar el mismo componente visual en todos los contextos.

---

# 1. Tesis de interacción

Starteria debe operar bajo esta lógica:

```text
USUARIO
expresa / trabaja / decide
        â†“
COPILOT
interpreta / estructura / cuestiona / sugiere
        â†“
SISTEMA
preserva estado / provenance / permisos / trazabilidad
        â†“
HUMANO
confirma / corrige / decide cuando aplica
```

Principio:

> La IA razona; el sistema gobierna; las personas conservan la autoridad organizacional.

---

# 2. Lo que el Copilot sí puede hacer

Según el contexto y contrato aplicable, puede:

- interpretar lenguaje natural;
- extraer contexto;
- identificar intención;
- detectar ambigÃ¼edad;
- detectar gaps;
- formular preguntas;
- resumir;
- estructurar;
- comparar;
- criticar;
- señalar riesgos;
- sugerir alternativas;
- recomendar rutas;
- explicar por qué una recomendación parece razonable;
- preparar una decisión;
- mapear gaps a capacidades de Starteria;
- contextualizar siguiente acción.

---

# 3. Lo que el Copilot no puede hacer

No puede:

- confirmar estrategia sin intervención humana;
- confirmar alineamiento organizacional;
- inventar evidencia;
- inventar KPI, baseline, target o restricciones;
- decidir inversión;
- decidir cierre;
- declarar éxito;
- declarar duplicidad definitiva;
- declarar cobertura real sin contexto suficiente;
- crear autoridad organizacional;
- mutar silenciosamente objetos críticos;
- activar Steps como consecuencia de una recomendación;
- reemplazar la decisión de Portfolio Lead, Sponsor, Mentor u otra autoridad;
- presentar `AI_SUGGESTED` como `USER_CONFIRMED`.

---

# 4. Modos cognitivos del Copilot

El sistema tendrá inicialmente nueve modos de interacción.

## 4.1 `understand`

### Job
Entender qué necesita conseguir o comprender el usuario.

### Uso
- Portfolio Entry
- primeras entradas ambiguas

### Output visible
- síntesis breve;
- lectura provisional;
- señal de qué se entendió.

---

## 4.2 `clarify`

### Job
Reducir incertidumbre material con la menor cantidad de preguntas.

### Uso
- Quick Clarification
- Guided Exploration

### Output visible
- pregunta;
- motivo implícito o breve;
- progreso de aclaración.

### Regla
No convertirlo en entrevista ilimitada.

---

## 4.3 `orient`

### Job
Mostrar una ruta posible y qué puede ayudar a resolver Starteria.

### Uso
- Handoff
- pre-registro

### Output visible
- recommended approach;
- alternatives cuando aplique;
- starteria path;
- gaps;
- CTA.

---

## 4.4 `prioritize_attention`

### Job
Ayudar al Portfolio Lead a identificar dónde intervenir primero.

### Uso
- Portfolio Home
- Decisions
- Attention Queue

### Output visible
- por qué algo requiere atención;
- riesgo;
- posible siguiente acción;
- orden sugerido de revisión.

### Regla
No tomar la decisión.

---

## 4.5 `structure`

### Job
Ayudar a convertir lenguaje ambiguo en una estructura operable.

### Uso
- Create Strategic Front
- Create Challenge
- Challenge setup
- Activation setup

### Output visible
- reformulación sugerida;
- acotación;
- missing context;
- recommendation.

---

## 4.6 `contextualize`

### Job
Ayudar al usuario a comprender el contexto actual de una iniciativa o elemento.

### Uso
- Initiative Overview
- Strategic Front
- Challenge Detail

### Output visible
- qué significa el estado;
- qué está heredado;
- qué falta;
- qué relación existe con el contexto superior.

---

## 4.7 `guide`

### Job
Acompañar el trabajo dentro de Step 0â€“4.

### Uso
- Initiative Workspace

### Output visible
- preguntas de apoyo;
- explicación;
- ejemplos;
- suggestions;
- checkpoints;
- next action.

### Regla
No sustituye el contenido del usuario ni produce evidencia externa por sí sola.

---

## 4.8 `critique`

### Job
Revisar lo existente y señalar fortalezas, gaps y riesgos.

### Uso
- AI Review
- pre-review;
- Step review support.

### Output visible
- qué está bien;
- qué falta;
- por qué importa;
- siguiente acción.

---

## 4.9 `synthesize_decision`

### Job
Convertir evidencia y aprendizaje en una lectura útil para decisión.

### Uso
- Initiative Brief
- Decision Brief
- Return to Portfolio

### Output visible
- síntesis;
- 3 preguntas estratégicas;
- conclusión razonada;
- rutas posibles;
- incertidumbre;
- límites.

### Regla
El Copilot prepara la decisión. No la toma.

---

# 5. Estados visibles de una intervención IA

Toda intervención material debe poder representarse como uno de estos estados:

```text
AI_SUGGESTED
UNREVIEWED
USER_CONFIRMED
USER_REJECTED
REQUIRES_REVIEW
SUPERSEDED
```

Estos estados no deben ser solo internos.

La UI debe poder diferenciarlos cuando la distinción sea material.

---

# 6. Tipos visuales de intervención

El Copilot no se representa siempre como panel lateral.

## 6.1 `InlineInsight`

Uso:
- pequeño insight;
- alerta contextual;
- sugerencia dentro del contenido.

Ejemplo:

```text
âœ¦ Mirada Starteria
Este reto todavía parece demasiado amplio para activarlo.
```

---

## 6.2 `AssistPanel`

Uso:
- Guided Creation;
- forms complejos;
- activación.

Ubicación:
- lateral derecha;
- inline secundaria en mobile.

---

## 6.3 `CopilotPanel`

Uso:
- Portfolio Workspace;
- Initiative Workspace.

Características:
- persistente en desktop;
- contextual;
- collapsible;
- no monopoliza pantalla.

---

## 6.4 `StructuredHandoff`

Uso:
- pre-registro;
- síntesis post-clarification.

No parece chat.

Muestra:
- understanding;
- desired outcome;
- gaps;
- path;
- suggested approach.

---

## 6.5 `ReviewBlock`

Uso:
- AI Review.

Muestra:
- strengths;
- gaps;
- impact;
- next action.

---

## 6.6 `DecisionSupportBlock`

Uso:
- Decision Brief.

Muestra:
- synthesis;
- 3 strategic questions;
- conclusion;
- paths.

---

# 7. Copilot por superficie

## 7.1 Landing

### Presencia
Implícita.

### Objetivo
Hacer que la propuesta de valor se entienda.

### No hacer
- chat bubble flotante;
- panel lateral;
- pedir registro antes de valor.

---

## 7.2 Portfolio Entry

### Modo
`understand`

### Interacción
Input principal del usuario.

### Visible
Starteria responde con una lectura inicial cuando corresponda.

### Ejemplo

```text
âœ¦ Starteria
Entiendo que necesitas saber qué iniciativas contribuyen realmente a tus prioridades antes de decidir dónde concentrar seguimiento.
```

---

## 7.3 Clarification

### Modo
`clarify`

### Visible
- pregunta;
- estado de progreso;
- posibilidad de continuar con incertidumbre.

### Quick Clarification

```text
Aclaración 1 de hasta 3
```

### Guided Exploration

```text
Exploración guiada · ronda 1
```

### Regla
Debe existir una salida clara hacia síntesis/handoff.

---

## 7.4 Handoff pre-registro

### Modo
`orient`

### Representación
Structured Handoff.

### Starteria muestra
- what we understood;
- desired outcome;
- decision to enable;
- known context;
- unresolved context;
- recommended approach;
- starteria path.

### No mostrar
Un hilo de chat completo.

---

## 7.5 Portfolio Home

### Modo
`prioritize_attention`

### Ubicación
Copilot Panel.

### Puede
- priorizar alertas;
- explicar por qué importan;
- sugerir dónde entrar;
- comparar atención.

### Ejemplo

```text
âœ¦ Starteria

Hay tres temas que requieren atención.

El más crítico está en el reto â€œExpansión PyMEâ€ porque tiene iniciativas activas pero ninguna evidencia reciente vinculada a la decisión pendiente.

[Revisar reto]
```

---

## 7.6 Strategic Front

### Modo
`contextualize` + `prioritize_attention`

### Puede
- señalar gaps de cobertura;
- resaltar retos sin owner;
- mostrar cobertura insuficiente;
- sugerir crear/revisar un reto.

### No puede
Confirmar que el frente está correctamente cubierto como verdad definitiva.

---

## 7.7 Create Challenge

### Modo
`structure`

### Puede
- sugerir mejor framing;
- alertar amplitud;
- proponer KPI/señal;
- diferenciar corrección, crecimiento, exploración;
- sugerir acotación.

### Aplicación
Siempre opt-in.

Ejemplo:

```text
âœ¦ Starteria sugiere

El reto todavía cubre dos resultados distintos:
- adquisición
- retención

Podrías separarlos o elegir cuál es prioritario ahora.

[Ver reformulación]
```

---

## 7.8 Challenge Detail

### Modo
`contextualize`

### Puede
- explicar cobertura;
- identificar posible solapamiento;
- señalar gaps;
- relacionar iniciativas con el reto.

### Regla
"Possible overlap" â‰  "duplicate".

---

## 7.9 Activation

### Modo
`structure` + recommendation

### Puede
Recomendar modalidad.

### Inputs conceptuales
- urgencia;
- horizonte;
- claridad;
- sensibilidad;
- esfuerzo;
- capacidad.

### Output

```text
Starteria recomienda:
Squad asignado

Porque:
â€¢ urgencia alta
â€¢ dependencia entre áreas
â€¢ poco tiempo disponible
```

### Regla
Humano confirma.

---

## 7.10 Invitation

### Copilot
No visible como panel.

La inteligencia ya se expresa mediante:
- contexto;
- resumen;
- rol;
- qué se espera.

---

## 7.11 Initiative Overview

### Modo
`contextualize`

### Puede
- explicar qué contexto se heredó;
- señalar missing pieces;
- orientar siguiente acción;
- explicar Step actual.

### Ejemplo

```text
âœ¦ Starteria

Antes de entrar a Step 0 ya tienes contexto suficiente sobre el reto, pero todavía falta delimitar qué parte exacta abordará esta iniciativa.
```

---

## 7.12 Step 0â€“4

### Modo
`guide`

El Copilot permanece contextual.

### Puede
- explicar;
- preguntar;
- sugerir;
- revisar;
- mostrar ejemplos;
- ayudar a estructurar outputs.

### No puede
- fabricar evidencia;
- completar el Step silenciosamente;
- cambiar un output del usuario sin consentimiento;
- activar transición por sí mismo.

### Visual
Copilot Panel en desktop.

---

## 7.13 AI Review

### Modo
`critique`

### Representación
ReviewBlock.

### Anatomía

```text
âœ¦ Revisión Starteria

Qué está bien
âœ“ ...

Qué falta
â—‹ ...

Por qué importa
...

Siguiente acción
...
```

### Estado
`AI_SUGGESTED / UNREVIEWED` hasta acción humana relevante.

---

## 7.14 Mentor Review

No es Copilot.

Debe representarse como revisión humana.

Starteria puede:
- ayudar a estructurar el contenido;
- resumir feedback;
- mostrar impacto.

Pero la revisión del mentor debe seguir identificada como humana.

---

## 7.15 Decision Brief

### Modo
`synthesize_decision`

### Representación
DecisionSupportBlock.

### Produce

#### Síntesis
Qué ocurrió y qué significa.

#### 3 preguntas estratégicas
Ejemplo:

1. ¿La evidencia obtenida responde al riesgo que justificó crear la iniciativa?
2. ¿Qué condición tendría que cumplirse para ampliar la inversión?
3. ¿Qué debería cambiar en ownership si deja de ser experimental?

#### Conclusión
Breve, razonada y con incertidumbre visible.

#### Rutas posibles
- iterar;
- pivotear;
- ampliar prueba;
- escalar;
- transferir;
- cerrar con aprendizaje.

### Regla
No seleccionar automáticamente la decisión.

---

## 7.16 Return to Portfolio

### Modo
`contextualize`

### Puede
Explicar qué cambió en el portfolio tras la decisión.

Ejemplo:

```text
La decisión â€œEscalar pruebaâ€ mantiene el reto activo y aumenta su cobertura, pero todavía no cierra el gap de operación a escala.
```

---

# 8. Diseño del panel Copilot

## Header

```text
âœ¦ Starteria
Context label optional
```

No usar:

```text
AI Assistant
Chatbot
Bot
```

como naming visible principal.

---

## Body

Puede incluir:

- insight;
- question;
- suggestion;
- rationale;
- action.

No debe mostrar grandes bloques de texto por defecto.

---

## Footer / actions

Tipos:

```text
Apply
Review
Explore
Ask why
Dismiss
Continue
```

No todas aparecen siempre.

---

# 9. Progressive Disclosure

Copilot debe empezar breve.

Ejemplo:

```text
âœ¦ Mirada Starteria

Hay una señal de posible solapamiento entre dos iniciativas.

[Ver por qué]
```

Al expandir:

```text
Comparten:
- subproblema
- métrica principal
- mismo segmento

Esto no confirma duplicidad.

[Comparar iniciativas]
```

---

# 10. Rationale

Cuando una recomendación material pueda influir en decisión, debe poder responder:

```text
¿Por qué me estás sugiriendo esto?
```

Formato:

```text
Por qué te lo sugerimos
â€¢ signal A
â€¢ signal B
â€¢ gap C
```

Evitar explicaciones extensas de razonamiento interno.

---

# 11. Corrección humana

Cuando el usuario rechaza una interpretación:

```text
Starteria suggestion
â†“
User rejects/corrects
â†“
state = USER_REJECTED / SUPERSEDED
â†“
context updates
```

La UI debe poder mostrar:

```text
Corregido por ti
```

cuando sea útil.

---

# 12. Apply Suggestion pattern

Una sugerencia nunca reemplaza silenciosamente contenido.

Flujo:

```text
Current content
â†“
Starteria suggestion
â†“
Why
â†“
[Apply] [Keep mine] [Edit]
```

Aplicable a:
- framing;
- copy;
- synthesis;
- recommendation.

---

# 13. Clarification vs Recommendation

No mezclar.

## Clarification
Pregunta para entender.

## Recommendation
Propuesta de acción o enfoque.

Ejemplo correcto:

```text
Clarification:
¿Qué decisión necesitas poder tomar mejor?

Recommendation:
Parece más útil ordenar primero las iniciativas existentes antes de abrir una nueva convocatoria.
```

---

# 14. Copilot y estados críticos

Una alerta crítica no puede existir solo en Copilot.

Debe reflejarse en estado estructurado del workspace.

Copilot puede:

```text
explicar
+
dar contexto
+
sugerir acción
```

pero no ser el único lugar donde el usuario descubre el bloqueo.

---

# 15. Copilot y evidencia

Debe distinguir:

```text
evidence
claim
inference
suggestion
```

Ejemplo:

```text
Evidencia:
5 entrevistas realizadas.

Inferencia Starteria:
La fricción parece concentrarse en onboarding.

Sugerencia:
Conviene revisar si el reto debería acotarse a onboarding.
```

---

# 16. Copilot y provenance

Cuando el origen sea relevante, el Copilot puede mostrar:

```text
Basado en:
- información declarada
- evidencia adjunta
- contexto confirmado
```

No es necesario mostrar provenance técnico completo en todo momento.

---

# 17. Copilot y tono

Starteria debe sonar:

- claro;
- directo;
- criterioso;
- cercano;
- no paternalista;
- no excesivamente entusiasta;
- no burocrático.

Evitar:

```text
¡Genial!
¡Increíble!
¡Buen trabajo!
```

como respuesta automática recurrente.

Preferir:

```text
Ya hay suficiente contexto para avanzar.
```

---

# 18. Wording por tipo de intervención

## Interpretation

```text
Esto es lo que entendí...
```

## Suggestion

```text
Starteria sugiere...
```

## Attention

```text
Hay un punto que conviene revisar...
```

## Gap

```text
Todavía falta aclarar...
```

## Recommendation

```text
Con la información actual, parece razonable...
```

## Uncertainty

```text
Aún no hay suficiente evidencia para afirmar...
```

---

# 19. Mobile behavior

Copilot no debe convertirse en una columna minúscula.

En móvil:

```text
inline insight
or
bottom sheet
or
full-screen contextual view
```

Preferred:

- inline for short guidance;
- bottom sheet for review/explanation;
- full-screen for long guided sessions.

---

# 20. Notification behavior

No convertir cada output de Copilot en toast.

Toast solo para:
- confirmation;
- technical event;
- short success/failure.

Insights deben vivir donde el contexto existe.

---

# 21. Copilot loading

No usar simplemente:

```text
Thinking...
```

Preferir estados contextuales:

```text
Revisando cobertura...
Analizando evidencia...
Preparando una síntesis...
Comparando contexto...
```

Sin exponer chain-of-thought.

---

# 22. Failure behavior

Si la IA falla:

```text
No pudimos generar esta lectura.

Tu información sigue guardada.

[Intentar nuevamente]
```

La pantalla estructurada debe seguir siendo usable cuando sea posible.

---

# 23. Empty Copilot state

No llenar panel con contenido genérico.

Ejemplo:

```text
âœ¦ Starteria

Cuando tengas información suficiente en esta iniciativa, aquí aparecerán observaciones y próximos pasos relevantes.
```

Preferible incluso colapsar el panel si no aporta valor.

---

# 24. Eventual memory/context boundary

Copilot puede usar el contexto que la experiencia le proporcione.

No debe insinuar conocimiento no disponible.

UI should communicate when relevant:

```text
Basado en esta iniciativa
Basado en este reto
Basado en tu portafolio
```

---

# 25. Interaction contracts by role

## Portfolio Lead
Copilot prioritizes:
- alignment;
- coverage;
- blockers;
- decisions;
- portfolio attention.

## Initiative Owner
Copilot prioritizes:
- context;
- evidence;
- next action;
- Step guidance.

## Mentor
Copilot may support:
- synthesis;
- evidence navigation;
- missing context.

It does not replace mentor judgment.

## Sponsor
Copilot prioritizes:
- executive synthesis;
- decision context;
- risks;
- implications.

---

# 26. Visual distinction matrix

| Source | Visual treatment |
|---|---|
| User / Human confirmed | neutral/authoritative |
| Starteria suggestion | indigo/lavender subtle |
| Human review | profile/role identified |
| Warning | semantic amber |
| Blocker | semantic danger |
| System state | neutral/status system |

The exact tokens belong to the Design System Contract.

---

# 27. Metrics / UX evaluation

The MVP should eventually observe:

- Copilot open rate;
- suggestion apply rate;
- suggestion reject rate;
- clarification completion;
- guided exploration opt-in;
- recommendation review rate;
- time to next action;
- human correction rate;
- generic-chat feeling in qualitative testing;
- value visibility.

This document does not define analytics implementation yet.

---

# 28. Anti-patterns

Do not implement:

- permanent chatbot bubble over every screen;
- one identical Copilot prompt everywhere;
- AI-generated state changes without confirmation;
- critical information only in chat;
- giant paragraphs in side panel;
- AI recommendation presented as decision;
- assistant persona that celebrates every action;
- unbounded conversation inside Steps;
- Copilot that duplicates visible page content without adding interpretation.

---

# 29. Acceptance checklist

This Copilot Interaction System is ready to freeze when:

- every E2E surface has a Copilot job or explicit no-Copilot rule;
- modes are distinguishable;
- placements are defined;
- human vs AI authority is visible;
- apply/reject/correct patterns are clear;
- Review and Decision support are separated;
- mobile behavior is defined;
- critical state does not depend only on Copilot;
- experimentation remains possible without rewriting the system.

---

# 30. Próximo artefacto

Después de validar este documento:

```text
STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md
```

Ese documento debe convertir:

- E2E architecture;
- Page Anatomy;
- Copilot Interaction System;
- visual direction;

en reglas de implementación:

```text
tokens
typography
semantic colors
spacing
radius
primitives
patterns
AI treatments
status system
responsive
accessibility
experimentation
deprecation
migration
```
