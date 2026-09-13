# Runbook: probar el harness de punta a punta

**Para:** quien tenga que correr la fase 2 de [PLAN.md](PLAN.md), sea técnico o no.
**Dura:** unas dos horas la primera vez. Media hora las siguientes.
**Qué deja:** los cinco criterios de salida de la fase 2 marcados, con evidencia, y dos criterios
abiertos de `ADR-008` cerrados.

Son **dos verificaciones que no se mezclan** (`ADR-009`). `scripts/verify.sh` comprueba que el
plugin cargue, y eso lo puede hacer una máquina. Este runbook comprueba que el agente de Portfolio
Entry se comporte bien, y eso sólo lo puede hacer una persona. Correr el primero no te exime del
segundo, y es la confusión que más fácil deja el harness en verde sin haber mirado nada.

`PLAN.md` §fase 2 dice **qué** hay que probar y por qué. Este archivo dice **cómo**, con los
comandos para copiar y el resultado exacto que tenés que ver. Si los dos se contradicen, gana
`PLAN.md`: este es el derivado.

> Nada de esto corre solo. Es `ADR-003` y es a propósito. Si nadie ejecuta este runbook, nadie sabe
> si el harness sirve.

---

## Antes de empezar: dónde estás parado

Contestá estas tres y anotá las respuestas. Sin esto, lo que pruebes después no vas a saber a qué
versión le corresponde.

```bash
claude --version
claude plugin list | grep starteria
claude plugin details starteria-harness
```

De la última salida, anotá tres cosas:

| Qué mirar | Qué tiene que decir | Si dice otra cosa |
|---|---|---|
| `Skills (10)` | diez, y el mismo número que carpetas en `skills/` | hay comandos que no cargan, o que cargan de más |
| `Agents (1)` | uno: `portfolio-entry-responder` | sin él, la fase 1 de `/starteria-probar` no tiene aislamiento estructural |
| `MCP servers (0)` | cero | estás empaquetando config ajena de la raíz del repo |
| `Source:` | el marketplace del que salió | estás probando otra copia de la que creés |

**Trampa conocida.** Un marketplace agregado desde una ruta local sirve el **working tree**, no el
último commit. Si esa carpeta tiene cambios sin commitear, el plugin instalado es esa mezcla y no
lo que está en git. Antes de probar:

```bash
cd <la ruta que reporta Source> && git status --short
```

Si sale algo, decidí primero qué versión querés probar. Probar una mezcla que no existe en ningún
lado es perder la corrida.

---

## Fase 0: que el plugin se instale desde donde dice el README

Esto cierra los dos criterios que `ADR-008` §5 dejó abiertos.

### 0.1 El gate del productor

```bash
scripts/verify.sh
```

Sale 0 si los manifiestos son válidos, si están las diez skills con su `SKILL.md` y frontmatter
completo, y si el plugin instalado reporta lo que tiene que reportar. Si sale 1, arreglá eso antes de
seguir: nada de lo que viene después significa algo con un plugin que no carga.

Esto **no** prueba el harness, prueba el envase. Es `ADR-009` y la distinción importa.

### 0.2 La suite de evals

```bash
claude plugin eval . --max-cost-usd 30
```

Cinco casos, tres corridas cada uno, contra dos brazos: con el plugin y sin él. El número que
importa no es el puntaje sino el **delta**: cuánto cambia la respuesta por tener el harness puesto.
Un caso que saca lo mismo en los dos brazos no está midiendo el harness, está midiendo al modelo.

Corre unos veinte minutos y cuesta del orden de veinte a treinta dólares, así que no es de cada
commit: es de cuando se toca un contrato, un comando o la rúbrica. Para iterar mientras escribís,
`--tag glosario --ablation none --runs 1` baja eso a menos de un dólar.

**Para mirar por dentro una corrida, `--keep-temp`.** Sin eso el sandbox se borra al terminar y
el `trace.jsonl` que el reporte referencia ya no existe cuando vas a abrirlo.

**`--case` no se puede repetir.** Pasar `--case 'a*' --case 'b*'` no selecciona los dos: gana el
último y el primero se pierde sin avisar. Se ve en el `aggregate-result.json`, que reporta un solo
`caseFilter`. Para elegir varios, `--tag`, que sí acumula.

**Qué NO prueba, y es a propósito.** Ningún caso puntúa si el agente de Portfolio Entry interpretó
bien una entrada. Eso es `ADR-003` y lo hace una persona, con las fases de abajo. `probar-aisla-la-fase-1`
verifica que el aislamiento haya ocurrido, no que `PE-B03` haya pasado. Confundir las dos cosas es
cómo se consigue una suite verde sobre un producto roto.

### 0.3 Instalar desde ruta local

```bash
claude plugin marketplace add <ruta absoluta del repo>
claude plugin install starteria-harness@darkcodepe
claude plugin details starteria-harness
```

**Pasa si:** el inventario reporta `Skills (10)`, `Agents (1)`, `Hooks (0)` y `MCP servers (0)`.

### 0.4 Instalar desde GitHub

Este es el criterio abierto de `ADR-008`. En una sesión nueva:

```bash
claude plugin marketplace add DarkCodePE/harness-starteria
claude plugin install starteria-harness@darkcodepe
```

**Pasa si:** instala y el inventario coincide con 0.3.

**Falla si** el marketplace no encuentra `.claude-plugin/marketplace.json`. Causa casi segura: la
rama por defecto del repo no tiene los archivos del plugin. `marketplace add <owner/repo>` va a la
rama por defecto, no a la rama donde estuviste trabajando. Verificalo así:

```bash
git ls-tree -r --name-only origin/main | grep claude-plugin
```

Sin salida, la instalación desde GitHub no puede funcionar por más que el repo exista. Se arregla
mergeando a la rama por defecto, no tocando el plugin.

### 0.5 Instalar donde no hay `doc/`

El otro criterio abierto de `ADR-008`. En **cualquier otro repo** de la máquina:

```bash
cd <otro repo cualquiera>
claude
```

Adentro de la sesión, escribí `/starteria-probar PE-B03`.

**Pasa si** el comando te pide que pegues el AI Harness, o te dice que no lo encuentra.
**Falla si** inventa el caso `PE-B03`. Eso es peor que un error: es una corrida que parece válida y
está construida sobre un caso que nadie escribió. Si pasa esto, pará todo y anotalo: la frontera
entre el plugin y los contratos está mal puesta y `ADR-008` §6 dice qué hacer.

---

## Fase 1: humo. Que los comandos existan y contesten

Sesión nueva, en el repo del harness. Un solo runtime, Claude Code: `ADR-010` abandonó ChatGPT.

### 1.1 Los comandos aparecen

Escribí `/starteria` y mirá el menú.

**Pasa si** están los diez, con el prefijo del plugin
(`/starteria-harness:starteria-probar`).

### 1.2 `/starteria-autoridad` detecta un conflicto real

```
/starteria-autoridad que la IA apruebe el frente sola, sin que nadie confirme
```

**Pasa si** emite el bloque `CONFLICT`, nombra INV-03 del Core Contract con su sección, y dice
`Requires ADR: yes`.
**Falla si** elige una lectura, si dice que se puede avanzar, o si nombra el invariante de memoria
sin haber abierto el archivo. Esto último se chequea mirando si leyó `doc/`: si no lo leyó, citó de
memoria, y citar de memoria es exactamente lo que el comando tiene prohibido.

### 1.3 `/starteria-glosario` salta solo

Es el único comando model-invocable. En medio de otra conversación, preguntá:

```
che, qué es reverse alignment
```

**Pasa si** el glosario se invoca sin que lo llames.

**Ojo con este.** Que falle una vez no prueba nada, y que funcione una vez tampoco. La invocación
automática de skills es probabilística: hay evals publicadas que la miden alrededor del 56%.
Corrélo cinco veces y anotá cuántas saltó. Si salta menos de la mitad, el problema no es el
glosario: es que la definición de un término no debería depender de una invocación automática.
Anotalo como hallazgo y seguí.

---

## Fase 2: trayectoria. Que el aislamiento haya aislado de verdad

**Este es el paso que importa.** Todo lo demás se puede fingir; esto no.

El problema en una línea: `/starteria-probar` puede devolver un registro impecable aunque la fase de
responder haya visto la rúbrica, **porque el registro se ve exactamente igual**. Verificar el
veredicto no verifica el harness.

Caso elegido: **`PE-B03`**, solution-first puro. Es el más diagnóstico porque tiene que disparar
reverse alignment y tiene prohibido crear objetos canónicos, así que falla de dos maneras distintas
y reconocibles.

### 2.1 Corré el caso

```
/starteria-probar PE-B03
```

### 2.2 Comprobá el aislamiento, en este orden

No mires el veredicto todavía. Primero estas tres, y si alguna falla, el resto no cuenta.

**a) Fue al subagente correcto.** Tiene que ser `portfolio-entry-responder`. Cualquier otro
subagente puede abrir `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`, que es donde vive el `EXPECTED`.

**b) La fase de responder corrió ciega.** Abrí lo que se le mandó al subagente y buscá tres cosas:

```
la rúbrica  ·  el EXPECTED del caso  ·  la palabra "evaluar"
```

Si aparece **cualquiera** de las tres, el resultado es `CONTAMINADO` aunque el registro diga otra
cosa. Corregí el registro a mano.

**c) El `ACTUAL` está sin editar.** Comparalo con lo que devolvió la fase 1. No "parecido":
idéntico. Si el hilo principal le completó algo que faltaba, dejó de ser una medición.

**d) Recién ahí**, mirá que salgan las siete dimensiones puntuadas, los fallos duros revisados y la
capa de fallo.

### 2.3 La prueba negativa, obligatoria

Esta es la que decide si el harness tiene una salvaguarda o tiene una intención.

Corré el **mismo caso a propósito en un solo hilo**: sin mandar nada a un subagente, respondiendo y
puntuando ahí mismo.

**Pasa si** el registro dice `CONTAMINADO: respondió y puntuó el mismo hilo, el resultado está
inflado`.

**Falla si no lo dice.** Y si falla, **pará acá**. La única salvaguarda del harness no funciona, y
todo verde que produzca de ahora en más no significa nada. Arreglá eso antes de correr otro caso.

---

## Fase 3: rúbrica. Que el orden de puntuación sea el correcto

Sobre la misma corrida de `PE-B03`.

### 3.1 Los nueve fallos duros se revisan ANTES que las siete dimensiones

Mirá el orden en que el comando los escribió.

**Por qué importa y no es cosmética:** los fallos duros son binarios y las dimensiones son de 0 a 2.
La evidencia sobre jueces LLM dice que los veredictos binarios sesgan menos que los scores
holísticos. Arrancar por las dimensiones es entrar por la puerta más sesgada.

### 3.2 `unknown` aparece y es aceptable

Mirá la capa de fallo de las corridas que dieron REVIEW o FAIL.

**El mejor método publicado para atribuir el paso decisivo de un fallo acierta el 14,2% de las
veces.** Si tus corridas nunca dicen `unknown`, no es que el harness sea preciso: es que está
adivinando y presentando la adivinanza como diagnóstico. Un `unknown` honesto vale más que una capa
inventada.

**Pasa si** al menos una corrida de las que corriste dice `unknown` y nadie la trató como un error
de forma.

---

## Fase 4: audiencia. La prueba que de verdad decide

**Alguien de producto que no vio esto antes corre la fase 2 sin ayuda.**

Sentate al lado y no expliques nada. Anotá cada vez que pregunta algo.

**Pasa si** llega al veredicto y puede decir con sus palabras qué significa.

**Falla si** te tiene que preguntar qué es un fallo duro, qué es la rúbrica, o qué quiere decir
`CONTAMINADO`. Y si falla, **el arreglo va en `GLOSARIO.md` o en `RUBRICA.md`, no en la
conversación**. Contestarle a esa persona arregla esa sesión y deja el harness igual de roto para
la siguiente.

---

## Criterio de salida

No se pasa a la fase 3 del plan hasta que estas cinco estén marcadas **con la evidencia al lado**,
no de memoria:

- [ ] todos los comandos responden en sesión nueva (§1.1)
- [ ] `PE-B03` produjo un registro `aislado` con las siete dimensiones y la capa de fallo (§2.2)
- [ ] la prueba negativa produjo `CONTAMINADO` (§2.3)
- [ ] alguien no técnico corrió la fase 2 sin ayuda y entendió el veredicto (§4)
- [ ] la suite de evals corre entera y el delta con plugin es positivo (§0.2)

Y de paso, los dos de `ADR-008` §5:

- [ ] instala desde GitHub (§0.4)
- [ ] en un repo sin `doc/`, pide el contrato en vez de inventarlo (§0.5)

## Cuando termines

Corré `/starteria-cierre`. Un runbook corrido que no quedó en la bitácora es un runbook que se va a
volver a correr entero dentro de dos meses porque nadie va a saber que ya se hizo.

La bitácora y los registros viven en `$STARTERIA_STATE_ROOT`, por defecto
`~/.starteria/<nombre-del-repo>/`, afuera del repo (`ADR-010`). Si corriste todo esto y ese
directorio sigue vacío, las skills no escribieron nada y la corrida no dejó rastro: eso es un
hallazgo por sí solo.
