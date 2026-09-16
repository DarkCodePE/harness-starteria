-- PR-9 Portfolio Bootstrap import batches: provisional intake only.
ALTER TYPE "PortfolioBootstrapWorkItemSourceType" ADD VALUE IF NOT EXISTS 'imported_file';

CREATE TYPE "PortfolioBootstrapImportBatchStatus" AS ENUM (
  'uploaded',
  'mapping_required',
  'ready_to_import',
  'imported',
  'failed'
);

CREATE TABLE "PortfolioBootstrapImportBatch" (
  "id" TEXT NOT NULL,
  "bootstrapSessionId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "fileHash" TEXT NOT NULL,
  "status" "PortfolioBootstrapImportBatchStatus" NOT NULL DEFAULT 'uploaded',
  "rowCount" INTEGER NOT NULL,
  "sheetName" TEXT,
  "rawHeaders" JSONB NOT NULL,
  "confirmedMapping" JSONB,
  "previewRows" JSONB NOT NULL,
  "warnings" JSONB,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioBootstrapImportBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PortfolioBootstrapWorkItem"
  ADD COLUMN "importBatchId" TEXT;

CREATE UNIQUE INDEX "PortfolioBootstrapImportBatch_bootstrapSessionId_fileHash_key"
  ON "PortfolioBootstrapImportBatch"("bootstrapSessionId", "fileHash");

CREATE INDEX "PortfolioBootstrapImportBatch_bootstrapSessionId_idx"
  ON "PortfolioBootstrapImportBatch"("bootstrapSessionId");

CREATE INDEX "PortfolioBootstrapImportBatch_status_idx"
  ON "PortfolioBootstrapImportBatch"("status");

CREATE INDEX "PortfolioBootstrapImportBatch_uploadedBy_idx"
  ON "PortfolioBootstrapImportBatch"("uploadedBy");

CREATE INDEX "PortfolioBootstrapImportBatch_createdAt_idx"
  ON "PortfolioBootstrapImportBatch"("createdAt");

CREATE INDEX "PortfolioBootstrapWorkItem_importBatchId_idx"
  ON "PortfolioBootstrapWorkItem"("importBatchId");

ALTER TABLE "PortfolioBootstrapImportBatch"
  ADD CONSTRAINT "PortfolioBootstrapImportBatch_bootstrapSessionId_fkey"
  FOREIGN KEY ("bootstrapSessionId")
  REFERENCES "PortfolioBootstrapSession"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapImportBatch"
  ADD CONSTRAINT "PortfolioBootstrapImportBatch_uploadedBy_fkey"
  FOREIGN KEY ("uploadedBy")
  REFERENCES "User"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "PortfolioBootstrapWorkItem"
  ADD CONSTRAINT "PortfolioBootstrapWorkItem_importBatchId_fkey"
  FOREIGN KEY ("importBatchId")
  REFERENCES "PortfolioBootstrapImportBatch"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
