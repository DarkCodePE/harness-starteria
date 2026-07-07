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
