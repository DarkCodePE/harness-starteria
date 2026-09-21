"""The price table and the agent→model registry must not drift from reality (E8).

AGENT_MODELS mirrors constants that live in each agent module, and MODEL_PRICING is a
hand-maintained table. Both are the kind of thing that rots quietly, so these tests read
the real constants and compare.
"""

import pytest

from services.model_router import (
    AGENT_MODELS,
    MODEL_PRICING,
    ModelPrice,
    ModelRouter,
)

pytestmark = pytest.mark.unit


def _declared(module_path: str, attr: str) -> str:
    import importlib

    value = getattr(importlib.import_module(module_path), attr)
    return value.split(":", 1)[1] if ":" in value else value


# agent_id -> (module, constant) holding the model that module actually uses.
_AGENT_SOURCES = {
    "orchestrator": ("agents.orchestrator", "MODEL"),
    "mentor-virtual": ("agents.mentor_virtual", "MODEL"),
    "solution-design": ("agents.solution_design", "MODEL"),
    "experiment-coach": ("agents.experiment_coach", "MODEL"),
    "feedback-ia": ("agents.feedback_ia", "MODEL"),
    "research-assistant": ("agents.research_assistant", "MODEL"),
    "narrative-builder": ("agents.narrative_builder", "MODEL"),
    "field-refiner": ("agents.field_refiner", "_DEFAULT_MODEL"),
    "initial-reviewer": ("agents.initial_reviewer", "_DEFAULT_MODEL"),
    "company-context": ("agents.company_context_llm", "_DEFAULT_MODEL"),
    "pdf-extractor": ("agents.pdf_extractor.extractor", "_DEFAULT_MODEL"),
}


@pytest.mark.parametrize("agent_id,source", sorted(_AGENT_SOURCES.items()))
def test_registry_matches_the_agent_module(agent_id, source):
    """If an agent switches model, this fails until AGENT_MODELS is updated."""
    module_path, attr = source
    assert AGENT_MODELS[agent_id] == _declared(module_path, attr), (
        f"AGENT_MODELS[{agent_id!r}] disagrees with {module_path}.{attr}"
    )


def test_harness_entry_matches_methodology_config():
    """The harness stage model lives in YAML, not in a Python constant."""
    from harness.config_loader import load_methodology

    configured = load_methodology().model.stage_model
    configured = configured.split(":", 1)[1] if ":" in configured else configured
    assert AGENT_MODELS["methodology-harness"] == configured


@pytest.mark.parametrize("model", sorted(AGENT_MODELS.values()))
def test_every_routed_model_is_in_the_price_table(model):
    assert model in MODEL_PRICING, f"{model} is routed to but has no pricing entry"


@pytest.mark.parametrize("model", sorted(MODEL_PRICING))
def test_every_price_entry_declares_its_provenance(model):
    """A rate with no source cannot be audited when a provider changes it."""
    assert MODEL_PRICING[model].source.strip(), f"{model} has no source note"


def test_unknown_price_returns_none_not_a_substitute_rate():
    """The bug this table replaces: pricing an unknown model at the default's rate."""
    router = ModelRouter()
    assert router.estimate_cost_usd("x", 1000, 1000, model="nobody/unknown-model") is None


def test_per_call_models_ignore_token_counts():
    """deepseek-v4-flash has a measured per-call figure, not a rate — say so in behavior."""
    router = ModelRouter()
    cheap = router.estimate_cost_usd("methodology-harness", 10, 10)
    heavy = router.estimate_cost_usd("methodology-harness", 100_000, 100_000)
    assert cheap == heavy == pytest.approx(0.0004)
    assert router.pricing_basis("methodology-harness") == "per_call"


def test_deepseek_is_not_priced_as_qwen():
    """The live bug: every model was billed at the qwen rate regardless of what ran."""
    router = ModelRouter()
    qwen = router.estimate_cost_usd("feedback-ia", 1_000_000, 1_000_000)
    deepseek_chat = router.estimate_cost_usd("pdf-extractor", 1_000_000, 1_000_000)
    assert qwen == pytest.approx(1.75)
    assert deepseek_chat == pytest.approx(0.42)
    assert deepseek_chat < qwen


def test_jev_price_uses_provider_model_override():
    router = ModelRouter()
    assert router.estimate_cost_usd("methodology-harness", 1_000_000, 1_000_000,
                                    model="typesafe:jev-latest") == pytest.approx(0.042)


def test_promotional_prices_record_their_list_rate():
    """A promo that ends must not silently invalidate every stored cost figure."""
    discounted = [m for m, p in MODEL_PRICING.items() if p.list_input_per_1m is not None]
    assert discounted, "expected at least one promotionally-priced entry"
    for model in discounted:
        price = MODEL_PRICING[model]
        assert price.list_input_per_1m > price.input_per_1m
        assert price.list_output_per_1m > price.output_per_1m
        assert "discount" in price.source.lower() or "promo" in price.source.lower()


def test_basis_classification():
    assert ModelPrice(input_per_1m=1.0, output_per_1m=2.0).basis == "per_token"
    assert ModelPrice(per_call_usd=0.001).basis == "per_call"
    assert ModelPrice().basis == "unknown"
