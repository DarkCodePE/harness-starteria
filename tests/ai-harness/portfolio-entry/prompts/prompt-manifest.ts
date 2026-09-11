import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptsRoot = path.join(__dirname, 'v0.2');

export const promptManifestFileSchema = z.object({
  prompt_version: z.literal('0.2'),
  files: z.object({
    agent: z.string(),
    skill_01: z.string(),
    skill_02: z.string(),
    skill_03: z.string(),
    skill_04: z.string(),
    handoff: z.string(),
  }).strict(),
}).strict();

export const resolvedPromptManifestSchema = promptManifestFileSchema.extend({
  file_hashes: z.record(z.string()),
  prompt_manifest_hash: z.string(),
}).strict();

export type PromptManifestFile = z.infer<typeof promptManifestFileSchema>;
export type ResolvedPromptManifest = z.infer<typeof resolvedPromptManifestSchema>;

export function loadResolvedPromptManifest(): ResolvedPromptManifest {
  const manifestPath = path.join(promptsRoot, 'manifest.json');
  const manifest = promptManifestFileSchema.parse(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
  const fileHashes = Object.fromEntries(Object.values(manifest.files).map((fileName) => [
    fileName,
    hashText(fs.readFileSync(path.join(promptsRoot, fileName), 'utf8')),
  ]));
  const resolved = {
    ...manifest,
    file_hashes: fileHashes,
    prompt_manifest_hash: hashText(JSON.stringify({ manifest, file_hashes: fileHashes })),
  };
  return resolvedPromptManifestSchema.parse(resolved);
}

export function composeAnalysisSystemPrompt(manifest: ResolvedPromptManifest): string {
  return [
    readPromptFile(manifest.files.agent),
    readPromptFile(manifest.files.skill_01),
    readPromptFile(manifest.files.skill_02),
    readPromptFile(manifest.files.skill_03),
    readPromptFile(manifest.files.skill_04),
  ].join('\n\n---\n\n');
}

export function composeHandoffSystemPrompt(manifest: ResolvedPromptManifest): string {
  return [
    readPromptFile(manifest.files.agent),
    readPromptFile(manifest.files.handoff),
  ].join('\n\n---\n\n');
}

function readPromptFile(fileName: string): string {
  return fs.readFileSync(path.join(promptsRoot, fileName), 'utf8');
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
