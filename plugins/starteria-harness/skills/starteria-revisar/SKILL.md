---
name: starteria-revisar
description: Revisa un caso del AI Harness antes de correrlo: si lo esperado sale del contrato o de lo que el agente ya contestó, si duplica otro caso, y si dos personas lo puntuarían igual. Use when escribiste un caso nuevo y todavía no lo corriste, o cuando una tanda entera va a decidir si se cambia un contrato. No use when el caso ya se corrió y salió mal: eso es un hallazgo y lo ubica `/starteria-autoridad`.
disable-model-invocation: true
argument-hint: "<PE-B03 | el caso nuevo sin correr>"
allowed-tools: Read Grep Glob
---

# Revisar un caso antes de correrlo

Correr cuarenta casos y sacar un número es fácil. Que ese número signifique algo depende de una
pregunta que hoy no se hace en ningún lado: si los casos miden al agente, o a quien los puntúa.

Un caso mal construido no falla. Pasa, y te deja más tranquilo que antes.

## La regla que hace que esto sirva: no corras el caso en tu cabeza

Revisás **cómo está construido el caso**, no si el agente lo va a pasar. Son dos trabajos distintos
y el segundo ya tiene su comando.

Si mientras leés el input te ponés a imaginar qué contestaría el agente, contaminaste la revisión: a
partir de ahí vas a juzgar lo esperado contra tu respuesta imaginada, que es el error exacto que el
caso tenía que evitar. Es la misma razón por la que `/starteria-probar` separa responder de puntuar.

## Los cuatro chequeos

**1. ¿De dónde salió lo esperado?** Pedí que lo esperado cite **archivo y sección**. Si no puede,
salió de otro lado.

El síntoma es de forma, no de fondo: un esperado que sale del contrato se lee como una lista de
invariantes con su origen; uno copiado de la salida del agente se lee como prosa terminada, fluida y
con matices. La prosa linda es la señal de alarma. Un caso cuyo esperado se copió de lo que el
agente contestó nunca va a fallar, y por lo tanto nunca va a enseñar nada.

**2. ¿Ya está cubierto?** Leé el índice de suites en `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`. Si
otro caso prueba lo mismo, decilo. Que sea más largo o más realista no lo hace distinto: distinto es
que ejercite un invariante que el otro no toca.

**3. ¿Dos personas lo puntuarían igual?** Tomá la rúbrica y lo esperado, y preguntate si alguien que
no estuvo en la conversación podría puntuarlo y llegar al mismo número que vos.

Si lo esperado dice "responde bien", "entiende la intención" o "no se va por las ramas", **ese caso
mide al que puntúa**. Va a dar distinto según quién lo corra y el día que lo corra, y cuando alguien
compare dos corridas va a estar comparando dos opiniones.

**4. ¿Lo prohibido es de este input?** Los nueve fallos duros aplican siempre. Si lo prohibido
solamente los repite, el caso no está prohibiendo nada propio. Lo que va acá es lo específico: si la
persona nombró una iniciativa, lo prohibido concreto es proponer crearla.

## El veredicto

Uno solo, por caso, y se escribe:

| Veredicto | Cuándo | A dónde va |
|---|---|---|
| `LISTO` | Los cuatro chequeos pasan | `/starteria-probar` |
| `AJUSTAR` | El caso se arregla sin tocar un contrato | `/starteria-caso`, con el ajuste escrito |
| `HALLAZGO` | El problema no está en el caso, está en el contrato | `/starteria-autoridad` |

`HALLAZGO` es el que más vale y el que más cuesta reconocer. Aparece cuando al buscar de dónde
tendría que salir lo esperado, resulta que **ningún documento lo dice**. Eso no es un caso mal
escrito: es un hueco del contrato que el caso encontró antes de que lo encontrara un usuario.

## Si te pasan una tanda

Revisá **cada caso**. Una tanda no tiene veredicto propio: tiene tantos veredictos como casos.

Si son muchos y no vas a poder con todos, decí cuántos revisaste y cuántos no, y no declares nada
sobre los que no miraste. Una revisión parcial declarada sirve; una revisión parcial presentada como
completa es peor que ninguna, porque alguien va a correr esa tanda creyendo que está chequeada.

## Dónde queda

Llená [PLANTILLA.md](PLANTILLA.md) y escribila en
`$STARTERIA_STATE_ROOT/revisiones/<id-del-caso>.md`. Si la variable no está puesta, el default es
`~/.starteria/<nombre-del-repo>/`.

Buscá el caso en `$STARTERIA_STATE_ROOT/casos/`. **Si no está ahí, decilo y seguí igual** con lo que
te hayan pasado: puede que lo hayan escrito antes de que la cadena existiera. Que falte el artefacto
anterior es información, no un motivo para no trabajar.

## Lo que no hacés acá

- **No corrés el caso.** Para eso está `/starteria-probar`, y correrlo acá arruina las dos cosas.
- **No editás el caso en silencio.** Escribí el ajuste concreto en la revisión y devolvelo; el caso
  lo cambia quien lo escribió, que es quien habló con el usuario.
- **No puntuás al agente.** Un `AJUSTAR` habla del caso, nunca del comportamiento.
- **No convertís un `HALLAZGO` en un `AJUSTAR`** para que la tanda quede limpia. Acomodar lo
  esperado hasta que el caso pase es cómo un hueco del contrato se vuelve invisible.
