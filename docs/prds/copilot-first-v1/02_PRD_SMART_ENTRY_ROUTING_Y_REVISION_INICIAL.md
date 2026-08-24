# PRD-02 — Motor conversacional, Smart Entry, Routing y Revisión Inicial

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Diagnóstico conversacional y routing reutilizable |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuario principal | Visitante / Initiative Owner / potencial Portfolio Lead |
| Objetivo del release | Proveer un motor reutilizable que interprete qué necesita lograr el usuario, recomiende ruta, workspace y capacidades, permita corregir la lectura y entregue una propuesta al orquestador antes de crear o modificar objetos |

## 2. Problema

Los usuarios pueden llegar con necesidades distintas:

- una idea;
- una oportunidad;
- un proyecto de seis meses;
- una lista de actividades;
- una solución ya definida;
- un piloto avanzado;
- una iniciativa detenida;
- un objetivo con varios retos;
- un portafolio.

Si Starteria interpreta todo como una iniciativa de innovación temprana, obliga a validar o idear cuando el usuario necesita planificar, implementar o reconstruir. Si abre demasiadas rutas y preguntas, genera confusión.

## 3. Objetivo

Crear una puerta única y conversacional que:

1. reciba texto y fuentes;
2. diagnostique intención, madurez, unidad y gobernanza;
3. haga máximo tres preguntas adaptativas;
4. muestre una interpretación y ruta explicadas;
5. permita corregirlas;
6. proponga workspace y estructura;
7. cree Draft + snapshot solo después de confirmación;
8. abra Overview antes del core.



## 3A. Rol dentro de la arquitectura Copilot-first

PRD-02 deja de ser únicamente el onboarding de una iniciativa. Se convierte en el **motor común de diagnóstico y routing** para:

- Smart Entry de usuarios individuales;
- entrada inicial de Portfolio Lead;
- mensajes persistentes del Portfolio Copilot;
- solicitudes nuevas durante la operación;
- reorientación previa a un cambio formal de PRD-04.

PRD-02 responde **qué parece querer lograr el usuario y qué capacidades hacen falta**. PRD-00A compone esas capacidades en un Action Plan. Los PRDs propietarios ejecutan las acciones aprobadas.

```text
Mensaje + contexto autorizado
→ IntentAssessment
→ objetos y unidad detectados
→ tipo de reto/ruta/workspace cuando corresponda
→ capacidades recomendadas
→ faltantes críticos
→ interpretación corregible
→ entrega al orquestador
```

### Modos de ejecución

| Modo | Uso | Resultado |
|---|---|---|
| `initial_entry` | Primer contacto | Revisión inicial + workspace/ruta |
| `portfolio_operation` | Solicitud dentro de Portfolio Lead | Intención + capacidades + objetos relacionados |
| `initiative_guidance` | Solicitud dentro de iniciativa | Ruta/Step/siguiente acción, sin cambiar datos |
| `pre_change_assessment` | Usuario expresa un cambio | Campos que parecen cambiar; deriva a PRD-04 |
| `read_only_query` | Consulta del estado | Intención de lectura y filtros; no Action Plan de escritura |

### Nuevas dimensiones

Además del diagnóstico vigente, debe identificar:

- operación: read/create/update/classify/assess/generate/activate;
- objetos mencionados o ambiguos;
- si la solicitud contiene varias acciones;
- capacidades PRD requeridas;
- permisos faltantes;
- información crítica para construir una propuesta;
- si la respuesta puede ser de lectura o requiere Action Plan.


## 4. Pregunta de entrada

### Título

> ¿Qué necesitas llevar a cabo?

### Subtítulo

> Describe una idea, objetivo, proyecto, oportunidad, implementación o conjunto de actividades. Starteria identificará qué tienes, qué te falta y una ruta para avanzar.

### Inputs

- texto libre;
- pegar contexto;
- archivo simple;
- ejemplos rápidos;
- aviso de confidencialidad.

## 5. Diagnóstico inicial

La IA debe evaluar:

| Dimensión | Valores orientativos |
|---|---|
| intención | decidir, validar, implementar, entregar, planificar, presentar, gestionar portafolio |
| punto de partida | idea, objetivo, actividades, plan, solución, ejecución, resultados |
| claridad del foco | baja, media, alta |
| claridad de solución | baja, media, alta |
| claridad de ejecución | baja, media, alta |
| horizonte | días, semanas, 1–3 meses, 3–6 meses, más de 6 meses |
| deadline | fijo, flexible, desconocido |
| unidad | tarea, iniciativa, proyecto, programa, múltiples objetos |
| personas | solo usuario, equipo pequeño, múltiples equipos/áreas |
| gobernanza | privada, colaborativa, portafolio/comité |
| evidencia | ninguna, inicial, parcial, avanzada |
| output requerido | decisión, test, roadmap, Gantt, implementación, reporte, pitch |

## 6. Tipo de reto

- `correction`
- `growth`
- `exploration`

La clasificación explica qué busca mover el usuario y adapta copy, preguntas y criterios de valor.

## 7. Tipo de ruta

| Ruta | Criterio |
|---|---|
| `explore_validate` | alta incertidumbre sobre problema/oportunidad y solución |
| `design_solution` | foco claro, respuesta aún no elegida |
| `implement_handoff` | solución elegida, ejecución/adopción incierta |
| `plan_coordinate` | resultado y plazo definidos, necesita alcance, workstreams y cronograma |
| `reconstruct_existing` | existe trabajo previo que debe mapearse y regularizarse |
| `lightweight_plan` | necesidad pequeña que no justifica Step 0–4 |

## 8. Preguntas adaptativas

Máximo tres antes de presentar la ruta.

### Categoría 1 — Resultado

> ¿Qué necesitas haber logrado al terminar?

- tomar una decisión;
- validar una solución;
- implementar;
- entregar un proyecto;
- organizar un plan;
- presentar una propuesta;
- gestionar iniciativas;
- otro;
- no lo sé aún.

### Categoría 2 — Tiempo

> ¿Existe una fecha o plazo que debamos respetar?

### Categoría 3 — Madurez

> ¿Qué tan claro tienes actualmente el camino?

- solo tengo el objetivo;
- tengo algunas actividades;
- tengo un plan inicial;
- la solución está definida;
- ya estamos ejecutando;
- tengo resultados y necesito decidir qué sigue.

Las preguntas pueden cambiar según el input, pero deben cubrir resultado, tiempo y madurez.

## 9. Procesamiento

La pantalla debe mostrar progreso contextual:

- entendiendo qué quiere lograr;
- identificando tipo de trabajo;
- revisando alcance y plazo;
- detectando información existente;
- preparando estructura y ruta.

No mostrar un spinner vacío.

## 10. Resultado de revisión inicial

La revisión se muestra en una sola pantalla con revelación progresiva.

### Bloque 1 — Lo que Starteria entendió

Acciones:

- Sí, es correcto.
- Ajustar interpretación.
- Agregar contexto.

### Bloque 2 — Qué tipo de trabajo parece ser

Debe mostrar:

- tipo de reto;
- tipo de ruta;
- unidad detectada;
- workspace recomendado;
- razón;
- confianza.

### Bloque 3 — Nivel de claridad

Ejemplo:

| Dimensión | Estado |
|---|---|
| resultado | claro |
| alcance | parcial |
| responsables | faltantes |
| plazo | claro |
| dependencias | faltantes |

### Bloque 4 — Mirada crítica

- lo sólido;
- lo débil;
- lo riesgoso;
- ajuste recomendado.

### Bloque 5 — Estructura sugerida

Puede ser:

- una iniciativa;
- objetivo → retos → iniciativas;
- team workspace;
- portfolio;
- plan breve.

### Bloque 6 — Ruta Step 0–4 o plan breve

Mostrar:

- qué ocurrirá;
- qué output producirá cada etapa;
- qué trabajo existente se conservará.

## 11. Ajustar interpretación

El usuario puede indicar qué está mal:

- objetivo;
- problema/oportunidad;
- tipo de trabajo;
- alcance;
- segmento/área;
- solución ya definida;
- deadline;
- tipo de ruta;
- estructura;
- otro.

La IA regenera solo los bloques dependientes y conserva versiones anteriores.

## 12. Confirmación y creación

### Flujo

```text
Input
→ Diagnóstico
→ Interpretación
→ Corrección opcional
→ Confirmar estructura y ruta
→ Crear Draft / Workspace
→ Guardar InitialReviewSnapshot
→ Crear StepProgress o plan breve
→ Abrir Overview
```

### Regla

No crear `Initiative`, `StrategicObjective`, `Challenge` o `Portfolio` oficial antes de la confirmación.

## 13. Overview post-confirmación

Debe mostrar:

- objeto creado y estado Draft;
- entendimiento confirmado;
- estructura elegida;
- tipo de reto y ruta;
- mapa Step 0–4 adaptado;
- riesgo principal;
- pendientes;
- primer output;
- CTA principal.

### CTA según ruta

- Empezar Step 0.
- Revisar objetivo y retos.
- Completar plan breve.
- Revisar importación.
- Configurar workspace colaborativo.



## 14A. Integración con PRD-00A

### Output estándar al orquestador

```typescript
type ConversationalRoutingResult = {
  mode: 'initial_entry'|'portfolio_operation'|'initiative_guidance'|'pre_change_assessment'|'read_only_query';
  primaryIntent: string;
  secondaryIntents: string[];
  operation: 'read'|'create'|'update'|'classify'|'assess'|'generate'|'activate';
  relatedObjectIds: string[];
  ambiguousObjectReferences: string[];
  challengeType?: 'correction'|'growth'|'exploration';
  recommendedRoute?: WorkRoute;
  recommendedWorkspace?: 'initiative'|'personal_strategic'|'team'|'portfolio';
  workUnit: 'task'|'initiative'|'project'|'program'|'multiple_items'|'unknown';
  requiredCapabilities: string[];
  missingCriticalInformation: string[];
  assumptions: string[];
  risks: string[];
  sourceRefs: string[];
  confidence: 'low'|'medium'|'high'|'not_evaluable';
};
```

### Reglas de composición de preguntas

- PRD-02 propone preguntas; PRD-00A consolida con faltantes de otros motores.
- Máximo tres preguntas por ciclo de propuesta.
- No preguntar nuevamente datos disponibles en workspace o conversación.
- Si un faltante no impide una propuesta preliminar, se convierte en condición o pendiente.

### Confirmación

Confirmar una interpretación no ejecuta por sí sola acciones de portafolio. En `initial_entry` puede autorizar la creación del Draft definida en este PRD. En `portfolio_operation`, la interpretación alimenta un Action Plan separado de PRD-00A.


## 14. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-ENTRY-001 | La entrada debe aceptar distintas clases de trabajo | MUST |
| RF-ENTRY-002 | La IA debe diagnosticar tipo de reto y tipo de ruta | MUST |
| RF-ENTRY-003 | No se deben mostrar más de tres preguntas previas | MUST |
| RF-ENTRY-004 | Todas las preguntas deben permitir desconocimiento cuando aplique | MUST |
| RF-ENTRY-005 | El usuario debe poder corregir la interpretación | MUST |
| RF-ENTRY-006 | La IA debe explicar por qué recomienda una ruta | MUST |
| RF-ENTRY-007 | El usuario debe poder seleccionar otra ruta o estructura | MUST |
| RF-ENTRY-008 | La confirmación debe crear un snapshot inmutable | MUST |
| RF-ENTRY-009 | El sistema debe abrir Overview, no directamente el workspace profundo | MUST |
| RF-ENTRY-010 | El sistema debe reconocer necesidades que no requieren cuatro Steps | SHOULD |
| RF-ENTRY-011 | La sugerencia de workspace debe seguir PRD-01 | MUST |
| RF-ENTRY-012 | La IA no puede afirmar validación o inventar evidencia | MUST |
| RF-ENTRY-013 | El motor debe funcionar fuera del onboarding inicial | MUST |
| RF-ENTRY-014 | Debe identificar operación e intenciones secundarias | MUST |
| RF-ENTRY-015 | Debe identificar objetos existentes y referencias ambiguas | MUST |
| RF-ENTRY-016 | Debe devolver capacidades requeridas al orquestador | MUST |
| RF-ENTRY-017 | Las preguntas deben consolidarse mediante PRD-00A | MUST |
| RF-ENTRY-018 | Una consulta de lectura no debe crear un Action Plan de escritura | MUST |
| RF-ENTRY-019 | Una solicitud de cambio debe derivarse a PRD-04 antes de mutar datos | MUST |
| RF-ENTRY-020 | El resultado debe diferenciar fuente, inferencia y supuesto | MUST |

## 15. Reglas de negocio

1. La interpretación es derivada; el input y correcciones del usuario son fuente primaria.
2. La IA no reemplaza respuestas sin aceptación.
3. El usuario puede cambiar ruta antes de crear el Draft.
4. Después de crear el Draft, los cambios siguen PRD-04.
5. `lightweight_plan` no crea necesariamente una iniciativa.
6. Una estructura objetivo–retos–iniciativas debe ser confirmada antes de crear múltiples objetos.
7. La confianza no se usa para ocultar incertidumbre.
8. La ruta recomendada no aprueba Steps ni outputs.

## 16. Modelo de datos

```typescript
type WorkRoute =
  | 'explore_validate'
  | 'design_solution'
  | 'implement_handoff'
  | 'plan_coordinate'
  | 'reconstruct_existing'
  | 'lightweight_plan';

type InitialIntentAssessment = {
  id: string;
  desiredOutcome: string;
  challengeType?: 'correction' | 'growth' | 'exploration';
  recommendedRoute: WorkRoute;
  recommendedWorkspace: 'initiative' | 'personal_strategic' | 'team' | 'portfolio';
  startingPoint: string;
  problemClarity: 'low' | 'medium' | 'high';
  solutionClarity: 'low' | 'medium' | 'high';
  executionClarity: 'low' | 'medium' | 'high';
  workUnit: 'task' | 'initiative' | 'project' | 'program' | 'multiple_items';
  timeHorizon?: string;
  deadlineType: 'fixed' | 'flexible' | 'unknown';
  missingCriticalInputs: string[];
  confidence: 'low' | 'medium' | 'high';
};

type InitialReviewSnapshot = {
  id: string;
  inputText: string;
  sourceRefs: string[];
  assessment: InitialIntentAssessment;
  confirmedUnderstanding: string;
  selectedRoute: WorkRoute;
  selectedWorkspace: string;
  selectedStructure: object;
  version: number;
  confirmedAt: string;
};
```

## 17. Analytics

- `smart_entry_started`
- `smart_entry_source_added`
- `initial_assessment_generated`
- `adaptive_question_answered`
- `interpretation_adjusted`
- `route_changed_by_user`
- `structure_changed_by_user`
- `initial_route_confirmed`
- `overview_viewed`
- `step0_started_from_overview`
- `lightweight_plan_selected`

## 18. Edge cases

- input demasiado corto;
- texto con varias iniciativas;
- solución y problema contradictorios;
- usuario solicita Gantt pero no define resultado;
- usuario declara portafolio sin organización;
- ruta con baja confianza;
- archivo no procesable;
- usuario cambia de ruta varias veces;
- doble clic al confirmar;
- pérdida de sesión antes del registro.

## 19. Criterios de aceptación

1. Un usuario con proyecto de seis meses no recibe automáticamente una ruta de ideación.
2. Un usuario con idea ambigua recibe ruta de exploración.
3. Un usuario con varias líneas recibe propuesta de estructura estratégica.
4. El usuario puede corregir interpretación y ver nueva versión.
5. La ruta muestra outputs concretos por Step.
6. La confirmación es idempotente.
7. El Overview representa exactamente la versión confirmada.
