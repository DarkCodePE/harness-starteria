# PH-3A — Portfolio Home UX / Information Architecture Reconciliation v0.1

**Estado:** `PH-3A: READY FOR HUMAN REVIEW`  
**Tipo:** especificación de reconciliación UX/IA; no implementación  
**Slice:** Portfolio Home V2  
**Fecha:** 2026-09-19  
**Branch:** `docs/portfolio-home-v2-authority`

## 0. Alcance y autoridad

Este documento reconcilia tres capas existentes:

1. Portfolio Home Governance Target PH-0;
2. `PortfolioHomeReadModel` implementado en PH-2;
3. Design System Startería y el piloto DS-06.

No autoriza cambios de frontend, backend, Prisma, Core, rutas, Copilot services ni
mutaciones de dominio. PH-3A define la composición y el contrato de integración
que PH-3B podrá implementar después de revisión humana.

Autoridad factual conservada:

- Core actual: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
- Core v0.3: candidate only / NOT authority.
- Governance Target, Read Model Contract y Acceptance Checklist: target de
  experiencia/read model, no certificación de runtime.
- PH-2: evidencia de implementación real del endpoint y su composición read-only.
- DS-06: evidencia visual/estructural del piloto, no autoridad de negocio.

## A. Current DS-06 Home Audit

### A.1 Diagnóstico general

DS-06 acertó en la dirección visual: `Strategic Calm + Intelligent Momentum`,
density `compact`, composición `PortfolioWorkspacePage`, lectura principal antes
del Copilot y responsive main/context column. El problema restante no es falta de
componentes, sino prioridad y fuente de lectura:

- la Home todavía pone el resumen ejecutivo y varios contadores antes de la
  atención;
- `PageHeader` mantiene `Crear nuevo frente` como CTA primaria fija;
- la lectura principal procede de `usePortfolioLead`,
  `getHomeCommandCenterModel()` y `getPortfolioHomeExperienceModel()`;
- el `portfolioReading` de PH-2 todavía no ocupa el lugar de lectura factual;
- la sección estratégica se muestra como una colección relativamente densa de
  tarjetas, con ontología y acciones al mismo nivel;
- recomendaciones, next action e insight de Copilot pueden duplicar la misma
  orientación;
- quedan labels técnicos en inglés (`Requires attention`, `Human action`,
  `Secondary context`);
- activity y KPI cards consumen espacio de Home sin ser siempre decisión-relevantes.

### A.2 Current block → target reconciliation

| Current block | Keep / Adapt / Move / Remove | Target block | Why |
|---|---|---|---|
| `PageHeader` | **ADAPT** | Page context + primary next action | Mantener patrón DS y heading. La descripción, metadata y CTA deben derivar del read model; la CTA no debe ser siempre crear frente. |
| Breadcrumbs / page context | **KEEP** | Page context | Da orientación de workspace sin competir con la lectura. |
| Executive summary / `ContextSummary` superior | **MOVE TO SECONDARY** | Contexto breve de `Portfolio Reading` | Los contadores actuales responden “cuánto” antes que “qué requiere atención”. Pueden permanecer como señales compactas, no como bloque dominante. |
| Empty state | **ADAPT** | Portfolio Reading / Requires Attention empty state | Mantener `EmptyState`, pero el copy y la acción deben depender del estado factual disponible, sin asumir que crear frente es siempre el siguiente paso. |
| `PortfolioAttentionList` | **ADAPT** | Requires Attention | Es la pieza operacional dominante. Debe consumir `attention[]`, mostrar motivo/contexto/movimiento y distinguir señales de portfolio de solicitudes de equipo cuando exista evidencia. |
| `NextAction` | **ADAPT** | Primary next action / Recommended Next Moves | Conservar el patrón. Debe representar una sola acción contextual gobernada por el read model o por un adaptador de presentación explícito. |
| Pending decisions block | **ADAPT** | Pending Decisions | Consumir `pendingDecisions[]`; separar solicitud, recomendación y decisión registrada; mostrar evidencia y autoridad solo si existen. |
| `StrategicObjectivesOverview` | **ADAPT** | Strategic Work Map | Conservar como patrón de exploración progresiva, no como grid denso. Reordenar a frente → reto → iniciativas y mostrar resumen antes del detalle. |
| `PortfolioSummaryCards` | **MOVE TO SECONDARY** | Secondary context / compact signals | Mantener solo si los valores disparan lectura o decisión. Debajo de atención y work map; no en el above-the-fold. |
| `RecentActivitySection` | **MOVE TO SECONDARY** | Secondary context / disclosure | La actividad no debe competir con atención. Mostrar bajo disclosure o trasladar a una vista de actividad si no cambia una decisión. |
| Copilot `InlineInsight` | **ADAPT** | Recommended Next Moves / Copilot context | Debe explicar o priorizar señales visibles; nunca ser la única ubicación de una alerta o recomendación. |
| `PortfolioCopilotLauncher` | **KEEP** | Contextual Copilot | Mantener como acceso contextual, no como CTA principal de Home. |
| `PortfolioCopilotDrawer` | **KEEP** | Contextual Copilot | Mantener drawer como superficie secundaria; no introducir lifecycle ni estado privado paralelo. |
| `Requires attention` badge | **REMOVE FROM HOME** | Copy productivo español | Es label técnico temporal y además duplica el heading. Reemplazar por `Requiere tu atención` o eliminar si el heading basta. |
| `Human action` badge | **REMOVE FROM HOME** | Pending Decisions | No usar como etiqueta técnica; expresar “Decisiones pendientes” y autoridad/evidencia por item. |
| `Secondary context` badge | **REMOVE FROM HOME** | Contexto secundario | Reemplazar por jerarquía visual y copy de producto, no por un label de implementación. |

### A.3 Clasificación de responsabilidades

| Superficie | Tratamiento PH-3A |
|---|---|
| `PortfolioWorkspacePage` composition | **KEEP** |
| `PageHeader`, `ContextSummary`, `AttentionItem`, `NextAction`, `EmptyState`, `InlineInsight` | **KEEP / ADAPT**; son patrones DS existentes suficientes |
| `PortfolioAttentionList` | **ADAPT** para `attention[]`; no crear una taxonomía frontend nueva |
| `StrategicObjectivesOverview` | **ADAPT / CONSOLIDATE** dentro de Strategic Work Map |
| `PortfolioSummaryCards` | **MOVE TO SECONDARY**; **REUSE ELSEWHERE** si se necesita reporting ejecutivo |
| `RecentActivitySection` | **MOVE TO SECONDARY**; deprecación posterior si no habilita decisión |
| `PortfolioCopilotLauncher` / `PortfolioCopilotDrawer` | **KEEP / ADAPT visual shell** |

## B. PH-2 → UI Mapping

`GET /api/v1/portfolio/home` debe ser la fuente principal de lectura de Home.
El mapping siguiente no inventa campos: cuando un requisito del target no está
disponible, la UI debe mostrar `unknown`, omitir el dato o marcar revisión.

| Read model field | UI surface | DS pattern | Priority |
|---|---|---|---|
| `portfolioReading.summary` | Portfolio Reading narrative | `ContextSummary` / text composition | P0 |
| `portfolioReading.homeState` | State treatment, empty/review context | `EmptyState`, `DomainStatusBadge` | P0 |
| `portfolioReading.strategicUnitCount` | Secondary signal, no KPI wall | compact metadata / `ContextSummary` | P1 |
| `portfolioReading.activeInitiativeCount` | Secondary signal with lifecycle label | `ContextSummary` | P1 |
| `portfolioReading.pendingActivationCount` | Handoff visibility in work map/attention | `DomainStatusBadge`, `AttentionItem` | P0 |
| `portfolioReading.blockerCount` | Attention summary only | `AttentionItem` / semantic state | P0 |
| `portfolioReading.pendingDecisionCount` | Section count and ordering cue | `ContextSummary` | P0 |
| `portfolioReading.coverageGapCount` | Only when non-null | `AttentionItem` / compact signal | P1 |
| `portfolioReading.evidenceGapCount` | Only when non-null | `AttentionItem` / compact signal | P1 |
| `attention[]` | Requires Attention queue | `PortfolioAttentionQueue` + `AttentionItem` + `EmptyState` | P0 |
| `attention[].summary` | What is happening | `AttentionItem` title/description | P0 |
| `attention[].reason` | Why it matters | `AttentionItem.reason` | P0 |
| `attention[].entity` | Affected context | metadata/context slot | P0 |
| `attention[].nextMoveOwner` | Owner visibility if known | person/context metadata | P1 |
| `attention[].suggestedAction` | Next movement copy, advisory | `NextAction` metadata / item metadata | P0 |
| `attention[].derivationSource` | Provenance treatment where material | status/provenance label | P1 |
| `strategicUnits[]` | Strategic Work Map | `PortfolioWorkspacePage` + domain-light composition | P0 |
| `strategicUnits[].strategicFront` | Front summary | existing strategic front pattern, progressive disclosure | P0 |
| `desiredOutcome` | What the front should move | front summary text | P0 |
| `signal` | KPI/signal when present | compact metadata | P1 |
| `horizon` | Time horizon when present | compact metadata | P1 |
| `challenges[]` | Challenge disclosure under front | existing challenge pattern, not new card taxonomy | P0 |
| `challenges[].invitations[]` | Invitation visibility | `DomainStatusBadge` / `InvitationCard` treatment | P0 |
| `challenges[].initiatives[]` | Initiative visibility | compact initiative row | P0 |
| `activationVisibility` | `invitation pending`, `initiative exists`, `initiative active`, `unknown` | `DomainStatusBadge` | P0 |
| `initiativeSummary` | Front/challenge compact summary | `ContextSummary` | P1 |
| `attentionSummary` | Work map attention cue | semantic state / `AttentionItem` | P0 |
| `nextGovernanceAction` | Candidate contextual next action | `NextAction` / work map metadata | P0 |
| `pendingDecisions[]` | Pending Decisions | `DecisionSupportSummary` / `ContextSummary` | P0 |
| `requestedDecision` | Decision required | decision title | P0 |
| `initiativeId` + contextual IDs | Initiative/challenge context | metadata / breadcrumb context | P0 |
| `evidenceSummary` | Available evidence | `DecisionSupportSummary` | P0 |
| `decisionAuthority` | Authority if known | human/role metadata | P0 |
| `recommendations[]` | Recommended Next Moves and Copilot prompts | `InlineInsight` / advisory block | P1 |
| `requiresHumanConfirmation` | Advisory treatment | AI suggestion styling, not authoritative badge | P0 |
| `source` + `derivationSource` | Provenance disclosure where useful | `AISuggestionPanel` / source metadata | P1 |
| `generatedAt` | Freshness/context | caption | P2 |
| `governance.*` | Contextual people/roles | metadata only | P1 |

### B.1 Source separation

```text
Home read source:
PortfolioHomeReadModel from GET /api/v1/portfolio/home

Mutation/action source:
shared application/domain services already responsible for navigation,
acceptance, activation, decisions and other writes
```

La Home no debe mutar el read model. `PortfolioLeadContext` no se elimina en
PH-3A: puede continuar alojando acciones, permisos, refresh y otras superficies
legacy. La migración propuesta es de lectura, no una extracción de mutaciones.

## C. Final Information Hierarchy

La Home debe responder, en este orden:

1. **Portfolio Reading — “Qué está pasando en tu portafolio”**
   - narrativa factual breve desde `portfolioReading.summary`;
   - 2–4 señales secundarias solo cuando existan y ayuden a interpretar la
     narrativa;
   - no convertir el bloque en seis KPI cards.
2. **Requiere tu atención**
   - sección operacional dominante;
   - ordenar por severidad/impacto factual y luego actualidad, sin recalcular
     autoridad en frontend;
   - cada item: qué ocurre, por qué importa, contexto afectado y siguiente
     movimiento.
3. **Mapa de trabajo estratégico**
   - frente estratégico → reto → iniciativas;
   - resumen primero, detalle bajo disclosure;
   - mostrar estado de invitación/initiative sin colapsar lifecycle.
4. **Decisiones pendientes**
   - qué decisión se solicita, contexto, evidencia, autoridad conocida y acción;
   - no presentar recommendation, `DecisionRequest` y `Decision` como el mismo
     objeto.
5. **Siguientes movimientos recomendados**
   - recomendaciones advisory, visibles sin abrir Copilot cuando son relevantes;
   - evitar repetir literalmente el mismo texto en Main, `InlineInsight` y
     Copilot.

La prioridad de lectura es atención y gobernanza; los conteos son soporte, no el
producto principal de la pantalla.

## D. Above-the-fold Definition

En desktop, sin scroll significativo, deben caber idealmente:

- contexto de página y heading;
- Portfolio Reading en pocas líneas;
- los primeros items de `Requiere tu atención`;
- una única acción dominante contextual (`NextAction` o CTA del header).

No deben intentar caber above-the-fold:

- el mapa estratégico completo;
- todas las decisiones;
- KPI cards extensas;
- actividad reciente;
- el drawer o conversación del Copilot.

Si `portfolioReading.summary` no está disponible, usar un estado explícito de
lectura no disponible/pendiente de revisión; no fabricar una narrativa desde
contadores legacy.

## E. Attention Design

`attention[]` es la fuente operacional. `PortfolioAttentionList` debe adaptarse
para no perder los cuatro datos mínimos:

```text
Qué ocurre        → summary
Por qué importa   → reason
Contexto afectado → entity + contexto estratégico disponible
Siguiente movimiento → suggestedAction / acción navegable si existe
```

La presentación puede separar visualmente:

- **Señal del portafolio / sistema:** `source` o `type` derivado del read model;
- **Solicitud o contexto de equipo:** owner/persona y entidad afectada, cuando
  PH-2 lo permite.

Esto es una distinción de presentación basada en campos existentes, no una nueva
taxonomía de dominio. Si `source` no es suficientemente claro, usar un label
neutral (“Origen no especificado”) o no separar.

La severidad debe conservar la semántica proveniente del modelo. El frontend no
debe convertir una recomendación AI en bloqueo ni asumir que un sponsor es
Decision Authority. La ausencia de `suggestedAction`, owner o severidad se
representa como información no disponible, no como inferencia.

El estado vacío usa `EmptyState` y debe decir que no hay señales visibles ahora;
su acción puede ser la acción recomendada existente. No debe forzar `Crear
nuevo frente` si el read model indica otra acción prioritaria.

## F. Strategic Work Map Design

### F.1 Composition

```text
Frente estratégico
  resultado deseado · señal/KPI · horizonte · atención
  └─ Reto
       estado de invitación / activación
       └─ Iniciativas
            exists / active / unknown
```

Usar progressive disclosure:

- cada frente empieza como una lectura compacta;
- el frente prioritario o con atención puede abrir reto y primera iniciativa;
- el resto queda resumido por conteos y estado;
- el detalle completo navega a la superficie de frente/reto, no se vuelca en
  Home.

### F.2 Handoff visibility

Mostrar explícitamente los estados que PH-2 permite:

- `invitation_pending` / invitation pending;
- `initiative_exists`;
- `initiative_active`;
- `unknown`.

No implementar ni presentar como autoridad:

- `pre_start` canónico;
- Activation Readiness;
- `owner_pending`;
- `resourcing_pending`;
- `ready_to_activate`.

Reglas visuales obligatorias:

```text
invited != owner confirmed
initiative exists != initiative active
```

La etiqueta `accepted`/`pre_start` solo puede aparecer si el backend/read model
la entrega con representación aprobada; PH-2 declara esa dependencia como
candidate.

## G. Decision Design

`pendingDecisions[]` se presenta como una cola de gobernanza, no como una lista
de recomendaciones. Cada fila/tarjeta prioriza:

1. decisión solicitada (`requestedDecision`);
2. iniciativa y reto/frente asociados;
3. evidencia disponible (`evidenceSummary`), indicando ausencia si corresponde;
4. autoridad (`decisionAuthority`) solo si está conocida;
5. acción para revisar/registrar mediante el servicio existente.

Separaciones visuales:

- `recommendation`: propuesta advisory, no decisión;
- `DecisionRequest`: solicitud pendiente;
- `Decision`: decisión registrada, no debe aparecer como pendiente.

No usar Sponsor como Decision Authority automáticamente. Si la autoridad es
`null`, mostrar “Autoridad no especificada” o no mostrar el campo, según espacio.

## H. Recommendation / Copilot Relationship

### H.1 Recommended Next Moves

`recommendations[]` debe tener una representación parcial en Main cuando exista
una recomendación material: un bloque compacto `Siguientes movimientos
recomendados` después de decisiones o integrado en el bloque `NextAction`, sin
duplicar el texto completo en ambos lugares.

El tratamiento es siempre advisory:

- “Startería sugiere…”;
- “Para revisar…”;
- “Podría convenir…”;
- indicación de fuente/incertidumbre cuando material.

No usar copy que implique autorización, asignación o decisión tomada.

### H.2 Job exacto del Copilot en Home

El Copilot es una capa cognitiva contextual para:

- priorizar señales visibles;
- explicar por qué una atención importa;
- comparar dos señales o rutas visibles;
- orientar hacia la superficie correcta;
- preparar una decisión sin tomarla.

No debe contener información crítica que no exista en Main, reemplazar la cola
de atención, decidir por la persona ni mantener un lifecycle privado.

### H.3 Suggested prompts

Las preguntas sugeridas pueden alimentarse solo de datos visibles del read model:

- “¿Por qué esta iniciativa requiere atención?” → `attention[].reason`;
- “¿Qué decisiones están pendientes?” → `pendingDecisions[]`;
- “¿Dónde falta cobertura?” → `coverageGapCount` o señal explícita no nula;
- “¿Qué debería revisar primero?” → orden visible de atención/next action.

Si la fuente no contiene el dato, la pregunta no se ofrece. `InlineInsight` puede
resumir una recomendación, pero no duplicar toda la cola ni inventar evidencia.

## I. Component Treatment

| Component | Treatment | Reason |
|---|---|---|
| `PageHeader` | **KEEP / ADAPT** | Mantener heading, contexto y una CTA; conectar metadata y acción al read model. |
| `ContextSummary` | **KEEP / ADAPT** | Útil para señales compactas y decisiones; reducir su uso como resumen dominante. |
| `NextAction` | **KEEP / ADAPT** | Patrón correcto para el movimiento primario; input contextual, no regla nueva. |
| `PortfolioAttentionList` | **ADAPT** | Cambiar fuente a `attention[]` y conservar `AttentionItem`/`EmptyState`. |
| `StrategicObjectivesOverview` | **CONSOLIDATE / ADAPT** | Reutilizar su composición como `Strategic Work Map`, con disclosure y menor densidad. |
| `PortfolioSummaryCards` | **MOVE TO SECONDARY** | Solo conservar métricas que ayuden a decidir; no competir con attention. |
| `RecentActivitySection` | **MOVE TO SECONDARY** | Útil como contexto histórico; no es prioridad de gobernanza por defecto. |
| `InlineInsight` | **KEEP / ADAPT** | Representar una explicación/recomendación visible y no autoritativa. |
| `PortfolioCopilotLauncher` | **KEEP** | Entrada contextual secundaria. |
| `PortfolioCopilotDrawer` | **KEEP** | Profundización contextual; conserva el shell existente y su lifecycle. |
| `PortfolioWelcomeBanner` | **DEPRECATE AFTER MIGRATION** | DS-06 ya lo sustituyó visualmente por `PageHeader`; retener para otros consumidores. |
| `PortfolioPrimaryActionRail` | **DEPRECATE AFTER MIGRATION** | Object-first y multiacción; sustituir por una CTA principal + `NextAction`. |
| Raw local activity/front cards | **DEPRECATE AFTER MIGRATION** | Migración posterior a patrones DS/DS-07, fuera de PH-3A. |

No crear componentes nuevos si `PageHeader`, `ContextSummary`, `AttentionItem`,
`NextAction`, `EmptyState`, `InlineInsight`, `DomainStatusBadge` o los patrones
de frente/reto existentes cubren la necesidad.

## J. Copy Recommendations

La copy final de producto debe vivir en la capa de experiencia/adaptación, no en
primitives DS genéricas. Propuesta:

| Technical/current label | Productive Spanish |
|---|---|
| `Portfolio Home` | `Inicio del portafolio` o `Portafolio` según navegación |
| `Requires attention` | `Requiere tu atención` |
| `Executive summary` | `Lectura del portafolio` |
| `Human action` | `Decisiones pendientes` / `Acción requerida` según contexto |
| `Secondary context` | `Contexto del portafolio` |
| `Next action` | `Siguiente movimiento` |
| `Recommended Next Moves` | `Siguientes movimientos recomendados` |
| `Strategic Work Map` | `Mapa de trabajo estratégico` |
| `Pending activation` | `Activación pendiente` |
| `Invitation pending` | `Invitación pendiente` |
| `Initiative exists` | `Iniciativa creada` |
| `Initiative active` | `Iniciativa activa` |
| `Unknown` | `Estado no disponible` / `Requiere revisión` |
| `Starteria suggests` | `Startería sugiere` |

Copy guidance:

- heading: `¿Qué requiere tu atención hoy?`;
- reading label: `Qué está pasando en tu portafolio`;
- attention heading: `Requiere tu atención`;
- decisions heading: `Decisiones pendientes`;
- work map heading: `Mapa de trabajo estratégico`;
- primary action: usar verbo contextual (`Revisar bloqueo`, `Preparar decisión`,
  `Revisar cobertura`, `Crear frente`) según estado factual.

No hardcodear estos textos en primitives reutilizables.

## K. Desktop Wireframe

```text
GLOBAL NAV
┌─────────────────────────────────────────────────────────────────────────────┐
│ PORTAFOLIO / INICIO                         [contexto de página]             │
│ ¿Qué requiere tu atención hoy?                              [CTA única]    │
├───────────────────────────────────────────────┬─────────────────────────────┤
│ MAIN WORKSPACE                                │ CONTEXTO OPCIONAL            │
│                                               │                               │
│ Qué está pasando en tu portafolio             │ Startería / InlineInsight   │
│ narrative factual + 2–4 señales               │ prioriza · explica · orienta│
│                                               │                               │
│ Requiere tu atención                          │ [Abrir Copilot]              │
│ [item: qué / por qué / contexto / movimiento] │                               │
│ [item: qué / por qué / contexto / movimiento] │ El rail no contiene datos   │
│                                               │ críticos exclusivos.         │
│ Mapa de trabajo estratégico                   │                               │
│ Frente                                        │                               │
│   Reto → iniciativas (disclosure)             │                               │
│                                               │                               │
│ Decisiones pendientes                         │                               │
│ [solicitud / contexto / evidencia / autoridad]│                               │
│                                               │                               │
│ Siguientes movimientos recomendados           │                               │
│ [advisory, sin duplicar Copilot]              │                               │
│                                               │                               │
│ Contexto secundario: métricas / actividad     │                               │
└───────────────────────────────────────────────┴─────────────────────────────┘
```

El rail puede desaparecer si no añade explicación o navegación contextual. No
debe reservar ancho para un chat genérico permanente.

## L. Mobile Wireframe

```text
GLOBAL NAV / PAGE CONTEXT

PORTAFOLIO
¿Qué requiere tu atención hoy?
[Siguiente movimiento principal]

Qué está pasando en tu portafolio
lectura breve + señales

Requiere tu atención
item prioritario
item prioritario

Mapa de trabajo estratégico
Frente
  Reto
    Iniciativas / estado de activación

Decisiones pendientes
solicitud · contexto · evidencia · acción

Siguientes movimientos recomendados

[Abrir Copilot] → drawer / bottom sheet
```

Orden móvil obligatorio: Portfolio Reading → atención primaria → acción → mapa
estratégico → decisiones. El Copilot es drawer/bottom sheet y nunca oculta
estado crítico.

Responsive:

- desktop: main + rail opcional;
- tablet: main primero, rail apilado o colapsable;
- mobile: una columna, disclosure para work map y actividad secundaria.

## M. PH-3B Implementation Impact

Archivos que probablemente cambiarán en PH-3B, sujetos a confirmación del plan y
sin autorizarse en PH-3A:

### Lectura y composición frontend

- `front/src/app/pages/PortfolioLeadHomePage.tsx`
- `front/src/app/services/api.ts` (o el cliente API equivalente, para consumir
  `GET /api/v1/portfolio/home` si no existe una función reutilizable)
- nuevo adaptador tipado de read model, probablemente bajo
  `front/src/features/portfolio-lead/services/` o `front/src/features/portfolio-lead/read-model/`
- tests de `PortfolioLeadHomePage` y nuevos tests de mapping del read model.

### Componentes de Home

- `front/src/features/portfolio-lead/components/cards/PortfolioAttentionList.tsx`
- `front/src/features/portfolio-lead/components/cards/PortfolioSummaryCards.tsx`
  (solo si se mantiene como contexto secundario)
- `front/src/app/components/portfolio/PortfolioLeadHomeExperience.tsx`
  (`StrategicObjectivesOverview`, `RecentActivitySection` y patrones legacy)
- `front/src/app/components/design-system/patterns/` solo si un patrón existente
  necesita una extensión compatible y justificada; no crear una familia nueva
  para PH-3B.

### Estado/contexto y navegación

- `front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx` solo para
  preservar acciones, refresh y compatibilidad; no para mantener la lectura
  principal duplicada;
- `front/src/features/portfolio-lead/domain/selectors.ts` únicamente durante
  la retirada controlada de consumidores legacy, con evidencia de no regresión;
- `front/src/features/copilot/components/PortfolioCopilotDrawer.tsx` y/o
  `PortfolioCopilotShell.tsx` solo si hace falta recibir contexto visible, sin
  cambiar servicios ni lifecycle.

### Tests/validación

- `front/src/app/pages/__tests__/PortfolioLeadHomePage.bootstrap.test.tsx`
- `front/src/features/portfolio-lead/components/cards/__tests__/PortfolioAttentionList.test.tsx`
- nuevos tests de estados `invitation_pending`, `initiative_exists`,
  `initiative_active`, `unknown`, decisiones sin autoridad y recomendaciones
  advisory;
- tests de responsive/orden DOM si el harness existente los soporta.

No forman parte de PH-3B por esta especificación: backend read service, Prisma,
Core, rutas de mutación, servicios de Copilot, Activation Readiness o nuevos
estados de lifecycle.

## N. Regression Risks

1. **Doble fuente de verdad visual:** mantener selectores legacy y PH-2 en la
   misma sección puede producir conteos o atención contradictorios.
2. **Pérdida de acciones existentes:** sustituir modelos puede eliminar
   `actionPath`, navegación a decisiones o fallback de empty state.
3. **Colapso de lifecycle:** representar invitation, initiative exists y active
   con un único badge reintroduce el riesgo que PH-0 prohíbe.
4. **Inferencia de autoridad:** mostrar sponsor como autoridad o una
   recomendación como decisión confirmada.
5. **Lectura vacía inventada:** producir narrative desde KPI cuando
   `portfolioReading.summary` es `null`.
6. **Duplicación Copilot/Main:** la misma recommendation puede aparecer como
   `NextAction`, `InlineInsight`, rail y drawer.
7. **Regresión responsive:** trasladar atención o decisión al rail puede ocultar
   información crítica en tablet/mobile.
8. **Densidad excesiva:** expandir toda la ontología frente → reto → iniciativa
   vuelve a convertir Home en dashboard.
9. **Acción primaria equivocada:** dejar `Crear nuevo frente` fija puede
   desviar al usuario de un bloqueo o decisión pendiente.
10. **Legacy cleanup prematuro:** eliminar `PortfolioLeadContext` o selectores
    antes de migrar todas sus mutaciones y consumidores.
11. **Copilot con estado privado:** refrescar o modificar lifecycle desde el
    drawer rompería el boundary read-only de Home.
12. **Artefactos no certificados:** los focused tests de DS-06 no prueban por sí
    solos la reconciliación completa del read model ni la UX visual manual.

## O. Acceptance Criteria

### O.1 Authority and scope

- [ ] La implementación futura conserva Core v0.2 como autoridad factual.
- [ ] Core v0.3, `pre_start`, Activation Readiness y estados candidate no se
      presentan como aprobados.
- [ ] PH-3B no crea mutaciones dentro de `PortfolioHomeReadModel`.
- [ ] La Home no crea objetos ni activa Initiative/Core por efecto de lectura.

### O.2 Information hierarchy

- [ ] La primera lectura responde qué ocurre, qué requiere atención y cuál es el
      siguiente movimiento.
- [ ] `Portfolio Reading` usa `portfolioReading` y no se convierte en un bloque
      de seis KPI cards.
- [ ] `Requires Attention` deja de ser un label técnico en inglés y la sección
      es visualmente dominante.
- [ ] El mapa estratégico aparece después de atención y usa disclosure.
- [ ] Las decisiones y recomendaciones permanecen separadas semánticamente.

### O.3 PH-2 mapping

- [ ] `GET /api/v1/portfolio/home` es la fuente principal de lectura.
- [ ] `attention[]` muestra qué, por qué, contexto y movimiento cuando los datos
      están disponibles.
- [ ] `strategicUnits[]` conserva frente → reto → iniciativa.
- [ ] Los estados de handoff disponibles son visibles y no se colapsan.
- [ ] `pendingDecisions[]` muestra evidencia y autoridad solo cuando existen.
- [ ] `recommendations[]` se marca como advisory y requiere confirmación humana.
- [ ] `source`, `derivationSource` y `unknown` se respetan donde son materiales.

### O.4 CTA and Copilot

- [ ] Home tiene normalmente una única CTA primaria.
- [ ] La CTA se selecciona mediante un patrón de presentación gobernado por el
      read model (`nextGovernanceAction` disponible en unidad estratégica,
      atención prioritaria, decisión pendiente, recommendation o fallback), sin
      crear nueva lógica de dominio en frontend.
- [ ] `Crear nuevo frente` solo aparece como CTA primaria cuando el estado
      factual no indica una acción de mayor prioridad.
- [ ] Copilot prioriza, explica, compara, orienta o prepara decisión.
- [ ] Copilot no contiene la única copia de una alerta, no decide y no tiene
      lifecycle privado.

### O.5 Responsive and regression safety

- [ ] Desktop conserva main + rail contextual opcional.
- [ ] Tablet apila o colapsa el contexto después del main.
- [ ] Mobile conserva el orden Reading → atención → acción → mapa → decisiones.
- [ ] No se oculta estado crítico detrás de Copilot.
- [ ] Se preservan las rutas/acciones existentes y el refresh de contextos.
- [ ] KPI cards y Recent Activity no compiten con atención above-the-fold.
- [ ] `git diff --check` pasa y no se modifican archivos productivos durante
      PH-3A.

### O.6 Human review gate

- [ ] Producto/diseño valida el orden de secciones y el patrón CTA.
- [ ] Se valida la traducción de labels técnicos a copy de producto.
- [ ] Se confirma si `RecentActivitySection` permanece como disclosure o se
      traslada a otra vista.
- [ ] Se confirma el contrato de adaptación del `nextGovernanceAction` antes de
      implementar PH-3B.

## Referencias leídas

- `docs/portfolio-lead/06-portfolio-home-governance/PORTFOLIO_HOME_GOVERNANCE_TARGET_v0.1.md`
- `docs/portfolio-lead/06-portfolio-home-governance/PORTFOLIO_HOME_READ_MODEL_CONTRACT_v0.1.md`
- `docs/portfolio-lead/06-portfolio-home-governance/PORTFOLIO_HOME_ACCEPTANCE_CHECKLIST_v0.1.md`
- `docs/portfolio-lead/90-implementation-reports/PORTFOLIO_HOME_READ_MODEL_IMPLEMENTATION_REPORT_v0.1.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
- `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS06_PORTFOLIO_HOME_REPORT.md`
- `front/src/app/pages/PortfolioLeadHomePage.tsx`
- `backend/modules/portfolio/portfolio-home.read-service.ts`
- `backend/modules/portfolio/portfolio.router.ts`

PH-3A STATUS: READY FOR HUMAN REVIEW
