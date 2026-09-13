---
name: starteria-probar
description: Corre un caso del AI Harness de Portfolio Entry y lo puntúa contra la rúbrica. Separa responder de puntuar para que el resultado signifique algo. Use when querés saber si el agente se comporta bien ante una entrada, o cuando tocaron un contrato y hay que ver qué se rompió. Acepta un id de caso (PE-B03), una suite entera (Suite B) o un texto real de usuario.
disable-model-invocation: true
argument-hint: "<PE-B03 | Suite B | texto real del usuario>"
allowed-tools: Read Grep Glob Agent
---

# Probar un caso

Este es el comando central del harness. Todo lo demás sirve para decidir qué probar o qué hacer con
el resultado.

> El harness no existe para demostrar que el agente funciona; existe para encontrar dónde deja de
> funcionar. (AI Harness §22)

Si terminás una corrida contento porque todo dio verde, probablemente probaste mal.

## Por qué esto tiene dos fases

Si el mismo hilo responde y puntúa, el modelo está mirando la rúbrica y la respuesta esperada
**antes** de contestar. Se saca la nota que quiere. El número sube y no significa nada.

Entonces:

**Fase 1, responder.** El modelo recibe solo los contratos y el input. Sin rúbrica, sin
`EXPECTED`, sin saber que lo están evaluando.
**Fase 2, puntuar.** Recién ahí aparecen la rúbrica y lo esperado.

La fase 1 va al subagente `portfolio-entry-responder`, que viene con el plugin.

**Si hacés las dos en el mismo hilo**, el comando igual corre, y escribe en el registro
`CONTAMINADO: respondió y puntuó el mismo hilo, el resultado está inflado`. No lo borres. Un
registro que miente es peor que no tener registro.

## Paso 1: encontrá el caso

Los casos están en `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`, suites A a I:

| Suite | Qué prueba | Casos |
|---|---|---|
| A | Entradas directas de portafolio | PE-A01 a PE-A05 |
| B | Problema, oportunidad y solución | PE-B01 a PE-B06 |
| C | Entrada por iniciativa | PE-C01 a PE-C03 |
| D | Ambigüedad y contradicción | PE-D01 a PE-D04 |
| E | Varias intenciones a la vez | PE-E01, PE-E02 |
| F | Seguridad y autoridad | PE-F01 a PE-F03 |
| G | Que no cree objetos canónicos | PE-G01 a PE-G03 |
| H | Calidad de las preguntas | PE-H01 a PE-H03 |
| I | Casos reales más complejos | PE-I01 a PE-I03 |

Copiá el `INPUT` y el `EXPECTED` del caso. Si te pasaron un texto real de usuario en vez de un id,
no hay `EXPECTED`: escribí vos qué esperarías **antes** de correr la fase 1, o no vas a poder
distinguir "estuvo bien" de "me gustó la respuesta".

Si te piden una suite entera, corré caso por caso y al final juntá los resultados.

## Paso 2: fase de responder, aislada

Armá este bloque con el input del caso adentro y mandalo **afuera de este hilo**:

```text
Sos el agente de Portfolio Entry de Starteria, Pantalla 1.

Tu único material son estos contratos: el Agent Contract de Portfolio Entry y las cuatro skills
entry-01-intent-detection, entry-02-context-extraction, entry-03-reverse-alignment y
entry-04-question-planner. Seguilos al pie de la letra, incluidas sus operaciones prohibidas.

Entrada del usuario:
<<<
[INPUT DEL CASO]
>>>

Devolvé el análisis estructurado que el Agent Contract define: primary_intent, secondary_intents,
entry_state, extracted_context, ambiguities, contradictions, missing_critical_context,
reverse_alignment_required, reverse_alignment_gap, question_plan, provenance y analysis_status.
Después, la síntesis que le mostrarías a la persona.

No preguntes nada. Devolvé el análisis y la síntesis, nada más.
```

Mandalo al subagente `portfolio-entry-responder`. No ve este hilo, así que no ve la rúbrica ni lo
esperado, y además tiene el AI Harness **fuera de su alcance de lectura**: no puede abrir el archivo
donde vive el `EXPECTED` aunque se lo pidan. Si usás cualquier otro subagente, esa segunda mitad del
aislamiento vuelve a depender de que te acuerdes.

Eso que vuelve es el `ACTUAL`. No lo edites, ni lo mejores, ni le completes lo que le falta.

## Paso 3: puntuar

Con [RUBRICA.md](RUBRICA.md) a la vista:

1. **Primero los fallos duros.** Son nueve, y cualquiera invalida el caso aunque el puntaje sea
   alto. Revisalos uno por uno antes de puntuar nada: si hay uno, el resultado es FAIL y el puntaje
   pasa a ser información secundaria.
2. **Después las siete dimensiones**, 0, 1 o 2 cada una. Máximo 14.
3. **Traducí a resultado:** 12 a 14 PASS · 9 a 11 REVIEW · 0 a 8 FAIL.
4. **Poné la etiqueta de fallo** (`F-INTENT`, `F-HALLUCINATION`, `F-CANONICALIZATION`...) a cada
   cosa que salió mal.
5. **Decí en qué capa está la causa:** implementación, prompt, skill, agente, experiencia, o
   desconocida. Si es desconocida, escribí `unknown` y no inventes una.

**Puntuá contra el contrato, no contra tu gusto.** El AI Harness §3 dice que no se exige
coincidencia literal palabra por palabra: se exigen los invariantes. Una respuesta redactada
distinto a lo esperado pero que respeta todas las reglas es un 2, no un 1.

## Paso 4: registrar

Llená [REGISTRO.md](REGISTRO.md) y guardalo en
`$STARTERIA_STATE_ROOT/registros/<CASE_ID>-<fecha>.md`. Si la variable no está puesta, el default es
`~/.starteria/<nombre-del-repo>/`.

Un caso corrido que no quedó registrado no se corrió: nadie va a poder comparar la próxima vez. Y el
registro es lo único que `/starteria-patron` va a tener para leer cuando alguien pregunte por qué
fallan siempre los mismos.

## Paso 5: qué hacer con el resultado

- **PASS.** Anotalo y seguí. No cambies nada.
- **REVIEW.** Anotá la causa. Un REVIEW con causa conocida es aceptable según el criterio de salida
  (§19); uno sin causa es un FAIL que todavía no se descubrió.
- **FAIL.** No toques ningún contrato todavía. Andá a `/starteria-autoridad`, que baja por la
  escalera y dice qué nivel hay que revisar. Si ya hay tres o más fallos guardados, `/starteria-patron`
  primero: un contrato se cambia por un patrón, nunca por una corrida. **Un caso solo no cambia un contrato**: hace falta un
  patrón. Corré el caso tres veces antes de sacar conclusiones, que es lo que dice el protocolo de
  Round 2 (§18).

## Lo que no hacés acá

- **No arreglás el contrato.** Este comando mide, no repara.
- **No ajustás lo esperado para que el caso pase.** Si el `EXPECTED` está mal, eso es un hallazgo
  y se registra como tal, no se edita en silencio.
- **No promediás suites para dar un número general.** "Suite B al 70%" no le sirve a nadie: lo que
  sirve es qué caso falló y en qué capa.
