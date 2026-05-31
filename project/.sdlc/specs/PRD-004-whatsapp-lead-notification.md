---
id: PRD-004
title: "Notificación de pilot lead por WhatsApp vía OpenWA (self-hosted)"
status: backlog
date: 2026-05-31
author: Claude Code (Opus)
sprint: TBD
priority: medium
children:
  - SPEC-004
adrs: [ADR-017-backend, ADR-015-backend]
milestone: "WhatsApp lead notification"
---

# PRD-004: Notificación de pilot lead por WhatsApp vía OpenWA

## Problem statement

Cuando un visitante envía interés en el piloto, el equipo recibe hoy un aviso por
**correo** (ADR-015 §4, PR #60). El correo da trazabilidad pero **poca
inmediatez**: un lead de piloto es caliente y el equipo opera mayormente en
WhatsApp, no en el inbox. Queremos un canal **inmediato y accionable** que avise
al equipo en segundos para acelerar el contacto.

La decisión de producto (2026-05-31, ADR-017) es **usar OpenWA** — un gateway de
WhatsApp self-hosted (open source, MIT) sobre `whatsapp-web.js` — en vez de la
WhatsApp Business Cloud API oficial. Esto asume conscientemente un servicio
**stateful** (Chromium headless + PVC + sesión vinculada por QR) y el **riesgo de
ToS** del engine no oficial (ver ADR-017 §Consequences y el diagrama de deployment
`docs/diagrams/adr-017-openwa-whatsapp-deployment.drawio`).

Este PRD queda en **backlog**: documenta y planifica el trabajo, pero el correo
cubre la necesidad mínima hasta su priorización.

---

## In scope / Out of scope

**In scope**
- Despliegue de **OpenWA** en el clúster (namespace dedicado, Deployment 1 réplica,
  PVC para la sesión, número de WhatsApp dedicado).
- `WhatsAppNotifier` en el backend (HTTP → OpenWA `send-text`) + un
  `CompositePilotLeadNotifier` que hace **fan-out** a correo + WhatsApp.
- Mensaje de WhatsApp accionable con el contacto del lead (nombre/email/teléfono/org).
- Degradación con gracia: si OpenWA no responde, se loguea sin PII y **no** se
  rompe la captura; el correo sigue como canal primario.
- Configuración por secret/env (`OPENWA_BASE_URL`, `OPENWA_API_KEY`,
  `WHATSAPP_NOTIFY_CHAT_ID`).
- Runbook de operación: bootstrap de sesión (escaneo de QR) y re-vinculación.

**Out of scope**
- WhatsApp Business Cloud API oficial (se reconsiderará al mensajear a clientes —
  ADR-017 §Alternatives).
- Mensajería **saliente a clientes/leads** por WhatsApp (esto es notificación
  **interna al equipo**). Cualquier mensaje a clientes exige plantillas/consentimiento
  aparte.
- Recepción/respuesta de mensajes (webhooks inbound), bot conversacional.
- Alta disponibilidad real del gateway (1 réplica por diseño del engine).
- Reemplazar el correo (es aditivo).

---

## User stories (EARS format)

**US-001 — Notificación inmediata por WhatsApp:**
WHEN se persiste un nuevo pilot lead válido, the system SHALL enviar un mensaje de
WhatsApp al destino del equipo (`WHATSAPP_NOTIFY_CHAT_ID`) vía OpenWA con el
contacto del lead (nombre, email, teléfono, organización) y el `pilotCode`, en
adición al correo existente.

*Acceptance bands US-001:* entrega exitosa del mensaje ≥ 0.95 sobre N=100 leads
con OpenWA sano; P95 desde captura hasta mensaje enviado < 8 s.

**US-002 — Degradación sin pérdida:**
IF OpenWA no está disponible o devuelve error, THEN the system SHALL registrar el
fallo (sin PII) y completar la captura del lead y el correo con normalidad, sin
propagar el error al usuario.

*Acceptance bands US-002:* 0 capturas fallidas por caída de OpenWA sobre N=50
simulaciones; 0 ocurrencias de PII en logs sobre auditoría de N=200.

**US-003 — Fan-out de canales:**
WHILE existan múltiples canales de notificación configurados (correo + WhatsApp),
the system SHALL invocarlos de forma independiente, de modo que el fallo de uno no
impida el otro.

*Acceptance bands US-003:* independencia verificada — fallo inducido de un canal
no afecta al otro en 100% de los casos de prueba.

**US-004 — Sesión persistente / re-vinculación operable:**
WHEN el pod de OpenWA se reinicia, the system SHALL recuperar la sesión desde el
PVC sin re-escanear el QR; IF la sesión expiró, THEN el dashboard SHALL permitir
re-vincular escaneando un nuevo QR, con un runbook documentado.

*Acceptance bands US-004:* recuperación de sesión tras reinicio (con PVC intacto)
sin intervención en ≥ 0.95 de los reinicios; runbook de re-link presente y probado.

**US-005 — PII y consentimiento (hereda ADR-015):**
WHILE se notifique por WhatsApp, the system SHALL incluir PII de contacto solo en
el cuerpo del mensaje al equipo (propósito consentido), nunca en logs/AuditLog en
claro, y solo para leads con consentimiento previo.

*Acceptance bands US-005:* 0 PII en claro en logs sobre N=500; 100% de mensajes
corresponden a leads con `consentAccepted=true`.

---

## Risks & mitigations

| Riesgo | Mitigación |
|---|---|
| Ban del número (ToS de WhatsApp) | Número dedicado, volumen bajo/interno, no mensajear clientes; correo como respaldo permanente |
| Sesión cae → QR re-scan manual | PVC persistente + runbook + alerta cuando `session.status` ≠ connected |
| Chromium = alto RAM/CPU | Requests/limits dedicados; namespace aislado; medir antes de prod |
| Engine alpha se rompe | Pin de versión; correo nunca depende de WhatsApp |
| Acoplamiento backend↔OpenWA | Notifier desacoplado + degradación con gracia (US-002) |

## Open questions (para SPEC-004 / triage)
1. ¿Destino = número individual o **grupo** de WhatsApp del equipo (`@g.us`)?
2. ¿Qué número dedicado se usa y quién lo administra (escaneo de QR)?
3. ¿Base de datos de OpenWA: PostgreSQL propio o SQLite en PVC? (afecta el #pods/PVCs)
4. ¿Se expone el dashboard `:2886` (tras auth) o se opera por port-forward?

## Related
- ADR-017 (decisión de integración + diagrama de deployment)
- ADR-015 / SPEC-003 / PR #60 (captura de lead + EmailNotifier — canal primario)
