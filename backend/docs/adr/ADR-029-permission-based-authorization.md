# ADR-029: Autorización por permisos, con roles como asignación múltiple

- **Estado**: Aceptado — fase 1 implementada y desplegada
- **Fecha**: 2026-08-12
- **Actualizado**: 2026-08-20 — PBA-07 cerrado: el gate E2E de doble rol está verificado
  (`front/e2e/dual-role-authz.spec.ts`, 4/4). Con eso **la fase 1 queda completa y verificada**.
  Sigue abierta la fase 2 (retirar la columna `role`, #160) y el gate de `portfolio:read` (#161).
- **Actualizado**: 2026-08-12 — la fase 1 (permisos + `roles[]` + switcher) está en `main`.
- **Enmienda a**: ADR-028 (Aceptado) — resuelve la deuda que su sección «Consecuencias» dejó anotada
- **Relacionados**: ADR-004 (autorización original, 4 roles), ADR-009 (modelo de 6 roles),
  ADR-010 (implementación authz), ADR-023 (`TeamRole`, eje de equipo),
  ADR-024 (portal de portfolio lead), ADR-018 (restricción de deploy: `prisma db push`)

## Contexto

Starteria tiene **un solo login para dos superficies de producto**:

| Superficie | Rutas | Layout | Quién trabaja ahí |
| --- | --- | --- | --- |
| Workspace de iniciativas | `/dashboard`, `/initiatives/*`, `/projects/:id/step/*` | `AppLayout` | Participante, mentor, sponsor |
| Capa estratégica de portafolio | `/portfolio/*` | `PortfolioLeadLayout` | Portfolio lead, admin |

La pertenencia a una superficie se decide con un **escalar**: `User.role`, un enum de siete
valores (ADR-028). Un escalar no puede expresar pertenencia a dos conjuntos, así que
**conceder acceso a una plataforma revoca el de la otra**. No es un bug de un guard: es la
forma del dato.

El síntoma en producción es literal y está en una línea:

```ts
// front/src/app/layout/AppLayout.tsx:55
if (user?.role === 'portfolio_lead') {
  navigate('/portfolio/inicio', { replace: true });
  return;
}
```

Un portfolio lead queda **encerrado** en `/portfolio`. Pierde su dashboard, sus propias
iniciativas y el flujo Step 0–4 — no por una decisión de producto, sino porque el modelo no
sabe decir «esta persona es las dos cosas». La persona que dirige el portafolio es
típicamente también quien levanta iniciativas: es el caso normal, no el borde.

### La evidencia de que el modelo no da abasto ya está en el repo

1. **ADR-028 lo anotó él mismo**, en sus propias consecuencias:

   > *«Un `Role` de 7 valores empieza a pedir una revisión del modelo: `viewer`,
   > `colaborador` y `participante` mapean los tres a `owner` en el frontend, lo que
   > sugiere que el eje de plataforma y el de proyecto están mezclados. Fuera de alcance
   > aquí.»*

2. **El commit #156 fue el parche del caso inverso.** El backend concedía las escrituras de
   portafolio a `admin` (`requireRole('admin', 'portfolio_lead')`) pero el guard de pantalla
   admitía sólo `portfolio_lead`: un admin estaba *autorizado por API y bloqueado por
   pantalla*. Se arregló ampliando la comparación a dos valores. El siguiente rol que
   necesite entrar exigirá el mismo parche en el mismo sitio. Es una condición que se
   re-abre, no un incidente.

3. **El frontend ya colapsa tres valores del enum**: `participante`, `colaborador` y `viewer`
   mapean todos a `owner` en `BACKEND_TO_FRONTEND_ROLE` (`AppContext.tsx:499`). Tres de los
   siete «roles de plataforma» no describen una plataforma — describen una relación con un
   proyecto, que es exactamente lo que `TeamRole` (ADR-023) ya modela por su cuenta.

### Lo que ya está sano y no hay que tocar

El repo **ya tiene dos ejes de autorización**, no uno:

- `requireRole(...)` — eje de **plataforma** (`auth.middleware.ts:61`). Es el roto.
- `requireProjectAccess(level)` — eje de **proyecto** (`auth.middleware.ts:96`). Resuelve el
  acceso por membresía de equipo, con jerarquía `read < write < admin`. Está bien: pregunta
  por una *capacidad* sobre un *recurso*, no por una identidad.

El eje de proyecto ya hace lo correcto. Este ADR lleva el eje de plataforma al mismo diseño.

### La superficie real de la migración

30 llamadas a `requireRole`, y están muy concentradas:

| Sitios | Guard actual | Módulo |
| --- | --- | --- |
| 20 | `requireRole('admin', 'portfolio_lead')` | `portfolio.router.ts` |
| 3 | `requireRole('admin')` | `sponsor`, `users`, `cohort` |
| 1 | `requireRole('sponsor')` | `sponsor.router.ts` |
| 1 | `requireRole('mentor', 'admin')` | `mentor.router.ts` (router-wide) |

Dos tercios son la **misma línea repetida veinte veces**. No es una reescritura del backend:
es un catálogo pequeño y una sustitución mecánica.

## Decisión

### 1. El permiso es la moneda de autorización

Los guards dejan de preguntar **qué eres** y pasan a preguntar **qué puedes hacer**:

```ts
// antes
requireRole('admin', 'portfolio_lead')
// después
requirePermission('portfolio:write')
```

El catálogo es **cerrado y vive en código** (no en base de datos), derivado de los 30 sitios
reales — no se inventan permisos para los que no hay una ruta:

| Permiso | Cubre |
| --- | --- |
| `portfolio:write` | Frentes, retos, meta de iniciativas, squads, executive outputs (20 sitios) |
| `portfolio:read` | Las 7 lecturas de portafolio hoy sin gate — ver deuda declarada abajo |
| `users:assign-roles` | `PATCH /users/:id/role`. El endpoint más sensible del sistema: concede privilegios |
| `cohort:manage` | `cohortRouter` completo |
| `mentor:panel` | `mentorRouter` completo |
| `sponsor:decide` | Aprobar/rechazar checkpoints de sponsor |
| `sponsor:manage` | Administrar la configuración de sponsors |
| `project:own` | Crear y llevar iniciativas propias (el permiso base de todo participante) |

### 2. El usuario tiene un **conjunto** de roles, no uno

Esta es la decisión que de verdad arregla el bug, y sin ella el resto es cosmético:

> **Si los permisos se derivan de un `role` escalar, el problema original sobrevive
> intacto** — un rol único sigue produciendo un único bundle de permisos, y conceder
> portafolio seguiría revocando participante. La derivación tiene que partir de un conjunto.

```prisma
// front/prisma/schema.prisma
roles Role[]   // nuevo — SIN default, ver la nota de abajo
role  Role     // se conserva en fase 1 (ver §6)
```

> **Corrección tras verificar contra Postgres (2026-08-12).** La primera versión de
> este ADR proponía `roles Role[] @default([participante])`. Es **inseguro**: el
> `ALTER TABLE ADD COLUMN` con default rellena **todas** las filas existentes, así
> que un admin quedaba en `{participante}` — indistinguible de un participante real.
> Si un lector de `roles` llegara a producción antes del backfill, sería una **purga
> silenciosa de privilegios** para todo admin y portfolio lead.
>
> Sin default, las filas sin migrar quedan en `NULL` (verificado: la columna es
> nullable), que es una señal **inequívoca** de «anterior al backfill» y permite caer
> a `role` (`rolesForUser`). Con eso, **el orden de despliegue deja de ser una
> condición de corrección** en vez de ser un riesgo que había que documentar.

El **permiso efectivo es la unión** de los permisos de todos los roles asignados:

```
usuario: roles = ['participante', 'portfolio_lead']
       → permisos = { project:own } ∪ { portfolio:read, portfolio:write }
       → entra al dashboard Y al portafolio
```

Tabla de derivación (código, no datos — se puede cambiar sin migrar nada):

| Rol | Permisos |
| --- | --- |
| `participante` | `project:own` |
| `colaborador` | `project:own` |
| `viewer` | *(ninguno de plataforma; su acceso lo resuelve `requireProjectAccess`)* |
| `mentor` | `mentor:panel` |
| `sponsor` | `sponsor:decide` |
| `portfolio_lead` | `portfolio:read`, `portfolio:write` |
| `admin` | todos **menos `sponsor:decide`** — ver la corrección abajo |

> **Corrección tras revisar los guards reales (2026-08-12).** Este ADR daba por
> hecho que «admin puede todo» era fiel al comportamiento de hoy. **No lo es**:
> `PATCH /sponsor/checkpoints/:id/respond` está gateado con `requireRole('sponsor')`
> y **excluye al admin a propósito** — responder un checkpoint es la decisión del
> sponsor, y el admin tiene su propia ruta `/skip` para saltarlo. Son dos actos de
> gobierno distintos.
>
> Por eso el admin **enumera** sus permisos en vez de recibir el catálogo entero.
> Un comodín habría colado ese cambio de política dentro de una migración que sólo
> debía cambiar *cómo* se decide. De paso desaparece el riesgo que este mismo ADR
> registraba en «Consecuencias»: conceder algo al admin vuelve a ser una decisión
> explícita, de una línea, en vez de un efecto secundario de definir un permiso.

Nótese el efecto lateral útil: el enredo que ADR-028 señaló (`participante`/`colaborador`/
`viewer` colapsando a `owner`) **deja de doler sin migrar datos**. Los tres derivan a
conjuntos de permisos distintos y correctos; ya no hace falta sacarlos del enum para que el
sistema se comporte bien. Sacarlos sigue siendo deseable algún día, pero deja de ser urgente.

### 3. El JWT lleva **roles**, y el servidor deriva los permisos

```ts
export interface TokenPayload {
  sub: string;
  roles: Role[];   // era: role: Role
  email: string;
  cohort?: string;
}
```

`authenticate` deriva los permisos al vuelo y los deja en `req.user.permissions`.

La alternativa —meter los permisos ya derivados en el token— se descarta por dos razones
concretas: hincha el token con datos que se pueden recalcular en O(1), y **congela la tabla
de derivación dentro de tokens ya emitidos**, de modo que corregir el mapa exigiría esperar
a que expire cada sesión viva. Derivando en servidor, un cambio en el mapa aplica en la
siguiente petición.

El desfase de hasta 15 min del *access token* ante un cambio de **asignación** de roles se
mantiene tal cual — es la propiedad que ADR-004 documentó y ADR-028 aceptó, mitigada
revocando los refresh tokens del usuario objetivo.

### 4. El frontend decide por permiso, y se elimina la cárcel

- **Se borra `AppLayout.tsx:55-58`.** El redirect forzado a `/portfolio` desaparece: un
  portfolio lead que también es participante conserva su dashboard.
- `PortfolioLeadLayout` deja de comparar roles (`role === 'portfolio_lead' || role ===
  'admin'`, el parche de #156) y pregunta `can('portfolio:read')`. El borde que fijó el test
  de #156 se conserva; lo que cambia es cómo se calcula.
- `mapBackendUser` expone `roles: Role[]` y `permissions: Permission[]`.
- **`user.role` sobrevive como concepto de *presentación*** (la etiqueta del sidebar, el
  badge de perfil) alimentado por el rol primario. Lo que se prohíbe es que una **decisión de
  acceso** lea ese campo. Esto mantiene la migración del frontend acotada: se tocan los
  guards, no cada componente que muestra un nombre de rol.

### 5. Switcher de workspace

Con un usuario que pertenece a las dos superficies, la navegación deja de ser un redirect y
pasa a ser una elección explícita, arriba del sidebar:

```
┌──────────────────────┐
│ ⌄ Portafolio         │  ← switcher
├──────────────────────┤
│   Mis iniciativas    │  ← visible si can('project:own')
│ ✓ Portafolio         │  ← visible si can('portfolio:read')
└──────────────────────┘
```

- Las entradas se derivan de permisos, así que un usuario de una sola superficie **no ve
  switcher** y su experiencia no cambia en absoluto.
- La última zona elegida se recuerda (`localStorage`), y es la que decide el destino
  post-login en `AuthPage`. Sustituye al redirect por igualdad de rol.
- Se prefiere al patrón de enlaces cruzados de #156 porque hace explícita la pertenencia a
  dos zonas en vez de dejarla implícita en un ítem de menú, y porque no exige tocar cada
  sidebar cuando aparezca una tercera superficie.

### 6. Migración en dos fases, por la restricción del CD

El CD corre `prisma db push` **sin** `--accept-data-loss` (ADR-018). Eso obliga a fasear:

**Fase 1 — aditiva (este ADR).** Se añade `roles Role[]`; `role` se conserva y se sigue
escribiendo. Backfill `roles = [role]` con un script idempotente. Los guards ya leen
`roles`. Añadir una columna con default a una tabla poblada es aditivo y pasa el guard del
CD — la operación prohibida es el `@@unique` sobre tabla poblada, que aquí no aparece.

**Fase 2 — destructiva (ADR aparte, cuando fase 1 lleve tiempo estable).** Eliminar `role`
de la base **sí** es pérdida de datos y necesita su propia ventana y su propio comando. No
se hace aquí, y hasta que ocurra, `role` es la red de seguridad para revertir sin restaurar
backups.

## Alternativas descartadas

**Multi-rol sin permisos (`roles: Role[]` + `requireRole` que hace `.some()`).** Es el
cambio mínimo que arregla el síntoma: dos líneas de guard y una columna. Se descartó porque
deja la autorización expresada en identidades: los 20 sitios de portafolio seguirían
enumerando *quién* puede escribir, y cada rol nuevo obligaría a volver a editarlos — que es
exactamente el bucle de #156. Con permisos, un rol nuevo se define una vez en la tabla de
derivación y ninguna ruta se entera.

**Un eje aparte de grants (`role` escalar + `portfolioAccess`).** Más literal al problema
reportado y de radio mínimo. Se descartó por poco general: resuelve *esta* pareja de
superficies, y la tercera vuelve a plantear la misma pregunta desde cero.

**Sacar `participante`/`colaborador`/`viewer` del enum hacia `TeamRole`.** Es la limpieza
conceptualmente correcta y la que ADR-028 insinuó. Se descartó **para este ADR** porque exige
migrar datos existentes en el mismo cambio que ya modifica el eje de autorización, y porque
—como se nota en §2— los permisos vuelven el problema inocuo sin migrar nada. Queda como
deuda con un camino claro, no como pendiente urgente.

**Autorizar por pertenencia a un frente estratégico.** Ya descartada en ADR-028 por exigir un
modelo de membresía que no existe. Sigue descartada, y este ADR la vuelve *más* alcanzable:
cuando exista, será una fuente más de permisos, no un rediseño de los guards.

## Consecuencias

**A favor**

- Un login puede pertenecer a las dos plataformas. Es el problema que motiva el ADR.
- Añadir un rol deja de tocar rutas: se declara una fila en la tabla de derivación.
- El guard dice qué protege (`portfolio:write`) en vez de a quién deja pasar. Los 20 sitios
  idénticos de `portfolio.router.ts` se vuelven legibles sin abrir ADR-028.
- El eje de plataforma queda con la misma forma que `requireProjectAccess`, que ya preguntaba
  por capacidad. Un solo modelo mental para los dos ejes.
- El enredo `participante`/`colaborador`/`viewer` deja de tener consecuencias operativas sin
  migrar datos.
- `tsc` marca los sitios pendientes: cambiar `TokenPayload.role` por `roles` rompe la
  compilación en cada consumidor, que es justo lo que se quiere de una migración así.

**En contra / a vigilar**

- **Hay dos fuentes de verdad durante la fase 1** (`role` y `roles`). Si una escritura
  actualiza una y no la otra, el usuario queda incoherente. Mitigación: un único punto de
  escritura de roles (el servicio de usuarios) y un test que afirme que ambas columnas
  concuerdan tras `PATCH /users/:id/role`.
- **La tabla de derivación se convierte en superficie de seguridad.** Un error ahí concede
  privilegios en silencio y en todas las rutas a la vez. Debe tener test propio, exhaustivo
  por rol, y revisarse como se revisa un guard.
- ~~`admin → todos` es un comodín~~ **RESUELTO durante la implementación**: el admin
  enumera sus permisos, así que un permiso nuevo NO se le concede solo. El coste es
  una línea por permiso nuevo, y un test que falla si alguien vuelve al comodín.
- **Las 7 lecturas de portafolio siguen sin gate**, igual que en ADR-028 (`AppLayout` llama
  `getInitiativeMeta` para todo autenticado). El permiso `portfolio:read` se define ahora
  para que la deuda tenga dónde aterrizar, pero **no se aplica en este ADR**: hacerlo
  rompería a los participantes. Sigue siendo deuda declarada.
- El desfase de 15 min del access token aplica también a la **reducción** de privilegios.
- El switcher es UI nueva, con su propio estado persistido; un `localStorage` corrupto no
  debe poder dejar a nadie sin navegación (debe degradar a la primera zona permitida).

## Verificación

- **La regresión que motiva el ADR**: un usuario con `roles = ['participante',
  'portfolio_lead']` entra a `/dashboard` **y** a `/portfolio/inicio` en la misma sesión, y
  `AppLayout` no lo redirige. Es el test que hoy no existe y que habría evitado el encierro.
- **El borde de #156 se conserva**: admin y portfolio lead entran a `/portfolio`; mentor,
  sponsor y participante siguen fuera. Se reusa `PortfolioLeadLayout.access.test.tsx`
  cambiando el montaje de roles a permisos: si ese test sigue verde, no hubo regresión.
- **Tabla de derivación**: test exhaustivo rol→permisos para los 7 roles, incluida la unión
  de dos roles y el comodín de admin.
- **`requirePermission`**: 403 sin el permiso, 200 con él, 401 sin sesión.
- **Backfill**: ejecutado dos veces seguidas contra una base con datos, `roles = [role]` para
  el 100 % de las filas y la segunda corrida no cambia nada (idempotencia).
- **Coherencia de fase 1**: tras `PATCH /users/:id/role`, `role` y `roles` concuerdan y los
  refresh tokens del usuario objetivo quedan revocados (propiedad heredada de ADR-028).
- **`prisma db push` sin `--accept-data-loss`** contra una base poblada, replicando el
  comando exacto del CD — la misma verificación que exigió ADR-028, porque es la que decide
  si el deploy pasa.
- **E2E**: login de un usuario de doble rol → switcher visible → cambiar de zona → una
  escritura de portafolio 2xx → volver al workspace → Step 0 accesible.
  **CUMPLIDO (2026-08-20, PBA-07)** con `front/e2e/dual-role-authz.spec.ts`, 4/4 verde contra
  stack real. Se verifica a nivel de API en vez de por UI: el admin concede el conjunto con
  el endpoint real (`PATCH /users/:id/role`), el JWT resultante lleva los dos roles, la
  escritura de portafolio responde 2xx y —el assert de la regresión— el usuario **conserva**
  `project:own` y sigue creando proyectos. El switcher en sí ya estaba cubierto por unit
  (PBA-06); lo que faltaba probar de punta a punta era que sumar un rol no resta el otro.
- **No regresión**: la suite de backend completa (491 tests al cierre de ADR-028) y la de
  front; el smoke de referencia (`pdf-autofill.spec.ts`) verde.
