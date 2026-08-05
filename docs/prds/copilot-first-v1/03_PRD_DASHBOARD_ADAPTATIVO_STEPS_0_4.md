# PRD-03 — Dashboard adaptativo Step 0–4

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Core adaptativo de iniciativas |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuario principal | Initiative Owner |
| Usuarios secundarios | Collaborator, Mentor, Challenge Owner, Sponsor, Portfolio Lead |
| Objetivo | Mantener un core estándar Step 0–4 que adapte preguntas, outputs y dashboard a la ruta seleccionada sin perder coherencia ni trazabilidad |

## 2. Problema

El core actual fue diseñado principalmente para definir problemas, idear, experimentar y presentar. Los nuevos casos incluyen:

- implementar una solución ya elegida;
- estructurar un proyecto de seis meses;
- producir un Gantt;
- reconstruir una iniciativa avanzada;
- transferir una solución al área receptora.

Crear un método distinto para cada caso no escala. Mantener exactamente las mismas actividades tampoco representa la necesidad real.

## 3. Objetivo

Conservar cinco funciones permanentes y adaptar:

- naming visible;
- copy;
- preguntas;
- artefactos;
- validaciones;
- roles;
- criterios de cierre;
- visualización de avance.

## 4. Invariantes

| Step | Función permanente |
|---|---|
| 0 | Entender, alinear y establecer punto de partida |
| 1 | Delimitar, fundamentar y reconocer condiciones |
| 2 | Diseñar la ruta de acción |
| 3 | Ejecutar, aprender y controlar |
| 4 | Cerrar, decidir, transferir y proyectar |

## 5. Matriz ruta × Step

### 5.1 Explore & Validate

| Step | Nombre visible | Output |
|---|---|---|
| 0 | Ordenar contexto | Context Brief |
| 1 | Definir y validar foco | Focus Definition + Evidence Map |
| 2 | Diseñar apuesta y experimento | Test Card |
| 3 | Probar, aprender y decidir | Experiment Result |
| 4 | Presentar y proyectar | Decision Brief / Pitch |

### 5.2 Design Solution

| Step | Nombre visible | Output |
|---|---|---|
| 0 | Confirmar oportunidad y condiciones | Opportunity Brief |
| 1 | Consolidar criterios de solución | Solution Criteria |
| 2 | Diseñar y seleccionar solución | Solution Card + Test Plan |
| 3 | Validar solución | Evidence & Iteration Log |
| 4 | Recomendar siguiente inversión | Solution Decision Brief |

### 5.3 Implement & Handoff

| Step | Nombre visible | Output |
|---|---|---|
| 0 | Confirmar mandato y resultado | Implementation Brief |
| 1 | Evaluar condiciones y readiness | Readiness Baseline |
| 2 | Diseñar implementación y adopción | Implementation Roadmap |
| 3 | Implementar y controlar | Execution & Adoption Review |
| 4 | Transferir y medir | Handoff Pack + Benefit Plan |

### 5.4 Plan & Coordinate

| Step | Nombre visible | Output |
|---|---|---|
| 0 | Aclarar objetivo, deadline y stakeholders | Project Brief |
| 1 | Delimitar alcance, entregables y riesgos | Scope & Deliverable Map |
| 2 | Construir workstreams y cronograma | Gantt / Action Plan |
| 3 | Ejecutar y replanificar | Status & Forecast |
| 4 | Cerrar y transferir | Closure & Continuity Plan |

### 5.5 Reconstruct Existing

| Step | Nombre visible | Output |
|---|---|---|
| 0 | Reconstruir contexto y ownership | Reconstructed Context |
| 1 | Revisar fundamentos y evidencia | Gap Assessment |
| 2 | Recuperar decisiones y plan | Reconstructed Plan |
| 3 | Consolidar ejecución y resultados | Execution Reconstruction |
| 4 | Determinar continuidad | Recovery / Closure Decision |

## 6. Layout del dashboard de iniciativa

### Zona 1 — Header ejecutivo

- nombre;
- tipo de reto;
- ruta;
- objetivo/KPI;
- estado;
- owner;
- siguiente hito.

### Zona 2 — Ancla de contexto

Sticky o accesible permanentemente:

- qué se quiere lograr;
- alcance vigente;
- usuario/área;
- KPI o criterio de éxito;
- deadline;
- restricciones;
- versión de contexto.

### Zona 3 — Mapa Step 0–4

Cada card debe mostrar:

- nombre adaptado;
- estado;
- output;
- bloqueo;
- validación pendiente;
- efecto de cambios;
- CTA.

### Zona 4 — Qué sigue

Un único CTA principal basado en estado:

- continuar output;
- revisar cambios;
- solicitar validación;
- resolver bloqueo;
- preparar handoff;
- pasar a decisión.

### Zona 5 — Repositorios transversales

- evidencias;
- decisiones;
- bloqueos;
- equipo;
- versiones;
- outputs.

## 7. Estados del Step

- `not_started`
- `in_progress`
- `ready_for_review`
- `ai_reviewed`
- `needs_iteration`
- `requires_confirmation`
- `outdated`
- `reopened`
- `blocked_by_previous_change`
- `requires_mentor`
- `requires_challenge_owner`
- `requires_sponsor`
- `approved`

Los estados de cambio son definidos por PRD-04.

## 8. Gating

### Regla general

Un Step se desbloquea por criterios de cierre, no por completar porcentaje arbitrario.

### Gating adaptable

Cada ruta define:

- campos indispensables;
- output mínimo;
- evidencia requerida;
- validador;
- decisiones permitidas.

### Soft vs hard gate

- **Hard gate:** ausencia de owner, contradicción con línea roja, falta de decisión obligatoria o cambio de contexto no resuelto.
- **Soft gate:** información parcial que puede continuar con alerta y tarea.

## 9. Gantt y plan de acción

### Regla

El Gantt es un output del Step 2 de `plan_coordinate` o `implement_handoff`, no una respuesta inmediata considerada definitiva.

### Estados del cronograma

- `ai_draft`
- `user_reviewed`
- `owners_aligned`
- `baseline`
- `replanned`
- `completed`

### Inputs mínimos

- resultado final;
- deadline;
- entregables;
- workstreams;
- dependencias;
- owners/perfiles;
- disponibilidad;
- hitos;
- supuestos;
- restricciones.

### Comportamiento IA

Si faltan datos, genera un borrador con:

- supuestos visibles;
- confianza por duración/dependencia;
- tareas por confirmar;
- hitos de revisión;
- buffers explícitos.

No debe inventar fechas como compromisos confirmados.

## 10. Reconstrucción retroactiva

Para iniciativas importadas:

- se conserva contenido de cualquier Step;
- se evalúa completitud por Step;
- se enlaza evidencia a su fuente;
- se marcan faltantes anteriores;
- no se elimina información posterior;
- no se aprueba automáticamente.

Estados de contenido:

- `empty`
- `partial`
- `complete_preliminary`
- `complete_with_observations`
- `validated`

## 11. Outputs y artefactos

Cada Step debe tener un output principal visible y versionado.

Ejemplos:

- brief;
- focus statement;
- evidence map;
- Test Card;
- solution card;
- roadmap;
- Gantt;
- implementation plan;
- status forecast;
- decision brief;
- handoff pack;
- pitch.

## 12. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-STEP-001 | El sistema debe conservar Step 0–4 para todas las rutas completas | MUST |
| RF-STEP-002 | El dashboard debe adaptar nombres y outputs según route | MUST |
| RF-STEP-003 | El ancla de contexto debe estar disponible en todos los Steps | MUST |
| RF-STEP-004 | Cada Step debe mostrar qué falta, bloqueo y siguiente acción | MUST |
| RF-STEP-005 | Los criterios de cierre deben definirse por ruta | MUST |
| RF-STEP-006 | El Gantt IA debe mostrar supuestos y estado preliminar | MUST |
| RF-STEP-007 | La reconstrucción debe preservar información posterior | MUST |
| RF-STEP-008 | Los outputs deben ser versionados | MUST |
| RF-STEP-009 | Los validadores deben mostrarse solo cuando correspondan | MUST |
| RF-STEP-010 | Los cambios de contexto deben reflejar estados del PRD-04 | MUST |
| RF-STEP-011 | El sistema debe evitar módulos de ideación cuando la solución ya está decidida | MUST |
| RF-STEP-012 | Una necesidad lightweight no debe forzarse a este dashboard | SHOULD |

## 13. Reglas de negocio

1. El usuario no puede cambiar el contexto maestro editando silenciosamente un Step.
2. Un output aprobado puede quedar desactualizado, pero no se elimina.
3. La ruta puede cambiar siguiendo PRD-04.
4. Evidencias se asocian a Step, módulo, contexto y versión.
5. Los Steps posteriores no se consideran coherentes si una dependencia crítica cambió.
6. La aprobación IA no reemplaza la validación humana requerida.
7. Un Step puede estar completo en contenido y pendiente de validación.
8. El dashboard no se convierte en un backlog operativo exhaustivo.

## 14. Modelo de datos

```typescript
type StepRouteConfiguration = {
  route: string;
  step: 0 | 1 | 2 | 3 | 4;
  displayName: string;
  purpose: string;
  outputType: string;
  requiredFields: string[];
  requiredEvidenceTypes: string[];
  validators: string[];
  hardGateRules: string[];
  softGateRules: string[];
};

type StepProgress = {
  id: string;
  initiativeId: string;
  contextVersionId: string;
  route: string;
  step: 0 | 1 | 2 | 3 | 4;
  status: string;
  contentStatus: string;
  completionScore?: number;
  missingCriticalFields: string[];
  blockers: string[];
  outputVersionId?: string;
  lastReviewedAt?: string;
};
```

## 15. Analytics

- `adaptive_step_dashboard_viewed`
- `step_started`
- `step_output_generated`
- `gantt_draft_generated`
- `gantt_baselined`
- `step_review_requested`
- `step_reopened`
- `step_blocked_by_change`
- `route_step_completion`
- `reconstructed_step_confirmed`

## 16. Criterios de aceptación

1. Un proyecto de planificación muestra Gantt como output del Step 2.
2. Una implementación no obliga a generar diez ideas.
3. Una exploración conserva Test Card y experimento.
4. El usuario siempre ve el contexto vigente.
5. Un Step desactualizado explica qué cambió.
6. La información importada se conserva aunque existan gaps previos.
7. El CTA principal es único y contextual.

## 17. Integración con Copilot-first

### Intenciones que activan este PRD

- iniciar o continuar una iniciativa;
- solicitar guía sobre el siguiente Step;
- generar o revisar un output;
- construir un plan, Gantt, experimento o handoff según ruta;
- consultar bloqueos metodológicos.

### Inputs mínimos

- Initiative confirmada;
- WorkRoute de PRD-02;
- ContextVersion vigente de PRD-04;
- StepProgress y permisos.

### Outputs hacia el orquestador

- siguiente acción;
- faltantes;
- hard/soft gates;
- output draft o versionado;
- validadores requeridos;
- links al Step o artefacto.

### Confirmación

El Copiloto puede crear borradores, pero no aprobar definitivamente un Step ni comprometer cronogramas sin revisión requerida.

### Comandos de dominio

- `StartStepCommand`
- `SaveStepOutputCommand`
- `RequestStepReviewCommand`
- `GenerateScheduleDraftCommand`

### Proyección

- card del Step;
- output versionado;
- repositorios;
- CTA “Qué sigue”.

