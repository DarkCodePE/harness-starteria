---
paths:
  - "doc/**"
---

# `doc/` es la autoridad, no material de trabajo

Los archivos de `doc/` son los contratos de Starteria. El harness los **cita**, nunca los copia ni
los edita. Esto no es una convención de estilo: es `docs/adr/ADR-007` y `docs/adr/ADR-005`.

## Lo que no se hace acá

- **No edites un archivo de `doc/`** porque un caso falló, porque un mockup propone otra cosa o
  porque el texto quedó viejo. Un cambio de contrato lo decide una persona con autoridad, después de
  un ADR, no durante una sesión.
- **No agregues casos** al AI Harness. Sumar un caso es un cambio de contrato. `/starteria-caso`
  redacta el caso y lo devuelve; integrarlo es de otro.
- **No cites de memoria.** Si vas a decir qué dice un contrato, abrí el archivo y nombrá la sección.
  Contestar de memoria es cómo una regla se inventa sin que nadie lo note.
- **No elijas entre dos lecturas** cuando dos documentos se contradicen. Se escribe el bloque
  `CONFLICT` y se deja abierto.

## Quién manda en qué

**No lo contestes de memoria ni desde esta regla: está escrito.** `doc/STARTERIA_AUTHORITY.md` §2
tiene la jerarquía de nueve niveles, y `§4` dice cuál es el contrato activo de Portfolio Entry. Abrilo.

Esta regla no repite esa tabla a propósito. Copiarla acá sería la copia que envejece en silencio que
`ADR-005` rechaza, y ya pasó una vez: durante un día esta regla afirmó que el Experience Logic
Contract "no existe todavía", cuando había dejado de ser cierto.

Dos cosas del mapa que conviene saber antes de abrirlo, porque cambian cómo se lee todo lo demás:

- **Los ADR de producto (`doc/product-adr/`) pesan más que los Experience Contracts.** Son nivel 2,
  arriba de los contratos que gobiernan una experiencia.
- **Que el Core esté en el repo no lo vuelve aprobado.** Su estado declarado es "Base fundacional
  revisada / Por validar" (`§3`). Cualquier cambio que dependa de tratarlo como aprobado necesita
  ratificación explícita, y decirlo es parte del trabajo.

Ojo con los dos registros de decisiones, que son distintos y se confunden fácil: `doc/product-adr/`
son decisiones **de producto**, con autoridad de nivel 2. `docs/adr/` son decisiones **del harness**,
y no gobiernan el producto.

## Si hay que decidir algo

`/starteria-autoridad` ubica el cambio y dice si hace falta ADR. `/starteria-decision` lo registra.
Ninguno de los dos toca `doc/`.

## Un archivo de `doc/` con el que hay que tener cuidado

`PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` contiene el `EXPECTED` de los 32 casos. **La fase 1 de
`/starteria-probar` no puede verlo**: el subagente `portfolio-entry-responder` lo tiene fuera de su
alcance de lectura a propósito. Si alguna vez pegás el contenido de ese archivo en un prompt que
después se va a evaluar, contaminaste la corrida.

## Y `doc/` no entra a la memoria

`ADR-010` puso la frontera de ingesta del brain en `$STARTERIA_STATE_ROOT`. **Los contratos no se
indexan.** Meterlos en una base crearía justo la copia que envejece en silencio, que es el costo que
`ADR-005` ya había marcado. Los contratos se citan en vivo desde `doc/`; lo que se indexa es el
estado del harness.
