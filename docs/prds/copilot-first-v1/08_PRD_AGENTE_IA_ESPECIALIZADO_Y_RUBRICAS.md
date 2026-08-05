# PRD-08 — Agente IA especializado, capacidades y rúbricas

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Copiloto y evaluador IA transversal |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuarios | Todos los roles, con outputs diferenciados |
| Objetivo | Definir el contrato común de interpretación, capability routing, recomendación, Action Plan, confianza, fuentes y guardrails para que la IA opere de forma especializada sin mutar directamente datos de negocio |

## 2. Problema

Sin un contrato transversal, cada módulo puede usar IA de manera distinta:

- respuestas genéricas;
- recomendaciones contradictorias;
- datos inventados;
- scores sin fundamento;
- cambios automáticos no confirmados;
- exceso de personalización artesanal;
- dificultad para QA.

## 3. Tesis del agente

El agente no necesita infinitos journeys. Debe dominar cinco operaciones:

1. **Clasificar:** qué tipo de objeto, reto, ruta, estado o bloqueo existe.
2. **Acotar:** reducir alcance para producir evidencia o entrega.
3. **Descomponer:** convertir trabajo compuesto en unidades coherentes.
4. **Relacionar:** conectar estrategia, retos, iniciativas, KPI, evidencia y decisiones.
5. **Recomendar:** proponer la siguiente acción o decisión con sustento.



## 3A. Separación obligatoria de capas

```text
1. Interpretación IA
2. Recomendación / Action Plan
3. Confirmación humana
4. Validación determinística
5. Comando de dominio
6. Persistencia y evento
7. Confirmación de resultado
```

La IA puede proponer payloads estructurados, pero no tiene acceso directo a repositorios de escritura. Todo cambio pasa por PRD-00A y el servicio propietario.

### Prohibiciones adicionales

- afirmar que una acción fue ejecutada antes de confirmación del backend;
- mezclar recomendaciones de varios PRDs sin declarar dependencias;
- ocultar que una acción quedó pendiente o falló;
- reusar información sensible fuera de su workspace;
- convertir un score en decisión automática;
- llamar a un comando no registrado en el Capability Registry.


## 4. Capacidades por dominio

### Smart Entry

- detectar intención;
- recomendar ruta/workspace;
- hacer preguntas adaptativas;
- explicar interpretación.

### Core Steps

- sugerir preguntas/artefactos;
- revisar completitud;
- detectar incoherencia;
- proponer siguiente acción.

### Context Change

- identificar campos cambiados;
- calcular dependencias;
- sugerir reapertura o branching.

### Scope Engine

- detectar sobredimensión;
- proponer acotar/dividir/reclasificar.

### Portfolio Lead

- extraer información;
- mapear frente/reto;
- reconstruir Steps;
- detectar bloqueos/solapamientos.

### Value & Decision

- analizar impacto;
- evaluar readiness;
- recomendar decisión;
- generar Brief.

## 5. Contrato de output

Toda respuesta analítica relevante debe incluir, según el caso:

1. **Qué entendió.**
2. **Qué información utilizó.**
3. **Qué está sólido.**
4. **Qué falta o no puede confirmar.**
5. **Riesgos y contradicciones.**
6. **Recomendación.**
7. **Siguiente acción.**
8. **Nivel de confianza.**
9. **Condiciones que cambiarían la recomendación.**
10. **Fuentes o referencias.**

## 6. Confianza

Usar:

- baja;
- media;
- alta;
- no evaluable.

No mostrar probabilidades exactas de éxito salvo que exista un modelo validado con datos históricos suficientes y explicación estadística.

### Factores

- completitud;
- calidad de fuente;
- consistencia;
- evidencia;
- validación humana;
- actualidad;
- comparabilidad;
- dependencia de supuestos.

## 7. Guardrails

La IA no puede:

- inventar evidencia;
- declarar validación sin sustento;
- publicar clasificaciones corporativas;
- asignar sponsor/owner real sin confirmación;
- aprobar Steps definitivamente;
- sobrescribir contexto;
- eliminar evidencia;
- decidir inversión;
- confirmar ROI realizado;
- recomendar escalamiento con alta confianza cuando faltan datos críticos;
- tratar un documento como verdad por estar bien redactado.

## 8. Confirmación humana

### Requiere confirmación siempre

- estructura creada;
- ruta/workspace;
- frente/reto;
- descomposición;
- cambio de contexto;
- decisión;
- inversión;
- handoff;
- clasificación de evidencia como confirmada.

### Puede aplicarse automáticamente

- mejoras de copy aceptadas previamente;
- etiquetas auxiliares no decisionales;
- orden visual;
- cálculo determinístico con inputs confirmados;
- detección preliminar de faltantes.

## 9. Trazabilidad

Cada output IA debe registrar:

- prompt template/version;
- modelo/proveedor;
- timestamp;
- usuario/rol;
- inputs y source refs;
- campos confirmados vs inferidos;
- confianza;
- respuesta;
- acción humana posterior;
- aceptación/rechazo.

Para información sensible, aplicar política de confidencialidad del workspace.

## 10. Rubricas principales

### 10.1 Routing Rubric

Dimensiones:

- intención;
- madurez;
- resultado;
- deadline;
- unidad;
- gobernanza;
- output.

### 10.2 Initiative Unit Rubric

- resultado único;
- KPI;
- hipótesis;
- segmento;
- owner;
- decisión;
- horizonte;
- dependencias.

### 10.3 Step Quality Rubric

- claridad;
- evidencia;
- consistencia;
- criterio de éxito;
- riesgos;
- ejecutabilidad;
- trazabilidad.

### 10.4 Alignment Rubric

- relación con frente;
- cobertura del reto;
- KPI;
- mecanismo;
- evidencia;
- horizonte.

### 10.5 Readiness Rubric

- valor probado;
- owner receptor;
- capacidad;
- tecnología/datos;
- seguridad/legal;
- adopción;
- soporte;
- medición.

### 10.6 Decision Rubric

- resultado;
- evidencia;
- inversión;
- riesgo restante;
- readiness;
- valor estratégico;
- replicabilidad;
- condiciones.

## 11. Estructura de recomendación

```typescript
type AIRecommendation = {
  recommendationType: string;
  summary: string;
  rationale: string[];
  evidenceUsed: string[];
  missingInformation: string[];
  risks: string[];
  assumptions: string[];
  nextActions: Array<{
    action: string;
    suggestedOwnerRole?: string;
    suggestedDueWindow?: string;
  }>;
  confidence: 'low' | 'medium' | 'high' | 'not_evaluable';
  conditionsThatWouldChangeRecommendation: string[];
  requiresHumanConfirmation: boolean;
};
```



## 11A. Capability Registry y Action Plan

Cada capacidad debe declarar:

- PRD propietario;
- intenciones soportadas;
- inputs mínimos;
- permisos;
- schema de output;
- si requiere confirmación;
- comando de dominio autorizado;
- proyección esperada en dashboard;
- pruebas de golden dataset.

```typescript
type AIProposedAction = {
  capabilityId: string;
  ownerPrd: string;
  commandType?: string;
  operation: 'read'|'create'|'update'|'classify'|'assess'|'generate'|'activate';
  targetObjectId?: string;
  proposedPayload: Record<string, unknown>;
  evidenceUsed: string[];
  missingInformation: string[];
  assumptions: string[];
  risks: string[];
  confidence: 'low'|'medium'|'high'|'not_evaluable';
  requiresHumanConfirmation: boolean;
  dependsOnActionIds: string[];
};
```

### Conflictos entre motores

Si dos capacidades proponen tratamientos incompatibles:

1. mostrar la contradicción;
2. explicar qué información produce la diferencia;
3. proponer alternativas;
4. solicitar decisión humana;
5. no ejecutar hasta resolverla.

## 11B. Estados del resultado IA

- `analysis_only`
- `proposal_draft`
- `awaiting_confirmation`
- `approved_for_execution`
- `execution_confirmed`
- `execution_partially_confirmed`
- `execution_failed`

El modelo solo produce los primeros tres. Los demás provienen del orquestador y servicios.


## 12. Roles y tono

### Initiative Owner

- orientado a acción;
- pedagógico;
- no académico;
- explica por qué.

### Portfolio Lead

- ejecutivo;
- comparativo;
- prioriza riesgo, valor y decisión.

### Sponsor/comité

- breve;
- evidencia, inversión, riesgo y solicitud.

### Mentor/Challenge Owner

- criterio de calidad y contexto;
- gaps concretos;
- aprobación/iteración sustentada.

## 13. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-AI-001 | Todo output analítico debe seguir contrato estructurado | MUST |
| RF-AI-002 | Debe registrar fuentes y campos inferidos | MUST |
| RF-AI-003 | Debe mostrar confianza explicable | MUST |
| RF-AI-004 | Debe pedir confirmación en acciones decisionales | MUST |
| RF-AI-005 | No debe inventar evidencia ni validación | MUST |
| RF-AI-006 | Debe conservar versiones de prompts/rúbricas | MUST |
| RF-AI-007 | Debe permitir aceptar, editar o rechazar sugerencias | MUST |
| RF-AI-008 | Debe registrar aceptación/rechazo para evaluación | MUST |
| RF-AI-009 | Debe adaptar tono por rol sin cambiar hechos | SHOULD |
| RF-AI-010 | Debe poder devolver “no evaluable” | MUST |
| RF-AI-011 | Debe separar extracción de recomendación | MUST |
| RF-AI-012 | Debe aplicar política de confidencialidad | MUST enterprise |

### Requerimientos Copilot-first adicionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-AI-013 | Toda capacidad invocable debe estar registrada | MUST |
| RF-AI-014 | La IA no debe tener acceso directo de escritura | MUST |
| RF-AI-015 | Debe separar propuesta de confirmación de ejecución | MUST |
| RF-AI-016 | Debe declarar dependencias entre acciones | MUST |
| RF-AI-017 | Debe detectar y exponer conflictos entre motores | MUST |
| RF-AI-018 | Debe devolver payloads compatibles con schemas de comando | MUST |
| RF-AI-019 | No debe afirmar éxito sin resultado del servicio | MUST |
| RF-AI-020 | Debe soportar ejecución parcial y errores transparentes | MUST |

## 14. Evaluación y QA

### Golden datasets

Crear casos etiquetados para:

- idea ambigua;
- proyecto de planificación;
- implementación;
- iniciativa grande;
- cambio de contexto;
- importación parcial;
- alineamiento dudoso;
- readiness bajo;
- decisión de cerrar;
- evidencia contradictoria.

### Métricas

- precisión de tipo de ruta;
- precisión de extracción;
- acuerdo humano en alineamiento;
- tasa de override;
- utilidad percibida;
- alucinaciones/fuentes inexistentes;
- consistencia entre módulos;
- calidad de siguiente acción;
- calibración de confianza.

## 15. Analytics

- `ai_recommendation_generated`
- `ai_recommendation_accepted`
- `ai_recommendation_edited`
- `ai_recommendation_rejected`
- `ai_confidence_overridden`
- `ai_missing_information_requested`
- `ai_output_marked_incorrect`
- `ai_capability_routed`
- `ai_action_plan_composed`
- `ai_action_conflict_detected`
- `ai_execution_result_received`
- `ai_source_opened`

## 16. Criterios de aceptación

1. La IA puede decir que no tiene información suficiente.
2. Toda recomendación decisional muestra evidencia y faltantes.
3. Una clasificación no se publica sin confirmación.
4. Los outputs pueden auditarse por prompt y fuente.
5. El tono cambia por rol, no la interpretación de los hechos.
6. QA puede evaluar el mismo caso con una rúbrica estable.


## 17. Integración con PRD-00A

PRD-08 provee interpretación, recomendaciones y schemas. PRD-00A controla conversación, Action Plan, aprobación y ejecución. Los PRDs de dominio validan y persisten.

### Criterios de aceptación Copilot-first

1. Un mensaje con varias necesidades genera acciones dependientes explícitas.
2. La IA no puede marcar una acción como completada por sí sola.
3. Un capability inexistente produce error controlado.
4. Conflictos de recomendaciones se muestran antes de ejecutar.
5. Los golden datasets evalúan tanto diagnóstico como composición de Action Plan.
