---
id: ADR-009
title: "El repo tiene dos harnesses: el producto que se instala y el productor que lo construye, y `ADR-003` solo gobierna al primero"
status: proposed
type: standard
date: 2026-09-11
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "la primera vez que el verify del productor rechace un cambio que igual había que publicar; o la primera vez que alguien pida un gate del lado del producto"
tags: [harness, verificacion, alcance, productor]
---

# ADR-009: El repo tiene dos harnesses: el producto que se instala y el productor que lo construye

## 1. Contexto y problema

Este repo hace dos cosas a la vez y hasta ahora las nombraba igual.

**El producto** son las ocho skills de `skills/`, empaquetadas como plugin por `ADR-008`. Se
instalan en la máquina de alguien de lead o de producto, que corre casos y registra decisiones. Ese
es el harness del que habla el PRD.

**El productor** es lo que hay que hacer para que ese plugin exista y siga funcionando: agregar un
comando, arreglar una cita rota, subir la versión, publicar. Lo hace alguien con una terminal, un
clon y Node instalado.

Nunca se escribió que fueran dos. La consecuencia práctica apareció en una auditoría del harness:

- El plugin publica ocho skills y **cero evals**. `claude plugin eval` existe como CLI y no hay
  suite que corra. Cambiar el cuerpo de un comando no tiene antes ni después medible.
- Nada comprueba, antes de publicar, que el plugin siga cargando. En una sesión de trabajo el
  inventario en disco reportaba `Skills (8)` mientras el registro de esa sesión listaba **una sola**.
  La causa no quedó establecida; lo que importa acá es que nada en el repo estaba puesto para
  notarlo, y se descubrió a mano.
- `docs/progress.md` lleva el estado de construir el harness en prosa escrita a mano. Sirve para
  contar, no para saber qué feature está abierta ni con qué evidencia se cerró la anterior.

Y hay una razón por la que esto no se arregló antes: **parecía prohibido**. `ADR-003` dice "ninguna
verificación automática" y es la decisión más citada del repo.

## 2. Decisión

**Son dos harnesses con reglas distintas, y `ADR-003` gobierna solo el del producto.**

`ADR-003` rechazó los chequeos mecánicos por tres razones, y las tres son sobre el producto:

1. *"alguien no técnico no instala Node, no corre scripts y no diagnostica por qué el script falló"*.
   Es una afirmación sobre el usuario del plugin. El productor ya corre Node.
2. La asimetría de runtimes: en ChatGPT no hay dónde correr un script. El productor trabaja en una
   terminal, no en ChatGPT.
3. Los gates tipo G1–G9 sirven para *"trabajo de código con builds y suites"*, y acá *"el objeto
   verificado es la interpretación de un modelo, que ninguna máquina puede aprobar"*. Construir el
   plugin **sí** es trabajo de código, sí tiene build y sí puede tener suite. El objeto verificado
   es otro: no si el modelo interpretó bien un caso, sino si el plugin carga y las ocho skills están.

Ninguna de las tres aplica del lado productor. Así que:

| | Producto | Productor |
|---|---|---|
| Qué es | las 8 skills, instaladas como plugin | este repo, para construirlas |
| Quién lo usa | lead y producto, sin terminal | quien mantiene el harness |
| Runtime | Claude Code y ChatGPT | una terminal con Node |
| Verificación | **humana y declarada** (`ADR-003`) | **mecánica**, `scripts/verify.sh` |
| Estado | `estado/BITACORA.md`, en el repo del usuario | `docs/progress.md`, en este repo |
| Cierre de sesión | `/starteria-cierre` | anotar en `docs/progress.md` |

**`scripts/verify.sh` es el gate del productor.** Comprueba lo que una máquina puede comprobar sin
opinar sobre ninguna interpretación: que los manifiestos sean válidos, que haya ocho carpetas con
`SKILL.md`, que cada una declare `name` y `description`, y que el inventario del plugin instalado
reporte `Skills (8)`. Nada más. No puntúa casos, no lee `doc/`, no aprueba nada del producto.

**La fuga de `.mcp.json` se avisa, no se rechaza.** `ADR-008` la aceptó como costo de empaquetar en
la raíz. El verify la reporta para que no se olvide, y sigue.

**Corrección de alcance que se desprende de esto:** `estado/BITACORA.md` es estado de runtime del
**producto**. Lo escribe `/starteria-cierre` en el repo de quien usa el plugin. Que esté en
`.gitignore` de este repo es correcto: acá solo aparece al comerse la propia comida. Lo que estaba
mal era el árbol de `ARCHITECTURE.md` §2, que lo listaba como archivo de este repo sin la anotación
"ignorado" que sí les pone a `referencia/` y `token-optimizer/` dos líneas más arriba.

## 3. Alternativas consideradas

- **Dejar todo como estaba y no escribir nada.** Rechazada. El costo ya se estaba pagando: el
  1-de-8 se encontró a mano, y solo porque alguien miró. La próxima vez puede publicarse roto.
- **Extender `ADR-003` al productor y seguir sin ninguna verificación.** Rechazada. Sería aplicar a
  un desarrollador con terminal un argumento construido sobre alguien que no tiene terminal. El
  propio `ADR-003` dice que un chequeo que no se puede ejecutar es un chequeo que no existe; del
  lado productor sí se puede ejecutar, así que el argumento se da vuelta.
- **Superar `ADR-003`.** Rechazada, y es la alternativa más tentadora. `ADR-003` no está equivocado:
  sigue siendo la decisión correcta para el producto, y su gatillo de revisión —tres meses sin una
  corrida registrada— sigue vivo. Marcarlo `superseded` borraría una decisión que sigue en pie para
  arreglar un problema que era de alcance, no de fondo.
- **Separar los dos harnesses en dos repos.** Rechazada por ahora. Resuelve la confusión de nombres
  al precio de que el plugin y sus contratos queden en lugares distintos, que es justo lo que
  `ADR-008` evitó. Vale la pena reconsiderarla si el productor crece más que el producto.
- **Un gate más ambicioso: que el verify corra los casos del AI Harness.** Rechazada. Eso es
  exactamente lo que `ADR-003` prohíbe y con razón: puntuar un caso es interpretar, y ninguna
  máquina lo aprueba. El verify se queda en estructura.

## 4. Consecuencias

**Positivas**
- Publicar deja de depender de que alguien se acuerde de mirar. `verify.sh` falla o no falla.
- "Agregar features o fix" pasa a tener un antes y un después comprobable, que es la condición para
  que el plugin pueda cambiar sin miedo.
- `ADR-003` queda más fuerte, no más débil: ahora dice sobre qué manda, en vez de leerse como una
  prohibición general que nadie se animaba a tocar.
- Desbloquea la suite de evals del producto (`claude plugin eval`), que es del productor aunque
  evalúe al producto.

**Negativas y trade-offs aceptados**
- **Un segundo harness es un segundo harness.** Hay que mantenerlo, y puede pudrirse igual que el
  primero. Si `verify.sh` empieza a fallar por razones que a nadie le importan, lo van a saltear.
- **La frontera va a rozarse.** La suite de evals evalúa al producto pero la corre el productor.
  Cada vez que aparezca un caso así hay que decidir de qué lado cae, y la regla es la del §2: quién
  lo ejecuta y con qué runtime, no sobre qué opina.
- **El repo se vuelve más difícil de explicar.** Alguien que llega ahora tiene que entender que
  "harness" nombra dos cosas. El `ADR-INDEX` ya tenía que explicar dos series de ADR; ahora también
  dos harnesses.
- Requiere Node y el CLI de `claude` para verificar. Del lado productor eso es un supuesto
  razonable, pero es un supuesto nuevo y escrito.
- **No arregla el 1-de-8.** El verify comprueba el disco; el síntoma observado era de sesión. Que la
  causa siga sin establecerse es deuda, y queda anotada como tal.

## 5. Criterios de aceptación de la decisión

- [x] `scripts/verify.sh` existe, es ejecutable y corre desde cualquier directorio.
- [x] Con el repo sano, sale 0 e informa `Skills (8)`.
- [x] Si se le saca el `SKILL.md` a una carpeta, sale distinto de 0 y dice cuál. Probado también
      borrando una carpeta entera: reporta 7 de 8.
- [x] Reporta la fuga de `.mcp.json` como aviso, sin fallar por ella.
- [x] `ARCHITECTURE.md` §2 anota `estado/BITACORA.md` como runtime del producto, ignorado acá.
- [x] `docs/progress.md` distingue las dos columnas y dice quién verifica cada una.
- [x] Ningún comando del producto cambia de comportamiento por esta decisión. **Es una invariante
      continua, no un hito:** vuelve a quedar en duda cada vez que alguien toque el productor.
      Matiz registrado el mismo día: al cablear el chequeo de `ADR-006` sí se editó un archivo del
      producto, `skills/starteria/PARA-CHATGPT.md`, para ponerle los centinelas que delimitan los
      bloques generados y para sacarle un conteo escrito a mano. Comentarios HTML invisibles al
      renderizar y una línea de prosa: ningún comando cambia de comportamiento. La invariante que
      importa es la de ejecución y se sostiene —`sync-para-chatgpt.py --check` no escribe nada, y
      por eso diverge a propósito del `check-mirror-sync.sh` de token-optimizer, que sí regenera
      sobre el working tree.
- [x] Existe una suite de evals del plugin y `claude plugin eval` la corre. Cinco casos en
      `evals/`, tres corridas cada uno, con brazo sin plugin para medir el delta. Verificado el
      2026-09-13.

Ese último era el trabajo que esta decisión habilitaba, y es lo que vuelve barato cambiar un comando
del producto: ahora se puede saber qué se rompió sin abrir diez chats.

**La suite no cruza la línea de `ADR-003`.** Ningún caso puntúa si el agente de Portfolio Entry
interpretó bien una entrada. `probar-aisla-la-fase-1` verifica que el aislamiento haya ocurrido, que
es una propiedad de ejecución y una máquina puede mirarla; no verifica que `PE-B03` haya pasado, que
es interpretación y la puntúa una persona. La distinción es la misma que separa este ADR del otro, y
es lo primero que se va a perder si alguien agrega casos sin leer esto.

## 6. Gatillos de revisión

Dos, y cualquiera de los dos obliga a releer esto:

- **`verify.sh` rechaza un cambio que igual había que publicar.** Significa que el gate mide algo
  que no importa, y un gate que se saltea es peor que no tenerlo.
- **Alguien pide un gate del lado del producto.** Significa que la frontera del §2 se corrió, o que
  el gatillo de `ADR-003` —tres meses sin una corrida registrada— se disparó y el problema real es
  que nadie está usando el harness.

## Historial

- 2026-09-11 · proposed · Escrito a partir de una auditoría del harness que dio 28/100 en un
  validador estructural genérico. La mayor parte de ese número era desajuste de nombres de archivo:
  el validador busca `init.sh` y `feature_list.json` en la raíz y no ve `ADR-003` ni `LIFECYCLE.md`.
  Lo que sí resultó real, después de separar producto de productor, fue que el lado productor no
  tenía harness: cero evals, ninguna verificación previa a publicar, y estado en prosa. El primer
  diagnóstico de esa auditoría fue **incorrecto**: dijo que `estado/BITACORA.md` era un hueco porque
  está en `.gitignore`. No lo es; es estado del producto y vive en el repo del usuario. Queda
  anotado porque el error tiene una lección: sin la distinción de este ADR, un artefacto del
  producto se lee como un defecto del productor.
- 2026-09-12 · actualizado · `ADR-010` cruza la frontera que este ADR trazó, y conviene decirlo.
  gbrain entra como memoria del **producto**, no del productor: lo consulta `/starteria-patron`, que
  es un comando que se instala con el plugin. La separación de §2 sigue en pie —el gate del
  productor no toca el producto— pero deja de ser cierto que el producto es solo markdown. El
  criterio abierto del §5 (ausencia de suite de evals del lado productor) **no se cierra con esto**:
  indexar el estado del producto y puntuar al agente son dos problemas distintos, y `ADR-010` §2.3
  solo resuelve el primero. Además, `estado/BITACORA.md` deja de vivir en el repo del usuario y pasa
  a `$STARTERIA_STATE_ROOT`, lo que vuelve moot la entrada de `.gitignore` que lo cubría.
- 2026-09-13 · cerrado el último criterio: la suite de evals existe y corre. De paso, dos números de
  esta sección quedaron viejos: dicen `Skills (8)` y hoy son diez, porque `ADR-010` agregó
  `/starteria-patron` y `/starteria-revisar`. Se deja el texto original, que registra lo que se
  verificó ese día, y se anota acá que el gate cuenta diez. `scripts/verify.sh` también pasó a exigir
  `Agents (1)` y a comparar la versión instalada contra el manifiesto: sin lo segundo,
  `claude plugin update` contesta "ya estás al día" y deja una copia vieja instalada sin avisar, que
  fue exactamente lo que pasó al publicar.
