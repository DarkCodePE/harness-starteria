import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePortfolioEntryFixtureV2, type PortfolioEntryFixtureV2 } from './schemas/fixture.schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, 'cases');

export function loadFixturesV2(): PortfolioEntryFixtureV2[] {
  const fixtures: PortfolioEntryFixtureV2[] = [];
  for (const fileName of fs.readdirSync(casesDir).filter((name) => name.endsWith('.json')).sort()) {
    const raw = JSON.parse(fs.readFileSync(path.join(casesDir, fileName), 'utf8'));
    const items = Array.isArray(raw) ? raw : [raw];
    for (const item of items) {
      if (item && typeof item === 'object' && (item as { fixture_version?: unknown }).fixture_version === '0.2') {
        fixtures.push(parsePortfolioEntryFixtureV2(item));
      }
    }
  }
  return fixtures.sort((a, b) => a.case_id.localeCompare(b.case_id));
}

export function selectFixturesV2(
  fixtures: PortfolioEntryFixtureV2[],
  options: { caseId?: string; suite?: string; type?: 'single_turn' | 'multi_turn'; maxCases?: number },
): PortfolioEntryFixtureV2[] {
  let selected = fixtures;
  if (options.caseId) selected = selected.filter((fixture) => fixture.case_id === options.caseId);
  if (options.suite) selected = selected.filter((fixture) => fixture.suite === options.suite);
  if (options.type) selected = selected.filter((fixture) => fixture.case_type === options.type);
  if (options.maxCases !== undefined) selected = selected.slice(0, options.maxCases);
  return selected;
}
