# Plan del harness

**Versión:** v0.1
**Fecha:** 2026-09-10
**Estado:** fase 1 hecha, fase 2 sin empezar

Este es el plan versionado dentro del repo. Antes vivía en `~/.claude/plans/`, fuera del proyecto,
donde nadie del equipo lo iba a encontrar.

## Por qué existe el harness

`doc/` tiene nueve documentos y treinta y dos casos de prueba que nadie puede correr sin media hora
de lectura previa. La persona que más necesita el resultado, la que gobierna el portafolio, es la
que no va a hacer esa lectura. El detalle está en `PRD.md` §1.

## Las decisiones que fijaron el plan

Todas están argumentadas en `adr/`, con sus alternativas y su costo. Acá van solo para que se
entienda la forma del trabajo.

| Decisión | ADR |
|---|---|
| Skills en `skills/`, empaquetadas como plugin autodescubierto | `ADR-001` (superado por `ADR-008`) |
| `/starteria-probar` separa responder de puntuar | `ADR-002` |
| Sin gates: nada se verifica solo, y se declara | `ADR-003` |
| Alcance v0.1: Portfolio Entry | `ADR-004` |
| Citar `doc/`, no copiarlo, salvo tres derivados | `ADR-005` |
| Un cuerpo de markdown para los dos runtimes | `ADR-006`, superado por `ADR-010` |
| El harness no escribe en `doc/` | `ADR-007` |

## Fase 1: construir. Hecha

**Los diez comandos**, en `skills/starteria*`:
`/starteria` (router), `/starteria-afilar`, `/starteria-autoridad`, `/starteria-probar`,
`/starteria-caso`, `/starteria-decision`, `/starteria-cierre`, `/starteria-glosario`.

**Los archivos de apoyo**: `MAPA-DE-DOCUMENTOS.md`, `GLOSARIO.md`, `PARA-CHATGPT.md`, `RUBRICA.md`,
`REGISTRO.md`, `PLANTILLA.md` de caso y `PLANTILLA-ADR.md`. Quince archivos, unas 9.300 palabras.

**Los documentos del harness**, en `docs/`: este plan, `PRD.md`, `DDD.md`, `ARCHITECTURE.md`,
`LIFECYCLE.md` y los siete ADR con su índice.

**Un puntero** en `CLAUDE.md` para que cualquier sesión de Claude Code sepa que el harness existe.

### Verificación estructural, corrida

| Qué | Resultado |
|---|---|
| Los 8 `name:` coinciden con su carpeta | OK |
| 7 user-invocable, glosario model-invocable | OK |
| Enlaces internos entre archivos del harness | 0 rotos |
| Em-dashes en el cuerpo del harness | 0 |
| Los 9 archivos de `doc/` que cita el mapa existen | OK |
| Los 3 que el mapa declara ausentes, siguen ausentes | confirmado |
| Los 32 ids de caso coinciden con el AI Harness | OK |
| Los 9 fallos duros de `RUBRICA.md` coinciden con §3, en orden | OK |
| El clon de mattpocock quedó intacto, movido a `referencia/` | `git status` vacío |

## Fase 2: probar. Sin empezar

Esto es lo que separa un harness escrito de un harness que sirve. Ninguno de estos pasos lo puede
dar la herramienta sola.

La forma de estas pruebas salió de mirar cómo se prueban hoy los harness de agentes (investigación
del 2026-09-10, fuentes en `~/Documents/Last30Days/ai-agent-evals-harness-testing-raw-v3.md`). Tres
hallazgos cambiaron el plan y están marcados abajo donde aplican.

### 2.1 Humo: los comandos existen y responden

1. **Instalar el plugin y abrir sesión nueva.** `claude plugin marketplace add <ruta o repo>` y
   `claude plugin install starteria-harness@darkcodepe`. Después, escribir `/starteria` y confirmar
   que aparecen los ocho. Verificado el 2026-09-11: el inventario reporta `Skills (8)`.
2. **`/starteria-autoridad`** con un cambio que contradiga INV-03, por ejemplo "que la IA apruebe el
   frente sola". Tiene que emitir `CONFLICT` y pedir ADR, no elegir una lectura.
3. **`/starteria-glosario`**: preguntar qué es reverse alignment en medio de otra conversación y ver
   si salta sin que lo invoquen.

### 2.2 Trayectoria: que el aislamiento haya aislado de verdad

**Este es el paso que antes no estaba, y es el que más importa.**

El ejemplo que lo explica: un "refund processed" se ve idéntico con o sin el paso de verificación de
identidad. Una salida correcta puede tapar un razonamiento roto, así que evaluar solo el resultado
final no alcanza. Traducido acá: `/starteria-probar` puede devolver un registro impecable aunque la
fase de responder haya visto la rúbrica, **porque el registro se ve igual**. Verificar el veredicto
no verifica el harness.

Corré `PE-B03` (solution-first puro, el más diagnóstico: tiene que disparar reverse alignment y no
debe crear objetos canónicos) y comprobá, en este orden:

1. **La fase de responder corrió ciega.** Abrí lo que se le mandó y confirmá que no contiene la
   rúbrica, ni el `EXPECTED`, ni la palabra "evaluar". Si el subagente vio cualquiera de las tres, el
   resultado es `CONTAMINADO` aunque el registro diga otra cosa.
2. **El `ACTUAL` está sin editar.** Comparalo con lo que devolvió la fase 1, carácter por carácter.
3. **Recién ahí**, que salgan las siete dimensiones puntuadas, los fallos duros y la capa de fallo.

**Prueba negativa, obligatoria:** corré el mismo caso a propósito en un solo hilo. Si el registro
**no** dice `CONTAMINADO`, la única salvaguarda del harness no funciona y hay que arreglar eso antes
de correr nada más. Un harness que no detecta su propia contaminación produce verdes que no
significan nada.

### 2.3 Rúbrica: que el orden de puntuación sea el correcto

1. **Los nueve fallos duros se revisan ANTES que las siete dimensiones.** No es un detalle de
   presentación: la evidencia sobre jueces LLM muestra que los veredictos binarios sesgan menos que
   los scores holísticos. Los fallos duros son binarios; las dimensiones de 0 a 2 no. Si al puntuar
   se arranca por las dimensiones, se está entrando por la puerta más sesgada.
2. **`unknown` en la capa de fallo tiene que aparecer y ser aceptable.** El mejor método publicado
   para atribuir el paso decisivo de un fallo acierta el **14.2%** de las veces. Si tus corridas
   nunca dicen `unknown`, no es que el harness sea preciso: es que está adivinando y presentando la
   adivinanza como diagnóstico.

### 2.4 Audiencia: la prueba que de verdad decide

**Alguien de producto que no vio esto antes corre 2.2 sin ayuda.** Si necesita que le expliquen qué
es un fallo duro, el glosario o la rúbrica fallaron, y se arreglan ahí, no en la conversación.

### 2.5 Segundo runtime

**Montar el Proyecto de ChatGPT** siguiendo `PARA-CHATGPT.md` y repetir 2.2 y 2.1. El aislamiento
acá es de dos chats en vez de un subagente, así que la prueba negativa de 2.2 vale doble: es el
runtime donde más fácil es saltearse el paso.

### Criterio de salida de la fase 2

No se pasa a fase 3 hasta que:

- [ ] los diez comandos responden en sesión nueva;
- [ ] `PE-B03` produjo un registro `aislado` con las siete dimensiones y la capa de fallo;
- [ ] la prueba negativa produjo `CONTAMINADO`;
- [ ] alguien no técnico corrió 2.2 sin ayuda y entendió el veredicto;
- [ ] lo mismo funciona en ChatGPT.

## Fase 3: usar. Depende de la 2

El protocolo del AI Harness §18, que ya está escrito y solo hay que ejecutar:

- **Round 1**: 20 a 25 casos, una corrida cada uno. Errores gruesos.
- **Round 2**: los que fallaron y los ambiguos, tres corridas cada uno. Estabilidad.
- **Round 3**: casos reales de usuario, con `/starteria-caso`. UX y utilidad.

El criterio de salida hacia Tech Spec está en `LIFECYCLE.md` §4.

### Tres reglas de curaduría para el Round 3

Salieron de la misma investigación y contradicen el instinto de "agregar todos los casos reales que
aparezcan". Van acá y no en fase 2 porque recién aplican cuando el set empieza a crecer:

- **Core congelado, set creciente aparte.** Los 32 casos de las suites A a I son el baseline y no se
  tocan: si cambian, se pierde la única referencia contra la cual comparar corridas viejas. Los casos
  de Round 3 van a un set separado que sí crece.
- **Clusterizar, no acumular.** Si veinte usuarios tropiezan con el mismo borde, eso es **un** caso,
  no veinte. Guardar uno o dos representativos por modo de fallo; el resto infla la suite y no agrega
  señal.
- **Incluir casos que pasan.** Un set de puros fallos no detecta cuándo arreglar un modo rompió otro
  que andaba bien. Por cada caso de Round 3 que expone un fallo, sumar uno que hoy funciona y que
  quedaría roto si se toca esa regla.

Las tres van a `/starteria-caso`, que hoy no las tiene.

## Lo que quedó afuera, y por qué

| Fuera | Motivo |
|---|---|
| Verificación mecánica | `ADR-003`. Contradice la postura y el usuario no técnico no la puede correr |
| Suites parametrizadas por experiencia | `ADR-004`. Generalizar con un solo caso produce la abstracción equivocada |
| Empaquetado como plugin instalable | No hace falta mientras el harness viva en este repo |
| Bundle generado para ChatGPT | `ADR-006`. Es una copia más que envejece |
| Tocar el clon de mattpocock (ahora `referencia/`) | `ADR-001`. Es de otro proyecto |
| Los ADR de producto | `ADR-007`. Los escribe una persona cuando haya una decisión que registrar |

## Riesgos vivos

Los cinco están en `PRD.md` §6 con su contención. Los tres que **no tienen contención mecánica**,
por decisión y no por olvido:

- Nadie corre el harness y nadie se entera.
- El `EXPECTED` de un caso nuevo se copia de lo que contestó el agente, y entonces ese caso nunca
  falla.
- `RUBRICA.md`, `GLOSARIO.md` o `MAPA-DE-DOCUMENTOS.md` quedan viejos respecto de `doc/`: no fallan,
  contestan distinto.

Decirlos es la contención. Es menos que un chequeo y más que nada.
