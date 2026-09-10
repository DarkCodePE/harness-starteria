---
id: ADR-002
title: "`/starteria-probar` separa responder de puntuar, y declara la contaminación cuando no se separa"
status: proposed
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "primera corrida real de una suite entera: si el paso de dos fases hace que nadie corra nada, la decisión falló"
tags: [harness, evaluacion, sesgo]
---

# ADR-002: `/starteria-probar` separa responder de puntuar, y declara la contaminación cuando no se separa

## 1. Contexto y problema

`/starteria-probar` es el comando central: corre un caso del AI Harness y lo puntúa contra siete
dimensiones y nueve fallos duros.

Lo obvio es hacerlo en un solo hilo: leer el caso, contestar, puntuar. Y es exactamente lo que
arruina el resultado. El `EXPECTED` y la rúbrica estarían en el contexto **antes** de que el modelo
conteste, así que produce la respuesta que la rúbrica premia. El puntaje sube y no mide el
comportamiento del agente: mide que el modelo sabe leer una rúbrica.

Con la agravante de que el número **parece** bueno. Un harness que produce verdes falsos es peor
que no tener harness: da confianza donde no la hay.

## 2. Decisión

**Dos fases, con la de responder afuera del hilo que puntúa.**

1. **Responder.** Recibe el Agent Contract, las cuatro `entry-0X` y el `INPUT`. No recibe la
   rúbrica, ni el `EXPECTED`, ni la información de que lo están evaluando. En Claude Code va a un
   subagente; en ChatGPT, a otro chat del mismo Proyecto.
2. **Puntuar.** En el hilo principal, con la rúbrica y lo esperado a la vista.

**Y cuando alguien no separa, el comando corre igual y escribe `CONTAMINADO` en el registro.** No
lo impide: lo declara. Una corrida contaminada no se compara de igual a igual con una limpia, y por
eso el aislamiento es un campo obligatorio del registro y no una nota al pie.

## 3. Alternativas consideradas

- **Un solo hilo, confiando en que el modelo sea honesto:** rechazada. No es un problema de
  honestidad sino de contexto: lo que está en la ventana influye en lo que se genera, lo quiera o
  no.
- **Bloquear la corrida si no hay aislamiento:** rechazada. Sería un gate, contradice `ADR-003`, y
  en ChatGPT no hay forma de comprobarlo. Un gate que no puede verificar lo que exige es teatro.
- **Dos personas, una responde y otra puntúa:** rechazada por costo. Es lo ideal y nadie lo va a
  sostener. Un procedimiento que exige dos personas para cada uno de treinta y dos casos no se
  ejecuta.
- **Puntuación mecánica comparando `ACTUAL` contra `EXPECTED` campo por campo:** rechazada. El AI
  Harness §3 dice explícitamente que no se exige coincidencia literal, se exigen invariantes. Una
  comparación de texto reprobaría respuestas correctas redactadas distinto.

## 4. Consecuencias

**Positivas**
- El puntaje mide el comportamiento del agente, no la habilidad de leer una rúbrica.
- El registro dice si se puede comparar con corridas anteriores, que es lo que el harness necesita
  para ver movimiento en el tiempo.
- Funciona igual en los dos runtimes, con mecanismos distintos.

**Negativas y trade-offs aceptados**
- Correr un caso cuesta dos pasos en vez de uno, y en ChatGPT dos chats. Es fricción real, y es el
  riesgo principal de esta decisión: si hace que nadie corra nada, falló.
- Nada garantiza el aislamiento. Depende de que quien corre marque el campo con honestidad.
- El subagente no tiene forma de saber qué se le ocultó, así que tampoco puede avisar si alguien le
  pasó la rúbrica de más.

## 5. Criterios de aceptación de la decisión

- [x] `RUBRICA.md` no aparece en el bloque de la fase 1.
- [x] `REGISTRO.md` tiene `AISLAMIENTO` como campo obligatorio.
- [x] `PARA-CHATGPT.md` explica el flujo de dos chats.
- [ ] Una corrida real de `PE-B03` produce un registro `aislado`.
- [ ] Alguien corre una suite entera y dice si las dos fases son sostenibles.

## 6. Gatillos de revisión

La primera corrida de una suite completa. Si el paso extra hace que se abandone a mitad, hay que
buscar cómo abaratar el aislamiento en vez de resignarlo.

## Historial

- 2026-09-10 · proposed · nace de la pregunta de por qué un harness autocalificado da siempre verde.
