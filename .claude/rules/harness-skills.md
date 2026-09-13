---
paths:
  - "skills/**"
  - "agents/**"
  - ".claude-plugin/**"
---

# Tocar el harness

Esto es un plugin de Claude Code. La raíz del repo es la raíz del plugin: Claude Code autodescubre
`skills/` y `agents/`, y `.claude-plugin/plugin.json` **no los enumera**. Es `docs/adr/ADR-008`.

## Reglas de forma

- El `name:` del frontmatter tiene que coincidir con el nombre de la carpeta. Si no coinciden, la
  skill no carga y nada lo avisa.
- **Sin em-dashes** en el cuerpo del harness. Están en cero y se verifica con
  `grep -rPl '\x{2014}' skills/ agents/` (escrito en hexa para que este archivo no se marque solo).
- Enlaces entre archivos del harness, relativos. Se verifican corriendo el bloque de enlaces del
  `docs/RUNBOOK.md` §0.
- Cada skill de flujo lleva `disable-model-invocation: true`. La única model-invocable es
  `starteria-glosario`, y es a propósito.
- `argument-hint` y `allowed-tools` van en todas. `allowed-tools` se mantiene mínimo: si una skill
  no escribe, no pide `Write`.

## Agregar un comando cuesta dos pasos

1. La carpeta con su `SKILL.md`.
2. El router `skills/starteria/SKILL.md`, que es el mapa. Un comando que existe y no está en el
   router es un comando que nadie va a encontrar.

Y si el comando es para ChatGPT también, la tabla de renombrado de `skills/starteria/PARA-CHATGPT.md`
es la tercera cosa a sincronizar.

`plugin.json` no hay que tocarlo.

## Antes de cambiar la estructura, leé los ADR

`docs/adr/ADR-INDEX.md`. Varias rarezas del harness son decisiones registradas con su costo, no
descuidos:

- Probar tiene **dos fases** porque si un solo hilo responde y puntúa, el número no significa nada
  (`ADR-002`).
- **No hay gates ni verificación automática**, y está declarado en voz alta (`ADR-003`).
- Los comandos **citan** `doc/`, no lo copian (`ADR-005`).
- El harness **no escribe** en `doc/` y ningún comando promueve nada a `aceptado` (`ADR-007`).

Contradecir uno de esos no es un bug: es un ADR nuevo que lo reemplaza.

## Lo que no viaja en el plugin

`doc/` y `docs/` se quedan en el repo. Un plugin instalado en otro repo no debería arrastrar los
contratos de Starteria: los comandos degradan pidiendo que se los peguen.

Ojo con dejar cosas en la raíz. El plugin ve todo lo que hay ahí: un `.mcp.json` suelto se empaqueta
y aparece en el inventario como si fuera del harness.
