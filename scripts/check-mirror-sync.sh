#!/usr/bin/env bash
# check-mirror-sync.sh
#
# Verifica que plugins/starteria-harness/ siga igual a la raiz canonica.
# Funciona REGENERANDO el mirror y comparando contra el arbol commiteado: como
# sync-plugin-mirror.sh es dueno de las divergencias intencionales, un diff
# limpio significa "sin deriva" SIN lista de excepciones a mano.
#
# Esa es la diferencia con ADR-006, que murio de deriva: aquello pedia mantener
# catorce renombrados a mano; esto pide correr un script.
#
# Efecto lateral a proposito: si hay deriva, el arbol queda REGENERADO, asi que
# el arreglo es `git add plugins/starteria-harness`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

bash "${ROOT}/scripts/sync-plugin-mirror.sh" >/dev/null

# --porcelain y no `diff --quiet`: asi los archivos nuevos que produce la
# regeneracion tambien cuentan como deriva, no solo los modificados.
if [ -n "$(git -C "${ROOT}" status --porcelain -- plugins/starteria-harness)" ]; then
  echo "ERROR: plugins/starteria-harness esta fuera de sync con skills/ o agents/." >&2
  echo "Corre scripts/sync-plugin-mirror.sh, commitea el resultado, y reintenta." >&2
  git -C "${ROOT}" status --porcelain -- plugins/starteria-harness >&2
  exit 1
fi

echo "mirror-sync OK: plugins/starteria-harness coincide con skills/ + agents/"
