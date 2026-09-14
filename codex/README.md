# El harness en Codex

Los mismos diez comandos, la misma carpeta `skills/`, otro manifiesto. **Cero archivos duplicados:**
`.claude-plugin/plugin.json` autodescubre `skills/` y `.codex-plugin/plugin.json` declara
`"skills": "./skills/"` — el mismo directorio. Si agregás un comando, aparece en los dos runtimes
sin tocar nada más.

Es la arquitectura de `token-optimizer`, y es la razón por la que sostener dos runtimes ahora es
barato: `ADR-006` murió porque exigía renombrar catorce archivos a mano, y acá no se copia ninguno.

## Instalar

**Dentro de este repo**, que es donde el harness sirve de verdad porque `doc/` está acá:

```
codex
```

Codex escanea `.agents/skills` desde el directorio actual hasta la raíz del repo, y **el repo ya trae
ese symlink commiteado** (`.agents/skills → ../skills`, 9 bytes, modo `120000`). Codex sigue symlinks
al escanear, así que no hay copia: clonás y los diez comandos están.

Son dos vías independientes a propósito. El symlink sirve adentro de este repo sin instalar nada; el
manifiesto `.codex-plugin/plugin.json` sirve para empaquetar y distribuir. Si una falla, la otra no
depende de ella.

## Probarlo, y qué contaría como que funciona

Nada de esto se verificó todavía en Codex: **no está instalado en la máquina donde se armó**. Lo que
sí se verificó es lo estructural — las diez skills tienen `name` y `description`, el manifiesto es
JSON válido y su `skills` resuelve a los diez `SKILL.md`.

Lo que falta es una persona corriendo esto:

```
cd <este repo>
codex
/skills          # deberían aparecer los diez starteria*
/starteria       # el mapa, que es el que explica los otros nueve
```

Si los diez aparecen, el primer criterio abierto de `ADR-011 §5` se cierra. Si aparecen menos,
lo que falla es el descubrimiento y no el contenido: revisar que Codex haya seguido el symlink.

**Como plugin**, para usarlo en otro repo: ver `docs/PLAN.md`. Todavía no está publicado en el
directorio universal de OpenAI, y `ADR-011` explica por qué esa parte espera.

## Lo que se degrada, y no se tapa

Dos cosas que en Claude Code están **impuestas por el runtime** y en Codex quedan **pedidas por
texto**. Ninguna rompe el harness; las dos cambian qué puede afirmar.

### 1. La fase 1 de `/starteria-probar` pierde su aislamiento real

En Claude Code, el agente `portfolio-entry-responder` lleva esto en su frontmatter:

```
tools: Read(doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md), Read(doc/entry-0*)
```

Es una allowlist: el subagente **no puede** leer la rúbrica ni el `EXPECTED` aunque quiera. Esa
imposibilidad es lo que hace honesto el `ACTUAL`, y `AGENTS.md` la llama *load-bearing*.

Codex no tiene allowlist de herramientas por skill. El aislamiento pasa a depender de que el modelo
respete una instrucción, que es exactamente la diferencia entre un gate y un pedido.

**Qué hacer mientras tanto:** correr la fase 1 en una sesión limpia de Codex, sin `docs/` abierto, y
**declarar la contaminación en el registro** como ya manda `ADR-002`. Un `PASS` sacado en Codex vale
menos que uno sacado en Claude Code, y el registro tiene que decir en cuál se sacó.

### 2. `disable-model-invocation` no se honra

Nueve de las diez skills lo llevan. En Claude Code significa que nadie las autoinvoca, y el historial
de `ADR-010` lo nombra como *"`ADR-003` funcionando"*. Codex usa *progressive disclosure*: arranca con
el nombre y la descripción de cada skill y decide solo cuándo cargar el `SKILL.md` completo.

El campo no rompe nada —Codex ignora frontmatter que no conoce— pero tampoco hace nada. En Codex, un
comando puede dispararse sin que vos lo escribas.

### 3. `/starteria-patron` necesita gbrain

Esto no es de Codex: es igual en los dos runtimes. Es la única skill que `ADR-010` marca como
imposible sin memoria indexada. De los diez comandos, nueve corren sin instalar nada.

## Qué no cambia

- Los contratos se citan desde `doc/`, nunca se copian. Vale igual acá.
- El harness no aprueba, no firma y no escribe en `doc/`.
- `scripts/verify.sh` sigue verificando estructura, no comportamiento.
