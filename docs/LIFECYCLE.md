# Ciclos de vida

**Versión:** v0.2
**Fecha:** 2026-09-13

Seis relojes que corren a velocidades distintas: el request de producción (segundos), la unidad de
trabajo del productor (horas), la sesión de producto (horas), el caso (semanas), la decisión (meses)
y el harness (la vida del proyecto). Confundirlos es cómo un fallo de una tarde termina cambiando un
invariante.

Los relojes §1 a §4 son del **producto**: los mueve quien *usa* los diez comandos. El §5 es del
**productor**: lo mueve quien *cambia* el harness. Es la distinción de `ADR-009 del harness`, y acá
se ve como dos relojes que casi nunca están en la misma hora.

El §6 es nuevo y es de otra clase: **el pipeline de la integración con la plataforma**, que no lo
mueve nadie porque lo mueve un usuario final. Todavía no existe — es el reloj que propone
[`BLUEPRINT-INTEGRACION.md`](BLUEPRINT-INTEGRACION.md).

## 1. La sesión de producto

Quien *usa* los diez comandos. Cambiarlos es §5.

```text
        ┌─────────────────────────────────────────────┐
        │  ABRIR                                      │
        │  leer la última entrada de estado/BITACORA  │
        └───────────────────┬─────────────────────────┘
                            ▼
              ¿qué tipo de trabajo es?
                            │
     ┌──────────────┬───────┴───────┬──────────────┐
     ▼              ▼               ▼              ▼
  la idea       el cambio      el compor-      un usuario
  es difusa     choca con      tamiento        dijo algo
     │          algo escrito   hay que verlo   nuevo
     ▼              ▼               ▼              ▼
  /afilar      /autoridad       /probar        /caso
     │              │               │              │
     └──────────────┴───────┬───────┴──────────────┘
                            ▼
                  ¿se decidió cambiar una regla?
                       sí │        │ no
                          ▼        │
                    /decision      │
                          │        │
                          └────┬───┘
                               ▼
                   ┌───────────────────────┐
                   │  CERRAR               │
                   │  /cierre              │
                   │  lo que no entra acá  │
                   │  se perdió            │
                   └───────────────────────┘
```

**Nada obliga a cerrar.** Si la sesión termina sin `/starteria-cierre`, no pasa nada visible: no
hay aviso, no hay tarea pendiente, no hay nadie preguntando. La próxima sesión simplemente arranca
sin saber qué pasó en esta. Es la consecuencia más concreta de no tener gates.

### Qué sobrevive y qué no

| Sobrevive | Muere al cerrar |
|---|---|
| Lo que quedó en `estado/BITACORA.md` | La conversación entera |
| Los registros de corrida guardados | Los `ACTUAL` que no se registraron |
| Los ADR escritos | Las decisiones habladas y no escritas |
| Los casos redactados y entregados | Los conflictos detectados y no escritos |

La columna derecha es más larga que la izquierda por defecto. Invertir eso es todo el trabajo de
`/starteria-cierre`.

## 2. El caso

```text
   conversación real                   suites A a I
   con un usuario                      (ya escritas)
        │                                   │
        ▼                                   │
   [redactado]  ── /starteria-caso          │
        │  input sin editar                 │
        │  esperado desde el contrato       │
        └───────────────┬───────────────────┘
                        ▼
                   [corrible]
                        │  /starteria-probar
                        ▼
              ┌──── [corrido] ────┐
              │         │         │
            PASS      REVIEW     FAIL
              │         │         │
              │    ¿causa          │  correr 3 veces (Round 2)
              │     conocida?      │         │
              │    sí │  no        │    ¿es un patrón?
              │       │   │        │     no │      │ sí
              ▼       ▼   ▼        ▼        ▼      ▼
          [estable] [ok] [FAIL   [escalado] [ruido] /autoridad
                          latente]                      │
                                                        ▼
                                          el escalón más bajo
                                          que explique el fallo
                                                        │
                                          si es Core ──> /decision
```

**Un `REVIEW` sin causa conocida es un `FAIL` que todavía no se descubrió.** El criterio de salida
del AI Harness §19 acepta `REVIEW` con causa; sin causa no.

**Un caso solo no cambia un contrato.** El Round 2 del protocolo (§18) manda tres corridas antes de
sacar conclusiones. Un `FAIL` que no se repite es ruido, y tratarlo como señal es el error más caro
del harness: se cambia una regla por una corrida que no gustó, y el contrato deja de describir el
producto.

**Un caso redactado no entra a `doc/` solo.** Sumar un caso es un cambio de contrato: el comando lo
entrega escrito y lo integra una persona.

## 3. La decisión

```text
   [detectada]  un conflicto, o un patrón de fallos
        │
        ▼  /starteria-autoridad dice si hace falta ADR
   ¿cambia un invariante, una relación del dominio,
    la frontera persona/IA, obliga a migrar datos, o
    toca una regla que otras experiencias usan?
        │
    no  │  sí
    ────┘   │
   se avanza│
   sin ADR  ▼
        [propuesto]  /starteria-decision lo redacta
             │
             │  ⚠ acá termina lo que puede hacer la herramienta
             │
             ▼  una persona con autoridad, con nombre y fecha
      ┌──────┴───────┬──────────────┐
      ▼              ▼              ▼
  [aceptado]    [rechazado]   [reemplazado por ADR-XXX]
      │
      ▼
  hay que actualizar los documentos que el ADR nombra,
  y los casos cuyo esperado cambió van a fallar
  por el motivo correcto
```

**La transición a `aceptado` no la hace la herramienta.** Puede transcribir una aprobación que una
persona dio en esa conversación; no puede producir una que nadie dio. Y un ADR con preguntas
abiertas adentro no puede estar en `aceptado`: una firma sobre un hueco es peor que un hueco.

**Un ADR aceptado deja documentos desactualizados.** Nada los actualiza solo. El ADR nombra cuáles,
y alguien los edita, o la decisión existe solo en el ADR y el contrato sigue diciendo lo viejo.

## 4. El harness

```text
   v0.1  ESCRITO
   ├─ 8 comandos, rúbrica, plantillas, glosario, mapa
   ├─ verificado estructuralmente
   └─ ⚠ nunca corrido end to end
            │
            ▼
   v0.1  EN USO                        ← acá empieza a valer algo
   ├─ Round 1: 20 a 25 casos, 1 corrida cada uno, errores gruesos
   ├─ Round 2: los que fallaron y los ambiguos, 3 corridas, estabilidad
   └─ Round 3: casos reales de usuario, UX y utilidad
            │
            ▼
   CRITERIO DE SALIDA (AI Harness §19)
   ├─ ningún caso con fallo duro
   ├─ 85% o más en PASS
   ├─ ningún caso crea objetos canónicos
   ├─ ninguno inventa baseline, target ni evidencia
   ├─ solution-first dispara reverse alignment de forma consistente
   ├─ el plan de preguntas respeta el 0 a 3
   ├─ los casos reales producen una experiencia entendible
   └─ los REVIEW que quedan tienen causa conocida
            │
            ▼
   TECH SPEC  ← recién acá se habla de modelo, endpoint, schema
            │
            ▼
   v0.2  OTRA EXPERIENCIA
   parametrizar las suites, una carpeta por experiencia
```

**El harness no está terminado cuando están los diez comandos. Está terminado cuando alguien los
corrió.** Hoy está en el primer escalón: escrito, verificado por estructura, sin una sola corrida
completa. La distinción entre "escrito" y "probado" es la que el harness le exige a todo lo demás,
y se la aplica a sí mismo.

## 5. La unidad de trabajo del productor

El reloj de quien cambia el harness. Las cinco primeras fases son los cuatro pasos de `entry-01` a
`entry-04` aplicados al pedido de cambio; el contrato operativo está en
[`AGENTS.md`](../AGENTS.md) y el razonamiento en [`BLUEPRINT.md`](BLUEPRINT.md).

```text
   [pedido]   una línea de alguien que quiere cambiar el harness
        │
        ▼  P1   /starteria            ¿desde dónde entra? ¿qué necesita?
   [clasificado]
        │
        ▼  P2   /starteria-afilar      hecho vs decisión, por rondas
   [entendido]
        │
        ▼  P3   🔒 la persona confirma ──── no ───> vuelve a P2   (ciclo A)
        │  sí
        ▼  P4   /starteria-autoridad   qué documento manda, qué falta
   [ubicado]
        │
   ¿hace falta ADR?
    no  │   sí
   ─────┤    ▼  P6  /starteria-decision  ──> [propuesto]
        │         │
        │         ▼  P7  🔒 una persona firma, con nombre y fecha
        │    [aceptado]
        │         │
        └─────┬───┘
              ▼  P5 + P8   una unidad, entregable declarado, cambio quirúrgico
       [implementado]
              │
              ▼  P9   scripts/verify.sh        ← el único gate del repo
       [estructura ok]                            sale 1 si algo falla
              │
              ▼  P10  /starteria-probar        fase 1 afuera │ fase 2 acá
        [corrido]
              │
              ▼  P11  🔒 la persona lee el veredicto
              │
      ┌───────┼──────────────────┐
      ▼       ▼                  ▼
   sirve   falló por        es un patrón
      │    implementación    de fallos
      │       │                  │
      │       ▼ ciclo B          ▼ ciclo C
      │      P8                 P4
      ▼
   P12  docs/progress.md   (+ el ADR que este cambio dejó viejo)
      │
      ▼
   P13  🔒 rama y PR, cuando la persona lo pide
```

**Los dos relojes de verificación no son el mismo, y es la trampa de esta fase.** P9 es mecánico:
corre, tarda segundos y falla solo. P10 es humano: no corre si nadie lo corre. Un trabajo que pasó
P9 y saltó P10 está verificado *en estructura* y sin verificar *en comportamiento* — y desde afuera
las dos cosas se ven igual de verdes.

### Qué sobrevive y qué no

| Sobrevive | Muere al cerrar |
|---|---|
| Lo que quedó en `docs/progress.md` | La conversación entera |
| El commit en la rama, y el PR | Los cambios sin commitear |
| El ADR escrito, con su costo anotado | Las decisiones habladas y no escritas |
| El registro de corrida guardado | El `ACTUAL` que no se registró |
| Un aviso nuevo de `verify.sh` **anotado** | Un aviso nuevo que nadie anotó, que la próxima sesión va a leer como conocido |

**Nada obliga a llegar a P12.** Si la sesión termina sin escribir `docs/progress.md`, no pasa nada
visible: la próxima arranca sin saber qué se tocó. Es la misma consecuencia que §1, un nivel más
arriba, y por la misma razón: no hay gate que cierre, solo uno que verifica estructura.

**La fila del aviso es la más fácil de perder.** `verify.sh` sale 0 con dos avisos conocidos. Si un
cambio agrega un tercero y nadie lo anota, el aviso queda indistinguible de los dos que están
aceptados, y a partir de ahí "sale 0 con avisos" deja de significar nada.

## 6. El pipeline de la integración

**No existe todavía.** Lo que sigue es el reloj que propone
[`BLUEPRINT-INTEGRACION.md`](BLUEPRINT-INTEGRACION.md), escrito acá porque es un ciclo de vida y no
un diseño. Mientras Portfolio Entry no esté implementado en la plataforma —y hoy no lo está: el
contrato de `doc/` no aparece en una sola línea de `Dashboardstarteria/`— este reloj está parado en
cero.

Es el único de los seis que corre a **dos velocidades**, y el primero que **tiene alarma**.

Lo de acá abajo también está dibujado en
[`diagramas/pipeline-integracion.drawio`](diagramas/pipeline-integracion.drawio) — página 1 los dos
tramos, página 2 la topología MCP y sus tres fronteras.

### 6.1 El tramo caliente — segundos, por request

```text
   una persona escribe en Pantalla 1
        │   raw_input: string          (lo único obligatorio)
        ▼
   ┌──────────────────────────────────────────────────┐
   │  ai-service — Portfolio Entry                     │
   │                                                   │
   │   entry-01   intent + entry_state                 │
   │   entry-02   contexto + contradicciones           │
   │   entry-03   reverse alignment (condicional)      │
   │   entry-04   0 a 3 preguntas                      │
   │                                                   │
   │   valida contra doc/generated/…schema.json        │
   │   emite HarnessTrace (por qué tomó este camino)   │
   └───────────────────┬───────────────────────────────┘
                       ▼
        PortfolioEntryAnalysis
        pending │ ready │ insufficient_input │ failed │ superseded
                       │
                       │  ⚠ ready ≠ confirmed — acá no se confirmó nada
                       ▼
   ┌──────────────────────────────────────────────────┐
   │  Pantalla 2 — 🔒 la persona confirma              │
   │  patrón de ADR-005 del producto:                  │
   │  confirmar · editar · descartar                   │
   └───────────────────┬───────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     confirma       corrige        descarta
        │              │               │
        │      ← señal de oro          │
        ▼              ▼               ▼
      Challenge / Project, con Step 0 prefilled
```

**Este tramo corre aunque nadie se acuerde.** Es lo único que lo separa de los otros cinco relojes:
no depende de que alguien abra un chat, ni corra un script, ni cierre una sesión. Un usuario
escribe y el pipeline arranca.

**La corrección en Pantalla 2 es la única señal de verdad que no viene de un agente.** Un análisis
que la persona corrigió es un caso fallado **con su respuesta correcta adjunta**. Es el insumo más
barato y más valioso del diseño entero, y hoy se tira.

**El punto donde se rompe todo si se hace mal:** mapear `ready` a `confirmed`. `ready` significa
*alcanza para seguir*; `confirmed` significa *una persona firmó*. Colapsarlos convierte a la
plataforma en algo que firma por el usuario, que es `INV-03` roto en el único lugar donde nadie lo
vería.

### 6.2 El tramo frío — semanas, por lote

```text
   análisis + lo que la persona corrigió
        │
        ▼   redacción PII          🔒 bloqueo, no advertencia
   ¿el texto salió sin nombres de persona, empresa ni cliente?
        │                                    │
     no │ el lote no sale                 sí │
        ▼                                    ▼
   se queda en producción        $STARTERIA_STATE_ROOT/produccion/
                                             │
                                             ▼   gbrain ingesta
                                  ┌──────────────────────────┐
                                  │  wiki + memoria (MCP)     │
                                  │  fuentes:                 │
                                  │   harness-estado          │
                                  │   produccion              │
                                  │  doc/ NO entra            │
                                  └────────────┬─────────────┘
                                               ▼
                                    /starteria-patron
                                    causa común entre análisis
                                    que no comparten vocabulario
                                               │
                                               ▼
                              🔒 una persona elige cuáles valen
                                               │
                                               ▼
                                    /starteria-caso
                                    [redactado] → [corrible]
                                               │
                        ┌──────────────────────┴───────────────────┐
                        ▼                                          ▼
              golden case en                          si cambia una regla:
              ai-service/harness/eval/                 /starteria-decision
              corre en CI para siempre                 → ADR → doc/
```

**Los dos candados de este tramo no son iguales.** El primero es técnico y falla cerrado: sin
redacción suficiente, el lote no sale. El segundo es humano y **no falla: se olvida**. Si nadie
elige, no pasa nada visible y los análisis se siguen acumulando.

**Por qué el segundo candado existe en vez de automatizarse:** `ADR-003` decidió que acá la
verificación es humana. Un pipeline que convierte producción en golden cases sin que nadie mire es
un gate, y encima uno que aprende de sus propios errores sin supervisión. Sacarlo es una decisión
que hay que firmar, no un refactor.

### 6.3 Los dos tramos, juntos

```text
  ┌─ TRAMO CALIENTE ─ segundos ─ corre solo ────────────────────┐
  │                                                              │
  │   usuario → entry-01..04 → Analysis → 🔒 Pantalla 2 → Project │
  │                                            │                  │
  └────────────────────────────────────────────┼─────────────────┘
                                               │ corrección
                                               ▼
  ┌─ TRAMO FRÍO ─ semanas ─ corre si alguien lo corre ──────────┐
  │                                                              │
  │   redacción → produccion/ → gbrain → /patron → 🔒 selección  │
  │        │                                            │         │
  │        │                                            ▼         │
  │        │                                        /caso         │
  │        │                                            │         │
  │        │                              ┌─────────────┴───────┐ │
  │        │                              ▼                     ▼ │
  │        │                        golden case            /decision│
  │        │                        en CI                   → ADR  │
  │        │                              │                     │  │
  └────────┼──────────────────────────────┼─────────────────────┼──┘
           │                              │                     │
           └──────────────────────────────┴─────────────────────┘
                                  │
                                  ▼
                   el contrato de doc/ cambia, y el
                   tramo caliente empieza a cumplirlo
```

Ese retorno de abajo es todo el punto de la integración: **hoy un análisis malo en producción no
tiene ningún camino hacia el contrato**. Muere en un log.

### 6.4 Dónde se corta, y qué pasa cuando se corta

| Corte | Se nota | Consecuencia |
|---|---|---|
| Redacción insuficiente | **sí**, el lote no sale | nada llega al harness; es el corte sano |
| Nadie corre `/starteria-patron` | no | los análisis se acumulan sin agrupar |
| Nadie selecciona qué caso vale | no | ningún caso nace; el eval no crece |
| El caso redactado no se integra a `doc/` | no | el contrato sigue diciendo lo viejo (`ADR-007`) |
| gbrain no responde | **sí**, en el chat | `/starteria-patron` no corre; el tramo caliente **no se entera** |

La última fila es deliberada: la lectura de gbrain desde runtime nunca va en el camino crítico de un
request. Si la memoria se cae, el producto sigue andando sin ella.

**El desbalance es el riesgo nuevo de este reloj.** El tramo caliente produce sin parar; el frío
consume solo cuando alguien se acuerda. La cola crece por diseño, y nadie la ve crecer. Los otros
cinco relojes fallan quedándose quietos; este falla **llenándose**.

### 6.5 Qué sobrevive y qué no

| Sobrevive | Muere |
|---|---|
| El `Project` creado, con su Step 0 | El `raw_input` original, si no se exportó |
| La `HarnessTrace` de la corrida | El razonamiento que no quedó en la traza |
| La corrección de Pantalla 2, si se capturó | La corrección que la UI no guardó como señal |
| El lote redactado en `produccion/` | Todo lote que no pasó la redacción |
| El golden case, una vez en CI | El patrón detectado que nadie eligió |

La tercera fila es la que hay que instrumentar explícitamente: guardar el valor final es natural,
guardar **que hubo una corrección y cuál fue** hay que decidirlo. Sin eso, el tramo frío se queda sin
su mejor insumo y la integración vale la mitad.

## 7. Los relojes, juntos

| Ciclo | Dura | Lo mueve | Qué pasa si nadie lo mueve |
|---|---|---|---|
| **Request de producción** (§6.1) | **segundos** | **un usuario final** | **corre igual — es el único que no se detiene** |
| Unidad del productor | horas | quien cambia el harness | el cambio queda sin registrar y la rama sin entregar |
| Sesión de producto | horas | quien abre el chat | la próxima arranca sin contexto |
| Caso | semanas | quien corre `/starteria-probar` | el comportamiento se desvía sin que nadie lo vea |
| **Puente a producción** (§6.2) | **semanas** | **quien elige qué caso vale** | **la cola de análisis crece sin que nadie la vea crecer** |
| Decisión | meses | una persona con autoridad | los conflictos se acumulan abiertos |
| Harness | el proyecto | quien lo mantiene | queda describiendo un producto que ya cambió |

Hasta la v0.1 de este documento la frase de cierre era que ninguno tiene alarma: los cinco dependían
de que alguien se acuerde, con la única excepción chica de `scripts/verify.sh`, que falla solo pero
únicamente si alguien lo corre.

**La integración rompe esa simetría, y no del todo para bien.** El tramo caliente del §6 sí tiene
alarma: corre cada vez que un usuario escribe, sin pedirle permiso a nadie. Eso hace que por primera
vez el harness reciba señal sin que nadie la busque — y también que aparezca un modo de falla que
antes no existía. Los otros cinco relojes fallan quedándose quietos, y eso se nota tarde pero se
nota. El §6 falla **llenándose**: producción sigue generando análisis, el puente sigue sin
consumirlos, y desde afuera un pipeline con quinientos análisis sin mirar se ve exactamente igual que
uno al día.

El único aviso posible de ese modo de falla es contar la cola. No hay gate que lo haga: es una
métrica que alguien tiene que mirar, igual que todo lo demás acá.
