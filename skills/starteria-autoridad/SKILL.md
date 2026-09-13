---
name: starteria-autoridad
description: Dado un cambio propuesto, dice qué documento manda ahí, si choca con un contrato o un invariante, y si hace falta un ADR antes de tocar nada. Use when alguien quiere cambiar una regla, un mockup propone algo que el contrato no dice, o un caso del harness falló y no sabés qué arreglar.
disable-model-invocation: true
---

# Contra qué contrato choca esto

Alguien quiere cambiar algo. Tu trabajo es decir **quién manda ahí**, y si lo que proponen contradice
algo que ya está escrito. No es aprobar ni rechazar: es ubicar el cambio en la cadena de autoridad y
dejar el conflicto por escrito si lo hay.

## Antes de contestar, leé

[MAPA-DE-DOCUMENTOS.md](../starteria/MAPA-DE-DOCUMENTOS.md), que dice cuál de los archivos de `doc/`
ocupa cada nivel.
Después, el documento del nivel que corresponda. **Leelo de verdad, no lo cites de memoria.**

Si el documento que le tocaría al cambio es uno de los que todavía no existen (el Experience Logic
Contract es el caso frecuente), decilo con todas las letras: la pregunta no tiene dónde resolverse
hoy, y contestarla desde un nivel más abajo del que le corresponde es exactamente cómo una regla de
producto se decide por accidente.

## Los cuatro pasos

**1. Ubicá el cambio.** ¿De qué nivel es lo que quieren tocar?

| Si el cambio toca | Es nivel |
|---|---|
| Un invariante, la autoridad humana, o cómo se relacionan los objetos del dominio | 1, Core |
| Quién entra a una pantalla, qué Job resuelve, cuándo se considera terminada | 3, Experience |
| Qué puede o no puede hacer el agente, cómo se orquestan las skills entre sí | 4, Agent |
| Cómo se comporta una skill sola (`entry-01` a `entry-04`) | 5, Skill |
| Cómo se implementa: endpoints, schema, modelo, framework | 6, Tech Spec |
| Un mockup, un prompt de prueba, una pantalla dibujada | 8, y no cambia ninguna regla por sí solo |

**2. Buscá la contradicción.** ¿Hay algo escrito en ese nivel o más arriba que diga lo contrario?
Citá el documento y la sección exacta. Si no encontrás nada, decí que no encontraste nada, no que
no existe.

**3. Si hay contradicción, escribí el bloque.** Sin elegir una interpretación:

```text
CONFLICT
Contract:              <documento y sección que dice una cosa>
Implementation:        <lo que se está proponiendo o lo que hace hoy>
Observed mismatch:     <en qué se contradicen, concreto>
Risk:                  <qué se rompe si se avanza sin resolverlo>
Recommended resolution:<qué recomendás, sabiendo que no decidís vos>
Requires ADR:          yes / no
```

**4. Decidí si hace falta ADR.** Hace falta cuando el cambio:

- cambia un invariante del Core;
- modifica cómo se relacionan los objetos del dominio;
- mueve la frontera entre lo que decide la persona y lo que decide la IA;
- obliga a migrar datos existentes;
- cambia una regla que otras experiencias también usan.

Si es alguna de esas, mandá a `/starteria-decision` **antes** de que se toque nada.
Si no es ninguna, decí que se puede avanzar y contra qué documento se va a verificar después.

## Si venís de un caso que falló

Un caso rojo casi nunca significa "cambiemos el producto". Bajá por esta escalera y quedate en el
primer escalón que explique el fallo:

```text
¿La implementación incumplió una regla que ya estaba clara?
    → arreglá la implementación o el prompt. Fin.

¿La skill produce siempre este comportamiento no deseado?
    → revisá el Skill Contract de esa skill.

¿Dos o más skills se pisan entre sí?
    → revisá el Agent Contract.

¿El problema es el recorrido, o dónde termina una pantalla y empieza la otra?
    → revisá el Experience Contract.

¿Toca autoridad, dominio o un invariante?
    → Core, y va con ADR.
```

**No escales un fallo de prompt a cambio de producto.** Es el error más caro de este harness: se
cambia un contrato por un caso aislado que no gustó, y el contrato deja de describir el producto.
Un cambio de contrato tiene que salir de un **patrón** de fallos, no de una corrida.

## Dónde queda

Escribí el veredicto de nivel y, si lo hay, el bloque `CONFLICT`, en
`$STARTERIA_STATE_ROOT/conflictos/<slug>.md`. Si la variable no está puesta, el default es
`~/.starteria/<nombre-del-repo>/`.

Si venís de `/starteria-afilar`, buscá el entendimiento en `$STARTERIA_STATE_ROOT/entendimiento/`.
**Si no está, decilo y preguntá lo que falte.** Que el paso anterior no haya dejado nada escrito es
información sobre cómo se trabajó, no un motivo para frenar.

## Lo que no hacés acá

- **No aprobás el cambio.** Ubicás, comparás y recomendás. Aprobar es de una persona con autoridad.
- **No elegís entre dos lecturas cuando los documentos se contradicen.** Escribís el bloque
  `CONFLICT` y lo dejás abierto. Elegir en silencio es cómo una contradicción se vuelve invisible.
- **No escribís el ADR.** Para eso está `/starteria-decision`.
- **No tocás `doc/`.** Los contratos los cambia una persona, después de la decisión, no antes.
