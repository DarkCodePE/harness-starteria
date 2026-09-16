-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "activationInputs" JSONB,
ADD COLUMN     "activationMessageDraft" TEXT,
ADD COLUMN     "activationRecommendationNote" TEXT;
