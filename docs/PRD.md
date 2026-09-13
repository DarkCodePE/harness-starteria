# PRD del harness de Portfolio Entry

**Versión:** v0.1
**Fecha:** 2026-09-10
**Estado:** implementado, sin correr end to end
**Ámbito:** el harness, no el producto Starteria

> Este documento describe **la herramienta**, no Starteria. El PRD del producto no existe y no
> es este: sería un documento de `doc/`, con la autoridad que le da la cadena del
> Development Harness. Confundirlos es cómo una herramienta termina redefiniendo un producto.

## 1. El problema

`doc/` tiene nueve documentos: el Core Logic Contract con trece invariantes, el Development
Harness, el Crazy 8s, el Agent Contract de Portfolio Entry, cuatro contratos de skill y un AI
Harness con treinta y dos casos, siete dimensiones de puntaje y nueve fallos duros.

Todo eso está escrito y nadie lo puede usar.

Para correr **un** caso hoy hace falta: abrir el AI Harness y encontrar el caso, abrir el Agent
Contract y las cuatro skills para saber qué debería contestar el agente, sostener las siete
dimensiones en la cabeza mientras se puntúa, y saber qué significan `provenance`, `AI_INFERRED`,
*reverse alignment* y "objeto canónico". Eso es media hora de lectura antes de la primera
pregunta, y la persona que más necesita el resultado, la que gobierna el portafolio, es
justamente la que no va a hacer esa lectura.

Un harness que nadie corre no protege nada. Los contratos siguen ahí, la implementación se
desvía, y nadie se entera hasta que el desvío ya es el producto.

## 2. Para quién

**Usuario primario:** Portfolio Lead y Product Manager. Gobiernan el portafolio o la experiencia,
toman decisiones materiales, y **no son técnicos**. No leen código, no corren scripts, no
mantienen entornos. La herramienta que tienen abierta todo el día es un chat.

**Usuario secundario:** quien vaya a implementar Portfolio Entry. Necesita saber qué contrato
manda y qué casos tiene que pasar, pero tiene otras herramientas además de esta.

**No es para:** gente que ya lee `doc/` entero y prefiere hacerlo a mano. Para esa persona el
harness agrega una capa entre ella y el contrato, y le va a estorbar.

## 3. Qué hace

Diez comandos de chat que envuelven los contratos de `doc/` y los vuelven ejecutables por alguien
que no los leyó.

| Trabajo | Comando | Qué produce |
|---|---|---|
| Afilar una idea difusa | `/starteria-afilar` | Entendimiento compartido y preguntas abiertas con dueño |
| Saber contra qué contrato choca un cambio | `/starteria-autoridad` | Nivel de autoridad, bloque `CONFLICT`, veredicto de ADR |
| Ver si el agente se comporta bien | `/starteria-probar` | Registro con puntaje, fallos duros y capa de fallo |
| Convertir un usuario real en caso | `/starteria-caso` | Caso nuevo con input sin editar y esperado desde el contrato |
| Registrar una decisión | `/starteria-decision` | ADR en `propuesto` |
| No perder el estado al cerrar | `/starteria-cierre` | Entrada de bitácora |
| Entender una palabra | `/starteria-glosario` | Definición en español llano con puntero |
| Saber qué comando usar | `/starteria` | El mapa |

## 4. Qué NO hace, a propósito

- **No verifica nada solo.** Sin scripts, sin hooks, sin nada corriendo en segundo plano. Si nadie
  ejecuta `/starteria-probar`, nadie sabe si el agente se rompió. Está declarado en el router y en
  `ADR-003`, y es la misma postura que tomó el harness del BCR al retirar sus gates: preferimos que
  se sepa que la verificación depende de una persona, antes que un tilde verde que nadie miró.
- **No decide.** Interpreta, compara, marca huecos y recomienda. Aprobar, confirmar y decidir sigue
  siendo de la persona, que es el invariante INV-03 del Core Contract aplicado a la herramienta que
  gobierna ese contrato.
- **No escribe en `doc/`.** Los contratos los cambia una persona, después de una decisión. `ADR-007`.
- **No cubre Steps 0 a 4, ni el portafolio completo, ni las otras siete pantallas del Crazy 8s.**
  Alcance v0.1 es Portfolio Entry, que es el único terreno con contratos completos. `ADR-004`.
- **No define modelo, proveedor, endpoint, persistencia ni framework.** Eso es Tech Spec, y el AI
  Harness §20 lo deja explícitamente fuera.

## 5. Cómo se sabe si funcionó

Criterios verificables, no impresiones:

1. **Alguien de producto que no leyó `doc/` corre `PE-B03` sin ayuda y entiende el veredicto.**
   Si necesita que le expliquen qué es un fallo duro, el glosario o la rúbrica fallaron.
2. **Una corrida deja registro.** Un caso corrido sin registro no se corrió: no hay contra qué
   comparar la próxima vez.
3. **Un caso que falla no cambia un contrato ese mismo día.** El fallo baja por la escalera de
   `/starteria-autoridad` y se queda en el escalón más bajo que lo explique. Si el primer FAIL
   produjo un cambio de Core, el harness está amplificando ruido.
4. **Aparece al menos un caso de Round 3**, o sea nacido de una conversación real, que ninguna de
   las nueve suites cubría. Si en tres meses no apareció ninguno, o el producto no tiene usuarios,
   o nadie está usando `/starteria-caso`.
5. **La bitácora tiene entradas de más de una sesión.** Es la única prueba de que el estado
   sobrevive.

## 6. Riesgos conocidos

| Riesgo | Por qué pasa | Qué lo contiene hoy |
|---|---|---|
| El modelo se autocalifica y todo da verde | Si responde y puntúa el mismo hilo, ve la rúbrica antes de contestar | Dos fases (`ADR-002`). Si se saltean, el registro dice `CONTAMINADO` |
| Nadie corre el harness y nadie se entera | No hay nada automático | Nada. Es el costo aceptado de `ADR-003` y está dicho en voz alta |
| Un caso aislado cambia un contrato | Un FAIL incomoda y la reacción es tocar la regla | La escalera de `/starteria-autoridad` y la regla de que hace falta un patrón, no una corrida |
| El esperado se copia de lo que contestó el agente | Es más rápido que leer los contratos | Advertido en `/starteria-caso`. Nada lo impide |
| Los documentos derivados quedan viejos | `RUBRICA.md`, `GLOSARIO.md` y `MAPA-DE-DOCUMENTOS.md` derivan de `doc/`. El peor es la rúbrica: no falla, puntúa distinto | Los tres declaran que `doc/` gana. Nadie compara |

Los tres últimos no tienen contención mecánica. Decirlo es la contención.

## 7. Estado

Implementado: los diez comandos, la rúbrica, las plantillas, el glosario, el mapa de autoridad y
la guía de ChatGPT. Verificado estructuralmente: nombres, enlaces, ids de caso y fallos duros
coinciden con `doc/`.

**Sin correr end to end.** Nadie ejecutó todavía `/starteria-probar PE-B03` de principio a fin, ni
montó el Proyecto de ChatGPT. Hasta que eso pase, el harness está escrito, no probado, y esa
distinción es exactamente la que el harness le exige a todo lo demás.
