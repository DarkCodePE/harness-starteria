# Rúbrica del Evaluador — Starteria

Usar después de la implementación de una feature de `feature_list.json` y antes de la aceptación final
(antes de mover una feature a `passing`). Puntuar cada categoría de 0 a 2.

Criterios de aprobación específicos de este repo:

- "Verificación" solo puntúa 2 si el comando registrado en `feature_list.json` (`verification`) se ejecutó
  realmente en esta sesión y su salida quedó capturada en `evidence` (un PR mergeado NO cuenta como evidencia ejecutable).
- "Fiabilidad" solo puntúa 2 si la verificación pasa tras reinicio limpio (`./init.sh` + re-ejecución del comando).
- "Preparación de entrega" solo puntúa 2 si `claude-progress.md`, `feature_list.json` y (si aplica) `session-handoff.md` están actualizados.

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
