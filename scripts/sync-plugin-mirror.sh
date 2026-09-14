#!/usr/bin/env bash
# sync-plugin-mirror.sh
#
# Genera plugins/starteria-harness/ desde el contenido canonico de la raiz:
# skills/, agents/ y los dos manifiestos. Es la capa generica de distribucion:
# un paquete autocontenido al que .agents/plugins/marketplace.json apunta,
# en vez de publicar la raiz entera del repo.
#
# POR QUE EXISTE, y no es prolijidad: ADR-008 §4 declaro una fuga abierta —
# "la raiz del repo es la raiz del plugin, asi que el plugin ve todo lo que hay
# en la raiz" — y anoto que la proxima cosa que alguien deje en la raiz va a
# viajar igual. El mirror le pone frontera: lo que no esta en la lista de abajo
# no entra, y agregar un archivo a la raiz ya no lo publica sin querer.
#
# EL GENERADOR ES DUENO DE LAS DIVERGENCIAS. No hay lista de excepciones a mano:
# si el paquete tiene que diferir de la raiz, la diferencia se escribe ACA, y
# check-mirror-sync la respeta sola. Es la leccion de ADR-006: una tabla de
# equivalencias mantenida a mano se pudre; un generador no.
#
# Idempotente: correrlo dos veces sobre un arbol limpio no deja diff.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIRROR="${ROOT}/plugins/starteria-harness"

rm -rf "${MIRROR}"
mkdir -p "${MIRROR}/.claude-plugin" "${MIRROR}/.codex-plugin"

# --- lo que SI entra al paquete ---
cp -R "${ROOT}/skills" "${MIRROR}/skills"
cp -R "${ROOT}/agents" "${MIRROR}/agents"
cp "${ROOT}/.claude-plugin/plugin.json" "${MIRROR}/.claude-plugin/plugin.json"
cp "${ROOT}/.codex-plugin/plugin.json"  "${MIRROR}/.codex-plugin/plugin.json"

# --- divergencias intencionales, propiedad de este script ---
#
# 1. .mcp.json NO se copia. Es la fuga de ADR-008 §4: configuracion de ruflo
#    para este proyecto, no del harness. Instalar el mirror no la arrastra.
# 2. .claude-plugin/marketplace.json NO se copia. Un paquete no lleva adentro
#    el catalogo que lo lista; eso es responsabilidad de quien publica.
# 3. doc/, docs/, evals/, scripts/, research/ NO se copian. Los contratos se
#    citan desde el repo donde corre el harness (ADR-005), no viajan adentro.
#
# Si manana hace falta que el paquete difiera de la raiz por algo mas, se
# escribe aca y no en un README que nadie relee.

find "${MIRROR}" -name '.swarm' -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "${MIRROR}" -name '.claude-flow' -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "mirror generado: plugins/starteria-harness"
echo "  skills: $(find "${MIRROR}/skills" -name SKILL.md | wc -l)"
echo "  agents: $(find "${MIRROR}/agents" -name '*.md' | wc -l)"
