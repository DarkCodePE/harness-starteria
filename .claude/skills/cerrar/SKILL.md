---
name: cerrar
description: >
  Cierra una subtarea [Técnica] de Starteria después de que una persona mergeó su PR: comprueba el
  merge, produce el V2_CHANGE_CLOSURE_CHECK, propone la actualización del STARTERIA_V2_MANIFEST.md y
  del CURRENT_STATE.md si cambió el estado del slice, y deja en la HU el PR y la evidencia.
  Use when: el PR de una subtarea ya está mergeado y hay que dejar el ciclo cerrado.
  Do not use for: un PR sin mergear (eso sigue en /verificar o /pr), ni mergear.
argument-hint: "<KAN-nnn> [número de PR]"
allowed-tools: Read Grep Glob Write Edit Bash(gh pr view *) Bash(gh pr list *) Bash(git log *) Bash(git diff *) Bash(git fetch *) Bash(node .claude/skills/jira-hu/tools/*)
---

# Cerrar una subtarea

Es el final de la fase **h** de `AGENTS.md` §3. Sin este paso el Manifest deja de describir lo que
hay en `main`, y la HU queda "en curso" aunque el código ya esté en producción.

## 1. Comprobar que está mergeado

```bash
gh pr list --state merged --search "KAN-nnn in:title" --json number,title,mergedAt,mergeCommit,url
gh pr view <n> --json state,mergedAt,mergeCommit,headRefName,body,url
```

Si el PR no está `MERGED`, parás: el cierre no se hace sobre un PR abierto, y mergear lo decide una
persona. Si hay varios PR para la misma clave, cerrás el que te nombraron o preguntás cuál.

Traé la HU (`node .claude/skills/jira-hu/tools/jira-hu.mjs KAN-nnn`) para tener los `CA-n` y el
slice, y el diff mergeado (`git diff <mergeCommit>^1 <mergeCommit> --stat`).

## 2. V2_CHANGE_CLOSURE_CHECK

Producilo en la conversación, con cada campo respaldado por el PR, el diff o la evidencia; lo que
no puedas respaldar va como `UNKNOWN`, no como `YES`:

```text
V2_CHANGE_CLOSURE_CHECK  KAN-nnn  PR #n @ <merge sha>

V2 contract satisfied:          YES / PARTIAL / NO   (qué CA quedaron cubiertos)
V2 route active:
V1 consumer remaining:
Legacy compatibility documented:
E2E passed:                     (qué spec, de la evidencia del PR)
Manifest updated:               YES / NO / NOT_NEEDED
Retirement action:              KEEP_COMPAT / DEPRECATE / REMOVE
Migration status:               PARTIAL / V2_MIGRATED
```

`V2_MIGRATED` exige las cuatro puertas de Guardrails (Contract, Dependency, E2E, Retirement). Un
cambio visual no es una migración.

## 3. Manifest y CURRENT_STATE

Buscá el slice en `STARTERIA_V2_MANIFEST.md` (`logic_status`, `implementation_status`,
`visual_status`, `evidence_status`). Si el PR cambió alguno de verdad, **proponé** el cambio como
diff y esperá el sí antes de escribirlo:

- sólo los campos que el PR cambió, con la evidencia entre paréntesis como hacen las entradas
  existentes (por ejemplo `implementation_status: IMPLEMENTED_VERIFIED (tests herméticos…)`);
- una línea en `CURRENT_STATE.md` si cambió lo que el repo puede o no puede hacer.

Con el sí, el cambio va en una rama `docs/KAN-nnn-cierre` y un PR chico con `/pr`; no se commitea a
`main`. Si nada cambió de estado, `Manifest updated: NOT_NEEDED` y lo decís.

## 4. Dejarlo en la HU

Armá el comentario en un archivo del scratchpad:

```markdown
## Cerrada por PR #n
- PR: <url> · merge <sha corto> · <fecha>
- CA cubiertos: CA-1 (test ruta::nombre), CA-2 (...)
- CA pendientes: CA-3 → KAN-nnn / motivo
- Evidencia: <resumen de la tabla VERIFICACION del PR>
- Migración V2: PARTIAL | V2_MIGRATED · Manifest: actualizado en PR #m | sin cambios
```

Mostrá el dry-run y, con el sí de la persona, aplicalo:

```bash
node .claude/skills/jira-hu/tools/jira-hu-comentar.mjs KAN-nnn --archivo <comentario.md>
node .claude/skills/jira-hu/tools/jira-hu-comentar.mjs KAN-nnn --archivo <comentario.md> --aplicar
```

Mover la subtarea a `RESUELTO` va en el mismo comando (`--estado RESUELTO`) **sólo si la persona lo
pide**. Si todas las técnicas de la HU quedaron resueltas, decilo: cerrar la HU padre también lo
decide una persona.

## 5. Terminar

La sesión termina en **terminada** (`AGENTS.md` §4): PR mergeado, closure check producido, Manifest
actualizado o marcado como no necesario, HU comentada. Si algo quedó pendiente (el PR del Manifest
sin abrir, el comentario sin aprobar), el estado es **bloqueada** y decís qué falta.

## Lo que no hacés

- Cerrar sobre un PR que no está mergeado, ni mergear.
- Declarar `V2_MIGRATED` sin las cuatro puertas, o `YES` en un campo sin evidencia.
- Escribir en el Manifest, `CURRENT_STATE.md`, Jira o `main` sin el sí de la persona.
