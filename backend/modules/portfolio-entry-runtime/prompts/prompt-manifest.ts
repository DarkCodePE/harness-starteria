import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const promptsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'v0.2');
const manifestSchema = z.object({
  prompt_version: z.literal('0.2'),
  files: z.object({ agent: z.string(), skill_01: z.string(), skill_02: z.string(), skill_03: z.string(), skill_04: z.string(), handoff: z.string() }).strict(),
}).strict();
export type ResolvedPromptManifest = z.infer<typeof manifestSchema> & { file_hashes: Record<string, string>; prompt_manifest_hash: string };

export function loadResolvedPromptManifest(): ResolvedPromptManifest {
  const manifest = manifestSchema.parse(JSON.parse(fs.readFileSync(path.join(promptsRoot, 'manifest.json'), 'utf8')));
  const fileHashes = Object.fromEntries(Object.values(manifest.files).map((file) => [file, hash(fs.readFileSync(path.join(promptsRoot, file), 'utf8'))]));
  return { ...manifest, file_hashes: fileHashes, prompt_manifest_hash: hash(JSON.stringify({ manifest, file_hashes: fileHashes })) };
}

export function composeAnalysisSystemPrompt(manifest: ResolvedPromptManifest): string {
  return [manifest.files.agent, manifest.files.skill_01, manifest.files.skill_02, manifest.files.skill_03, manifest.files.skill_04].map(read).join('\n\n---\n\n');
}

export function composeHandoffSystemPrompt(manifest: ResolvedPromptManifest): string {
  return [manifest.files.agent, manifest.files.handoff].map(read).join('\n\n---\n\n');
}

function read(file: string): string { return fs.readFileSync(path.join(promptsRoot, file), 'utf8'); }
function hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
