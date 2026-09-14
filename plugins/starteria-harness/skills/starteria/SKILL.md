---
name: starteria
description: Mapa del harness de Starteria. Dada tu situación, te dice qué comando corresponde. Empezá siempre por acá si no sabés cuál usar.
disable-model-invocation: true
argument-hint: "[tu situación en una línea]"
allowed-tools: Read Grep Glob
---

# Starteria, el mapa

No hace falta que te acuerdes de los diez comandos. Preguntá acá.

Este harness cubre **Portfolio Entry**: la Pantalla 1 (la persona escribe lo que quiere) y el pase
a la Pantalla 2. Nada más, todavía. El resto de Starteria no tiene contratos escritos, y un harness
sobre contratos que no existen es teatro.

## Regla de fondo, la que ordena todo lo demás

> La IA propone. La autoridad organizacional se queda con la persona.

Es el invariante INV-03 del Core Contract, y es la razón por la que ninguno de estos comandos
decide por vos. Interpretan, comparan, marcan huecos y recomiendan. Aprobar, confirmar y decidir
sigue siendo tuyo. Si algún comando parece estar decidiendo, está roto: decilo.

## Qué comando para qué situación

**Tenés una idea y no sabés si está clara.**
`/starteria-afilar`. Te entrevista por rondas: preguntas numeradas, cada una con la respuesta que
recomienda, y esperás a contestar antes de la siguiente. Los datos los busca el agente, las
decisiones las tomás vos. Es la puerta de entrada de casi todo.

**Querés cambiar algo y no sabés si podés.**
`/starteria-autoridad`. Le decís el cambio y te dice qué documento manda ahí, si choca con un
invariante, y si hace falta un ADR antes de tocar nada. Si hay conflicto, lo escribe en vez de
elegir una interpretación por su cuenta.

**Querés saber si el agente de Portfolio Entry se comporta bien.**
`/starteria-probar`. Corre un caso del AI Harness y lo puntúa: siete dimensiones, catorce puntos,
más una lista de fallos que invalidan el caso aunque el puntaje sea alto. Es el comando central de
todo esto.

**Un usuario real dijo algo que el harness no cubre.**
`/starteria-caso`. Convierte esa conversación en un caso nuevo, con su input, lo que se espera y lo
que tiene prohibido hacer. Es el Round 3 del protocolo del AI Harness, y es trabajo que solo puede
hacer alguien que habla con usuarios.

**Escribiste un caso y todavía no lo corriste.**
`/starteria-revisar`. Chequea si el caso mide lo que dice medir, antes de que su resultado cuente
para algo. Un caso mal construido no falla: pasa, y te deja más tranquilo que antes.

**Se acumularon corridas fallidas y nadie las miró juntas.**
`/starteria-patron`. Busca la causa común entre varios registros y la pone a prueba con un caso que
todavía no se corrió. Un contrato se cambia por un patrón, nunca por una corrida suelta.

**Tomaron una decisión que cambia una regla.**
`/starteria-decision`. La deja registrada como ADR, en lenguaje de producto. Sin esto, la decisión
vive en un chat que nadie va a volver a abrir.

**Se termina la sesión y hay cosas a medio hacer.**
`/starteria-cierre`. Deja escrito en qué quedaste, para que la próxima sesión no arranque de cero.

**No entendés una palabra.**
`/starteria-glosario`, aunque normalmente no vas a necesitar invocarlo: salta solo cuando preguntás
qué significa algo. `provenance`, `entry_state`, "objeto canónico", *reverse alignment*,
*solution-first*: todo eso está traducido en [GLOSARIO.md](GLOSARIO.md).

## El recorrido normal

```text
/starteria-afilar          afilás la idea
        ↓
/starteria-autoridad       chequeás contra qué contrato choca
        ↓
/starteria-caso            escribís el caso que faltaba
        ↓
/starteria-revisar         chequeás que el caso mida lo que dice medir
        ↓
/starteria-probar          probás el comportamiento
        ↓
/starteria-patron          buscás la causa común entre varias corridas
        ↓
/starteria-decision        registrás lo que se decidió cambiar
        ↓
/starteria-cierre          dejás el estado escrito
```

No es obligatorio pasar por todos. Es el orden en que se necesitan.

## Dónde queda lo que hacés

Cada comando deja su resultado en un archivo y el siguiente lo levanta. Todo eso vive en
`$STARTERIA_STATE_ROOT`, afuera de este repo, con `~/.starteria/<nombre-del-repo>/` como default:

```text
entendimiento/  conflictos/  casos/  revisiones/  registros/  patrones/  BITACORA.md
```

Está afuera del repo porque los registros tienen conversaciones reales de usuarios, y esas no tienen
por qué quedar publicadas en la historia de un repositorio.

Que un comando no encuentre el archivo del anterior **no lo frena**: lo dice y sigue con lo que le
des. Encadenar no es poner una puerta.

## Qué NO hace este harness

- **No verifica nada solo.** No hay scripts, no hay chequeos automáticos, no hay nada que corra
  mientras no estés. Si nadie corre `/starteria-probar`, nadie sabe si el agente se rompió. Está
  dicho a propósito: preferimos que sepas que la verificación depende de vos, antes que un tilde
  verde que nadie miró.
- **No decide qué modelo, qué proveedor, qué base de datos ni qué framework.** Eso es Tech Spec, y
  el AI Harness §20 lo deja explícitamente fuera.
- **No cubre Steps 0 a 4, ni el portafolio completo, ni las otras siete pantallas del Crazy 8s.**

## Dónde vive cada documento

Los comandos citan `doc/` en vez de copiarlo. Cuál de los nueve archivos manda en cada nivel está
en [MAPA-DE-DOCUMENTOS.md](MAPA-DE-DOCUMENTOS.md), que además marca los dos documentos que el
harness da por existentes y todavía no están escritos.

## Si querés saber por qué está hecho así

`docs/` tiene el PRD, el modelo de dominio, la arquitectura, los ciclos de vida y los diez ADR con
las decisiones y su costo. No hace falta leerlo para usar los comandos. Hace falta para cambiarlos.

