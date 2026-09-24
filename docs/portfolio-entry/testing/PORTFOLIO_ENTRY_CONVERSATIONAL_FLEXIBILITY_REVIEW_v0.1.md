# Starteria — Conversational Flexibility & Clarity-to-Action Review v0.1

Status: `ITERATE`

Scope: harness-only review of visible Portfolio Entry conversation. Product
runtime, active prompts and contracts: `NOT MODIFIED`.

## 1. Executive summary

The 12-case review shows a simple visible surface over the internal Decision
Readiness trace. Internal labels do not appear in user-facing wording, every
question is singular, and each case ends with an actionable next step or a
justified stop.

The provisional review averages are above the promotion thresholds. This is
not yet sufficient for LIVE validation because the visible turns are a
harness-authored deterministic simulation and have not received independent
human review or LLM stability testing.

## 2. Cases tested

| Case | Situation | Questions | Stop/action outcome |
|---|---|---:|---|
| CF-01 | simple one-question capacity | 1 | continue with capacity confirmed |
| CF-02 | ambiguous strategic priority | 1 | organizational priority |
| CF-03 | capacity blocker | 1 | confirm operational coverage |
| CF-04 | adoption issue | 1 | route adoption evidence later |
| CF-05 | governance | 1 | formal authority input |
| CF-06 | value uncertainty | 1 | business-value confirmation |
| CF-07 | explicit “I don’t know” | 1 | route to committee |
| CF-08 | later-stage technical detail | 1 | defer to initiative stage |
| CF-09 | extensive context | 1 | narrow to authorized scope |
| CF-10 | minimal context | 1 | clarify current decision |
| CF-11 | immediate stop | 0 | present initiative; do not design experiment |
| CF-12 | organizational input required | 1 | obtain management confirmation |

Total visible questions: **11 across 12 cases**.

## 3. Conversational dimensions

Scale: 1–5. Scores are structured harness review scores; independent human
review remains pending.

| Dimension | Average |
|---|---:|
| NATURALNESS | **4.83** |
| USER_JOB_ALIGNMENT | **5.00** |
| QUESTION_USEFULNESS | **4.92** |
| COGNITIVE_INVISIBILITY | **5.00** |
| FLEXIBILITY | **4.83** |
| ACTION_CLARITY | **4.92** |

## 4. Failure codes

| Failure code | Count | Result |
|---|---:|---|
| F-OVERSTRUCTURED | 0 | no visible form-like sequence observed |
| F-FRAMEWORK-VISIBLE | 0 | internal labels absent |
| F-MULTIQUESTION-OVERLOAD | 0 | maximum one question per visible turn |
| F-USER-JOB-DRIFT | 0 | user goal retained |
| F-QUESTION-WITHOUT-DECISION-VALUE | 0 | every question narrows decision/route/action |
| F-EXCESSIVE-ABSTRACTION | 0 | wording stays concrete |
| F-GENERIC-CONSULTING-TONE | 0 | no generic framework lecture |
| F-ACTION-NOT-CLEARER | 0 | next action is stated after each response |

## 5. Required conversational checks

- Internal terms such as dependency, sensitivity, branch type, routing and
  counterfactual do not appear in visible turns.
- The preferred pattern is present: short synthesis → one question → clear
  next action.
- CF-11 stops immediately when the remaining work belongs to the next stage.
- CF-07 and CF-12 route authority questions without asking the user to invent
  an organizational answer.
- CF-08 does not pull provider, architecture or workflow design into Entry.

## 6. Human review questions

All 12 cases were reviewed against:

- experienced-advisor feel;
- form-like or repetitive feel;
- usefulness of the question;
- convergence toward an action;
- clarity of the final route.

The review is provisional and harness-authored, not an independent reviewer
study. CF-04 is the closest borderline case because adoption can invite broad
exploration; the visible question keeps it bounded by asking whether the user
wants to locate the break before routing the detailed work. CF-09 is the
closest naturalness borderline because compressing extensive context requires
an explicit scope choice.

## 7. Strong examples

### Strongest good example — CF-05

> “Lo que falta no es más detalle del piloto, sino saber quién puede confirmar
> el paso. ¿Está esa persona formalmente identificada?”

It reflects the user’s governance problem, asks one bounded question and makes
the subsequent organizational route clear.

### Strongest borderline example — CF-09

> “Hay mucha información útil; el punto que cambia la decisión parece ser el
> alcance de este trimestre. ¿Cuál de los tres alcances está realmente sobre
> la mesa?”

It is effective but slightly more compressed/consultative than CF-01 or CF-05;
this is why its NATURALNESS score is 4 rather than 5.

## 8. Promotion gate

```text
average naturalness: 4.83      PASS (>= 4)
repeated overstructured language: none observed
unnecessary-question rate: 0/12 PASS (<= 20%)
material user-job drift: none observed
action clarity across turns: improves/ends actionable in 12/12
```

The conversational gate itself passes. Overall LIVE readiness remains:

```text
READY_FOR_LIVE_VALIDATION: NO
```

Reason: this is a deterministic, harness-authored visible simulation; it does
not yet establish independent human agreement or LLM conversational stability.

## 9. Hypothesis status

HYP-005 remains **`ITERATE`**. The review supports the claim that internal
Decision Readiness structure can remain cognitively invisible and action-led in
these cases, but does not promote the model or authorize production use.

## 10. Recommended next step

Run an isolated LIVE LLM candidate review with the same 12 cases, independent
human ratings, repeated runs and explicit checks for framework leakage,
multi-question overload, user-job drift and action clarity. Keep the current
deterministic candidate and evaluator frozen during that run.
