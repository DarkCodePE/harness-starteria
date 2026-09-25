---
name: hu
description: >
  Lleva un pedido nuevo de Starteria desde "algo así" hasta una HU en Jira con sus subtareas
  [Funcional] y [Técnica]. Primero entrevista (grill) por rondas hasta entender el requerimiento,
  después lo escribe como brief, y recién ahí llama al agente delivery-planner, que redacta la HU y
  la crea en Jira con confirmación. Use when: llega un pedido, una idea o un bug que todavía no tiene
  HU. Do not use for: una HU que ya existe y sólo hay que leer (skill jira-hu), ni para implementar.
argument-hint: "<el pedido, como lo dijeron>"
allowed-tools: Read Grep Glob Agent
---

# Del pedido a la HU

Cuatro pasos, en orden, y cada uno con su aprobación. No saltees ninguno porque el pedido parezca
chico: la aprobación es la puerta, no el tamaño del texto.

```text
1. clasificar      Jev propone pregunta | acotado | grande, el agente verifica
2. afilar (grill)  rondas de preguntas hasta que la frontera quede vacía      ← la persona confirma
3. brief           estado/hu/<slug>.brief.md                                ← la persona lo aprueba
4. planificar      agente delivery-planner → dry-run → "¿la creo?" → Jira    ← la persona confirma
```

El equipo son dos frentes y la HU los separa: **[F] funcional**, que lleva producto (el qué y el
para qué), y **[T] técnica**, que lleva desarrollo (el cómo). Marcá cada pregunta y cada decisión
con su frente desde el paso 2: así el planner no tiene que adivinar de quién es cada cosa.

## 1. Clasificar (con Jev)

La clase la propone **Jev**, no tu criterio. Corré:

```bash
node .claude/skills/hu/tools/jev-clasificar.mjs "<el pedido, literal>"
```

Jev contesta siete preguntas atómicas sobre el texto (¿busca una respuesta?, ¿toca algo que existe?,
¿capacidad nueva?, ¿cambia algo de lo que otros dependen?, cuántas capas, qué frente domina, qué tan
claro está) y el script **deriva la clase en código**. Es la regla de
`docs/analisis-jev/99-donde-no-aplica.md`: lo que se elige entre opciones es Jev, lo que se deriva
de otras respuestas es código.

| Tipo | Se deriva cuando | Qué sale |
|---|---|---|
| **Pregunta** | busca una respuesta, no un cambio que quede | una HU con una sola subtarea técnica tipo *spike*, o nada si se contesta ahora |
| **Acotado** | modifica algo que ya existe y no dispara nada de "grande" | una HU |
| **Grande** | capacidad nueva, o cambia algo de lo que otros dependen, o tres o más capas | una épica con varias HU, y probablemente un ADR |

**Si hay duda, el más pesado**, y el script ya lo aplica: una respuesta con confianza baja o un sí/no
cerca de 0.5 sube la clase un escalón y lo dice (`subida desde ... por duda`).

Después:

1. **Verificá lo que Jev no puede ver.** Jev sólo lee el texto, no el repo. Si propone *acotado*,
   confirmá con `Grep`/`Glob` que el flujo existe de verdad; si no existe, es *grande*.
2. **Anunciá la clase en voz alta** con sus motivos, para que la persona la corrija. Es una
   propuesta, no un veredicto: la IA propone, la persona decide.
3. **Usá también lo demás que devuelve:** `frente` dice si la entrevista va a pesar más en
   preguntas [F] o [T], y `claridad: vago` avisa que la primera ronda tiene que ir por el actor y el
   para qué.
4. Guardá la salida (`--json`) en `estado/hu/<slug>.clase.json`. Cuando la persona corrija una
   clase, ese archivo es lo que después permite calibrar los cortes, que hoy son provisionales
   (los mismos 0.50 de ADR-031).

**Si Jev falla** (sin `JEV_API_KEY`, sin red; el script sale con 2), clasificá a mano con la misma
tabla y decí que fue a mano. Jev nunca bloquea el flujo. Si la clase sube a mitad de camino porque
apareció complejidad escondida, subila y decilo. Nunca se baja.

## 2. Afilar: la entrevista

Pensá el pedido como un árbol: cada decisión abre las que cuelgan de ella. La **frontera** son las
preguntas que se pueden contestar **ahora**, sin adivinar respuestas que todavía no escuchaste.
Preguntá toda la frontera en una ronda, numerada, y esperá:

```text
❓ **P1 [F] - <título>**: <la pregunta, con opciones si las hay>

➡️ <lo que recomendás, y por qué en una línea>
```

Cuando contesta, recalculá la frontera y hacé la ronda siguiente. Una pregunta que depende de otra
abierta **en esta misma ronda** va a la ronda siguiente.

**Los hechos los buscás vos, las decisiones son de la persona.** Qué slice V2 existe
(`STARTERIA_V2_MANIFEST.md`), qué dice un contrato de `doc/`, dónde vive el código, qué tests hay:
eso se busca, no se pregunta. Mandalo a un subagente (`Agent`, tipo `Explore`) y seguí preguntando
el resto de la frontera mientras tanto. Qué quiere lograr el negocio, qué queda afuera, qué se
prioriza cuando dos cosas chocan, cuándo está terminado: eso se pregunta.

Además de lo obvio, que no falte:

- **[F] Para quién y para qué.** Quién es el actor y qué logra. Sin eso no hay historia de usuario.
- **[F] Qué queda afuera.** Un alcance sin bordes se estira solo.
- **[F] Cómo se sabría que salió mal.** Si nadie puede describir el resultado malo, los criterios
  de aceptación no existen todavía.
- **[F] Contra qué documento choca.** Si contradice algo escrito, nombralo; no elijas una lectura.
  Eso va a `/starteria-autoridad`, no se resuelve acá.
- **[T] Qué ya existe.** Buscalo antes de preguntar: si el comportamiento ya está implementado,
  el pedido es otro.
- **[T] Qué autoridad hace falta.** Backend, Prisma, IA productiva o Core necesitan autoridad
  explícita (`AGENTS.md`). Si el pedido no la trae, es una pregunta, no un supuesto.

**Si quien tiene que contestar no está.** Pasa todo el tiempo: las preguntas [F] son de producto y
producto no siempre está en la sesión. No las cierres por esa persona. Juntalas en un cuestionario
para que las conteste cuando pueda, con la plantilla de [CUESTIONARIO.md](CUESTIONARIO.md), en
`estado/hu/<slug>.cuestionario.md`. Las preguntas [T] que quedan abiertas siguen igual en la
entrevista. Una HU puede crearse con preguntas abiertas si están escritas y tienen dueño: la
subtarea funcional las lleva.

Terminaste cuando la frontera está vacía. **No sigas hasta que la persona confirme** que llegaron
al mismo entendimiento.

## 3. El brief

Una vez confirmado, escribí `estado/hu/<slug>.brief.md` (slug corto, minúsculas, guiones) con lo
que ya se habló. **Sin entrevistar de nuevo**: es síntesis.

```markdown
# <título en lenguaje de producto>

Tipo: pregunta | acotado | grande
Slice V2: <nombre en el manifiesto, o "SIN SLICE: registrar">
Documento que manda: <doc/... § x, o "ninguno escrito">

## Problema
Desde el lado de quien lo sufre.

## Solución
Desde el lado de quien la usa, no desde la implementación.

## Historias
1. Como <actor>, quiero <capacidad>, para <beneficio>
(todas las que salieron; si es "grande", agrupalas por HU)

## Decisiones [F]
Cada una con quién la tomó en la entrevista.

## Decisiones [T]
Lo que se decidió del cómo: áreas, enfoque, lo que ya existe y se reusa.

## Cómo se sabría que salió mal
Lo que la persona dijo. De acá salen los criterios de aceptación.

## Fuera de alcance

## Preguntas abiertas
| # | Frente | Pregunta | Dueño | En cuestionario |
```

Mostralo y preguntá: **"¿Este brief es lo que hablamos?"** Corregí hasta que diga que sí.

## 4. Planificar y crear

Con el brief aprobado, despachá el agente `delivery-planner` (`Agent`,
`subagent_type: delivery-planner`) con un prompt corto: la ruta del brief, el tipo, y que el
brief ya está aprobado y no hay que volver a entrevistar.

Devuelve la HU redactada y el dry-run de Jira. Mostráselos a la persona **tal cual**, con los avisos
(HU parecidas, subtareas sin responsable) y lo que quedó `SUPUESTO` o `SIN RESOLVER`. Preguntá
**"¿La creo en Jira?"**.

- Si pide cambios: volvé a despachar al planner con los cambios y la ruta del plan.
- Si dice que sí: despachá al planner con `aplicá estado/hu/<slug>.json, confirmado por <quién>`.
  Nunca pongas "confirmado" sin que la persona lo haya dicho en este turno.

Cerrá con las claves creadas, el enlace, y quién tiene que moverse primero (normalmente producto,
con la subtarea funcional y el cuestionario si lo hay).

## Lo que no hacés

- Crear en Jira sin el sí explícito de la persona sobre ese plan.
- Saltear la entrevista porque "ya está claro": si está claro, la frontera se vacía en una ronda.
- Decidir producto. La IA propone, la persona decide (INV-03).
- Escribir código, contratos de `doc/` o ADRs. Si hacen falta, salen como subtareas.

---

Método adaptado, con licencia MIT, de `grilling`, `to-spec`, `to-tickets` y `to-questionnaire`
(Matt Pocock, `mattpocock/skills`) y de las tres rutas de `brainstorming` (Jesse Vincent,
`superpowers`).
