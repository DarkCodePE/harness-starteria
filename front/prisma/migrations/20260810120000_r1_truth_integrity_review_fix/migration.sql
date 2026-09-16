-- R1 review fix: protect truth/provenance references with real relations.
-- Existing invalid R1 rows are removed or nulled before adding FKs so fresh and
-- previously migrated disposable DBs converge on the same integrity contract.

DELETE FROM "TruthValidation" tv
WHERE NOT EXISTS (
  SELECT 1 FROM "Project" p WHERE p."id" = tv."projectId"
);

DELETE FROM "TruthValidation" tv
WHERE tv."evidenceId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Evidence" e WHERE e."id" = tv."evidenceId"
  );

DELETE FROM "TruthValidation" tv
WHERE tv."evidenceId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Evidence" e
    WHERE e."id" = tv."evidenceId"
      AND e."projectId" <> tv."projectId"
  );

DELETE FROM "TruthValidation" tv
WHERE tv."claimId" IS NOT NULL
  AND tv."evidenceId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Evidence" e
    WHERE e."id" = tv."evidenceId"
      AND (e."targetClaimId" IS NULL OR e."targetClaimId" <> tv."claimId")
  );

UPDATE "ImpactAssertion" ia
SET "claimId" = NULL
WHERE ia."claimId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "TruthClaim" tc WHERE tc."id" = ia."claimId"
  );

UPDATE "ImpactAssertion" ia
SET "claimId" = NULL
WHERE ia."claimId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "TruthClaim" tc
    WHERE tc."id" = ia."claimId"
      AND tc."projectId" <> ia."projectId"
  );

UPDATE "ImpactAssertion" ia
SET "sourceRefId" = NULL
WHERE ia."sourceRefId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "SourceRef" sr WHERE sr."id" = ia."sourceRefId"
  );

UPDATE "ImpactAssertion" ia
SET "sourceRefId" = NULL
WHERE ia."sourceRefId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "SourceRef" sr
    WHERE sr."id" = ia."sourceRefId"
      AND sr."projectId" IS NOT NULL
      AND sr."projectId" <> ia."projectId"
  );

UPDATE "ImpactAssertion" ia
SET "validationId" = NULL
WHERE ia."validationId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "TruthValidation" tv WHERE tv."id" = ia."validationId"
  );

UPDATE "ImpactAssertion" ia
SET "validationId" = NULL,
    "status" = 'estimated'
WHERE ia."validationId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "TruthValidation" tv
    WHERE tv."id" = ia."validationId"
      AND (tv."projectId" <> ia."projectId" OR tv."result" <> 'supported')
  );

UPDATE "TruthClaim" tc
SET "currentValidationId" = NULL
WHERE tc."currentValidationId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "TruthValidation" tv WHERE tv."id" = tc."currentValidationId"
  );

UPDATE "TruthClaim" tc
SET "currentValidationId" = NULL,
    "verificationState" = 'unvalidated'
WHERE tc."currentValidationId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "TruthValidation" tv
    WHERE tv."id" = tc."currentValidationId"
      AND (tv."projectId" <> tc."projectId" OR tv."claimId" <> tc."id")
  );

CREATE TABLE "TruthClaimSourceRef" (
  "id" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TruthClaimSourceRef_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TruthClaimSourceRef_claimId_sourceRefId_key" ON "TruthClaimSourceRef"("claimId", "sourceRefId");
CREATE INDEX "TruthClaimSourceRef_sourceRefId_idx" ON "TruthClaimSourceRef"("sourceRefId");
CREATE INDEX "TruthClaim_currentValidationId_idx" ON "TruthClaim"("currentValidationId");
CREATE INDEX "ImpactAssertion_sourceRefId_idx" ON "ImpactAssertion"("sourceRefId");
CREATE INDEX "ImpactAssertion_validationId_idx" ON "ImpactAssertion"("validationId");

ALTER TABLE "TruthClaimSourceRef"
  ADD CONSTRAINT "TruthClaimSourceRef_claimId_fkey"
  FOREIGN KEY ("claimId") REFERENCES "TruthClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TruthClaimSourceRef"
  ADD CONSTRAINT "TruthClaimSourceRef_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "TruthClaimSourceRef" ("id", "claimId", "sourceRefId")
SELECT
  'r1src_' || md5(tc."id" || ':' || source_ref_id),
  tc."id",
  source_ref_id
FROM "TruthClaim" tc
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN jsonb_typeof(tc."sourceRefsJson") = 'array' THEN tc."sourceRefsJson"
    ELSE '[]'::jsonb
  END
) AS source_refs(source_ref_id)
JOIN "SourceRef" sr ON sr."id" = source_ref_id
WHERE sr."projectId" IS NULL OR sr."projectId" = tc."projectId"
ON CONFLICT ("claimId", "sourceRefId") DO NOTHING;

ALTER TABLE "TruthValidation"
  ADD CONSTRAINT "TruthValidation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TruthValidation"
  ADD CONSTRAINT "TruthValidation_evidenceId_fkey"
  FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TruthClaim"
  ADD CONSTRAINT "TruthClaim_currentValidationId_fkey"
  FOREIGN KEY ("currentValidationId") REFERENCES "TruthValidation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImpactAssertion"
  ADD CONSTRAINT "ImpactAssertion_claimId_fkey"
  FOREIGN KEY ("claimId") REFERENCES "TruthClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ImpactAssertion"
  ADD CONSTRAINT "ImpactAssertion_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ImpactAssertion"
  ADD CONSTRAINT "ImpactAssertion_validationId_fkey"
  FOREIGN KEY ("validationId") REFERENCES "TruthValidation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_sourceRefId_fkey";
ALTER TABLE "Evidence"
  ADD CONSTRAINT "Evidence_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TruthValidation" DROP CONSTRAINT "TruthValidation_sourceRefId_fkey";
ALTER TABLE "TruthValidation"
  ADD CONSTRAINT "TruthValidation_sourceRefId_fkey"
  FOREIGN KEY ("sourceRefId") REFERENCES "SourceRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
