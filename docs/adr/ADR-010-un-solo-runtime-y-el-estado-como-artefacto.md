---
id: ADR-010
title: "Un solo runtime, y el estado del harness como artefacto encadenado que una memoria indexa"
status: accepted
type: standard
date: 2026-09-12
deciders: [producto]
supersedes: ADR-006
superseded_by: null
aprobado_por: [producto]
aprobado_en: 2026-09-12
review_trigger: "primera sesión en que alguien pide correr el harness fuera de Claude Code, o el primer mes en que gbrain no se consultó ni una vez"
tags: [harness, runtime, estado, memoria, portabilidad]
---

# ADR-010: Un solo runtime, y el estado del harness como artefacto encadenado que una memoria indexa

## 1. Contexto y problema

Son dos problemas que se resuelven juntos porque uno destraba al otro.

**El primero es de alcance.** `ADR-006` decidió sostener dos runtimes, Claude Code y ChatGPT, con un
solo cuerpo de markdown. El precio declarado fue el renombrado manual de catorce archivos, y su
criterio de aceptación abierto —"alguien que no escribió el harness monta el Proyecto siguiendo solo
ese documento"— nunca se cumplió. Nadie lo montó. Entretanto el foco de producto se movió a
empresas, donde la gente ya trabaja con Claude Code, y sostener el segundo runtime pasó a costar sin
que nadie lo cobre.

**El segundo es de arquitectura, y es el que importa.** El harness tiene ocho comandos que cubren
casi todo el arco de trabajo, pero **seis de los ocho escriben a la conversación y ahí se pierden**.
`/starteria-afilar` lo dice de sí mismo: "la salida de esto es claridad, no un documento".
`/starteria-autoridad` devuelve un bloque `CONFLICT` que nadie guarda. `/starteria-probar` deja el
registro "donde el equipo lleve los resultados", sin decir dónde es eso. `estado/BITACORA.md`, el
único archivo que el harness tenía permitido escribir, **no existe**: nunca se corrió
`/starteria-cierre`.

Las skills se referencian entre sí diecinueve veces. Cada una de esas flechas apunta a la memoria de
una persona, no a un artefacto. El efecto acumulado es que **nada acumula**: dos corridas del mismo
caso con tres semanas de diferencia no se pueden comparar, y la pregunta que más importa después de
cuarenta casos —"¿cuáles fallaron por la misma causa?"— no tiene dónde contestarse.

Los dos problemas se tocan en un punto concreto. La forma natural de arreglar el segundo es que cada
paso deje un archivo en disco que el siguiente levante, y que algo indexe esos archivos. ChatGPT no
puede leer rutas de disco ni alcanzar un servicio local, así que mientras `ADR-006` estuviera en pie,
la mitad de la cadena tenía que quedar manual.

## 2. Decisión

### 2.1 Un solo runtime: Claude Code

**Se abandona ChatGPT.** Este ADR supersede a `ADR-006`. Las skills dejan de llevar ramas por
runtime: donde había un par "en Claude Code X, en ChatGPT Y", queda X como prosa directa.

Se borran `skills/starteria/PARA-CHATGPT.md` y `scripts/sync-para-chatgpt.py`, y con ellos el
chequeo de deriva que `scripts/verify.sh` hacía sobre el primero. La tabla de renombrado deja de
existir, que era el costo que `ADR-006` §4 había aceptado como "donde más probable es que alguien
abandone".

### 2.2 El estado es un artefacto encadenado, afuera del repo

**Cada fase del harness escribe un artefacto durable, y la fase siguiente lo lee.** El estado vive
en `$STARTERIA_STATE_ROOT`, por defecto `~/.starteria/<slug-del-repo>/`, con un subdirectorio por
tipo: `entendimiento/`, `conflictos/`, `casos/`, `revisiones/`, `registros/`, `patrones/`, más
`BITACORA.md`.

Afuera del repo por dos razones. Los registros contienen conversaciones reales de usuarios y no
tienen por qué entrar a git. Y el estado es de quien corre el harness, no del harness: dos personas
con el mismo repo instalado tienen historias distintas.

**Encadenar no es bloquear.** `ADR-003` decidió que acá no hay gates, y esta decisión no lo cambia:
una skill lee el artefacto anterior si existe, y **dice que falta si no está**, pero corre igual.
Una cadena que se niega a arrancar es un gate con otro nombre.

### 2.3 La memoria indexa el estado, nunca `doc/`

**gbrain se instala como capa de memoria, y su frontera de ingesta es `$STARTERIA_STATE_ROOT`.**
Los contratos de `doc/` **no entran al brain**.

Esto no es un detalle de implementación: `ADR-005` decidió "citar, no copiar", y meter los contratos
en una base indexada crearía exactamente la copia que envejece en silencio, que es el costo que ese
mismo ADR ya había marcado para `RUBRICA.md`. La línea queda nítida —**los contratos se citan en
vivo desde `doc/`, el estado del harness se indexa**— y es fácil de sostener porque no depende de
que nadie se acuerde: son dos orígenes distintos.

Dos comandos nuevos completan el arco y viven de esta decisión. `/starteria-revisar` revisa un caso
antes de correrlo, que es la fase que faltaba. `/starteria-patron` lee varios registros y busca la
causa común, y **es la única skill del harness que no puede funcionar sin memoria**: es la que
justifica que gbrain esté acá, y la vara para saber si sirvió.

## 3. Alternativas consideradas

- **Sostener ChatGPT y dejar la cadena a medias:** rechazada. Deja el harness sin memoria, que es el
  problema que más duele, para preservar un runtime que nadie montó nunca.
- **Estado versionado en git:** rechazada. Publica conversaciones reales de usuarios en la historia
  del repo, y obliga a revisar cada registro antes de commitear. El costo recae sobre la persona en
  el peor momento, justo después de correr un caso.
- **Estado en `estado/` dentro del repo, ignorado por git:** rechazada, aunque es la más tentadora.
  Un directorio que está en el árbol pero no en la historia confunde: alguien lo va a commitear por
  accidente, o va a asumir que sus registros le llegaron a otro. La ruta configurable es más fea de
  documentar y más honesta.
- **Un archivo plano de estado, sin memoria indexada:** rechazada. Resuelve el encadenado y no
  resuelve la acumulación. La pregunta "qué casos fallaron por la misma causa" sobre cuarenta
  registros es una lectura que nadie hace a mano, y por eso hoy no se hace.
- **Meter también `doc/` al brain, para poder preguntarle por los contratos:** rechazada, y es la
  alternativa más peligrosa porque es la más útil a primera vista. Contradice `ADR-005` y crea una
  copia de los contratos que se pone vieja sin fallar.

## 4. Consecuencias

**Positivas**
- El harness puede correrse punta a punta por primera vez, con cada paso encontrando el anterior.
- Dos corridas del mismo caso se comparan, porque las dos quedaron escritas en el mismo lugar.
- Desaparece el renombrado manual de catorce archivos, y con él la tabla que había que mantener
  cada vez que se agregaba un comando.
- Las skills se acortan: se van las bifurcaciones por runtime de seis archivos.

**Negativas y trade-offs aceptados**
- **Se pierde el runtime ChatGPT, y con él la gente que solo tiene eso.** Es el pedido original de
  `ADR-006` §1, revertido. Si aparece esa necesidad otra vez, este ADR es el que hay que revisar.
- **El harness gana una dependencia de servicio.** gbrain necesita bun, una base y —en modo
  síntesis— una API key con costo por consulta. Hasta hoy el harness era markdown y nada más, y esa
  simplicidad era una virtud que se está gastando a propósito.
- **`$STARTERIA_STATE_ROOT` es una variable de entorno más que explicar.** Alguien la va a tener sin
  configurar y sus artefactos van a ir al default sin que se entere.
- **El estado fuera del repo no se revisa en un PR.** Nadie va a ver un registro mal escrito hasta
  que alguien lo lea.
- **gbrain escribe la clave del proveedor en un `.env` en la raíz del repo.** Lo hace `gbrain init`,
  sin avisar, y `.gitignore` no lo cubría. Quedó cubierto el mismo día, pero es una trampa que va a
  volver: cualquiera que corra `gbrain init` en un repo limpio se lleva un secreto sin ignorar.
- **gbrain lee `skills/` como si fuera suyo.** Su `doctor` reporta "10/10 skills" sobre las nuestras
  y ofrece `gbrain skillpack sync`, que instalaría 63 skills de gbrain ahí. Como `ADR-008` hace que
  el plugin autodescubra `skills/`, correr ese comando publicaría 63 comandos ajenos en el producto.
  **No se corre `gbrain skillpack sync` en este repo.**
- Los cuerpos de `ADR-001`, `ADR-002`, `ADR-003`, `ADR-005`, `ADR-008` y `ADR-009` siguen
  mencionando ChatGPT. **Quedan como están**: un ADR registra lo que se decidió entonces, y
  reescribirlo sería falsificar el registro. Solo `ADR-006` cambia de estado.

## 5. Criterios de aceptación de la decisión

- [x] `grep -ri "chatgpt" skills/ scripts/` devuelve cero. En `docs/adr/` quedan menciones, y está
      bien: son historia. — verificado 2026-09-12.
- [x] El plugin instalado reporta `Skills (10)`. — verificado 2026-09-12, sin reinstalar el plugin.
- [x] gbrain contesta una consulta sobre una página escrita y leída de vuelta, verificado contra el
      dato y no contra el mensaje de éxito del instalador. — verificado 2026-09-12 con dos registros
      de prueba: consulta **sin vocabulario compartido** con lo guardado, similitud 0.84 y 0.82, y
      trajo los dos, que declaran capas distintas (`skill` y `prompt`) y son el mismo mecanismo. Las
      páginas de prueba se borraron después.
- [ ] La cadena corre punta a punta con un caso real, y cada paso encuentra el artefacto anterior.
- [ ] `/starteria-patron` sobre dos registros devuelve una causa común citando los dos.
- [ ] Se corta la cadena a propósito borrando un artefacto intermedio, y la skill siguiente **lo
      dice y sigue**. Es la invariante de `ADR-003` y la única que, si falla, invalida el diseño.

## 6. Gatillos de revisión

Dos, y son opuestos.

El primero es que alguien pida correr el harness fuera de Claude Code. Si pasa, §2.1 estuvo mal y
hay que ver qué costaría volver.

El segundo es que pase un mes sin que nadie consulte gbrain. Si pasa, la memoria no se ganó el lugar
y `/starteria-patron` es teatro: el harness estaría cargando una dependencia de servicio para no
usarla, y lo barato sería volver a archivos planos.

## Historial

- 2026-09-12 · proposed · apareció al mapear el harness contra el arco de gstack y encontrar que el
  problema no eran los comandos que faltaban sino que los que había no se pasaban nada entre sí.
- 2026-09-12 · verificado en parte · tres de los seis criterios del §5 quedaron cumplidos. Los otros
  tres los tiene que correr una persona: las skills llevan `disable-model-invocation: true`, así que
  nadie puede autoinvocarlas, y eso es `ADR-003` funcionando. Corrección de lo asumido al decidir:
  **OpenRouter sí sirve embeddings** por `/api/v1/embeddings`, aunque no esté en su API reference;
  se probó contra la API real y devolvió un vector. No hizo falta una clave de Voyage.
- 2026-09-12 · accepted · aprobado en sesión por producto, que decidió el abandono de ChatGPT, el
  estado afuera del repo con ruta configurable, y gbrain con síntesis semántica desde el arranque.
  La aprobación se **transcribe**, no se produce: `AGENTS.md` permite lo primero y prohíbe lo
  segundo, y sin ella el borrado de `PARA-CHATGPT.md` no podía hacerse, porque `ADR-007` ata
  cualquier borrado a una decisión aceptada.
