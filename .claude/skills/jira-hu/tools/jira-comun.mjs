// jira-comun.mjs: credenciales y llamada HTTP a Jira, en UN solo lugar.
//
// La usan jira-hu.mjs (lectura) y jira-hu-crear.mjs (escritura). Una segunda copia del login es
// una copia que se queda atrás el día que ésta cambie, y las dos siguen imprimiendo verde.
//
// Precedencia: lo exportado al entorno GANA sobre el .env. Se registra el ORIGEN de cada variable
// porque un token viejo exportado en el perfil del shell pisa al del .env y produce 401, y sin el
// origen a mano ese fallo se diagnostica a ciegas (pasó en este repo el 25-sep-2026: ~/.bashrc
// exportaba un JIRA_API_TOKEN vencido).
//
// Dónde se busca el .env, en orden: $JIRA_ENV_FILE, junto al script, y subiendo desde el cwd.
// En un worktree el .env del checkout principal no está en el camino: exportá JIRA_ENV_FILE.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VARS = ['JIRA_HOSTNAME', 'JIRA_USERNAME', 'JIRA_API_TOKEN'];
export const origenVar = {};

function leerEnv(f) {
  if (!existsSync(f)) return;
  const modo = statSync(f).mode & 0o777;
  if (modo & 0o077) console.error(`aviso: ${f} tiene permisos ${modo.toString(8)}, debería ser 600`);
  // Línea a línea en vez de `source`: un .env con una ruta sin comillas no debe romper la carga.
  for (const linea of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (m[1].startsWith('JIRA_')) origenVar[m[1]] = f;
  }
}

export function cargarEnv() {
  for (const v of VARS) if (process.env[v]) origenVar[v] = '(entorno)';
  const candidatos = [];
  if (process.env.JIRA_ENV_FILE) candidatos.push(process.env.JIRA_ENV_FILE);
  candidatos.push(join(dirname(fileURLToPath(import.meta.url)), '.env'));
  let d = process.cwd();
  for (let i = 0; i < 6; i++) {
    candidatos.push(join(d, '.env'));
    const p = dirname(d);
    if (p === d) break;
    d = p;
  }
  // Se leen todos los candidatos (no sólo hasta completar las tres): las variables opcionales
  // del equipo (JIRA_PROJECT, JIRA_FUNCIONAL_ACCOUNT_ID...) pueden vivir en el mismo .env.
  for (const f of candidatos) leerEnv(f);
  return VARS.every((v) => process.env[v]);
}

export const origenesMezclados = () => new Set(VARS.map((v) => origenVar[v]).filter(Boolean)).size > 1;

// Diagnóstico de un 401/403: NUNCA imprime valores, sólo de dónde salió cada variable.
export function explicarRechazo(status) {
  console.error(`Jira rechazó las credenciales (HTTP ${status} en /myself). NO es "no existe". Origen de cada variable:`);
  for (const v of VARS) console.error(`  ${v} <- ${origenVar[v] ?? '(sin valor)'}`);
  if (origenesMezclados()) {
    console.error(
      'las variables vienen de orígenes distintos: un valor viejo exportado en el perfil del shell\n' +
      'pisa al del .env (lo exportado gana). Quitalo del perfil o corré con `env -u JIRA_API_TOKEN ...`.'
    );
  } else {
    console.error('si el origen es único, el token está vencido: renovalo en id.atlassian.com, Security, API tokens.');
  }
}

export async function api(ruta, params = {}, { method = 'GET', body } = {}) {
  const url = new URL(`https://${process.env.JIRA_HOSTNAME}${ruta}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const auth = Buffer.from(`${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let resp;
  try {
    resp = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (e) {
    console.error(`error de red contra ${process.env.JIRA_HOSTNAME}: ${e.message}`);
    process.exit(2);
  }
  return { status: resp.status, body: resp.status === 204 ? null : await resp.json().catch(() => null) };
}
