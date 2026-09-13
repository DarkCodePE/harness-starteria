# ADR-031: Continuidad Portfolio despues de Portfolio Entry

> PROPOSED: ver `../../CURRENT_STATE.md`. ADR de producto propuesto para revision; no esta aprobado y no autoriza implementar runtime productivo en este repositorio.

Estado: Propuesto para revision
Fecha: 2026-09-12
Relaciona: ADR-018, ADR-025, ADR-028, ADR-029, ADR-030; `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1`; `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1`

## Contexto

Portfolio Entry ya tiene runtime experimental/productivo parcial para sesion, prompts v0.2, handoff y confirmacion. El handoff conserva campos pre-canonicos y la IA no debe crear objetos corporativos ni activar Steps.

El hecho actual de implementacion es distinto en la continuidad posterior: una sesion reclamada y confirmada puede convertirse en `Project`, crear ownership de iniciativa, escribir `currentStep: 0`, `step0Status: IN_PROGRESS`, materializar Steps, inicializar Adaptive Core y retornar una vista de iniciativa.

Esta ruta puede seguir siendo una conversion Initiative legitima bajo su contrato correspondiente, pero no es la continuidad principal decidida para el Portfolio Lead publico. La decision de producto propuesta es que el visitante principal entra como Portfolio Lead: tras comprension, revision y registro debe continuar a un contexto Portfolio autorizado, conservar lo entendido y ofrecer una primera accion Portfolio real. No debe crear Project, ownership de iniciativa, Steps ni un ciclo Adaptive Core como efecto predeterminado del onboarding.

Esta ADR no describe la implementacion historica como violacion retroactiva de un contrato que no existia aprobado en ese momento. Registra una desalineacion con el target actual y los conflictos formales que aparecen al tratar esa conversion como destino principal de Portfolio Entry.

## Decision propuesta

Crear una continuidad Portfolio separada de la conversion Initiative:

```text
Portfolio Entry
-> Handoff Portfolio
-> revision confirmada
-> CONVERSION_ELIGIBLE
-> autenticacion / registro / claim
-> autorizacion de contexto Portfolio por servidor
-> snapshot versionado del handoff revisado
-> Portfolio Home o continuacion equivalente
-> primera accion funcional Portfolio
```

La API debe gobernar el perfil y destino. Un intent, `starteria_path`, query param, CTA manipulado o ultimo mensaje no puede elegir conversion Project para una sesion cuyo perfil fue fijado como Portfolio.

La conversion actual a Initiative/Project queda separada y solo puede usarse cuando el perfil/contrato aplicable lo autorice explicitamente.

## Alternativas consideradas

### Cambiar solo copy o redirect

Descartada. Redirigir a Portfolio conservando mutaciones `Project`/Steps/Adaptive Core ocultaria la canonicalizacion prematura y seguiria creando ownership de iniciativa sin una decision Portfolio.

### Rehacer todo Portfolio Entry

Descartada. Los contratos, runtime v0.2, handoff schema, session controller, idempotencia, claim y evaluadores son reutilizables. La remediacion debe aislar continuidad/destino y no reconstruir Entry desde cero.

### Usar Project ficticio como contenedor Portfolio

Descartada. Rompe la frontera Portfolio/Initiative, contamina Step 0 y crea dependencias falsas para satisfacer FKs. Si falta un contenedor Portfolio real, debe identificarse el modelo existente correcto o bloquear la exposicion hasta resolverlo.

## Compatibilidad

- Sesiones ya convertidas a `Project` no se alteran ni se reclasifican.
- Registros existentes de conversion siguen apuntando a la conversion Initiative historica.
- Sesiones antiguas sin perfil versionado no deben reclasificarse por texto o por ultimo mensaje.
- La regresion de conversion Initiative debe permanecer cubierta para no romper rutas legitimas.

## Permisos y contexto

Claim de una sesion prueba control sobre esa sesion, no autoridad empresarial. El acceso al contexto Portfolio debe resolverse con permisos existentes (`portfolio:read` / `portfolio:write`) y, donde aplique, con membresia organizacional o contenedor real ya existente. Login/email/claim no bastan para inferir autoridad corporativa.

Si el aislamiento organizacional efectivo no puede demostrarse con el modelo actual, la continuidad Portfolio publica debe quedar bloqueada hasta una remediacion minima de permisos.

## Impacto esperado

- Nueva frontera de conversion/persistencia Portfolio.
- Rechazo de conversion Project desde sesiones Portfolio.
- Persistencia de snapshot versionado del handoff confirmado.
- UI post-auth que muestra contexto real, procedencia y pendientes; no demo ni fallback a Step 0.
- Pruebas unitarias, integracion DB y E2E autorizadas para idempotencia, revision vigente, doble conversion, sesion ajena, permisos y errores.

## Condiciones de habilitacion

1. Contrato `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` revisado.
2. Perfil de sesion versionado y validado por servidor.
3. Modelo/persistencia de contexto Portfolio elegido con evidencia del schema existente.
4. Permisos probados para lectura/escritura Portfolio.
5. Conversion Project rechazada para sesiones Portfolio.
6. Suite Initiative conversion verde como regresion separada.
7. DB integration y E2E ejecutados en entorno autorizado.

## Rollback

La habilitacion debe estar detras de flag o versionado de perfil. Si falla continuidad Portfolio, no debe caer a Project/Steps/demo. Debe conservar la sesion y mostrar error recuperable o bloqueo de permisos. Las sesiones ya convertidas no se mutan en rollback.
