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
`doc/`, y que nadie compara. `LIFECYCLE.md` cierra con que ningún ciclo tiene alarma.

> **Alcance corregido el 2026-09-12.** `ADR-009` acotó esta decisión al **producto**: el productor sí
> tiene gate mecánico (`scripts/verify.sh`). Cuando se escribió este ADR eran cuatro ciclos y ninguno
> tenía alarma; hoy son cinco y el quinto —la unidad de trabajo del productor, `LIFECYCLE.md` §5—
> tiene una, chica: `verify.sh` falla solo, pero únicamente si alguien lo corre. Los cuatro ciclos
> del producto siguen sin alarma, y eso es lo que este ADR sostiene.

> **Premisa corregida el 2026-09-13.** La frase de arriba —"`LIFECYCLE.md` cierra con que ningún
> ciclo tiene alarma"— dejó de ser cierta: `LIFECYCLE.md` v0.2 agregó un sexto reloj, el pipeline de
> la integración, y su tramo caliente **sí** tiene alarma porque corre cada vez que un usuario final
> escribe, sin depender de que nadie se acuerde. **La decisión de este ADR no cambia:** ese tramo no
> es un gate, y el punto donde producción podría volverse un caso automático está deliberadamente
> cerrado con una selección humana (`LIFECYCLE.md` §6.2). Lo que sí aparece es un modo de falla nuevo
> que este ADR no contempló: los ciclos sin alarma fallan quedándose quietos, y el sexto falla
> llenándose. Si alguien propone abrir esa selección humana, **este es el ADR que hay que revisar**.

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
- [x] `LIFECYCLE.md` declara que los ciclos **del producto** no tienen alarma. *(Reformulado el
  2026-09-12: decía "ningún ciclo". El del productor tiene gate desde `ADR-009`.)*
- [ ] ~~No hay scripts, hooks ni dependencias de Node en el harness.~~ **Ya no se cumple, y no debe
  cumplirse:** `ADR-009` agregó `scripts/verify.sh` y `scripts/sync-para-chatgpt.py` del lado del
  productor. El criterio sigue valiendo para `skills/`, que no trae ningún script.

## 6. Gatillos de revisión

Si pasan tres meses sin una corrida registrada, la decisión se puso a prueba: la ausencia de gates
habrá pasado de honestidad a abandono. Ahí conviene discutir el chequeo mínimo, sabiendo que
contradice este ADR y necesita uno que lo reemplace.

## Historial

- 2026-09-10 · proposed · misma postura que la rama de retiro de gates del harness del BCR.
- 2026-09-12 · proposed · alcance acotado al producto y dos criterios reformulados, al escribir
  `AGENTS.md` y el quinto reloj de `LIFECYCLE.md`. La deriva del cuarto criterio venía de `ADR-009`
  y llevaba un día sin registrar. No cambia la postura: cambia sobre qué manda.
