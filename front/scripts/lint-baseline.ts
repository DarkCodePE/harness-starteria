import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..', '..');
const frontRoot = path.resolve(currentDir, '..');

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const allowedAiBridgeFiles = new Set([
  path.normalize('backend/modules/ai/bridge.service.ts'),
  path.normalize('backend/modules/ai/ai.proxy.ts'),
]);

function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage' || entry.name === 'test-results') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

const failures: string[] = [];

for (const file of [...walk(path.join(repoRoot, 'backend')), ...walk(path.join(frontRoot, 'src')), ...walk(path.join(frontRoot, 'e2e'))]) {
  const rel = path.relative(repoRoot, file);
  const normalizedRel = path.normalize(rel);
  const text = fs.readFileSync(file, 'utf8');

  if (/\b(?:test|it|describe)\.only\s*\(/.test(text) || /\b(?:fit|fdescribe)\s*\(/.test(text)) {
    failures.push(`${rel}: focused test marker found`);
  }

  if (
    normalizedRel.startsWith(path.normalize('backend/modules')) &&
    !allowedAiBridgeFiles.has(normalizedRel) &&
    /(AI_SERVICE_URL|localhost:8001|ai-service:8001)/.test(text)
  ) {
    failures.push(`${rel}: direct ai-service reference found; use backend/modules/ai/bridge.service.ts`);
  }
}

if (failures.length > 0) {
  console.error('Baseline lint failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Baseline lint passed.');
