# PRD-05 — Scope, Granularity & Decomposition Engine

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Diagnóstico de unidad, alcance y descomposición |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuarios principales | Individual, Initiative Owner, Portfolio Lead |
| Objetivo | Identificar si el contenido recibido corresponde a una iniciativa ejecutable o debe acotarse, dividirse, reagruparse o reclasificarse antes de entrar al core |

## 2. Problema

Los usuarios y empresas llaman “iniciativa” a objetos muy distintos:

- una apuesta concreta;
- un reto amplio;
- un frente estratégico;
- una transformación corporativa;
- un programa con varios proyectos;
- una lista de soluciones;
- un plan de implementación;
- un conjunto de actividades;
- varias iniciativas mezcladas en un documento.

Si Starteria acepta la etiqueta sin diagnosticar la granularidad, crea iniciativas imposibles de gestionar, con varios KPI, owners, segmentos y decisiones. Si intenta adaptar manualmente la metodología a cada caso, deja de escalar.

## 3. Principio

> Una iniciativa es la unidad más pequeña de trabajo que puede producir evidencia y recibir una decisión independiente dentro de un horizonte razonable.

No se mide por presupuesto o importancia, sino por coherencia como unidad de aprendizaje, ejecución y decisión.

## 4. Objetivo

Crear un motor estándar que:

1. extraiga unidades, resultados, KPI, segmentos, owners, soluciones y horizontes;
2. evalúe coherencia y complejidad;
3. detecte patrones de sobredimensión;
4. recomiende un tratamiento limitado y explicable;
5. permita confirmación humana;
6. conserve la fuente original y trazabilidad;
7. cree objetos resultantes compatibles con la arquitectura estándar.

## 5. Dimensiones de unidad

| Dimensión | Pregunta |
|---|---|
| resultado | ¿Existe un resultado principal? |
| reto | ¿Aborda un problema, oportunidad o incertidumbre central? |
| KPI | ¿Tiene una métrica o criterio de éxito principal? |
| hipótesis | ¿Existe una apuesta central testeable o ejecutable? |
| segmento/contexto | ¿Opera en un contexto delimitado? |
| owner | ¿Una persona/equipo puede responder por el avance? |
| decisión | ¿Puede continuar, escalar o cerrarse de manera independiente? |
| horizonte | ¿Puede producir evidencia o un entregable en el plazo disponible? |

## 6. Señales de sobredimensión

- más de un objetivo estratégico principal;
- varios KPI no conectados causalmente;
- múltiples segmentos heterogéneos;
- diferentes áreas receptoras;
- varios owners independientes;
- varias soluciones que pueden probarse por separado;
- combinación de exploración, piloto, implementación y escalamiento;
- muchas dependencias críticas antes de obtener señal;
- horizonte superior al disponible;
- varias decisiones independientes;
- transformación “integral” sin primer alcance;
- imposibilidad de formular una hipótesis o resultado principal;
- múltiples entregables que podrían cerrarse por separado.

## 7. Clasificación diagnóstica

- `well_scoped`
- `broad_but_manageable`
- `composite_initiative`
- `challenge_disguised_as_initiative`
- `strategic_front_disguised_as_initiative`
- `program_or_initiative_group`
- `phased_roadmap`
- `implementation_project`
- `blocked_by_prerequisite`
- `lightweight_work`
- `insufficient_information`

## 8. Tratamientos estándar

### 8.1 Mantener como iniciativa

Aplicar cuando existe unidad suficiente.

Resultado:

- crear o continuar Initiative;
- abrir ruta correspondiente.

### 8.2 Acotar

Aplicar cuando el resultado es único, pero el alcance es excesivo.

Variables de recorte:

- segmento;
- área;
- proceso;
- ubicación;
- muestra;
- horizonte;
- feature;
- hipótesis prioritaria.

Se conserva una “visión futura” y se crea un “alcance activo”.

### 8.3 Dividir en iniciativas bajo el mismo reto

Aplicar cuando existe un reto común con hipótesis, soluciones o decisiones independientes.

Cada nueva iniciativa requiere:

- nombre;
- owner o owner pendiente;
- contribución al reto;
- KPI/señal;
- relación con fuente;
- dependencia entre iniciativas.

### 8.4 Dividir en retos bajo el mismo frente

Aplicar cuando el contenido aborda diferentes problemas, oportunidades o incertidumbres estratégicas.

### 8.5 Reclasificar como frente estratégico

Aplicar cuando el contenido representa una prioridad amplia del negocio y no trabajo ejecutable.

Solicitar:

- KPI;
- baseline;
- meta;
- horizonte;
- sponsor;
- retos posibles.

### 8.6 Crear iniciativa paraguas / grupo

Aplicar cuando varias iniciativas comparten visión y coordinación, pero conservan decisiones independientes.

MVP:

- `initiativeGroupId`;
- relación padre/hijas;
- progreso agregado;
- no usar Step 0–4 en la entidad paraguas.

### 8.7 Roadmap por fases

Aplicar cuando existe una sola iniciativa y fases secuenciales dependientes:

- validar;
- pilotear;
- implementar;
- escalar.

Las fases son gates de inversión, no iniciativas separadas, salvo que tengan owners/KPI/decisiones independientes.

### 8.8 Separar exploración de implementación

Crear:

- iniciativa de exploración/validación;
- proyecto o iniciativa posterior de implementación condicionada.

### 8.9 Pausar por prerrequisito

Registrar:

- dependencia;
- owner de resolución;
- condición de reactivación;
- fecha de revisión;
- costo del bloqueo.

### 8.10 Transferir a ejecución

Aplicar cuando la incertidumbre crítica ya fue resuelta y el siguiente trabajo es industrialización, integración o despliegue.

Resultado:

- cerrar ciclo de innovación;
- generar handoff;
- crear roadmap/proyecto de implementación;
- mantener seguimiento de beneficio.

### 8.11 Plan breve

Aplicar a tareas o necesidades de baja complejidad que no justifican Step 0–4.

## 9. Diferencia entre acotar y dividir

### Acotar

- mismo resultado;
- mismo KPI;
- misma hipótesis;
- exceso de cobertura o despliegue.

### Dividir

- resultados diferentes;
- KPI diferentes;
- owners independientes;
- decisiones independientes;
- hipótesis distintas.

## 10. Journey

```text
Input o importación
→ Extracción de unidades
→ Diagnóstico de granularidad
→ Hallazgos explicados
→ Estructura propuesta
→ Edición humana
→ Confirmación
→ Creación/publicación de objetos
→ Reconstrucción de Steps y evidencias
```

## 11. Pantalla de recomendación

### Header

> Esta propuesta contiene más de una unidad de trabajo

### Hallazgos

Ejemplo:

- 4 resultados;
- 3 segmentos;
- 5 KPI;
- 3 áreas responsables;
- 6 soluciones independientes;
- horizonte superior a 18 meses.

### Recomendación

- tratamiento;
- razón;
- estructura visual;
- riesgos de mantenerlo unido;
- confianza.

### Acciones

- Aplicar estructura.
- Editar agrupación.
- Mantener como una iniciativa.
- Acotar manualmente.
- Guardar para revisar.
- Descartar elementos.

Si el usuario ignora una recomendación de alto riesgo, Starteria guarda la decisión y mantiene alertas de complejidad.

## 12. Fuente y trazabilidad

Todo objeto resultante debe conservar:

- source document/import session;
- página/slide/fila/fragmento;
- contenido original;
- confianza de extracción;
- edición humana;
- usuario que confirmó.

## 13. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-SCOPE-001 | El sistema debe diagnosticar granularidad antes de publicar/importar | MUST |
| RF-SCOPE-002 | Debe evaluar las ocho dimensiones de unidad | MUST |
| RF-SCOPE-003 | Debe detectar patrones de sobredimensión | MUST |
| RF-SCOPE-004 | Debe recomendar un tratamiento estándar | MUST |
| RF-SCOPE-005 | Debe explicar hallazgos y riesgos | MUST |
| RF-SCOPE-006 | El usuario debe poder editar o rechazar la propuesta | MUST |
| RF-SCOPE-007 | La IA no debe crear definitivamente objetos sin confirmación | MUST |
| RF-SCOPE-008 | Los objetos resultantes deben conservar trazabilidad de fuente | MUST |
| RF-SCOPE-009 | Debe distinguir acotar de dividir | MUST |
| RF-SCOPE-010 | Debe soportar iniciativa paraguas/grupo | SHOULD |
| RF-SCOPE-011 | Debe permitir crear una iniciativa de exploración y un proyecto condicionado | SHOULD |
| RF-SCOPE-012 | Debe mostrar dependencias entre objetos resultantes | SHOULD |

## 14. Reglas de negocio

1. La etiqueta del archivo no determina el tipo de objeto.
2. Una entidad paraguas no recorre Step 0–4.
3. Cada iniciativa hija debe tener unidad de decisión.
4. Mantener una iniciativa sobredimensionada es permitido, pero queda registrado como riesgo aceptado.
5. Dividir no duplica automáticamente evidencia; la evidencia se vincula a los objetos aplicables.
6. Una iniciativa sin owner puede quedar Draft, pero no activa.
7. Un frente no se considera cubierto por la mera existencia de iniciativas.
8. Un plan de implementación no se trata como exploración si la solución ya fue validada.

## 15. Modelo de datos

```typescript
type ScopeAssessment = {
  id: string;
  sourceType: 'entry' | 'initiative' | 'imported_item';
  sourceId: string;
  diagnosis: string;
  resultCount: number;
  kpiCount: number;
  segmentCount: number;
  ownerCount: number;
  solutionCount: number;
  independentDecisionCount: number;
  horizonRisk: 'low' | 'medium' | 'high';
  complexity: 'scoped' | 'broad' | 'composite' | 'structural' | 'not_executable';
  recommendedTreatment: string;
  findings: string[];
  confidence: 'low' | 'medium' | 'high';
};

type DecompositionProposal = {
  id: string;
  scopeAssessmentId: string;
  proposedFronts: object[];
  proposedChallenges: object[];
  proposedInitiatives: object[];
  proposedGroups: object[];
  dependencies: object[];
  status: 'draft' | 'edited' | 'confirmed' | 'rejected';
};
```

## 16. Analytics

- `scope_assessment_generated`
- `oversized_initiative_detected`
- `scope_treatment_recommended`
- `scope_proposal_edited`
- `scope_proposal_confirmed`
- `scope_recommendation_overridden`
- `initiative_split`
- `initiative_reclassified_as_challenge`
- `initiative_reclassified_as_front`
- `initiative_group_created`

## 17. Criterios de aceptación

1. Una transformación integral no entra directamente al Step 0 como una sola iniciativa sin advertencia.
2. Un alcance amplio con un KPI puede acotarse sin dividir.
3. Varias soluciones independientes se proponen como iniciativas hijas.
4. El usuario puede editar la descomposición.
5. La fuente original permanece accesible.
6. Cada iniciativa resultante tiene una decisión independiente.

## 18. Integración con Copilot-first

### Intenciones que activan este PRD

- no saber si algo es reto, iniciativa o programa;
- registrar varias líneas en un solo mensaje;
- acotar un alcance;
- dividir, agrupar o reclasificar;
- convertir un dolor amplio en unidades ejecutables.

### Output hacia el orquestador

- clasificación diagnóstica;
- señales encontradas;
- tratamiento recomendado;
- estructura visual propuesta;
- dependencias;
- riesgos de mantenerlo unido;
- confianza y fuentes.

### Confirmación

Ninguna descomposición o reclasificación se publica sin edición y confirmación humana.

### Comandos

- `CreateScopeAssessmentCommand`
- `ApplyScopeProposalCommand`
- `CreateInitiativeGroupCommand`

### Proyección

- frente/reto/iniciativas resultantes;
- relaciones padre/hija;
- alertas de complejidad;
- trazabilidad al fragmento original.

