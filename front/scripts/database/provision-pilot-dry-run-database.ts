import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureDisposableDatabase,
  parseDatabaseName,
  recreateDisposableDatabase,
  runChecked,
  verifyRequiredTables,
} from './test-database-utils';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(currentDir, '../..');

const targetUrl = process.env.PILOT_DRY_RUN_DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/starteria_pilot_dry_run';
const adminUrl = process.env.E2E_DATABASE_ADMIN_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/postgres';
const keep = process.env.E2E_KEEP_DATABASE === 'true';

async function main() {
  const dbName = keep
    ? await ensureDisposableDatabase(adminUrl, targetUrl)
    : await recreateDisposableDatabase(adminUrl, targetUrl);

  const env = { ...process.env, DATABASE_URL: targetUrl, PILOT_DRY_RUN_DATABASE_URL: targetUrl };
  console.log(`[db:pilot] Target database: ${dbName}`);
  console.log('[db:pilot] Applying migrations...');
  runChecked('npx', ['prisma', 'migrate', 'deploy'], frontRoot, env);
  console.log('[db:pilot] Checking migration status...');
  runChecked('npx', ['prisma', 'migrate', 'status'], frontRoot, env);
  console.log('[db:pilot] Seeding pilot dry run data...');
  runChecked('npx', ['tsx', 'prisma/seed.pilot-dry-run.ts'], frontRoot, env);
  await verifyRequiredTables(targetUrl, [
    'User',
    'Organization',
    'StrategicFront',
    'CopilotConversation',
    'ActionExecution',
    'AuditLog',
  ]);
  console.log(`[db:pilot] OK: ${parseDatabaseName(targetUrl)} is migrated and seeded.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
