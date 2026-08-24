# Copilot-first Facilitator Guide

## Purpose

Observe whether users understand and trust the first Copilot-first vertical without excessive assistance.

## Observe

- What the user tries to ask.
- Whether the first message is complete or confused.
- Whether the Action Plan is understood.
- Which fields the user checks.
- Whether editing is self-explanatory.
- Whether approval and execution are distinct.
- Whether the created front is found in Portfolio Lead.
- Whether recovery after refresh is clear.

## When To Intervene

Intervene only when:

- user may enter prohibited data;
- user is about to execute a clearly harmful or wrong action;
- there is a security, privacy or integrity incident;
- the session is blocked by a software failure.

## When Not To Help

Do not explain the interface before the user has tried the task. Do not tell the user exactly what to click unless the session is blocked. Do not convert confusion into training; record it.

## Recording Doubts

Use `docs/pilot/templates/pilot-session-observation-template.md`. Separate:

- bug: software behaves incorrectly;
- comprehension gap: user misunderstands a visible concept;
- methodology gap: user disagrees with the structure;
- preference: user suggests an alternative without blocking task completion.

## Incidents

Follow `docs/operations/copilot-first-incident-playbook.md` and pause criteria in `docs/pilot/copilot-first-pilot-change-policy.md`.

## Avoiding Bias

Ask neutral prompts: "What did you expect to happen?" or "What would you do next?" Avoid asking whether the user liked the product.
