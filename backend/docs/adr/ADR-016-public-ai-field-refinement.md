# ADR-016: Endpoint público de refinamiento de campo con IA (bridge backend + rate-limit)

## Status
Proposed — 2026-05-29

## Date
2026-05-29

## Context

El nuevo editor público (`PublicProposalEditor.tsx`, PR #45) ofrece "mejorar con
IA" por campo, pero la implementación actual es **heurística hardcodeada en el
cliente**: `buildSuggestion()` con un `Record<EditableField, string>` de strings
fijos, más `generateMockPublicDraftOutput()` / `inferChallengeType()`. No hay
ninguna llamada a un modelo. Esto:

- produce sugerencias pobres y no contextuales,
- **reintroduce mocks** en `front/src/` que el hito Zero-Mocks (2026-04-22) purgó,
- y no es lo que PRD-003 (US-002) define como "refinamiento IA real".

Necesitamos exponer un refinamiento real. Como es una superficie **pública**
(visitante anónimo, sin auth) que invoca un LLM, el riesgo de **abuso y coste**
es el driver principal. El backend ya tiene un patrón probado para hablar con
`ai-service`: bridge HMAC + `X-Request-Id` (ADR-011) y un router público
rate-limited (`modules/initiative-pdfs/public-pdf.*`).

La **capa de framework** del lado ai-service se decide en ADR-006 (resultado:
chain LangChain stateless, no grafo). Este ADR cubre el **contrato y la
protección del endpoint** del lado backend.

**Decision question:** ¿Cómo exponemos el refinamiento IA al landing público de
forma segura (sin auth) y con coste/abuso acotados?

## Decision

1. **Endpoint bridge público** `POST /api/v1/public/refine-field` en backend,
   montado bajo el mismo módulo/patrón que `public-pdf` (sin JWT, rate-limited).
2. **Rate-limit + tope de coste:** reutilizar el limiter del flujo público de PDFs
   y añadir un tope de coste por IP/sesión. Al excederse → `429`; el frontend cae
   a un **fallback heurístico local** (el `buildSuggestion` actual, marcado como
   sugerencia local, no como IA).
3. **Bridge HMAC** Express→ai-service (ADR-011): el backend firma y reenvía a
   `POST {ai-service}/public/refine-field`; el binario/LLM no se expone al cliente.
4. **Payload sin PII:** el borrador público es anónimo; el contrato
   (`field`, `currentValue`, `draftContext`) no transporta email/teléfono. La PII
   del lead vive en el flujo hermano (ADR-015), nunca en el de refinamiento.
5. **Validación de salida:** Express valida el schema de respuesta
   (`suggestedValue`, `rationale`, `confidence`) antes de devolverlo al front.

## Consequences

**Positivas**
- Sugerencias reales y contextuales; se cierra la deuda de mock cliente (NFR-3).
- Reutiliza seguridad existente (HMAC, rate-limit público) → bajo coste e implementación coherente.
- Degradación elegante: el editor nunca queda inutilizable si la IA falla.

**Negativas / costes**
- Superficie pública que invoca LLM → coste variable; el tope es mitigación, no eliminación.
- Latencia añadida (P95 < 6 s objetivo, PRD-003 US-002).
- El fallback heurístico debe mantenerse mientras exista riesgo de indisponibilidad.

## Alternatives considered

- **Llamar al LLM desde el frontend** — rechazado: expondría claves y coste sin control.
- **Requerir auth para refinar** — rechazado: rompería el flujo público anónimo (el objetivo del landing).
- **Dejar la heurística como única vía** — rechazado: no es "IA real", reintroduce mocks (Zero-Mocks).

## Related
- PRD-003, SPEC-003
- ADR-006 (capa de framework de la chain en ai-service)
- ADR-011 (bridge HMAC frontend↔ai-service — patrón reutilizado)
- ADR-015 (captura de pilot lead — flujo público hermano)
