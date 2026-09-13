#!/usr/bin/env bash
# Gate del productor. ADR-009.
#
# Comprueba lo que una maquina puede comprobar sin opinar sobre ninguna
# interpretacion: manifiestos validos, diez skills con SKILL.md, frontmatter
# completo, y que el plugin instalado reporte Skills (10).
#
# NO puntua casos ni lee doc/. Eso es del producto y lo verifica una persona
# (ADR-003).
#
# Uso:  scripts/verify.sh [--root DIR]
# Sale: 0 todo bien | 1 fallo | 2 falta una herramienta

set -uo pipefail

ESPERADAS=10
AGENTES_ESPERADOS=1
PLUGIN="starteria-harness@darkcodepe"

ROOT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "opcion desconocida: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi
cd "$ROOT" || { echo "no existe: $ROOT" >&2; exit 2; }

FALLOS=0
AVISOS=0

ok()    { printf '  \033[32mOK\033[0m    %s\n' "$1"; }
fallo() { printf '  \033[31mFALLA\033[0m %s\n' "$1"; FALLOS=$((FALLOS+1)); }
aviso() { printf '  \033[33mAVISO\033[0m %s\n' "$1"; AVISOS=$((AVISOS+1)); }

command -v claude  >/dev/null 2>&1 || { echo "falta el CLI 'claude'" >&2; exit 2; }
command -v python3 >/dev/null 2>&1 || { echo "falta python3" >&2; exit 2; }

echo "Verificacion del productor — $ROOT"
echo

# --- 1. manifiestos -------------------------------------------------------
echo "Manifiestos"
if claude plugin validate . >/dev/null 2>&1; then
  ok "marketplace.json valido"
else
  fallo "marketplace.json invalido (corre: claude plugin validate .)"
fi

if claude plugin validate skills/ >/dev/null 2>&1; then
  ok "skills/ valido"
else
  fallo "skills/ invalido (corre: claude plugin validate skills/)"
fi

# --- 2. las diez carpetas -------------------------------------------------
echo
echo "Skills en disco"
encontradas=0
for d in skills/starteria*/; do
  [ -d "$d" ] || continue
  encontradas=$((encontradas+1))
  n=$(basename "$d")
  if [ ! -f "$d/SKILL.md" ]; then
    fallo "$n no tiene SKILL.md"
    continue
  fi
  fm=$(awk 'NR==1 && $0!="---" {exit} NR>1 && $0=="---" {exit} {print}' "$d/SKILL.md")
  if ! grep -q '^name:' <<<"$fm"; then
    fallo "$n: falta 'name:' en el frontmatter"
  elif ! grep -q '^description:' <<<"$fm"; then
    fallo "$n: falta 'description:' en el frontmatter"
  else
    ok "$n"
  fi
done

if [ "$encontradas" -ne "$ESPERADAS" ]; then
  fallo "hay $encontradas carpetas skills/starteria*, se esperaban $ESPERADAS"
fi

# --- 3. la tabla de AGENTS.md (contrato del productor) --------------------
# AGENTS.md lista las skills en una tabla. Una tabla escrita a mano miente en
# silencio en cuanto alguien agrega o renombra una skill.
echo
echo "Tabla de AGENTS.md"
if [ ! -f AGENTS.md ]; then
  fallo "no existe AGENTS.md — es el contrato del productor (ADR-009)"
else
  if salida=$(python3 - <<'PY'
import re, sys
from pathlib import Path
txt = Path("AGENTS.md").read_text(encoding="utf-8")
m = re.search(r"### Las diez skills del producto(.*?)(?=\n### )", txt, re.S)
if not m:
    sys.exit("falta la seccion '### Las diez skills del producto'")
tabla = set(re.findall(r"\|\s*`/(starteria[\w-]*)`", m.group(1)))
disco = {p.name for p in Path("skills").glob("starteria*") if (p / "SKILL.md").exists()}
faltan, sobran = sorted(disco - tabla), sorted(tabla - disco)
if faltan or sobran:
    for n in faltan: print(f"en disco y no en la tabla: {n}")
    for n in sobran: print(f"en la tabla y no en disco: /{n}")
    sys.exit(1)
PY
  ); then
    ok "la tabla lista las mismas skills que hay en disco"
  else
    fallo "AGENTS.md derivo del disco"
    sed 's/^/        /' <<<"$salida" | head -10
  fi
fi

# --- 4. el plugin instalado ------------------------------------------------
echo
echo "Plugin instalado"
det=$(claude plugin details "$PLUGIN" 2>&1)
if [ $? -ne 0 ] || grep -qi "not found\|no encontrado" <<<"$det"; then
  fallo "$PLUGIN no esta instalado (corre: claude plugin install $PLUGIN)"
else
  if grep -q "Skills ($ESPERADAS)" <<<"$det"; then
    ok "el inventario reporta Skills ($ESPERADAS)"
  else
    real=$(grep -o 'Skills ([0-9]*)' <<<"$det" | head -1)
    fallo "el inventario reporta '${real:-nada}', se esperaba Skills ($ESPERADAS)"
  fi

  # El agente de la fase 1 no es cosmetico: sin el, /starteria-probar
  # vuelve a depender de que alguien se acuerde de aislar (ADR-008, historial).
  if grep -q "Agents ($AGENTES_ESPERADOS)" <<<"$det"; then
    ok "el inventario reporta Agents ($AGENTES_ESPERADOS)"
  else
    real=$(grep -o 'Agents ([0-9]*)' <<<"$det" | head -1)
    fallo "el inventario reporta '${real:-nada}', se esperaba Agents ($AGENTES_ESPERADOS)"
  fi

  # ADR-008 acepto esta fuga como costo de empaquetar en la raiz.
  # Se avisa para que no se olvide; no hace fallar.
  if mcp=$(grep -o 'MCP servers ([1-9][0-9]*)[^(]*' <<<"$det" | head -1); then
    [ -n "$mcp" ] && aviso "el plugin arrastra ${mcp% } — fuga de .mcp.json, ADR-008 §4"
  fi
fi

# --- 5. evals del producto (ADR-009, criterio abierto) --------------------
echo
echo "Evals del producto"
if find . -path ./referencia -prune -o -name 'case.yaml' -print 2>/dev/null | grep -q .; then
  ok "hay suite de evals"
else
  aviso "sin suite de evals — criterio abierto de ADR-009 §5"
fi

# --- resumen ---------------------------------------------------------------
echo
if [ "$FALLOS" -eq 0 ]; then
  if [ "$AVISOS" -gt 0 ]; then
    echo "Todo bien ($AVISOS aviso(s))."
  else
    echo "Todo bien."
  fi
  echo
  echo "Esto verifica estructura. Que un comando interprete bien un caso"
  echo "no lo aprueba ninguna maquina: eso es ADR-003 y lo hace una persona."
  exit 0
fi

echo "$FALLOS fallo(s), $AVISOS aviso(s)."
exit 1
