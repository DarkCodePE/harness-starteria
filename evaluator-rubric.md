# Rúbrica del Evaluador — Starteria

Usar después de la implementación de una feature de `feature_list.json` y antes de la aceptación final
(antes de mover una feature a `passing`). Puntuar cada categoría de 0 a 2.

Criterios de aprobación específicos de este repo:

- "Verificación" solo puntúa 2 si el comando registrado en `feature_list.json` (`verification`) se ejecutó
  realmente en esta sesión y su salida quedó capturada en `evidence` (un PR mergeado NO cuenta como evidencia ejecutable).
- "Fiabilidad" solo puntúa 2 si la verificación pasa tras reinicio limpio (`./init.sh` + re-ejecución del comando).
- "Preparación de entrega" solo puntúa 2 si `claude-progress.md`, `feature_list.json` y (si aplica) `session-handoff.md` están actualizados.
- "Disciplina de alcance" se puntúa contra el `scope_out` de la feature, declarado ANTES de trabajar. Si la
  sesión tocó algo listado en `scope_out`, puntúa 0. Si la feature no declara `scope_out`, la categoría no es
  evaluable y `./init.sh` ya debería haber abortado (`scripts/check-feature-list.py`).

| Categoría | Pregunta | Puntuación (0-2) | Notas |
| --- | --- | --- | --- |
| Corrección | ¿El comportamiento implementado coincide con `user_visible_behavior` de la feature? |  |  |
| Verificación | ¿Las verificaciones requeridas se ejecutaron realmente, con evidencia capturada? |  |  |
| Disciplina de alcance | ¿La sesión se mantuvo dentro del alcance de la única feature activa? |  |  |
| Fiabilidad | ¿El resultado sobrevive al reinicio o reejecución sin reparación? |  |  |
| Mantenibilidad | ¿El código y la documentación son lo suficientemente claros para la próxima sesión? |  |  |
| Preparación de entrega | ¿Puede una sesión nueva continuar el trabajo solo con artefactos del repositorio? |  |  |

## Veredicto

- Aceptar — total ≥ 10 y ninguna categoría en 0.
- Revisar — total 6–9, o "Verificación" en 1.
- Bloquear — total < 6, o "Verificación"/"Corrección" en 0.

## Seguimiento Requerido

- Evidencia faltante:
- Correcciones requeridas:
- Próximo disparador de revisión:

## Historial de Ajuste de la Rúbrica

Los agentes tienden a auto-aprobarse; comparar puntuaciones del evaluador con juicio humano y
endurecer los criterios donde diverjan. Registrar cada ajuste aquí.

- 2026-07-02 — v1: criterios iniciales; "PR mergeado ≠ evidencia ejecutable" añadido por las features `in_progress` heredadas (#117, #104, #91).
- 2026-07-26 — v2: "Disciplina de alcance" era infalsificable — la rúbrica la puntuaba pero ningún campo de
  `feature_list.json` declaraba la frontera. Añadidos `scope_out`/`deferred_to` al schema y
  `scripts/check-feature-list.py` (lo corre `./init.sh` y aborta). Se formaliza **WIP = 1**: había 4 features
  `in_progress` con `single_active_feature: true` declarado en el header del propio archivo. Las 3 de
  #117/#104/#91 pasan a `blocked` — cuya definición se amplía para cubrir el aparcado por límite de WIP,
  no solo el impedimento externo — con `status_note` obligatorio diciendo qué las desbloquea (regla
  `blocked_requires_reason`). El check imprime las aparcadas en CADA corrida aunque pase, para que `blocked`
  no sea un estacionamiento más cómodo de lo que era `in_progress`. Se descartó un estado
  `awaiting_evidence` dedicado: añadía vocabulario sin añadir presión, y el objetivo es que la deuda se vea.
