# ADR-030: Estados del reto y de la iniciativa, con transiciones decididas en el servidor

- **Estado**: Parcialmente implementado — la mitad del RETO esta en codigo y verificada
  (MVP-P1-01); la mitad de la INICIATIVA (MVP-P1-02) sigue Propuesta
- **Fecha**: 2026-08-22
- **Actualizado**: 2026-08-29 — MVP-P1-01 implementa las decisiones 1, 2 y 4 para el reto:
  `pausado` como estado del enum, `pausedFromStatus`, tabla de transiciones aplicada en el
  SERVIDOR con 409 (`backend/modules/portfolio/challenge-state-machine.ts`), y el bloqueo de
  iniciativas nuevas sobre un reto pausado/cerrado. Verificado con 24 tests unitarios y un
  e2e contra Postgres real (4/4).

  **Correccion al ADR encontrada al implementarlo** (misma clase que los dos hallazgos de
  ADR-029): este documento dice que hay que "añadir `pausada` a `InitiativePortfolioStatus`
  en forma legacy". Ya no aplica tal cual — el trabajo de adaptive-core mergeado en main
  despues de escribir el ADR **ya introdujo `paused` y `closed` CANONICOS** en ese enum,
  junto con `implementation_approved` y `scaling_approved`. El enum de la iniciativa ya es
  mestizo (`cerrada` legacy conviviendo con `closed` canonico), que es exactamente lo que
  la decision 5 queria evitar. MVP-P1-02 tiene que decidir entre reusar los canonicos que
  ya existen o migrar los datos, no aplicar este parrafo literalmente. El enum del RETO
  no estaba afectado: ahi `pausado` legacy si era la eleccion correcta y es la que se hizo.
- **Enmienda a**: ADR-024 (persistencia de mutaciones del portfolio lead) — le añade la regla
  que le faltaba: qué estados existen y quién decide que una transición es legal
- **Relacionados**: ADR-023 (equipo scoped al reto), ADR-025 (iniciativa ← revisión inicial),
  ADR-029 (autorización por permisos), ADR-018 (restricción de deploy: `prisma db push`)
- **Plan que lo motiva**: `docs/PLAN-MVP-portafolio-retos-iniciativas.md`, Fase 1

## Contexto

El diagrama de flujo del MVP pide tres cosas del portafolio que hoy el sistema no sabe
expresar: **manejar estados (activado, bloqueado, en pausa)**, que el estado gobierne lo que
se puede hacer, y que la decisión de la fase D (continuar / iterar / pivotear / escalar /
transferir / invertir / pausar / cerrar con aprendizaje) tenga efecto sobre la iniciativa.

### Lo que ya está sano y no hay que tocar

- Existen dos enums de estado persistidos, con historia y datos: `ChallengeStatus`
  (`draft`, `listo_para_activar`, `activo_interno`, `publicado`, `recibiendo_iniciativas`,
  `con_iniciativas_activas`, `pendiente_de_decision`, `cerrado`) e `InitiativePortfolioStatus`
  (`en_step_0..4`, `bloqueada`, `esperando_revision`, `lista_para_decision`, `cerrada`).
- `initiative-progress.ts` **ya deriva** el estado de la iniciativa desde el avance real de los
  steps, y —esto es lo importante— **sólo toca las filas en `en_step_*`**. Su propio comentario
  lo dice: «Portfolio-managed states (bloqueada, esperando_revision, lista_para_decision,
  cerrada) are set by hand and left untouched». Cualquier estado nuevo que no sea de progresión
  queda automáticamente a salvo del auto-avance, sin tocar esa función.
- `PortfolioDecisionOutcome` **ya existe como enum en Prisma** y `InitiativePortfolioMeta`
  ya tiene la columna `decisionOutcome`. El almacenamiento de la decisión está resuelto.

### La evidencia de que el modelo no da abasto ya está en el repo

1. **«En pausa» no existe.** Ni `ChallengeStatus` ni `InitiativePortfolioStatus` tienen un valor
   para pausar. `InitiativePortfolioStatus` sí tiene `bloqueada`, así que hoy la única forma de
   representar una pausa es mentir llamándola bloqueo — y son cosas distintas: bloqueada es
   *no puede avanzar*, en pausa es *decidimos que no avance*. La primera pide destrabar; la
   segunda, una decisión.
2. **Nadie valida las transiciones.** `PortfolioService.updateChallenge` hace
   `data: input as any`: acepta cualquier `status` que pase el enum de zod, venga de donde
   venga. Quien decide la transición es el **cliente** — el provider del front calcula el
   siguiente estado y el servidor lo obedece. Una pestaña vieja, un doble clic o un `curl`
   pueden llevar un reto de `cerrado` a `draft` sin que nada se queje.
3. **La decisión de la fase D no tiene camino de escritura.** El vocabulario existe en el
   dominio del front y la columna existe en Prisma, pero **no hay ninguna mutación** en
   `PortfolioLeadContext` que registre una decisión: `portfolioDecisions` sólo lo escribe el
   sembrador de demo `loadChallengeCoverageDemo`. La fase D del diagrama está desconectada.
4. **Vocabulario doble.** Cada estado tiene una versión canónica (inglés) y una legacy
   (español) en `front/src/features/portfolio-lead/domain/types.ts`, y un adapter que traduce.
   **Lo que está en Postgres es la legacy**: los enums de `schema.prisma` son los españoles.

## Decisión

### 1. «En pausa» es un **estado**, no un flag

Se añade `pausado` a `ChallengeStatus` y `pausada` a `InitiativePortfolioStatus`.

Se descarta modelarlo como booleano (`isPaused`) junto al estado. Una pausa es mutuamente
excluyente con estar avanzando: no se puede estar `en_step_2` *y* en pausa. Un flag paralelo
crea dos fuentes de verdad para la misma pregunta —«¿esto se puede editar?»— y obliga a que
cada lector consulte las dos y las combine igual. `bloqueada` ya es un estado; hacer que su
gemela sea un flag es una asimetría sin razón.

Además el coste es bajo por lo que ya está construido: como `pausada` no es un estado de
progresión, `syncInitiativeProgress` la ignora sin cambiarle una línea, que es exactamente
el comportamiento que hace falta (una iniciativa en pausa no debe auto-avanzar porque alguien
apruebe un step). Y añadir un valor a un enum de Postgres es `ALTER TYPE ... ADD VALUE`:
aditivo, y pasa el guard de `prisma db push` sin `--accept-data-loss` (ADR-018).

**Los valores nuevos se escriben en la forma legacy** (`pausado`/`pausada`), no en la canónica.
Es la forma que vive en Postgres; introducir un valor canónico obligaría a migrar los datos
existentes o a dejar el enum mestizo. Ver decisión 5.

### 2. La transición la decide el **servidor**, no el cliente

`PortfolioService` gana una tabla de transiciones legales por entidad y la aplica antes de
escribir. Un `status` que no sea alcanzable desde el actual se rechaza con **409**, no con un
`as any` silencioso.

Transiciones legales del reto:

```
draft              → listo_para_activar | cerrado
listo_para_activar → activo_interno | publicado | recibiendo_iniciativas | pausado | cerrado
activo_interno     → recibiendo_iniciativas | con_iniciativas_activas | pausado | cerrado
publicado          → recibiendo_iniciativas | pausado | cerrado
recibiendo_iniciativas → con_iniciativas_activas | pendiente_de_decision | pausado | cerrado
con_iniciativas_activas → pendiente_de_decision | pausado | cerrado
pendiente_de_decision   → con_iniciativas_activas | pausado | cerrado
pausado            → (el estado ANTERIOR a la pausa) | cerrado
cerrado            → (terminal)
```

`cerrado` es terminal a propósito: reabrir un reto cerrado es una decisión de gobierno, no un
`PATCH`. Si hace falta, se abre un reto nuevo que referencie al anterior.

Reanudar devuelve al estado previo, así que **la pausa recuerda de dónde vino**: se persiste
`pausedFromStatus` en la entidad. Sin eso, reanudar obligaría a adivinar (¿vuelve a `activo_interno`
o a `recibiendo_iniciativas`?) y el usuario perdería contexto que el sistema sí tenía.

Para la iniciativa, el eje `en_step_*` lo sigue derivando `initiative-progress.ts`; la máquina
sólo gobierna las **entradas y salidas** de los estados gestionados a mano:

```
en_step_*          → bloqueada | pausada | lista_para_decision | cerrada
bloqueada          → en_step_* (al destrabar) | pausada | cerrada
pausada            → en_step_* (reanudar, al step que tenía) | cerrada
lista_para_decision → (lo que dicte la decisión, ver 3) 
cerrada            → (terminal)
```

### 3. La decisión de la fase D **es** el disparador del estado

Registrar una decisión escribe `InitiativePortfolioMeta.decisionOutcome` (columna que ya existe)
**y** transiciona el estado en la misma transacción. El mapa:

| Decisión | Estado resultante |
|---|---|
| `pasar_a_segunda_fase`, `iterar_desde_otro_angulo` | vuelve a `en_step_*` |
| `escalar_piloto` | `en_step_*` (sigue viva, con la escalada anotada) |
| `transferir_a_ti`, `transferir_al_area_afectada`, `evaluar_innovacion_abierta` | `cerrada` |
| `cerrar_con_aprendizaje` | `cerrada` |
| *pausar* | `pausada` |

**Pausar no está en `PortfolioDecisionOutcome`.** El diagrama lo pide como opción de la fase D,
así que se añade `pausar` al enum. Es aditivo y no rompe filas existentes.

### 4. Un estado no-activo **gobierna lo que se puede hacer**

Con la iniciativa en `pausada` o `cerrada`, las escrituras de sus steps se rechazan con 409 y
la UI la muestra en solo lectura con el motivo. Un reto en `pausado` o `cerrado` no acepta
iniciativas nuevas.

La regla se aplica **en el servidor**, en el borde de escritura de steps. Si sólo se pintara en
la UI, sería decoración: es el mismo error que ADR-029 vino a erradicar en autorización
—decidir en el cliente lo que el servidor no comprueba—, aplicado ahora al ciclo de vida.

Quién puede pausar/reanudar/cerrar: `portfolio:write`, coherente con PBA-04. No se introduce
un permiso nuevo: pausar un reto es la misma clase de acto que activarlo.

### 5. El vocabulario legacy (español) es la verdad; el canónico es presentación

Se **congela** la forma legacy como el vocabulario de la base de datos y del contrato HTTP, y
se mantiene el canónico como vocabulario del front, traducido por el adapter que ya existe.

Migrar los datos al canónico sería un `UPDATE` sobre columnas de enum en tablas pobladas más
un `ALTER TYPE`, con la restricción de que el CD despliega con `db push` (ADR-018) — riesgo real
a cambio de cero valor para el usuario. La deuda queda anotada, no pagada aquí.

## Alternativas descartadas

- **`isPaused` booleano** — dos fuentes de verdad para «¿se puede editar?», y asimétrico con
  `bloqueada`, que ya es estado. Descartado en la decisión 1.
- **Validar las transiciones en el front** — es donde están hoy y es justo el problema: el
  servidor obedece a quien le hable. Un cliente viejo seguiría pudiendo escribir cualquier estado.
- **Una tabla de historial de estados** — daría auditoría, pero el MVP no la pide y añade una
  entidad que hay que mantener. `pausedFromStatus` cubre el único caso que el flujo necesita
  (reanudar). Si más adelante hace falta auditoría, `AuditLog` ya existe.
- **Reabrir `cerrado` con un PATCH** — convertiría un acto de gobierno en un clic reversible y
  haría infalsificable el reporte de cierres. Se abre un reto nuevo.
- **Estados por iniciativa heredados del reto** (pausar el reto pausa sus iniciativas en cascada)
  — se descarta para el MVP: el cascade sobre datos de terceros es difícil de revertir y el
  diagrama no lo pide. El reto pausado simplemente no admite iniciativas nuevas.

## Consecuencias

- Aparece un contrato explícito de ciclo de vida que hoy no existe: se puede razonar sobre qué
  significa cada estado y probarlo con casos negativos, no sólo felices.
- El servidor empieza a rechazar transiciones que hoy acepta. **Es un cambio de comportamiento**:
  si algún cliente escribía estados de forma desordenada, empezará a ver 409. Se mitiga fijando
  la tabla con tests antes de activarla y revisando el provider, que es el único escritor real.
- `pausedFromStatus` es una columna nueva y nullable por reto/iniciativa. Aditiva.
- Dos valores nuevos de enum (`pausado`, `pausada`) y uno en `PortfolioDecisionOutcome` (`pausar`).
  Todos aditivos: `ALTER TYPE ... ADD VALUE` pasa el guard del CD.
- La fase D del diagrama queda conectada por primera vez: la decisión deja de vivir sólo en el
  estado local del navegador.
- **Riesgo asumido**: la regla de solo-lectura de la decisión 4 toca el borde de escritura de
  steps, que es superficie compartida con el flujo del participante (ADR-025). Se implementa en
  un solo punto y con el smoke de referencia como red.

## Verificación

- **Unit (servidor)**: la tabla de transiciones acepta las legales y rechaza las ilegales con 409,
  con casos negativos explícitos (`cerrado → draft`, saltar la pausa, reanudar sin `pausedFromStatus`).
- **Unit (servidor)**: reanudar devuelve exactamente al estado previo, no a uno por defecto.
- **Unit (servidor)**: registrar una decisión escribe `decisionOutcome` **y** el estado en la MISMA
  transacción; si una falla, no queda la otra a medias.
- **Unit (servidor)**: `syncInitiativeProgress` NO toca una iniciativa `pausada` — el test que
  impide reintroducir el auto-avance sobre algo que se decidió detener.
- **E2E**: activar → pausar → **recargar** → sigue pausada → reanudar → vuelve al estado previo.
- **E2E**: con la iniciativa pausada, una escritura de step responde 409.
- **`prisma db push` sin `--accept-data-loss`** contra una base poblada, replicando el comando
  exacto del CD — es la verificación que decide si el deploy pasa (ADR-018).
- **No regresión**: suites completas de front y backend, y el smoke de referencia
  (`pdf-autofill.spec.ts`) verde.

## Decisiones que este ADR NO toma

Se acotan a propósito, para que la Fase 1 no arrastre las fases siguientes:

- **Acceso por iniciativa** (quién ve/edita una iniciativa; issue #161, las 7 lecturas de
  portfolio hoy sin gate) — Fase 3 del plan.
- **Convocatoria**: si el link es interno autenticado o público — Fase 4 del plan.
- **Retirar la columna `role`** (fase 2 de ADR-029, issue #160) — es otro eje.
