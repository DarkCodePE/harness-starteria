---
name: starteria-patron
description: Lee varios registros de corridas y busca la causa común entre los que fallaron, en vez de mirarlos de a uno. Use when se acumularon corridas y nadie las volvió a mirar, cuando tres casos distintos fallaron y sospechás que es lo mismo, o antes de decidir qué contrato se toca. No use when hay un solo registro: con uno no hay patrón, hay un caso.
disable-model-invocation: true
argument-hint: "[qué sospechás, o vacío para que agrupe todo]"
allowed-tools: Read Grep Glob
---

# Buscar la causa común entre varias corridas

Un caso que falla te dice que algo se rompió. Cuarenta que fallaron te dicen **qué** se rompió.

La diferencia entre las dos cosas es la única razón por la que vale la pena guardar registros, y es
trabajo que nadie hace, porque nadie se sienta a leer cuarenta archivos. Este comando existe para
eso y para nada más.

## La regla que hace que esto sirva: un patrón que no predice no es un patrón

Tres casos que fallaron siempre se parecen en algo. Encontrar ese algo es fácil y casi siempre es
una coincidencia con nombre lindo.

Un patrón de verdad **predice**. Si no podés nombrar un caso que todavía no se corrió y decir "este
también va a fallar, por esto", lo que encontraste no es una causa: es un resumen de lo que ya
sabías. Y un resumen presentado como causa hace que alguien toque un contrato por la razón
equivocada.

Por eso el paso 4 no es opcional.

## Los pasos

**1. Juntá los registros.** Necesitás al menos tres corridas con resultado `FAIL` o `REVIEW`. Con
menos no sigas: decilo y ofrecé volver cuando haya más.

**2. Agrupá por causa, no por síntoma.** La capa que el registro declara (implementación, prompt,
skill, agente, experiencia) **no es la causa**: es dónde se vio. Tres casos que dicen "capa: prompt"
pueden tener tres causas distintas, y dos que declaran capas distintas pueden ser el mismo problema
visto desde dos lados.

Lo que agrupa es el **mecanismo**: qué hizo el agente, con qué clase de input, y qué invariante se
cayó. Escribilo en una frase que empiece con "cuando".

**3. Contá contra qué se apoya.** Listá los `CASE_ID` que sostienen el patrón, y **los que lo
contradicen**: casos del mismo tipo que pasaron. Un patrón con tres a favor y cinco en contra no es
un patrón, y omitir los cinco es cómo se fabrica uno.

**4. Ponelo a prueba.** Nombrá un caso que **todavía no se corrió** y que, si el patrón es cierto,
tiene que fallar. Corrélo con `/starteria-probar`.

- Falló como predijiste → el patrón se sostiene, y ahora tiene un caso nuevo que lo prueba.
- Pasó → **el patrón está mal**. Escribilo igual, marcado como refutado, con el caso que lo refutó.
  Un patrón refutado y anotado le ahorra la vuelta entera a la próxima persona.

**5. Escribí el patrón** y decí qué nivel tendría que resolverlo, sin resolverlo vos.

## Cómo juntás los registros

Preguntale al cerebro, que es lo que indexa el estado del harness:

```text
gbrain query "casos de Portfolio Entry que fallaron, agrupados por qué hizo el agente"
```

El cerebro indexa `$STARTERIA_STATE_ROOT`, nunca `doc/`: los contratos se citan en vivo desde su
archivo, porque una copia indexada de un contrato se pone vieja sin avisar.

**Si gbrain no está instalado**, leé `$STARTERIA_STATE_ROOT/registros/` a mano y decí que lo hiciste
así. Funciona hasta unos quince registros; de ahí para arriba vas a saltear sin darte cuenta, y
saltear registros es exactamente cómo se inventa un patrón que no existe.

## Dónde queda

Escribí el patrón en `$STARTERIA_STATE_ROOT/patrones/<slug>.md`. Si la variable no está puesta, el
default es `~/.starteria/<nombre-del-repo>/`.

**Si no hay registros todavía**, decilo y pará: este comando no tiene nada que leer. No es un error
de la cadena, es que todavía nadie corrió nada.

## Lo que no hacés acá

- **No arreglás nada.** Un patrón ubica la causa; cambiarla es una decisión y va por
  `/starteria-autoridad` y después `/starteria-decision`.
- **No inventás un patrón porque hacía falta uno.** "No hay causa común, son tres problemas
  distintos" es un resultado válido y es el más común.
- **No lo declarás confirmado sin el paso 4.** Un patrón sin caso que lo ponga a prueba es una
  hipótesis con confianza de más.
- **No escondés los casos que lo contradicen.** Son la parte más útil del archivo.
