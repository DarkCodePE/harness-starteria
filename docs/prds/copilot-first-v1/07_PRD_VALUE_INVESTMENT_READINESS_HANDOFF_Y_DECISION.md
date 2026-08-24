# PRD-07 — Value, Investment, Readiness, Handoff & Decision

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Gestión estratégica del valor e implementación |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuarios principales | Portfolio Lead, Sponsor, Initiative Owner, Área Receptora |
| Usuarios secundarios | Challenge Owner, TI, Finanzas, Mentor |
| Objetivo | Conectar cada iniciativa con KPI, inversión, evidencia, preparación para implementación, decisión y beneficio realizado |

## 2. Problema

Las iniciativas pueden completar actividades y producir propuestas sin demostrar:

- qué métrica mueven;
- cuál era la línea base;
- cuánto se invirtió;
- qué parte del impacto es atribuible;
- si el área receptora está preparada;
- qué condición justifica una nueva inversión;
- quién será responsable después del programa;
- si el beneficio se materializó.

El handoff suele ocurrir mediante presentación o correo, dejando a innovación como owner informal y dificultando adopción, escalamiento y aprendizaje.

## 3. Objetivo

Crear un sistema que permita:

1. declarar hipótesis de contribución;
2. registrar KPI, baseline, meta e inversión;
3. diferenciar impacto potencial, validado y realizado;
4. evaluar readiness;
5. formalizar handoff;
6. recomendar una decisión;
7. registrar aprobación y siguiente inversión;
8. seguir beneficio 30/60/90;
9. producir un Decision & Implementation Brief.

## 4. Hipótesis de contribución

Formato:

> Creemos que esta iniciativa contribuirá a mover [KPI] desde [baseline] hacia [meta] mediante [mecanismo], en [contexto] y dentro de [horizonte].

Campos:

- objetivo/frente;
- reto;
- KPI principal;
- indicadores líderes;
- baseline;
- meta;
- mecanismo causal;
- población/volumen;
- horizonte;
- supuestos;
- owner del dato;
- fuente.

## 5. Tipo de valor por reto

### Correction

- horas ahorradas;
- costo evitado;
- reducción de error/retrabajo;
- riesgo/incidente evitado;
- menor tiempo;
- mejora de calidad.

### Growth

- ingreso incremental;
- margen;
- conversión;
- adopción;
- ticket;
- penetración;
- retención.

### Exploration

- incertidumbre reducida;
- hipótesis descartada;
- decisión anticipada;
- inversión mayor evitada;
- señal de demanda;
- viabilidad técnica/regulatoria.

No exigir ROI financiero temprano a una exploración sin base suficiente.

## 6. Estados del impacto

- `declared`
- `estimated`
- `validated`
- `realized`
- `attributed`
- `confirmed_by_business_or_finance`

La UI debe mostrar claramente la diferencia. No sumar impactos declarados como beneficios realizados.

## 7. Inversión

Categorías:

- horas internas;
- equipo dedicado;
- tecnología/licencias;
- proveedores;
- investigación;
- piloto;
- implementación;
- gestión del cambio;
- mantenimiento;
- soporte;
- costo de oportunidad.

Etapas de inversión:

- exploración;
- validación;
- piloto;
- implementación;
- escalamiento.

## 8. Cálculos básicos

### ROI estimado

`(beneficio atribuible - inversión total) / inversión total`

### Payback

`inversión inicial / beneficio neto mensual`

### Valor neto anual

`beneficio anual atribuible - costo recurrente anual`

### Valor esperado

`beneficio potencial × probabilidad/escenario sustentado - inversión pendiente`

Reglas:

- mostrar horizonte;
- mostrar fuentes y supuestos;
- permitir escenario bajo/base/alto;
- no usar precisión falsa;
- no presentar cálculo como validado sin evidencia y confirmación.

## 9. Implementation Readiness Assessment

Dimensiones:

1. evidencia y resultado;
2. owner de implementación;
3. área receptora;
4. sponsor;
5. presupuesto;
6. arquitectura/TI;
7. datos;
8. seguridad y legal;
9. proceso operativo;
10. capacidad;
11. adopción y cambio;
12. entrenamiento;
13. soporte y mantenimiento;
14. criterio de aceptación;
15. plan de medición.

### Estados

- `ready_to_transfer`
- `ready_with_conditions`
- `requires_additional_validation`
- `blocked`
- `not_recommended_for_implementation`

### Resultado

Debe mostrar:

- fortalezas;
- condiciones faltantes;
- bloqueadores;
- responsables;
- riesgo de implementación;
- siguiente acción;
- confianza.

## 10. Handoff

### Estados

```text
Preparing Transfer
→ Receiving Area Identified
→ Business Owner Confirmed
→ Technical/Operational Conditions Agreed
→ Implementation In Progress
→ Initial Adoption
→ Benefit Tracking
→ Transfer Closed
```

### Información obligatoria

- qué se transfiere;
- versión/alcance;
- business owner;
- operational owner;
- technical owner;
- sponsor;
- criterios de aceptación;
- recursos;
- dependencias;
- riesgos;
- soporte;
- plan de adopción;
- KPI y baseline;
- seguimiento 30/60/90;
- fecha en que innovación deja ownership operativo.

### Confirmación del área receptora

Debe aceptar explícitamente:

- alcance recibido;
- owners;
- condiciones;
- fecha;
- métrica;
- pendientes.

## 11. Centro de decisión

Decisiones:

- continuar validando;
- iterar;
- pivotear;
- ejecutar nuevo piloto;
- implementar;
- escalar en misma área;
- probar replicabilidad en otra área;
- transferir a TI/operación;
- integrar a roadmap;
- activar partner externo;
- pausar;
- cerrar con aprendizaje.

### Inputs de recomendación

- resultado de KPI;
- fuerza de evidencia;
- adopción;
- madurez;
- readiness;
- costo restante;
- inversión acumulada;
- riesgo;
- sponsor;
- replicabilidad;
- valor estratégico;
- dependencia del equipo creador.

### Output IA

- ruta recomendada;
- por qué;
- evidencia utilizada;
- faltantes;
- riesgos;
- condiciones;
- siguiente plan;
- confianza baja/media/alta.

La decisión final es humana.

## 12. Decision & Implementation Brief

Secciones:

1. Resumen ejecutivo.
2. Objetivo, frente y reto.
3. KPI, baseline, meta y resultado.
4. Solución y evidencia.
5. Impacto potencial/validado/realizado.
6. Inversión realizada y adicional.
7. Readiness.
8. Riesgos y bloqueos.
9. Recomendación IA.
10. Recomendación del Portfolio Lead/Owner.
11. Decisión solicitada.
12. Plan siguiente, owner, plazo y presupuesto.
13. Condición de revisión.

## 13. Seguimiento 30/60/90

Métricas:

- adopción;
- uso;
- calidad;
- KPI principal;
- incidentes;
- costo real;
- soporte;
- desviación de beneficio;
- satisfacción del área receptora;
- riesgos emergentes.

Al cierre:

- beneficio proyectado;
- validado;
- realizado;
- atribuido;
- diferencia;
- aprendizaje;
- decisión de continuidad.

## 14. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-VALUE-001 | Toda iniciativa corporativa debe poder declarar KPI/señal y mecanismo de contribución | MUST |
| RF-VALUE-002 | El sistema debe registrar baseline, meta, horizonte y fuente | MUST |
| RF-VALUE-003 | Debe diferenciar estados del impacto | MUST |
| RF-VALUE-004 | Debe registrar inversión por etapa y categoría | MUST P1 |
| RF-VALUE-005 | Debe calcular ROI/payback básicos con supuestos visibles | SHOULD P1 |
| RF-RDY-001 | Debe generar readiness assessment explicable | MUST |
| RF-RDY-002 | Debe registrar condiciones, owners y bloqueadores | MUST |
| RF-HO-001 | Debe crear workflow de handoff | MUST P1 |
| RF-HO-002 | El área receptora debe confirmar aceptación | MUST enterprise |
| RF-DEC-001 | Debe mostrar rutas de decisión | MUST |
| RF-DEC-002 | La IA debe sustentar recomendación y confianza | MUST |
| RF-DEC-003 | El usuario debe registrar decisión manual | MUST |
| RF-REP-001 | Debe generar Decision & Implementation Brief | MUST |
| RF-BEN-001 | Debe permitir seguimiento 30/60/90 | SHOULD P1 |
| RF-BEN-002 | No debe mezclar impacto estimado con realizado | MUST |

## 15. Reglas de negocio

1. El comité decide; la IA recomienda.
2. Sin baseline o fuente, el impacto queda declarado/estimado, no validado.
3. La inversión debe incluir horas internas cuando sea material.
4. Una iniciativa puede generar valor al cerrar una exploración y evitar inversión.
5. El readiness no equivale a éxito; evalúa condiciones para implementar.
6. La aprobación del comité no cierra automáticamente el handoff.
7. La innovación deja ownership operativo solo después de aceptación formal.
8. No recomendar escalamiento con confianza alta si falta evidencia crítica.
9. El beneficio realizado requiere periodo de observación y fuente.
10. Los cálculos financieros son editables y trazables.

## 16. Modelo de datos

```typescript
type ValueCase = {
  id: string;
  initiativeId: string;
  mainKpi: string;
  baseline?: number;
  target?: number;
  currentValue?: number;
  unit?: string;
  horizon?: string;
  mechanism: string;
  leadingIndicators: string[];
  assumptions: string[];
  sourceRefs: string[];
  impactStatus: 'declared' | 'estimated' | 'validated' | 'realized' | 'attributed' | 'confirmed';
};

type InvestmentRecord = {
  id: string;
  initiativeId: string;
  stage: 'exploration' | 'validation' | 'pilot' | 'implementation' | 'scale';
  category: string;
  amount: number;
  currency: string;
  source?: string;
};

type ReadinessAssessment = {
  id: string;
  initiativeId: string;
  dimensions: Record<string, 'ready' | 'partial' | 'missing' | 'blocked'>;
  status: 'ready_to_transfer' | 'ready_with_conditions' | 'requires_additional_validation' | 'blocked' | 'not_recommended';
  blockers: string[];
  conditions: string[];
  confidence: 'low' | 'medium' | 'high';
};

type Handoff = {
  id: string;
  initiativeId: string;
  receivingAreaId?: string;
  businessOwnerId?: string;
  operationalOwnerId?: string;
  technicalOwnerId?: string;
  status: string;
  acceptanceCriteria: string[];
  acceptedAt?: string;
};
```

## 17. Analytics

- `value_case_created`
- `baseline_confirmed`
- `investment_recorded`
- `impact_status_changed`
- `readiness_assessed`
- `readiness_condition_resolved`
- `handoff_started`
- `receiving_area_confirmed`
- `handoff_accepted`
- `decision_recommendation_generated`
- `decision_registered`
- `benefit_review_completed`

## 18. Criterios de aceptación

1. Una iniciativa muestra qué KPI intenta mover y con qué mecanismo.
2. Impacto estimado y realizado se distinguen visualmente.
3. Readiness muestra condiciones y responsables, no solo score.
4. El área receptora puede aceptar formalmente.
5. El comité recibe un Brief consistente.
6. La IA explica la recomendación y sus faltantes.
7. Se puede seguir el beneficio después de transferir.

## 19. Integración con Copilot-first

### Intenciones que activan este PRD

- evaluar si una iniciativa está lista;
- comparar valor e inversión;
- preparar comité;
- recomendar continuidad, implementación, transferencia o cierre;
- iniciar handoff;
- consultar beneficio realizado.

### Output hacia el orquestador

- ValueCase;
- ReadinessAssessment;
- condiciones y responsables;
- recomendación con evidencia;
- Decision & Implementation Brief;
- siguiente revisión.

### Confirmación

La IA no decide inversión, implementación, escalamiento ni cierre. El Action Plan debe identificar quién confirma cada decisión.

### Comandos

- `CreateValueCaseCommand`
- `AssessReadinessCommand`
- `GenerateDecisionBriefCommand`
- `RegisterDecisionCommand`
- `StartHandoffCommand`

### Proyección

- detalle ejecutivo;
- centro de decisión;
- Attention Queue;
- repositorio de Briefs;
- workflow de handoff.

