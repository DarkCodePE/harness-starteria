"""Load and validate the methodology config bundle (ADR-027).

`load_methodology()` reads `config/methodology.yaml`, validates it into a typed
`MethodologyConfig`, and cross-checks the config `version` against `config/version.txt`.
Cached (lru_cache) so the whole service shares one immutable config instance; the
version string is stamped into every AuditRecord.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml

from harness.config_models import MethodologyConfig

_CONFIG_DIR = Path(__file__).parent / "config"
_METHODOLOGY_YAML = _CONFIG_DIR / "methodology.yaml"
_VERSION_TXT = _CONFIG_DIR / "version.txt"


class ConfigError(RuntimeError):
    """Raised when the methodology config is missing or invalid."""


def config_dir() -> Path:
    return _CONFIG_DIR


@lru_cache(maxsize=1)
def load_methodology() -> MethodologyConfig:
    """Parse + validate methodology.yaml into a typed config (cached)."""
    if not _METHODOLOGY_YAML.exists():
        raise ConfigError(f"methodology.yaml not found at {_METHODOLOGY_YAML}")
    raw = yaml.safe_load(_METHODOLOGY_YAML.read_text(encoding="utf-8")) or {}
    try:
        config = MethodologyConfig.model_validate(raw)
    except Exception as exc:  # noqa: BLE001 — re-raise as a typed config error
        raise ConfigError(f"Invalid methodology.yaml: {exc}") from exc

    # Version consistency: the bundle's version.txt must match the YAML version.
    if _VERSION_TXT.exists():
        pinned = _VERSION_TXT.read_text(encoding="utf-8").strip()
        if pinned and pinned != config.version:
            raise ConfigError(
                f"Config version mismatch: version.txt={pinned!r} but methodology.yaml={config.version!r}"
            )
    return config


def load_stage_prompt(rel_path: str) -> tuple[str, str]:
    """Load a per-stage system prompt markdown file.

    Returns (text, version). The version is read from a leading HTML comment of the
    form ``<!-- version: X -->`` on the first line; absent → 'unversioned'.
    """
    path = _CONFIG_DIR / rel_path
    if not path.exists():
        raise ConfigError(f"Stage prompt not found: {path}")
    text = path.read_text(encoding="utf-8")
    version = "unversioned"
    first_line = text.splitlines()[0] if text else ""
    if "version:" in first_line and "<!--" in first_line:
        version = first_line.split("version:", 1)[1].replace("-->", "").strip()
    return text, version
