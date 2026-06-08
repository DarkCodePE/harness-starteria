# ADR-022: Organización, asientos y monetización de cohorte (B2B)

## Status
Accepted — 2026-06-08

## Date
2026-06-08

## Context

PRD-005 confirma el modelo **híbrido (mezcla)**: el mismo flujo de "subir iniciativa"
debe poder cobrarse al **individuo** (B2C, paga su Pro) o a la **organización** que
corre el programa (B2B, paga por sus participantes). El modelo de datos ya es B2B-first
(`Cohort` agrupa `User` y `Project`; el costo de IA se mide por cohorte en ADR-004/012;
existen `SponsorCheckpoint`, `StrategicFront → Challenge`, `ExecutiveOutput`, rol
`sponsor`). Falta el sujeto que **compra** en nombre de la organización y posee los
asientos.

## Decision

1. **`Organization`** (tabla nueva): dueño B2B de asientos y de una suscripción.
   `seatLimit Int`, `cohortId String?` (vincula a una `Cohort` existente ⇒ el pool de
   asientos = miembros de la cohorte). El `slug` se hace único en `OrgService` (findFirst
   guard), **no** `@unique`, por la disciplina de deploy aditivo (ADR-018/020).
2. **`OrganizationMember`** (tabla nueva): FK escalar `userId` (sin relación inversa en
   `User` para no editar el modelo existente más allá de un `organizationId String?`
   nullable), `role` (`owner|admin|member`).
3. **Resolución de cobertura** (en `EntitlementService.check`, ADR-020): `Subscription`
   del `User` → si no, `Subscription` de su `Organization` (vía `OrganizationMember`) →
   si no, plan **Free**. Así B2C y B2B comparten un solo code path.
4. **Cobertura de cohorte:** una `Organization` con `cohortId` y una suscripción a nivel
   org cubre **toda iniciativa de los participantes de esa cohorte** con su pool de
   créditos/asientos — **sin** campo de facturación por proyecto (no se toca `Project`).
5. **Asientos:** la creación de `TeamMember`/`OrganizationMember` se mide contra
   `Organization.seatLimit` / `Plan.limits.seats` (feature `seats`, ADR-020).
6. **B2B facturado por factura/transferencia** (RUC, factura electrónica SUNAT), no por
   Yape; el `ManualProvider` (ADR-021) cubre la activación administrativa.

## Consequences

- **+** Una sola base de entitlements sirve B2C y B2B (PRD-005 híbrido).
- **+** Reusa `Cohort` existente como pool de asientos B2B sin migración de datos.
- **+** Sin campo de billing por proyecto ⇒ `Project` intacto (deploy aditivo).
- **−** Resolución de plan con 2 saltos (User→Org) — mitigado con índices en
  `OrganizationMember(userId)` y `Subscription(organizationId, status)`.
- **−** Doble pertenencia (individuo con Pro propio dentro de una org que paga) requiere
  regla de precedencia: **gana la del `User`** si está activa, si no la de la org.

## Related
PRD-005, ADR-020 (entitlements/resolución), ADR-021 (billing/ManualProvider), ADR-009/010
(roles), ADR-004 (authz), ADR-012 (costo por cohorte), Cohort/Challenge en el schema.
