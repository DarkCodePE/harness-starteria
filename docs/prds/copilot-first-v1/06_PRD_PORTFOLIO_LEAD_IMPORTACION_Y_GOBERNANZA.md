# PRD-06 — Portfolio Lead, Copilot, Importación y Gobernanza

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Portfolio Lead |
| Versión | v4.0 Copilot-first |
| Estado | Draft accionable |
| Usuario principal | Portfolio Lead |
| Usuarios secundarios | Sponsor, Challenge Owner, Initiative Owner, Mentor, Área Receptora, TI, Admin |
| Objetivo | Permitir que el Portfolio Lead exprese qué quiere registrar, ordenar, priorizar, consultar o decidir; aprobar una propuesta estructurada; y ver el resultado reflejado en un portafolio trazable, comparable y orientado a decisiones |

## 2. Problema

Las organizaciones pueden generar iniciativas, pero suelen enfrentar:

- desconexión entre estrategia y ejecución;
- portafolios dispersos en documentos y Excel;
- estados planos como activa/inactiva;
- falta de KPI, baseline, evidencia o owner;
- bloqueos difíciles de localizar;
- poca claridad de cobertura y solapamiento;
- handoff débil al área receptora;
- reportes manuales para comité;
- decisiones de inversión con sustento incompleto;
- pérdida de aprendizajes de iniciativas cerradas.

## 3. Objetivo

Permitir que el Portfolio Lead:

1. configure un marco estratégico mínimo;
2. cree frentes y retos o importe lo existente;
3. use IA para mapear iniciativas a frente/reto;
4. confirme o corrija la clasificación;
5. reconstruya avance y evidencia;
6. identifique bloqueos, actor requerido y costo;
7. revise cobertura y solapamientos;
8. evalúe readiness e impacto;
9. lleve iniciativas a decisión, handoff y seguimiento del beneficio.

## 4. Arquitectura de entrada Copilot-first

La Home Portfolio Lead comienza con un Copiloto principal. El usuario no necesita decidir previamente si debe crear estrategia, importar, crear un reto o priorizar.

```text
Portfolio Lead expresa qué quiere lograr
→ PRD-02 interpreta intención y situación
→ PRD-00A selecciona capacidades
→ Starteria presenta Action Plan
→ usuario aprueba total o parcialmente
→ PRD-06 y otros motores ejecutan
→ dashboard refleja el resultado
```

### Acciones soportadas

- configurar programa o workspace;
- crear frente;
- crear reto;
- activar reto;
- registrar iniciativa;
- importar trabajo existente;
- clasificar y alinear;
- consultar estado, bloqueos y cobertura;
- iniciar una cohorte mediante PRD-10;
- preparar readiness o decisión mediante PRD-07;
- modificar objetos mediante PRD-04.

### Atajos estructurados

Se mantienen cards y formularios para:

- Crear frente estratégico.
- Importar iniciativas existentes.
- Crear reto rápido.
- Crear iniciativa individual.

Estos accesos ejecutan las mismas reglas y comandos que el Copiloto; no constituyen un flujo paralelo.

### Estrategia primero e importación primero

Siguen siendo patrones válidos, pero pasan a ser Action Plans posibles:

```text
Estrategia primero:
Frente → Reto → Activación → Iniciativas → Step 0–4

Importación primero:
Importar → propuesta de estructura → confirmación → publicación → regularización

Ruta híbrida:
Prioridades mínimas → importar → alinear → crear retos faltantes → confirmar
```

## 5. Jerarquía

```text
Organization / Program
└── Strategic Front
    └── Challenge
        └── Initiative
            └── Step 0–4 / Evidence / Value / Readiness / Decision
```

### Definiciones

- Frente: prioridad amplia del negocio.
- Reto: problema, oportunidad o incertidumbre accionable.
- Iniciativa: respuesta concreta y unidad de decisión.

## 6. Home Portfolio Lead + Portfolio Copilot

### Objetivo

Que el Portfolio Lead pueda explicar en lenguaje natural su situación y, al mismo tiempo, comprender el estado estructurado del portafolio.

### Layout

1. Copiloto: “¿Qué necesitas registrar, ordenar, priorizar, revisar o decidir hoy?”
2. Propuestas pendientes de aprobación.
3. Resumen ejecutivo.
4. Attention Queue.
5. Mapa estratégico.
6. Cohortes activas.
7. Decisiones pendientes.
8. Atajos estructurados.

### Estados del Copiloto

- `collecting_context`
- `interpreting`
- `asking_clarification`
- `proposal_ready`
- `awaiting_confirmation`
- `executing`
- `completed`
- `partially_completed`
- `blocked`
- `cancelled`

### Acciones de lectura

Consultas como “¿qué está bloqueado por TI?” pueden responderse sin confirmación y deben incluir filtros, fuentes y links.

### Acciones de escritura

Crear, modificar, clasificar, publicar, priorizar o decidir requiere Action Plan y confirmación según PRD-00A.

## 7. Configuración del workspace

Campos:

- organización/programa;
- periodo;
- industria/área;
- responsables;
- unidades involucradas;
- criterios de comité;
- confidencialidad;
- moneda;
- taxonomía de bloqueos;
- reglas de validación.

## 8. Frente estratégico

Campos mínimos:

- nombre;
- objetivo;
- KPI principal;
- baseline;
- meta;
- horizonte;
- sponsor;
- prioridad;
- área/unidad.

Vista:

- tracker baseline → avance → meta;
- retos asociados;
- cobertura;
- inversión y valor agregados;
- bloqueos;
- próxima acción.

## 9. Reto

Campos:

- frente;
- tipo: correction/growth/exploration;
- qué busca mover;
- por qué importa;
- KPI/señal;
- segmento/proceso;
- urgencia;
- horizonte;
- esfuerzo;
- restricciones;
- challenge owner;
- sponsor heredado/específico.

### Activación

Modalidades:

- convocatoria abierta;
- personas seleccionadas;
- squad asignado;
- equipo core;
- partner externo;
- proyecto heredado;
- iniciativa espontánea;
- mantener en definición.

La IA recomienda modalidad según urgencia, tiempo, sensibilidad, capacidad y dependencia. El Portfolio Lead confirma.

## 10. Importación

### P0 de fuentes

- Excel;
- CSV;
- texto pegado.

### P1

- PDF;
- Word;
- PowerPoint;
- URL.

### Flujo

1. Seleccionar fuente.
2. Definir contexto y confidencialidad.
3. Procesar.
4. Mostrar resumen de hallazgos.
5. Abrir bandeja de clasificación.
6. Resolver conflictos y granularidad.
7. Confirmar publicación.
8. Reconstruir Steps y evidencia.

### Detección IA

- iniciativas;
- owners;
- áreas;
- KPI;
- inversión;
- resultados;
- bloqueos;
- evidencias;
- frente/reto sugeridos;
- tipo de reto;
- Step estimado;
- solapamientos;
- riesgo;
- confianza y fuente.

## 11. Bandeja de clasificación

Tabs:

- Detectadas.
- Por clasificar.
- Conflictos.
- Listas para publicar.
- Publicadas.

Acciones:

- confirmar mapeo;
- cambiar/crear frente;
- cambiar/crear reto;
- asignar owner;
- asignar sponsor/challenge owner;
- marcar independiente;
- dividir/acotar mediante PRD-05;
- fusionar;
- descartar.

Ninguna sugerencia de IA es definitiva.

## 12. Alineamiento

Estados:

- `aligned`
- `partially_aligned`
- `unconfirmed_alignment`
- `out_of_current_priority`

Criterios:

- contribución al objetivo;
- reto abordado;
- KPI/señal;
- mecanismo de contribución;
- evidencia;
- horizonte.

La falta de alineamiento no obliga al cierre. Puede abrir un nuevo frente, una exploración o una solicitud al owner.

## 13. Gating retroactivo

Las iniciativas importadas:

- inician `imported_pending_validation`;
- conservan información de cualquier Step;
- muestran content status y validation status;
- mantienen fuentes;
- no se aprueban por extracción IA;
- pueden requerir mentor, challenge owner, sponsor o TI.

## 14. Home Portfolio Lead

Debe sentirse como centro de decisión.

### Zonas

1. Header: qué requiere atención.
2. Resumen:
   - frentes;
   - retos;
   - iniciativas;
   - bloqueos;
   - decisiones;
   - inversión;
   - readiness;
   - impacto.
3. Acciones principales.
4. Attention Queue.
5. Mapa estratégico.
6. Decisiones pendientes.

### Alertas

- sin KPI;
- sin owner;
- sin sponsor;
- sin evidencia;
- bloqueada;
- sin área receptora;
- lista para decisión;
- solapada;
- fuera de prioridad;
- impacto sin actualizar.

## 15. Vista de reto

Debe responder:

- ¿está cubierto?;
- ¿qué iniciativas lo atacan?;
- ¿qué partes faltan?;
- ¿hay solapamiento?;
- ¿qué decisiones siguen?;
- ¿qué valor está en riesgo?

Cobertura:

- sin cobertura;
- parcial;
- suficiente;
- sobrecubierta/solapada;
- lista para decisión;
- requiere reformulación;
- resuelta.

## 16. Detalle ejecutivo de iniciativa

Mostrar:

- objetivo/frente/reto;
- owner y origen;
- tipo de reto/ruta;
- Step actual y reconstrucción;
- KPI, baseline y meta;
- evidencia;
- inversión;
- impacto;
- bloqueos y actor requerido;
- readiness;
- área receptora;
- validadores;
- recomendación;
- decisión solicitada.

## 17. Taxonomía de bloqueos

- alineamiento;
- sponsor;
- ownership;
- evidencia;
- alcance;
- TI;
- datos;
- seguridad;
- legal;
- compras;
- presupuesto;
- capacidad;
- adopción;
- dependencia externa;
- solapamiento;
- cambio de contexto.

Cada bloqueo debe incluir:

- severidad;
- fecha;
- responsable de resolver;
- condición de salida;
- costo/impacto del bloqueo;
- siguiente acción.

## 18. Roles

### Portfolio Lead

- configura estrategia;
- crea/importa;
- confirma alineamiento;
- prioriza;
- revisa cobertura;
- solicita decisiones;
- genera reportes.

### Challenge Owner

- valida contexto y contribución al reto;
- confirma restricciones/KPI operativos;
- participa en activación.

### Initiative Owner

- desarrolla Step 0–4;
- completa faltantes;
- sube evidencia;
- solicita validaciones;
- propone cambios.

### Sponsor

- decide inversión, escalamiento, handoff o cierre en hitos.

### Mentor

- valida calidad metodológica.

### Área receptora

- acepta condiciones de implementación y beneficio.

### TI

- evalúa industrialización, integraciones, datos, seguridad y soporte.



## 18A. Portfolio Action Registry

| Intención | Capability | PRD propietario | Resultado |
|---|---|---|---|
| Crear frente | CreateStrategicFront | PRD-06 | StrategicFront draft/active |
| Crear reto | CreateChallenge | PRD-06 | Challenge draft |
| Activar reto | ActivateChallenge | PRD-06 | ChallengeActivation |
| Importar | StartImport | PRD-06 | ImportSession |
| Clasificar | ConfirmImportMapping | PRD-06 + PRD-05 | Objetos publicados o pendientes |
| Consultar bloqueos | QueryPortfolio | PRD-06 | Respuesta de lectura |
| Cambiar contexto | UpdateContext | PRD-04 | Nueva versión |
| Crear cohorte | CreateCohort | PRD-10 | Cohort draft |
| Priorizar | PrioritizeCandidates | PRD-10 | Assessment y selección propuesta |
| Evaluar readiness | AssessReadiness | PRD-07 | Assessment |
| Preparar decisión | PrepareDecisionBrief | PRD-07 | Brief versionado |

## 18B. Propuestas pendientes

La Home debe mostrar Action Plans:

- pendientes de aprobación;
- parcialmente aprobados;
- en ejecución;
- con error parcial;
- completados recientemente.

Cada propuesta debe indicar acciones, objetos, dependencias, fuentes, aprobadores y proyección esperada.

## 18C. Sincronización conversación–dashboard

Toda acción completada debe devolver:

- IDs creados/modificados;
- sección actualizada;
- link profundo;
- Attention Items creados/resueltos;
- siguiente acción recomendada.

El Copiloto no puede afirmar “creado” o “actualizado” hasta recibir confirmación del servicio de dominio.


## 19. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-PL-001 | Crear múltiples frentes y retos | MUST |
| RF-PL-002 | Soportar estrategia e importación como entradas convergentes | MUST |
| RF-PL-003 | Importar Excel/CSV/texto en MVP | MUST |
| RF-PL-004 | Crear bandeja de clasificación | MUST |
| RF-PL-005 | Mostrar fuente y confianza por campo sugerido | MUST |
| RF-PL-006 | Requerir confirmación antes de publicar | MUST |
| RF-PL-007 | Aplicar gating retroactivo | MUST |
| RF-PL-008 | Mostrar cobertura y solapamientos | MUST/SHOULD |
| RF-PL-009 | Mostrar bloqueos con actor y condición de salida | MUST |
| RF-PL-010 | Mostrar detalle ejecutivo | MUST |
| RF-PL-011 | Integrar readiness y decision del PRD-07 | MUST |
| RF-PL-012 | Generar reporte ejecutivo | MUST P1 |
| RF-PL-013 | Registrar auditoría de clasificación y decisiones | MUST enterprise |
| RF-PL-014 | Permitir iniciativas por clasificar sin publicarlas como activas | MUST |
| RF-PL-015 | Mantener iniciativas contextualizadas por frente/reto | MUST |
| RF-PL-016 | Mostrar Portfolio Copilot como entrada principal de Home | MUST |
| RF-PL-017 | Permitir consultas de lectura sobre el portafolio | MUST |
| RF-PL-018 | Generar Action Plans para creaciones y modificaciones | MUST |
| RF-PL-019 | Permitir aprobación total o parcial mediante PRD-00A | MUST |
| RF-PL-020 | Ejecutar las mismas reglas desde chat y atajos estructurados | MUST |
| RF-PL-021 | Mostrar propuestas pendientes y ejecuciones parciales | MUST |
| RF-PL-022 | Proyectar cada acción completada en dashboard | MUST |
| RF-PL-023 | Incluir cohortes y capacidad de PRD-10 en Home | MUST P1 |
| RF-PL-024 | No afirmar ejecución hasta confirmación del servicio | MUST |

## 20. Modelo de datos principal

Entidades:

- Organization
- Workspace
- StrategicFront
- Challenge
- ChallengeActivation
- Initiative
- ImportSession
- ImportedItem
- FieldMapping
- StepProgress
- Evidence
- Blocker
- Validation
- Decision
- Report
- CopilotConversation
- CopilotActionPlan
- ActionExecution
- Cohort (PRD-10)
- CandidateBacklog (PRD-10)

Estados base:

```typescript
type InitiativeStatus =
  | 'draft'
  | 'imported_pending_validation'
  | 'in_step_0'
  | 'in_step_1'
  | 'in_step_2'
  | 'in_step_3'
  | 'in_step_4'
  | 'blocked'
  | 'ready_for_decision'
  | 'in_handoff'
  | 'benefit_tracking'
  | 'closed';
```

## 21. Analytics

- `portfolio_home_viewed`
- `strategic_front_created`
- `challenge_created`
- `challenge_activated`
- `import_started`
- `import_processed`
- `import_mapping_confirmed`
- `import_published`
- `initiative_alignment_changed`
- `initiative_reconstruction_confirmed`
- `blocker_created`
- `attention_item_resolved`
- `coverage_status_changed`
- `decision_requested`
- `report_generated`
- `portfolio_copilot_opened`
- `portfolio_action_plan_generated`
- `portfolio_action_approved`
- `portfolio_action_partially_completed`
- `portfolio_projection_opened`

## 22. Criterios de aceptación

1. El Portfolio Lead puede comenzar desde estrategia o importación.
2. La IA propone alineamiento con razón, fuente y confianza.
3. El humano confirma antes de publicar.
4. Una iniciativa importada mantiene contenido avanzado y gaps previos.
5. La Home muestra decisiones y excepciones, no solo conteos.
6. Cada bloqueo identifica quién debe actuar.
7. El detalle ejecutivo puede usarse sin abrir todo el workspace del owner.
8. Ninguna iniciativa publicada queda completamente huérfana de contexto; puede quedar “por clasificar” fuera de la vista operativa principal.


## 23. Criterios de aceptación Copilot-first

1. El usuario puede crear un frente desde chat y verlo en el mapa estratégico.
2. Puede importar desde chat y continuar en la misma bandeja usada por el atajo.
3. Puede preguntar por bloqueos sin crear objetos.
4. Puede aprobar solo parte de una ruta propuesta.
5. Una acción fallida no oculta otras acciones completadas.
6. Una modificación de objeto confirmado deriva a PRD-04.
7. Una solicitud de cohortes deriva a PRD-10.
8. La conversación y el dashboard muestran el mismo estado fuente.
