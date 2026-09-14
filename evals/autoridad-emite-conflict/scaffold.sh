#!/usr/bin/env bash
# Trae doc/ al workspace del eval.
#
# Por que hace falta: add_dirs solo acepta rutas adentro del directorio del caso, y los
# contratos viven en doc/, en la raiz del repo. Sin esto, cada corrida termina intentando
# salir del sandbox a leer el repo real: las que lo logran pasan y las que no, fallan, y
# eso mide la suerte del permiso de lectura en vez del comando.
#
# Se ubica solo, sin rutas absolutas, para que la suite siga siendo portable.
set -euo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(cd "$AQUI/../.." && pwd)"
cp -r "$RAIZ/doc" ./doc
echo "doc/ copiado al workspace: $(ls ./doc | wc -l) archivos"
