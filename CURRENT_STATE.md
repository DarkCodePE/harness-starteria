# Current State

Estado del repositorio `DarkCodePE/harness-starteria`.

## Migration branch note

La rama `feat/traer-plataforma` incorpora una migracion candidata de la plataforma productiva desde `nmindFa/Dashboardstarteria` para revision antes de convertir este repositorio en fuente oficial productiva.

Este cambio no altera por si mismo el estado de `main`: `main` sigue siendo la fuente estable de harness/documentacion hasta que la PR de migracion sea revisada y mergeada de forma explicita.

Auditoria de la migracion:

`STARTERIA_PLATFORM_REPO_MIGRATION_AUDIT.md`

## Naturaleza

Este repositorio debe leerse como harness/documentacion publica de Starteria en `main`. Conserva contratos, comandos de trabajo, ADRs del harness, referencias de producto y estado documental.

No debe leerse como runtime productivo. No debe incorporar `backend/`, `front/`, Prisma, runtime ni tests productivos salvo decision explicita.

## E2E

El E2E de producto fue validado en el checkout productivo/autorizado `Dashboardstarteria`. Este repositorio conserva contratos, harness y estado documental asociado, pero no conserva ni ejecuta runtime productivo certificado.

## Autoridad vigente

- Authority map: `doc/STARTERIA_AUTHORITY.md`.
- Core Contract: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
  - Estado factual real: `v0.2`, `Base fundacional revisada / Por validar`.
  - Su presencia aqui no lo convierte en aprobado.
- Portfolio Entry Experience Contract aprobado:
  - `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
  - Este es el unico `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` que debe usarse como autoridad activa para Pantalla 1.
- Portfolio Post-Entry Continuation:
  - `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`.
  - Estado del contrato: `PROPOSED FOR REVIEW`.
  - Estado de implementacion observado: `IMPLEMENTED / LOCALLY VALIDATED` en el checkout productivo autorizado `Dashboardstarteria`.
  - La implementacion observada no aprueba por si misma el contrato propuesto.

## Contrato Portfolio Entry observado

El contrato aprobado fue identificado en el checkout productivo como:

`Dashboardstarteria/docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

SHA-256 observado:

`D34FDEA9A5E5BE843105DDC2A3CED4970144AE2596AC8BF5AB897A95B2A54E8A`

La copia unica en este repositorio debe conservar ese contenido.

## Portfolio Post-Entry Continuation observado

Validacion observada en el checkout productivo/autorizado `Dashboardstarteria`:

- Portfolio Entry -> Portfolio Continuation backend + DB: passed.
- Browser E2E through Portfolio Home: passed.
- Representative Portfolio Entry harness cases: passed.
- Portfolio flow does not create Project / Steps / Adaptive Core.

Este repositorio no contiene ni ejecuta esa runtime productiva. Conserva el contrato propuesto, el estado observado y el harness/documentacion.

## ADRs

- ADRs de harness: `docs/adr/`.
- ADRs de producto: `doc/product-adr/`.
- La serie de producto se mantiene separada de `docs/adr/ADR-001...007`.

## Current development target

`Portfolio Bootstrap + Home V1`

Objetivo: convertir el contexto preservado desde Portfolio Entry en la primera experiencia util de Portfolio para el usuario.

Este siguiente slice debe:

- continuar desde el contexto ya preservado por Portfolio Entry;
- permitir al Portfolio Lead revisar y ordenar su prioridad/contexto inicial;
- preparar la incorporacion posterior de iniciativas reales;
- mantener Portfolio como destino principal de la experiencia.

No debe:

- reconstruir Portfolio Entry;
- redirigir Portfolio Entry a Steps;
- crear `Project`, `Step` o Adaptive Core como efecto del onboarding Portfolio;
- canonicalizar `StrategicFront` o `Challenge` automaticamente desde sugerencias IA.

## Known limitations

- Browser E2E fue validado localmente en el checkout productivo autorizado.
- GitHub CI no fuerza actualmente ese browser E2E para este slice.
- Las llamadas live al proveedor IA no son requisito automatico de cada PR.
- `Portfolio Bootstrap + Home V1` es el siguiente vertical slice y todavia no esta validado.

## Legacy e historico

Los documentos legacy o historicos deben abrir con banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL` y enlazar a este archivo y al reemplazo vigente si existe.

Si un documento no tiene banner todavia, no debe asumirse vigente por defecto. Verificar su estado declarado, fecha, ruta y reemplazo antes de usarlo como autoridad.

## Guardrail publico

Antes de cada commit:

- revisar secretos y PII;
- excluir runtime productivo nuevo;
- excluir dumps, credenciales, tokens, archivos `.env` reales y artefactos con datos privados;
- confirmar que README y AGENTS no prometen ejecucion productiva desde este repositorio.
