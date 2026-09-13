# Plantilla de ADR

Formato del Development Harness §4.6. Copiá el bloque y llenalo entero: un campo vacío es un campo
que alguien va a tener que adivinar.

```text
ADR-XXX: <título en una línea, que diga qué se decidió>

FECHA:
ESTADO:              propuesto / aceptado / rechazado / reemplazado por ADR-XXX
OWNER:               <nombre de la persona dueña de la decisión, no un equipo>

PROBLEMA:
<qué pasa hoy que motiva esto. El problema, no la solución. Tres a seis líneas>

CONTRATO O INVARIANTE AFECTADO:
<documento, sección, y el invariante por su id si aplica: INV-03, INV-05...>

CAMBIO PROPUESTO:
<qué va a decir la regla después de esto, redactado como quedaría>

EVIDENCIA:
<casos del harness con su id, conversaciones con usuarios, números.
 Si no hay, escribí "ninguna">

ALTERNATIVAS CONSIDERADAS:
1. <opción> - descartada porque <motivo>
2. <opción> - descartada porque <motivo>

IMPACTO EN PORTFOLIO:
<qué cambia para Frentes, Retos, Iniciativas. "ninguno" si no cambia nada>

IMPACTO EN INICIATIVA Y STEPS:
<qué cambia en Step 0 a 4. "ninguno" si no cambia nada>

IMPACTO EN DATOS:
<qué información existente queda distinta, incompleta o inválida>

MIGRACION:
<qué hay que hacer con lo que ya está guardado. "no aplica" si todavía no hay datos>

DOCUMENTOS A ACTUALIZAR:
- <archivo de doc/, sección>

CASOS DEL HARNESS AFECTADOS:
- <PE-XXX: qué cambia en su esperado>

PREGUNTAS ABIERTAS:
<lo que quedó sin resolver, con quién lo tiene que resolver.
 Si hay alguna, el estado NO puede ser "aceptado">
```

## Antes de darlo por terminado

- ¿El campo `PROBLEMA` describe un problema, o ya trae la solución adentro?
- ¿Hay al menos una alternativa con su motivo de descarte?
- ¿`OWNER` es una persona con nombre?
- ¿`EVIDENCIA` dice lo que se vio, o lo que se cree?
- ¿El estado es `propuesto`, salvo que una persona haya aprobado en esta conversación?
- ¿Quedan preguntas abiertas? Entonces no puede estar en `aceptado`.
