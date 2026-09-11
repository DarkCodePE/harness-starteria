import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { portfolioEntryAnalysisV2Schema as runtimeAnalysisSchema } from '../../../../backend/modules/portfolio-entry-runtime/domain/analysis.schema';
import { portfolioEntryHandoffV2Schema as runtimeHandoffSchema } from '../../../../backend/modules/portfolio-entry-runtime/domain/handoff.schema';
import { PortfolioEntrySessionController as RuntimeSessionController } from '../../../../backend/modules/portfolio-entry-runtime/session/session-controller';
import { portfolioEntryAnalysisV2Schema as harnessAnalysisSchema } from '../schemas/analysis.schema';
import { portfolioEntryHandoffV2Schema as harnessHandoffSchema } from '../schemas/handoff.schema';
import { PortfolioEntrySessionController as HarnessSessionController } from '../session/portfolio-entry-session-controller';

const thisDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(thisDir, '..', '..', '..', '..');
const runtimeRoot = join(repoRoot, 'backend', 'modules', 'portfolio-entry-runtime');

const bannedImportPatterns = [
  /tests[\\/]/,
  /tests[\\/]ai-harness[\\/]/,
  /portfolio-entry-fixtures/,
  /scripted-user-responder/,
  /candidate-manifest/,
  /evaluator/,
  /reporting/,
];

describe('portfolio entry runtime extraction boundary', () => {
  it('does not import harness-only code from runtime files', () => {
    const files = listRuntimeFiles(runtimeRoot);
    const violations = files.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return extractImportSpecifiers(source)
        .filter((specifier) => bannedImportPatterns.some((pattern) => pattern.test(specifier)))
        .map((specifier) => `${relative(repoRoot, file)} -> ${specifier}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps harness schema/controller imports owned by runtime shims', () => {
    expect(harnessAnalysisSchema).toBe(runtimeAnalysisSchema);
    expect(harnessHandoffSchema).toBe(runtimeHandoffSchema);
    expect(HarnessSessionController).toBe(RuntimeSessionController);
  });
});

function listRuntimeFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return listRuntimeFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }
  return specifiers;
}
