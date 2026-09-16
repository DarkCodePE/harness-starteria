# STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1

**Estado:** Draft para validación de producto/diseño
**Propósito:** Definir anatomías de página reutilizables para Starteria, de modo que las distintas experiencias compartan una gramática visual y de interacción sin forzar que todas las pantallas se vean iguales.
**Ámbito:** Landing, Portfolio Entry, Handoff, Portfolio Lead, creación guiada, invitaciones, Initiative Workspace, Steps, reviews, decision briefs y emails.
**Dependencia:** `STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
**Regla:** Este documento define estructura visual reutilizable. No redefine lógica Core, permisos, autoridad humana/IA ni reglas de negocio.

---

# 0. Principio central

Starteria no debe diseñar cada pantalla desde cero.

La arquitectura visual debe operar así:

```text
E2E EXPERIENCE
      â†“
PAGE ANATOMY
      â†“
DOMAIN CONTENT
      â†“
DESIGN SYSTEM COMPONENTS
      â†“
SCREEN
```

Una anatomía define:

- zonas;
- jerarquía;
- comportamiento esperado;
- posición de acciones;
- relación con Copilot;
- densidad;
- estados.

No define:

- copy definitivo;
- datos;
- reglas de negocio;
- lógica de permisos;
- qué decisión toma una persona;
- qué salida produce una Skill.

---

# 1. Anatomías maestras

Starteria utilizará inicialmente nueve familias:

1. `PublicLandingPage`
2. `ConversationEntryPage`
3. `HandoffConversionPage`
4. `PortfolioWorkspacePage`
5. `GuidedCreationPage`
6. `InvitationPage`
7. `InitiativeWorkspacePage`
8. `ReviewDecisionPage`
9. `EmailCommunicationPattern`

Estas familias son patrones, no rutas concretas.

---

# 2. Reglas transversales de todas las páginas

## PA-GEN-01 â€” Una acción primaria dominante

Cada superficie debe dejar claro cuál es la siguiente acción principal.

Evitar:

```text
[Guardar] [Continuar] [Crear] [Revisar] [Enviar] [Siguiente]
```

con el mismo peso visual.

## PA-GEN-02 â€” Contexto antes que controles

Antes de pedir una acción, la pantalla debe explicar:

```text
dónde estoy
qué estoy viendo
por qué importa
qué sigue
```

## PA-GEN-03 â€” Estado visible

Cuando exista estado de workflow, debe ser visible sin tener que abrir un menú.

## PA-GEN-04 â€” Copilot contextual

El Copilot solo aparece cuando añade valor al job actual.

No se fuerza un panel de chat en todas las páginas.

## PA-GEN-05 â€” Humano e IA distinguibles

Sugerencias IA, confirmaciones humanas, revisiones y decisiones no deben compartir la misma representación.

## PA-GEN-06 â€” Responsive sin perder jerarquía

En móvil:

- sidebar puede colapsar;
- Copilot puede convertirse en drawer;
- paneles secundarios pueden apilarse;
- la acción primaria debe permanecer clara.

## PA-GEN-07 â€” MVP flexible

Se debe poder:

- cambiar copy;
- reordenar bloques;
- ocultar bloques opcionales;
- probar variantes;

sin romper la anatomía completa.

---

# 3. Anatomy 01 â€” PublicLandingPage

## Job

Presentar Starteria, transmitir valor y llevar al usuario a una primera acción.

## Uso

- Landing pública
- Home marketing
- Variante enterprise futura

## Anatomía

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ TOP NAV                                                      â”‚
â”‚ Brand        Value links                         Auth / CTA   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ HERO                                                         â”‚
â”‚                                                              â”‚
â”‚ Eyebrow                                                      â”‚
â”‚ Headline                                                     â”‚
â”‚ Supporting copy                                              â”‚
â”‚                                                              â”‚
â”‚ Primary CTA       Secondary CTA optional                     â”‚
â”‚                                                              â”‚
â”‚ Visual / ambient product expression                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ CAPABILITIES / VALUE BLOCKS                                  â”‚
â”‚                                                              â”‚
â”‚ 01 Align     02 Understand     03 Follow     04 Decide       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ HOW IT WORKS                                                 â”‚
â”‚                                                              â”‚
â”‚ 1 â†’ 2 â†’ 3 â†’ 4 â†’ 5                                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ROLE / USE CASE SECTION                                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ FINAL CTA                                                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Visual mode

- editorial;
- premium;
- generous spacing;
- stronger brand expression;
- no dense dashboards.

## Copilot

Implicit.

Do not show a persistent Copilot panel here.

## Optional blocks

- enterprise value;
- customer evidence;
- role examples;
- illustrative product cards.

## Non-goals

- no operational dashboard;
- no status-heavy UI;
- no table-first experience.

---

# 4. Anatomy 02 â€” ConversationEntryPage

## Job

Permitir conversación estructurada para entender y aclarar.

## Uso

- Portfolio Entry
- Quick Clarification
- Guided Exploration

## Anatomía

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ SIMPLE HEADER                                                â”‚
â”‚ â† / Starteria                               Session state    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ CONTEXT                                                     â”‚
â”‚ Short title / purpose                                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ CONVERSATION AREA                                           â”‚
â”‚                                                              â”‚
â”‚ User input                                                   â”‚
â”‚ Starteria interpretation                                     â”‚
â”‚ Question                                                     â”‚
â”‚ User response                                                â”‚
â”‚                                                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ PROGRESS / MODE                                              â”‚
â”‚ Aclaración 1 de hasta 3                                     â”‚
â”‚ or Guided Exploration · Ronda 1                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ACTION                                                       â”‚
â”‚ [Responder / Continuar]                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Copilot mode

Primary interface.

## Rules

- no generic chat bubbles overload;
- reveal only what matters;
- display progress;
- preserve a visible path out of exploration.

## Mobile

Full-width conversation.

---

# 5. Anatomy 03 â€” HandoffConversionPage

## Job

Transformar análisis en valor visible y conectar ese valor con el motivo de registrarse.

## Uso

- Handoff pre-registro
- Proposal result
- Conversion moment

## Desktop anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ SIMPLE HEADER                                                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ANALYSIS / VALUE             â”‚ CONTINUE WITH STARTERIA      â”‚
â”‚                              â”‚                              â”‚
â”‚ What we understood           â”‚ Value proposition            â”‚
â”‚                              â”‚                              â”‚
â”‚ Desired outcome              â”‚ What you unlock               â”‚
â”‚                              â”‚                              â”‚
â”‚ Decision to enable           â”‚ Starteria path                â”‚
â”‚                              â”‚                              â”‚
â”‚ Known context                â”‚ Primary CTA                   â”‚
â”‚                              â”‚                              â”‚
â”‚ Gaps                         â”‚ Secondary auth options        â”‚
â”‚                              â”‚                              â”‚
â”‚ Suggested approach           â”‚ Trust / continuity message   â”‚
â”‚                              â”‚                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Width relation

Recommended initial ratio:

```text
left: 60â€“65%
right: 35â€“40%
```

## Mobile

```text
Analysis
â†“
Suggested path
â†“
Conversion card
```

## Copilot

Inline structured recommendation, not chat.

## Visual mode

This is the bridge between editorial and product UI.

---

# 6. Anatomy 04 â€” PortfolioWorkspacePage

## Job

Gestionar contexto, atención y decisiones a nivel de portfolio.

## Uso

- Portfolio Home
- Strategic Front
- Challenge Detail
- Decisions
- future Learning Library

## Desktop anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ GLOBAL NAV  â”‚ MAIN WORKSPACE                   â”‚ COPILOT      â”‚
â”‚             â”‚                                  â”‚              â”‚
â”‚ Home        â”‚ Breadcrumb / context             â”‚ Contextual   â”‚
â”‚ Portfolio   â”‚                                  â”‚ insight      â”‚
â”‚ Decisions   â”‚ Page title        Actions        â”‚              â”‚
â”‚             â”‚ Supporting copy                  â”‚ Suggestions  â”‚
â”‚             â”‚                                  â”‚              â”‚
â”‚             â”‚ Status / summary                 â”‚ Questions    â”‚
â”‚             â”‚                                  â”‚              â”‚
â”‚             â”‚ Main operational content         â”‚ Actions      â”‚
â”‚             â”‚                                  â”‚              â”‚
â”‚             â”‚ Next action                      â”‚              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Copilot behavior

Desktop:
- side panel;
- collapsible;
- context-aware.

Mobile:
- drawer / bottom sheet;
- never permanently reduce main content width.

## Density

Primarily `compact`.

Can switch to `comfortable` on detail pages.

## Rules

- Page title never competes with Copilot;
- alerts stay in main state, not only inside Copilot;
- Copilot cannot be the only place where critical status exists.

---

# 7. PortfolioWorkspace subtypes

## 7.1 Portfolio Home

Priority:

```text
attention
â†’ decisions
â†’ portfolio structure
```

## 7.2 Strategic Front

Priority:

```text
strategic outcome
â†’ coverage
â†’ challenges
â†’ next action
```

## 7.3 Challenge Detail

Priority:

```text
challenge context
â†’ activation
â†’ coverage
â†’ initiative pipeline
â†’ decisions
```

Same anatomy, different information hierarchy.

---

# 8. Anatomy 05 â€” GuidedCreationPage

## Job

Ayudar a crear o configurar un objeto sin convertirlo en formulario administrativo.

## Uso

- Create Strategic Front
- Create Challenge
- Activate Challenge
- Certain workspace setup flows

## Anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ OPTIONAL     â”‚ GUIDED FORM / CREATION          â”‚ ASSIST      â”‚
â”‚ CONTEXT      â”‚                                 â”‚              â”‚
â”‚              â”‚ Title                           â”‚ Starteria    â”‚
â”‚ Parent       â”‚ Description                     â”‚ guidance     â”‚
â”‚ object       â”‚                                 â”‚              â”‚
â”‚              â”‚ Section 1                       â”‚ Suggestion   â”‚
â”‚              â”‚ [inputs]                        â”‚              â”‚
â”‚              â”‚                                 â”‚ Explanation  â”‚
â”‚              â”‚ Section 2                       â”‚              â”‚
â”‚              â”‚ [inputs]                        â”‚ Apply action â”‚
â”‚              â”‚                                 â”‚              â”‚
â”‚              â”‚ Secondary   [Primary action]    â”‚              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Copilot

Contextual assist, not conversational by default.

May surface:

- scope warning;
- suggested framing;
- recommended activation modality;
- missing context.

## Rules

- AI suggestions must be opt-in to apply;
- human edits stay visible;
- forms can be saved as draft when domain allows.

---

# 9. Anatomy 06 â€” InvitationPage

## Job

Dar contexto suficiente para que una persona acepte o rechace una participación.

## Uso

- Initiative Owner invite
- Mentor invite
- Sponsor invite
- future team invitation variants

## Anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Starteria                                                    â”‚
â”‚                                                              â”‚
â”‚ Context label                                                â”‚
â”‚ INVITACIÓN                                                   â”‚
â”‚                                                              â”‚
â”‚ Title                                                        â”‚
â”‚ Supporting context                                           â”‚
â”‚                                                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ What you are joining                                    â”‚ â”‚
â”‚ â”‚ Front / Challenge / Initiative                           â”‚ â”‚
â”‚ â”‚                                                         â”‚ â”‚
â”‚ â”‚ Your role                                               â”‚ â”‚
â”‚ â”‚                                                         â”‚ â”‚
â”‚ â”‚ What is expected                                        â”‚ â”‚
â”‚ â”‚                                                         â”‚ â”‚
â”‚ â”‚ Invited by                                              â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                              â”‚
â”‚ [Accept]                         [Decline / Can't participate]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Visual mode

- simple;
- trustworthy;
- no sidebar;
- no operational clutter.

## Post-acceptance

Transitions to Start/Context, not directly into deep work.

---

# 10. Anatomy 07 â€” InitiativeWorkspacePage

## Job

Ser el espacio estable del Initiative Owner para desarrollar la iniciativa.

## Uso

- Initiative Overview
- Step 0
- Step 1
- Step 2
- Step 3
- Step 4

## Desktop anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ INITIATIVE   â”‚ MAIN WORKSPACE                   â”‚ COPILOT      â”‚
â”‚ NAV          â”‚                                  â”‚              â”‚
â”‚              â”‚ Context breadcrumb               â”‚ Contextual   â”‚
â”‚ Overview     â”‚                                  â”‚ guidance     â”‚
â”‚ Step 0       â”‚ Page title                       â”‚              â”‚
â”‚ Step 1       â”‚ Status / progress                â”‚ Questions    â”‚
â”‚ Step 2       â”‚                                  â”‚              â”‚
â”‚ Step 3       â”‚ Anchor context                   â”‚ Suggestions  â”‚
â”‚ Step 4       â”‚                                  â”‚              â”‚
â”‚ Evidence     â”‚ Main work                        â”‚ Review help  â”‚
â”‚              â”‚                                  â”‚              â”‚
â”‚              â”‚ Evidence / output                â”‚              â”‚
â”‚              â”‚                                  â”‚              â”‚
â”‚              â”‚ Next action                      â”‚              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Density

Comfortable by default.

## Copilot

Always contextual to current initiative and Step.

## Rule

The workspace anatomy remains stable across Steps.

Do not redesign the product for every Step.

---

# 11. Initiative Overview subtype

## Information hierarchy

```text
identity
â†’ inherited context
â†’ next action
â†’ route
â†’ evidence
â†’ blockers
â†’ Copilot
```

The Overview is not another Step.

It is orientation and navigation.

---

# 12. Step Workspace subtype

## Information hierarchy

```text
Step purpose
â†’ anchor context
â†’ guided work
â†’ evidence
â†’ output
â†’ review readiness
â†’ next action
```

## Stable visual anchors

- Step navigation;
- current Step;
- progress/state;
- Copilot;
- review action.

---

# 13. Anatomy 08 â€” ReviewDecisionPage

## Job

Presentar evidencia, evaluación y opciones de decisión sin mezclar autoridad.

## Uso

- AI Review
- Mentor Review
- Sponsor Touchpoint
- Initiative Brief
- Decision Brief
- Human Decision

## Anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ CONTEXT HEADER                                               â”‚
â”‚ Initiative / Challenge / Decision                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ SUMMARY                                                      â”‚
â”‚ Goal | Status | Owner | Evidence                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ MAIN BRIEF                    â”‚ REVIEW / DECISION SUPPORT    â”‚
â”‚                               â”‚                              â”‚
â”‚ What we wanted                â”‚ AI / Mentor / Sponsor        â”‚
â”‚ What happened                 â”‚ clearly identified          â”‚
â”‚ Evidence                      â”‚                              â”‚
â”‚ Learning                      â”‚ Key questions                â”‚
â”‚ Risks / limits                â”‚                              â”‚
â”‚                               â”‚ Recommendation               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ HUMAN DECISION / NEXT ACTION                                 â”‚
â”‚                                                               â”‚
â”‚ options + rationale + primary action                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Authority rule

Display source prominently:

```text
Starteria suggestion
Mentor review
Sponsor decision
Portfolio Lead decision
```

Never collapse into generic â€œApprovedâ€.

---

# 14. AI Review subtype

Use:

```text
What is strong
What is missing
Why it matters
Next action
```

Do not use scoring as the primary visual unless product contracts explicitly require it.

---

# 15. Decision Brief subtype

Use:

```text
objective
work performed
evidence
result
learning
risks
team recommendation
Starteria synthesis
3 strategic questions
possible routes
human decision
```

---

# 16. Anatomy 09 â€” EmailCommunicationPattern

## Job

Communicate one event clearly and drive one action.

## Anatomy

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ STARTERIA                                                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ CONTEXT LABEL                                                â”‚
â”‚ Invitation / Review / Decision                               â”‚
â”‚                                                              â”‚
â”‚ TITLE                                                        â”‚
â”‚                                                              â”‚
â”‚ What happened                                                â”‚
â”‚ Why it matters                                               â”‚
â”‚                                                              â”‚
â”‚ CONTEXT CARD                                                 â”‚
â”‚                                                              â”‚
â”‚ PRIMARY CTA                                                  â”‚
â”‚                                                              â”‚
â”‚ Supporting note                                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Why you received this                                        â”‚
â”‚ Starteria                                                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Rules

- max one primary CTA;
- email is not the workspace;
- show only minimum context needed;
- never put sensitive full initiative content by default;
- landing after CTA carries richer context.

---

# 17. Copilot placement matrix

| Anatomy | Default placement |
|---|---|
| PublicLandingPage | none / implicit |
| ConversationEntryPage | main interface |
| HandoffConversionPage | inline structured insight |
| PortfolioWorkspacePage | right contextual panel |
| GuidedCreationPage | right assist panel / inline |
| InvitationPage | none |
| InitiativeWorkspacePage | right contextual panel |
| ReviewDecisionPage | integrated review/support column |
| EmailCommunicationPattern | none |

---

# 18. Copilot responsive behavior

## Desktop

Panel width should be stable enough to read, but not dominate workspace.

Conceptual:

```text
main workspace: ~70â€“78%
copilot: ~22â€“30%
```

## Tablet

Copilot can become:

- collapsible rail;
- drawer.

## Mobile

Copilot becomes:

- bottom sheet;
- full-screen contextual overlay;
- inline insight.

Critical state must remain visible without opening Copilot.

---

# 19. Action hierarchy

Across all anatomies:

## Primary
One dominant action.

## Secondary
Alternative meaningful action.

## Tertiary / Ghost
Supporting actions.

## Destructive
Visually distinct, never primary by default.

Examples:

```text
Create space â†’ primary
Edit â†’ secondary
Download â†’ tertiary
Delete â†’ destructive
```

---

# 20. Status placement

Status belongs close to object identity.

Example:

```text
Automatización onboarding    [Requires review]
```

Not hidden only inside:

- menu;
- tooltip;
- Copilot.

---

# 21. Next Action pattern

Any operational screen should expose one `NextAction` when relevant.

Structure:

```text
Next action
What you need to do
Why
CTA
```

Example:

```text
Siguiente acción

Completa la evidencia mínima para enviar
este Step a revisión.

[Continuar Step 2]
```

---

# 22. Empty State pattern

Structure:

```text
What is absent
Why it matters
What to do next
CTA
```

Avoid decorative-only empty states.

---

# 23. Error anatomy

All error states should preserve:

```text
what failed
what was preserved
what the user can do
```

Example:

```text
No pudimos generar la revisión.

Tu información sigue guardada.

[Intentar nuevamente]
```

---

# 24. Loading anatomy

Avoid anonymous spinners when Starteria is performing a meaningful cognitive task.

Prefer:

```text
Analizando contexto
âœ“ Entendiendo objetivo
âœ“ Revisando gaps
â—‹ Preparando propuesta
```

Use simple spinner only for short technical interactions.

---

# 25. Visual density rules

## Comfortable

Use for:

- entry;
- creation;
- Steps;
- review;
- invitations.

## Compact

Use for:

- Portfolio Home;
- attention queue;
- lists;
- coverage;
- decision overview.

Domain components should support both without duplicating logic.

---

# 26. Page width strategy

Do not hardcode unique widths per route.

Use semantic containers:

```text
content.narrow
content.standard
content.wide
workspace.full
```

Suggested use:

| Anatomy | Container |
|---|---|
| PublicLanding | wide |
| ConversationEntry | narrow/standard |
| HandoffConversion | wide |
| PortfolioWorkspace | full |
| GuidedCreation | wide |
| Invitation | narrow/standard |
| InitiativeWorkspace | full |
| ReviewDecision | wide/full |

Exact pixel values belong to the Design System Contract.

---

# 27. What stays experimental

This anatomy system intentionally allows experimentation with:

- headline;
- CTA wording;
- block order;
- optional sections;
- information density;
- whether a supporting block is card or plain section;
- Copilot expanded/collapsed default;
- illustrations;
- marketing visuals.

It does NOT allow uncontrolled changes to:

- semantic state;
- authority representation;
- page job;
- main action hierarchy;
- critical context visibility.

---

# 28. Acceptance checklist

This Page Anatomy System is ready to freeze when:

- every E2E screen maps to one anatomy;
- no major screen requires an entirely new layout without clear reason;
- Copilot placement is explicit;
- action hierarchy is predictable;
- responsive behavior is defined;
- AI vs human authority stays distinguishable;
- invitation/email/review patterns are covered;
- MVP content experiments remain possible.

---

# 29. Mapping E2E â†’ Anatomy

| E2E Surface | Anatomy |
|---|---|
| Landing | PublicLandingPage |
| Portfolio Entry | ConversationEntryPage |
| Clarification | ConversationEntryPage |
| Handoff | HandoffConversionPage |
| Auth | HandoffConversionPage / Auth variant |
| Portfolio Home | PortfolioWorkspacePage |
| Strategic Front | PortfolioWorkspacePage |
| Create Challenge | GuidedCreationPage |
| Challenge Detail | PortfolioWorkspacePage |
| Activation | GuidedCreationPage |
| Email Invitation | EmailCommunicationPattern |
| Invitation Landing | InvitationPage |
| Acceptance / Start | InvitationPage variant |
| Initiative Overview | InitiativeWorkspacePage |
| Step 0â€“4 | InitiativeWorkspacePage |
| AI Review | ReviewDecisionPage |
| Mentor Review | ReviewDecisionPage |
| Decision Brief | ReviewDecisionPage |
| Human Decision | ReviewDecisionPage |
| Return to Portfolio | PortfolioWorkspacePage |
| Learning Record | PortfolioWorkspacePage / future detail |

---

# 30. Próximo artefacto

Después de validar este documento:

```text
STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md
```

Ese documento debe definir:

- modos cognitivos;
- placement;
- visual treatments;
- interaction states;
- authority/provenance;
- handoff between Copilot and structured UI;
- what changes by Portfolio / Initiative / Step / Review / Decision.
