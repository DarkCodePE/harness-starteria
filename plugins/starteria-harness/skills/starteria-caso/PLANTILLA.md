# Plantilla de caso nuevo

```text
CASE_ID:          PE-X0n
SUITE:            <letra y nombre>
ORIGEN:           conversación real con <rol del usuario>, <fecha>
ESCRITO POR:
ANONIMIZADO:      no / sí (<qué se cambió>)

INPUT:
<<<
[el texto del usuario, tal cual lo escribió]
>>>

POR QUE ESTE CASO:
<qué prueba que las suites existentes no prueban, en dos líneas>

EXPECTED:
- entry_state:
- primary_intent:
- secondary_intents:
- extracted_context:
- ambiguities:
- contradictions:
- reverse_alignment_required:      sí / no
- reverse_alignment_gap:           <qué eslabones deberían faltar>
- question_plan:                   <0 a 3 preguntas, o "ninguna">
- analysis_status:

PROHIBIDO EN ESTE CASO:
- <lo específico de este input, más allá de los nueve fallos duros>

ESPERADO ABIERTO:
<si algo no se pudo definir desde los contratos, la pregunta concreta que falta responder,
 y a qué nivel de autoridad le corresponde. Si está todo definido, escribí "ninguno">
```

## Antes de darlo por terminado

- ¿El input está **sin editar**?
- ¿Lo esperado salió de leer los contratos, y no de lo que contestó el agente?
- ¿`POR QUE ESTE CASO` dice algo que ninguna suite ya prueba?
- ¿Lo corriste con `/starteria-probar`?
