# Ciclos de vida

**Versión:** v0.1
**Fecha:** 2026-09-10

Cuatro relojes que corren a velocidades distintas: la sesión (horas), el caso (semanas), la
decisión (meses) y el harness (la vida del proyecto). Confundirlos es cómo un fallo de una tarde
termina cambiando un invariante.

## 1. La sesión de trabajo

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

**El harness no está terminado cuando están los ocho comandos. Está terminado cuando alguien los
corrió.** Hoy está en el primer escalón: escrito, verificado por estructura, sin una sola corrida
completa. La distinción entre "escrito" y "probado" es la que el harness le exige a todo lo demás,
y se la aplica a sí mismo.

## 5. Los relojes, juntos

| Ciclo | Dura | Lo mueve | Qué pasa si nadie lo mueve |
|---|---|---|---|
| Sesión | horas | quien abre el chat | la próxima arranca sin contexto |
| Caso | semanas | quien corre `/starteria-probar` | el comportamiento se desvía sin que nadie lo vea |
| Decisión | meses | una persona con autoridad | los conflictos se acumulan abiertos |
| Harness | el proyecto | quien lo mantiene | queda describiendo un producto que ya cambió |

Ninguno tiene alarma. Los cuatro dependen de que alguien se acuerde.
