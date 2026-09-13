---
name: starteria-caso
description: Convierte una conversación real de un usuario en un caso nuevo del AI Harness, con su input, lo esperado y lo que tiene prohibido hacer. Use when alguien dijo algo que las suites A a I no cubren, o cuando una entrada real rompió algo que las pruebas armadas no detectaban.
disable-model-invocation: true
argument-hint: "<el texto real del usuario, sin limpiar>"
allowed-tools: Read Grep Glob
---

# Convertir una conversación real en un caso

Las suites A a I las escribió alguien pensando qué podría pasar. Los usuarios hacen otra cosa.
Este comando cierra esa distancia, y es trabajo que solo puede hacer alguien que habla con usuarios:
el protocolo del AI Harness lo llama Round 3, y es donde aparece lo que nadie había previsto.

## La regla que hace que el caso sirva: no limpies el texto

El input del caso es **lo que la persona escribió, tal cual**. Con las faltas, las vueltas, la parte
del medio que no se entiende y el pedido que cambia a mitad de camino.

Si lo ordenás, dejaste de probar el caso difícil y empezaste a probar uno fácil. El desorden **es**
la prueba. La única edición permitida es sacar datos personales o nombres de clientes, y cuando lo
hagas, decilo abajo del input.

## Los pasos

**1. Buscá si ya está cubierto.** Leé el índice de suites en
`doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`. Si un caso ya prueba lo mismo, no agregues un duplicado:
decilo, y si el caso real es una variante más dura, anotalo como variante del existente.

**2. Elegí la suite y el id.**

| Suite | Va acá si el input... | Id |
|---|---|---|
| A | Entra directo por meta, portafolio, seguimiento, reporte o priorización | `PE-A0n` |
| B | Trae un problema, una oportunidad o una solución ya elegida | `PE-B0n` |
| C | Entra nombrando una iniciativa | `PE-C0n` |
| D | Es ambiguo, o se contradice a sí mismo | `PE-D0n` |
| E | Pide dos cosas a la vez | `PE-E0n` |
| F | Intenta que el sistema haga algo que no le corresponde | `PE-F0n` |
| G | Pide crear o confirmar algo del portafolio | `PE-G0n` |
| H | Sirve para probar si las preguntas son buenas | `PE-H0n` |
| I | Es largo, enredado y realista | `PE-I0n` |

Numeralo siguiendo el último de esa suite. Si dudás entre dos, va a **I**: los casos reales
complejos son suyos.

**3. Escribí lo esperado, desde el contrato.**

Acá está el error que arruina el caso: escribir como esperado **lo que el agente contestó**. Eso no
es una prueba, es una foto. Lo esperado sale de leer el Agent Contract y las cuatro skills
`entry-0X` y preguntarte qué **deberían** producir con este input, exista o no el comportamiento hoy.

Un caso cuyo esperado se copió de la salida actual nunca va a fallar, y por lo tanto nunca va a
enseñar nada.

**4. Escribí lo prohibido.** Qué no puede hacer el agente con **este** input en concreto. Los nueve
fallos duros aplican siempre y no hace falta repetirlos; lo que va acá es lo específico. Ejemplo: si
la persona nombró una iniciativa, lo prohibido concreto es proponer crearla.

**5. Llená [PLANTILLA.md](PLANTILLA.md)** (en ChatGPT: `starteria-caso-PLANTILLA.md`).

**6. Corré el caso recién escrito** con `/starteria-probar`. Un caso que nadie corrió no se sabe si
está bien planteado, y el momento de descubrirlo es ahora, no dentro de tres meses.

## Cuando no sepas qué esperar

Pasa, y es información. Si al leer los contratos no queda claro qué debería hacer el agente con este
input, **el hueco no está en el caso, está en el contrato**. Escribí el caso igual, dejá el esperado
marcado como abierto con la pregunta concreta que falta responder, y mandá a `/starteria-autoridad`
para ubicar qué nivel tendría que resolverla.

Eso es un hallazgo bueno. Un caso real que ningún contrato sabe cómo contestar vale más que diez
casos que confirman lo que ya sabíamos.

## Lo que no hacés acá

- **No arreglás el input** para que quede prolijo.
- **No copiás la respuesta actual como esperada.**
- **No agregás el caso a `doc/`.** El AI Harness es un documento con autoridad: sumar un caso es un
  cambio de contrato. Devolvé el caso escrito y que lo integre quien corresponda.
- **No inventes un usuario.** Si no hubo conversación real, esto no es un caso de Round 3, es un
  caso armado, y va con las suites de siempre.
