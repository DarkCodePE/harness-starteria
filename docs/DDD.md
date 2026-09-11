# Modelo de dominio del harness

**Versión:** v0.1
**Fecha:** 2026-09-10

Los ocho comandos son un sistema y no ocho prompts sueltos porque comparten estos conceptos. Este
documento los nombra, dice cómo se relacionan y cuáles son las reglas que no se negocian.

## 1. La frontera que hay que tener clara

Hay **dos dominios** y se tocan sin mezclarse:

| Dominio del producto (Starteria) | Dominio del harness (esta herramienta) |
|---|---|
| Organización, Frente Estratégico, Reto, Iniciativa, Step, Evidencia, Decisión | Caso, Corrida, Registro, Fallo, Conflicto, ADR, Sesión, Bitácora |
| Vive en `doc/`, gobernado por el Core Contract | Vive en `skills/starteria*` y `docs/` |
| Lo cambia una persona con autoridad, vía ADR de producto | Lo cambia quien mantiene el harness, vía ADR de harness |

**El harness nombra los objetos del producto pero nunca los crea ni los modifica.** Un comando
puede decir "esto propone crear una Iniciativa, y eso está prohibido"; ninguno crea una Iniciativa.
Es la misma frontera que el Agent Contract §16 le pone a la Pantalla 1, aplicada un nivel más
arriba.

Cuando este documento dice "Iniciativa" habla del objeto del producto. Cuando dice "Caso" habla del
objeto del harness. No hay un tercer lugar.

## 2. Los conceptos del harness

### Caso
Una entrada de usuario con lo que se espera que el agente haga con ella. Tiene id (`PE-B03`),
suite (A a I), `INPUT`, `EXPECTED` y una lista de comportamientos prohibidos propios.

Los treinta y dos casos existentes viven en `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`, que es un
documento con autoridad. El harness **lee** casos y **redacta** casos nuevos, pero no los integra:
sumar un caso es un cambio de contrato y lo hace una persona.

Un Caso sin `EXPECTED` derivado del contrato no es un Caso, es una foto de lo que el agente
contestó una vez.

### Corrida
Una ejecución de un Caso en un momento dado. Produce un `ACTUAL`.

Una Corrida tiene un atributo que la define y que casi nunca se registra en otras herramientas:
**aislamiento**. Es `aislado` cuando quien respondió no vio la rúbrica ni el `EXPECTED`, y
`CONTAMINADO` cuando sí. Dos Corridas con distinto aislamiento **no son comparables**, y por eso el
aislamiento vive en la Corrida y no en una nota al pie.

Un Caso tiene muchas Corridas. Una Corrida pertenece a un Caso.

### Registro
Lo que queda escrito de una Corrida: `EXPECTED`, `ACTUAL` sin editar, fallos duros encontrados,
puntaje por dimensión, resultado, etiquetas y capa de fallo.

**Una Corrida sin Registro no ocurrió.** No es una regla moral: sin Registro no hay contra qué
comparar la siguiente, y el harness existe para ver cómo se mueve el comportamiento en el tiempo.

### Fallo
Algo que salió mal. Tiene dos clasificaciones **independientes**, y confundirlas es el error más
común al leer un Registro:

- **Etiqueta** (`F-HALLUCINATION`, `F-CANONICALIZATION`, ...): *qué* salió mal. Once valores. Un
  Registro puede llevar varias.
- **Capa** (`implementation`, `prompt`, `skill`, `agent`, `experience`, `unknown`): *dónde está la
  causa*. Seis valores. Un Registro lleva **una**, la más baja que explique lo que pasó.

**El Fallo duro es otra cosa.** No es una etiqueta con más peso: es una condición que invalida la
Corrida entera sin importar el puntaje. Son nueve, están en el AI Harness §3, y la relación es
lógica y no aritmética: un fallo duro convierte el resultado en FAIL aunque el puntaje sea 14.

### Resultado
`PASS` (12 a 14), `REVIEW` (9 a 11), `FAIL` (0 a 8), **o `FAIL` por fallo duro**. Se deriva, no se
elige.

Un `REVIEW` con causa conocida es aceptable según el criterio de salida. Uno sin causa es un `FAIL`
que todavía no se descubrió.

### Conflicto
Dos fuentes que dicen cosas distintas: un contrato contra otro contrato, o un contrato contra algo
que se propone. Se escribe entero, con las dos lecturas, y **se deja abierto**.

Un Conflicto resuelto en silencio deja de ser un Conflicto y pasa a ser una regla nueva que nadie
decidió. Por eso el harness lo escribe y no lo cierra.

### Nivel de autoridad
De 1 a 9, del Core Contract hasta la implementación. Cada documento de `doc/` ocupa uno, y el mapa
está en `skills/starteria/MAPA-DE-DOCUMENTOS.md`.

**Cuando dos fuentes chocan, gana el nivel más bajo en número.** Un mockup (8) no cambia un
invariante (1) por existir.

Hay tres niveles con documento faltante, y eso es parte del modelo, no un error de captura: el
nivel 3 está vacío y las preguntas de experiencia se están resolviendo un nivel más abajo del que
les corresponde.

### Decisión y ADR
Una Decisión cambia una regla. El ADR es su registro escrito.

Estados: `propuesto`, `aceptado`, `rechazado`, `reemplazado por ADR-XXX`.

**La transición a `aceptado` la hace una persona, nunca la herramienta.** El harness redacta en
`propuesto`, y puede transcribir una aprobación que una persona dio en esa conversación, con nombre
y fecha. No puede producir una que nadie dio. Si el ADR tiene preguntas abiertas adentro, no puede
estar en `aceptado`: una firma sobre un hueco es peor que un hueco.

Hay **dos series de ADR** y no se mezclan: los de producto (cambian una regla de Starteria, formato
del Development Harness §4.6) y los de harness (cambian cómo funciona esta herramienta, formato de
`docs/adr/`). `ADR-001` de una serie no tiene nada que ver con `ADR-001` de la otra.

### Sesión y Bitácora
La Sesión es una conversación de trabajo. La Bitácora es lo único que la sobrevive.

Lo que no entra a la Bitácora se perdió: no hay tablero, ni tracker, ni historial que alguien vaya
a leer. La Bitácora se llena a mano, al cerrar, y nada avisa si nadie la llenó.

### Término
Una palabra de los contratos con su traducción a español llano y el puntero a su definición formal.

Un Término que se usa en `doc/` y no está definido en ningún lado es un hallazgo: es la clase de
ambigüedad que después se resuelve por suposición.

## 3. Cómo se relacionan

```text
Nivel de autoridad ──gobierna──> Caso ──se ejecuta en──> Corrida ──deja──> Registro
        │                          │                         │                │
        │                          │                    aislamiento      Fallo (etiqueta + capa)
        │                          │                                          │
        │                          └──nace de──> conversación real            │
        │                                                                     ▼
        └──se compara y produce──> Conflicto ──puede requerir──> Decisión ──se registra──> ADR
                                                                     │
                                                                     ▼
                          Sesión ──cierra en──> Bitácora <──apunta a── todo lo anterior
```

## 4. Las reglas que no se negocian

Son las del harness. Las del producto están en el Core Contract y son otras trece.

| # | Regla | Por qué |
|---|---|---|
| H-01 | La herramienta propone, la persona decide | INV-03 aplicado a la herramienta que gobierna INV-03 |
| H-02 | Una Corrida declara su aislamiento, siempre | Sin eso, comparar dos Corridas no significa nada |
| H-03 | El `ACTUAL` se registra sin editar | Lo que le falta a la respuesta es el dato |
| H-04 | Un Conflicto se escribe, no se resuelve eligiendo | Elegir en silencio crea una regla que nadie decidió |
| H-05 | Un ADR llega a `aceptado` solo por una persona | Un ADR aceptado es literalmente una aprobación |
| H-06 | Un cambio de contrato sale de un patrón, no de una Corrida | El AI Harness §17 lo dice y es el error más caro |
| H-07 | El harness no escribe en `doc/` | Los contratos los cambia una persona |
| H-08 | El `EXPECTED` sale del contrato, nunca del `ACTUAL` | Un Caso con el esperado copiado nunca va a fallar |
| H-09 | Lo derivado nunca gana sobre `doc/` | El glosario y el mapa son ayudas, no autoridad |

## 5. Palabras que este harness no usa

Vocabulario que se evitó a propósito, porque el usuario primario no es técnico y cada palabra que
no entiende es una razón para no volver a abrir la herramienta:

*branch*, *commit*, *pull request*, *merge*, *test suite*, *CI*, *pipeline*, *deploy*, *allowlist*,
*schema*, *endpoint*, *hook*, *subagente* fuera del único lugar donde hace falta.

Donde un término del contrato es inevitable (`entry_state`, `provenance`, `AI_INFERRED`), la regla
es explicarlo **en la misma línea** en que aparece. Mandar a alguien al glosario a mitad de una
frase es perderlo.
