# Cambios y ruta de implementación

## 1. Nuevos documentos

### PRD-00A

Crea la arquitectura compartida de conversación, capability routing, Action Plan, aprobación, ejecución y sincronización.

### PRD-10

Cubre backlog, cohortes, capacidad, priorización, combinación y activación.

## 2. Documentos reestructurados

### PRD-02

Pasa de onboarding puntual a motor conversacional reutilizable.

### PRD-06

Portfolio Copilot se convierte en la entrada principal de Home. Estrategia e importación se mantienen como acciones y atajos.

### PRD-08

Separa interpretación, propuesta, confirmación, comando y persistencia. Añade Capability Registry.

## 3. Documentos actualizados

PRD-01, 03, 04, 05, 07 y 09 incorporan una sección estándar de integración con el Copiloto: intenciones, inputs, outputs, confirmaciones, comandos y proyección.

## 4. Primera secuencia de implementación

### Vertical 1 — Crear frente desde Copiloto

```text
Mensaje
→ IntentAssessment PRD-02
→ Action Plan PRD-00A
→ aprobación
→ CreateStrategicFront PRD-06
→ mapa estratégico actualizado
→ confirmación en chat
```

### Pruebas obligatorias

- editar antes de aprobar;
- aprobar parcialmente;
- doble clic;
- permiso insuficiente;
- error backend;
- refresh y continuación;
- objeto visible en dashboard;
- audit log completo.

### Vertical 2 — Importar desde Copiloto

```text
Archivo/mensaje
→ ImportSession
→ análisis
→ bandeja
→ Scope PRD-05
→ confirmación
→ publicación
```

### Vertical 3 — Cohorte y selección

```text
Solicitud de capacidad
→ crear Cohort
→ Candidate Backlog
→ evaluación
→ combinación
→ selección confirmada
→ iniciativas activadas
```

## 5. Regla de trazabilidad

Cada requisito se registra como:

```text
PRD → RF → capability → comando → archivos de código → test → evidencia → estado
```
