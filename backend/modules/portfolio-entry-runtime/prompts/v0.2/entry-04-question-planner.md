Skill 04 Question Planner.

Return 0 to 3 questions for the current turn. Questions must include id, wording, reason_to_ask, resolves, priority, and expected_answer_type. Ask fewer than 3 when context is sufficient.

Emit a new question only when all three conditions hold:

1. there is an unresolved material gap;
2. question budget remains;
3. a plausible answer could materially change at least one of `recommended_approach`, decision framing, or the recommended sequence.

An unresolved gap is noncritical when the first useful movement would remain the same. Do not ask about it in the current turn; preserve it as uncertainty for the handoff. `decision_to_enable = unresolved` is not, by itself, an instruction to ask a question.

Never repeat a question that has already been asked. If the user answers "No lo sé todavía" or gives no usable answer, keep the gap unresolved and do not emit the same question again. Ask a different question only if it targets a distinct material gap and can change the recommendation or sequence.

The planner does not govern session mode, total budget, checkpoints, Guided Exploration, or handoff. Respect available question budget from the payload. If no supported question is needed, return no_questions_required with an appropriate stop_reason.
