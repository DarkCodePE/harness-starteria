#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Starteria: la app vive en front/ (Vite + backend tsx). Prisma + Postgres vía
# docker compose. Los comandos npm corren desde front/ (ahí está package.json).
APP_DIR="$ROOT_DIR/front"
INSTALL_CMD="npm install"
VERIFY_CMD="npm test"
START_CMD="npm run dev:all"

echo "==> Working directory: $PWD"
echo "==> App directory:     $APP_DIR"

# Primitiva del harness de desarrollo: feature_list.json declara sus propias rules
# (single_active_feature, passing_requires_evidence, scope_declared). Leer el archivo
# no es verificarlo — esto lo verifica, y aborta antes de gastar un npm install si el
# alcance está roto.
echo "==> Validando feature_list.json contra sus rules"
python3 "$ROOT_DIR/scripts/check-feature-list.py" "$ROOT_DIR/feature_list.json"

echo "==> Syncing dependencies (front/)"
( cd "$APP_DIR" && $INSTALL_CMD )

echo "==> Generating Prisma client"
( cd "$APP_DIR" && npm run db:generate )

echo "==> Running baseline verification (unit: backend + front)"
( cd "$APP_DIR" && $VERIFY_CMD )

echo "==> Reference smoke / end-to-end path (requiere el stack docker arriba en http://localhost):"
echo "      cd front && npm run docker:up && npm run test:e2e"
echo "    Escenario de referencia: register -> login -> create project -> PDF upload+extract -> assert UI en Step 0"
echo "    Spec: front/e2e/pdf-autofill.spec.ts"

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo "==> Starting the app (Vite + backend)"
  cd "$APP_DIR"
  exec $START_CMD
fi

echo "Set RUN_START_COMMAND=1 si quieres que init.sh levante la app directamente ($START_CMD en front/)."
