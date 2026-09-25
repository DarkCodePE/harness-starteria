<!--
  Plantilla de PR, Starteria. En Claude Code la llena la skill /pr (.claude/skills/pr).
  Prosa corta, sin preámbulos. Borrá lo que no aplique, no lo dejes con los <...>.
-->

## HU

Cierra [KAN-nnn](https://stateria.atlassian.net/browse/KAN-nnn): <resumen de la HU>
Subtarea: KAN-nnn [Técnica] <resumen> · Slice V2: <nombre>

## Criterios de aceptación

<!-- Copiados de la subtarea [Funcional]. Tildá solo lo que el diff o la evidencia muestran. -->

- [ ] CA-1 <texto> · <dónde se ve>
- [ ] CA-2 <texto> · <dónde se ve, o qué subtarea lo cierra>

## Resumen

<!-- La vista más chica que deje clara la idea: diagrama, diff chico, árbol de llamadas o de archivos. -->

## Evidencia

- **Antes:** <captura, salida, test que falla>
  **Después:** <captura, salida, test que pasa>

## Peligro de mergear

**Puerta:** <una vía | dos vías>

**Radio de impacto:** <una palabra>

## Chequeos

- [ ] Sin secretos, credenciales ni `.env` en el diff
- [ ] `V2_CHANGE_GUARDRAIL_CHECK` producido (si toca código productivo)
- [ ] Autoridad explícita para backend / Prisma / IA productiva / Core (si los toca)
- [ ] Permisos de workflows mínimos (si toca `.github/workflows`)
