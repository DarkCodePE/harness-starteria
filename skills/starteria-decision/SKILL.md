---
name: starteria-decision
description: Registra una decisión que cambia una regla de Starteria como ADR, en lenguaje de producto. Use when se decidió cambiar un invariante, mover la frontera entre lo que decide la persona y lo que decide la IA, cambiar una relación del dominio, o cualquier cosa que obligue a migrar datos.
disable-model-invocation: true
argument-hint: "<la decisión a registrar>"
allowed-tools: Read Grep Glob
---

# Registrar la decisión

Una decisión que solo existe en un chat no existe. Dentro de tres meses alguien va a hacer lo
contrario sin saber que se había decidido algo, y va a tener razón, porque no había dónde mirarlo.

Un ADR es eso: el lugar donde mirarlo.

## Cuándo hace falta uno

Cuando el cambio hace alguna de estas cinco cosas:

- cambia un invariante del Core Contract;
- modifica cómo se relacionan los objetos del dominio (Frente, Reto, Iniciativa, Step);
- mueve la frontera entre lo que decide una persona y lo que decide la IA;
- obliga a migrar datos que ya existen;
- cambia una regla que otras experiencias también usan.

Si no es ninguna, **no escribas un ADR**. Un registro de decisiones lleno de cosas que no eran
decisiones deja de leerse, y entonces las que sí importaban se pierden igual.

Si no estás seguro, `/starteria-autoridad` lo responde.

## Los tres campos que la gente llena mal

**Problema.** Va el problema, no la solución. "Necesitamos que la IA cree la iniciativa" es una
solución disfrazada. El problema es "el usuario tiene que repetir en la Pantalla 2 lo que ya escribió
en la Pantalla 1". Si el campo problema ya contiene la respuesta, nadie va a poder evaluar si la
decisión fue buena.

**Evidencia.** Qué se vio, no qué se cree. Casos del harness que fallaron con su id, conversaciones
con usuarios, números. **Si no hay evidencia, escribí `ninguna`.** Un ADR honesto sin evidencia es
una decisión tomada por criterio, que es legítimo. Uno con evidencia inventada es otra cosa.

**Alternativas.** Al menos una que se haya considerado en serio, con el motivo por el que se
descartó. Un ADR con una sola opción no registra una decisión, registra un anuncio.

## Cómo se escribe

Llená [PLANTILLA-ADR.md](PLANTILLA-ADR.md) (en ChatGPT: `starteria-decision-PLANTILLA-ADR.md`).

**En español llano.** Este documento lo va a leer alguien de negocio dentro de un año. Si usás
`entry_state` o `AI_INFERRED`, explicalo en la misma línea.

**Numeración:** `ADR-001` en adelante. Hoy no hay ninguno: el nivel 2 de la cadena de autoridad está
vacío. El primero que escribas es el `ADR-001`.

## El campo Estado, y quién lo mueve

`propuesto` mientras se discute. `aceptado` cuando la persona con autoridad lo aprobó.
`rechazado` si se decidió que no. `reemplazado por ADR-XXX` cuando otro lo deja sin efecto.

**Vos podés escribir el ADR en `propuesto`. No lo podés pasar a `aceptado`.**

Es la regla que sostiene todo lo demás: el Core Contract dice en INV-03 que la IA no aprueba nada, y
un ADR aceptado es literalmente una aprobación. Si la persona te dice en esta conversación
"aprobado, ponelo en aceptado", podés transcribir eso, con su nombre y la fecha. Lo que no podés es
producir una aprobación que nadie dio.

Y no muevas a `aceptado` un ADR que todavía tiene preguntas abiertas adentro. Una decisión firmada
sobre un hueco es peor que un hueco.

## Después de escribirlo

1. **Decí qué documentos hay que actualizar.** Un ADR que cambia un invariante deja el Core Contract
   desactualizado hasta que alguien lo edite. Nombrá cuáles, con sección.
2. **Decí qué casos del harness quedan afectados.** Si la regla cambió, el esperado de algunos casos
   cambió con ella, y esos casos van a fallar por el motivo correcto. Listalos.
3. **No edites `doc/`.** Los contratos los cambia una persona, después de que el ADR esté aceptado.

## Lo que no hacés acá

- **No aprobás.** Escribís `propuesto`.
- **No inventás evidencia.** `ninguna` es una respuesta.
- **No escribís un ADR para algo que no cambia una regla.** Para eso está `/starteria-cierre`.
