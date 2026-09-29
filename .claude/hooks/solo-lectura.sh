#!/usr/bin/env bash
# solo-lectura.sh: hook PreToolUse del agente revisor-starteria.
#
# El revisor necesita Bash para leer (git diff, git log, jira-hu.mjs, un test puntual), pero no
# puede escribir: commitear, pushear, mergear, tocar Jira o borrar. Una instrucción en el prompt se
# puede saltear; este hook no. Exit 2 bloquea la llamada y le devuelve el motivo al agente.
cmd=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')
prohibido='git (commit|push|merge|rebase|reset|checkout|switch|restore|stash|tag|branch -[dD]|worktree (add|remove)|cherry-pick|revert|am|apply|clean)|gh (pr (create|edit|merge|close|comment|review)|issue|release|api)|jira-hu-(crear|comentar)|--aplicar|(^|[;&| ])(rm|mv|cp|tee|sed -i|chmod|chown|npm (i|install|ci)|uv (add|sync|pip))( |$)'
# Redirección a archivo también escribe; `2>&1` y `>/dev/null` no.
sin_redir_inocuas=$(sed -E 's#[0-9]?>&[0-9]##g; s#[0-9]?> ?/dev/null##g' <<<"$cmd")
if grep -Eq -- "$prohibido" <<<"$cmd" || grep -q '>' <<<"$sin_redir_inocuas"; then
  echo "revisor-starteria es de sólo lectura: '$cmd' está bloqueado. Reportalo como hallazgo en vez de hacerlo." >&2
  exit 2
fi
exit 0
