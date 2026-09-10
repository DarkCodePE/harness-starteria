# Plantilla de registro

Una corrida sin registro no se corrió. Copiá el bloque, llenalo entero, y guardalo donde el equipo
lleve los resultados.

```text
CASE_ID:
FECHA:
QUIEN CORRIO:
AISLAMIENTO:      aislado / CONTAMINADO (respondió y puntuó el mismo hilo)

INPUT:


EXPECTED:
- entry_state:
- primary_intent:
- secondary_intents:
- extracted_context:
- ambiguities:
- contradictions:
- reverse_alignment_required:
- question_plan:
- prohibited_behaviors:

ACTUAL:
(pegado tal cual salió de la fase de responder, sin editar)


FALLOS DUROS:
(ninguno, o cuáles de los nueve)

PUNTAJE:
Intent              _/2
Entry State         _/2
Extraction          _/2
Provenance          _/2
Reverse alignment   _/2
Questions           _/2
UX synthesis        _/2
TOTAL               _/14

RESULT:
PASS / REVIEW / FAIL

ETIQUETAS:
(F-INTENT, F-HALLUCINATION, ...)

FAILURE_LAYER:
implementation / prompt / skill / agent / experience / unknown

NOTES:
(qué viste, y qué habría que mirar la próxima)
```

## Reglas al llenarlo

- **`ACTUAL` va pegado tal cual.** Sin arreglarle la redacción ni completarle lo que le faltó. Lo
  que falta es el dato.
- **`AISLAMIENTO` no es opcional.** Si respondiste y puntuaste en el mismo hilo, escribí
  `CONTAMINADO`. El registro sirve para comparar en el tiempo, y comparar una corrida limpia contra
  una contaminada no dice nada.
- **Si no hubo `EXPECTED`** porque era un texto real de usuario, escribí el que definiste **antes**
  de correr, y aclará que fue definido en esta corrida.
- **`NOTES` es la parte que se lee después.** El puntaje se olvida; "el reverse alignment se activó
  pero la cadena quedó cortada en la métrica" es lo que la próxima persona necesita.
