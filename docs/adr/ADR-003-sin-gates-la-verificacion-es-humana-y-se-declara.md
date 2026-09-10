---
id: ADR-003
title: "Sin gates: nada se verifica solo, y el harness lo dice en voz alta"
status: proposed
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "si pasan 3 meses sin una sola corrida registrada, la decisión se puso a prueba"
tags: [harness, verificacion, honestidad]
---

# ADR-003: Sin gates: nada se verifica solo, y el harness lo dice en voz alta

## 1. Contexto y problema

La rama del harness del BCR que sirvió de referencia es, literalmente, la del **retiro de gates y
ciclo autónomo**: quitaron el tracker y los chequeos automáticos, y el contrato quedó diciendo en
voz alta que "ya no queda nada en el repo que lo declare por su cuenta".

Para este harness la pregunta se repite: ¿se le pone alguna verificación mecánica?

Se podría. Un script podría comprobar que cada caso citado exista en `doc/`, que los `EXPECTED` no
estén vacíos, que cada registro tenga capa de fallo. Nada de eso es difícil.

## 2. Decisión

**Ninguna verificación automática. Y el harness declara en cada lugar donde importa que la
verificación depende de una persona.**

El router lo dice. El PRD lo dice. `RUBRICA.md` declara que si algo no coincide con `doc/`, gana
`doc/`, y que nadie compara. `LIFECYCLE.md` cierra con que ninguno de los cuatro ciclos tiene alarma.

## 3. Alternativas consideradas

- **Un chequeo mínimo en Node** (que los casos citados existan, que los registros estén completos):
  rechazada por dos razones. La primera es el usuario: alguien no técnico no instala Node, no corre
  scripts y no diagnostica por qué el script falló; un chequeo que no se puede ejecutar es un
  chequeo que no existe. La segunda es la asimetría de runtimes: en ChatGPT no hay dónde correrlo,
  así que la mitad de las corridas quedarían sin verificar y la otra mitad con verde, que es peor
  que ninguna.
- **Checklist firmada con nombre y fecha en cada cierre:** rechazada como obligación, adoptada
  parcialmente. Los registros piden quién corrió y cuándo, y los ADR piden owner con nombre. Lo que
  no hay es nada que rechace un cierre sin firma.
- **Gates de verdad, tipo G1 a G9 del BCR:** rechazada. Ese aparato existe para trabajo de código
  con builds y suites. Acá el objeto verificado es la interpretación de un modelo, que ninguna
  máquina puede aprobar.

## 4. Consecuencias

**Positivas**
- Cero instalación y cero mantenimiento. El harness es markdown y funciona en cualquier chat.
- No hay verdes falsos, que es el fracaso más caro de un harness: el que da confianza sin mirar.
- Es coherente con INV-03. Un harness que gobierna "la IA propone y la persona decide" no puede
  fundarse en que un script decida.

**Negativas y trade-offs aceptados**
- **Si nadie corre `/starteria-probar`, nadie se entera de nada.** No hay aviso, no hay alerta, no
  hay tarea pendiente. Este es el costo, y es grande.
- Los documentos derivados (`GLOSARIO.md`, `MAPA-DE-DOCUMENTOS.md`, `RUBRICA.md`) pueden quedar
  viejos respecto de `doc/` sin que nada lo detecte.
- Un registro incompleto, un `EXPECTED` copiado del `ACTUAL` o un aislamiento mal declarado pasan
  sin fricción.

Esos tres se contienen diciéndolos. Es menos que un chequeo y es más que nada: alguien que lee el
harness sabe exactamente qué no está mirado.

## 5. Criterios de aceptación de la decisión

- [x] El router declara que nada corre solo.
- [x] `RUBRICA.md` declara que `doc/` gana y que nadie compara.
- [x] `LIFECYCLE.md` declara que ningún ciclo tiene alarma.
- [x] No hay scripts, hooks ni dependencias de Node en el harness.

## 6. Gatillos de revisión

Si pasan tres meses sin una corrida registrada, la decisión se puso a prueba: la ausencia de gates
habrá pasado de honestidad a abandono. Ahí conviene discutir el chequeo mínimo, sabiendo que
contradice este ADR y necesita uno que lo reemplace.

## Historial

- 2026-09-10 · proposed · misma postura que la rama de retiro de gates del harness del BCR.
