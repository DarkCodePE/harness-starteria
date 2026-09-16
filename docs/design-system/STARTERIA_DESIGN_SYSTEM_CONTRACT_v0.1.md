# STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1

**Estado:** Draft para validación antes de implementación
**Propósito:** Convertir la arquitectura E2E, las anatomías de página, el sistema de interacción del Copilot y la dirección visual acordada en reglas de diseño e implementación reutilizables para Starteria.
**Ámbito:** Foundations + primitives + semantic states + AI/human treatments + layout + responsive + accessibility + experimentation + migration.
**Dependencias:**
- `STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
- `STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
- `STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
- `STARTERIA_CORE_LOGIC_CONTRACT.md`
- `STARTERIA_AUTHORITY.md`

---

# 0. Principio rector

Starteria necesita consistencia sin rigidez.

El Design System debe permitir:

```text
ESTABLE
Foundations
Primitives
Accessibility
Semantic states
Interaction rules

SEMI-ESTABLE
Patterns
Domain components
Page anatomies
Copilot visual treatments

EXPERIMENTAL
Copy
CTA wording
Section order
Content hierarchy
Experience variants
Value proposition
Marketing visuals
```

Regla:

> Un cambio de propuesta de valor, mensaje o orden de contenido no debe obligar a rehacer el Design System.

---

# 1. Dirección visual

Starteria adopta como baseline:

## Strategic Calm + Intelligent Momentum

Interpretación:

```text
70% Strategic Calm
30% Intelligent Momentum
```

Debe sentirse:

- clara;
- estratégica;
- confiable;
- moderna;
- inteligente;
- orientada a avanzar.

No debe sentirse:

- burocrática;
- infantil;
- futurista/AI-neon;
- excesivamente gamificada;
- como un chatbot con dashboard alrededor.

---

# 2. Stack visual aprobado

Baseline actual:

```text
React 18
Vite
TypeScript
Tailwind v4
CSS variables
Radix / shadcn-style primitives
Lucide icons
```

## Regla DS-STACK-01

No introducir una segunda librería visual principal mientras la stack actual cubra la necesidad.

## Regla DS-STACK-02

MUI/emotion no debe convertirse en dependencia principal del Design System.

---

# 3. Arquitectura del Design System

Estructura conceptual:

```text
design-system/
â”œâ”€â”€ foundations/
â”œâ”€â”€ primitives/
â”œâ”€â”€ patterns/
â””â”€â”€ starteria/

content/
experiments/
```

## Foundations

- colors;
- typography;
- spacing;
- radius;
- borders;
- elevation;
- motion;
- breakpoints;
- z-index.

## Primitives

- Button;
- IconButton;
- Input;
- Textarea;
- Select;
- Checkbox;
- Radio;
- Switch;
- Badge;
- Card;
- Dialog;
- Drawer;
- Tooltip;
- Tabs;
- Table;
- Toast;
- Alert;
- Progress;
- Skeleton.

## Patterns

- PageHeader;
- EmptyState;
- NextAction;
- DomainStatusBadge;
- AISuggestionPanel;
- AIReviewBlock;
- HumanReviewBlock;
- AttentionItem;
- InvitationCard;
- DecisionSupportBlock;
- EmailPattern.

## Starteria domain

- StrategicFrontCard;
- ChallengeCard;
- InitiativeCard;
- StepProgress;
- EvidenceItem;
- DecisionCard;
- PortfolioAttentionQueue;
- CoverageIndicator.

---

# 4. Color system

## 4.1 Brand baseline

Candidate direction:

```text
brand.primary        #4F46E5
brand.primary.hover  #4338CA
brand.primary.subtle #EEF2FF

brand.accent         #06B6D4
```

Exact HEX values remain provisional until visual validation, but semantic roles are frozen.

---

## 4.2 Neutral system

Starteria should be predominantly neutral.

Conceptual tokens:

```text
background.default
background.subtle

surface.default
surface.elevated
surface.selected

border.default
border.strong

text.primary
text.secondary
text.muted
text.inverse
```

Guideline:

```text
80â€“85% neutral
10â€“15% semantic state
~5% brand/accent
```

---

# 5. Semantic states

Color follows meaning.

Do not assign color first and invent semantics afterwards.

## Workflow

```text
workflow.draft
workflow.active
workflow.completed
workflow.blocked
workflow.closed
```

## Review

```text
review.unreviewed
review.requires_review
review.confirmed
review.rejected
review.superseded
```

## Feedback

```text
feedback.info
feedback.success
feedback.warning
feedback.danger
```

## AI

```text
ai.suggested
ai.subtle
ai.border
ai.text
```

## Critical rule

```text
confirmed â‰  completed â‰  approved
```

These may share visual family, but must not share identical meaning.

---

# 6. AI vs Human visual distinction

## AI

Default treatment:

- subtle indigo/lavender surface;
- Starteria label;
- Sparkles/Lucide equivalent;
- visible suggestion state;
- rationale available.

Example:

```text
âœ¦ Starteria sugiere
...
```

## Human confirmed

Treatment:

- neutral/authoritative;
- human identity or role when relevant;
- check state;
- no AI color.

Example:

```text
âœ“ Confirmado por Portfolio Lead
```

## Rule

AI suggestion must never visually look more authoritative than a human-confirmed decision.

---

# 7. Typography

## Baseline

Use `Inter` as MVP product baseline unless audit reveals a stronger already-loaded equivalent.

Priorities:

1. legibility;
2. density;
3. hierarchy;
4. consistency;
5. product neutrality.

## Scale

```text
Display
Heading XL
Heading L
Heading M
Heading S
Body L
Body
Body S
Label
Caption
```

Initial size guidance:

```text
Display     40â€“48
Heading XL  32
Heading L   24
Heading M   20
Heading S   16
Body L      16
Body        14
Body S      13
Label       13
Caption     12
```

## Weights

```text
400 content
500 labels / emphasis
600 headings / key actions
```

Avoid widespread 700â€“800.

---

# 8. Spacing

Use a consistent spacing scale.

Conceptual sequence:

```text
2
4
8
12
16
20
24
32
40
48
64
```

Rules:

- no arbitrary route-specific spacing unless justified;
- page rhythm should come from semantic spacing tokens;
- dense screens and comfortable screens share same scale.

---

# 9. Radius

Baseline visual direction:

```text
small    6â€“8
medium   10â€“12
large    16
```

Use large radius only for:
- landing/editorial cards;
- high-level marketing surfaces.

Internal product surfaces should remain more structured.

---

# 10. Elevation and borders

Starteria relies more on borders than heavy shadows.

Rules:

- default cards: border + minimal/no shadow;
- dialogs/drawers: moderate elevation;
- floating overlays: stronger elevation;
- avoid layered shadows everywhere.

---

# 11. Density modes

Every major reusable domain component should support:

```text
comfortable
compact
```

## Comfortable

Use for:
- Portfolio Entry;
- creation;
- Steps;
- invitations;
- reviews.

## Compact

Use for:
- Portfolio Home;
- attention queues;
- initiative lists;
- reporting;
- coverage views.

---

# 12. Page containers

Semantic containers:

```text
content.narrow
content.standard
content.wide
workspace.full
```

Do not hardcode a different max-width per route.

---

# 13. Primitive rules

## Button

Approved variants:

```text
primary
secondary
ghost
destructive
icon
```

Rule:

> A screen should normally have one primary CTA.

## Card

Card is structural, not decorative.

Avoid:
- nested cards without hierarchy;
- color-filled cards for every state.

## Badge

Badge communicates status or category only.

Do not use badge as generic label for everything.

## Dialog / Drawer

- Dialog: focused decision/confirmation.
- Drawer: contextual secondary content.
- Do not use modal for full journeys when a page is more appropriate.

---

# 14. DomainStatusBadge

Purpose:

Represent backend/domain state.

Allowed:

```tsx
<DomainStatusBadge status="requires_review" />
```

Not allowed:

A visual component deciding business status from raw evidence or workflow data.

Business logic stays outside Design System.

---

# 15. PageHeader pattern

Must support:

```text
context / breadcrumb
title
supporting copy
status
primary action
secondary actions
```

Should remain consistent across Portfolio and Initiative workspaces.

---

# 16. EmptyState pattern

Every actionable empty state contains:

```text
what is absent
why it matters
what to do next
CTA
```

Example:

```text
Este reto todavía no tiene iniciativas.

Puedes activar personas, vincular una iniciativa existente o abrir convocatoria.

[Activar reto]
```

---

# 17. NextAction pattern

Operational surfaces should expose a next action when meaningful.

Structure:

```text
Siguiente acción
what
why
CTA
```

---

# 18. AI interaction patterns

Approved patterns:

```text
InlineInsight
AssistPanel
CopilotPanel
StructuredHandoff
ReviewBlock
DecisionSupportBlock
```

No introduce new AI presentation without first checking whether one of these fits.

---

# 19. Copilot panel

Desktop:

```text
main workspace ~70â€“78%
copilot ~22â€“30%
```

Tablet/mobile:
- collapsible;
- drawer;
- bottom sheet;
- inline insight.

Critical state must never exist only inside Copilot.

---

# 20. Reviews

The system must distinguish:

```text
AI Review
Mentor Review
Sponsor / Portfolio Decision
```

Do not render all as generic â€œreview passedâ€.

---

# 21. Decision Support

DecisionSupportBlock may contain:

```text
synthesis
3 strategic questions
conclusion
possible routes
uncertainty
```

Possible routes may include:

- iterate;
- pivot;
- expand test;
- scale;
- transfer;
- close with learning.

The Design System does not determine which routes are valid for a given business state.

---

# 22. Email system

Emails share Starteria identity but are simplified.

Pattern:

```text
brand
context label
title
what happened
why it matters
context card
primary CTA
why you received this
```

Rules:

- one primary CTA;
- minimal sensitive content;
- richer context after click;
- same semantics/tone as app.

---

# 23. UX writing system

Voice:

- clear;
- direct;
- criterious;
- close;
- action-oriented;
- calm.

Avoid:

- exaggerated enthusiasm;
- bureaucratic language;
- unnecessary innovation jargon;
- AI overclaim;
- motivational filler.

---

# 24. Message anatomy

System messages should aim to answer:

```text
what happened
why it matters
what can the user do
```

Example:

```text
Falta la revisión del mentor para cerrar este Step.

Solicita la revisión cuando el entregable esté listo.
```

---

# 25. Terminology

Canonical product terminology should remain stable:

```text
Iniciativa
Frente estratégico
Reto
Sponsor
Mentor
Step
Evidencia
Decisión
```

But the public experience may use simpler user language.

Example:

Internal:
`StrategicFront`

User-facing:
`prioridad que quieres mover`

---

# 26. Motion

Use motion to communicate:

- reveal;
- loading;
- progress;
- context switch;
- confirmation.

Avoid:
- decorative bouncing;
- continuous gradients;
- floating animation;
- over-celebration.

---

# 27. Loading

Use contextual processing when meaningful:

```text
Entendiendo tu situación...
Revisando gaps...
Preparando una propuesta...
```

Use spinner only for short technical operations.

---

# 28. Accessibility

Minimum expectations:

- WCAG AA contrast target;
- keyboard navigation;
- visible focus;
- form labels;
- proper error messaging;
- accessible dialog focus;
- heading hierarchy;
- no color-only state meaning;
- icon-only actions need accessible labels.

Accessibility is not optional polish.

---

# 29. Responsive

Desktop-first workspace, but fully responsive.

## Mobile principles

- sidebars collapse;
- Copilot becomes drawer/bottom sheet;
- primary action remains visible;
- tables degrade to stacked/scrollable patterns;
- no critical state hidden behind hover.

---

# 30. Experimentation layer

Design System must support experience experiments without forking components.

Allowed experimental changes:

- copy;
- CTA wording;
- section order;
- optional sections;
- information density;
- default Copilot open/closed;
- marketing imagery;
- onboarding narrative.

Avoid creating:

```text
ComponentV2
ComponentFinal
ComponentNew
```

for each experiment.

Prefer controlled variants.

---

# 31. Content separation

Copy should not be deeply hardcoded in reusable components.

Prefer:

```tsx
<EmptyState
  title={content.title}
  description={content.description}
  action={content.cta}
/>
```

This enables message testing without rebuilding components.

---

# 32. Deprecation policy

When consolidating:

```text
KEEP
ADAPT
CONSOLIDATE
DEPRECATE
NEW
```

Deprecated components should:

- remain temporarily compatible;
- stop receiving new feature work;
- be migrated progressively;
- not be removed before consumers are identified.

---

# 33. Migration strategy

No big-bang refactor.

Recommended sequence:

```text
DS-01 Foundations + semantic states
â†“
DS-02 Primitive consolidation
â†“
DS-03 AI / Human / Review patterns
â†“
DS-04 Page-level patterns
â†“
DS-05 Portfolio Entry + Handoff pilot
â†“
DS-06 Portfolio Home
â†“
DS-07 Invitation + Email
â†“
DS-08 Initiative Overview + Steps
â†“
DS-09 Decision Brief + Return to Portfolio
```

---

# 34. Pilot surfaces

Before broad migration, validate Design System on:

1. Portfolio Entry
2. Portfolio Home
3. Initiative Overview
4. Handoff pre-registro
5. Decision Brief

These test:
- editorial;
- operational;
- dense;
- conversational;
- AI;
- human decision.

---

# 35. No-regression principles

The Design System must not:

- change product semantics;
- change role authority;
- change Step logic;
- change gating;
- create canonical objects;
- alter AI authority;
- hide critical workflow state;
- turn AI suggestions into confirmed state.

---

# 36. Validation checklist

Before a component/pattern is considered DS-compliant:

```text
[ ] Uses approved tokens
[ ] No arbitrary brand color
[ ] Uses typography scale
[ ] Uses spacing scale
[ ] Supports accessibility
[ ] Supports responsive behavior
[ ] Correct AI/human distinction
[ ] Correct semantic state
[ ] No business logic hidden inside visual primitive
[ ] Supports MVP experimentation
```

---

# 37. Definition of Done â€” Design System v0.1

The contract is ready for implementation when:

- visual direction is approved;
- semantic state taxonomy is approved;
- token architecture is approved;
- typography baseline is approved;
- page anatomies are covered;
- Copilot patterns are covered;
- email/invitation patterns are covered;
- experimentation rules are explicit;
- migration is incremental;
- no Core conflict exists.

---

# 38. First implementation slice

The first Codex implementation slice should be:

## DS-01 â€” Foundations + Semantic State

Scope only:

- token structure;
- semantic colors;
- typography scale;
- spacing scale;
- radius;
- border/elevation baseline;
- focus treatment;
- `DomainStatusBadge`;
- internal visual playground or equivalent if feasible.

Do NOT yet:

- migrate all screens;
- redesign Portfolio;
- redesign Steps;
- change routes;
- change product copy globally;
- change Core/AI logic.
