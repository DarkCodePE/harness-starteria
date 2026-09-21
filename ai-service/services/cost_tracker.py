"""Cost ceiling enforcement per request and per project/day.

Tracks accumulated cost in-memory (keyed by project_id + date).
In production this should be backed by Redis or the backend database.
"""

import logging
from collections import defaultdict
from datetime import date

from config import settings
from services.model_router import ModelRouter

logger = logging.getLogger(__name__)

_model_router = ModelRouter()

# In-memory store: project_id -> date string -> accumulated cost USD
_daily_cost: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

# Calls whose model has no price on file. These contribute 0 to the budget above, which
# UNDER-COUNTS it — the counter exists so that gap is visible instead of silent.
_unpriced_calls: dict[str, int] = defaultdict(int)


def unpriced_call_count(project_id: str) -> int:
    """How many calls this project was charged $0 for because the model had no price."""
    return _unpriced_calls[project_id]


class CostLimitExceededError(Exception):
    """Raised when a cost ceiling would be exceeded."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class CostTracker:
    """Tracks and enforces cost ceilings."""

    def check_request_cost(
        self,
        agent_id: str,
        estimated_input_tokens: int = 2000,
        estimated_output_tokens: int = 1000,
        *,
        model: str | None = None,
        models: tuple[str, ...] | None = None,
    ) -> None:
        """Raise CostLimitExceededError if estimated request cost exceeds ceiling.

        Args:
            agent_id: Agent being invoked.
            estimated_input_tokens: Conservative input token estimate.
            estimated_output_tokens: Conservative output token estimate.
        """
        if model is not None and models is not None:
            raise ValueError("Pass either model or models, not both.")
        refs = models or (model,)
        estimates = [
            _model_router.estimate_cost_usd(
                agent_id, estimated_input_tokens, estimated_output_tokens, model=ref
            )
            for ref in refs
        ]
        if any(amount is None for amount in estimates):
            # Fail open: an unpriced model cannot be shown to exceed the ceiling, and
            # blocking every call on a missing table entry would take the product down.
            logger.warning(
                "cost_check_skipped agent=%s reason=no_price_on_file basis=%s",
                agent_id,
                "unknown",
            )
            return
        estimated = sum(amount for amount in estimates if amount is not None)
        ceiling = settings.max_cost_per_request_usd
        if estimated > ceiling:
            raise CostLimitExceededError(
                f"Estimated request cost ${estimated:.4f} exceeds ceiling ${ceiling}"
            )

    def check_project_daily_budget(self, project_id: str) -> None:
        """Raise CostLimitExceededError if project daily budget is exhausted.

        Args:
            project_id: Project being charged.
        """
        today = str(date.today())
        accumulated = _daily_cost[project_id][today]
        ceiling = settings.max_cost_per_project_day_usd
        if accumulated >= ceiling:
            raise CostLimitExceededError(
                f"Project {project_id} daily cost ${accumulated:.4f} "
                f"has reached ceiling ${ceiling}"
            )

    def record_usage(
        self,
        project_id: str,
        agent_id: str,
        input_tokens: int | None,
        output_tokens: int | None,
        *,
        model: str | None = None,
    ) -> float | None:
        """Record actual usage and return cost in USD, or None when the model is unpriced.

        Args:
            project_id: Project being charged.
            agent_id: Agent that was invoked.
            input_tokens: Actual input tokens used.
            output_tokens: Actual output tokens used.

        Returns:
            Cost in USD, or None when the model has no price on file. A None result is NOT
            a free call: it is an unrecorded one, and it shows up in unpriced_call_count().
        """
        today = str(date.today())
        if input_tokens is None or output_tokens is None:
            _unpriced_calls[project_id] += 1
            logger.warning("cost_usage_missing project=%s agent=%s model=%s", project_id,
                           agent_id, model or _model_router.get_model(agent_id))
            return None
        cost = _model_router.estimate_cost_usd(
            agent_id, input_tokens, output_tokens, model=model
        )
        if cost is None:
            _unpriced_calls[project_id] += 1
            logger.warning(
                "cost_unpriced project=%s agent=%s model=%s unpriced_calls=%d — this call "
                "contributes $0 to the daily budget",
                project_id,
                agent_id,
                model or _model_router.get_model(agent_id),
                _unpriced_calls[project_id],
            )
            return None
        _daily_cost[project_id][today] += cost
        logger.info(
            "cost_recorded project=%s agent=%s cost_usd=%.6f daily_total=%.6f",
            project_id,
            agent_id,
            cost,
            _daily_cost[project_id][today],
        )
        return cost
