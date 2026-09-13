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

| Si el cambio toca | Nivel | Archivo |
|---|---|---|
| Un invariante, la autoridad humana, el dominio | 1, Core | `CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` |
| Qué puede o no puede hacer el agente | 4, Agent | `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` |
| Cómo se comporta una skill sola | 5, Skill | `entry-01` a `entry-04` |
| Los casos de prueba y la rúbrica | | `PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` |

El nivel 3, Experience Logic Contract, **no existe todavía**. Si una pregunta le tocaría a ese
nivel, decilo en vez de contestarla desde uno más abajo: así es como una regla de producto se decide
por accidente.

## Si hay que decidir algo

`/starteria-autoridad` ubica el cambio y dice si hace falta ADR. `/starteria-decision` lo registra.
Ninguno de los dos toca `doc/`.

## Un archivo de `doc/` con el que hay que tener cuidado

`PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` contiene el `EXPECTED` de los 32 casos. **La fase 1 de
`/starteria-probar` no puede verlo**: el subagente `portfolio-entry-responder` lo tiene fuera de su
alcance de lectura a propósito. Si alguna vez pegás el contenido de ese archivo en un prompt que
después se va a evaluar, contaminaste la corrida.
