# Starteria - Portfolio Post-Entry Continuation Contract

> PROPOSED: ver `../../../CURRENT_STATE.md`. Este contrato esta propuesto para revision; no esta implementado y no autoriza incorporar runtime productivo en este repositorio.

Documento: `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`
Version: v0.1 propuesta
Estado: Propuesto para revision, no implementado
Fecha: 2026-09-12
Tipo: Experience Continuation Contract
Alcance: despues de Handoff/Confirmation de Portfolio Entry y antes de cualquier activacion de iniciativa

## 0. Autoridad

Este contrato esta subordinado a:

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados
3. `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

Este contrato no reemplaza el handoff ni crea un nuevo Core. Define la continuidad minima para que una sesion Portfolio Entry confirmada llegue a un contexto Portfolio autorizado sin activar una iniciativa por defecto.

## 1. Handoff conservado

La continuidad debe consumir el handoff existente sin reemplazar sus campos conceptuales:

- `understanding`
- `desired_outcome`
- `decision_to_enable`
- `recommended_approach`
- `alternative_approaches`
- `known_context`
- `unresolved_context`
- `gap_resolution_map`
- `evidence_or_clarity_needed`
- `starteria_path`
- `recommended_cta`
- `provenance_summary`
- `handoff_status`

Si los tipos internos no pueden representar una distincion requerida, se propone una extension versionada. No se debe esconder un objeto nuevo incompatible dentro de strings.

## 2. Estados y permisos separados

La continuidad distingue:

```text
handoff listo
-> revision confirmada
-> elegibilidad
-> autenticacion
-> claim de sesion
-> autorizacion sobre contexto Portfolio
-> conversion/continuidad efectuada
```

Claim de sesion no concede rol empresarial. Confirmar comprension no aprueba estrategia, evidencia, alineamiento, inversion ni creacion de objetos canonicos.

Cuando hubo correccion material, la continuidad solo puede usar la revision vigente confirmada. Una revision anterior no puede convertirse por idempotencia tardia.

## 3. Resultado minimo

La continuidad Portfolio debe producir:

- referencia versionada al handoff revisado;
- snapshot de contexto y procedencia;
- propietario tecnico de la sesion/claim;
- ambito Portfolio autorizado;
- estado de pendientes;
- primera accion Portfolio funcional.

No debe crear por defecto:

- `Project`;
- `TeamMember OWNER`;
- filas `Step` o modulos;
- `step0Status = IN_PROGRESS`;
- ciclo Adaptive Core;
- `StrategicFront` oficial;
- `Challenge` oficial;
- alineamiento aprobado desde inferencias.

Una creacion o modificacion empresarial requiere autorizacion y confirmacion propia del objeto afectado.

## 4. Modelo existente primero

Antes de proponer modelos nuevos, la implementacion debe evaluar:

- `Company` y `CompanyMembership`;
- `Organization` y `OrganizationMember`;
- `StrategicFront`, `Challenge` y servicios `portfolio`;
- permisos `portfolio:read` y `portfolio:write`;
- registros `PortfolioEntrySession`, `PortfolioEntryHandoff`, `PortfolioEntryConfirmation` y conversiones existentes.

No se crea `PortfolioWorkspace` por nombre conceptual. Si ningun modelo existente puede contener el snapshot de forma segura, la decision se documenta como cambio de dominio y requiere aprobacion.

## 5. Continuidad controlada por servidor

El backend fija y valida:

- perfil de sesion (`portfolio_entry_profile`, nombre final pendiente);
- version de contrato/runtime/schema;
- destino permitido;
- revision confirmada;
- permisos y ambito;
- estado de conversion.

No tienen autoridad para elegir destino:

- `intent`;
- `entry_state`;
- `starteria_path`;
- `recommended_cta`;
- query params;
- estado de UI;
- ultimo mensaje del usuario.

Sesiones nuevas deben tener perfil versionado. Sesiones antiguas sin perfil no se reclasifican silenciosamente.

## 6. Idempotencia y atomicidad

La idempotencia debe incluir como minimo:

- `sessionId`;
- operacion;
- revision confirmada;
- destino/perfil;
- usuario autenticado;
- ambito Portfolio autorizado.

Debe rechazar:

- doble conversion a destinos incompatibles;
- conversion con revision obsoleta;
- conversion de sesion ajena;
- conversion Portfolio sin permiso Portfolio;
- conversion Project desde sesion Portfolio;
- reintento con mismo idempotency key y payload distinto.

La persistencia del snapshot y el cambio de estado deben ser atomicos o tener recuperacion explicita. Un fallo no puede dejar un `Project` parcial como fallback.

## 7. Primera accion real

El destino debe mostrar:

- lectura entendida;
- datos confirmados/corregidos;
- sugerencias IA como sugerencias;
- contexto desconocido;
- evidencia o claridad pendiente;
- procedencia;
- accion Portfolio disponible en ese ambito.

Ejemplos validos si existen permisos y API:

- revisar y guardar contexto Portfolio provisional;
- editar una prioridad candidata sin publicarla;
- abrir una cola de revision Portfolio;
- preparar decision de gobernanza sin crear iniciativa.

No prometer importacion, cobertura, duplicidades o reporting si no funcionan. No reemplazar errores por demo ni por Step 0. Toda demo debe estar separada y etiquetada como demo.

## 8. Errores y bloqueos

Errores esperados:

- sesion expirada;
- claim ausente;
- revision obsoleta;
- permiso insuficiente;
- ambito Portfolio inexistente o ambiguo;
- destino incompatible;
- conversion previa incompatible;
- fallo de persistencia.

La UX/API debe preservar la sesion y explicar el bloqueo recuperable cuando sea posible. No debe crear objetos canonicos para evitar el error.

## 9. Definition of Done propuesta

- [ ] Perfil de sesion versionado.
- [ ] Snapshot Portfolio persistido sin `Project`/Steps.
- [ ] Permisos Portfolio validados en API.
- [ ] Conversion Project rechazada para sesiones Portfolio.
- [ ] Idempotencia por revision y destino.
- [ ] UI post-auth muestra contexto real y pendientes.
- [ ] Primera accion Portfolio funcional.
- [ ] Regresion Initiative conversion separada.
- [ ] Integracion DB y E2E ejecutados en entorno autorizado.
