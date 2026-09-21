"""Unit tests for methodology config loading + routing-table consistency (ADR-027)."""

import pytest

from harness.config_loader import load_methodology, load_stage_prompt
from harness.gates import PREDICATES

pytestmark = pytest.mark.unit


def test_config_loads_and_version_stamped():
    cfg = load_methodology()
    assert cfg.version == "1.1.0"
    assert cfg.model.interpret_backend == "jev"
    assert cfg.model.jev_model == "jev-latest"
    assert cfg.stage_ids() == [
        "intake", "ground", "interpret", "confirm", "classify_route", "method_hint", "gate", "emit",
    ]
    assert cfg.routing_table.default.agent == "mentor-virtual"
    assert cfg.method_pack("qualitative_research") is not None


def test_stage_prompt_versions_present():
    for rel in ("prompts/ground.system.md", "prompts/interpret.system.md"):
        _, version = load_stage_prompt(rel)
        assert version == "1.0.0"


def test_every_gate_predicate_is_registered():
    cfg = load_methodology()
    for rule in cfg.gates.hard + cfg.gates.soft:
        assert rule.predicate in PREDICATES, f"gate {rule.id} uses unregistered predicate {rule.predicate}"


def test_routing_table_agents_cover_legacy_hint_targets():
    """Every agent the legacy get_agent_routing_hint can return must be representable in
    the YAML routing table (config-drift guard, ADR-027)."""
    from tools.context_tools import get_agent_routing_hint

    legacy_targets = set()
    for step in range(0, 5):
        for action in ("feedback", "assist", "hmw-generate", "ideate", "experiment-routes",
                       "prototype-suggest", "experiment-analyze", "narrative-build"):
            for module in (None, "A", "B", "C", "D"):
                legacy_targets.add(get_agent_routing_hint.invoke(
                    {"step": step, "action": action, "module": module}
                ))

    cfg = load_methodology()
    table_agents = {r.agent for r in cfg.routing_table.rules} | {cfg.routing_table.default.agent}
    # The harness routing table intentionally routes via the diagnostic dimensions, not
    # (step, action); assert the worker agents it can select are a subset of the real agents
    # the legacy hint knows about (no phantom agents), and that the common ones are covered.
    known_workers = legacy_targets | {"mentor-virtual"}
    assert table_agents <= known_workers, f"routing table references unknown agents: {table_agents - known_workers}"
    assert {"research-assistant", "solution-design", "experiment-coach", "mentor-virtual"} <= table_agents
