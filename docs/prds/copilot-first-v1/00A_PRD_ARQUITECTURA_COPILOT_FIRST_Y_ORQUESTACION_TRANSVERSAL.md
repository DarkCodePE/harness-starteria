# PRD-00A — Arquitectura Copilot-first y orquestación transversal

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Copilot Platform / Orquestación transversal |
| Versión | v0.1 |
| Estado | Draft accionable para producto, diseño, IA, frontend, backend y QA |
| Usuarios principales | Portfolio Lead, Initiative Owner, Team Lead, usuarios de workspaces estratégicos |
| Objetivo del release | Convertir lenguaje natural en propuestas de acciones estructuradas, aprobables, ejecutables y visibles en el dashboard, consumiendo las reglas de los PRDs propietarios sin duplicarlas |

## 2. Problema

Los PRDs de Starteria cubren múltiples situaciones: usuarios sin reto definido, iniciativas compuestas, soluciones ya elegidas, proyectos con deadline, importación de portafolios, cambios de contexto, cohortes, readiness y decisiones. Si cada situación se implementa como una pantalla de entrada independiente:

- el usuario debe conocer la arquitectura de Starteria antes de obtener valor;
- aparecen journeys paralelos y repetidos;
- distintas pantallas hacen las mismas preguntas;
- la IA puede generar recomendaciones inconexas;
- se pierde la relación entre lo conversado y lo registrado;
- un cambio puede quedar solo en el chat sin modificar el sistema;
- frontend puede terminar codificando lógica de dominio que pertenece a otros PRDs.

## 3. Tesis

Starteria debe operar como un sistema **Copilot-first**:

> La conversación es la puerta para expresar intención. Los motores de dominio convierten esa intención en propuestas estructuradas. La persona aprueba. El dashboard registra y permite controlar el resultado.

```text
Conversation
→ Intent Assessment
→ Capability Routing
→ Consolidated Questions
→ Action Plan
→ Preview / Before–After
→ Human Approval
→ Domain Commands
→ Transactional Execution
→ Dashboard Projection
→ Result + Next Action
```

## 4. Objetivos

1. Permitir que el usuario empiece sin conocer qué objeto o módulo necesita.
2. Conservar todas las variaciones metodológicas definidas por PRD-01 a PRD-10.
3. Evitar que cada PRD implemente un chatbot diferente.
4. Impedir mutaciones directas del modelo de IA sobre datos confirmados.
5. Permitir aprobación total, parcial, edición o rechazo.
6. Ejecutar acciones con idempotencia, permisos y auditoría.
7. Garantizar que todo resultado relevante se proyecte en el dashboard.
8. Permitir recuperar y continuar conversaciones y Action Plans.

## 5. Principios de experiencia

1. **Una entrada abierta, no un menú técnico.**
2. **Preguntar solo lo crítico.** Las preguntas de distintos motores se consolidan.
3. **Mostrar la propuesta antes de ejecutar.**
4. **Separar hechos, inferencias y recomendaciones.**
5. **Explicar qué PRD/capacidad intervendrá sin exponer complejidad innecesaria al usuario.**
6. **Mantener atajos estructurados.** Cards y formularios siguen disponibles.
7. **No esconder resultados dentro del chat.**
8. **Un único siguiente paso principal.**
9. **Errores parciales transparentes.**
10. **La conversación respeta permisos y confidencialidad del workspace.**

## 6. Alcance

### In scope P0

- shell conversacional en Home Portfolio Lead;
- historial por workspace;
- texto y adjuntos permitidos;
- detección de intención y objetos;
- selección de capacidades;
- preguntas adaptativas consolidadas;
- Action Plan con una o varias acciones;
- preview de objetos y campos;
- aprobación total y por acción;
- edición de payload propuesto;
- ejecución idempotente;
- registro de resultados y errores;
- links a secciones actualizadas;
- primera librería de comandos de dominio;
- analytics y auditoría.

### P1

- conversaciones ligadas a objetos específicos;
- comparación before/after avanzada;
- rollback de operaciones reversibles;
- colaboración sobre Action Plans;
- aprobaciones multirol;
- streaming de procesos largos;
- resúmenes periódicos y contexto de actividad reciente.

### Out of scope inicial

- autonomía sin confirmación para cambios de negocio;
- ejecución libre de código;
- sustitución de sistemas de tareas;
- publicación automática de importaciones;
- creación de sponsors u owners reales por inferencia;
- decisión automática de inversión.

## 7. Superficies del Copiloto

### 7.1 Home Portfolio Lead

Componente principal:

> ¿Qué necesitas registrar, ordenar, priorizar, revisar o decidir hoy?

Debajo permanecen Attention Queue, mapa estratégico, cohortes y decisiones.

### 7.2 Panel global

Accesible desde vistas de frente, reto, iniciativa, cohorte y decisión. Hereda el objeto actual como contexto, pero lo muestra explícitamente.

### 7.3 Copiloto de iniciativa

Comparte shell y contrato IA, pero limita su contexto y comandos al workspace de iniciativa y PRD-03/04/07.

## 8. Tipos de conversación

| Tipo | Ejemplo | Confirmación |
|---|---|---|
| Consulta | “¿Qué iniciativas están bloqueadas por TI?” | No, si solo lee |
| Guía | “No sé por dónde empezar” | No para orientar; sí para crear |
| Creación | “Crea un frente de eficiencia operativa” | Sí |
| Modificación | “Cambia el alcance a Operaciones” | Sí + impacto PRD-04 |
| Importación | “Tengo un Excel con iniciativas” | Sí antes de publicar |
| Clasificación | “Ordena estos dolores por frente y reto” | Sí antes de confirmar relaciones |
| Priorización | “Selecciona dos para la cohorte” | Sí |
| Decisión | “Prepara cuáles deberían escalar” | Sí para registrar decisión/inversión |

## 9. Taxonomía inicial de intenciones

```typescript
type CopilotIntent =
  | 'ask_for_guidance'
  | 'configure_workspace'
  | 'create_strategic_front'
  | 'create_challenge'
  | 'activate_challenge'
  | 'register_initiative'
  | 'import_existing_work'
  | 'classify_portfolio'
  | 'decompose_work'
  | 'create_cohort'
  | 'prioritize_candidates'
  | 'review_portfolio_status'
  | 'identify_blockers'
  | 'prepare_decision'
  | 'assess_readiness'
  | 'generate_report'
  | 'update_existing_context'
  | 'continue_existing_plan'
  | 'unknown';
```

Una conversación puede contener una intención principal y varias acciones dependientes.

## 10. Contexto disponible

El Copiloto puede consultar, según permisos:

- workspace y configuración;
- objetivos/frentes y KPI;
- retos y cobertura;
- iniciativas, rutas y Steps;
- cohortes y capacidad;
- owners, sponsors y validadores;
- bloqueos;
- evidencia y fuentes;
- readiness;
- decisiones pendientes;
- actividad reciente;
- Action Plans previos.

Debe mostrar qué objetos utilizó y no asumir que un nombre ambiguo corresponde a un objeto único.

## 11. Capability Registry

Cada PRD registra capacidades invocables.

```typescript
type CopilotCapability = {
  id: string;
  ownerPrd: 'PRD-01'|'PRD-02'|'PRD-03'|'PRD-04'|'PRD-05'|'PRD-06'|'PRD-07'|'PRD-08'|'PRD-10';
  supportedIntents: CopilotIntent[];
  operation: 'read'|'create'|'update'|'classify'|'assess'|'generate'|'activate';
  requiredInputs: string[];
  optionalInputs: string[];
  requiredPermissions: string[];
  requiresConfirmation: boolean;
  commandType?: string;
  resultProjection: string[];
};
```

### Capacidades P0

| Capability | PRD | Comando/resultado |
|---|---|---|
| RecommendWorkspace | 01/02 | Recomendación, no mutación |
| DiagnoseWork | 02 | IntentAssessment |
| CreateStrategicFront | 06 | `CreateStrategicFrontCommand` |
| CreateChallenge | 06 | `CreateChallengeCommand` |
| StartImport | 06 | `CreateImportSessionCommand` |
| ConfirmImportMapping | 06 | Publicación confirmada |
| AssessScope | 05 | ScopeAssessment |
| ApplyDecomposition | 05 | Objetos confirmados |
| UpdateContext | 04 | Nueva ContextVersion |
| CreateCohort | 10 | Cohort draft |
| PrioritizeCandidates | 10 | PrioritizationAssessment |
| ConfirmCohortSelection | 10 | CohortSelection |
| AssessReadiness | 07 | ReadinessAssessment |
| PrepareDecisionBrief | 07 | Brief versionado |

## 12. Routing de capacidades

1. PRD-02 diagnostica intención, madurez, unidad y gobernanza.
2. PRD-00A identifica capacidades compatibles.
3. Cada capacidad devuelve faltantes y dependencias.
4. El orquestador consolida preguntas y elimina duplicados.
5. Si hay conflicto entre capacidades, muestra alternativas o solicita decisión.
6. El orden del Action Plan respeta dependencias.

### Ejemplo

Input:

> Tengo ocho dolores y solo puedo ejecutar dos en los próximos dos meses.

Routing:

```text
DiagnoseWork (PRD-02)
→ StartImport / RegisterCandidates (PRD-06)
→ AssessScope (PRD-05)
→ CreateCohort + PrioritizeCandidates (PRD-10)
```

## 13. Preguntas adaptativas consolidadas

Reglas:

- preguntar solo por información crítica para construir una propuesta útil;
- no repetir información ya presente;
- máximo tres preguntas por ciclo de propuesta, salvo que el usuario elija profundizar;
- permitir “No lo sé aún”;
- declarar qué acción quedará condicionada si falta una respuesta;
- preguntas de implementación posteriores pueden aparecer dentro del módulo estructurado.

## 14. Action Plan

### Contenido

- interpretación confirmable;
- objetivo del plan;
- acciones ordenadas;
- objetos a crear, modificar o consultar;
- campos propuestos;
- fuentes;
- supuestos;
- riesgos;
- dependencias;
- permisos/validadores;
- proyección en dashboard;
- acciones no ejecutables todavía.

### Estados

```typescript
type ActionPlanStatus =
  | 'draft'
  | 'awaiting_confirmation'
  | 'partially_approved'
  | 'approved'
  | 'executing'
  | 'partially_completed'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'superseded';
```

## 15. Preview y aprobación

### Acciones del usuario

- aprobar todo;
- aprobar una acción;
- editar una acción;
- rechazar una acción;
- pedir alternativa;
- agregar contexto;
- guardar para después;
- cancelar.

### Reglas

1. Una acción dependiente no puede aprobarse si su requisito previo fue rechazado, salvo que se edite el plan.
2. Editar un payload invalida únicamente análisis dependientes.
3. La aprobación registra usuario, rol, timestamp y versión.
4. La misma aprobación no se ejecuta dos veces.
5. Acciones de lectura no requieren Action Plan salvo que se conviertan en creación/modificación.

## 16. Ejecución transaccional

La IA genera propuestas; un `ActionExecutor` valida y ejecuta comandos de dominio.

```text
Approved ProposedAction
→ Validate permission
→ Validate current object version
→ Generate idempotency key
→ Execute domain command
→ Persist result
→ Publish domain event
→ Update ActionExecution
→ Return projection links
```

### Reglas

- el modelo no tiene acceso directo a repositorios de escritura;
- cada comando tiene schema validado;
- optimistic concurrency para modificaciones;
- los procesos largos se modelan como jobs;
- los errores no revierten automáticamente acciones independientes ya completadas;
- el usuario ve qué se completó y qué falló.

## 17. Sincronización con dashboard

Cada resultado debe declarar:

- objetos creados;
- objetos modificados;
- versión resultante;
- pantallas o cards afectadas;
- Attention Items creados/resueltos;
- siguiente acción.

Ejemplos:

| Acción | Proyección |
|---|---|
| Crear frente | Home + mapa estratégico + lista de frentes |
| Crear reto | Detalle de frente + cobertura |
| Iniciar importación | Bandeja + estado de procesamiento |
| Crear cohorte | Home + sección Cohortes |
| Cambiar KPI | Frente + iniciativas afectadas + Attention Queue |
| Evaluar readiness | Detalle ejecutivo + centro de decisión |

## 18. Manejo de errores

### Casos

- intención no evaluable;
- objeto ambiguo;
- permiso insuficiente;
- versión del objeto cambió;
- comando inválido;
- dependencia no resuelta;
- proceso parcial;
- proveedor IA no disponible;
- archivo no procesable.

### Comportamiento

- conservar conversación y Action Plan;
- no ocultar acciones completadas;
- permitir reintentar solo la acción fallida;
- regenerar si cambió el contexto;
- nunca afirmar que el dashboard se actualizó sin confirmación del servicio.

## 19. Permisos y gobernanza

- cada capability declara permisos;
- el Copiloto no eleva privilegios;
- un usuario puede proponer una acción que otro rol debe confirmar;
- información sensible se limita al contexto autorizado;
- sponsors y viewers reciben outputs ajustados a sus permisos;
- toda acción de negocio mantiene audit log.

## 20. Modelo de datos

```typescript
type CopilotConversation = {
  id: string;
  workspaceId: string;
  userId: string;
  scopeObjectId?: string;
  status: 'active'|'archived';
  createdAt: string;
  updatedAt: string;
};

type CopilotIntentAssessment = {
  id: string;
  conversationId: string;
  primaryIntent: CopilotIntent;
  secondaryIntents: CopilotIntent[];
  relatedObjectIds: string[];
  requiredCapabilities: string[];
  missingCriticalInformation: string[];
  sourceRefs: string[];
  confidence: 'low'|'medium'|'high'|'not_evaluable';
};

type CopilotActionPlan = {
  id: string;
  conversationId: string;
  version: number;
  summary: string;
  status: ActionPlanStatus;
  actions: ProposedAction[];
  createdAt: string;
  confirmedAt?: string;
};

type ProposedAction = {
  id: string;
  capabilityId: string;
  ownerPrd: string;
  commandType?: string;
  operation: 'read'|'create'|'update'|'classify'|'assess'|'generate'|'activate';
  targetObjectId?: string;
  proposedPayload: Record<string, unknown>;
  sourceRefs: string[];
  assumptions: string[];
  risks: string[];
  dependsOnActionIds: string[];
  requiresConfirmation: boolean;
  approvalStatus: 'pending'|'approved'|'rejected'|'edited';
};

type ActionExecution = {
  id: string;
  actionId: string;
  idempotencyKey: string;
  status: 'pending'|'running'|'completed'|'failed'|'cancelled';
  createdObjectIds: string[];
  updatedObjectIds: string[];
  domainEventIds: string[];
  errorCode?: string;
  errorMessage?: string;
};
```

## 21. APIs y contratos

### P0 sugerido

- `POST /copilot/conversations`
- `POST /copilot/conversations/:id/messages`
- `POST /copilot/conversations/:id/assess`
- `POST /copilot/action-plans/:id/revise`
- `POST /copilot/action-plans/:id/approve`
- `POST /copilot/action-plans/:id/execute`
- `GET /copilot/action-plans/:id`
- `POST /copilot/actions/:id/retry`

Los endpoints de dominio permanecen bajo los servicios propietarios.

## 22. Analytics

- `copilot_opened`
- `copilot_message_sent`
- `copilot_intent_assessed`
- `copilot_capabilities_routed`
- `copilot_question_answered`
- `copilot_action_plan_generated`
- `copilot_action_approved`
- `copilot_action_edited`
- `copilot_action_rejected`
- `copilot_action_execution_started`
- `copilot_action_execution_completed`
- `copilot_action_execution_failed`
- `copilot_dashboard_projection_opened`
- `copilot_plan_resumed`

## 23. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-COP-001 | Mostrar un Copiloto principal en Home Portfolio Lead | MUST |
| RF-COP-002 | Interpretar texto libre y relacionarlo con objetos existentes | MUST |
| RF-COP-003 | Seleccionar capacidades sin duplicar reglas de dominio | MUST |
| RF-COP-004 | Consolidar preguntas críticas de varios motores | MUST |
| RF-COP-005 | Generar Action Plan versionado | MUST |
| RF-COP-006 | Mostrar objetos y campos antes de ejecutar | MUST |
| RF-COP-007 | Permitir aprobación total y parcial | MUST |
| RF-COP-008 | Permitir editar o rechazar acciones | MUST |
| RF-COP-009 | Ejecutar mediante comandos de dominio validados | MUST |
| RF-COP-010 | Garantizar idempotencia | MUST |
| RF-COP-011 | Mostrar ejecución parcial y errores | MUST |
| RF-COP-012 | Proyectar resultados en dashboard | MUST |
| RF-COP-013 | Conservar audit log y fuentes | MUST |
| RF-COP-014 | Respetar permisos del workspace | MUST |
| RF-COP-015 | Permitir continuar un plan guardado | SHOULD |
| RF-COP-016 | Mantener cards/formularios como atajos | MUST |

## 24. Criterios de aceptación

1. El Portfolio Lead puede iniciar una operación desde lenguaje natural.
2. Un mensaje que contiene varias necesidades produce un Action Plan ordenado.
3. El usuario puede aprobar solo una parte sin ejecutar las demás.
4. Doble clic o reintento no crea objetos duplicados.
5. El modelo no escribe directamente en datos de negocio.
6. Cada acción completada produce un objeto o estado visible en el dashboard.
7. Un error parcial muestra qué se ejecutó y permite reintentar lo fallido.
8. Una modificación de contexto pasa por PRD-04.
9. Una iniciativa amplia pasa por PRD-05 antes de publicarse.
10. Una priorización pasa por PRD-10 y queda confirmada por una persona.
11. QA puede rastrear conversación → assessment → action plan → command → event → pantalla.

## 25. Estrategia de implementación

### Release 1

- Copilot shell;
- intent assessment;
- Action Plan;
- aprobación;
- comando Crear Frente;
- proyección en dashboard.

### Release 2

- crear reto;
- importación;
- clasificación;
- Scope Assessment.

### Release 3

- cohortes y priorización;
- cambios de contexto;
- readiness y Brief.
