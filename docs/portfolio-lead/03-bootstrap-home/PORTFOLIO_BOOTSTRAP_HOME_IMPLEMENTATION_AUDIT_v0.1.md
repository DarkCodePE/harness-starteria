# STARTERIA — Portfolio Bootstrap + Home Implementation Audit v0.1

**Estado:** Auditoría inicial de reutilización antes de Tech Spec
**Repositorio auditado:** `nmindFa/Dashboardstarteria` (`main`)
**Contrato objetivo:** `PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1`
**Propósito:** identificar qué piezas existentes pueden mantenerse, cuáles deben adaptarse, cuáles no deben gobernar el nuevo Bootstrap y qué capacidades faltan.

---

# 1. Conclusión ejecutiva

La plataforma Portfolio Lead existente **sí contiene una base reutilizable importante**, especialmente en:

- shell/rutas de Portfolio;
- Home visual;
- modelos de frentes, retos e iniciativas;
- provider/context y capa de servicios;
- Attention Queue visual;
- persistencia backend de Portfolio;
- patrones de preview/confirmación/provenance existentes en otros módulos.

Sin embargo, la lógica actual de primera experiencia sigue siendo predominantemente **object-first**:

```text
crear frente
→ crear reto
→ activar
→ iniciativas
```

y contiene un acceso explícito a iniciativa individual `Step 0–4`. Esa secuencia **no debe gobernar Portfolio Bootstrap v0.1**.

La recomendación es **evolucionar y reutilizar**, no rehacer Portfolio Lead desde cero.

---

# 2. KEEP — reutilizar prácticamente sin cambio conceptual

## K1 — `PortfolioLeadLayout` y rutas `/portfolio/*`

Mantener el shell de Portfolio y el routing existente como base de navegación.

## K2 — `PortfolioLeadHomePage` como superficie contenedora

La página ya compone Home mediante view models y componentes separados. Es una buena superficie para convertir Home en adaptativa según `HOME-A...HOME-F`.

## K3 — `PortfolioLeadHomeExperience` como biblioteca visual

Reutilizar patrones de:

- Welcome Banner;
- Attention Queue;
- cards;
- acciones;
- empty states;
- recent activity.

No conservar necesariamente su contenido/orden actual.

## K4 — `PortfolioLeadContext` / Provider

Mantener como capa de hidratación y refresh de datos Portfolio, evitando trasladar la lógica B0–B5 al componente visual.

## K5 — `portfolioService` + backend `PortfolioService`

Existe una capa API real para Strategic Fronts, Challenges e Initiatives. Debe reutilizarse para objetos canónicos donde aplique.

## K6 — Attention Queue como patrón de interacción

La UI de atención existente encaja directamente con `HOME-E`. Debe cambiar la taxonomía y fuente de señales, no descartarse.

## K7 — patrones de provenance / confirmación ya existentes

Reutilizar principios de:

- `AutofillField`;
- `AutofillHydrator`;
- `ProvenancePopover`;
- Initial Review preview/confirm;
- Public proposal accept/edit.

Son especialmente adecuados para `B3 AI provisional structuring → B4 Human material review`.

---

# 3. UPDATE — componentes útiles pero con lógica incompatible con Bootstrap v0.1

## U1 — `PortfolioLeadHomePage`

Actualmente presupone un portfolio ya estructurado y muestra banner ejecutivo, acciones, strategic overview, summary y recent activity.

Debe evolucionar para resolver primero un `homeState` derivado:

```text
HOME-A bootstrap
HOME-B anchor/no work
HOME-C staging/review
HOME-D first reading
HOME-E attention
HOME-F decision-ready
```

No debe renderizar siempre el mismo dashboard.

## U2 — `getRecommendedNextAction`

La lógica existente cae a:

```text
0 fronts → crear primer frente
0 challenges → crear primer reto
```

Esto contradice `Context first, objects second`.

Debe reemplazarse por una función basada en estado Bootstrap/Portfolio, por ejemplo:

```text
anchor insufficient → completar anchor
staging pending → revisar detecciones
anchor sufficient + no work → incorporar trabajo
critical governance gap → revisar gap
decision-ready → revisar decisión
```

## U3 — `PortfolioPrimaryActionRail`

Tiene valor visual, pero actualmente eleva `Crear frente estratégico` como acción principal e importación como futura. Debe convertirse en una acción primaria contextual, no en una parrilla fija object-first.

## U4 — `StrategicObjectivesOverview`

Reutilizable cuando Home está en `HOME-D/E`, pero no debe ser obligatorio en `HOME-A/B`.

## U5 — alerts existentes

Hay señales útiles de bloqueos, decisiones, activation, sponsor y owner. Deben normalizarse contra la futura taxonomía:

- strategic connection;
- missing business signal;
- unresolved dependency;
- missing decision path;
- information conflict;
- possible overlap.

No eliminar las señales actuales de portfolio activo; ubicarlas en estados posteriores.

---

# 4. DEPRECATE AS ENTRY — no eliminar necesariamente, pero dejar de usar como onboarding principal

## D1 — `/portfolio/iniciar` como selector “¿Cómo quieres iniciar?”

La pantalla actual ofrece cuatro caminos:

- crear frente;
- importar;
- crear reto;
- crear iniciativa individual.

Esto hace que el usuario elija la ontología y mezcla Portfolio Lead con Initiative Owner.

Debe dejar de ser la entrada principal post-Continuation. Puede reutilizarse parcialmente como superficie interna de intake o eliminarse más adelante.

## D2 — CTA “Crear iniciativa individual → Step 0–4” dentro del espacio Portfolio Lead

Materialmente riesgoso para role drift. No debe existir como CTA principal del Bootstrap. La transición a Initiative Core debe quedar bajo el futuro Activation/Handoff Contract.

## D3 — secuencia visible rígida `Frente → Reto → Activación → Iniciativas → Decisión` como onboarding

Puede seguir siendo una representación del dominio/operación cuando corresponda, pero no debe ser la secuencia obligatoria de primera experiencia.

---

# 5. ADD — capacidades que el contrato nuevo requiere y hoy no aparecen como bounded logic claro

## A1 — `PortfolioBootstrapResolver`

Responsabilidad:

- consumir Portfolio Continuation;
- derivar Portfolio Anchor;
- determinar `homeState`;
- determinar B0–B5;
- resolver next-best Portfolio action.

Debe vivir fuera de la UI.

## A2 — Portfolio Anchor representation

Necesitamos representar explícitamente:

- intención/resultado;
- decision-to-enable;
- señal cuando exista;
- status;
- provenance;
- gaps/conflicts.

No crear StrategicFront automáticamente.

## A3 — Bootstrap Intake / staging

P0:

- texto/lista;
- manual;
- “todavía no existen iniciativas”.

Necesita separar `detected/provisional` de `published/canonical`.

## A4 — provisional work items

Entidad/DTO o aggregate temporal con:

- raw source;
- proposed label/name;
- proposed purpose;
- strategic relation candidate;
- owner candidate;
- gaps;
- provenance;
- review status.

## A5 — Strategic Connection

No existe todavía como contrato explícito separado de jerarquía. Debe distinguir relación propuesta y confirmada.

## A6 — Advancement Conditions

Introducir sin score agregado:

- business signal;
- decision path;
- dependencies;
- required perspective/context;
- ownership visibility.

## A7 — first portfolio reading projection

Una proyección específica para `HOME-D`, distinta de summary cards genéricas.

## A8 — proposed mutation / material confirmation boundary

El repositorio tiene patrones parciales, pero Bootstrap necesita una regla transversal para que B3 no escriba silenciosamente B5.

---

# 6. Componentes que NO deben eliminarse por estar downstream

No confundir “fuera de Bootstrap” con “innecesario”. Mantener para etapas posteriores:

- Strategic Front CRUD;
- Challenge CRUD;
- Challenge Activation;
- Initiatives list/executive view;
- Decisions;
- Executive Output;
- Sponsor/owner flows;
- Steps.

El cambio es **cuándo y cómo aparecen**, no necesariamente su eliminación.

---

# 7. Riesgos concretos detectados

## R1 — Home actual asume estructura antes de resolver continuidad

Puede volver a mostrar objetos y conteos después de que Entry ya generó contexto, produciendo sensación de “empezar de cero”.

## R2 — selector `/portfolio/iniciar` expone demasiado la ontología

El usuario debe decidir si “Frente”, “Reto” o “Initiative” es su punto de partida. El contrato nuevo exige que Starteria reconstruya progresivamente esa estructura.

## R3 — CTA hacia Step 0–4 produce drift

El Portfolio Lead puede ser derivado directamente a desarrollo de una iniciativa sin Activation/Handoff consciente.

## R4 — next action actual es object-first

La ausencia de Frente se interpreta como necesidad de crear Frente; no considera que exista un confirmed Entry snapshot que ya pueda actuar como anchor provisional.

## R5 — summaries/counters pueden generar empty-dashboard effect

Si se renderizan antes de obtener portfolio real, vuelven a `0 frentes / 0 retos / 0 iniciativas`, comportamiento prohibido por el contrato.

## R6 — demo/mock state puede ocultar estados reales

La auditoría previa del repo indica que PortfolioProvider puede inicializar demo data según flags. El nuevo slice debe probarse explícitamente con estado real empty/bootstrap.

---

# 8. File plan preliminar — NO Tech Spec definitivo

## KEEP / reuse

```text
front/src/app/pages/PortfolioLeadHomePage.tsx
front/src/app/components/portfolio/PortfolioLeadHomeExperience.tsx
front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx
front/src/features/portfolio-lead/domain/*
front/src/app/services/portfolioService.ts
backend/modules/portfolio/*
```

## UPDATE candidates

```text
front/src/features/portfolio-lead/domain/selectors.ts
front/src/features/portfolio-lead/domain/types.ts
front/src/app/pages/PortfolioLeadHomePage.tsx
front/src/app/components/portfolio/PortfolioLeadHomeExperience.tsx
front/src/app/pages/PortfolioLeadStartPage.tsx
front/src/app/components/portfolio/PortfolioLeadStartExperience.tsx
```

## ADD candidates

Nombres todavía no normativos:

```text
front/src/features/portfolio-lead/bootstrap/*
backend/modules/portfolio-bootstrap/*
```

con responsabilidades separadas para:

- bootstrap resolution;
- intake/staging;
- provisional structuring;
- review/publication;
- first-reading projection.

No consolidar estos nombres hasta Tech Spec.

---

# 9. Orden recomendado antes de implementación

```text
1. Logic Contract B0–B5
2. Repo implementation audit
3. Freeze KEEP / UPDATE / ADD / DEPRECATE
4. Harness cases para B0–B5
5. Tech Spec del thin slice
6. UI adaptation
7. implementation
8. browser E2E
```

El audit debe preceder al Tech Spec para evitar construir un segundo Portfolio Lead paralelo.

---

# 10. Thin slice recomendado

Caso inicial único:

```text
confirmed Entry snapshot
→ Home reconoce contexto
→ anchor sufficient
→ usuario pega 4 iniciativas
→ sistema crea staging provisional
→ IA propone relaciones/gaps
→ Portfolio Lead confirma/corrige
→ publicación canónica controlada
→ first portfolio reading
→ next-best action
```

Debe demostrar específicamente:

```text
AI_SUGGESTED != USER_CONFIRMED
persisted != canonical
initiative exists != initiative activated
Portfolio Home != Step launcher
```
