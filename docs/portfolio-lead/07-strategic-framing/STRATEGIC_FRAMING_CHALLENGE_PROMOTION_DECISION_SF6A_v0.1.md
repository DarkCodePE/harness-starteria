# Strategic Framing SF-6A — Challenge Promotion Decision

**Estado:** `APPROVED DECISION — GO_WITH_GAPS`

Este documento es el artefacto consolidado de decisión de SF-6A. Autoriza únicamente la
decisión y sus límites de diseño; no autoriza runtime, Prisma, rutas, tests productivos,
commit, push ni el inicio de SF-6B.

## 1. Decisión aprobada

SF-6A aprueba una promoción humana, explícita y gobernada desde un candidato de Strategic
Framing hacia un Challenge canónico en estado `draft`, condicionada a los bloqueos de
promoción definidos abajo.

`GO_WITH_GAPS` existe únicamente porque:

- H1-H6 todavía requieren validación con usuarios.
- El Challenge canónico opcional sigue siendo candidato a un ADR futuro.

Ninguna de estas cuestiones bloquea SF-6B.

El Core no cambia. No se autoriza la creación automática de Front, Challenge, Initiative,
Invitation ni Step, ni la activación de Steps.

## 2. Autoridad humana y alcance

La promoción requiere:

- permiso técnico `portfolio:write`;
- autoridad de dominio `portfolio_lead`.

La matriz aprobada es:

| Actor o condición | Autoridad de promoción |
|---|---|
| `portfolio_lead` | Sí |
| `admin` sin `portfolio_lead` | No |
| `admin` + `portfolio_lead` | Sí |
| Sponsor | No automática |
| Challenge Owner | No automática |
| Decision Authority configurable en el futuro | Requiere contrato gobernado separado |

La autoridad debe validarse en servidor. La autoridad humana no se deriva de Sponsor,
Challenge Owner, del navegador ni de una sugerencia de IA.

## 3. Strategic Front y alcance organizacional

Un Strategic Front canónico es obligatorio para promover.

- El servidor debe validar que existe y que es canónico.
- Si `state.organizationId` no es `null`, `StrategicFront.organizationId` debe ser igual.
- Un `organizationId` enviado por el navegador nunca es autoritativo.
- El alcance corporativo ausente, provisional, no resuelto o incompatible bloquea la promoción.
- No se crea un Front automáticamente.

Un Front provisional o una etiqueta no resuelta no puede convertirse silenciosamente en el
Front canónico.

## 4. Elegibilidad y bloqueos de promoción

El candidato elegible debe estar en `ADDRESS NOW`, con `humanDecision`, identidad/evidencia
actuales y la versión de estado esperada vigente. `sufficiency.status = sufficient` no es un
requisito universal.

La promoción se bloquea por cualquiera de estas condiciones:

- el candidato no está en `ADDRESS NOW`;
- falta `humanDecision`;
- candidato o estado esperado están ausentes o desactualizados;
- Front ausente, provisional, no resuelto o con alcance inválido;
- título no confirmado por la persona;
- declaración de problema/oportunidad no confirmada por la persona;
- tipo no confirmado por la persona;
- la promoción ya existe.

Los huecos blandos pueden permanecer visibles y no bloquean por sí solos.

## 5. Tipo y payload mínimo

El tipo de Challenge es obligatorio para promover. La persona debe confirmar explícitamente
exactamente uno de:

- `correccion`;
- `crecimiento`;
- `exploracion`.

El default Prisma `crecimiento`, una inferencia por keywords o una sugerencia gobernada no
pueden sustituir la confirmación de promoción.

El payload mínimo de promoción es:

- `strategicFrontId` canónico y validado;
- título confirmado por la persona;
- declaración de problema/oportunidad confirmada por la persona;
- tipo de Challenge confirmado por la persona.

Los demás campos del Challenge son opcionales o recomendados. Solo el payload confirmado se
convierte en contenido canónico; no se infieren owner, sponsor, autoridad, KPI, éxito,
presupuesto, urgencia, impacto, Initiative, Invitation ni Step.

El Challenge inicial queda en `draft`. No se producen efectos laterales de lifecycle.

## 6. Corrección material y re-promoción

Para una misma combinación `stateId + candidateId` puede existir como máximo una promoción
canónica.

Una corrección material de la fuente debe:

- exponer `requires_review` o revisión de alineación contra el Challenge existente;
- evitar una segunda promoción automática;
- evitar toda reescritura silenciosa.

Una acción explícita futura de split o creación de un Challenge nuevo queda fuera del MVP de
SF-6. El candidato se conserva en Strategic Framing y su `humanDisposition` no se cambia
automáticamente.

## 7. Trace aprobado

`StrategicFramingPromotion` es el concepto de trazabilidad aprobado.

- Cambio de esquema esperado: **sí**.
- Naturaleza: traza aditiva y no canónica.
- ADR: **no** mientras siga siendo aditiva y no canónica; **sí** si cambia semántica canónica,
  autoridad o lifecycle del Front.
- Restricciones lógicas: `UNIQUE(stateId, candidateId)` y `UNIQUE(challengeId)`.
- Reintento exitoso: reutiliza el resultado existente.
- Concurrencia: debe impedir duplicados.
- Candidato: se conserva.

La forma exacta de Prisma y la transacción pertenecen a SF-6B/SF-6C y no reabren la decisión
de producto.

## 8. Recomendación estructural

Se preservan las cuatro salidas:

- `KEEP_PROVISIONAL`;
- `LIGHTWEIGHT_CHALLENGE`;
- `ONE_CHALLENGE`;
- `MULTIPLE_CHALLENGES`.

La recomendación estructural no equivale a canonicalización. En particular:

- `LIGHTWEIGHT_CHALLENGE` es una simplificación UX, no un Challenge opcional en Core;
- la agrupación de IA es evidencia advisory, no estructura canónica;
- la similitud semántica o el número de iniciativas no son reglas suficientes;
- la revisión y corrección humana son obligatorias;
- una nueva evidencia genera una nueva recomendación o revisión, nunca un split/merge silencioso.

El Challenge debe priorizar outcome/problema/oportunidad, trabajo e iniciativas relacionados,
cobertura, evidencia/señales, atención/dependencias y la siguiente decisión de gobernanza.
La trazabilidad es información secundaria de apoyo, no el centro del valor.

## 9. Límites de efectos

La promoción no debe:

- cambiar suficiencia;
- crear automáticamente un Strategic Front;
- crear automáticamente un Challenge;
- crear Invitations o Initiatives;
- activar Steps;
- exigir Copilot;
- introducir divergencia semántica entre los modos de entrada.

`PortfolioService.createChallenge` podrá adaptarse internamente cuando exista una frontera de
aplicación gobernada; por sí solo no constituye dicha frontera. Las decisiones de implementación
no se resuelven en este documento.

## 10. SF-6B — alcance cerrado

SF-6B es una auditoría de estado actual y preparación de implementación. No debe reabrir las
decisiones de producto aprobadas en SF-6A. Es responsable de:

- forma exacta de Prisma para `StrategicFramingPromotion`;
- relaciones, índices y restricciones;
- frontera transaccional;
- adaptación interna de `PortfolioService.createChallenge`;
- compatibilidad de enforcement server-side de rol y alcance;
- mecanismo de `expectedVersion` y concurrencia;
- contrato de respuesta e idempotencia;
- seguridad de migración;
- tests exactos requeridos para SF-6C.

SF-6B puede identificar una contradicción de implementación y detenerse, pero no puede
reabrir silenciosamente autoridad, alcance, payload, tipo, corrección material, bloqueos ni
la semántica de la traza aprobados aquí.

## 11. Preguntas abiertas finales

1. **Validación de usuarios H1-H6** — owner: Product Research — `NONBLOCKING` para SF-6A/SF-6B;
   requerida antes de productizar ampliamente la recomendación estructural.
2. **ADR futuro de Challenge canónico opcional** — owner: Product/Core — `NONBLOCKING`;
   el Core actual permanece sin cambios.

## SF-6A FINAL STATUS: GO_WITH_GAPS

HUMAN APPROVED:
YES

BLOCKING OPEN QUESTIONS:
NONE

NONBLOCKING OPEN QUESTIONS:
- H1-H6 user validation
- future Optional Canonical Challenge ADR

CORE CHANGED:
NO

RUNTIME IMPLEMENTED:
NO

READY TO COMMIT:
YES

READY FOR SF-6B AFTER COMMIT:
YES
