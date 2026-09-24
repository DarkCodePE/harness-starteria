# CAP-V02-BLOCKING — Precondition Review v0.1

Status: `TESTING`  
Scope: fixture and evaluator review only  
Product runtime modified: `NO`  
Adapter modified: `NO`

## Classification

`FIXTURE_INSUFFICIENT`

The fixture supports asking about capacity, but its frozen text and
counterfactual do not distinguish decisively between:

- a capacity answer that blocks or reroutes the current decision; and
- a capacity answer that conditions scope or timing while preserving the
  primary Portfolio route.

The historical fixture is preserved unchanged. A clarified
`CAP-V02-BLOCKING-v0.2.1` fixture is added separately.

## 1. Frozen fixture reconstruction

Frozen turns:

1. `La decisión actual es si podemos continuar con el lanzamiento controlado; la capacidad operativa es la condición pendiente.`
2. `Puedo confirmar si existe capacidad comprometida para sostenerlo ahora.`

### Current decision to enable

The current decision is whether the organization can continue with a
controlled launch.

The phrase “continuar con el lanzamiento controlado” establishes a current
Portfolio decision, but it does not say whether the decision is:

- unconditional enablement;
- conditional enablement;
- a decision to route to another window; or
- a decision to stop until an accountable operating arrangement exists.

### Capacity uncertainty

The unresolved fact is whether committed operating capacity exists now. The
fixture does not define a minimum operating responsibility, who must provide
it, or what formal consequence follows if it does not exist.

### Plausible answer A

The metadata states: capacity is committed.

Stated consequence: the decision can continue under current conditions.

This supports `ASK` and is compatible with either `CONSTRAINING` or
`BLOCKING`, depending on the consequence of answer B.

### Plausible answer B

The metadata states: capacity is not committed.

Stated consequence: the decision should be paused, conditioned, or routed to
another window.

This is the decisive ambiguity. “Paused”, “conditioned”, and “routed” are not
equivalent outcomes:

- pause or route would support `BLOCKING` and potentially `HIGH` sensitivity;
- conditional continuation would more naturally support `CONSTRAINING` and
  `MEDIUM` sensitivity.

The fixture presents all three outcomes and therefore does not establish one
material decision branch.

### Routing implications

The frozen text permits a capacity-related question. It does not establish
whether the answer must:

- remain in Portfolio Entry as a blocking enablement condition;
- route to an organizational authority for operating commitment;
- route to a later initiative planning stage; or
- move the decision to another launch window.

No stronger routing fact may be inferred from the wording alone.

## 2. Strict-definition test

| Definition | Supported? | Reason |
|---|---|---|
| `BLOCKING` | Not established | The negative branch includes pause/route, but also permits conditioning without proving that the current decision cannot continue. |
| `CONSTRAINING` | Plausible | The capacity answer could alter launch conditions or timing while preserving the primary route. |
| `HIGH` sensitivity | Not established | The counterfactual is materially different only if “pause/route” is selected as the required consequence. |
| `MEDIUM` sensitivity | Plausible | Different answers could change conditions or timing without changing the primary route. |

The fixture therefore does not support `FIXTURE_CORRECT_ADAPTER_WRONG`.
The observed `ASK` remains appropriate, but the internal labels
`CONSTRAINING`/`MEDIUM` cannot be declared definitively correct either. The
proper classification is `FIXTURE_INSUFFICIENT`, not a deterministic adapter
failure.

## 3. Required clarified fixture

Created:

`PORTFOLIO_ENTRY_CAPACITY_BLOCKING_v0.2.1.json`

The clarified variant makes the negative branch explicit:

- answer A: confirmed minimum operating capacity exists;
- consequence A: controlled implementation can proceed;
- answer B: no person or area can assume minimum operating responsibility;
- consequence B: formal implementation cannot proceed and the case routes to
  organizational input or another decision window;
- `materially_different`: `YES`.

No numerical hour threshold is introduced.

## 4. Evaluation-model strictness finding

Classification: `ACTION_PLUS_INVARIANTS_BETTER`

The externally meaningful action is `ASK`, and that action is correct in both
the `CONSTRAINING` and `BLOCKING` interpretations. Requiring exact internal
labels would turn an under-specified fixture into an apparent adapter failure
and would overfit the evaluator to one interpretation of the text.

Strict fixtures should require exact internal labels only when the fixture
explicitly establishes the relevant counterfactual and authority/stage
boundary. Otherwise:

- require the externally meaningful action;
- evaluate declared invariants;
- record internal label divergence as a diagnostic;
- classify the fixture as insufficient when the divergence cannot be decided
  from the text.

This does not weaken genuinely strict fixtures. A clarified blocker with an
explicit route-changing negative branch may still require `BLOCKING` + `HIGH`
as a strict metadata assertion.

## 5. Final findings

| Question | Finding |
|---|---|
| Fixture supports `BLOCKING`? | `NO` — not conclusively; insufficient counterfactual. |
| Fixture supports `HIGH` sensitivity? | `NO` — not conclusively; negative branch mixes pause, condition, and route. |
| `ASK` remains correct? | `YES`. |
| Adapter change required? | `NO`. |
| Clarified fixture required? | `YES`. |
| Evaluator strictness | `ACTION_PLUS_INVARIANTS_BETTER`. |

Hypothesis status remains `ITERATE`.

Recommended next step: execute the clarified v0.2.1 fixture. Only if its
explicit route-changing counterfactual still produces a non-blocking,
medium-sensitivity trace should a general adapter issue be considered.
