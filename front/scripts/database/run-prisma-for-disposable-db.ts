import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDatabaseName, runChecked } from './test-database-utils';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(currentDir, '../..');

const [target, ...prismaArgs] = process.argv.slice(2);
if (!target || prismaArgs.length === 0) {
  throw new Error('Usage: tsx scripts/database/run-prisma-for-disposable-db.ts e2e|pilot <prisma args...>');
}

const databaseUrl = target === 'e2e'
  ? process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:55433/starteria_e2e'
  : target === 'pilot'
    ? process.env.PILOT_DRY_RUN_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:55433/starteria_pilot_dry_run'
    : null;

if (!databaseUrl) {
  throw new Error(`Unknown disposable database target: ${target}`);
}

const dbName = parseDatabaseName(databaseUrl);
console.log(`[db:${target}] Running prisma ${prismaArgs.join(' ')} on ${dbName}`);
runChecked('npx', ['prisma', ...prismaArgs], frontRoot, {
  ...process.env,
  DATABASE_URL: databaseUrl,
});
