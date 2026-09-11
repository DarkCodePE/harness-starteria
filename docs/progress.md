# Progreso del harness

**Última actualización:** 2026-09-11

Este archivo registra el estado de **construir** el harness. No confundir con `estado/BITACORA.md`,
que registra el estado de **usarlo** (corridas de casos, decisiones de producto) y lo escribe
`/starteria-cierre`. Son dos relojes distintos, como dice `LIFECYCLE.md` §5.

Nada actualiza este archivo solo. Se llena a mano al cerrar una sesión de trabajo.

---

## Estado actual

**v0.1 escrito, empaquetado como plugin, verificado por estructura. Sin correr end to end.**

Los ocho comandos existen, el plugin instala y carga, y toda la documentación del porqué está
escrita. Lo que todavía no pasó es que alguien corra un caso de principio a fin. Hasta entonces el
harness está escrito, no probado, y esa es exactamente la distinción que le exige a todo lo demás.

| Pieza | Estado |
|---|---|
| 8 comandos (`skills/starteria*`) | hechos, 15 archivos |
| Plugin (`.claude-plugin/`) | instala y carga; inventario reporta `Skills (8)` |
| Documentos del harness (`docs/`) | PRD, DDD, ARCHITECTURE, LIFECYCLE, PLAN, este |
| 8 ADR (`docs/adr/`) | todos en `proposed`, ninguno firmado |
| Fase 2 (probar) | **sin empezar** |
| Fase 3 (usar, Rounds 1 a 3) | bloqueada por la fase 2 |

---

## Lo hecho, por sesión

### 2026-09-10 · construir

- Ocho comandos en `.claude/skills/starteria*`, en español, sobre los contratos de `doc/`.
- Rúbrica, plantillas, glosario, mapa de autoridad y guía de ChatGPT.
- `ADR-001` a `ADR-007` con alternativas y costo.
- PRD, DDD, ARCHITECTURE, LIFECYCLE, PLAN.
- Repo inicializado, PR #1 abierta contra `main`.
- **Hallazgo:** `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` y `STARTERIA_AUTHORITY.md` no existen, y el
  AI Harness declara al primero como su fuente número uno. El nivel 3 de la cadena de autoridad está
  vacío. Anotado en `MAPA-DE-DOCUMENTOS.md`.

### 2026-09-11 · investigar, empaquetar, liberar el nombre

- **Fase 2 reescrita** con evidencia externa sobre cómo se prueban los harness de agentes. Tres
  cosas entraron: la prueba de trayectoria (verificar que la fase de responder corrió ciega, porque
  un registro se ve igual contaminado que aislado), el orden binario-primero al puntuar, y que
  `unknown` en la capa de fallo es la respuesta honesta más seguido de lo que parecía (el mejor
  método publicado acierta el paso decisivo el 14.2% de las veces).
- **Fase 3 ampliada** con tres reglas de curaduría: core congelado más set creciente aparte,
  clusterizar en vez de acumular, e incluir casos que pasan.
- **Empaquetado como plugin** (`ADR-008`, supera a `ADR-001`). Instalado y verificado.
- **Nombre `skills/` liberado** el mismo día, después de ver cómo lo resuelve `token-optimizer`: su
  `plugin.json` no declara skills porque Claude Code las autodescubre en `skills/`. El clon de
  mattpocock pasó a `referencia/`; las nuestras, de `comandos/` a `skills/`. Se eliminó el array
  manual y con él un modo de fallo silencioso.
- **Hallazgo:** el inventario del plugin reporta `MCP servers (1) claude-flow`. La raíz del repo es
  la raíz del plugin, así que está tomando el `.mcp.json` de ruflo. Desde GitHub no viaja (está
  ignorado), pero es la clase de fuga que produce empaquetar en la raíz. Anotado en `ADR-008`.

---

## Qué queda abierto

| Pendiente | Dueño | Qué desbloquea |
|---|---|---|
| Correr `PE-B03` de punta a punta (fase 2.2), con la prueba negativa | sin definir | todo lo demás: hasta que esto pase, el harness no está probado |
| Firmar los 8 ADR, o rechazar los que no vayan | una persona con autoridad | que las decisiones dejen de ser propuestas |
| Instalar el plugin desde GitHub, no solo desde ruta local | sin definir | criterio abierto de `ADR-008` |
| Probar el plugin en un repo **sin** `doc/` | sin definir | criterio abierto de `ADR-008`; puede mover la frontera entre plugin y contratos |
| Montar el Proyecto de ChatGPT (fase 2.5) | sin definir | el segundo runtime |
| Decidir si `doc/` debe ser público en el repo | sin definir | son contratos del cliente y hoy están visibles |

**El primero es el que importa.** Los otros cinco se pueden hacer en cualquier orden.

---

## Por dónde seguir

Instalar el plugin, abrir sesión nueva, y correr `/starteria-probar PE-B03` siguiendo la fase 2.2 de
`PLAN.md`. Lo primero que hay que mirar no es el veredicto: es si la fase de responder vio la
rúbrica. Después, la prueba negativa: correrlo todo en un hilo a propósito y confirmar que el
registro dice `CONTAMINADO`. Si no lo dice, eso se arregla antes que cualquier otra cosa.
