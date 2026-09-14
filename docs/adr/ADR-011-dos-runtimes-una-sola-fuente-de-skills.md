---
id: ADR-011
title: "Dos runtimes otra vez, pero con una sola fuente de skills y las degradaciones declaradas"
status: proposed
type: standard
date: 2026-09-13
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "la primera vez que un PASS sacado en Codex se use para cerrar un criterio, o el primer mes sin que nadie abra el harness en Codex"
tags: [harness, runtime, codex, plugin, portabilidad, adr-010]
---

# ADR-011: Dos runtimes otra vez, pero con una sola fuente de skills y las degradaciones declaradas

## 1. Contexto y problema

**El gatillo de `ADR-010` se disparó.** Su `review_trigger` decía: *"primera sesión en que alguien
pide correr el harness fuera de Claude Code"*. Pasó el 2026-09-13. No es una excepción que alguien
pide: es la condición que ese ADR escribió para volver a mirarse.

`ADR-010 §2.1` abandonó el segundo runtime y superseded a `ADR-006`. Su razonamiento tenía dos
patas, y **una se cayó sola**:

- *"el foco de producto se movió a empresas, donde la gente ya trabaja con Claude Code"* — sigue en
  pie, pero ahora hay gente del equipo en Codex.
- *"sostener el segundo runtime pasó a costar sin que nadie lo cobre"* — **esto cambió**. El costo
  que `ADR-006 §4` había aceptado era el renombrado manual de catorce archivos, y lo señalaba como
  *"donde más probable es que alguien abandone"*. Ese costo ya no existe.

**Qué cambió afuera.** Codex tiene skills nativas, y son *un directorio con `SKILL.md` y frontmatter
`name` + `description`*: el mismo formato que Claude Code. Los `~/.codex/prompts` quedaron
deprecados en favor de eso. No hay que traducir nada.

**Qué cambió adentro.** El clon de `token-optimizer` que vive en este repo por conveniencia resultó
ser la respuesta arquitectónica: sostiene diez runtimes con **una sola carpeta `skills/`** y un
manifiesto por runtime que apunta a ella. Su `.codex-plugin/plugin.json` declara
`"skills": "./skills/"` — el mismo directorio que Claude Code autodescubre. Cero duplicación, cero
tabla de renombrado, cero deriva posible entre copias porque no hay copias.

El problema, entonces, ya no es de empaquetado. Es de **qué puede afirmar el harness en cada
runtime**, y eso sí no se resuelve con un manifiesto.

## 2. Decisión

### 2.1 Dos runtimes de primera clase, una sola fuente

`skills/` sigue siendo la única fuente. Se agrega `.codex-plugin/plugin.json` declarando
`"skills": "./skills/"`. **Ningún archivo de skill se copia, se renombra ni se bifurca por runtime.**
Agregar un comando lo hace aparecer en los dos sin tocar nada más.

Esto no reabre `ADR-006`: aquella decisión sostenía dos runtimes **con dos cuerpos de markdown** y
una tabla de renombrado. Acá hay un cuerpo y ningún renombrado. Lo que se revierte de `ADR-010` es
§2.1, y solo §2.1: §2.2 (el estado como artefacto encadenado) y §2.3 (la frontera de gbrain) quedan
intactas.

### 2.2 Las degradaciones se declaran, no se tapan

Dos garantías que en Claude Code las impone el runtime, y en Codex quedan pedidas por texto:

| Garantía | Claude Code | Codex |
|---|---|---|
| La fase 1 de `/starteria-probar` no ve la rúbrica | `tools:` allowlist del agente — **imposible** | instrucción — **pedido** |
| Ninguna skill se autoinvoca | `disable-model-invocation: true` | ignorado; el modelo decide |

Van escritas en `codex/README.md` y nombradas en la descripción del manifiesto de Codex. **Un
registro de `/starteria-probar` debe decir en qué runtime se sacó**, y un `PASS` de Codex no cierra
un criterio por sí solo mientras la fase 1 no tenga aislamiento real ahí.

Es `ADR-003` aplicado a la portabilidad: no se agrega un gate, se dice en voz alta qué no lo tiene.

### 2.3 No se publica todavía en el directorio de OpenAI

El paquete ya calificaría para subida directa: hay `skills/<nombre>/SKILL.md` y
`.claude-plugin/plugin.json` con `description` no vacía, y la limpieza de `ADR-010` dejó **cero
menciones a "Claude"** en las skills, que es conversión obligatoria en la guía de OpenAI.

Pero su checklist obliga a convertir `agents/` en skills, y eso **destruye la allowlist** que hace
honesta la fase 1. Publicar antes de resolver §2.2 sería someter a revisión externa un harness cuyas
garantías todavía no decidimos. Primero se usa en Codex desde el repo; después se publica.

### 2.4 La capa genérica: un paquete autocontenido, generado y chequeado

Entre los manifiestos por runtime y los adaptadores documentales va una tercera capa que al principio
parece prolijidad y no lo es.

`.claude-plugin/marketplace.json` usa `"source": "./"`: **el paquete es la raíz del repo**. Eso ya
tuvo una consecuencia real —`ADR-008 §4` la declaró y la dejó abierta— cuando el plugin instalado
desde ruta local reportó `MCP servers (1) claude-flow`, arrastrando el `.mcp.json` de ruflo. Ese ADR
anotó la parte que importa: *"la próxima cosa que alguien deje en la raíz va a viajar igual"*.

Se agrega `plugins/starteria-harness/`, un paquete autocontenido con `skills/`, `agents/` y los dos
manifiestos, y `.agents/plugins/marketplace.json` como catálogo en ubicación **neutral** —ni
`.claude-*` ni `.codex-*`— que apunta a él. La raíz deja de ser la frontera del paquete.

**Es una copia, y una copia sin chequeo es exactamente como murió `ADR-006`.** Por eso viene con dos
piezas que no son opcionales:

- `scripts/sync-plugin-mirror.sh` lo genera desde la raíz.
- `scripts/check-mirror-sync.sh` lo **regenera y compara contra lo commiteado**, y es el bloque 6 de
  `verify.sh`.

La diferencia con `ADR-006` está en una sola frase: **el generador es dueño de las divergencias**.
Aquello pedía mantener catorce renombrados en una tabla a mano, y una tabla a mano se pudre. Acá no
hay lista de excepciones: si el paquete tiene que diferir de la raíz, la diferencia se escribe en el
script, y el chequeo la respeta sola.

Es también el lugar donde va a vivir la conversión de `agents/` a skill que pide OpenAI (§2.3) el día
que se publique: como divergencia de un generador, con la degradación declarada, y no como una copia
editada a mano que nadie vuelve a mirar.

## 3. Alternativas consideradas

- **Quedarse en un solo runtime:** rechazada. El argumento de costo de `ADR-010` se cayó, y el de
  foco ya no aplica: hay gente del equipo en Codex hoy.
- **Copiar `skills/` a un árbol por runtime:** rechazada, y es la que hay que rechazar con más
  ganas. Es exactamente `ADR-006` otra vez, con su deriva silenciosa entre copias.
- **Symlink `.agents/skills → skills/` y nada más:** no rechazada, **complementaria**. Sirve para
  descubrimiento local dentro del repo y queda documentada en `codex/README.md`. No reemplaza al
  manifiesto, que es lo que habilita empaquetar.
- **Publicar ya en el directorio de OpenAI:** rechazada por ahora, §2.3.
- **Adaptadores pesados por runtime, como `token-optimizer` hace con `openclaw/` y `hermes/`:**
  rechazada. Ese peso se paga cuando el runtime tiene API propia; Codex consume `skills/` directo y
  no necesita nada.

## 4. Consecuencias

**Positivas**
- Los diez comandos corren en dos runtimes sin duplicar un archivo.
- Agregar un comando ya no tiene costo por runtime.
- Las dos degradaciones quedan escritas donde se leen, en vez de descubrirse corriendo un caso.
- El repo queda listo para publicar en el directorio de OpenAI el día que §2.3 se destrabe.

**Negativas y trade-offs aceptados**
- **Un `PASS` ya no vale lo mismo en todos lados.** Hay que mirar en qué runtime se sacó, y eso es
  una carga mental nueva sobre quien lee un registro.
- **`agents/` queda como el único componente que no es portable.** Mientras exista, el paquete no
  entra limpio a OpenAI.
- **La autoinvocación en Codex puede disparar un comando que nadie pidió**, y `ADR-003` no tiene
  cómo evitarlo ahí.
- **Se vuelve sobre una decisión aceptada hace un día.** Que el gatillo estuviera escrito no lo hace
  gratis: un registro que cambia de opinión rápido se lee peor que uno que no.
- **Hay un segundo manifiesto que puede quedar viejo.** `verify.sh` compara la versión instalada
  contra el manifiesto de Claude Code; no mira el de Codex.

## 5. Criterios de aceptación de la decisión

- [ ] `.codex-plugin/plugin.json` es JSON válido y su `version` coincide con `.claude-plugin/`.
- [ ] Codex abierto en este repo lista los diez comandos.
- [ ] Un comando nuevo aparece en los dos runtimes sin editar ningún manifiesto.
- [ ] Un registro de `/starteria-probar` sacado en Codex dice que se sacó en Codex.
- [ ] `grep -ri "claude" skills/` sigue en cero, que es lo que mantiene el paquete portable.
- [x] El chequeo de deriva del mirror falla cuando una skill cambia y no se regenera. — verificado
      2026-09-13 en negativo: se tocó `starteria-glosario`, `verify.sh` dio `FALLA` y nombró el
      archivo. Un chequeo que no se probó fallando es teatro.
- [ ] Instalar desde `plugins/starteria-harness` reporta `MCP servers (0)`, cerrando `ADR-008 §4`.
- [ ] Alguien que no escribió esto instala el harness en Codex siguiendo solo `codex/README.md`.

El último es el criterio que `ADR-006` dejó abierto y nunca se cumplió. Se repite a propósito: si
vuelve a quedar sin cumplir, es la misma señal que la vez pasada.

## 6. Gatillos de revisión

Dos, y son opuestos como los de `ADR-010`.

El primero es que un `PASS` sacado en Codex se use para cerrar un criterio. Si pasa, §2.2 no alcanzó
como declaración y hay que decidir si la fase 1 se bloquea en ese runtime o si el criterio se
degrada.

El segundo es que pase un mes sin que nadie abra el harness en Codex. Si pasa, el gatillo de
`ADR-010` se disparó por una necesidad que no era real, y lo barato es volver a §2.1 de aquel ADR.

## Historial

- 2026-09-13 · proposed · se disparó el `review_trigger` de `ADR-010` en la primera sesión en que
  alguien pidió correr el harness fuera de Claude Code. Al mirar `token-optimizer` apareció que el
  costo que había matado a `ADR-006` —la tabla de renombrado— ya no existe: un `skills/` y un
  manifiesto por runtime alcanzan. Queda sin firmar: `AGENTS.md` permite transcribir una aprobación
  que ocurrió y prohíbe producir una que nadie dio.
