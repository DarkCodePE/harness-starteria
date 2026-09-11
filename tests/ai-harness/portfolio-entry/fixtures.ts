import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureSchema, type Fixture } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, 'cases');

export function loadFixtures(): Fixture[] {
  const fixtures: Fixture[] = [];
  // Keep the v0.1 loader pinned to its historical corpus. v0.2 fixtures are
  // loaded through fixtures-v0.2.ts and must not cross the legacy boundary.
  for (const fileName of fs.readdirSync(casesDir).filter((name) => name === 'portfolio-entry-fixtures.json').sort()) {
    const raw = JSON.parse(fs.readFileSync(path.join(casesDir, fileName), 'utf8'));
    const items = Array.isArray(raw) ? raw : [raw];
    for (const item of items) {
      fixtures.push(fixtureSchema.parse(item));
    }
  }
  return fixtures.sort((a, b) => a.case_id.localeCompare(b.case_id));
}

export function selectFixtures(fixtures: Fixture[], options: { caseId?: string; suite?: string }): Fixture[] {
  if (options.caseId) {
    return fixtures.filter((fixture) => fixture.case_id === options.caseId);
  }
  if (options.suite) {
    const suite = options.suite.toUpperCase();
    return fixtures.filter((fixture) => fixture.suite === suite);
  }
  return fixtures;
}
