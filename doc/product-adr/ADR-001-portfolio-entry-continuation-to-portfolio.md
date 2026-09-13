# ADR-001: Continuidad Portfolio despues de Portfolio Entry

> PROPOSED: ver `../../CURRENT_STATE.md`. ADR de producto propuesto para revision; no esta aprobado. La implementacion fue observada como validada localmente en `Dashboardstarteria`, pero eso no aprueba esta decision ni autoriza implementar runtime productivo en este repositorio.

Estado: Propuesto para revision
Fecha: 2026-09-12
Relaciona: `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`; `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`

## Validacion observada

En el checkout productivo/autorizado `Dashboardstarteria` se observo:

- Portfolio Entry -> Portfolio Continuation backend + DB: passed.
- Browser E2E through Portfolio Home: passed.
- Representative Portfolio Entry harness cases: passed.
- Portfolio flow does not create Project / Steps / Adaptive Core.

Esa validacion es evidencia de implementacion local. No convierte este ADR ni el contrato relacionado en aprobados.

## Contexto

Portfolio Entry conserva un handoff pre-canonico y la IA no debe crear objetos corporativos ni activar Steps.

El checkout productivo validado contiene comportamiento de continuidad que debe tratarse como evidencia observada, no como autoridad de este harness. La continuidad principal propuesta para el Portfolio Lead publico es conservar lo entendido y continuar hacia un contexto Portfolio autorizado, sin crear Project, ownership de iniciativa, Steps ni Adaptive Core como efecto predeterminado del onboarding.

## Decision propuesta

Crear una continuidad Portfolio separada de la conversion Initiative:

```text
Portfolio Entry
-> Handoff Portfolio
-> revision confirmada
-> autenticacion / registro / claim
-> autorizacion de contexto Portfolio por servidor
-> snapshot versionado del handoff revisado
-> Portfolio Home o continuacion equivalente
-> primera accion funcional Portfolio
```

La API productiva debe gobernar perfil y destino. Un intent, query param, CTA manipulado o ultimo mensaje no puede elegir conversion Project para una sesion cuyo perfil fue fijado como Portfolio.

## Compatibilidad

- Sesiones ya convertidas a `Project` no se alteran ni se reclasifican.
- Sesiones antiguas sin perfil versionado no deben reclasificarse por texto o por ultimo mensaje.
- La regresion de conversion Initiative debe permanecer cubierta para no romper rutas legitimas.

## Condiciones de habilitacion

1. Contrato `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` revisado.
2. Perfil de sesion versionado y validado por servidor.
3. Modelo/persistencia de contexto Portfolio elegido con evidencia del schema existente.
4. Permisos probados para lectura/escritura Portfolio.
5. Conversion Project rechazada para sesiones Portfolio.
6. Suite Initiative conversion verde como regresion separada.
7. DB integration y E2E ejecutados en entorno autorizado.
