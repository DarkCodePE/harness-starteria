import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;
const databaseUrl = process.env.PILOT_DRY_RUN_DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/starteria_pilot_dry_run?schema=public';
const backendPort = process.env.PILOT_DRY_RUN_BACKEND_PORT ?? '4200';
const frontendPort = process.env.PILOT_DRY_RUN_FRONTEND_PORT ?? '5186';
const backendHealthUrl = `http://127.0.0.1:${backendPort}/api/health`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api/v1`;
const runChecks = process.argv.includes('--checks');
const runFunctional = process.argv.includes('--functional');
const children: ChildProcess[] = [];

function dryRunEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
    PILOT_REPORT_DATABASE_URL: process.env.PILOT_REPORT_DATABASE_URL ?? databaseUrl,
    NODE_ENV: process.env.PILOT_DRY_RUN_NODE_ENV ?? 'test',
    PORT: backendPort,
    CORS_ORIGIN: frontendUrl,
    COPILOT_ENABLED: process.env.COPILOT_ENABLED ?? 'true',
    COPILOT_WRITE_ENABLED: process.env.COPILOT_WRITE_ENABLED ?? 'true',
    COPILOT_CREATE_STRATEGIC_FRONT_ENABLED: process.env.COPILOT_CREATE_STRATEGIC_FRONT_ENABLED ?? 'true',
    COPILOT_ALLOWED_ORGANIZATION_IDS: process.env.COPILOT_ALLOWED_ORGANIZATION_IDS ?? 'org-pilot-dry-run',
    COPILOT_ASSESSMENT_ADAPTER: process.env.COPILOT_ASSESSMENT_ADAPTER ?? 'deterministic',
    AUTH_RATE_LIMIT_DISABLED: process.env.AUTH_RATE_LIMIT_DISABLED ?? 'true',
    VITE_API_URL: apiBaseUrl,
    VITE_PORTFOLIO_COPILOT_ENABLED: process.env.VITE_PORTFOLIO_COPILOT_ENABLED ?? 'true',
    VITE_PORTFOLIO_LEAD_EMAIL: process.env.VITE_PORTFOLIO_LEAD_EMAIL
      ?? process.env.COPILOT_DRY_RUN_LEAD_EMAIL
      ?? 'pilot.portfolio@starteria.test',
    COPILOT_SMOKE_BASE_URL: process.env.COPILOT_SMOKE_BASE_URL ?? apiBaseUrl,
    COPILOT_SMOKE_EMAIL: process.env.COPILOT_SMOKE_EMAIL ?? 'pilot.portfolio@starteria.test',
    COPILOT_SMOKE_PASSWORD: process.env.COPILOT_SMOKE_PASSWORD ?? 'demo123',
    COPILOT_SMOKE_ORGANIZATION: process.env.COPILOT_SMOKE_ORGANIZATION ?? 'org-pilot-dry-run',
  };
}

function spawnProcess(label: string, command: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    shell: isWindows && command !== nodeCmd,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[pilot:dry-run] ${label} error:`, error);
  });
  child.on('close', (code, signal) => {
    const index = children.indexOf(child);
    if (index >= 0) children.splice(index, 1);
    if (!shuttingDown) console.log(`[pilot:dry-run] ${label} closed code=${code} signal=${signal}`);
  });
  return child;
}

let shuttingDown = false;

async function waitFor(url: string, label: string, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(1_000);
  }
  throw new Error(`${label} did not become ready at ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function runCommand(label: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCmd, args, { cwd: process.cwd(), env, stdio: 'inherit', shell: isWindows });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit ${code}`));
    });
  });
}

function waitForClose(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.off('close', onClose);
      resolve(false);
    }, timeoutMs);
    const onClose = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    child.once('close', onClose);
  });
}

async function cleanup() {
  shuttingDown = true;
  for (const child of [...children].reverse()) {
    if (!child.pid || child.killed || child.exitCode !== null || child.signalCode !== null) continue;
    if (isWindows) {
      await new Promise<void>((resolve) => {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'pipe' });
        let output = '';
        killer.stdout?.on('data', (chunk) => { output += String(chunk); });
        killer.stderr?.on('data', (chunk) => { output += String(chunk); });
        killer.on('close', (code) => {
          if (code && output.trim()) {
            console.warn(`[pilot:dry-run] taskkill pid=${child.pid} exit=${code}: ${output.trim()}`);
          }
          resolve();
        });
        killer.on('error', () => resolve());
      });
      await waitForClose(child, 2_000);
    } else {
      child.kill('SIGTERM');
      if (await waitForClose(child, 2_000)) continue;
      child.kill('SIGKILL');
    }
  }
}

async function main() {
  const env = dryRunEnv();
  console.log(`[pilot:dry-run] database=${new URL(databaseUrl).pathname.slice(1)}`);
  console.log(`[pilot:dry-run] backend=${backendHealthUrl}`);
  console.log(`[pilot:dry-run] frontend=${frontendUrl}`);

  spawnProcess('backend', nodeCmd, ['--import', 'tsx', '../backend/server.ts'], {
    ...env,
    NODE_PATH: './node_modules',
  });
  await waitFor(backendHealthUrl, 'backend');
  spawnProcess('frontend', nodeCmd, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', frontendPort], env);
  await waitFor(frontendUrl, 'frontend');

  if (runFunctional) {
    await runCommand('pilot:dry-run:functional:api', ['run', 'pilot:dry-run:functional:api'], env);
  }

  if (runChecks) {
    await runCommand('smoke:copilot', ['run', 'smoke:copilot'], env);
    await runCommand('pilot:report:preflight', ['run', 'pilot:report:preflight'], env);
    await runCommand('pilot:report', ['run', 'pilot:report', '--', '--from=2026-07-01', '--to=2026-07-31'], env);
    return;
  }

  if (runFunctional) return;

  console.log('[pilot:dry-run] Ready. Press Ctrl+C to stop.');
  await new Promise(() => undefined);
}

process.on('SIGINT', () => cleanup().finally(() => process.exit(130)));
process.on('SIGTERM', () => cleanup().finally(() => process.exit(143)));

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    if (runChecks || runFunctional) process.exit(process.exitCode ?? 0);
  });
