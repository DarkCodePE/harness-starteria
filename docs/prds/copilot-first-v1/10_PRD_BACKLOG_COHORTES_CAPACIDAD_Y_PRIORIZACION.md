# PRD-10 — Backlog, cohortes, capacidad y priorización

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Portfolio Operations / Cohort Planning |
| Versión | v0.1 |
| Estado | Draft accionable |
| Usuario principal | Portfolio Lead |
| Usuarios secundarios | Challenge Owner, Initiative Owner, Sponsor, Process/Transformation Partner, Admin |
| Objetivo | Convertir dolores, retos e iniciativas candidatas en una selección ejecutable por ciclo o cohorte, considerando estrategia, evidencia, alcance, capacidad, dependencias, ownership y decisión esperada |

## 2. Problema

PRD-06 permite crear o importar frentes, retos e iniciativas, pero no define de manera suficiente cómo responder:

- ¿qué se ejecuta ahora y qué queda para después?;
- ¿cuántas iniciativas caben realmente?;
- ¿qué combinación es viable con la capacidad disponible?;
- ¿por qué una candidata fue seleccionada, condicionada o reservada?;
- ¿cómo evitar que el Portfolio Lead se convierta en owner de todo?;
- ¿cómo operar ciclos de dos meses, trimestres u otras cohortes sin reemplazar la jerarquía estratégica?;
- ¿cómo conservar el backlog y aprendizajes entre ciclos?

Sin esta capa, la priorización termina en Excel, scores opacos o decisiones intuitivas sin trazabilidad.

## 3. Principio estructural

> La cohorte es un contenedor operativo temporal. No reemplaza Frente → Reto → Iniciativa.

```text
Program / Portfolio Workspace
├── StrategicFront → Challenge → Initiative
└── Cohort
    ├── CandidateBacklog
    ├── CapacityPlan
    ├── Selected Initiatives
    ├── Reserve List
    └── Cohort Review
```

Una iniciativa puede pertenecer a una cohorte y seguir vinculada a su frente y reto.

## 4. Objetivos

1. Consolidar candidatas provenientes de dolores, retos, drafts e importaciones.
2. Evaluar si cada candidata es una unidad ejecutable mediante PRD-05.
3. Definir capacidad real del ciclo.
4. Comparar candidatas bajo criterios explicables.
5. Recomendar una combinación, no solo un ranking individual.
6. Detectar sobreasignaciones, owners faltantes y dependencias compartidas.
7. Permitir selección humana, reserva, condicionamiento o descarte temporal.
8. Activar únicamente candidatas confirmadas y listas.
9. Conservar trazabilidad entre recomendación IA y decisión humana.
10. Medir resultados y mejorar la siguiente cohorte.

## 5. Alcance

### P0

- crear y configurar cohorte;
- backlog de candidatas;
- criterios de priorización configurables;
- evaluación individual;
- capacidad por persona/equipo y dependencia;
- recomendación de combinación;
- comparación y preview;
- selección, reserva, condicionado y no priorizado;
- aprobación humana;
- activación de seleccionadas;
- integración con Portfolio Copilot;
- analytics y auditoría.

### P1

- escenarios alternativos;
- presupuesto y capacidad financiera;
- dependencias entre cohortes;
- scoring configurable por programa;
- colaboración y aprobación multirol;
- retrospectiva y calibración de pesos;
- simulación de reemplazo por cambios de capacidad.

### Out of scope inicial

- optimizador matemático avanzado;
- asignación automática definitiva de personas;
- reemplazo de planificación de tareas;
- predicción probabilística de éxito;
- priorización basada únicamente en ROI.

## 6. Fuentes de candidatas

Una candidata puede originarse como:

- dolor o necesidad importada;
- reto sin iniciativa;
- Initiative Draft;
- iniciativa importada pendiente de validación;
- iniciativa pausada que solicita reactivación;
- oportunidad sugerida por análisis de cobertura;
- iniciativa reservada de una cohorte anterior.

Antes de ser comparable debe tener una unidad mínima o una recomendación pendiente de PRD-05.

## 7. Estados de candidata

```typescript
type CandidateStatus =
  | 'captured'
  | 'needs_scope_review'
  | 'needs_information'
  | 'eligible'
  | 'recommended'
  | 'conditionally_recommended'
  | 'selected'
  | 'reserve'
  | 'not_prioritized'
  | 'blocked_by_prerequisite'
  | 'activated'
  | 'withdrawn';
```

## 8. Crear cohorte

### Campos

- nombre;
- programa/workspace;
- propósito;
- periodo;
- fecha de inicio y fin;
- capacidad objetivo de iniciativas;
- capacidad de personas/equipos;
- presupuesto opcional;
- criterios y pesos;
- tipos de trabajo permitidos;
- validadores;
- fecha de decisión;
- reglas de reemplazo.

### Estados

- `draft`
- `collecting_candidates`
- `under_assessment`
- `selection_proposed`
- `awaiting_confirmation`
- `confirmed`
- `in_progress`
- `under_review`
- `closed`
- `cancelled`

## 9. Capacidad

### Dimensiones

- horas/disponibilidad del Portfolio Lead;
- Initiative Owners disponibles;
- apoyo de Procesos/Transformación;
- mentores/validadores;
- dependencias TI, Datos, Legal, Seguridad, Operaciones;
- presupuesto;
- cupos máximos;
- fechas no disponibles;
- carga ya comprometida.

### Reglas

1. Portfolio Lead no es Initiative Owner por defecto.
2. Una candidata sin owner puede evaluarse, pero no activarse.
3. Sobreasignación genera alerta y requiere resolución explícita.
4. Una dependencia compartida puede limitar la combinación aunque cada candidata sea viable individualmente.
5. La capacidad se versiona al confirmar la selección.
6. Cambios posteriores generan reevaluación y posible reemplazo.

## 10. Criterios de priorización

### Obligatorios P0

| Criterio | Pregunta |
|---|---|
| Alineamiento | ¿Contribuye a un frente/KPI vigente? |
| Impacto potencial | ¿Qué valor, costo, riesgo o aprendizaje podría mover? |
| Evidencia | ¿Qué sustenta que el dolor/oportunidad es real? |
| Viabilidad temporal | ¿Puede producir señal o entregable dentro de la cohorte? |
| Unidad y alcance | ¿Es una iniciativa ejecutable o necesita PRD-05? |
| Ownership | ¿Existe una persona/equipo responsable? |
| Capacidad | ¿Hay disponibilidad real? |
| Dependencias | ¿Qué actor o condición puede bloquear? |
| Decisión esperada | ¿Qué decisión podrá tomarse al cierre? |

### Pesos

Los pesos son configurables y visibles. Starteria puede proponer valores iniciales, pero no existe una ponderación universal.

### Tipos de reto

La lectura se adapta:

- correction: costo, tiempo, error, riesgo;
- growth: adopción, conversión, ingreso, expansión;
- exploration: incertidumbre reducida, decisión anticipada, señal de demanda.

No exigir ROI temprano a exploraciones.

## 11. Evaluación individual

Cada candidata muestra:

- información utilizada;
- criterio por criterio;
- evidencia y fuente;
- datos faltantes;
- condiciones;
- bloqueadores;
- recomendación preliminar;
- confianza;
- acciones para volverse elegible.

No debe reducirse a un score único. Un score puede apoyar comparación, pero siempre se acompaña de explicación.

## 12. Recomendación de combinación

Starteria evalúa el conjunto para evitar que un ranking individual produzca una combinación inviable.

### Debe considerar

- número objetivo de iniciativas;
- capacidad por owner;
- dependencias compartidas;
- diversidad o concentración estratégica;
- balance entre corto plazo y aprendizaje;
- conflictos de calendario;
- iniciativas complementarias o redundantes;
- condiciones de activación.

### Output

- seleccionadas recomendadas;
- reserva;
- condicionadas;
- no priorizadas;
- razones por candidata;
- razones de la combinación;
- capacidad utilizada y disponible;
- riesgos de la selección;
- alternativas.

## 13. Journey Copilot-first

```text
Portfolio Lead: “Necesito ejecutar dos iniciativas en los próximos dos meses”
→ PRD-02 interpreta objetivo, horizonte y capacidad
→ PRD-06 identifica/importa candidatas
→ PRD-05 evalúa granularidad
→ PRD-10 propone cohorte, criterios y capacidad
→ Copiloto presenta Action Plan
→ usuario aprueba creación de cohorte y evaluación
→ Starteria presenta combinación
→ usuario reemplaza, condiciona o confirma
→ seleccionadas se activan y aparecen en dashboard
```

## 14. Pantallas

### 14.1 Candidate Backlog

Filtros:

- frente;
- reto;
- tipo;
- estado;
- owner;
- dependencia;
- cohorte;
- elegibilidad.

### 14.2 Crear/editar cohorte

Campos, capacidad, criterios y validadores.

### 14.3 Comparador

Columnas configurables, evidencia, condiciones, carga y dependencias.

### 14.4 Propuesta de selección

- combinación recomendada;
- capacidad;
- alertas;
- alternativas;
- acciones de aprobar/reemplazar/editar.

### 14.5 Detalle de cohorte

- objetivo;
- seleccionadas;
- reserva;
- capacidad;
- estado de iniciativas;
- decisiones y bloqueos;
- próxima revisión.

### 14.6 Retrospectiva

- resultados;
- capacidad real versus planificada;
- candidatas reemplazadas;
- causas;
- aprendizaje para siguiente cohorte.

## 15. Aprobación y activación

### Acciones

- confirmar selección completa;
- aprobar una candidata;
- reemplazar;
- mover a reserva;
- condicionar;
- no priorizar;
- devolver a scope review;
- guardar borrador.

### Gates de activación

- unidad ejecutable;
- frente/reto o estado por clasificar permitido;
- owner confirmado;
- horizonte y decisión esperada;
- capacidad reservada;
- bloqueadores críticos resueltos o aceptados;
- tipo de ruta propuesto por PRD-02.

Al activar:

- se crea/vincula Initiative;
- se asigna CohortMembership;
- se crea StepProgress;
- se actualiza capacidad;
- se registra la razón de selección.

## 16. Cambios durante la cohorte

Cambios de owner, capacidad, deadline o prioridad:

- PRD-04 evalúa impacto;
- PRD-10 recalcula capacidad y combinación;
- el usuario decide mantener, reemplazar, reducir alcance o pausar;
- la selección anterior se conserva en historial.

## 17. Roles

### Portfolio Lead

Configura, compara, propone y confirma dentro de sus permisos.

### Challenge Owner

Valida prioridad, contexto y condiciones de un reto.

### Initiative Owner

Confirma disponibilidad y ejecuta la iniciativa.

### Sponsor

Confirma prioridades, recursos o excepciones cuando corresponda.

### Área de Procesos / partner funcional

Puede declarar disponibilidad y participar como colaborador o validador, sin convertirse automáticamente en owner.

## 18. Modelo de datos

```typescript
type Cohort = {
  id: string;
  workspaceId: string;
  programId?: string;
  name: string;
  purpose: string;
  startDate: string;
  endDate: string;
  targetInitiativeCount: number;
  status: 'draft'|'collecting_candidates'|'under_assessment'|'selection_proposed'|'awaiting_confirmation'|'confirmed'|'in_progress'|'under_review'|'closed'|'cancelled';
  criteriaVersionId: string;
  capacityPlanId: string;
  createdBy: string;
};

type CohortCandidate = {
  id: string;
  cohortId: string;
  sourceType: 'pain'|'challenge'|'initiative_draft'|'imported_initiative'|'paused_initiative'|'coverage_opportunity'|'prior_cohort_reserve';
  sourceObjectId: string;
  status: CandidateStatus;
  scopeAssessmentId?: string;
  prioritizationAssessmentId?: string;
};

type CapacityPlan = {
  id: string;
  cohortId: string;
  version: number;
  peopleAllocations: Array<{
    personId?: string;
    role: string;
    availableHours?: number;
    maxConcurrentInitiatives?: number;
  }>;
  sharedDependencies: Array<{
    type: string;
    ownerId?: string;
    availableCapacity?: string;
  }>;
};

type PrioritizationAssessment = {
  id: string;
  candidateId: string;
  criteriaVersionId: string;
  evaluations: Array<{
    criterion: string;
    assessment: string;
    score?: number;
    evidenceRefs: string[];
    missingInformation: string[];
  }>;
  recommendation: 'include'|'reserve'|'condition'|'not_prioritize'|'scope_first'|'resolve_prerequisite';
  confidence: 'low'|'medium'|'high'|'not_evaluable';
};

type CohortSelection = {
  id: string;
  cohortId: string;
  version: number;
  selectedCandidateIds: string[];
  reserveCandidateIds: string[];
  conditionedCandidateIds: string[];
  rejectedCandidateIds: string[];
  aiRecommendationSnapshotId?: string;
  confirmedBy: string;
  confirmedAt: string;
  rationale: string;
};
```

## 19. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-COH-001 | Crear cohortes con periodo y capacidad | MUST |
| RF-COH-002 | Consolidar candidatas de distintas fuentes | MUST |
| RF-COH-003 | Integrar Scope Assessment antes de comparar | MUST |
| RF-COH-004 | Definir criterios y pesos visibles | MUST |
| RF-COH-005 | Evaluar candidatas con fuentes y faltantes | MUST |
| RF-COH-006 | Registrar capacidad por personas y dependencias | MUST |
| RF-COH-007 | Detectar sobreasignación | MUST |
| RF-COH-008 | Recomendar una combinación, no solo ranking | MUST |
| RF-COH-009 | Permitir aprobar, reemplazar, reservar o condicionar | MUST |
| RF-COH-010 | Requerir confirmación humana | MUST |
| RF-COH-011 | Conservar no seleccionadas en backlog | MUST |
| RF-COH-012 | Activar solo candidatas con gates cumplidos | MUST |
| RF-COH-013 | Mantener vínculo frente/reto/iniciativa | MUST |
| RF-COH-014 | Integrar con Portfolio Copilot | MUST |
| RF-COH-015 | Versionar selecciones y capacidad | MUST |
| RF-COH-016 | Soportar lista de reserva | MUST |
| RF-COH-017 | Registrar recomendación IA versus decisión humana | MUST |
| RF-COH-018 | Permitir retrospectiva de cohorte | SHOULD |

## 20. Reglas de negocio

1. La capacidad máxima no puede ignorarse sin registrar excepción y aprobador.
2. El Portfolio Lead no es owner por defecto.
3. Una candidata no elegible no puede activarse.
4. Las candidatas no seleccionadas no desaparecen.
5. Una selección confirmada crea una versión inmutable.
6. Reemplazar una iniciativa conserva la razón y la historia.
7. No existe un score universal ni una probabilidad de éxito no validada.
8. La IA recomienda; Portfolio Lead o rol autorizado confirma.
9. La cohorte no altera la contribución estratégica de una iniciativa.
10. Una iniciativa puede transferirse a otra cohorte mediante una nueva decisión, no sobrescribiendo la anterior.

## 21. Analytics

- `cohort_created`
- `cohort_capacity_configured`
- `candidate_added`
- `candidate_scope_review_requested`
- `candidate_assessed`
- `cohort_combination_recommended`
- `candidate_replaced`
- `candidate_moved_to_reserve`
- `cohort_selection_confirmed`
- `candidate_activated`
- `capacity_overload_detected`
- `cohort_selection_overridden`
- `cohort_review_completed`

## 22. Edge cases

- no existen suficientes candidatas elegibles;
- todas dependen de la misma persona;
- falta owner para las mejores candidatas;
- una candidata cambia de alcance durante selección;
- dos iniciativas son complementarias pero exceden capacidad;
- sponsor impone una candidata;
- capacidad cambia después de confirmar;
- candidata seleccionada queda bloqueada antes de iniciar;
- cohorte se cancela;
- dos Portfolio Leads editan simultáneamente.

## 23. Criterios de aceptación

1. Puede crearse una cohorte con capacidad para dos iniciativas.
2. El sistema impide o alerta seleccionar más de la capacidad.
3. Una candidata sin owner no puede activarse.
4. La recomendación explica criterios, fuentes y condiciones.
5. La combinación considera dependencias compartidas.
6. El Portfolio Lead puede reemplazar una candidata.
7. La no seleccionada permanece en backlog o reserva.
8. La selección confirmada actualiza Home, cohorte e iniciativas.
9. La ruta Step 0–4 se asigna después de confirmar la iniciativa.
10. La decisión humana queda comparada con la recomendación IA.
11. Un cambio de capacidad activa reevaluación y preserva historial.
12. QA puede rastrear candidata → assessment → selección → activación.
