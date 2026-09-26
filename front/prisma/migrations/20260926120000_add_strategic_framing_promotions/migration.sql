-- SF-6C: one atomic canonical Challenge promotion trace per ChallengeCandidate.
CREATE TYPE "StrategicFramingPromotionStatus" AS ENUM ('completed', 'requires_review');

CREATE TABLE "StrategicFramingPromotion" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "challengeCandidateId" TEXT NOT NULL,
    "sourceStateVersion" INTEGER NOT NULL,
    "sourceCandidateIds" JSONB NOT NULL,
    "structuralRecommendationRef" TEXT,
    "structuralRecommendationVersion" TEXT,
    "strategicFrontId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorSnapshot" JSONB NOT NULL,
    "promotedAt" TIMESTAMP(3) NOT NULL,
    "candidateSnapshot" JSONB NOT NULL,
    "confirmedChallengeSnapshot" JSONB NOT NULL,
    "sourceRefs" JSONB NOT NULL,
    "provenance" JSONB NOT NULL,
    "status" "StrategicFramingPromotionStatus" NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicFramingPromotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StrategicFramingPromotion_challengeId_key" ON "StrategicFramingPromotion"("challengeId");
CREATE UNIQUE INDEX "StrategicFramingPromotion_stateId_challengeCandidateId_key" ON "StrategicFramingPromotion"("stateId", "challengeCandidateId");
CREATE INDEX "StrategicFramingPromotion_stateId_idx" ON "StrategicFramingPromotion"("stateId");
CREATE INDEX "StrategicFramingPromotion_strategicFrontId_idx" ON "StrategicFramingPromotion"("strategicFrontId");
CREATE INDEX "StrategicFramingPromotion_actorUserId_idx" ON "StrategicFramingPromotion"("actorUserId");
CREATE INDEX "StrategicFramingPromotion_promotedAt_idx" ON "StrategicFramingPromotion"("promotedAt");
CREATE INDEX "StrategicFramingPromotion_sourceStateVersion_idx" ON "StrategicFramingPromotion"("sourceStateVersion");

ALTER TABLE "StrategicFramingPromotion"
  ADD CONSTRAINT "StrategicFramingPromotion_stateId_fkey"
  FOREIGN KEY ("stateId") REFERENCES "StrategicFramingProvisionalState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
