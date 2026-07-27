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
import os
from pathlib import Path

from harness.contracts import EpistemicStatus, GroundedField, GroundedFieldList, RouteProfile
from harness.eval.dataset import GOLDEN, GoldenCase
from harness.eval.graders import grade_next_action
from harness.eval.metrics import ArmResult, gate_compliant, routing_correct, scorecard
from harness.harness import get_harness
from tools.context_tools import get_agent_routing_hint

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


def harness_arm(case: GoldenCase, *, live: bool) -> ArmResult:
    decision = get_harness().diagnose(
        {"payload": {"originalInput": case.raw_input, "projectId": "eval"}},
        raw_input=case.raw_input,
        project_id="eval",
        mocks=None if live else _mocks_for(case),
    )
    rp = decision.route_profile
    arm = ArmResult(
        case_id=case.id,
        kind=decision.kind,
        agent=decision.target_agent,
        route=rp.route if rp else None,
        challenge_type=rp.challenge_type if rp else None,
        depth=rp.depth if rp else None,
        step=rp.step if rp else None,
        confidence=rp.confidence if rp else None,
        prohibited_terms=decision.gate.prohibited_terms_found,
        questions_count=len(decision.confirmation.strategic_questions) if decision.confirmation else 0,
        grounded_forbidden_hits=_forbidden_hits(case, decision.trace.grounded),
    )
    arm.next_action_score = grade_next_action(case, arm).score
    return arm


def baseline_arm(case: GoldenCase) -> ArmResult:
    """Pre-ADR-027 behavior: mechanical routing, no diagnosis, no confirm/escalate."""
    agent = get_agent_routing_hint.invoke(
        {"step": case.baseline_step, "action": case.baseline_action, "module": case.baseline_module}
    )
    arm = ArmResult(case_id=case.id, kind="route", agent=agent)
    arm.next_action_score = grade_next_action(case, arm).score
    return arm


def run_eval(mode: str = "deterministic", sample: int | None = None) -> dict:
    live = mode == "live"
    if live:
        if os.getenv("HARNESS_EVAL_LIVE") != "1" or not os.getenv("OPENROUTER_API_KEY"):
            raise RuntimeError(
                "Live eval requires HARNESS_EVAL_LIVE=1 and a real OPENROUTER_API_KEY. "
                "(This run would spend tokens.)"
            )
    cases = GOLDEN[:sample] if sample else GOLDEN

    base_arms = {c.id: baseline_arm(c) for c in cases}
    harn_arms = {c.id: harness_arm(c, live=live) for c in cases}

    base_score = scorecard(cases, base_arms)
    harn_score = scorecard(cases, harn_arms)
    deltas = {k: round(harn_score[k] - base_score[k], 4) for k in base_score if k != "n_cases"}

    per_case = []
    for c in cases:
        b, h = base_arms[c.id], harn_arms[c.id]
        per_case.append({
            "id": c.id,
            "title": c.title,
            "expected_kind": c.expected_kind,
            "expected_agent": c.expected_agent,
            "baseline": {"kind": b.kind, "agent": b.agent,
                         "routing_correct": routing_correct(c, b), "gate_compliant": gate_compliant(c, b)},
            "harness": {"kind": h.kind, "agent": h.agent, "route": h.route,
                        "routing_correct": routing_correct(c, h), "gate_compliant": gate_compliant(c, h)},
        })

    return {"mode": mode, "n_cases": len(cases), "baseline": base_score,
            "harness": harn_score, "deltas": deltas, "per_case": per_case}


def to_markdown(report: dict) -> str:
    b, h, d = report["baseline"], report["harness"], report["deltas"]
    lines = [
        f"# Harness A/B scorecard ({report['mode']}, n={report['n_cases']})",
        "",
        "| Metric | Baseline | Harness | Δ |",
        "|---|---:|---:|---:|",
    ]
    for k in ("routing_precision", "gate_compliance", "hallucination_rate",
              "classification_accuracy", "confidence_calibration", "next_action_quality"):
        arrow = "▲" if d[k] > 0 else ("▼" if d[k] < 0 else "＝")
        lines.append(f"| {k} | {b[k]} | {h[k]} | {arrow} {d[k]:+} |")
    lines += ["", "## Per-case", "", "| Case | Expected | Baseline → | Harness → |", "|---|---|---|---|"]
    for pc in report["per_case"]:
        exp = f"{pc['expected_kind']}" + (f":{pc['expected_agent']}" if pc["expected_agent"] else "")
        bmark = "✓" if pc["baseline"]["routing_correct"] else "✗"
        hmark = "✓" if pc["harness"]["routing_correct"] else "✗"
        b_out = f"{pc['baseline']['kind']}:{pc['baseline']['agent']}"
        h_out = f"{pc['harness']['kind']}" + (f":{pc['harness']['agent']}" if pc['harness']['agent'] else "")
        lines.append(f"| {pc['id']} | {exp} | {bmark} {b_out} | {hmark} {h_out} |")
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description="Harness A/B effectiveness eval (ADR-027).")
    ap.add_argument("--mode", choices=["deterministic", "live"], default="deterministic")
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
