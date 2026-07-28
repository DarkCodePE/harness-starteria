"""Effectiveness evaluation for the methodology harness (ADR-027).

A/B eval: the raw mechanical routing (baseline) vs the harness, over the methodology's
own golden cases (§21 taxonomy + §26 concretes). Deterministic mode is hermetic (stage
outputs come from fixtures embedded in the dataset); live mode calls OpenRouter.
"""
