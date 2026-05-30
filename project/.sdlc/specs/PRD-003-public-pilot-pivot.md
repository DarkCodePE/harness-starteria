---
id: PRD-003
title: "Pivote del landing público: editor guiado con IA + captura de interés en piloto"
status: draft
date: 2026-05-29
author: BHIL Spec-Writer (Swarm)
sprint: S-03
priority: high
children:
  - SPEC-003
adrs: [ADR-015-backend, ADR-016-backend, ADR-006]
---

# PRD-003: Pivote del landing público — editor guiado con IA + captura de interés en piloto

## Problem statement

El landing público actual lleva al visitante anónimo a redactar un borrador de iniciativa y luego lo empuja a **crear una cuenta** (`register`/`login`) para convertir ese borrador en un proyecto del app autenticado (`createProjectFromPublicDraft → /projects/:id/step/0`). Dos problemas: (1) Starteria está en fase de **pilotos cerrados** — no queremos onboarding masivo self-service todavía, queremos identificar y contactar interesados cualificados; y (2) la edición del borrador hoy es plana y la "asistencia IA" del editor es **heurística hardcodeada en el cliente** (no hay refinamiento real), lo que produce sugerencias pobres y reintroduce mocks que el hito Zero-Mocks (2026-04-22) había purgado.

Este PRD cubre el pivote ya iniciado por tu hermano en la rama `feat/public-proposal-editor-ux` (PR #45, commits `33ca265` + `5c07280`) y lo lleva a estado **production-real**: reemplazar el muro de registro por un flujo de interés en piloto **persistido en backend**, y conectar la asistencia del editor a un **endpoint real de refinamiento IA**.

---

## In scope / Out of scope

**In scope**
- Editor de propuesta guiado (master-detail) con refinamiento de campo asistido por IA real.
- One-pager preview con jerarquía/copy nuevos y resaltado campo→preview.
- Reemplazo del flujo de signup público por captura de **pilot lead** (nombre, email, teléfono opc., organización opc., consentimiento) persistida en backend.
- Eventos de analítica del flujo de piloto (`pilot_interest_started/submitted/failed`).

**Out of scope**
- Reintroducir la conversión pública borrador→proyecto/cuenta (queda **removida** del landing — ver ADR-015). Es una decisión reversible si un piloto futuro lo requiere.
- Panel administrativo de gestión de leads (solo se persiste + notifica; la gestión es manual por ahora).
- Login/Google OAuth (cubierto por ADR-014, fuera de este pivote).

---

## User stories (EARS format)

**US-001 — Composer público:**
WHEN un visitante anónimo describe un problema/oportunidad en el composer del landing, the system SHALL generar un borrador preliminar de propuesta con campos estructurados y mostrarlo en el editor guiado, sin requerir autenticación.

*Acceptance bands US-001:* tasa de generación de borrador exitosa ≥ 0.97 sobre N=200 entradas válidas; P95 de tiempo hasta primer render del editor < 4 s.

**US-002 — Refinamiento de campo asistido por IA (real):**
WHEN el visitante solicita "mejorar con IA" sobre un campo editable del borrador, the system SHALL invocar el endpoint público de refinamiento (ai-service, vía bridge backend), devolver un valor sugerido para ese campo con su rationale breve, y permitir aceptar/descartar la sugerencia sin sobrescribir lo que el usuario ya escribió hasta que acepte.

*Acceptance bands US-002:* utilidad percibida de la sugerencia (LLM-judge + sampling humano) ≥ 0.75 sobre N=80; P95 de latencia de refinamiento < 6 s; tasa de fallback heurístico (cuando el servicio no responde) que NO rompe la UI = 1.00.

**US-003 — One-pager preview con resaltado:**
WHILE el visitante edita un campo en el editor master-detail, the system SHALL resaltar la sección correspondiente del one-pager preview y mantener la jerarquía narrativa legible.

*Acceptance bands US-003:* correspondencia campo→sección correcta en 100% de los campos; comprensión "esto es un preview, no el documento final" ≥ 7/8 en usability test.

**US-004 — Captura de interés en piloto (persistida):**
WHEN el visitante completa el formulario de interés en piloto (nombre + email válidos + consentimiento obligatorio) y envía, the system SHALL persistir el lead en backend asociado al `draftId`, generar un código `ST-PILOT-XXXX`, devolver confirmación y emitir el evento `pilot_interest_submitted`; y SHALL rechazar el envío si falta consentimiento o el email es inválido.

*Acceptance bands US-004:* persistencia exitosa de leads válidos ≥ 0.99 sobre N=200; 0 leads persistidos sin consentimiento explícito sobre N=100 intentos de QA; idempotencia por `draftId` (reenvío no duplica lead) verificada en 100%.

**US-005 — Consentimiento y PII:**
WHILE se capture cualquier dato personal en el flujo de piloto, the system SHALL almacenar el consentimiento explícito con timestamp, tratar email/teléfono como PII (ver ADR-015) y no exponerlos en respuestas públicas ni logs en claro.

*Acceptance bands US-005:* 0 ocurrencias de PII en claro en logs sobre auditoría de N=500 requests; consentimiento con timestamp presente en 100% de los leads.

**US-006 — Resiliencia offline / sin backend:**
IF el backend de leads o el servicio de IA no está disponible, THEN the system SHALL degradar con gracia (fallback heurístico para IA; cache local + reintento para leads) y comunicar el estado al usuario sin pérdida de datos ingresados.

*Acceptance bands US-006:* 0 pérdidas de datos del formulario ante fallo de red sobre N=50 simulaciones; mensaje de estado correcto en ≥ 0.95.

---

## Non-functional requirements

- **NFR-1 (abuso/coste):** El endpoint público de refinamiento IA es rate-limited (reutilizar el limiter de `public-pdf`) y tiene tope de coste por sesión/IP. Ver ADR-016.
- **NFR-2 (privacidad):** Retención de leads y manejo de PII conforme a ADR-015; consentimiento obligatorio.
- **NFR-3 (sin mocks en prod):** La asistencia IA en producción NO usa el mock heurístico salvo como fallback explícito y observable. La deuda del mock cliente se cierra en SPEC-003.
- **NFR-4 (analítica):** Eventos `pilot_interest_*` emitidos de forma consistente para medir conversión del funnel de piloto.

---

## Success metrics

- Tasa de conversión visitante→lead de piloto (objetivo a definir con producto tras 2 semanas de datos).
- Leads de piloto cualificados (con consentimiento + email válido) por semana.
- Utilidad de las sugerencias IA (US-002) y reducción de campos vacíos al enviar interés.

---

## Open questions

- ¿Quién recibe la notificación de un nuevo lead (email a equipo / canal)? — se resuelve en SPEC-003 §notificación.
- ¿Política de retención exacta de los leads (días)? — se decide en ADR-015.
- ¿Se sube `langchain`/`langgraph` a 1.x (PRs dependabot #12/#13) antes de construir el endpoint IA? — pre-requisito evaluado en SPEC-003.
