-- SF-5B: durable noncanonical prioritization application state.
ALTER TABLE "StrategicFramingProvisionalState"
ADD COLUMN "prioritizationState" JSONB;
