---
name: starteria-cierre
description: Deja escrito en qué quedó la sesión para que la próxima no arranque de cero: qué se trabajó, qué se decidió, qué casos se corrieron y qué quedó abierto. Use when se termina una sesión con cosas a medio hacer, o antes de pasarle el trabajo a otra persona.
disable-model-invocation: true
---

# Cerrar la sesión

Lo que no queda escrito, se perdió. No hay un sistema que registre esto por su cuenta: ni un tablero,
ni un tracker, ni un historial que alguien vaya a leer. Este archivo es el único lugar donde el
estado sobrevive de una sesión a la otra, y se llena a mano.

## Qué escribir

Recorré la conversación y armá el bloque. Cinco partes, todas obligatorias, y `ninguno` es una
respuesta válida en cualquiera:

```text
## <fecha> - <quién>

**En qué se trabajó**
<dos o tres líneas. Qué se estaba tratando de resolver, no qué comandos se corrieron>

**Qué se decidió**
- <decisión> - <ADR-XXX si se escribió uno, o "sin ADR" y por qué no hacía falta>

**Casos corridos**
- <PE-XXX>: PASS / REVIEW / FAIL - <capa de fallo si falló> - <aislado o CONTAMINADO>

**Qué quedó abierto**
- <pregunta o pendiente> - dueño: <nombre> - <qué desbloquea>

**Por dónde seguir**
<lo primero que tendría que hacer quien abra la próxima sesión, concreto>
```

## Las tres cosas que se escriben mal

**"En qué se trabajó" no es la lista de comandos.** "Corrimos `/starteria-probar` cuatro veces" no
le dice nada a nadie. "Estábamos viendo por qué los inputs solution-first no disparan reverse
alignment" sí.

**Un pendiente sin dueño no es un pendiente.** Si no sabés de quién es, escribí `dueño: sin definir`
y ponelo primero en la lista: eso es lo primero que hay que resolver, y es más urgente que el
pendiente en sí.

**"Por dónde seguir" tiene que ser accionable.** "Seguir con las suites" no sirve. "Correr PE-B04 y
PE-B05 tres veces cada uno para ver si el fallo de B03 es estable" sí.

## Dónde se guarda

**En Claude Code:** agregalo al final de `estado/BITACORA.md`, creando el archivo si no existe. Al
principio de todo va esta línea, una sola vez:

```markdown
# Bitácora - harness de Portfolio Entry

Lo más nuevo abajo. Se llena a mano con `/starteria-cierre`. Nada actualiza esto solo.
```

Las entradas van **abajo**, en orden cronológico, sin borrar las anteriores. Que una entrada vieja
esté desactualizada es información: muestra qué se creía en ese momento.

**En ChatGPT:** devolvé el bloque y decile a la persona que lo pegue donde el equipo lleve el
estado. No tenés dónde guardarlo, y decirlo es mejor que hacer como que quedó guardado.

## Antes de terminar

Repasá si quedó algo sin registrar que se pierde al cerrar:

- ¿Se corrió algún caso que no quedó en un registro? → `/starteria-probar` paso 4.
- ¿Se decidió cambiar una regla y no se escribió el ADR? → `/starteria-decision`.
- ¿Apareció un input real de usuario que ninguna suite cubre? → `/starteria-caso`.
- ¿Quedó un conflicto entre documentos sin escribir? → `/starteria-autoridad`.

Si alguna da que sí, hacelo **antes** de cerrar. Después de cerrar, ya no hay dónde.
