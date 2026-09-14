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
- `argument-hint` y `allowed-tools` van en todas. `allowed-tools` es **sólo de lectura**
  (`Read Grep Glob`, más `Agent` en `starteria-probar`) y no es un descuido: las skills escriben en
  `$STARTERIA_STATE_ROOT`, una ruta que sale de una variable de entorno y vive afuera del repo, así
  que un patrón estático no la puede acotar. Pre-aprobar `Write` sin poder acotarlo sería pre-aprobar
  escribir en cualquier lado. Que la escritura pida permiso una vez es el comportamiento correcto.

## Agregar un comando cuesta dos pasos

1. La carpeta con su `SKILL.md`.
2. El router `skills/starteria/SKILL.md`, que es el mapa. Un comando que existe y no está en el
   router es un comando que nadie va a encontrar.

Y `scripts/verify.sh`, que cuenta las skills esperadas. Si agregás una y no subís ese número, el
gate del productor falla, que es exactamente para lo que está.

`plugin.json` no hay que tocarlo.

**Un solo runtime.** `ADR-010` abandonó ChatGPT: no escribas ramas "en Claude Code X, en ChatGPT Y".
Queda X como prosa directa.

## La suite de evals

`evals/*/case.yaml`, cinco casos, la corre `claude plugin eval .`. Vive del lado del **productor**
(`ADR-009` §5) y por eso puede ser mecánica.

**La línea que no se cruza:** ningún caso puntúa si el agente de Portfolio Entry interpretó bien una
entrada. Eso es `ADR-003` y lo hace una persona. `probar-aisla-la-fase-1` verifica que el
aislamiento haya ocurrido, no que `PE-B03` haya pasado.

Si agregás un caso, cuatro reglas que vienen del propio autor de la herramienta y no son negociables:

- **Un caso que NO tiene que disparar** se queda en la suite. Hoy es `glosario-no-inventa`. Una
  suite donde todo dispara no distingue el harness del modelo.
- **Cada caso lleva al menos un grader de resultado**, no sólo `tool_used`. Que una skill se haya
  invocado no dice que haya servido.
- **`runs: 3` como piso.** Una corrida sola de un modelo no es evidencia de nada.
- **`--ablation with-without` se queda.** El número que importa es el delta contra el brazo sin
  plugin, no el puntaje absoluto.

**Si el caso nuevo necesita `doc/`, lleva `scaffold_script`.** El workspace del eval no lo tiene y
`add_dirs` no puede traerlo: sólo acepta rutas adentro del directorio del caso. Copiá el
`scaffold.sh` de cualquiera de los tres casos que ya lo usan. Y acordate de que la suite entonces se
corre con `--scaffold`.

Y el orden para elegir grader: primero lo verificable (`regex`, `file_exists`, `tool_used`), después
un criterio binario, y `llm` sólo cuando lo anterior no puede capturarlo. Un `llm` con una rúbrica
vaga es un generador de ruido caro.

## Antes de cambiar la estructura, leé los ADR

`docs/adr/ADR-INDEX.md`. Varias rarezas del harness son decisiones registradas con su costo, no
descuidos:

- Probar tiene **dos fases** porque si un solo hilo responde y puntúa, el número no significa nada
  (`ADR-002`).
- **Del lado del producto no hay gates**, y está declarado en voz alta (`ADR-003`). Del lado del
  productor sí: `scripts/verify.sh`. Son dos harnesses con reglas distintas (`ADR-009`), y mezclarlos
  es el error que deja el repo en verde sin haber mirado nada.
- **Un solo runtime y el estado como artefacto afuera del repo** (`ADR-010`, que supersede a
  `ADR-006`).
- Los comandos **citan** `doc/`, no lo copian (`ADR-005`).
- El harness **no escribe** en `doc/` y ningún comando promueve nada a `aceptado` (`ADR-007`).

Contradecir uno de esos no es un bug: es un ADR nuevo que lo reemplaza.

## Lo que no viaja en el plugin

`doc/` y `docs/` se quedan en el repo. Un plugin instalado en otro repo no debería arrastrar los
contratos de Starteria: los comandos degradan pidiendo que se los peguen.

Y el estado tampoco: vive en `$STARTERIA_STATE_ROOT` (`ADR-010`), porque los registros tienen
conversaciones reales de usuarios y porque el estado es de quien corre el harness, no del harness.

Ojo con dejar cosas en la raíz. El plugin ve todo lo que hay ahí: un `.mcp.json` suelto se empaqueta
y aparece en el inventario como si fuera del harness. Se comprueba con
`claude plugin details starteria-harness`, que tiene que decir `MCP servers (0)`.
