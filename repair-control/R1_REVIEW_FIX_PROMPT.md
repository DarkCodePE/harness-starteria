# R1 — Review Fix Prompt

Trabaja sobre los cambios R1 ya existentes y NO los descartes.

Worktree:
`C:\Users\User\proyect-starteria\Dashboardstarteria-repair-r1`

Branch:
`repair/mvp-r1-truth-foundation`

Starting control commit:
`bf8596d`

Lee antes de tocar código:

1. `AGENTS.md`
2. `repair-control/00_REMEDIATION_MASTER_PLAN.md`
3. `repair-control/R1_TRUTH_FOUNDATION.md`
4. `repair-control/R1_CODEX_IMPLEMENTATION_PROMPT.md`
5. `repair-control/runs/R1/R1_IMPLEMENTATION_RESULT.md`

Tu tarea NO es ampliar R1. Es revisar y corregir únicamente los gaps de integridad detectados después de la primera implementación.

---

# Gate de revisión

No declares R1 listo mientras exista cualquiera de los siguientes problemas.

## REVIEW-01 — Integridad referencial de TruthValidation

Actualmente `TruthValidation` contiene referencias como:

- `projectId`
- `claimId`
- `evidenceId`
- `sourceRefId`

pero no todas están protegidas por relaciones/FKs.

Corrige para que, como mínimo:

- `TruthValidation.projectId` quede ligado al `Project` real o exista una razón arquitectónica explícita y testeada para no hacerlo;
- `TruthValidation.evidenceId`, cuando existe, apunte a un `Evidence` real;
- la evidencia usada por una validación pertenezca al mismo `projectId`;
- si existe `claimId`, la evidencia usada para soportar/contradecir ese claim sea coherente con ese claim.

No permitas referencias huérfanas que hagan parecer trazable una validación que no lo es.

---

## REVIEW-02 — `supported` requiere evidencia coherente

Una validación con resultado `supported` NO debe poder promover un Claim únicamente porque:

- existe un `claimId`;
- existe un string `evidenceId`;
- existe un string `sourceRefId`.

Debe comprobarse que:

1. el Claim existe en el proyecto;
2. existe Evidence real;
3. Evidence pertenece al mismo proyecto;
4. Evidence está ligada al Claim que se valida;
5. Evidence tiene SourceRef real/provenance;
6. Evidence no está marcada como `contradicts` o `insufficient`;
7. el actor autorizado puede realizar esa validación.

Añade tests adversariales:

- supported sin evidence → reject;
- supported con evidence de otro claim → reject;
- supported con evidence de otro project → reject;
- supported con evidence `contradicts` → reject;
- supported con source inexistente → reject.

---

## REVIEW-03 — IA no debe convertirse en autoridad de validación

Revisa `TruthValidatorType`.

La IA puede:

- analizar;
- señalar contradicción;
- recomendar;
- proponer un assessment;
- marcar faltantes.

Pero el contrato R1 no debe permitir que un output de IA cambie por sí mismo la verdad autorizada del Claim.

Asegura que una operación atribuida a IA NO pueda cambiar `TruthClaim.verificationState` a:

- `supported`;
- `contradicted`;
- `insufficient`;

si esos estados representan la validación autorizada final.

Si necesitas conservar análisis IA, represéntalo como assessment/source/provenance y no como validación humana final.

Human y/o `system_rule` explícitamente autorizado pueden efectuar transición de validación según el contrato.

Documenta la decisión exacta.

---

## REVIEW-04 — ImpactStatus no puede validar con un ID arbitrario

Actualmente `transitionImpact` exige `validationId` para `validated`, pero la presencia de un string no demuestra que la validación sea real.

Corrige para que una transición a `validated`:

1. resuelva una `TruthValidation` real;
2. pertenezca al mismo `projectId`;
3. tenga resultado compatible con `supported`;
4. esté vinculada al Claim/Impact correspondiente cuando aplique.

Una transición a `realized` debe exigir:

- estado previo `validated`;
- la validación persistida todavía existente y coherente.

Añade tests:

- random validationId → reject;
- validation de otro project → reject;
- contradicted/insufficient validation → reject;
- validated correcto → allow;
- realized sin validación real → reject.

Añade FK/relación Prisma donde sea consistente con el diseño.

---

## REVIEW-05 — Referencias débiles

Revisa:

- `TruthClaim.currentValidationId`
- `TruthClaim.sourceRefsJson`
- `ImpactAssertion.claimId`
- `ImpactAssertion.sourceRefId`
- `ImpactAssertion.validationId`

Objetivo:

las referencias importantes para verdad/provenance no deben depender solamente de JSON o strings no verificables.

No hace falta sobrediseñar.

Para cada una decide:

- RELATION/FK
- explicit snapshot JSON + validated relational source
- mantener string con justificación excepcional

Documenta la decisión.

Prioriza integridad y trazabilidad sobre comodidad.

---

## REVIEW-06 — Migración real

La migración R1 todavía no está demostrada contra PostgreSQL desechable.

NO uses una DB productiva.

Primero inspecciona los scripts existentes:

- `db:e2e:provision`
- `db:e2e:migrate`
- `db:e2e:status`

Intenta levantar/provisionar la DB disposable mediante el mecanismo ya existente del repo.

Si Docker/local PostgreSQL no está disponible:

- NO inventes PASS;
- deja `TEST_ENVIRONMENT_FAILURE`;
- documenta el comando exacto y el blocker.

Si está disponible:

1. provision;
2. migrate deploy desde cero;
3. status;
4. ejecutar un test de persistencia R1 contra DB real;
5. comprobar refresh/read de Claim/Evidence/Validation/AttentionItem.

---


## REVIEW-07 — No ocultar el contrato Prisma con `as any`

La implementación actual usa varios accesos del tipo:

`(this.prisma as any).truthClaim`
`(this.prisma as any).truthValidation`
`(this.prisma as any).attentionItem`
`(this.prisma as any).impactAssertion`

Después de `prisma generate`, los nuevos modelos deben estar disponibles en el tipo real de PrismaClient.

Elimina estos `as any` para los modelos R1 siempre que sea técnicamente posible.

Objetivo:

- que TypeScript verifique nombres de modelos;
- inputs Prisma;
- relaciones;
- selects;
- updates;
- transacciones.

Si un cast sigue siendo imprescindible, documenta exactamente por qué y limita el cast al borde mínimo.

No uses `any` para hacer pasar typecheck o esconder una relación incompleta.

Añade el resultado de este punto a la sección `K. Review Fix Pass`.

---

# Testing mínimo adicional

Después de corregir:

```powershell
npm.cmd run db:generate
npx.cmd vitest run --config vitest.backend.config.ts backend/modules/truth/__tests__/truth.service.test.ts
npm.cmd run test:backend
npm.cmd run test:front
npm.cmd run typecheck
npm.cmd run build
```

Si logras provisionar DB desechable:

```powershell
npm.cmd run db:e2e:provision
npm.cmd run db:e2e:migrate
npm.cmd run db:e2e:status
```

Añade un integration test real para R1 si el entorno lo permite.

---

# Reporte

Actualiza:

`repair-control/runs/R1/R1_IMPLEMENTATION_RESULT.md`

Añade una sección:

`## K. Review Fix Pass`

Incluye:

- REVIEW-01..07
- qué estaba mal
- qué cambió
- archivos
- tests
- evidencia
- blockers
- diferencias entre unit/mock tests y persistencia real

Corrige cualquier afirmación previa demasiado fuerte.

Por ejemplo, si no existe DB-backed proof, no describas como E2E una prueba que solo usa mocks.

---

# Restricciones

NO:

- R2
- R3
- R4
- R5
- commit
- push
- merge
- rebase
- reset
- arreglar el baseline `LOG_REDACT_PATHS` salvo que sea estrictamente requerido por este review

No declares audit IDs PASS.

Termina con:

- REVIEW RESULT
- READY FOR HUMAN DIFF REVIEW / NOT READY
- razones
- confirmación de no commit/push/merge
