"""A/B eval runner: baseline (mechanical routing) vs harness (ADR-027).

Runs every golden case through both arms and emits a scorecard comparing them on the
methodology's metrics. Two modes:
  - deterministic (default): the harness arm replays each case's ground/interpret fixtures;
    fully hermetic, no network — safe for CI.
  - live: the harness arm calls OpenRouter for real (gated by HARNESS_EVAL_LIVE=1 + a real
    OPENROUTER_API_KEY); measures the true model+harness effectiveness.

The baseline arm is identical in both modes: it is the pre-ADR-027 behavior — a naive caller
sends the request to Step 0 and `get_agent_routing_hint` maps it mechanically, never
confirming, never escalating.

CLI:  python -m harness.eval.runner --mode deterministic --out harness/eval/out/scorecard.json
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import time
from typing import Any
from pathlib import Path

from harness.contracts import (
    DiagnosisState,
    EpistemicStatus,
    GroundedField,
    GroundedFieldList,
    RouteProfile,
)
from harness.eval.dataset import DATASET_VERSION, GOLDEN, TAXONOMY, GoldenCase
from harness.eval.graders import grade_next_action
from harness.eval.metrics import (
    ArmResult, classification_by_field, gate_compliant, routing_correct, scorecard,
)
from harness.harness import get_harness
from tools.context_tools import get_agent_routing_hint

logger = logging.getLogger(__name__)

_FACT_STATUSES = {EpistemicStatus.DECLARED, EpistemicStatus.EXTRACTED, EpistemicStatus.CONFIRMED}


def _forbidden_hits(case: GoldenCase, grounded: list[GroundedField]) -> int:
    hits = 0
    for f in grounded:
        if f.status in _FACT_STATUSES and f.value is not None:
            text = str(f.value).lower()
            hits += sum(1 for bad in case.forbidden_facts if bad.lower() in text)
    return hits


def _mocks_for(case: GoldenCase):
    return {
        "ground": lambda: GroundedFieldList(fields=[GroundedField(**f) for f in case.ground]),
        "interpret": lambda: RouteProfile(**case.interpret),
    }


def _run(case: GoldenCase, mocks) -> tuple[Any, float]:
    """Run the pipeline with the given stage mocks. Returns (decision, elapsed_ms)."""
    _t0 = time.perf_counter()
    decision = get_harness().diagnose(
        {"payload": {"originalInput": case.raw_input, "projectId": "eval"}},
        raw_input=case.raw_input,
        project_id="eval",
        mocks=mocks,
    )
    return decision, (time.perf_counter() - _t0) * 1000.0


def _arm_from(case: GoldenCase, decision: Any, elapsed_ms: float) -> ArmResult:
    rp = decision.route_profile
    arm = ArmResult(
        case_id=case.id,
        kind=decision.kind,
        agent=decision.target_agent,
        route=rp.route if rp else None,
        challenge_type=rp.challenge_type if rp else None,
        depth=rp.depth if rp else None,
        horizon=rp.horizon if rp else None,
        step=rp.step if rp else None,
        confidence=rp.confidence if rp else None,
        unit_confidence=rp.unit_confidence if rp else None,
        confidence_scores=dict(rp.confidence_scores) if rp else {},
        method_pack=decision.method_pack_id,
        hard_gates=decision.gate.failed_hard_gates,
        soft_gates=decision.gate.failed_soft_gates,
        prohibited_terms=decision.gate.prohibited_terms_found,
        questions_count=len(decision.confirmation.strategic_questions) if decision.confirmation else 0,
        grounded_forbidden_hits=_forbidden_hits(case, decision.trace.grounded),
        grounding_observed=True,
    )
    # Reuse the harness's own per-stage instrumentation instead of timing from outside.
    # StageTrace.duration_ms is an int, so mocked stages (sub-millisecond) all truncate to
    # 0 and the per-stage sum is unusable as an overhead figure. The call is timed here
    # instead; llm_calls still comes from the trace, which knows what actually ran.
    arm.latency_ms = elapsed_ms
    arm.llm_calls = sum(1 for s in decision.trace.stages if s.llm_used)
    _tin = [s.tokens_in for s in decision.trace.stages if s.tokens_in is not None]
    _tout = [s.tokens_out for s in decision.trace.stages if s.tokens_out is not None]
    arm.tokens_in = sum(_tin) if _tin else None
    arm.tokens_out = sum(_tout) if _tout else None
    arm.latency_scope = "end_to_end" if arm.llm_calls else "harness_overhead"
    arm.next_action_score = grade_next_action(case, arm).score
    return arm


def harness_arm(case: GoldenCase, *, live: bool) -> ArmResult:
    """Full pipeline. Deterministic replays both LLM stages from the case fixtures."""
    decision, elapsed = _run(case, None if live else _mocks_for(case))
    return _arm_from(case, decision, elapsed)


def _interpret_state(case: GoldenCase) -> str:
    """The exact human message the INTERPRET stage would hand an LLM.

    Both the LLM arm and the Jev arm classify from THIS string, so the comparison isolates
    the classifier and nothing else.
    """
    harness = get_harness()
    state = DiagnosisState(
        raw_input=case.raw_input,
        project_id="eval",
        fields=[GroundedField(**f) for f in case.ground],
    )
    _system, human, _version = harness._prompt_builder.build("interpret", state)  # noqa: SLF001
    return human


def llm_interpret_arm(case: GoldenCase) -> ArmResult:
    """GROUND from the fixture, INTERPRET from a live LLM.

    Not the same as `harness_arm(live=True)`: that one also runs GROUND live, so a delta
    against the Jev arm would mix extraction quality into a classification comparison.
    """
    ground_only = {"ground": _mocks_for(case)["ground"]}
    decision, elapsed = _run(case, ground_only)
    return _arm_from(case, decision, elapsed)


def jev_arm(case: GoldenCase, *, client: Any = None) -> ArmResult:
    """GROUND from the fixture, INTERPRET from Jev. The counterpart of llm_interpret_arm."""
    from harness import jev as jev_backend

    _t0 = time.perf_counter()
    profile, usage, contested = jev_backend.interpret(_interpret_state(case), client=client)
    jev_ms = (time.perf_counter() - _t0) * 1000.0

    mocks = {"ground": _mocks_for(case)["ground"], "interpret": lambda: profile}
    decision, pipeline_ms = _run(case, mocks)
    arm = _arm_from(case, decision, jev_ms + pipeline_ms)

    # The trace sees a mocked INTERPRET, so it reports no call and no tokens. The System One
    # call is real and was billed: override with what actually happened.
    arm.llm_calls = 1
    arm.tokens_in = usage.input_tokens
    arm.tokens_out = usage.output_tokens
    arm.latency_scope = "end_to_end"
    if contested:
        logger.info("jev_arm case=%s contested=%s", case.id, ",".join(contested))
    return arm


def baseline_arm(case: GoldenCase) -> ArmResult:
    """Pre-ADR-027 behavior: mechanical routing, no diagnosis, no confirm/escalate."""
    _t0 = time.perf_counter()
    agent = get_agent_routing_hint.invoke(
        {"step": case.baseline_step, "action": case.baseline_action, "module": case.baseline_module}
    )
    elapsed_ms = (time.perf_counter() - _t0) * 1000.0
    arm = ArmResult(case_id=case.id, kind="route", agent=agent, step=case.baseline_step)
    # Measured, not assumed: the baseline is a lookup, but a hardcoded 0 would be a made-up
    # number sitting in a column meant for real ones.
    arm.latency_ms = elapsed_ms
    arm.llm_calls = 0
    arm.latency_scope = "harness_overhead"
    arm.next_action_score = grade_next_action(case, arm).score
    return arm


def run_eval(mode: str = "deterministic", sample: int | None = None) -> dict:
    if mode not in {"deterministic", "live", "jev"}:
        raise ValueError(f"Unknown eval mode: {mode!r}")
    if sample is not None and sample < 1:
        raise ValueError("sample must be positive")
    cases = GOLDEN[:sample] if sample else GOLDEN

    # "jev" pits two live classifiers against the same fixture-grounded state. Both arms
    # call out, so it needs the live guard AND a Jev key.
    if mode == "jev":
        if os.getenv("HARNESS_EVAL_LIVE") != "1" or not os.getenv("OPENROUTER_API_KEY"):
            raise RuntimeError(
                "The Jev A/B runs the LLM arm live: set HARNESS_EVAL_LIVE=1 and "
                "OPENROUTER_API_KEY. (This run would spend tokens.)"
            )
        if not (os.getenv("JEV_API_KEY") or os.getenv("TYPESAFE_API_KEY")):
            raise RuntimeError("The Jev A/B needs JEV_API_KEY (or TYPESAFE_API_KEY).")
        return _compare(cases, mode,
                        ("LLM interpret", llm_interpret_arm),
                        ("Jev interpret", jev_arm))

    live = mode == "live"
    if live:
        if os.getenv("HARNESS_EVAL_LIVE") != "1" or not os.getenv("OPENROUTER_API_KEY"):
            raise RuntimeError(
                "Live eval requires HARNESS_EVAL_LIVE=1 and a real OPENROUTER_API_KEY. "
                "(This run would spend tokens.)"
            )
    return _compare(cases, mode,
                    ("Baseline", baseline_arm),
                    ("Harness", lambda c: harness_arm(c, live=live)))


def _compare(cases, mode: str, left, right) -> dict:
    """Score two arms over the same cases. `left`/`right` are (label, arm_fn) pairs."""
    left_label, left_fn = left
    right_label, right_fn = right
    base_arms = {c.id: left_fn(c) for c in cases}
    harn_arms = {c.id: right_fn(c) for c in cases}

    base_score = scorecard(cases, base_arms)
    harn_score = scorecard(cases, harn_arms)
    # Subtract only what is numeric on BOTH sides: a delta needs both arms measurable, and
    # counts, labels and nested breakdowns are reported as-is. Allow-listing by type beats
    # enumerating exceptions, which is how two metrics already slipped through.
    _no_delta = {"n_cases", "classification_n", "confidence_calibration_n", "llm_calls_total",
                 "hallucination_n"}
    deltas: dict[str, float | None] = {}
    for k, bv in base_score.items():
        if k in _no_delta:
            continue
        hv = harn_score.get(k)
        present = [v for v in (bv, hv) if v is not None]
        if any(isinstance(v, bool) or not isinstance(v, (int, float)) for v in present):
            continue
        deltas[k] = None if bv is None or hv is None else round(hv - bv, 4)

    per_case = []
    for c in cases:
        b, h = base_arms[c.id], harn_arms[c.id]
        per_case.append({
            "id": c.id,
            "title": c.title,
            "expected_kind": c.expected_kind,
            "expected_agent": c.expected_agent,
            "calibration_status": c.calibration_status,
            "source_refs": c.source_refs,
            "taxonomy": c.taxonomy,
            "contrast_with": c.contrast_with,
            "classification_expected": {
                name: getattr(c, f"expected_{name}")
                for name in ("route", "challenge_type", "depth", "horizon", "step", "method_pack")
                if getattr(c, f"expected_{name}") is not None
            },
            "baseline": {"kind": b.kind, "agent": b.agent,
                         "routing_correct": routing_correct(c, b), "gate_compliant": gate_compliant(c, b),
                         "classification": classification_by_field(c, b)},
            "harness": {"kind": h.kind, "agent": h.agent, "route": h.route,
                        "confidence": h.confidence, "unit_confidence": h.unit_confidence,
                        "confidence_scores": h.confidence_scores,
                        "method_pack": h.method_pack, "hard_gates": h.hard_gates,
                        "soft_gates": h.soft_gates,
                        "routing_correct": routing_correct(c, h), "gate_compliant": gate_compliant(c, h),
                        "classification": classification_by_field(c, h)},
        })

    by_status = {}
    for status in ("supported", "provisional"):
        subset = [c for c in cases if c.calibration_status == status]
        by_status[status] = {"baseline": scorecard(subset, base_arms),
                             "harness": scorecard(subset, harn_arms)}
    return {"mode": mode, "dataset_version": DATASET_VERSION,
            "taxonomy_coverage": {tag: [c.id for c in cases if tag in c.taxonomy] for tag in TAXONOMY},
            "by_calibration_status": by_status,
            "measurement_scope": "fixture_conditional" if mode == "deterministic" else
                ("fixture_ground_live_interpret" if mode == "jev" else "live_ground_and_interpret"),
            "n_cases": len(cases), "baseline": base_score,
            "harness": harn_score, "deltas": deltas, "per_case": per_case,
            "arm_labels": {"baseline": left_label, "harness": right_label}}


def to_markdown(report: dict) -> str:
    b, h, d = report["baseline"], report["harness"], report["deltas"]
    labels = report.get("arm_labels") or {"baseline": "Baseline", "harness": "Harness"}
    lb, lh = labels["baseline"], labels["harness"]
    lines = [
        f"# Harness A/B scorecard ({report['mode']}, n={report['n_cases']})",
        "",
        f"Dataset: {report.get('dataset_version', 'unknown')}. Scope: {report.get('measurement_scope', 'unknown')}.",
        "",
        "> Deterministic scores test fixtures + routing/gates, not model accuracy. The baseline is a Step-0 lookup.",
        "> Hallucination rate checks declared forbidden substrings only; it is not general extraction accuracy.",
        "> Confidence calibration is accuracy among high-confidence routes, not a probabilistic calibration measure.",
        "> Next-action quality is a structural proxy; no human judgment or downstream agent prose is evaluated.",
        "",
        f"| Metric | {lb} | {lh} | Δ |",
        "|---|---:|---:|---:|",
    ]
    # Which denominator each metric is computed over, when it is not all n cases.
    _denom = {"classification_accuracy": "classification_n",
              "confidence_calibration": "confidence_calibration_n",
              "hallucination_rate": "hallucination_n"}

    def _cell(v) -> str:
        return "n/a" if v is None else str(v)

    for k in ("routing_precision", "gate_compliance", "hallucination_rate",
              "classification_accuracy", "confidence_calibration", "next_action_quality"):
        label = k
        if k in _denom:
            nb, nh = b.get(_denom[k]), h.get(_denom[k])
            label = f"{k} (n={nb if nb == nh else f'{nb}/{nh}'})"
        dv = d.get(k)
        if dv is None:
            lines.append(f"| {label} | {_cell(b[k])} | {_cell(h[k])} | n/a |")
            continue
        arrow = "▲" if dv > 0 else ("▼" if dv < 0 else "＝")
        lines.append(f"| {label} | {_cell(b[k])} | {_cell(h[k])} | {arrow} {dv:+} |")
    bf_b, bf_h = b.get("classification_by_field", {}), h.get("classification_by_field", {})
    if bf_b or bf_h:
        lines += ["", "## Classification, per dimension (denominators vary by expectation)", "",
                  f"| Dimension | {lb} | {lh} | Δ |", "|---|---:|---:|---:|"]
        for k in sorted(set(bf_b) | set(bf_h)):
            field_label = f"{k} (n={h.get('classification_by_field_n', {}).get(k, 0)})"
            bv, hv = bf_b.get(k), bf_h.get(k)
            if bv is None or hv is None:  # dimension not scored by one of the arms
                lines.append(f"| {field_label} | {'—' if bv is None else bv} | {'—' if hv is None else hv} | — |")
                continue
            dv = round(hv - bv, 4)
            arrow = "▲" if dv > 0 else ("▼" if dv < 0 else "＝")
            lines.append(f"| {field_label} | {bv} | {hv} | {arrow} {dv:+} |")

    lines += ["", "## Calibration status", "",
              "Supported means traceable to the cited rules; it does not mean independently human-adjudicated.",
              "", "| Labels | n | Harness routing | Harness classification |", "|---|---:|---:|---:|"]
    for status, arms in report.get("by_calibration_status", {}).items():
        s = arms["harness"]
        lines.append(f"| {status} | {s['n_cases']} | {_cell(s['routing_precision'])} | {_cell(s['classification_accuracy'])} |")

    scope = h.get("latency_scope")
    if scope:
        _legend = {
            "harness_overhead": "pipeline only — NO LLM round-trip. Not comparable to a live run.",
            "end_to_end": "includes the LLM round-trip.",
            "mixed": "ARMS DISAGREE on scope — these numbers are not comparable.",
        }
        lines += ["", f"## Latency ({scope} — {_legend.get(scope, '')})", "",
                  f"| Measure | {lb} | {lh} |", "|---|---:|---:|",
                  f"| p50 ms | {_cell(b.get('latency_ms_p50'))} | {_cell(h.get('latency_ms_p50'))} |",
                  f"| max ms | {_cell(b.get('latency_ms_max'))} | {_cell(h.get('latency_ms_max'))} |",
                  f"| LLM calls | {b.get('llm_calls_total', 0)} | {h.get('llm_calls_total', 0)} |",
                  f"| tokens in | {_cell(b.get('tokens_in_total'))} | {_cell(h.get('tokens_in_total'))} |",
                  f"| tokens out | {_cell(b.get('tokens_out_total'))} | {_cell(h.get('tokens_out_total'))} |"]
        if not h.get("llm_calls_total"):
            lines += ["", "> No LLM call was made in this run, so it carries **no cost signal**.",
                      "> Token counts are wired end-to-end; they populate under `--mode live`."]
        elif h.get("tokens_in_total") is None:
            lines += ["", "> LLM calls were made but the provider reported no usage metadata,",
                      "> so token counts are unknown for this run — not zero."]

    lines += ["", "## Per-case", "", f"| Case | Labels | Expected | {lb} → | {lh} → |", "|---|---|---|---|---|"]
    for pc in report["per_case"]:
        exp = f"{pc['expected_kind']}" + (f":{pc['expected_agent']}" if pc["expected_agent"] else "")
        def passed(arm):
            return arm["routing_correct"] and arm["gate_compliant"] and all(arm["classification"].values())
        bmark = "✓" if passed(pc["baseline"]) else "✗"
        hmark = "✓" if passed(pc["harness"]) else "✗"
        b_out = f"{pc['baseline']['kind']}:{pc['baseline']['agent']}"
        h_out = f"{pc['harness']['kind']}" + (f":{pc['harness']['agent']}" if pc['harness']['agent'] else "")
        lines.append(f"| {pc['id']} | {pc['calibration_status']} | {exp} | {bmark} {b_out} | {hmark} {h_out} |")
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description="Harness A/B effectiveness eval (ADR-027).")
    ap.add_argument("--mode", choices=["deterministic", "live", "jev"], default="deterministic")
    ap.add_argument("--sample", type=int, default=None, help="Run only the first N cases.")
    ap.add_argument("--out", default="harness/eval/out/scorecard.json")
    args = ap.parse_args()

    report = run_eval(mode=args.mode, sample=args.sample)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    md = to_markdown(report)
    out.with_suffix(".md").write_text(md, encoding="utf-8")
    print(md)
    print(f"[scorecard] wrote {out} and {out.with_suffix('.md')}")


if __name__ == "__main__":
    main()
