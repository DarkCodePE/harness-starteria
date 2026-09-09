# Starteria — Development Harness

**Versión:** v0.1  
**Estado:** Base inicial para implementación  
**Ámbito:** Gobernanza de producto, IA, frontend, backend y testing  
**Propósito:** Definir cómo se implementa Starteria sin permitir que una iteración de UI, prompt, agente o código cambie silenciosamente la lógica del producto.

---

## 1. Principio del harness

> **El código implementa contratos; no redefine el producto.**

Starteria debe evolucionar mediante una cadena explícita de autoridad:

```text
CORE LOGIC CONTRACT
        ↓
ADRs APROBADOS
        ↓
EXPERIENCE LOGIC CONTRACTS
        ↓
AGENT CONTRACTS
        ↓
SKILL CONTRACTS
        ↓
TECH SPECS
        ↓
SCHEMAS + TESTS
        ↓
FRONTEND / BACKEND
```

Si el comportamiento actual del código contradice un contrato con mayor autoridad, el código se considera desactualizado hasta que exista una decisión explícita que cambie el contrato.

---

## 2. Jerarquía de autoridad

Cuando dos fuentes entren en conflicto, aplicar este orden:

1. `STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados que modifiquen o aclaren el Core
3. Experience Logic Contracts
4. Agent Contracts
5. Skill Contracts
6. Technical Specs
7. PRDs
8. Prototipos / mockups / prompts de experimentación
9. Implementación actual

### Regla

Un mockup, prompt o cambio de frontend nunca modifica por sí mismo una regla Core.

Si una nueva necesidad contradice un Invariante Core:

```text
DETECTAR CONFLICTO
      ↓
DETENER CAMBIO DE LÓGICA
      ↓
CREAR ADR
      ↓
EVALUAR EVIDENCIA / TEST
      ↓
APROBAR O RECHAZAR CAMBIO
      ↓
ACTUALIZAR CONTRATOS
      ↓
IMPLEMENTAR
```

---

## 3. Documentos base del repositorio

Estructura recomendada:

```text
/docs
│
├── STARTERIA_AUTHORITY.md
│
├── core/
│   ├── STARTERIA_CORE_LOGIC_CONTRACT.md
│   ├── PORTFOLIO_ENTRY_LOGIC_CONTRACT.md
│   └── STARTERIA_CRAZY8S_E2E_BASE_LOGIC.md
│
├── ai/
│   └── PORTFOLIO_ENTRY_AGENT_CONTRACT.md
│
├── tech/
│   └── PORTFOLIO_ENTRY_TECH_SPEC.md
│
├── adr/
│   ├── ADR-INDEX.md
│   ├── ADR-001-...
│   └── ADR-002-...
│
└── traceability/
    └── PORTFOLIO_ENTRY_TRACEABILITY.md

/skills
├── entry-01-intent-detection/
│   ├── SKILL.md
│   └── schema.ts
├── entry-02-context-extraction/
│   ├── SKILL.md
│   └── schema.ts
├── entry-03-reverse-alignment/
│   ├── SKILL.md
│   └── schema.ts
└── entry-04-question-planner/
    ├── SKILL.md
    └── schema.ts

/tests
└── ai/
    └── portfolio-entry/
        ├── cases.md
        ├── rubric.md
        ├── fixtures/
        └── expected/

AGENTS.md
```

---

## 4. Función de cada tipo de documento

### 4.1 Core Logic Contract

**Función:** constitución del producto.

Define:
- invariantes;
- autoridad humana;
- separación Portfolio / Initiative;
- procedencia;
- evidencia;
- lógica Step 0–4;
- decisiones;
- versionado;
- restricciones no negociables.

No debe cambiar por iteraciones ordinarias de UX.

---

### 4.2 Experience Logic Contract

**Función:** reglas de una experiencia concreta.

Ejemplo: `PORTFOLIO_ENTRY_LOGIC_CONTRACT.md`.

Debe responder:
- quién entra;
- qué Job está resolviendo;
- inputs permitidos;
- estados;
- objetos temporales/canónicos;
- qué hace IA;
- qué confirma una persona;
- output hacia la siguiente experiencia;
- límites;
- definición de terminado.

---

### 4.3 Agent Contract

**Función:** definir la autoridad y responsabilidad de un agente/orquestador.

Debe declarar:
- momento del journey;
- job cognitivo;
- inputs;
- skills utilizadas;
- operaciones permitidas;
- operaciones prohibidas;
- output;
- checkpoints humanos;
- fallos;
- logging;
- test requerido.

---

### 4.4 Skill Contract

**Función:** definir una unidad cognitiva pequeña y testeable.

Cada `SKILL.md` debe declarar:

```text
Identity
Purpose
Trigger
Inputs
Source priority
Reasoning job
Allowed operations
Forbidden operations
Output schema
Human checkpoint
Failure modes
Evaluation rubric
Test cases
```

---

### 4.5 Technical Spec

**Función:** traducir contratos de producto a implementación.

Debe definir:
- frontend;
- backend;
- modelo de datos;
- APIs;
- schemas;
- estados;
- eventos;
- analytics;
- seguridad;
- observabilidad;
- errores;
- estrategia de migración.

La Tech Spec no puede ampliar la autoridad de IA.

---

### 4.6 ADR

**Función:** registrar un cambio material de arquitectura o lógica.

Usar cuando una decisión:
- cambia un Invariante Core;
- modifica una relación de dominio;
- cambia autoridad humana/IA;
- requiere migración;
- altera una regla que otras experiencias consumen.

Formato mínimo:

```text
Decision ID
Fecha
Problema
Contrato/Invariante afectado
Cambio propuesto
Evidencia
Alternativas
Impacto en Portfolio
Impacto en Initiative / Steps
Impacto en datos
Migración
Owner
Estado
```

---

## 5. AGENTS.md del repositorio

`AGENTS.md` debe gobernar **cómo cualquier agente de desarrollo trabaja sobre Starteria**.

No debe duplicar toda la lógica de negocio.

Debe obligar a leer primero la autoridad correspondiente.

### Comportamiento mínimo

Antes de modificar producto:

1. Leer `STARTERIA_AUTHORITY.md`.
2. Leer `STARTERIA_CORE_LOGIC_CONTRACT.md`.
3. Identificar Experience Contract afectado.
4. Leer ADRs relevantes.
5. Leer Agent/Skill Contracts implicados.
6. Leer Tech Spec.
7. Ejecutar tests existentes antes de modificar.

### Si encuentra conflicto

El agente debe reportar:

```text
CONFLICT
Contract:
Implementation:
Observed mismatch:
Risk:
Recommended resolution:
Requires ADR: yes/no
```

No debe elegir silenciosamente una interpretación.

---

## 6. Doctrina de implementación

Toda nueva capacidad debe seguir:

```text
HIPÓTESIS
    ↓
CONTRATO
    ↓
CASOS DE TEST
    ↓
SCHEMA
    ↓
IMPLEMENTACIÓN
    ↓
TEST HARNESS
    ↓
UX TEST
    ↓
ITERACIÓN
```

No:

```text
IDEA
↓
PROMPT
↓
CÓDIGO
↓
DESCUBRIR DESPUÉS QUÉ REGLA CAMBIÓ
```

---

## 7. Separación de responsabilidades

### IA

Puede realizar trabajos cognitivos definidos por contrato:
- extraer;
- clasificar;
- inferir;
- comparar;
- criticar;
- sugerir;
- detectar gaps;
- recomendar.

### Backend

Gobierna:
- persistencia;
- versionado;
- provenance;
- IDs;
- estados;
- permisos;
- transiciones;
- validaciones estructurales;
- eventos;
- seguridad.

### Humano

Conserva autoridad para:
- confirmar contexto material;
- confirmar alineamiento estratégico;
- aprobar estructura cuando corresponda;
- activar trabajo bajo autoridad organizacional;
- validar evidencia cuando sea requerido;
- tomar decisiones de continuidad/inversión/cierre.

### Frontend

Debe:
- representar el estado gobernado;
- diferenciar confirmado vs inferido;
- mostrar gaps y decisiones;
- no crear lógica Core por conveniencia visual.

---

## 8. Regla transversal de datos

> **Entrada flexible, estado estructurado.**

El chat o texto libre puede iniciar el razonamiento, pero no constituye el sistema de registro oficial.

Pipeline:

```text
FUENTE / INPUT
      ↓
EXTRACCIÓN
      ↓
INTERPRETACIÓN
      ↓
PROPUESTA ESTRUCTURADA
      ↓
CONFIRMACIÓN CUANDO APLIQUE
      ↓
CONTEXTO CANÓNICO
      ↓
ANÁLISIS / DECISIÓN
```

---

## 9. Regla transversal de IA

> **La IA razona; el sistema gobierna; las personas deciden donde existe autoridad organizacional.**

Ninguna salida generativa debe:
- inventar evidencia;
- convertirse automáticamente en información confirmada;
- crear autoridad organizacional;
- ejecutar una decisión reservada a personas;
- modificar objetos críticos sin trazabilidad.

---

## 10. Harness IA mínimo

Cada skill debe probar como mínimo:

1. caso claro;
2. caso ambiguo;
3. caso incompleto;
4. caso contradictorio;
5. caso con información previa;
6. corrección del usuario;
7. caso solution-first;
8. caso potencialmente engañoso.

Métricas transversales:
- precisión de extracción;
- afirmaciones no sustentadas;
- cobertura de provenance;
- detección de ambigüedad crítica;
- carga de corrección del usuario;
- omisiones relevantes;
- aceptación humana primera pasada.

---

## 11. Traceability Matrix

Cada Experience Contract debe tener una matriz que conecte lógica y código.

Ejemplo:

| Requirement | Core/Experience | Skill | Backend | Frontend | Test |
|---|---|---|---|---|---|
| Entrada texto libre | Entry §Inputs | Extraction | POST entry | textarea | T01 |
| No crear objetos canónicos | Core INV-03/04 | — | service guard | — | T02 |
| Detectar solution-first | Entry | Reverse Alignment | orchestrator | Diagnosis | T03 |
| Provenance | Core INV-05 | Extraction | DB | confirmation UI | T04 |

---

## 12. Primer slice de implementación

El primer slice de Starteria bajo este harness será:

```text
PUBLIC PORTFOLIO ENTRY
        ↓
INTERPRETACIÓN IA
        ↓
DIAGNÓSTICO INICIAL
        ↓
CONFIRMACIÓN HUMANA
```

No incluye todavía:
- importación de archivos;
- creación automática de portafolio;
- detección real de duplicidades;
- Steps;
- agentes autónomos múltiples;
- conectores;
- MCP;
- reporting avanzado.

---

## 13. Artefactos requeridos antes de implementar Portfolio Entry

- [x] Core Logic Contract existente
- [ ] `STARTERIA_AUTHORITY.md`
- [ ] `PORTFOLIO_ENTRY_LOGIC_CONTRACT.md`
- [ ] `PORTFOLIO_ENTRY_AGENT_CONTRACT.md`
- [ ] 4 `SKILL.md`
- [ ] casos + rúbrica del harness
- [ ] `PORTFOLIO_ENTRY_TECH_SPEC.md`
- [ ] matriz de trazabilidad

---

## 14. Definición de Done del harness v0.1

El harness inicial está operativo cuando:

1. existe una jerarquía de autoridad explícita;
2. un agente de desarrollo sabe qué documentos leer antes de modificar una feature;
3. un conflicto contrato/código detiene una modificación silenciosa;
4. cada skill IA tiene contrato y schema;
5. cada skill IA tiene casos de prueba y rúbrica;
6. las decisiones Core requieren ADR;
7. existe trazabilidad requirement → test → implementación;
8. el primer slice de Portfolio Entry puede desarrollarse sin inventar reglas fuera de contrato.

---

## 15. Principio final

> **Starteria puede iterar rápidamente en UI, prompts y workflows sin perder estabilidad lógica porque la autoridad vive en contratos, las decisiones materiales viven en ADRs y el comportamiento se protege con tests.**
