# Starteria — Índice maestro y arquitectura modular de PRDs

## 1. Propósito

Este documento organiza Starteria como una plataforma **Copilot-first** compuesta por motores especializados. Su objetivo es que producto, diseño, IA, frontend, backend y QA sepan:

- cómo comienza una acción desde la conversación;
- qué PRD interpreta cada situación;
- qué PRD es dueño de cada regla;
- qué objetos pueden crearse o modificarse;
- qué confirmación humana se requiere;
- en qué sección del dashboard se refleja el resultado;
- cómo probar que la implementación fue completa y no solo visual.

## 2. Tesis consolidada del producto

Starteria opera con tres capas complementarias:

1. **Copiloto:** recibe lenguaje natural, comprende la situación, consolida preguntas y propone un plan de acción.
2. **Motores de dominio:** aplican las reglas definidas por los PRD-01 a PRD-10.
3. **Dashboard:** registra, visualiza, permite controlar y auditar el estado estructurado del trabajo.

```text
Persona expresa qué quiere lograr
→ Copiloto interpreta intención, madurez, unidad y contexto
→ Selecciona capacidades de los PRDs propietarios
→ Consolida preguntas críticas
→ Presenta una propuesta integrada
→ Persona corrige, aprueba total/parcialmente o rechaza
→ Servicios de dominio ejecutan acciones aprobadas
→ Dashboard refleja objetos, estados, alertas y siguientes acciones
→ Copiloto confirma qué cambió y qué quedó pendiente
```

## 3. Principios no negociables

1. **Copilot-first no significa chat-only.** Toda acción relevante debe quedar representada en datos y pantallas estructuradas.
2. **La IA propone y explica; la persona confirma.** La IA no muta objetos de negocio directamente.
3. **No todo input es una iniciativa.** Puede ser una prioridad, frente, reto, grupo, proyecto, plan, implementación, cohorte o consulta.
4. **Cada regla tiene un único PRD propietario.** El orquestador consume reglas; no las redefine.
5. **El core Step 0–4 permanece estable.** Se adapta el contenido según la ruta, no se crean metodologías ilimitadas.
6. **La aprobación puede ser parcial.** El usuario puede aprobar unas acciones y dejar otras pendientes.
7. **Toda ejecución es idempotente y auditable.** Reintentos o doble clic no deben crear duplicados.
8. **No se pierde trabajo por cambios.** Contexto, evidencia y decisiones se versionan.
9. **La evidencia no se inventa, borra ni transforma en validación por redacción.**
10. **Cada resultado responde:** qué cambió, dónde se refleja, qué falta, qué riesgo existe y qué sigue.

## 4. Mapa de PRDs

| Código | Documento | Dueño funcional | Responsabilidad dentro de Copilot-first |
|---|---|---|---|
| PRD-00A | Arquitectura Copilot-first y orquestación transversal | Product Architecture / AI Platform | Conversación, routing de capacidades, Action Plan, aprobación, ejecución, sincronización y auditoría |
| PRD-01 | Arquitectura de producto, workspaces y navegación | Product Architecture | Determina el nivel de workspace y la progresión individual/strategic/team/portfolio |
| PRD-02 | Motor conversacional, Smart Entry, Routing y Revisión Inicial | Activation / AI UX | Diagnostica intención, punto de partida, madurez, tipo de reto, ruta y estructura recomendada |
| PRD-03 | Dashboard adaptativo Step 0–4 | Core Initiative Experience | Desarrolla cada iniciativa según su ruta y controla outputs, gates y estados |
| PRD-04 | Context Versioning y Change Impact | Initiative Integrity | Gestiona modificaciones a objetos confirmados, impacto, aprobaciones y versiones |
| PRD-05 | Scope, Granularity & Decomposition Engine | Initiative Structuring AI | Determina unidad de trabajo, acota, divide, agrupa o reclasifica |
| PRD-06 | Portfolio Lead, Copilot, Importación y Gobernanza | Enterprise Portfolio | Define objetos corporativos, home, importación, clasificación, cobertura y operación del portafolio |
| PRD-07 | Value, Investment, Readiness, Handoff & Decision | Strategic Value | Conecta KPI, evidencia, inversión, preparación, decisión, transferencia y beneficio |
| PRD-08 | Agente IA especializado, capacidades y rúbricas | AI Product | Contrato IA, confianza, fuentes, capability registry, guardrails y QA |
| PRD-09 | Piloto Cálidda y validación TI | Enterprise Validation | Valida el journey Copilot-first y los motores enterprise con casos reales |
| PRD-10 | Backlog, cohortes, capacidad y priorización | Portfolio Operations | Selecciona qué trabajo ejecutar, con qué capacidad, en qué ciclo y bajo qué condiciones |

## 5. Regla de propiedad de requisitos

- PRD-00A gobierna **cómo se orquestan** las capacidades.
- Cada PRD de dominio gobierna **qué significa y cómo se ejecuta** su comportamiento.
- El chatbot no duplica lógica de dominio.
- El dashboard no infiere reglas nuevas para compensar vacíos del chat.
- Si una solicitud activa varios PRDs, PRD-00A compone un solo Action Plan sin cambiar las reglas internas.

### Ejemplos

- “Quiero mejorar la eficiencia de la empresa” activa PRD-02, PRD-05 y PRD-06.
- “Ya compramos el software y debemos implementarlo” activa PRD-02, PRD-03 y PRD-07.
- “Tengo un Excel con iniciativas” activa PRD-06 y PRD-05; PRD-03 reconstruye avance.
- “El KPI cambió” activa PRD-04; PRD-06 y PRD-07 muestran el impacto resultante.
- “Solo puedo ejecutar dos iniciativas” activa PRD-10 consumiendo datos de PRD-06 y análisis de PRD-08.

## 6. Modelo conceptual común

```text
User
└── Workspace
    ├── CopilotConversation
    │   ├── IntentAssessment
    │   ├── ActionPlan
    │   ├── ProposedAction
    │   └── ActionExecution
    ├── Personal Initiative Workspace
    ├── Personal Strategic Workspace
    ├── Team Workspace
    └── Organization / Portfolio Workspace
        ├── Program
        │   └── Cohort
        │       ├── CandidateBacklog
        │       ├── CapacityAllocation
        │       └── CohortSelection
        └── StrategicFront
            └── Challenge
                └── Initiative
                    ├── InitiativeContextVersion
                    ├── StepProgress 0–4
                    ├── Evidence
                    ├── Blocker
                    ├── ValueCase
                    ├── ReadinessAssessment
                    ├── Handoff
                    └── Decision
```

## 7. Clasificaciones comunes

### 7.1 Tipo de reto: qué busca mover

- `correction`
- `growth`
- `exploration`

### 7.2 Tipo de ruta: qué necesita hacer ahora

- `explore_validate`
- `design_solution`
- `implement_handoff`
- `plan_coordinate`
- `reconstruct_existing`
- `lightweight_plan`

### 7.3 Tipo de operación conversacional

- `read`: consultar y explicar sin modificar.
- `create`: crear uno o varios objetos.
- `update`: proponer un cambio a objetos existentes.
- `classify`: ordenar o relacionar información.
- `assess`: evaluar calidad, alcance, readiness, valor o prioridad.
- `generate`: producir un output o reporte.
- `activate`: convertir un borrador confirmado en trabajo operativo.

## 8. Invariantes de Step 0–4

| Step | Función permanente |
|---|---|
| Step 0 | Entender, alinear y establecer el punto de partida |
| Step 1 | Delimitar, fundamentar y reconocer condiciones |
| Step 2 | Diseñar una ruta de acción ejecutable |
| Step 3 | Ejecutar, aprender y controlar |
| Step 4 | Cerrar, decidir, transferir y proyectar |

## 9. Navegación macro Copilot-first

### Usuario individual

```text
Smart Entry / Copiloto
→ Diagnóstico y propuesta
→ Confirmación
→ Overview
→ Step 0–4
→ Decisión o entrega
```

### Portfolio Lead

```text
Home Portfolio + Copiloto
→ Expresa qué quiere registrar, ordenar, priorizar, consultar o decidir
→ Starteria propone Action Plan
→ Aprobación total o parcial
→ Módulos propietarios ejecutan
→ Dashboard actualiza frentes, retos, iniciativas, cohortes o decisiones
→ Attention Queue muestra la siguiente acción
```

Los botones y formularios directos permanecen como atajos y controles manuales, no como arquitectura primaria.

## 10. Dependencias de implementación

```text
PRD-00A Orquestación Copilot-first
        ├── PRD-08 contrato IA y capability registry
        ├── PRD-02 diagnóstico y routing
        └── PRD-01 selección de workspace
                ↓
PRD-03 core de iniciativas
PRD-04 integridad de cambios
PRD-05 scope y descomposición
                ↓
PRD-06 objetos y operación Portfolio Lead
                ↓
PRD-10 cohortes, capacidad y priorización
                ↓
PRD-07 readiness, decisión y handoff

PRD-09 valida una selección de PRD-00A, 05, 06, 07, 08 y 10.
```

## 11. Orden recomendado

### Ola 0 — Control

1. Matriz requisito → código → test → evidencia.
2. PRD-00 actualizado.
3. PRD-00A aprobado.
4. Capability Registry común.

### Ola 1 — Copiloto mínimo y primera acción vertical

1. Shell conversacional.
2. Intent assessment.
3. Action Plan y preview.
4. Aprobación total/parcial.
5. Primera acción completa: crear frente y proyectarlo en dashboard.

### Ola 2 — Routing y core

1. PRD-02 reutilizable.
2. Selección de workspace.
3. Overview.
4. PRD-03 con dos rutas comprobables.

### Ola 3 — Integridad y estructura

1. PRD-04.
2. PRD-05.
3. Actualizaciones y descomposición originadas desde chat.

### Ola 4 — Portfolio Lead

1. PRD-06: importación, clasificación y home.
2. PRD-10: cohortes, capacidad y priorización.
3. Proyección de cada acción en dashboard.

### Ola 5 — Valor y validación

1. PRD-07 P0.
2. PRD-09.

## 12. Matriz de activación por situaciones

| Situación del usuario | PRDs activados | Resultado esperado |
|---|---|---|
| No tiene reto definido | 02 + 05 + 06 | Frente o espacio de definición; no iniciativa prematura |
| Tiene dolor claro | 02 + 05 + 06 | Reto o iniciativa según unidad |
| Tiene solución definida | 02 + 03 + 07 | Ruta implement_handoff |
| Tiene proyecto y fecha | 02 + 03 | Ruta plan_coordinate |
| Tiene varios objetos mezclados | 05 + 06 | Estructura editada y confirmada |
| Tiene información previa | 06 + 05 + 03 | Importación, clasificación y reconstrucción |
| Cambia prioridad o alcance | 04 + 06 + 07 | Nueva versión e impacto visible |
| Debe seleccionar una cohorte | 10 + 06 + 08 | Selección explicada y confirmada |
| Necesita preparar una decisión | 07 + 08 | Readiness y Decision Brief |

## 13. Métricas maestras

### Copiloto

- % de conversaciones que llegan a una interpretación confirmada.
- % de Action Plans aprobados total o parcialmente.
- tasa de edición/rechazo por tipo de intención.
- tasa de ejecución completa, parcial y fallida.
- acciones duplicadas evitadas por idempotencia.
- % de resultados visibles correctamente en dashboard.

### Estructura y progreso

- % de objetos creados con tipo, fuente y owner adecuados.
- % de iniciativas correctamente acotadas o divididas.
- completion rate por Step y ruta.
- % de cambios resueltos sin pérdida de evidencia.

### Portfolio y valor

- % de iniciativas alineadas.
- % de cohortes dentro de capacidad.
- % de candidatas con decisión explicada.
- % con readiness evaluado.
- % que llega a decisión sustentada.

## 14. Definition of Done del paquete

1. Cada acción conversacional tiene un PRD propietario.
2. Cada PRD declara cómo se integra con el Copiloto.
3. El Action Plan muestra objetos creados/modificados antes de ejecutar.
4. La aprobación puede ser total o parcial.
5. La ejecución es idempotente y auditable.
6. Todo cambio aparece en una sección estructurada del dashboard.
7. Los requisitos P0 tienen tests positivos y negativos.
8. La IA muestra fuentes, faltantes, riesgos, supuestos y confianza.
9. Los errores parciales no ocultan qué sí se ejecutó.
10. QA puede reconstruir conversación → comando → dato → pantalla → evento.
