#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Replace these commands with the correct commands for your repository.
INSTALL_CMD=(npm install)
VERIFY_CMD=(npm test)
START_CMD=(npm run dev)

echo "==> Working directory: $PWD"

# Harness primitive: feature_list.json declares its own rules. Reading the file is
# not checking it. This enforces them and aborts before spending an install if the
# scope is broken. Ship scripts/check-feature-list.py alongside this file.
echo "==> Validating feature_list.json against its own rules"
python3 "$ROOT_DIR/scripts/check-feature-list.py" "$ROOT_DIR/feature_list.json"

echo "==> Syncing dependencies"
"${INSTALL_CMD[@]}"

echo "==> Running baseline verification"
"${VERIFY_CMD[@]}"

echo "==> Startup command"
printf '    %q' "${START_CMD[@]}"
printf '\n'

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo "==> Starting the app"
  exec "${START_CMD[@]}"
fi

echo "Set RUN_START_COMMAND=1 if you want init.sh to launch the app directly."
