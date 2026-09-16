# ADR-028: `portfolio_lead` como séptimo rol de plataforma

- **Estado**: Aceptado
- **Fecha**: 2026-08-04
- **Enmienda a**: ADR-010 (Aceptado) — el modelo de 6 roles pasa a 7
- **Relacionados**: ADR-004 (autorización original, 4 roles), ADR-009 (modelo de 6 roles),
  ADR-023 (modelo de equipo unificado, `TeamRole` ortogonal a este eje),
  ADR-024 (persistencia de mutaciones del portfolio lead), ADR-018 (restricción de deploy: `prisma db push`)

## Contexto

El portal de portfolio lead (`/portfolio/*`) existe desde ADR-024 con su propio layout,
su propio provider y sus propias rutas de backend. Pero **el rol que lo gobierna nunca
existió**.

La sesión sí se comparte con el dashboard: mismo `/auth`, mismo `AppProvider` en
`RootLayout`, mismo JWT, mismo interceptor. Lo que no existe es la identidad:

- `front/prisma/schema.prisma` declara `enum Role` con seis valores —
  `participante`, `mentor`, `admin`, `sponsor`, `colaborador`, `viewer`. Ninguno es
  `portfolio_lead`.
- El frontend lo sintetiza comparando la dirección de correo del usuario contra una
  lista, en `mapBackendUser` (`front/src/app/context/AppContext.tsx`). Empezó como un
  ternario contra una constante y evolucionó a un `Set` alimentado por
  `VITE_PORTFOLIO_LEAD_EMAIL` más un correo de test en no-producción. La sofisticación
  creció; el mecanismo no cambió: **sigue siendo identidad por correo**.
- El usuario demo está sembrado con `Role.viewer` (`front/prisma/seed.ts`,
  `backend/modules/auth/auth.service.ts`).
- `front/src/app/layout/RootLayout.tsx` repite el mismo correo por segunda vez, para
  otra cosa (activar fixtures demo).

Tres consecuencias medidas:

1. **La separación es cosmética y el servidor la contradice.** El JWT lleva `viewer`.
   Las 19 rutas de escritura de `backend/modules/portfolio/portfolio.router.ts` están en
   `requireRole('admin', 'mentor')`, así que el portfolio lead recibe **403 en toda su
   propia sección**. La UI le deja entrar; el backend le dice que no. La única razón de
   que la demo parezca funcionar es que las lecturas no tienen gate.
2. **El rol es inalcanzable para un cliente real.** Solo quien controle esa dirección de
   correo (o la variable de entorno del build) puede ser portfolio lead.
3. **La regla vive duplicada en dos archivos** que no se enteran el uno del otro.

Un correo no es una credencial de autorización: es un dato de perfil, mutable, que
además el propio usuario puede cambiar en algunos flujos. Construir permisos sobre él
significa que el backend no puede tomar ninguna decisión de acceso sobre el portafolio.

## Decisión

**`portfolio_lead` pasa a ser un valor real del enum `Role`, viaja en el JWT y autoriza
en el servidor.** Se toman cuatro decisiones concretas:

### 1. Séptimo valor del enum, no un eje nuevo

Se añade `portfolio_lead` a `enum Role` y al union canónico de TypeScript
(`backend/shared/types/user.types.ts`), que es el único tipo estrecho del backend — al
ampliarlo, el compilador señala cada `switch` no exhaustivo.

Se descarta introducir un eje de permisos separado (tipo `isPortfolioLead: boolean` o
una tabla de membresías): el portfolio lead es una **persona con un puesto**, igual que
un mentor o un sponsor, no una capacidad transversal. Meterlo en el eje que ya existe
mantiene una sola pregunta que responder en cada guard.

El cambio es **aditivo**: `ALTER TYPE "Role" ADD VALUE`. Pasa el guard de
`prisma db push` sin `--accept-data-loss` que impone el CD. Es una operación distinta de
añadir `@@unique` a una tabla poblada, que es lo que prohiben ADR-018/020/023/026.

### 2. Las escrituras de portafolio pasan a `admin` + `portfolio_lead`; `mentor` las pierde

Las 19 apariciones de `requireRole('admin', 'mentor')` en `portfolio.router.ts` pasan a
`requireRole('admin', 'portfolio_lead')`.

Que el mentor pudiera publicar retos y editar frentes estratégicos era un efecto lateral
de no tener el rol correcto disponible, no una decisión de producto. Verificado antes de
quitarlo: `portfolioService` solo lo consumen `AppLayout.tsx` (una lectura) y la feature
`portfolio-lead`; `MentorPanelPage.tsx` y `AdminCohorte.tsx` no lo importan, y ningún
test de backend cubre esos gates.

`DELETE /strategic-fronts/:id` (hoy `requireRole('admin')`) también admite
`portfolio_lead`: los frentes estratégicos son el objeto propio de ese puesto.

**Las 7 rutas GET sin gate se quedan sin gate.** `AppLayout` llama `getInitiativeMeta`
para *todo* usuario autenticado, así que cerrarlas rompería a los participantes. Es una
deuda declarada, no un descuido.

### 3. Un admin puede asignar el rol por API

`PATCH /api/v1/users/:userId/role`, en el módulo de usuarios, con `requireRole('admin')`
explícito.

Sin esto el rol seguiría siendo inalcanzable: `register` rechaza cualquier valor distinto
de `participante` y no existía ningún endpoint que asignara roles de plataforma. Hoy
mentor, admin y sponsor se crean tocando la base de datos a mano; esta decisión corrige
eso para los siete roles a la vez, no solo para el nuevo.

Guardas:

- Un admin **no puede cambiar su propio rol**. Evita la auto-degradación que dejaría el
  sistema sin ningún admin.
- Al cambiar el rol se **revocan los refresh tokens del usuario objetivo**. Sin esto el
  cambio no aterriza hasta que el usuario decida renovar. `refresh` sí relee `user.role`
  de la base de datos, así que revocar fuerza que el siguiente token refleje el rol nuevo.
- Queda un desfase residual: el access token en curso sigue siendo válido hasta que
  expire (`JWT_EXPIRES_IN`, por defecto 15 min). Es la misma propiedad que ADR-004 ya
  documentaba para todo cambio de rol; se acepta, no se resuelve aquí.

### 4. El frontend deja de decidir el rol

`mapBackendUser` mapea `portfolio_lead → portfolio_lead` y se borra toda la lógica de
correos. El `Set`, la variable `VITE_PORTFOLIO_LEAD_EMAIL` y el correo de test
desaparecen.

En `RootLayout` el correo se quita **sin sustituirlo por el rol**: esa línea activa
fixtures de demo, y servírselas a todo portfolio lead real sería un cambio de
comportamiento que nadie pidió. Queda solo el flag explícito de demo.

Los guards de layout (`AppLayout`, `PortfolioLeadLayout`) y el redirect post-login de
`AuthPage` no cambian: ya leen `user.role`, que ahora viene del token.

## Alternativas descartadas

**Dejar el aprovisionamiento en seed/DB, como el resto de roles.** Era la opción de menor
superficie y mantenía la consistencia con mentor/admin/sponsor. Se descartó porque deja
la consecuencia (2) sin resolver: el rol existiría en el servidor pero seguiría sin haber
forma de dárselo a nadie por medios normales.

**Añadir `portfolio_lead` a los guards sin quitar `mentor`.** Aditivo y sin riesgo de
regresión. Se descartó porque conserva un permiso que nunca se decidió conceder.

**Autorizar por pertenencia a un frente estratégico en vez de por rol.** Más granular y
probablemente el destino a largo plazo, pero exige un modelo de membresía que hoy no
existe y no resuelve el 403 inmediato.

## Consecuencias

**A favor**

- El backend puede autorizar decisiones de portafolio. Antes no podía en absoluto.
- El rol es asignable a cualquier usuario; deja de estar atado a una dirección de correo.
- Desaparecen las dos copias de la regla del correo y las constantes muertas asociadas.
- `tsc` pasa a ser un detector de sitios donde falta considerar el rol nuevo.

**En contra / a vigilar**

- El mentor pierde escritura de portafolio. Es intencional, pero es un cambio de
  comportamiento para un rol existente: si alguien lo usaba fuera de los caminos
  verificados, se entera con un 403.
- Existe una superficie nueva de autorización (`PATCH .../role`) que hay que tratar como
  tal: es el endpoint más sensible del sistema, porque concede privilegios.
- El desfase de hasta 15 min en el access token aplica también a la *reducción* de
  privilegios.
- Las lecturas de portafolio siguen abiertas a cualquier autenticado.
- Un `Role` de 7 valores empieza a pedir una revisión del modelo: `viewer`,
  `colaborador` y `participante` mapean los tres a `owner` en el frontend, lo que sugiere
  que el eje de plataforma y el de proyecto están mezclados. Fuera de alcance aquí.

## Verificación

- `auth.schemas` acepta `portfolio_lead`; el auto-registro lo sigue rechazando.
- Test de router: un JWT `portfolio_lead` pasa `PUT /portfolio/initiatives/:id/meta`;
  un JWT `mentor` recibe 403 en la misma ruta.
- Tests del endpoint de rol: admin → 200 y refresh tokens revocados; no-admin → 403;
  admin sobre sí mismo → 403; rol inválido → 400.
- Test de `mapBackendUser`: `{role:'portfolio_lead', email:'cualquiera@x.com'}` da
  `portfolio_lead`, y `{role:'viewer', email:'portfolio@starteria.io'}` da `owner` —
  esta segunda aserción es la que prueba que el correo dejó de mandar.
- `prisma db push` sin `--accept-data-loss` contra una base con datos, replicando el
  comando exacto del CD.
- E2E: login como portfolio lead → `/portfolio/inicio` → una escritura con 2xx.
