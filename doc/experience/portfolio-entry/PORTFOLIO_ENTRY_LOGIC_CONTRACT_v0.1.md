# Starteria — Portfolio Entry Logic Contract

**Documento:** `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
**Versión:** v0.1
**Estado:** APROBADO COMO BASE DE EXPERIENCIA PARA AUDITORÍA E IMPLEMENTACIÓN
**Fecha de baseline:** 2026-09-09
**Tipo:** Experience Logic Contract
**Vertical slice:** Pantalla 1 — Portfolio Entry / Landing pública
**Usuario prioritario:** Portfolio Lead funcional

## 0. Autoridad

Este contrato está subordinado a:

1. `STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados

Y gobierna sobre:

3. Agent Contracts
4. Skill Contracts
5. Tech Specs
6. Schemas / Tests
7. Frontend / Backend

Si una implementación contradice este contrato o una autoridad superior, el conflicto debe hacerse explícito antes de modificar comportamiento.

---

# 1. Propósito

Permitir que un Portfolio Lead potencial comience desde su realidad, expresada en lenguaje natural, y que Starteria convierta esa entrada en una **interpretación provisional, estructurada y trazable** suficiente para alimentar Pantalla 2, sin crear todavía estructura corporativa canónica.

Pantalla 1 debe demostrar:

1. que Starteria entiende lenguaje de negocio sin exigir su taxonomía;
2. que puede detectar desde qué estado entra el usuario;
3. que puede identificar qué debe aclararse antes de convertir una interpretación en contexto gobernado.

---

# 2. Usuario prioritario

Portfolio Lead funcional: persona responsable de priorizar, activar, seguir, acompañar, reportar o preparar decisiones sobre varias iniciativas o apuestas.

Ejemplos de cargos:
- Innovation Lead
- Transformation Lead
- Product Lead
- Marketing Lead
- Growth Lead
- Operations Lead
- PMO / Strategy Lead

El usuario no debe seleccionar un cargo para poder empezar.

---

# 3. Job de Pantalla 1

> Permitir al usuario explicar qué necesita conseguir o entender y transformar ese input en una interpretación provisional y trazable que permita continuar el diagnóstico.

Pantalla 1 responde:

> ¿Desde qué situación está entrando este usuario y qué sabemos realmente a partir de lo que declaró?

No responde todavía:

> ¿Cuál es la estructura definitiva de su portafolio?

ni:

> ¿Qué debe hacer con cada iniciativa?

---

# 4. Promesa visible

## Headline

**Convierte tus iniciativas en decisiones conectadas al negocio.**

## Pregunta principal

**¿Qué necesitas conseguir o entender de tus iniciativas?**

## Marco de valor

`ALINEAR → DETECTAR → SEGUIR → DECIDIR`

Este marco comunica capacidades futuras; no implica que esas operaciones hayan sido ejecutadas sobre el visitante en Pantalla 1.

---

# 5. Principios de experiencia

## PE-01 — Empezar desde la realidad del usuario

Aceptar lenguaje orientado a objetivo, problema, oportunidad, portfolio, iniciativa, solución, reporting, decisión o incertidumbre.

## PE-02 — No exigir ontología interna

No exigir que el usuario conozca Strategic Front, Challenge, Initiative, Step u otras entidades internas.

## PE-03 — Mínima estructura necesaria

La UX puede representar relaciones simples como `prioridad → iniciativa` sin modificar por ello el modelo canónico corporativo.

## PE-04 — No premiar solution-first con ejecución

Si el usuario entra con una solución o iniciativa definida, Starteria debe verificar la justificación antes de ejecución.

## PE-05 — Entrada flexible, estado estructurado

El input puede ser libre; el output interno debe ser estructurado.

## PE-06 — La IA no transforma incertidumbre en certeza

Una inferencia sigue siendo inferencia hasta confirmación humana cuando corresponda.

## PE-07 — Solo información necesaria para continuar

Pantalla 1 no es onboarding, assessment exhaustivo ni formulario largo.

---

# 6. Alcance

## In scope

- landing pública;
- propuesta de valor;
- textarea libre;
- ejemplos/chips;
- CTA `Analizar mi situación`;
- persistencia provisional;
- detección de intención;
- detección de estado de entrada;
- extracción de contexto declarado;
- identificación de ambigüedades;
- detección de reverse alignment;
- planificación de preguntas críticas;
- handoff estructurado a Pantalla 2;
- preview ilustrativa de valor futuro.

## Out of scope

- creación de Organization;
- creación de StrategicFront;
- creación de Challenge;
- creación de Initiative;
- creación de Step;
- creación de Decision;
- creación de Evidence canónica;
- importación XLSX/CSV/PDF/PPTX/DOCX;
- URLs;
- Drive/SharePoint;
- RAG corporativo;
- detección real de duplicidades;
- reporting;
- priorización definitiva;
- recomendaciones de inversión;
- activación de Steps;
- ejecución de iniciativa.

---

# 7. Inputs permitidos

## Texto libre

Debe aceptar input:
- incompleto;
- no técnico;
- coloquial;
- strategy-first;
- portfolio-first;
- initiative-first;
- solution-first;
- problem-first;
- opportunity-first;
- decision-first;
- reporting-first.

## Ejemplos/chips

Ejemplos base:
- Quiero aumentar las ventas en 200 este trimestre.
- No sé cuáles de mis iniciativas realmente contribuyen a nuestros objetivos.
- Tengo que presentar el estado de mis iniciativas.
- Creo que distintos equipos están trabajando en cosas parecidas.

Seleccionar un ejemplo:
1. lo introduce como input visible;
2. permite edición;
3. no ejecuta análisis sin acción explícita del usuario.

---

# 8. Inputs no permitidos en P0 público

No aceptar:
- XLSX
- CSV
- PDF
- PPTX
- DOCX
- URLs
- Drive
- SharePoint
- archivos corporativos

Puede mostrarse copy del tipo:

> Podrás importar tus iniciativas reales al crear tu espacio.

No mostrar controles inactivos de carga.

---

# 9. Intents

Taxonomía inicial:

- `strategic_goal`
- `portfolio_alignment`
- `portfolio_tracking`
- `portfolio_prioritization`
- `portfolio_reporting`
- `initiative_governance`
- `unknown`

Reglas:
- puede existir intent primario y secundarios;
- `unknown` es válido;
- no forzar clasificación sin soporte suficiente.

---

# 10. Entry States

Taxonomía inicial:

- `strategy_first`
- `portfolio_first`
- `initiative_first`
- `solution_first`
- `problem_first`
- `opportunity_first`
- `decision_first`
- `reporting_first`
- `unknown`

Intent y Entry State son conceptos distintos.

---

# 11. Contexto provisional extraíble

Solo cuando exista soporte en el texto:

- goal;
- metric;
- target;
- baseline;
- horizon;
- problem;
- opportunity;
- solution;
- portfolio_size;
- initiatives_mentioned;
- decision_need;
- reporting_need;
- constraints.

La ausencia de un campo no es un error.

---

# 12. Reglas de extracción

## EX-01 — No inventar

Nunca generar baseline, target, KPI, evidencia o restricciones que el usuario no haya declarado o que no puedan extraerse del texto.

## EX-02 — Diferenciar extracción e interpretación

Un valor estructurado extraído del texto y una clasificación inferida no tienen la misma procedencia.

## EX-03 — Preservar contradicciones

Cuando existan valores incompatibles, conservar el conflicto y marcarlo como ambigüedad; no elegir silenciosamente.

---

# 13. Provenance

Se separan dos dimensiones.

## 13.1 Origin

- `USER_DECLARED`
- `EXTRACTED_FROM_USER_TEXT`
- `AI_INFERRED`
- `AI_SUGGESTED`

## 13.2 Review disposition

- `UNREVIEWED`
- `USER_CONFIRMED`
- `USER_REJECTED`
- `SUPERSEDED`

Regla crítica:

`AI_INFERRED` nunca se convierte en `USER_CONFIRMED` sin una acción humana.

Pantalla 1 produce principalmente estado `UNREVIEWED`.

---

# 14. Objetos temporales

## PortfolioEntryDraft

Representa la entrada pública antes de tener análisis suficiente.

Conceptualmente:
- entry_id
- anonymous/session reference
- raw_input
- capture_method
- status
- created_at
- updated_at

## PortfolioEntryAnalysis

Representa interpretación provisional.

Conceptualmente:
- entry_id
- primary_intent
- secondary_intents
- entry_state
- extracted_context
- ambiguities
- missing_critical_context
- reverse_alignment_required
- reverse_alignment_gap
- question_plan
- provenance
- analysis_status
- analysis_version

---

# 15. Regla de no canonicalización

Ni `PortfolioEntryDraft` ni `PortfolioEntryAnalysis` equivalen a:
- Organization
- StrategicFront
- Challenge
- Initiative
- Evidence
- Step
- Decision

Un goal extraído no crea StrategicFront.
Una solution extraída no crea Initiative.

---

# 16. Estados conceptuales

## PortfolioEntryDraft

- `capturing`
- `ready_for_analysis`
- `analysis_requested`
- `analyzed`
- `failed`
- `expired`
- `superseded`

## PortfolioEntryAnalysis

- `pending`
- `ready`
- `insufficient_input`
- `failed`
- `superseded`

`ready` significa suficiente para Pantalla 2; no significa confirmado.

---

# 17. IA — operaciones permitidas

La IA puede:
- clasificar Intent;
- clasificar Entry State;
- extraer contexto;
- identificar ambigüedad;
- identificar faltantes;
- detectar solution-first;
- detectar initiative-first;
- determinar necesidad de reverse alignment;
- preparar preguntas críticas;
- preparar una interpretación provisional breve.

---

# 18. IA — operaciones prohibidas

La IA no puede:
- aprobar estrategia;
- confirmar KPI;
- inventar baseline/target/evidencia;
- declarar alineamiento definitivo;
- declarar duplicidad real;
- declarar cobertura real;
- decidir qué iniciativa cerrar;
- decidir inversión;
- crear estructura corporativa;
- crear Challenge;
- crear Initiative;
- activar Steps;
- afirmar probabilidad de éxito;
- convertir la preview ilustrativa en análisis real.

---

# 19. Reverse Alignment

## Trigger

Cuando:
- `entry_state = solution_first`, o
- `entry_state = initiative_first`

y falte conexión estratégica suficiente.

## Job

Identificar enlaces faltantes en:

`solución/iniciativa → cambio esperado → métrica/señal → intención de negocio → criterio de continuidad`

No debe:
- invalidar la solución;
- afirmar que está equivocada;
- convertir Pantalla 1 en Step 0;
- pedir evidencia exhaustiva.

---

# 20. Question Planning

Objetivo:

> Determinar la menor cantidad de preguntas cuyo resultado aumentaría materialmente la claridad.

Límite inicial:

`0–1 pregunta user-facing activa por turno; máximo 3 preguntas user-facing secuenciales`

Priorizar:
1. intención de negocio ambigua;
2. cambio esperado desconocido;
3. métrica/señal crítica faltante;
4. confusión problema/solución;
5. necesidad concreta de decisión/reporting;
6. contexto cuya ausencia podría orientar mal la siguiente experiencia.

Pantalla 1 **planifica** las preguntas.
Pantalla 2 **las presenta y obtiene respuestas**.

Reglas de convergencia:

- el sistema puede detectar múltiples gaps internamente, pero solo uno puede convertirse en active question;
- una respuesta Quick Clarification mapea a `matchedQuestionIds` de cardinalidad `0..1`;
- `QUESTION ANSWERED` no equivale a `GAP RESOLVED`; “No lo sé todavía” retira la pregunta sin resolver su gap;
- `answered_gaps` contiene solo gaps realmente resueltos, nunca el historial de preguntas respondidas;
- una pregunta presentada no puede reaparecer como active question por ID, wording, resolve target o equivalencia material determinista;
- el active question proviene del turno actual/latest, sin fallback histórico;
- tras cada respuesta debe surgir una nueva pregunta materialmente distinta, el checkpoint o un stop técnico/de seguridad.

El checkpoint puede aparecer después de 0, 1, 2 o 3 preguntas y conserva:

`Ya tengo suficiente claridad para proponerte un primer abordaje`

`Ver mi propuesta de abordaje` → `provisional_route` → `ready_for_handoff`  
`Seguir aterrizando mi necesidad` → `guided_exploration`

---

# 21. Preview de valor

Puede mostrarse:

**Ejemplo de lectura Starteria**

- 8 iniciativas
- 5 alineadas
- 2 posibles solapamientos
- 1 bloqueada
- 1 lista para decisión

Reglas:
- etiqueta obligatoria de ejemplo;
- no usa datos del visitante;
- no cambia al escribir de manera que parezca análisis real;
- no comunica precisión que Pantalla 1 no posee.

---

# 22. Handoff a Pantalla 2

Pantalla 1 termina cuando existen:

`PortfolioEntryDraft + PortfolioEntryAnalysis`

y Pantalla 2 puede recibir:

- raw_input;
- primary_intent;
- secondary_intents;
- entry_state;
- extracted_context;
- ambiguities;
- critical_missing_context;
- reverse_alignment_required;
- reverse_alignment_gap;
- question_plan;
- provenance.

La transición no crea objetos canónicos.

---

# 23. Casos mínimos

## Strategy-first

Input: `Quiero aumentar las ventas en 200 este trimestre.`

Esperado:
- entry_state = strategy_first
- goal = aumentar ventas
- target = 200
- horizon = este trimestre

No crear StrategicFront.

## Portfolio-first

Input: `Tengo 18 iniciativas y no sé cuáles realmente están alineadas.`

Esperado:
- entry_state = portfolio_first
- primary_intent = portfolio_alignment
- portfolio_size = 18

No declarar alineamiento.

## Solution-first

Input: `Quiero implementar un chatbot para ventas.`

Esperado:
- entry_state = solution_first
- solution = chatbot para ventas
- reverse_alignment_required = true

No crear Initiative.

## Reporting-first

Input: `Mañana tengo comité y necesito presentar cómo están mis iniciativas.`

Esperado:
- entry_state = reporting_first
- primary_intent = portfolio_reporting
- reporting_need = true

No inventar estado del portafolio.

## Ambiguo

Input: `Necesito ordenar esto antes del comité.`

Esperado:
- conservar ambigüedad;
- no inventar qué es “esto”;
- question_plan user-facing <= 1 por turno; el presupuesto total Quick Clarification <= 3.

## Contradictorio

Input: `Tenemos 12 iniciativas. En realidad creo que son unas 20.`

Esperado:
- conflicto preservado;
- no seleccionar 12 o 20 silenciosamente.

---

# 24. Restricciones de complejidad MVP

Evitar:
- multi-agent innecesario;
- búsqueda web automática;
- RAG;
- vector DB específica para esta operación;
- graph reasoning;
- workflows de aprobación;
- scoring de madurez;
- ingestion documental.

Arquitectura cognitiva inicial esperada:

`1 orchestrator + skills pequeñas + schemas estructurados + reglas deterministas`

---

# 25. ADR candidates

Requieren ADR antes de implementar:

1. permitir una Initiative corporativa canónica directamente bajo StrategicFront sin Challenge;
2. permitir que IA confirme alineamiento estratégico sin checkpoint humano;
3. convertir automáticamente Pantalla 1 en StrategicFront/Challenge/Initiative;
4. usar output conversacional como sistema de registro oficial sin estado estructurado/versionado.

No requieren ADR:
- wording;
- layout;
- placeholders;
- chips;
- thresholds UX;
- nombres técnicos internos;
- número exacto de preguntas entre 0–3;
- presentación de loading;
- forma visual de provenance.

---

# 26. Definition of Done

## UX
- [ ] headline Portfolio Lead;
- [ ] pregunta principal correcta;
- [ ] input en lenguaje natural;
- [ ] ejemplos editables;
- [ ] CTA `Analizar mi situación`;
- [ ] preview marcada como ejemplo;
- [ ] no upload público.

## Interpretación
- [ ] soporta todos los Entry States;
- [ ] soporta intents;
- [ ] `unknown` válido;
- [ ] solution-first activa reverse alignment.

## Extracción
- [ ] no inventa baseline;
- [ ] no inventa target;
- [ ] no inventa KPI;
- [ ] no inventa evidencia;
- [ ] preserva contradicciones.

## Provenance
- [ ] diferencia extracción/inferencia/sugerencia;
- [ ] no confirma inferencias automáticamente;
- [ ] conserva raw input.

## Persistencia
- [ ] puede crear PortfolioEntryDraft;
- [ ] puede crear PortfolioEntryAnalysis;
- [ ] no crea Organization;
- [ ] no crea StrategicFront;
- [ ] no crea Challenge;
- [ ] no crea Initiative;
- [ ] no crea Step;
- [ ] no crea Decision.

## Handoff
- [ ] entrega raw input;
- [ ] intent;
- [ ] Entry State;
- [ ] contexto extraído;
- [ ] ambigüedades;
- [ ] gaps;
- [ ] reverse alignment;
- [ ] question plan;
- [ ] provenance.

## No-regression
- [ ] no modifica Step 0–4;
- [ ] no modifica gating del Adaptive Core;
- [ ] no amplía autoridad IA;
- [ ] no cambia cardinalidad corporativa.
- [ ] conserva `questions[]` para compatibilidad y no muta turnos históricos con más de una pregunta;
- [ ] el active question nunca usa fallback histórico;
- [ ] answer identity, `answered_gaps`, budget y convergence cumplen ADR-002.

---

# 27. Principio final

> Pantalla 1 no estructura todavía el portafolio del usuario. Estructura suficientemente su entrada para que Starteria pueda empezar a razonar con él sin confundir interpretación con verdad organizacional.

Y para solution-first:

> Starteria no ayuda primero a ejecutar la solución; ayuda primero a descubrir qué tendría que ser verdad para que esa solución merezca existir.
