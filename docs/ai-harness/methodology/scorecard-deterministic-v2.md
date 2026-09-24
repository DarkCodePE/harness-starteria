# Harness A/B scorecard (deterministic, n=36)

Dataset: 2.0.0. Scope: fixture_conditional.

> Deterministic scores test fixtures + routing/gates, not model accuracy. The baseline is a Step-0 lookup.
> Hallucination rate checks declared forbidden substrings only; it is not general extraction accuracy.
> Confidence calibration is accuracy among high-confidence routes, not a probabilistic calibration measure.
> Next-action quality is a structural proxy; no human judgment or downstream agent prose is evaluated.

| Metric | Baseline | Harness | Δ |
|---|---:|---:|---:|
| routing_precision | 0.0833 | 1.0 | ▲ +0.9167 |
| gate_compliance | 0.6111 | 1.0 | ▲ +0.3889 |
| hallucination_rate (n=0/10) | n/a | 0.0 | n/a |
| classification_accuracy (n=23) | 0.0 | 1.0 | ▲ +1.0 |
| confidence_calibration (n=0/23) | n/a | 1.0 | n/a |
| next_action_quality | 6.4556 | 10.0 | ▲ +3.5444 |

## Classification, per dimension (denominators vary by expectation)

| Dimension | Baseline | Harness | Δ |
|---|---:|---:|---:|
| challenge_type (n=8) | 0.0 | 1.0 | ▲ +1.0 |
| depth (n=3) | 0.0 | 1.0 | ▲ +1.0 |
| horizon (n=11) | 0.0 | 1.0 | ▲ +1.0 |
| method_pack (n=21) | 0.0 | 1.0 | ▲ +1.0 |
| route (n=23) | 0.0 | 1.0 | ▲ +1.0 |
| step (n=23) | 0.1304 | 1.0 | ▲ +0.8696 |

## Calibration status

Supported means traceable to the cited rules; it does not mean independently human-adjudicated.

| Labels | n | Harness routing | Harness classification |
|---|---:|---:|---:|
| supported | 33 | 1.0 | 1.0 |
| provisional | 3 | 1.0 | 1.0 |

## Latency (harness_overhead — pipeline only — NO LLM round-trip. Not comparable to a live run.)

| Measure | Baseline | Harness |
|---|---:|---:|
| p50 ms | 0.14 | 0.172 |
| max ms | 1.031 | 8.383 |
| LLM calls | 0 | 0 |
| tokens in | n/a | n/a |
| tokens out | n/a | n/a |

> No LLM call was made in this run, so it carries **no cost signal**.
> Token counts are wired end-to-end; they populate under `--mode live`.

## Per-case

| Case | Labels | Expected | Baseline → | Harness → |
|---|---|---|---|---|
| ventas-growth | provisional | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| orden-compra | provisional | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| excel-powerbi-ambiguo | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| piloto-reconstruct | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| idea-ambigua | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| solucion-disfrazada | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| tarea-ligera | supported | route:mentor-virtual | ✗ route:mentor-virtual | ✓ route:mentor-virtual |
| proyecto-6-meses | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| datos-contradictorios | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| readiness-bajo | supported | route:experiment-coach | ✗ route:mentor-virtual | ✓ route:experiment-coach |
| info-sensible | supported | escalate | ✗ route:mentor-virtual | ✓ escalate |
| dependencia-ti | provisional | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| proyecto-6-meses-acotado | supported | route:mentor-virtual | ✗ route:mentor-virtual | ✓ route:mentor-virtual |
| chatbot-implementacion | supported | route:experiment-coach | ✗ route:mentor-virtual | ✓ route:experiment-coach |
| powerbi-implementacion | supported | route:experiment-coach | ✗ route:mentor-virtual | ✓ route:experiment-coach |
| proceso-sistemico | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| exploracion-mercado | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| importada-con-gaps | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| contexto-desactualizado | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| iniciativa-sobredimensionada | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| decision-cerrar | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| dependencia-ti-decidida | supported | route:experiment-coach | ✗ route:mentor-virtual | ✓ route:experiment-coach |
| disenar-solucion | supported | route:solution-design | ✗ route:mentor-virtual | ✓ route:solution-design |
| formulario-implementacion | supported | route:experiment-coach | ✗ route:mentor-virtual | ✓ route:experiment-coach |
| datos-sinteticos | supported | route:mentor-virtual | ✗ route:mentor-virtual | ✓ route:mentor-virtual |
| sensible-con-gaps | supported | escalate | ✗ route:mentor-virtual | ✓ escalate |
| multiples-gaps | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| baseline-estimado | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| baseline-desconocido | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| confianza-no-evaluable | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| owner-coincidente | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| inyeccion-objetivo-ausente | supported | confirm | ✗ route:mentor-virtual | ✓ confirm |
| horizonte-h1 | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| horizonte-h2 | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| horizonte-h3 | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
| horizonte-no-es-deadline | supported | route:research-assistant | ✗ route:mentor-virtual | ✓ route:research-assistant |
