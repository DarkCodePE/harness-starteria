"""Epistemic-status tracking (ADR-027, methodology §3).

ECC has no epistemic primitive, so the harness builds its own. This is the mechanism
behind "la IA propone, el humano confirma": every fact carries a certainty label, and
the ONLY way a fact becomes ``confirmed`` is an explicit authorized human action —
enforced here, not left to a prompt.
"""

from __future__ import annotations

from collections import defaultdict

from harness.config_models import PromotionRule
from harness.contracts import PROMOTABLE_FROM, EpistemicStatus, GroundedField


class PromotionError(RuntimeError):
    """Raised when a promotion violates the §3 promotion rule."""


class EpistemicTracker:
    """Holds grounded fields and enforces the epistemic promotion rule."""

    def __init__(
        self,
        fields: list[GroundedField] | None = None,
        promotion_rule: PromotionRule | None = None,
    ) -> None:
        self._fields: list[GroundedField] = list(fields or [])
        rule = promotion_rule or PromotionRule()
        self._promotable_from = (
            frozenset(EpistemicStatus(s) for s in rule.promotable_from)
            if rule.promotable_from
            else PROMOTABLE_FROM
        )
        self._promotable_to = EpistemicStatus(rule.promotable_to)
        self._requires_human = rule.requires_human_action

    # -- access -----------------------------------------------------------------
    @property
    def fields(self) -> list[GroundedField]:
        return self._fields

    def get(self, key: str) -> GroundedField | None:
        return next((f for f in self._fields if f.key == key), None)

    def add(self, field: GroundedField) -> None:
        self._fields.append(field)

    # -- §3 promotion rule ------------------------------------------------------
    def promote(self, key: str, actor: str | None) -> GroundedField:
        """Promote a field to ``confirmed`` — only legal via an authorized human action.

        Raises PromotionError if the field is missing, its current status is not
        promotable (only inferred/suggested/conflicting are), or no actor is supplied
        while the rule requires a human action.
        """
        field = self.get(key)
        if field is None:
            raise PromotionError(f"Cannot promote unknown field {key!r}.")
        if self._requires_human and not actor:
            raise PromotionError(
                f"Promotion of {key!r} requires an authorized human actor (§3 promotion rule)."
            )
        if field.status not in self._promotable_from:
            raise PromotionError(
                f"Field {key!r} has status {field.status.value!r}; only "
                f"{sorted(s.value for s in self._promotable_from)} may be promoted."
            )
        field.status = self._promotable_to
        field.source = actor or field.source
        return field

    # -- conflict detection -----------------------------------------------------
    def detect_conflicts(self) -> list[str]:
        """Mark fields sharing a key but disagreeing on a non-null value as ``conflicting``.

        Returns the list of keys that are in conflict. Fields already flagged
        ``conflicting`` are preserved.
        """
        by_key: dict[str, list[GroundedField]] = defaultdict(list)
        for f in self._fields:
            by_key[f.key].append(f)

        conflicted: list[str] = []
        for key, group in by_key.items():
            distinct = {str(f.value) for f in group if f.value is not None}
            if len(distinct) > 1:
                conflicted.append(key)
                for f in group:
                    f.status = EpistemicStatus.CONFLICTING
        return conflicted

    # -- partitioning (for prompts + gates + confirmation) ----------------------
    def partition(self) -> dict[str, list[GroundedField]]:
        """Split fields into facts / inferences / unknowns / conflicts buckets."""
        buckets: dict[str, list[GroundedField]] = {
            "facts": [],       # declared / extracted / confirmed
            "inferences": [],  # inferred / suggested
            "unknowns": [],    # unknown / outdated
            "conflicts": [],   # conflicting
        }
        for f in self._fields:
            if f.status in (EpistemicStatus.DECLARED, EpistemicStatus.EXTRACTED, EpistemicStatus.CONFIRMED):
                buckets["facts"].append(f)
            elif f.status in (EpistemicStatus.INFERRED, EpistemicStatus.SUGGESTED):
                buckets["inferences"].append(f)
            elif f.status is EpistemicStatus.CONFLICTING:
                buckets["conflicts"].append(f)
            else:  # unknown / outdated
                buckets["unknowns"].append(f)
        return buckets

    def critical_unknowns(self) -> list[str]:
        """Keys of critical fields whose status is ``unknown``."""
        return [f.key for f in self._fields if f.critical and f.status is EpistemicStatus.UNKNOWN]

    def has_conflicts(self) -> bool:
        return any(f.status is EpistemicStatus.CONFLICTING for f in self._fields)
