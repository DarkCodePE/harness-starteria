---
name: starteria-afilar
description: Entrevista por rondas para afilar una idea, una decisión o un cambio de Starteria antes de escribirlo. Preguntas numeradas, cada una con respuesta recomendada. Use when la idea todavía es difusa, o alguien te pidió "algo así" y no sabés qué es "así". No use when ya está claro y solo hay que escribirlo.
disable-model-invocation: true
argument-hint: "<la idea o el cambio a afilar>"
allowed-tools: Read Grep Glob
---

# Afilar una idea

Entrevistá a la persona hasta llegar a un entendimiento compartido. Sin escribir nada todavía: la
salida de esto es claridad, no un documento.

## Cómo se pregunta

Pensá el tema como un árbol: cada decisión abre las decisiones que cuelgan de ella. La **frontera**
son las decisiones cuyos requisitos ya están resueltos, o sea las preguntas que se pueden contestar
**ahora** sin adivinar respuestas que todavía no escuchaste.

Preguntá **toda la frontera en una ronda**, numerada, y esperá. Cada pregunta lleva tu respuesta
recomendada:

```text
❓ **P1 - <título de la pregunta>**: <la pregunta, con opciones si las hay>

➡️ <lo que recomendás, y por qué en una línea>
```

Cuando contesta, la frontera se corre: lo que quedó resuelto habilita preguntas que antes dependían
de eso. Recalculá y preguntá la ronda siguiente. Una pregunta cuya respuesta depende de otra que
está abierta **en esta misma ronda** va a la ronda siguiente, no a esta.

Terminaste cuando la frontera está vacía. Y no actúes hasta que la persona confirme que llegaron al
mismo entendimiento.

## La regla que hace que esto sirva: hecho o decisión

**Los hechos los buscás vos. Las decisiones son de la persona.**

| Es un hecho, buscalo | Es una decisión, preguntala |
|---|---|
| Qué dice el Core Contract sobre esto | Qué quiere lograr el negocio |
| Si ya hay un invariante que lo cubre | Qué se prioriza cuando dos cosas chocan |
| Qué valores admite `entry_state` o `intent` | Si vale la pena cambiar una regla |
| Si un caso del AI Harness ya cubre la situación | Qué se hace con un caso que falla |
| Qué skill (`entry-01` a `entry-04`) es responsable | Quién es el dueño de la decisión |
| Si el documento que citan existe en `doc/` | Cuándo se considera terminado |

Preguntarle a alguien de producto algo que está escrito en `doc/` le hace perder tiempo y encima
suele contestar de memoria, mal. Andá a buscarlo.

**Si estás en ChatGPT y el archivo no está subido**, no lo inventes: pedí que lo peguen, o marcá el
punto como pendiente y seguí con el resto de la frontera.

**Si estás en Claude Code**, leé `doc/` directamente. Podés mandar la búsqueda a un subagente y
seguir preguntando el resto de la frontera mientras tanto: solo esperan las preguntas que dependen
de ese dato.

## Lo que no podés hacer

- **No cierres una pregunta por la persona.** Si dice "no sé" o "lo tengo que ver con el equipo",
  escribí el motivo y dejala abierta, con nombre de quién la tiene que contestar. Una lista corta
  de preguntas abiertas honestas vale más que una lista completa que nadie puede defender.
- **No hagas veinte preguntas de una.** La frontera es la frontera, no todo lo que se te ocurre.
- **No propongas cambiar un invariante en el medio de la entrevista.** Si aparece que la idea choca
  con uno, decilo, dejá la pregunta abierta y mandá a `/starteria-autoridad`.
- **No escribas el contrato, el caso ni el ADR acá.** Eso es después, y son otros comandos.

## Además de lo obvio, preguntá esto

- **Qué queda afuera.** Que la persona diga qué **no** entra, no solo qué entra. El alcance sin
  bordes se estira solo.
- **Contra qué documento choca.** Si lo que están pidiendo contradice algo escrito, nombralo en vez
  de elegir una lectura. Esa es la entrada natural a `/starteria-autoridad`.
- **Cómo se sabría que salió mal.** Si nadie puede describir el resultado malo, todavía no está
  clara la idea.
- **Quién decide.** Casi siempre hay alguien que no está en la conversación y tiene la autoridad.
  Mejor saberlo ahora.

## Cuando termina

Escribí en cinco líneas el entendimiento al que llegaron, listá las preguntas que quedaron abiertas
con su dueño, y ofrecé el paso siguiente:

- ¿Choca con un contrato? → `/starteria-autoridad`
- ¿Hay que ver si el agente se comporta así? → `/starteria-probar`
- ¿Salió de una conversación real con un usuario? → `/starteria-caso`
- ¿Se decidió cambiar una regla? → `/starteria-decision`
