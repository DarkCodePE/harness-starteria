# Strategic Framing Promotion Prerequisites — SF-6B.1

Estado: implementado en la rama `design/KAN-24-sf6b1-promotion-prerequisites`.
Alcance: solo reconciliación de autoridad scoped y `ChallengeCandidate` provisional no canónico. SF-6C no está implementado.

## V2_CHANGE_GUARDRAIL_CHECK

- Slice registrado: SF-6B.1 / KAN-24.
- Autoridad leída: `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, `docs/STARTERIA_AUTHORITY.md`, Core v0.2, contratos SF-5/SF-6A/SF-6B y guardrails V2.
- Core, IA, permisos existentes, rutas de promoción y semántica canónica no fueron modificados.
- La autoridad Portfolio scoped fue reconciliada desde la referencia local `origin/main`, sin cherry-pick ni merge global.
- `ChallengeCandidate` vive en JSON nullable de estado provisional, es explícitamente no canónico y requiere confirmación humana.
- Migraciones exclusivamente aditivas; no hay backfill ni cambios destructivos.
- Tests focalizados, Prisma validate/generate, typecheck y `git diff --check` ejecutados.
- Resultado: `PASS`, con gap operativo no bloqueante: `git fetch origin` no pudo actualizar `FETCH_HEAD` por permisos del worktree compartido; se usó la referencia local existente de `origin/main`.

## Resultado técnico

### Scoped Portfolio authority

Se incorporó el comportamiento actual de `ScopedPortfolioAccessService`, el modelo `OrganizationPortfolioAccessGrant`, sus relaciones inversas y la migración aditiva. Membership sola y rol global no conceden autoridad; el grant scoped explícito y la membership son ambos necesarios. No se conectó aún esta autoridad al flujo de estructuración SF.

### ChallengeCandidate provisional

`StrategicFramingProvisionalState.challengeStructuringState` es un bloque JSON nullable con `schemaVersion: 1` y `nonCanonical: true`. La operación `reviewChallengeStructure`:

- genera `challengeCandidateId` servidor-side con `randomUUID()`;
- normaliza fuentes no vacías, únicas y ordenadas;
- acepta solo candidatos SF-5 `gap`/`opportunity` con `address_now` y `humanDecision` no nulo;
- preserva identidad al editar un candidato del mismo estado;
- genera nuevas identidades para grupos nuevos, sin reutilizar ids fuente;
- confirma actor, fecha y versión de origen en servidor;
- incrementa versión y escribe `review_challenge_structure` usando el historial existente;
- queda fuera del PATCH genérico, cuyo allow-list no incluye el nuevo bloque;
- no escribe StrategicFront, Challenge, Initiative/Project, Invitation ni Step.

## Evidencia

- Prisma schema validado y cliente generado.
- Tests focalizados: 20/20 passing.
- Typecheck completo frontend/backend: passing.
- `git diff --check`: passing.
- No se ejecutó la suite backend completa ni E2E; quedan como validación posterior si la revisión humana lo requiere.
