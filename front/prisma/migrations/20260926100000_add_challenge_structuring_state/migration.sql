-- SF-6B.1: durable, noncanonical, human-confirmed ChallengeCandidate state.
ALTER TABLE "StrategicFramingProvisionalState"
ADD COLUMN "challengeStructuringState" JSONB;
