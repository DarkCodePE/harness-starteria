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

const targetUrl = process.env.E2E_DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/starteria_e2e';
const adminUrl = process.env.E2E_DATABASE_ADMIN_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/postgres';
const keep = process.env.E2E_KEEP_DATABASE === 'true';

async function main() {
  const dbName = keep
    ? await ensureDisposableDatabase(adminUrl, targetUrl)
    : await recreateDisposableDatabase(adminUrl, targetUrl);

  const env = { ...process.env, DATABASE_URL: targetUrl, E2E_DATABASE_URL: targetUrl };
  console.log(`[db:e2e] Target database: ${dbName}`);
  console.log('[db:e2e] Applying migrations...');
  runChecked('npx', ['prisma', 'migrate', 'deploy'], frontRoot, env);
  console.log('[db:e2e] Checking migration status...');
  runChecked('npx', ['prisma', 'migrate', 'status'], frontRoot, env);
  console.log('[db:e2e] Seeding E2E data...');
  runChecked('npx', ['tsx', 'prisma/seed.e2e.ts'], frontRoot, env);
  await verifyRequiredTables(targetUrl, [
    'User',
    'Organization',
    'StrategicFront',
    'AuditLog',
  ]);
  console.log(`[db:e2e] OK: ${parseDatabaseName(targetUrl)} is migrated and seeded.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
