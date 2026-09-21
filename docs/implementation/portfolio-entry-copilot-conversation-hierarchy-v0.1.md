# Portfolio Entry Copilot Conversation Hierarchy v0.1

## 1. Previous visual hierarchy

The conversation panel gave similar visual weight to mode and progress badges, the panel title, structured understanding, the initial context card, conversation history, the active question, and the composer. The initial context was also repeated outside the history trace.

## 2. New visual hierarchy

The panel now follows this order:

1. subtle mode and progress metadata;
2. optional compact synthesis, labelled “Esto estoy entendiendo”;
3. one dominant active question, labelled “Para afinarlo un poco más”;
4. directly connected response input and primary send action;
5. quieter conversation history and secondary actions.

## 3. Synthesis source

The synthesis is rendered only when `session.semanticProjection.understanding.value` is available. The frontend removes the existing user-facing prefix when present and does not generate, infer, or request new semantic content. When the structured field is absent, the synthesis block is omitted.

## 4. Question hierarchy

The active question remains the only question presented for response. It uses a stronger left accent, surface contrast, spacing, and concise framing. No question-planner or active-question semantics changed.

## 5. Status and progress treatment

Quick Clarification and Guided Exploration remain distinguishable through their existing labels and progress text. They are now rendered as small muted metadata rather than prominent badges. Their counters and budgets are unchanged.

## 6. Input and action changes

The textarea remains associated with its visible label and appears only while an active question exists. “Enviar respuesta” remains the primary action. “No lo sé todavía” remains available as a lower-emphasis ghost action, preserving its existing behavior.

## 7. Conversation-history treatment

The complete conversation remains available through the native `details` disclosure labelled “Ver conversación”. The duplicated “Tu punto de partida” card was removed from the primary flow; the original content remains available in the trace as “Tu contexto inicial”. No messages or retention behavior changed.

## 8. Quick vs Guided treatment

Quick Clarification continues to show its clarification progress. Guided Exploration continues to show its stronger contextual label and “Profundizando” progress. No new state or navigation pattern was introduced.

## 9. Checkpoint impact

Checkpoint 1, Checkpoint 2, proposal actions, continuation actions, and transition to handoff were not changed. The presentation changes are limited to the active conversation panel.

## 10. Responsive behavior

The layout uses a single-column flow with `min-w-0`, responsive button stacking, and no horizontal question grid. This keeps the active question, textarea, and actions usable at narrow widths including 390px.

## 11. Accessibility behavior

The panel retains semantic heading structure, visible field association through `label`/`htmlFor`, native `details`/`summary` disclosure, button semantics, keyboard focus styles from the existing components, and status text that is not communicated by color alone.

## 12. Files changed

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
- `front/src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`
- `docs/implementation/portfolio-entry-copilot-conversation-hierarchy-v0.1.md`

## 13. Tests

- Frontend typecheck: PASS.
- Focused `PortfolioEntryExperience` frontend suite: PASS, 20 tests.
- Portfolio Entry E2E: PASS, 8 tests.
- `git diff --check`: PASS.

## 14. Known limitations

No automated pixel snapshot or dedicated viewport assertion was added in this slice. Narrow-screen behavior is implemented through the existing responsive utility classes and should receive visual review in the normal browser QA pass.
