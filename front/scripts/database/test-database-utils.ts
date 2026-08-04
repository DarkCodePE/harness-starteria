import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

export const PROTECTED_DATABASES = new Set(['postgres', 'template0', 'template1', 'starteria_db']);
export const ALLOWED_DISPOSABLE_DATABASES = new Set(['starteria_e2e', 'starteria_pilot_dry_run']);

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

export function parseDatabaseName(databaseUrl: string): string {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('Invalid database URL.');
  }
  const name = url.pathname.replace(/^\//, '');
  if (!name) throw new Error('Database URL must include a database name.');
  return name;
}

export function assertDisposableDatabaseName(name: string): void {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
  if (PROTECTED_DATABASES.has(name)) {
    throw new Error(`Refusing to operate on protected database: ${name}`);
  }
  if (!ALLOWED_DISPOSABLE_DATABASES.has(name)) {
    throw new Error(`Refusing to operate on non-disposable database: ${name}`);
  }
}

function quoteIdentifier(name: string): string {
  assertDisposableDatabaseName(name);
  return `"${name}"`;
}

export async function recreateDisposableDatabase(adminUrl: string, targetUrl: string): Promise<string> {
  const targetName = parseDatabaseName(targetUrl);
  const adminName = parseDatabaseName(adminUrl);
  assertDisposableDatabaseName(targetName);
  if (targetName === adminName) {
    throw new Error('Admin URL must point to a different database than target URL.');
  }

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    await admin.$executeRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      targetName,
    );
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${quoteIdentifier(targetName)}`);
    await admin.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(targetName)}`);
  } finally {
    await admin.$disconnect();
  }
  return targetName;
}

export async function ensureDisposableDatabase(adminUrl: string, targetUrl: string): Promise<string> {
  const targetName = parseDatabaseName(targetUrl);
  const adminName = parseDatabaseName(adminUrl);
  assertDisposableDatabaseName(targetName);
  if (targetName === adminName) {
    throw new Error('Admin URL must point to a different database than target URL.');
  }

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const existing = await admin.$queryRawUnsafe<Array<{ datname: string }>>(
      'SELECT datname FROM pg_database WHERE datname = $1',
      targetName,
    );
    if (existing.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(targetName)}`);
    }
  } finally {
    await admin.$disconnect();
  }
  return targetName;
}

export function runChecked(command: 'npm' | 'npx', args: string[], cwd: string, env: NodeJS.ProcessEnv): void {
  const bin = command === 'npm' ? npmCmd : npxCmd;
  const result = spawnSync(bin, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: isWindows,
  });
  if (result.status !== 0) {
    const detail = result.error instanceof Error ? `: ${result.error.message}` : '';
    throw new Error(`${bin} ${args.join(' ')} failed with exit ${result.status ?? 'unknown'}${detail}`);
  }
}

export async function verifyRequiredTables(databaseUrl: string, tables: string[]): Promise<void> {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const existing = new Set(rows.map((row) => row.table_name));
    const missing = tables.filter((table) => !existing.has(table));
    if (missing.length > 0) {
      throw new Error(`Database is missing required tables: ${missing.join(', ')}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
