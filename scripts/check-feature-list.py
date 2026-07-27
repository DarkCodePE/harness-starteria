#!/usr/bin/env python3
"""Valida feature_list.json contra sus propias `rules`.

Primitiva del harness de DESARROLLO (la del repo base, no el harness metodológico
de ADR-027). `feature_list.json` declara reglas en su header — `single_active_feature`,
`passing_requires_evidence` — pero hasta ahora nadie las chequeaba: leer el archivo
no es verificarlo. Este script las hace ejecutables y `init.sh` lo corre primero,
de modo que una sesión no arranca con el alcance roto.

Uso:  python3 scripts/check-feature-list.py [ruta]   (default: ./feature_list.json)
Sale con 1 si alguna regla se viola.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

# WIP = 1. Solo una feature puede estar `in_progress`; lo demás se aparca en `blocked`.
#
# `scope_out` se exige cuando la feature está planificada o activa. A una aparcada NO se
# le exige: se re-acota al despertarla (al pasar a in_progress el check ya la obliga).
SCOPED_STATUSES = {"not_started", "in_progress"}
# Aparcada ⇒ hay que decir POR QUÉ y QUÉ la despierta. Sin eso, `blocked` es un basurero.
PARKED_STATUS = "blocked"
EXTERNAL_REF = re.compile(r"^#\d+$")


def check(path: Path) -> list[str]:
    """Devuelve la lista de violaciones. Vacía = archivo sano."""
    data = json.loads(path.read_text(encoding="utf-8"))
    rules = data.get("rules", {})
    legend = data.get("status_legend", {})
    features = data.get("features", [])
    known_ids = {f.get("id") for f in features}
    problems: list[str] = []

    # --- integridad estructural ------------------------------------------------
    for dup, n in Counter(f.get("id") for f in features).items():
        if n > 1:
            problems.append(f"id duplicado: {dup} ({n} veces)")
    for dup, n in Counter(f.get("priority") for f in features).items():
        if n > 1:
            problems.append(f"priority duplicada: {dup} ({n} features)")
    for f in features:
        if f.get("status") not in legend:
            problems.append(
                f"{f.get('id')}: status '{f.get('status')}' no está en status_legend"
            )

    # --- single_active_feature -------------------------------------------------
    if rules.get("single_active_feature"):
        active = [f["id"] for f in features if f.get("status") == "in_progress"]
        if len(active) > 1:
            problems.append(
                f"single_active_feature: {len(active)} features in_progress → "
                + ", ".join(active)
            )

    # --- passing_requires_evidence ---------------------------------------------
    if rules.get("passing_requires_evidence"):
        for f in features:
            if f.get("status") == "passing" and not f.get("evidence"):
                problems.append(f"{f['id']}: passing sin evidence")

    # --- scope_declared --------------------------------------------------------
    # Sin frontera declarada, la categoría "Disciplina de alcance" de
    # evaluator-rubric.md es infalsificable: no hay contra qué contrastar el desvío.
    # Solo se exige a features abiertas; las cerradas ya tienen el alcance zanjado.
    if rules.get("scope_declared"):
        for f in features:
            if f.get("status") in SCOPED_STATUSES and not f.get("scope_out"):
                problems.append(
                    f"{f['id']} ({f.get('status')}): sin scope_out — declara qué queda fuera"
                )

    # --- blocked_requires_reason -----------------------------------------------
    # Aparcar por límite de WIP es legítimo; aparcar sin decir qué la despierta
    # convierte `blocked` en el estacionamiento cómodo que `in_progress` al menos
    # delataba a simple vista.
    if rules.get("blocked_requires_reason"):
        for f in features:
            if f.get("status") == PARKED_STATUS and not f.get("status_note"):
                problems.append(
                    f"{f['id']}: blocked sin status_note — documenta qué la desbloquea"
                )

    # --- deferred_to apunta a algo real ----------------------------------------
    for f in features:
        for ref in f.get("deferred_to", []):
            if ref not in known_ids and not EXTERNAL_REF.match(ref):
                problems.append(
                    f"{f['id']}: deferred_to '{ref}' no es una feature conocida ni un issue (#N)"
                )

    return problems


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "feature_list.json")
    if not path.exists():
        print(f"  ✗ no existe {path}", file=sys.stderr)
        return 1

    try:
        problems = check(path)
    except json.JSONDecodeError as exc:
        print(f"  ✗ {path} no es JSON válido: {exc}", file=sys.stderr)
        return 1

    if problems:
        for p in problems:
            print(f"  ✗ {p}")
        print(
            f"\nABORTA — {len(problems)} violación(es) de las rules que el propio "
            f"{path.name} declara. Resuelve el alcance antes de trabajar."
        )
        return 1

    data = json.loads(path.read_text(encoding="utf-8"))
    features = data["features"]
    active = [f["id"] for f in features if f.get("status") == "in_progress"]
    parked = [f for f in features if f.get("status") == PARKED_STATUS]

    print(f"  ✓ {len(features)} features, reglas de alcance OK")
    print(f"  → WIP (1): {active[0] if active else '(ninguna — elige una)'}")

    # La deuda aparcada se imprime SIEMPRE, aunque el check pase. `blocked` no puede
    # ser más cómodo que `in_progress`: si crece, se ve crecer.
    if parked:
        print(f"  → aparcadas en blocked ({len(parked)}):")
        for f in parked:
            print(f"      · {f['id']} — {f.get('status_note', '')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
