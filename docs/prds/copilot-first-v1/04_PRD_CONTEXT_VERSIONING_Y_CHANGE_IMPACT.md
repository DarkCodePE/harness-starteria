# PRD-04 — Context Versioning y Change Impact

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Integridad y evolución de iniciativa |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuario principal | Initiative Owner |
| Validadores | Challenge Owner, Portfolio Lead, Sponsor, Mentor |
| Objetivo | Permitir que una iniciativa evolucione sin incoherencia, pérdida de evidencia ni sobrescritura silenciosa de Steps anteriores |

## 2. Problema

La interpretación inicial puede estar equivocada. Durante el trabajo también pueden cambiar:

- objetivo;
- tipo de reto;
- segmento;
- KPI;
- alcance;
- restricciones;
- solución;
- sponsor;
- deadline;
- reto o frente asociado.

Si cada Step se edita de forma aislada, la iniciativa termina describiendo rumbos distintos. Si cualquier cambio obliga a empezar de cero, el usuario pierde confianza y evidencia.

## 3. Objetivo

Crear un contexto maestro versionado y un flujo de cambio que:

1. detecte qué cambió;
2. clasifique su severidad;
3. calcule dependencias;
4. muestre una vista previa;
5. solicite validadores cuando corresponda;
6. aplique la nueva versión;
7. conserve trabajo anterior;
8. reabra solo lo necesario;
9. permita crear una iniciativa derivada cuando el propósito cambió completamente.

## 4. Contexto maestro

Campos mínimos:

- objetivo;
- tipo de reto;
- ruta;
- frente/reto;
- foco principal;
- segmento/área;
- KPI;
- baseline/meta;
- alcance;
- restricciones;
- solución/hipótesis vigente;
- owner;
- sponsor;
- horizonte/deadline;
- criterio de éxito.

## 5. Capas

### Fuente confirmada

Información que el usuario o rol autorizado confirma.

### Interpretaciones derivadas

- resumen;
- riesgos;
- preguntas;
- ruta;
- outputs sugeridos;
- recomendaciones.

La interpretación nunca sobrescribe la fuente sin confirmación.

## 6. Flujo antes de crear iniciativa

Durante Smart Entry:

```text
Ajustar interpretación
→ Editar o agregar contexto
→ Regenerar bloques dependientes
→ Comparar versión
→ Confirmar
```

No requiere gobernanza formal porque aún no existe una iniciativa oficial.

## 7. Flujo después de crear iniciativa

CTA:

> Actualizar contexto o rumbo

Journey:

```text
Proponer cambio
→ Detectar campos modificados
→ Clasificar nivel
→ Evaluar impacto
→ Mostrar qué se conserva y qué se revisa
→ Solicitar aprobación si aplica
→ Crear nueva ContextVersion
→ Actualizar estados de Steps/evidencias
```

## 8. Niveles de cambio

### Nivel 1 — Editorial

Ejemplos:

- nombre;
- redacción;
- corrección de dato sin efecto causal.

Resultado:

- actualización local;
- no reabre Steps;
- auditoría simple.

### Nivel 2 — Contextual

Ejemplos:

- sponsor;
- deadline;
- restricción;
- alcance de toda empresa a un área;
- meta ajustada manteniendo KPI.

Resultado:

- recalcular dependencias específicas;
- marcar outputs relacionados `requires_confirmation`;
- conservar aprobaciones no afectadas.

### Nivel 3 — Pivot

Ejemplos:

- nuevo problema principal;
- nuevo segmento;
- cambio de KPI;
- corrección → crecimiento;
- nueva solución cuando experimento ya estaba diseñado;
- nuevo reto estratégico.

Resultado:

- identificar primer Step afectado;
- reabrir desde allí;
- marcar posteriores `outdated` o `blocked_by_previous_change`;
- requerir validación según gobernanza.

### Nivel 4 — Nueva iniciativa

Ejemplos:

- cambia objetivo, usuario, KPI y resultado;
- aprendizaje abre una oportunidad diferente;
- deja de contribuir al reto original.

Resultado:

- crear iniciativa derivada;
- heredar evidencia aplicable;
- vincular origen;
- cerrar, pausar o conservar la anterior.

## 9. Matriz de impacto

| Campo cambiado | Primer Step probable | Efecto |
|---|---:|---|
| nombre | — | editorial |
| sponsor | 0/4 | gobernanza y touchpoints |
| owner | 0/3 | permisos, assignments y continuidad |
| deadline | 0/2 | plan y cronograma |
| restricción | 1/2 | solución, experimento o implementación |
| segmento/área | 1 | evidencia, actores y Steps posteriores |
| KPI | 0/1 | baseline, umbrales, experimento, impacto |
| baseline/meta | 1 | umbral y cálculo de valor |
| tipo de reto | 0 | copy y lectura de toda la ruta |
| foco central | 1 | reabrir 1 y revisar 2–4 |
| solución | 2 | mantener 0–1, revisar 2–4 |
| experimento | 2 | revisar 2–3 |
| resultado del piloto | 3 | actualizar decisión y 4 |
| frente/reto | 0/1 | revalidar alineamiento y contribución |
| salida organizacional | 4 | handoff y reporte |

La IA propone; reglas configurables y usuario autorizado confirman.

## 10. Pantalla de impacto

### Secciones

1. Cambio detectado.
2. Razón declarada.
3. Qué se mantiene.
4. Qué debe revisarse.
5. Evidencias afectadas.
6. Validadores necesarios.
7. Estado resultante de cada Step.
8. Recomendación: aplicar, editar o crear nueva iniciativa.

### Acciones

- Aplicar cambio.
- Editar propuesta.
- Crear iniciativa derivada.
- Cancelar.

## 11. Estados resultantes

- `current`
- `requires_confirmation`
- `requires_adjustment`
- `outdated`
- `reopened`
- `superseded`
- `blocked_by_previous_change`
- `revalidated`

## 12. Evidencia

Nunca se elimina por un pivot.

Clasificaciones:

- `current`
- `partially_applicable`
- `historical_context`
- `not_applicable_to_current_context`
- `requires_confirmation`
- `reused_in_branch`

Toda evidencia conserva:

- contexto;
- Step/módulo;
- hipótesis;
- segmento;
- fecha;
- fuente;
- versión.

## 13. Gobernanza de cambios

| Cambio | Puede proponer | Confirma |
|---|---|---|
| editorial | Owner/Editor | Owner |
| alcance operativo | Owner | Owner o Challenge Owner |
| segmento/foco | Owner | Challenge Owner |
| KPI estratégico | Owner/Challenge Owner | Portfolio Lead |
| frente/reto | Owner/Portfolio Lead | Portfolio Lead |
| inversión/alcance aprobado | Owner/Portfolio Lead | Sponsor/comité |
| salida/handoff | Owner | Área receptora / Sponsor |

En workspace individual, el mismo usuario puede cumplir varios roles, pero el historial se conserva.

## 14. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-CHG-001 | Toda iniciativa debe tener un contexto maestro versionado | MUST |
| RF-CHG-002 | El usuario debe poder proponer actualización desde Overview/Step | MUST |
| RF-CHG-003 | El sistema debe clasificar el nivel de cambio | MUST |
| RF-CHG-004 | El sistema debe mostrar impacto antes de aplicar | MUST |
| RF-CHG-005 | El cambio debe crear nueva versión, no sobrescribir historial | MUST |
| RF-CHG-006 | Los Steps afectados deben actualizar estado | MUST |
| RF-CHG-007 | Las evidencias no deben borrarse | MUST |
| RF-CHG-008 | Debe existir opción de crear iniciativa derivada | MUST |
| RF-CHG-009 | Cambios estratégicos deben requerir validador apropiado | MUST enterprise |
| RF-CHG-010 | El sistema debe permitir revertir a una versión previa mediante nueva versión | SHOULD |
| RF-CHG-011 | El usuario debe ver diferencias entre versiones | SHOULD |

## 15. Modelo de datos

```typescript
type InitiativeContextVersion = {
  id: string;
  initiativeId: string;
  version: number;
  objective: string;
  challengeType: 'correction' | 'growth' | 'exploration';
  workRoute: string;
  strategicFrontId?: string;
  challengeId?: string;
  primaryFocus: string;
  targetAudience?: string;
  mainKpi?: string;
  baseline?: string;
  target?: string;
  scope?: string;
  constraints: string[];
  solutionOrHypothesis?: string;
  deadline?: string;
  createdBy: string;
  changeReason?: string;
  status: 'draft' | 'current' | 'superseded';
};

type ContextChangeRequest = {
  id: string;
  initiativeId: string;
  fromVersionId: string;
  proposedFields: Record<string, unknown>;
  reason: string;
  level: 'editorial' | 'contextual' | 'pivot' | 'new_initiative';
  status: 'draft' | 'impact_assessed' | 'pending_approval' | 'approved' | 'rejected';
};

type ChangeImpactAssessment = {
  id: string;
  changeRequestId: string;
  changedFields: string[];
  earliestAffectedStep?: 0 | 1 | 2 | 3 | 4;
  affectedSteps: number[];
  unaffectedSteps: number[];
  affectedEvidenceIds: string[];
  requiredValidators: string[];
  recommendedAction: 'apply' | 'rework' | 'branch_new_initiative';
};
```

## 16. Analytics

- `context_change_started`
- `context_change_assessed`
- `context_change_cancelled`
- `context_change_approved`
- `step_marked_outdated`
- `step_revalidated`
- `initiative_branch_created`
- `evidence_reclassified_after_change`

## 17. Edge cases

- dos cambios simultáneos;
- cambio mientras Step está en revisión;
- sponsor rechaza cambio;
- nueva versión contradice evidencia anterior;
- iniciativa importada sin contexto confirmado;
- revertir a contexto previo;
- cambio de ruta sin cambio de objetivo;
- cambio de frente por reorganización corporativa;
- owner abandona iniciativa durante pivot.

## 18. Criterios de aceptación

1. Cambiar sponsor no reabre experimentos.
2. Cambiar segmento marca evidencia y Steps relacionados.
3. Cambiar solución mantiene Step 0–1 si siguen vigentes.
4. Cambiar objetivo completo ofrece nueva iniciativa.
5. Ninguna evidencia desaparece.
6. El usuario entiende por qué un Step quedó desactualizado.
7. La nueva versión y su aprobador quedan auditados.

## 19. Integración con Copilot-first

### Intenciones que activan este PRD

- cambiar objetivo, KPI, deadline, alcance, segmento, sponsor, solución, frente o reto;
- corregir información confirmada;
- pivotear;
- crear una iniciativa derivada.

### Flujo obligatorio

```text
Copiloto detecta una modificación
→ identifica objeto y versión vigente
→ PRD-04 calcula impacto
→ muestra before/after, evidencia y validadores
→ usuario aprueba
→ crea nueva ContextVersion
→ dashboard actualiza estados
```

### Output hacia el orquestador

- nivel de cambio;
- campos modificados;
- Steps afectados;
- evidencia reclasificada;
- validadores;
- recomendación de actualizar o crear rama.

### Comandos

- `ProposeContextChangeCommand`
- `ApproveContextChangeCommand`
- `CreateDerivedInitiativeCommand`

### Regla

Una frase conversacional nunca sobrescribe directamente un dato confirmado. Toda modificación relevante pasa por preview e impacto.

