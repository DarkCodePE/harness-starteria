# Starteria — Portfolio Entry Harness Execution Spec

**Documento:** `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md`  
**Versión:** v0.1  
**Estado:** PROPUESTO PARA IMPLEMENTACIÓN  
**Fecha:** 2026-09-09  
**Tipo:** Execution Spec / AI Harness Infrastructure  
**Vertical slice:** Portfolio Entry experimental  
**Alcance:** laboratorio aislado, sin integración productiva  

---

# 0. Objetivo

Construir una infraestructura mínima y repetible para ejecutar el `PORTFOLIO_ENTRY_AI_HARNESS_v0.1` contra una implementación experimental del Portfolio Entry Agent.

El objetivo NO es implementar Portfolio Entry en producción.

El objetivo es poder ejecutar:

```text
test cases
    ↓
experimental agent
    ↓
4 skills
    ↓
structured output
    ↓
automatic checks
    ↓
human review
    ↓
PASS / REVIEW / FAIL
```

---

# 1. Principio de aislamiento

Esta implementación debe vivir fuera del flujo productivo actual.

NO modificar:

- `/public/start`
- `PublicStartPage`
- `PublicProposalEditorPage`
- `PilotLead`
- `PilotClaimService`
- `ProjectService`
- `Step 0`
- Steps 1–4
- `AutofillContext`
- PDF extraction
- Prisma schema productivo
- rutas productivas existentes
- lógica legacy de conversión
- Docker/CD

Regla:

> El harness debe poder ejecutarse localmente sin producir efectos sobre Starteria productiva.

---

# 2. Estructura recomendada

La implementación puede usar una estructura equivalente a:

```text
docs/
└── ai-harness/
    └── portfolio-entry/
        ├── PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md
        └── PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md

tests/
└── ai-harness/
    └── portfolio-entry/
        ├── cases/
        │   ├── PE-A01.json
        │   ├── PE-A02.json
        │   ├── ...
        │
        ├── prompts/
        │   ├── entry-01-intent-detection.md
        │   ├── entry-02-context-extraction.md
        │   ├── entry-03-reverse-alignment.md
        │   └── entry-04-question-planner.md
        │
        ├── agent/
        │   ├── portfolio-entry-agent.ts
        │   └── portfolio-entry-agent-adapter.ts
        │
        ├── evaluator/
        │   ├── hard-checks.ts
        │   ├── scorer.ts
        │   └── failure-taxonomy.ts
        │
        ├── types.ts
        ├── runner.ts
        └── report.ts

tmp/
└── ai-harness/
    └── portfolio-entry/
        └── runs/
```

La estructura exacta puede adaptarse al repo si existe una convención superior ya establecida.

No crear arquitectura adicional si no es necesaria.

---

# 3. Fuentes de autoridad que debe leer la implementación

Antes de implementar, considerar como autoridad:

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aplicables
3. `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
4. `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md`
5. `entry-01-intent-detection/SKILL.md`
6. `entry-02-context-extraction/SKILL.md`
7. `entry-03-reverse-alignment/SKILL.md`
8. `entry-04-question-planner/SKILL.md`
9. `PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`

Regla:

> El código implementa estos contratos; no los redefine.

---

# 4. Test case fixture

Cada caso debe ser ejecutable desde JSON.

Formato conceptual:

```json
{
  "case_id": "PE-B03",
  "name": "Solution-first puro",
  "input": "Quiero implementar un chatbot para ventas.",
  "expected": {
    "entry_state": ["solution_first"],
    "primary_intent": ["initiative_governance"],
    "reverse_alignment_required": true,
    "max_questions": 3
  },
  "must_include_context": {
    "solution": "chatbot para ventas"
  },
  "must_not_include_context": [
    "baseline",
    "target"
  ],
  "prohibited_behaviors": [
    "create_initiative",
    "activate_step_0",
    "confirm_alignment"
  ],
  "human_review": {
    "intent_quality": true,
    "question_quality": true,
    "ux_synthesis_quality": true
  }
}
```

---

# 5. Reglas para fixtures

Cada fixture debe contener:

- `case_id`
- `name`
- `input`
- expectativas determinísticas cuando existan
- comportamientos prohibidos
- campos que requieren revisión humana

No forzar expectativa exacta cuando el contrato permite alternativas válidas.

Ejemplo:

```json
"primary_intent": [
  "portfolio_reporting",
  "portfolio_prioritization"
]
```

si ambos pueden ser válidos según el job dominante.

---

# 6. Conversión inicial de casos

Convertir a fixtures todos los casos definidos en:

`PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`

Mantener IDs:

- PE-Axx
- PE-Bxx
- PE-Cxx
- PE-Dxx
- PE-Exx
- PE-Fxx
- PE-Gxx
- PE-Hxx
- PE-Ixx

No inventar nuevos casos durante esta primera implementación.

Los nuevos casos deben añadirse después como resultado de findings reales.

---

# 7. Agent Adapter

El harness debe depender de una interfaz única.

Conceptualmente:

```ts
export interface PortfolioEntryAgentAdapter {
  analyze(input: {
    entryId: string;
    rawInput: string;
  }): Promise<PortfolioEntryAnalysis>;
}
```

El runner no debe depender directamente de:

- proveedor IA;
- SDK específico;
- endpoint productivo;
- framework de agentes.

Regla:

```text
Harness
   ↓
Agent Adapter
   ↓
Experimental implementation
```

---

# 8. Implementación experimental del agente

Crear una implementación aislada del Portfolio Entry Agent.

Puede ejecutar las cuatro skills secuencialmente:

```text
raw_input
   ↓
entry-01-intent-detection
   ↓
entry-02-context-extraction
   ↓
entry-03-reverse-alignment
   ↓
entry-04-question-planner
   ↓
PortfolioEntryAnalysis
```

No se requieren múltiples agentes autónomos.

No implementar loops abiertos.

---

# 9. Implementación de skills

Cada skill debe tener:

- input explícito;
- output estructurado;
- prompt derivado de su `SKILL.md`;
- schema de validación;
- manejo de error;
- ninguna side effect productiva.

La implementación puede ser experimental y local.

No convertir prompts experimentales en autoridad superior.

---

# 10. Output experimental común

El agente debe devolver conceptualmente:

```ts
type PortfolioEntryAnalysis = {
  entry_id: string;
  analysis_version: string;
  analysis_status:
    | "pending"
    | "ready"
    | "insufficient_input"
    | "failed"
    | "superseded";

  primary_intent: string;
  secondary_intents: string[];
  entry_state: string;

  extracted_context: Record<string, unknown>;
  ambiguities: unknown[];
  contradictions: unknown[];

  missing_critical_context: unknown[];

  reverse_alignment_required: boolean;
  reverse_alignment_gap: unknown;

  question_plan: unknown[];

  provenance: unknown;

  ux_summary?: string;
};
```

El schema exacto puede ajustarse durante implementación siempre que no contradiga los contratos.

---

# 11. Structured validation

Todo output del modelo debe pasar por schema validation antes de ser evaluado.

Si falla:

```text
schema validation failed
→ registrar raw output
→ marcar execution failure
→ no normalizar silenciosamente
```

Puede existir una reparación estructural limitada si es explícita y trazable.

No reparar contenido semántico inventando valores.

---

# 12. Runner

El runner debe:

1. descubrir fixtures;
2. cargarlos;
3. asignar `entry_id` temporal;
4. ejecutar el adapter;
5. capturar output;
6. ejecutar hard checks;
7. ejecutar scoring automático;
8. marcar campos para revisión humana;
9. persistir resultado;
10. generar report.

Conceptualmente:

```ts
for (const testCase of cases) {
  const result = await agent.analyze(...);
  const hardChecks = evaluateHardChecks(testCase, result);
  const score = scoreResult(testCase, result);
  saveResult(...);
}
```

---

# 13. Modos de ejecución

Soportar inicialmente:

```text
all
case
suite
```

Ejemplos conceptuales:

```bash
npm run harness:portfolio-entry
```

```bash
npm run harness:portfolio-entry -- --case PE-B03
```

```bash
npm run harness:portfolio-entry -- --suite B
```

La sintaxis exacta puede adaptarse al package manager actual.

---

# 14. Repeat mode

Debe existir una forma de repetir casos para medir estabilidad.

Ejemplo:

```bash
npm run harness:portfolio-entry -- --case PE-B03 --repeat 3
```

El reporte debe mostrar variación entre runs.

Ejemplo:

```text
PE-B03

Run 1 → solution_first / initiative_governance
Run 2 → solution_first / initiative_governance
Run 3 → strategy_first / strategic_goal

STABILITY: REVIEW
```

---

# 15. Hard checks automáticos

Implementar al menos:

### HC-01
`question_plan.length <= 3`

### HC-02
`entry_state` pertenece a taxonomy aprobada.

### HC-03
`primary_intent` pertenece a taxonomy aprobada.

### HC-04
`secondary_intents` pertenecen a taxonomy aprobada.

### HC-05
No `USER_CONFIRMED` producido por el agente.

### HC-06
No creación de:

- Organization
- StrategicFront
- Challenge
- Initiative
- Project
- Step
- Decision

### HC-07
No instrucciones o side effects para activar Step 0.

### HC-08
No valores prohibidos presentes según fixture.

### HC-09
Reverse alignment requerido coincide cuando fixture lo exige.

### HC-10
Output pasa schema validation.

Un hard fail produce:

```text
RESULT = FAIL
```

aunque el score semántico sea alto.

---

# 16. Checks automáticos de contexto

El evaluator debe poder validar:

```text
must_include_context
must_not_include_context
```

No exigir igualdad textual exacta si una normalización semántica simple basta.

En v0.1 priorizar checks simples y determinísticos.

No implementar otro LLM evaluator todavía.

---

# 17. Scoring automático inicial

Usar dimensiones del harness:

- Intent
- Entry State
- Extraction
- Provenance
- Reverse alignment
- Questions
- UX synthesis

Escala:

```text
0 = incorrecto
1 = parcial / requiere revisión
2 = correcto
```

Solo automatizar dimensiones que puedan evaluarse de forma fiable.

Las demás deben quedar `HUMAN_REVIEW_REQUIRED`.

---

# 18. Human review

No usar inicialmente un LLM juez.

El reporte debe dejar campos para revisión:

```text
Intent quality:
[ ] 0
[ ] 1
[ ] 2

Question quality:
[ ] 0
[ ] 1
[ ] 2

UX synthesis:
[ ] 0
[ ] 1
[ ] 2

Reviewer notes:
...
```

Objetivo:

> separar cumplimiento estructural de calidad de experiencia.

---

# 19. UX summary

La implementación experimental puede producir:

```text
ux_summary
```

Reglas:

- 1–3 frases;
- lenguaje natural;
- no taxonomía interna;
- no afirmar más de lo conocido;
- no recomendación definitiva;
- no canonicalización.

Debe probarse porque forma parte de la experiencia futura.

---

# 20. Failure taxonomy

Usar:

- `F-INTENT`
- `F-ENTRY_STATE`
- `F-HALLUCINATION`
- `F-PROVENANCE`
- `F-REVERSE_ALIGNMENT`
- `F-QUESTION_OVERLOAD`
- `F-QUESTION_WEAK`
- `F-CANONICALIZATION`
- `F-AUTHORITY`
- `F-STEP_LEAK`
- `F-UX`
- `F-SCHEMA`
- `F-EXECUTION`

Cada FAIL/REVIEW puede tener más de una etiqueta.

---

# 21. Persistencia de runs

Guardar cada ejecución en una carpeta nueva:

```text
tmp/ai-harness/portfolio-entry/runs/<run-id>/
```

Contenido mínimo:

```text
run.json
raw-results.jsonl
evaluated-results.json
REPORT.md
```

`run.json` debe incluir:

- run id;
- timestamp;
- cases ejecutados;
- repeat count;
- agent implementation version;
- prompt/contract version si disponible;
- modelo usado si aplica.

---

# 22. `raw-results.jsonl`

Guardar por ejecución:

```json
{
  "case_id": "PE-B03",
  "run_index": 1,
  "input": "...",
  "raw_output": {},
  "execution_status": "completed",
  "duration_ms": 1234
}
```

No guardar chain-of-thought.

---

# 23. `evaluated-results.json`

Guardar:

```json
{
  "case_id": "PE-B03",
  "result": "PASS",
  "hard_fail": false,
  "hard_checks": [],
  "automatic_score": 10,
  "human_review_required": true,
  "failure_codes": [],
  "notes": []
}
```

---

# 24. `REPORT.md`

Formato mínimo:

```text
PORTFOLIO ENTRY HARNESS RUN

Run ID:
Date:
Cases:
Model:
Agent version:

SUMMARY
PASS:
REVIEW:
FAIL:
Hard fails:

FAILURE PATTERNS
F-QUESTION_OVERLOAD:
F-HALLUCINATION:
...

CASE RESULTS
PE-A01 PASS
PE-A02 PASS
PE-B03 REVIEW
...
```

Debe permitir identificar patrones, no solo casos individuales.

---

# 25. Criterio PASS / REVIEW / FAIL

## PASS

- ningún hard fail;
- expectativas determinísticas satisfechas;
- score >= threshold;
- human review aprobada si fue requerida.

## REVIEW

- ningún hard fail;
- existe ambigüedad semántica;
- output razonable pero discutible;
- estabilidad baja;
- human review pendiente.

## FAIL

- cualquier hard fail;
- comportamiento fuera de contrato;
- output inválido;
- ejecución rota.

---

# 26. Rondas de testing

## Round 1 — Smoke

Ejecutar todos los casos una vez.

Objetivo:

- detectar hallucination;
- detectar canonicalization;
- detectar taxonomía rota;
- detectar question overload;
- detectar reverse alignment roto.

## Round 2 — Stability

Ejecutar:

- todos los FAIL;
- todos los REVIEW;
- casos ambiguos;
- solution-first críticos.

Repetir 3 veces.

## Round 3 — Real Portfolio Lead

Añadir únicamente después nuevos casos provenientes de:

- entrevistas;
- mentorías;
- pruebas internas;
- inputs reales anonimizados.

No modificar contratos por un único caso aislado.

---

# 27. Implementación del modelo IA

La infraestructura debe permitir cambiar proveedor/modelo sin reescribir el harness.

Preferir:

```text
Agent Adapter
→ provider adapter
```

No hardcodear lógica del harness al SDK del proveedor.

Si el repo ya dispone de una abstracción IA reutilizable y no contradice este aislamiento, puede reutilizarse.

No modificar la abstracción productiva para acomodar el harness si no es necesario.

---

# 28. Variables de entorno

Las credenciales del modelo deben entrar por variables de entorno.

Nunca:

- hardcodear keys;
- incluir secrets en fixtures;
- guardar keys en reportes;
- commitear `.env`.

Si no existe credencial disponible, el harness debe fallar con mensaje claro y sin tocar producción.

---

# 29. Logging

Registrar:

- case id;
- skill;
- execution status;
- duration;
- schema result;
- retry status.

No registrar:

- chain-of-thought;
- secrets;
- PII no necesaria.

---

# 30. Retry

En v0.1:

- máximo 1 retry técnico por error transitorio si ya existe una abstracción segura;
- no retry semántico para “obtener una respuesta mejor”;
- cada retry debe quedar registrado.

No implementar self-reflection loops.

---

# 31. Tests unitarios del harness

Agregar tests para:

- cargar fixtures;
- validar fixture schema;
- detectar `question_count > 3`;
- detectar taxonomy inválida;
- detectar `USER_CONFIRMED`;
- detectar objeto canónico prohibido;
- generar report;
- repeat mode;
- manejo de output inválido.

Estos tests no deben llamar al modelo real.

---

# 32. Criterio de implementación completada

La infraestructura está lista cuando:

- todos los fixtures cargan;
- runner ejecuta un caso;
- runner ejecuta suite;
- runner ejecuta todos;
- repeat mode funciona;
- outputs se guardan por run;
- hard checks funcionan;
- report se genera;
- no existen side effects productivos;
- tests unitarios del harness pasan.

Esto NO significa que el Portfolio Entry Agent ya esté validado.

---

# 33. Criterio para pasar a Tech Spec del producto

No pasar a Tech Spec productivo hasta que:

- 100% de casos estén libres de hard fails;
- >= 85% estén en PASS;
- solution-first sea estable;
- no exista canonicalization;
- no exista Step leakage;
- no exista hallucination material recurrente;
- question planner respete consistentemente 0–3;
- findings restantes sean conocidos y aceptables.

---

# 34. Archivos explícitamente fuera de alcance

No modificar durante esta implementación:

```text
front/**/PublicStartPage*
front/**/PublicProposalEditor*
backend/**/pilot-lead*
backend/**/project*
backend/**/step*
front/prisma/schema.prisma
```

Si durante implementación se descubre que es necesario tocar alguno:

```text
STOP
→ documentar motivo
→ no modificar
→ solicitar revisión
```

---

# 35. Definition of Done

- [ ] fixtures creados desde harness v0.1;
- [ ] Agent Adapter creado;
- [ ] implementación experimental aislada creada;
- [ ] cuatro skills ejecutables;
- [ ] schema validation;
- [ ] runner;
- [ ] suite/case/all modes;
- [ ] repeat mode;
- [ ] hard checks;
- [ ] failure taxonomy;
- [ ] report;
- [ ] human review fields;
- [ ] unit tests del harness;
- [ ] cero cambios productivos;
- [ ] cero cambios en Steps;
- [ ] cero cambios en canonical models.

---

# 36. Principio final

> El harness es un laboratorio para validar comportamiento antes de convertirlo en arquitectura productiva.

Y:

> Primero observamos cómo falla la lógica. Después decidimos qué merece convertirse en producto.
