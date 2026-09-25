# Portfolio Entry — Authenticated Portfolio Context Establishment v0.1

Estado: IMPLEMENTED — slice acotada; la integración completa de Portfolio Home sigue fuera de alcance.

## Autoridad y derivación

La autoridad de acceso es `ScopedPortfolioAccessService`. Un contexto elegible requiere simultáneamente sesión reclamada y propiedad del usuario, `OrganizationMember`, organización existente y `OrganizationPortfolioAccessGrant` con `portfolio:read`. No se consultan roles globales, permisos globales, `portfolio_lead`, contenido de Entry, `portfolioScope` ni IA para conceder acceso.

La resolución consulta las membresías del usuario y vuelve a validar cada organización mediante la primitiva scoped. La respuesta contiene únicamente identificadores/nombres de organizaciones autorizadas y la revisión de sesión.

## Comportamientos

- Sin contexto: se conserva la sesión y la revisión; la UI comunica: “Tu avance está guardado. Antes de seguir necesitamos ubicar en qué espacio de tu organización corresponde trabajarlo.” No se crea ningún registro.
- Un contexto: se muestra el único espacio autorizado y puede continuarse sin selección adicional.
- Varios contextos: solo se muestran opciones autorizadas y la persona debe seleccionar explícitamente una.
- La selección se valida otra vez en servidor contra el usuario autenticado. Un `organizationId` no autorizado es rechazado.

## Persistencia y continuidad

No hubo cambio de schema ni migración. La selección válida se persiste en el `portfolioScope` de `PortfolioEntryPortfolioContinuation`, que es una descripción de contexto ya existente y no una fuente de autorización. La sesión original conserva su identidad, propietario, handoff, confirmación, revisión, provenance, open items, later work y organizational unknowns. El cambio de sesión usa CAS por `expectedRevision`; el mecanismo existente de idempotencia devuelve el mismo resultado para una repetición válida con la misma clave.

No se crean `Organization`, `OrganizationMember`, grants, Portfolio, Project, Initiative ni Steps. No se inicia cognición ni se llama al LLM.

## API

- `GET /api/v1/public/portfolio-entry/sessions/:sessionId/portfolio-contexts`: requiere autenticación y sesión `CLAIMED` propiedad del usuario.
- `POST /api/v1/public/portfolio-entry/sessions/:sessionId/continue-portfolio`: continúa con `expectedRevision`; acepta `organizationId` para selección explícita y solo persiste después de revalidar la autoridad scoped. Sin `organizationId`, solo permite el caso de exactamente un contexto.

La respuesta de resolución no expone capacidades, grants, tenants, provenance ni enums internos; solo opciones presentables.

## Evidencia

- `backend/modules/portfolio-entry-continuation/portfolio-entry-context-establishment.test.ts`: CTX-01–08, CTX-16–18 y CTX-22 en pruebas unitarias de autoridad y ownership.
- `front/src/app/pages/public/__tests__/AuthenticatedProvisionalContinuationPage.test.tsx`: no-contexto, contexto único, selección múltiple, continuidad del mismo Entry y ausencia de jerga interna.
- `backend/shared/authz/__tests__/scoped-portfolio-access.service.test.ts`: AUTH-SCOPE-01–07 y AUTH-SCOPE-13.
- Typechecks backend/frontend y `git diff --check` se ejecutan como gates de cierre.

## Readiness

La slice queda lista para que una siguiente slice integre la transición hacia Portfolio Home. La integración completa de Portfolio Home, iniciativa, sponsor y Steps permanece fuera de alcance.
