import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(currentDir, '..');
const repoRoot = path.resolve(frontRoot, '..');
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const dockerCmd = isWindows ? 'docker.exe' : 'docker';

const backendPort = Number(process.env.E2E_BACKEND_PORT || process.env.PORT || 4100);
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 5176);
const e2ePostgresPort = Number(process.env.E2E_POSTGRES_PORT || 55433);
const frontendHost = process.env.E2E_FRONTEND_HOST || '127.0.0.1';
const backendHost = process.env.E2E_BACKEND_HOST || '127.0.0.1';
const baseURL = process.env.E2E_BASE_URL || `http://${frontendHost}:${frontendPort}`;
const backendHealthURL = process.env.E2E_BACKEND_HEALTH_URL || `http://${backendHost}:${backendPort}/api/health`;
const databaseURL =
  process.env.E2E_DATABASE_URL || `postgresql://postgres:postgres@localhost:${e2ePostgresPort}/starteria_e2e`;
const adminDatabaseURL =
  process.env.E2E_DATABASE_ADMIN_URL || `postgresql://postgres:postgres@localhost:${e2ePostgresPort}/postgres`;

const children: ChildProcess[] = [];
let shuttingDown = false;

function runChecked(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: isWindows,
  });
  if (result.status !== 0) {
    const detail = result.error instanceof Error ? `: ${result.error.message}` : '';
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status ?? 'unknown'}${detail}`);
  }
}

function start(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: isWindows,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[E2E] ${command} ${args.join(' ')} failed to start: ${error.message}`);
  });
  child.on('close', (code, signal) => {
    if (!shuttingDown && code !== null && code !== 0) {
      console.error(`[E2E] ${command} ${args.join(' ')} closed with ${code}`);
    }
    if (!shuttingDown && signal) console.error(`[E2E] ${command} ${args.join(' ')} closed by ${signal}`);
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== null && code !== 0) {
      console.error(`[E2E] ${command} ${args.join(' ')} exited with ${code}`);
    }
    if (!shuttingDown && signal) console.error(`[E2E] ${command} ${args.join(' ')} stopped by ${signal}`);
  });
  return child;
}

function parsePostgresHostPort(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  return { host: parsed.hostname || '127.0.0.1', port: Number(parsed.port || 5432) };
}

async function waitForTcp(host: string, port: number, label: string, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    const connected = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host, port });
      socket.setTimeout(1000);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('timeout', () => {
        lastError = 'connection timed out';
        socket.destroy();
        resolve(false);
      });
      socket.once('error', (error) => {
        lastError = error.message;
        resolve(false);
      });
    });
    if (connected) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} did not become available at ${host}:${port}: ${lastError}`);
}

async function waitForURL(url: string, label: string, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} did not become available at ${url}: ${lastError}`);
}

async function stopChildren() {
  shuttingDown = true;
  for (const child of children.reverse()) {
    if (child.killed || child.exitCode !== null || !child.pid) continue;
    if (isWindows) {
      spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
  for (const child of children) {
    if (!child.killed && child.exitCode === null) child.kill('SIGKILL');
  }
}

function stopDocker(env: NodeJS.ProcessEnv) {
  if (process.env.E2E_SKIP_DOCKER === 'true' || process.env.E2E_KEEP_DOCKER === 'true') return;
  runChecked(dockerCmd, ['compose', '-f', 'docker-compose.e2e.yml', '-p', 'starteria-e2e', 'down'], repoRoot, env);
}

async function main() {
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'test',
    DATABASE_URL: databaseURL,
    E2E_DATABASE_URL: databaseURL,
    E2E_DATABASE_ADMIN_URL: adminDatabaseURL,
    E2E_USER_EMAIL: process.env.E2E_USER_EMAIL || 'portfolio.e2e@starteria.test',
    E2E_USER_PASSWORD: process.env.E2E_USER_PASSWORD || 'demo123',
    E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD || 'demo123',
    E2E_UNAUTHORIZED_USER_EMAIL: process.env.E2E_UNAUTHORIZED_USER_EMAIL || 'viewer.e2e@starteria.test',
    E2E_UNAUTHORIZED_USER_PASSWORD: process.env.E2E_UNAUTHORIZED_USER_PASSWORD || 'demo123',
    JWT_SECRET: process.env.JWT_SECRET || 'e2e-dev-secret-do-not-use-in-prod',
    AUTH_DISABLE_WAITLIST: process.env.AUTH_DISABLE_WAITLIST || 'true',
    AUTH_RATE_LIMIT_DISABLED: process.env.AUTH_RATE_LIMIT_DISABLED || 'true',
    PORT: String(backendPort),
    NODE_PATH: process.env.NODE_PATH || path.join(frontRoot, 'node_modules'),
    CORS_ORIGIN: process.env.CORS_ORIGIN || baseURL,
    VITE_API_URL: process.env.VITE_API_URL || '/api/v1',
    VITE_BACKEND_PROXY_TARGET: process.env.VITE_BACKEND_PROXY_TARGET || `http://${backendHost}:${backendPort}`,
    VITE_FEATURE_PDF_AUTOFILL: process.env.VITE_FEATURE_PDF_AUTOFILL || 'true',
    VITE_ENABLE_INITIAL_REVIEW: process.env.VITE_ENABLE_INITIAL_REVIEW || 'true',
    E2E_BASE_URL: baseURL,
    E2E_API_URL: process.env.E2E_API_URL || '',
    LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR || path.join(repoRoot, 'storage', 'e2e'),
    INITIAL_REVIEW_AI: process.env.INITIAL_REVIEW_AI || '',
    PDF_EXTRACTION_E2E_MODE: process.env.PDF_EXTRACTION_E2E_MODE || 'terminal-failed',
  };

  fs.mkdirSync(env.LOCAL_STORAGE_DIR, { recursive: true });

  if (process.env.E2E_SKIP_DOCKER !== 'true') {
    console.log('[E2E] Start isolated postgres via docker compose');
    runChecked(dockerCmd, ['compose', '-f', 'docker-compose.e2e.yml', '-p', 'starteria-e2e', 'up', '-d', 'postgres'], repoRoot, env);
  } else {
    console.log('[E2E] E2E_SKIP_DOCKER=true; using existing E2E_DATABASE_URL');
  }
  const postgresTarget = parsePostgresHostPort(adminDatabaseURL);
  console.log(`[E2E] Wait for PostgreSQL at ${postgresTarget.host}:${postgresTarget.port}`);
  await waitForTcp(postgresTarget.host, postgresTarget.port, 'postgres');

  console.log('[E2E] Provision database');
  runChecked(npmCmd, ['run', 'db:e2e:provision'], frontRoot, env);

  console.log(`[E2E] Start backend on ${backendHealthURL}`);
  start(npxCmd, ['tsx', '../backend/server.ts'], frontRoot, env);
  await waitForURL(backendHealthURL, 'backend');

  console.log(`[E2E] Start frontend on ${baseURL}`);
  start(npxCmd, ['vite', '--host', frontendHost, '--port', String(frontendPort), '--strictPort'], frontRoot, env);
  await waitForURL(baseURL, 'frontend');

  console.log('[E2E] Run Playwright');
  runChecked(npxCmd, ['playwright', 'test', ...process.argv.slice(2)], frontRoot, env);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopChildren();
    const cleanupEnv = {
      ...process.env,
      E2E_POSTGRES_PORT: String(e2ePostgresPort),
    };
    try {
      stopDocker(cleanupEnv);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  });
