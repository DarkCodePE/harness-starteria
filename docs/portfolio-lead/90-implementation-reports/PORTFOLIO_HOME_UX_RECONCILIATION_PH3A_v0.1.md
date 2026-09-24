# PH-3A â€” Portfolio Home UX / Information Architecture Reconciliation v0.1

**Estado:** `PH-3A: READY FOR HUMAN REVIEW`
**Tipo:** especificaciÃ³n de reconciliaciÃ³n UX/IA; no implementaciÃ³n
**Slice:** Portfolio Home V2
**Fecha:** 2026-09-19
**Branch:** `docs/portfolio-home-v2-authority`

## 0. Alcance y autoridad

Este documento reconcilia tres capas existentes:

1. Portfolio Home Governance Target PH-0;
2. `PortfolioHomeReadModel` implementado en PH-2;
3. Design System StarterÃ­a y el piloto DS-06.

No autoriza cambios de frontend, backend, Prisma, Core, rutas, Copilot services ni
mutaciones de dominio. PH-3A define la composiciÃ³n y el contrato de integraciÃ³n
que PH-3B podrÃ¡ implementar despuÃ©s de revisiÃ³n humana.

Autoridad factual conservada:

- Core actual: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
- Core v0.3: candidate only / NOT authority.
- Governance Target, Read Model Contract y Acceptance Checklist: target de
  experiencia/read model, no certificaciÃ³n de runtime.
- PH-2: evidencia de implementaciÃ³n real del endpoint y su composiciÃ³n read-only.
- DS-06: evidencia visual/estructural del piloto, no autoridad de negocio.

## A. Current DS-06 Home Audit

### A.1 DiagnÃ³stico general

DS-06 acertÃ³ en la direcciÃ³n visual: `Strategic Calm + Intelligent Momentum`,
density `compact`, composiciÃ³n `PortfolioWorkspacePage`, lectura principal antes
del Copilot y responsive main/context column. El problema restante no es falta de
componentes, sino prioridad y fuente de lectura:

- la Home todavÃ­a pone el resumen ejecutivo y varios contadores antes de la
  atenciÃ³n;
- `PageHeader` mantiene `Crear nuevo frente` como CTA primaria fija;
- la lectura principal procede de `usePortfolioLead`,
  `getHomeCommandCenterModel()` y `getPortfolioHomeExperienceModel()`;
- el `portfolioReading` de PH-2 todavÃ­a no ocupa el lugar de lectura factual;
- la secciÃ³n estratÃ©gica se muestra como una colecciÃ³n relativamente densa de
  tarjetas, con ontologÃ­a y acciones al mismo nivel;
- recomendaciones, next action e insight de Copilot pueden duplicar la misma
  orientaciÃ³n;
- quedan labels tÃ©cnicos en inglÃ©s (`Requires attention`, `Human action`,
  `Secondary context`);
- activity y KPI cards consumen espacio de Home sin ser siempre decisiÃ³n-relevantes.

### A.2 Current block â†’ target reconciliation

| Current block | Keep / Adapt / Move / Remove | Target block | Why |
|---|---|---|---|
| `PageHeader` | **ADAPT** | Page context + primary next action | Mantener patrÃ³n DS y heading. La descripciÃ³n, metadata y CTA deben derivar del read model; la CTA no debe ser siempre crear frente. |
| Breadcrumbs / page context | **KEEP** | Page context | Da orientaciÃ³n de workspace sin competir con la lectura. |
| Executive summary / `ContextSummary` superior | **MOVE TO SECONDARY** | Contexto breve de `Portfolio Reading` | Los contadores actuales responden â€œcuÃ¡ntoâ€ antes que â€œquÃ© requiere atenciÃ³nâ€. Pueden permanecer como seÃ±ales compactas, no como bloque dominante. |
| Empty state | **ADAPT** | Portfolio Reading / Requires Attention empty state | Mantener `EmptyState`, pero el copy y la acciÃ³n deben depender del estado factual disponible, sin asumir que crear frente es siempre el siguiente paso. |
| `PortfolioAttentionList` | **ADAPT** | Requires Attention | Es la pieza operacional dominante. Debe consumir `attention[]`, mostrar motivo/contexto/movimiento y distinguir seÃ±ales de portfolio de solicitudes de equipo cuando exista evidencia. |
| `NextAction` | **ADAPT** | Primary next action / Recommended Next Moves | Conservar el patrÃ³n. Debe representar una sola acciÃ³n contextual gobernada por el read model o por un adaptador de presentaciÃ³n explÃ­cito. |
| Pending decisions block | **ADAPT** | Pending Decisions | Consumir `pendingDecisions[]`; separar solicitud, recomendaciÃ³n y decisiÃ³n registrada; mostrar evidencia y autoridad solo si existen. |
| `StrategicObjectivesOverview` | **ADAPT** | Strategic Work Map | Conservar como patrÃ³n de exploraciÃ³n progresiva, no como grid denso. Reordenar a frente â†’ reto â†’ iniciativas y mostrar resumen antes del detalle. |
| `PortfolioSummaryCards` | **MOVE TO SECONDARY** | Secondary context / compact signals | Mantener solo si los valores disparan lectura o decisiÃ³n. Debajo de atenciÃ³n y work map; no en el above-the-fold. |
| `RecentActivitySection` | **MOVE TO SECONDARY** | Secondary context / disclosure | La actividad no debe competir con atenciÃ³n. Mostrar bajo disclosure o trasladar a una vista de actividad si no cambia una decisiÃ³n. |
| Copilot `InlineInsight` | **ADAPT** | Recommended Next Moves / Copilot context | Debe explicar o priorizar seÃ±ales visibles; nunca ser la Ãºnica ubicaciÃ³n de una alerta o recomendaciÃ³n. |
| `PortfolioCopilotLauncher` | **KEEP** | Contextual Copilot | Mantener como acceso contextual, no como CTA principal de Home. |
| `PortfolioCopilotDrawer` | **KEEP** | Contextual Copilot | Mantener drawer como superficie secundaria; no introducir lifecycle ni estado privado paralelo. |
| `Requires attention` badge | **REMOVE FROM HOME** | Copy productivo espaÃ±ol | Es label tÃ©cnico temporal y ademÃ¡s duplica el heading. Reemplazar por `Requiere tu atenciÃ³n` o eliminar si el heading basta. |
| `Human action` badge | **REMOVE FROM HOME** | Pending Decisions | No usar como etiqueta tÃ©cnica; expresar â€œDecisiones pendientesâ€ y autoridad/evidencia por item. |
| `Secondary context` badge | **REMOVE FROM HOME** | Contexto secundario | Reemplazar por jerarquÃ­a visual y copy de producto, no por un label de implementaciÃ³n. |

### A.3 ClasificaciÃ³n de responsabilidades

| Superficie | Tratamiento PH-3A |
|---|---|
| `PortfolioWorkspacePage` composition | **KEEP** |
| `PageHeader`, `ContextSummary`, `AttentionItem`, `NextAction`, `EmptyState`, `InlineInsight` | **KEEP / ADAPT**; son patrones DS existentes suficientes |
| `PortfolioAttentionList` | **ADAPT** para `attention[]`; no crear una taxonomÃ­a frontend nueva |
| `StrategicObjectivesOverview` | **ADAPT / CONSOLIDATE** dentro de Strategic Work Map |
| `PortfolioSummaryCards` | **MOVE TO SECONDARY**; **REUSE ELSEWHERE** si se necesita reporting ejecutivo |
| `RecentActivitySection` | **MOVE TO SECONDARY**; deprecaciÃ³n posterior si no habilita decisiÃ³n |
| `PortfolioCopilotLauncher` / `PortfolioCopilotDrawer` | **KEEP / ADAPT visual shell** |

## B. PH-2 â†’ UI Mapping

`GET /api/v1/portfolio/home` debe ser la fuente principal de lectura de Home.
El mapping siguiente no inventa campos: cuando un requisito del target no estÃ¡
disponible, la UI debe mostrar `unknown`, omitir el dato o marcar revisiÃ³n.

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
legacy. La migraciÃ³n propuesta es de lectura, no una extracciÃ³n de mutaciones.

## C. Final Information Hierarchy

La Home debe responder, en este orden:

1. **Portfolio Reading â€” â€œQuÃ© estÃ¡ pasando en tu portafolioâ€**
   - narrativa factual breve desde `portfolioReading.summary`;
   - 2â€“4 seÃ±ales secundarias solo cuando existan y ayuden a interpretar la
     narrativa;
   - no convertir el bloque en seis KPI cards.
2. **Requiere tu atenciÃ³n**
   - secciÃ³n operacional dominante;
   - ordenar por severidad/impacto factual y luego actualidad, sin recalcular
     autoridad en frontend;
   - cada item: quÃ© ocurre, por quÃ© importa, contexto afectado y siguiente
     movimiento.
3. **Mapa de trabajo estratÃ©gico**
   - frente estratÃ©gico â†’ reto â†’ iniciativas;
   - resumen primero, detalle bajo disclosure;
   - mostrar estado de invitaciÃ³n/initiative sin colapsar lifecycle.
4. **Decisiones pendientes**
   - quÃ© decisiÃ³n se solicita, contexto, evidencia, autoridad conocida y acciÃ³n;
   - no presentar recommendation, `DecisionRequest` y `Decision` como el mismo
     objeto.
5. **Siguientes movimientos recomendados**
   - recomendaciones advisory, visibles sin abrir Copilot cuando son relevantes;
   - evitar repetir literalmente el mismo texto en Main, `InlineInsight` y
     Copilot.

La prioridad de lectura es atenciÃ³n y gobernanza; los conteos son soporte, no el
producto principal de la pantalla.

## D. Above-the-fold Definition

En desktop, sin scroll significativo, deben caber idealmente:

- contexto de pÃ¡gina y heading;
- Portfolio Reading en pocas lÃ­neas;
- los primeros items de `Requiere tu atenciÃ³n`;
- una Ãºnica acciÃ³n dominante contextual (`NextAction` o CTA del header).

No deben intentar caber above-the-fold:

- el mapa estratÃ©gico completo;
- todas las decisiones;
- KPI cards extensas;
- actividad reciente;
- el drawer o conversaciÃ³n del Copilot.

Si `portfolioReading.summary` no estÃ¡ disponible, usar un estado explÃ­cito de
lectura no disponible/pendiente de revisiÃ³n; no fabricar una narrativa desde
contadores legacy.

## E. Attention Design

`attention[]` es la fuente operacional. `PortfolioAttentionList` debe adaptarse
para no perder los cuatro datos mÃ­nimos:

```text
QuÃ© ocurre        â†’ summary
Por quÃ© importa   â†’ reason
Contexto afectado â†’ entity + contexto estratÃ©gico disponible
Siguiente movimiento â†’ suggestedAction / acciÃ³n navegable si existe
```

La presentaciÃ³n puede separar visualmente:

- **SeÃ±al del portafolio / sistema:** `source` o `type` derivado del read model;
- **Solicitud o contexto de equipo:** owner/persona y entidad afectada, cuando
  PH-2 lo permite.

Esto es una distinciÃ³n de presentaciÃ³n basada en campos existentes, no una nueva
taxonomÃ­a de dominio. Si `source` no es suficientemente claro, usar un label
neutral (â€œOrigen no especificadoâ€) o no separar.

La severidad debe conservar la semÃ¡ntica proveniente del modelo. El frontend no
debe convertir una recomendaciÃ³n AI en bloqueo ni asumir que un sponsor es
Decision Authority. La ausencia de `suggestedAction`, owner o severidad se
representa como informaciÃ³n no disponible, no como inferencia.

El estado vacÃ­o usa `EmptyState` y debe decir que no hay seÃ±ales visibles ahora;
su acciÃ³n puede ser la acciÃ³n recomendada existente. No debe forzar `Crear
nuevo frente` si el read model indica otra acciÃ³n prioritaria.

## F. Strategic Work Map Design

### F.1 Composition

```text
Frente estratÃ©gico
  resultado deseado Â· seÃ±al/KPI Â· horizonte Â· atenciÃ³n
  â””â”€ Reto
       estado de invitaciÃ³n / activaciÃ³n
       â””â”€ Iniciativas
            exists / active / unknown
```

Usar progressive disclosure:

- cada frente empieza como una lectura compacta;
- el frente prioritario o con atenciÃ³n puede abrir reto y primera iniciativa;
- el resto queda resumido por conteos y estado;
- el detalle completo navega a la superficie de frente/reto, no se vuelca en
  Home.

### F.2 Handoff visibility

Mostrar explÃ­citamente los estados que PH-2 permite:

- `invitation_pending` / invitation pending;
- `initiative_exists`;
- `initiative_active`;
- `unknown`.

No implementar ni presentar como autoridad:

- `pre_start` canÃ³nico;
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
la entrega con representaciÃ³n aprobada; PH-2 declara esa dependencia como
candidate.

## G. Decision Design

`pendingDecisions[]` se presenta como una cola de gobernanza, no como una lista
de recomendaciones. Cada fila/tarjeta prioriza:

1. decisiÃ³n solicitada (`requestedDecision`);
2. iniciativa y reto/frente asociados;
3. evidencia disponible (`evidenceSummary`), indicando ausencia si corresponde;
4. autoridad (`decisionAuthority`) solo si estÃ¡ conocida;
5. acciÃ³n para revisar/registrar mediante el servicio existente.

Separaciones visuales:

- `recommendation`: propuesta advisory, no decisiÃ³n;
- `DecisionRequest`: solicitud pendiente;
- `Decision`: decisiÃ³n registrada, no debe aparecer como pendiente.

No usar Sponsor como Decision Authority automÃ¡ticamente. Si la autoridad es
`null`, mostrar â€œAutoridad no especificadaâ€ o no mostrar el campo, segÃºn espacio.

## H. Recommendation / Copilot Relationship

### H.1 Recommended Next Moves

`recommendations[]` debe tener una representaciÃ³n parcial en Main cuando exista
una recomendaciÃ³n material: un bloque compacto `Siguientes movimientos
recomendados` despuÃ©s de decisiones o integrado en el bloque `NextAction`, sin
duplicar el texto completo en ambos lugares.

El tratamiento es siempre advisory:

- â€œStarterÃ­a sugiereâ€¦â€;
- â€œPara revisarâ€¦â€;
- â€œPodrÃ­a convenirâ€¦â€;
- indicaciÃ³n de fuente/incertidumbre cuando material.

No usar copy que implique autorizaciÃ³n, asignaciÃ³n o decisiÃ³n tomada.

### H.2 Job exacto del Copilot en Home

El Copilot es una capa cognitiva contextual para:

- priorizar seÃ±ales visibles;
- explicar por quÃ© una atenciÃ³n importa;
- comparar dos seÃ±ales o rutas visibles;
- orientar hacia la superficie correcta;
- preparar una decisiÃ³n sin tomarla.

No debe contener informaciÃ³n crÃ­tica que no exista en Main, reemplazar la cola
de atenciÃ³n, decidir por la persona ni mantener un lifecycle privado.

### H.3 Suggested prompts

Las preguntas sugeridas pueden alimentarse solo de datos visibles del read model:

- â€œÂ¿Por quÃ© esta iniciativa requiere atenciÃ³n?â€ â†’ `attention[].reason`;
- â€œÂ¿QuÃ© decisiones estÃ¡n pendientes?â€ â†’ `pendingDecisions[]`;
- â€œÂ¿DÃ³nde falta cobertura?â€ â†’ `coverageGapCount` o seÃ±al explÃ­cita no nula;
- â€œÂ¿QuÃ© deberÃ­a revisar primero?â€ â†’ orden visible de atenciÃ³n/next action.

Si la fuente no contiene el dato, la pregunta no se ofrece. `InlineInsight` puede
resumir una recomendaciÃ³n, pero no duplicar toda la cola ni inventar evidencia.

## I. Component Treatment

| Component | Treatment | Reason |
|---|---|---|
| `PageHeader` | **KEEP / ADAPT** | Mantener heading, contexto y una CTA; conectar metadata y acciÃ³n al read model. |
| `ContextSummary` | **KEEP / ADAPT** | Ãštil para seÃ±ales compactas y decisiones; reducir su uso como resumen dominante. |
| `NextAction` | **KEEP / ADAPT** | PatrÃ³n correcto para el movimiento primario; input contextual, no regla nueva. |
| `PortfolioAttentionList` | **ADAPT** | Cambiar fuente a `attention[]` y conservar `AttentionItem`/`EmptyState`. |
| `StrategicObjectivesOverview` | **CONSOLIDATE / ADAPT** | Reutilizar su composiciÃ³n como `Strategic Work Map`, con disclosure y menor densidad. |
| `PortfolioSummaryCards` | **MOVE TO SECONDARY** | Solo conservar mÃ©tricas que ayuden a decidir; no competir con attention. |
| `RecentActivitySection` | **MOVE TO SECONDARY** | Ãštil como contexto histÃ³rico; no es prioridad de gobernanza por defecto. |
| `InlineInsight` | **KEEP / ADAPT** | Representar una explicaciÃ³n/recomendaciÃ³n visible y no autoritativa. |
| `PortfolioCopilotLauncher` | **KEEP** | Entrada contextual secundaria. |
| `PortfolioCopilotDrawer` | **KEEP** | ProfundizaciÃ³n contextual; conserva el shell existente y su lifecycle. |
| `PortfolioWelcomeBanner` | **DEPRECATE AFTER MIGRATION** | DS-06 ya lo sustituyÃ³ visualmente por `PageHeader`; retener para otros consumidores. |
| `PortfolioPrimaryActionRail` | **DEPRECATE AFTER MIGRATION** | Object-first y multiacciÃ³n; sustituir por una CTA principal + `NextAction`. |
| Raw local activity/front cards | **DEPRECATE AFTER MIGRATION** | MigraciÃ³n posterior a patrones DS/DS-07, fuera de PH-3A. |

No crear componentes nuevos si `PageHeader`, `ContextSummary`, `AttentionItem`,
`NextAction`, `EmptyState`, `InlineInsight`, `DomainStatusBadge` o los patrones
de frente/reto existentes cubren la necesidad.

## J. Copy Recommendations

La copy final de producto debe vivir en la capa de experiencia/adaptaciÃ³n, no en
primitives DS genÃ©ricas. Propuesta:

| Technical/current label | Productive Spanish |
|---|---|
| `Portfolio Home` | `Inicio del portafolio` o `Portafolio` segÃºn navegaciÃ³n |
| `Requires attention` | `Requiere tu atenciÃ³n` |
| `Executive summary` | `Lectura del portafolio` |
| `Human action` | `Decisiones pendientes` / `AcciÃ³n requerida` segÃºn contexto |
| `Secondary context` | `Contexto del portafolio` |
| `Next action` | `Siguiente movimiento` |
| `Recommended Next Moves` | `Siguientes movimientos recomendados` |
| `Strategic Work Map` | `Mapa de trabajo estratÃ©gico` |
| `Pending activation` | `ActivaciÃ³n pendiente` |
| `Invitation pending` | `InvitaciÃ³n pendiente` |
| `Initiative exists` | `Iniciativa creada` |
| `Initiative active` | `Iniciativa activa` |
| `Unknown` | `Estado no disponible` / `Requiere revisiÃ³n` |
| `Starteria suggests` | `StarterÃ­a sugiere` |

Copy guidance:

- heading: `Â¿QuÃ© requiere tu atenciÃ³n hoy?`;
- reading label: `QuÃ© estÃ¡ pasando en tu portafolio`;
- attention heading: `Requiere tu atenciÃ³n`;
- decisions heading: `Decisiones pendientes`;
- work map heading: `Mapa de trabajo estratÃ©gico`;
- primary action: usar verbo contextual (`Revisar bloqueo`, `Preparar decisiÃ³n`,
  `Revisar cobertura`, `Crear frente`) segÃºn estado factual.

No hardcodear estos textos en primitives reutilizables.

## K. Desktop Wireframe

```text
GLOBAL NAV
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ PORTAFOLIO / INICIO                         [contexto de pÃ¡gina]             â”‚
â”‚ Â¿QuÃ© requiere tu atenciÃ³n hoy?                              [CTA Ãºnica]    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ MAIN WORKSPACE                                â”‚ CONTEXTO OPCIONAL            â”‚
â”‚                                               â”‚                               â”‚
â”‚ QuÃ© estÃ¡ pasando en tu portafolio             â”‚ StarterÃ­a / InlineInsight   â”‚
â”‚ narrative factual + 2â€“4 seÃ±ales               â”‚ prioriza Â· explica Â· orientaâ”‚
â”‚                                               â”‚                               â”‚
â”‚ Requiere tu atenciÃ³n                          â”‚ [Abrir Copilot]              â”‚
â”‚ [item: quÃ© / por quÃ© / contexto / movimiento] â”‚                               â”‚
â”‚ [item: quÃ© / por quÃ© / contexto / movimiento] â”‚ El rail no contiene datos   â”‚
â”‚                                               â”‚ crÃ­ticos exclusivos.         â”‚
â”‚ Mapa de trabajo estratÃ©gico                   â”‚                               â”‚
â”‚ Frente                                        â”‚                               â”‚
â”‚   Reto â†’ iniciativas (disclosure)             â”‚                               â”‚
â”‚                                               â”‚                               â”‚
â”‚ Decisiones pendientes                         â”‚                               â”‚
â”‚ [solicitud / contexto / evidencia / autoridad]â”‚                               â”‚
â”‚                                               â”‚                               â”‚
â”‚ Siguientes movimientos recomendados           â”‚                               â”‚
â”‚ [advisory, sin duplicar Copilot]              â”‚                               â”‚
â”‚                                               â”‚                               â”‚
â”‚ Contexto secundario: mÃ©tricas / actividad     â”‚                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

El rail puede desaparecer si no aÃ±ade explicaciÃ³n o navegaciÃ³n contextual. No
debe reservar ancho para un chat genÃ©rico permanente.

## L. Mobile Wireframe

```text
GLOBAL NAV / PAGE CONTEXT

PORTAFOLIO
Â¿QuÃ© requiere tu atenciÃ³n hoy?
[Siguiente movimiento principal]

QuÃ© estÃ¡ pasando en tu portafolio
lectura breve + seÃ±ales

Requiere tu atenciÃ³n
item prioritario
item prioritario

Mapa de trabajo estratÃ©gico
Frente
  Reto
    Iniciativas / estado de activaciÃ³n

Decisiones pendientes
solicitud Â· contexto Â· evidencia Â· acciÃ³n

Siguientes movimientos recomendados

[Abrir Copilot] â†’ drawer / bottom sheet
```

Orden mÃ³vil obligatorio: Portfolio Reading â†’ atenciÃ³n primaria â†’ acciÃ³n â†’ mapa
estratÃ©gico â†’ decisiones. El Copilot es drawer/bottom sheet y nunca oculta
estado crÃ­tico.

Responsive:

- desktop: main + rail opcional;
- tablet: main primero, rail apilado o colapsable;
- mobile: una columna, disclosure para work map y actividad secundaria.

## M. PH-3B Implementation Impact

Archivos que probablemente cambiarÃ¡n en PH-3B, sujetos a confirmaciÃ³n del plan y
sin autorizarse en PH-3A:

### Lectura y composiciÃ³n frontend

- `front/src/app/pages/PortfolioLeadHomePage.tsx`
- `front/src/app/services/api.ts` (o el cliente API equivalente, para consumir
  `GET /api/v1/portfolio/home` si no existe una funciÃ³n reutilizable)
- nuevo adaptador tipado de read model, probablemente bajo
  `front/src/features/portfolio-lead/services/` o `front/src/features/portfolio-lead/read-model/`
- tests de `PortfolioLeadHomePage` y nuevos tests de mapping del read model.

### Componentes de Home

- `front/src/features/portfolio-lead/components/cards/PortfolioAttentionList.tsx`
- `front/src/features/portfolio-lead/components/cards/PortfolioSummaryCards.tsx`
  (solo si se mantiene como contexto secundario)
- `front/src/app/components/portfolio/PortfolioLeadHomeExperience.tsx`
  (`StrategicObjectivesOverview`, `RecentActivitySection` y patrones legacy)
- `front/src/app/components/design-system/patterns/` solo si un patrÃ³n existente
  necesita una extensiÃ³n compatible y justificada; no crear una familia nueva
  para PH-3B.

### Estado/contexto y navegaciÃ³n

- `front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx` solo para
  preservar acciones, refresh y compatibilidad; no para mantener la lectura
  principal duplicada;
- `front/src/features/portfolio-lead/domain/selectors.ts` Ãºnicamente durante
  la retirada controlada de consumidores legacy, con evidencia de no regresiÃ³n;
- `front/src/features/copilot/components/PortfolioCopilotDrawer.tsx` y/o
  `PortfolioCopilotShell.tsx` solo si hace falta recibir contexto visible, sin
  cambiar servicios ni lifecycle.

### Tests/validaciÃ³n

- `front/src/app/pages/__tests__/PortfolioLeadHomePage.bootstrap.test.tsx`
- `front/src/features/portfolio-lead/components/cards/__tests__/PortfolioAttentionList.test.tsx`
- nuevos tests de estados `invitation_pending`, `initiative_exists`,
  `initiative_active`, `unknown`, decisiones sin autoridad y recomendaciones
  advisory;
- tests de responsive/orden DOM si el harness existente los soporta.

No forman parte de PH-3B por esta especificaciÃ³n: backend read service, Prisma,
Core, rutas de mutaciÃ³n, servicios de Copilot, Activation Readiness o nuevos
estados de lifecycle.

## N. Regression Risks

1. **Doble fuente de verdad visual:** mantener selectores legacy y PH-2 en la
   misma secciÃ³n puede producir conteos o atenciÃ³n contradictorios.
2. **PÃ©rdida de acciones existentes:** sustituir modelos puede eliminar
   `actionPath`, navegaciÃ³n a decisiones o fallback de empty state.
3. **Colapso de lifecycle:** representar invitation, initiative exists y active
   con un Ãºnico badge reintroduce el riesgo que PH-0 prohÃ­be.
4. **Inferencia de autoridad:** mostrar sponsor como autoridad o una
   recomendaciÃ³n como decisiÃ³n confirmada.
5. **Lectura vacÃ­a inventada:** producir narrative desde KPI cuando
   `portfolioReading.summary` es `null`.
6. **DuplicaciÃ³n Copilot/Main:** la misma recommendation puede aparecer como
   `NextAction`, `InlineInsight`, rail y drawer.
7. **RegresiÃ³n responsive:** trasladar atenciÃ³n o decisiÃ³n al rail puede ocultar
   informaciÃ³n crÃ­tica en tablet/mobile.
8. **Densidad excesiva:** expandir toda la ontologÃ­a frente â†’ reto â†’ iniciativa
   vuelve a convertir Home en dashboard.
9. **AcciÃ³n primaria equivocada:** dejar `Crear nuevo frente` fija puede
   desviar al usuario de un bloqueo o decisiÃ³n pendiente.
10. **Legacy cleanup prematuro:** eliminar `PortfolioLeadContext` o selectores
    antes de migrar todas sus mutaciones y consumidores.
11. **Copilot con estado privado:** refrescar o modificar lifecycle desde el
    drawer romperÃ­a el boundary read-only de Home.
12. **Artefactos no certificados:** los focused tests de DS-06 no prueban por sÃ­
    solos la reconciliaciÃ³n completa del read model ni la UX visual manual.

## O. Acceptance Criteria

### O.1 Authority and scope

- [ ] La implementaciÃ³n futura conserva Core v0.2 como autoridad factual.
- [ ] Core v0.3, `pre_start`, Activation Readiness y estados candidate no se
      presentan como aprobados.
- [ ] PH-3B no crea mutaciones dentro de `PortfolioHomeReadModel`.
- [ ] La Home no crea objetos ni activa Initiative/Core por efecto de lectura.

### O.2 Information hierarchy

- [ ] La primera lectura responde quÃ© ocurre, quÃ© requiere atenciÃ³n y cuÃ¡l es el
      siguiente movimiento.
- [ ] `Portfolio Reading` usa `portfolioReading` y no se convierte en un bloque
      de seis KPI cards.
- [ ] `Requires Attention` deja de ser un label tÃ©cnico en inglÃ©s y la secciÃ³n
      es visualmente dominante.
- [ ] El mapa estratÃ©gico aparece despuÃ©s de atenciÃ³n y usa disclosure.
- [ ] Las decisiones y recomendaciones permanecen separadas semÃ¡nticamente.

### O.3 PH-2 mapping

- [ ] `GET /api/v1/portfolio/home` es la fuente principal de lectura.
- [ ] `attention[]` muestra quÃ©, por quÃ©, contexto y movimiento cuando los datos
      estÃ¡n disponibles.
- [ ] `strategicUnits[]` conserva frente â†’ reto â†’ iniciativa.
- [ ] Los estados de handoff disponibles son visibles y no se colapsan.
- [ ] `pendingDecisions[]` muestra evidencia y autoridad solo cuando existen.
- [ ] `recommendations[]` se marca como advisory y requiere confirmaciÃ³n humana.
- [ ] `source`, `derivationSource` y `unknown` se respetan donde son materiales.

### O.4 CTA and Copilot

- [ ] Home tiene normalmente una Ãºnica CTA primaria.
- [ ] La CTA se selecciona mediante un patrÃ³n de presentaciÃ³n gobernado por el
      read model (`nextGovernanceAction` disponible en unidad estratÃ©gica,
      atenciÃ³n prioritaria, decisiÃ³n pendiente, recommendation o fallback), sin
      crear nueva lÃ³gica de dominio en frontend.
- [ ] `Crear nuevo frente` solo aparece como CTA primaria cuando el estado
      factual no indica una acciÃ³n de mayor prioridad.
- [ ] Copilot prioriza, explica, compara, orienta o prepara decisiÃ³n.
- [ ] Copilot no contiene la Ãºnica copia de una alerta, no decide y no tiene
      lifecycle privado.

### O.5 Responsive and regression safety

- [ ] Desktop conserva main + rail contextual opcional.
- [ ] Tablet apila o colapsa el contexto despuÃ©s del main.
- [ ] Mobile conserva el orden Reading â†’ atenciÃ³n â†’ acciÃ³n â†’ mapa â†’ decisiones.
- [ ] No se oculta estado crÃ­tico detrÃ¡s de Copilot.
- [ ] Se preservan las rutas/acciones existentes y el refresh de contextos.
- [ ] KPI cards y Recent Activity no compiten con atenciÃ³n above-the-fold.
- [ ] `git diff --check` pasa y no se modifican archivos productivos durante
      PH-3A.

### O.6 Human review gate

- [ ] Producto/diseÃ±o valida el orden de secciones y el patrÃ³n CTA.
- [ ] Se valida la traducciÃ³n de labels tÃ©cnicos a copy de producto.
- [ ] Se confirma si `RecentActivitySection` permanece como disclosure o se
      traslada a otra vista.
- [ ] Se confirma el contrato de adaptaciÃ³n del `nextGovernanceAction` antes de
      implementar PH-3B.

## Referencias leÃ­das

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
