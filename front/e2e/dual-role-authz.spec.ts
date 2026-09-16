/**
 * E2E: roles múltiples — conceder una plataforma NO revoca la otra (ADR-029) — API-level, real stack.
 *
 * La regresión que motiva el ADR: la pertenencia se decidía con un ESCALAR `User.role`.
 * Un escalar no expresa pertenencia a dos conjuntos, así que dar `portfolio_lead` a
 * alguien le quitaba `participante` — "le damos acceso a una plataforma y pierde en otra".
 * En el front el síntoma era el redirect-cárcel de AppLayout.tsx:55; en el servidor es
 * esto: el usuario perdía `project:own` al ganar `portfolio:write`.
 *
 * Esta spec verifica la cadena completa contra el stack real, usando el endpoint de
 * administración REAL (PBA-08) en vez de sembrar el usuario ya con dos roles:
 *   1. Un participante recién registrado NO puede escribir en el portafolio (403).
 *   2. El admin le concede el CONJUNTO ['participante','portfolio_lead'].
 *   3. Su nuevo JWT lleva los DOS roles (no un escalar sobrescrito).
 *   4. Ahora SÍ puede escribir en el portafolio: frente → reto.
 *   5. Y CONSERVA su workspace: sigue pudiendo crear un proyecto (project:own).
 *      Este es el assert que habría fallado antes del ADR: es la pérdida silenciosa.
 *
 * Usa los usuarios del seed e2e; el admin es E2E_ADMIN_EMAIL
 * (`portfolio-admin.e2e@starteria.test`), sembrado con `Role.admin`.
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'portfolio-admin.e2e@starteria.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD || 'demo123';

/** Lee los claims del JWT sin verificarlo: es lo que ADR-029 hace viajar. */
function jwtClaims(token: string): { role?: string; roles?: string[] } {
  const part = token.split('.')[1];
  const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json);
}

function extractToken(body: any): string {
  return (
    body?.data?.tokens?.accessToken ??
    body?.data?.accessToken ??
    body?.tokens?.accessToken ??
    body?.accessToken ??
    ''
  );
}

async function login(api: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(res.status(), `login ${email}: ${await res.text()}`).toBe(200);
  const token = extractToken(await res.json());
  expect(token, `sin access token para ${email}`).toBeTruthy();
  return token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('roles múltiples: sumar un rol nunca quita el otro (ADR-029, real stack)', () => {
  let api: APIRequestContext;
  let adminToken: string;

  // El participante de esta spec, creado una vez y promovido a doble rol.
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-dual-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  let userId = '';
  let dualToken = '';

  test.beforeAll(async () => {
    api = await pwRequest.newContext({ baseURL: BASE });
    adminToken = await login(api, ADMIN_EMAIL, ADMIN_PASSWORD);

    const reg = await api.post('/api/v1/auth/register', {
      data: { email, password, name: `E2E dual ${stamp}`, role: 'participante' },
      failOnStatusCode: false,
    });
    expect([200, 201, 409], `register ${email}: ${reg.status()}`).toContain(reg.status());

    // El id se toma del padrón de admin (PBA-08), no del cuerpo del register:
    // así la spec no depende de la forma de esa respuesta.
    const list = await api.get('/api/v1/users', { headers: auth(adminToken), failOnStatusCode: false });
    expect(list.status(), `listar usuarios: ${await list.text()}`).toBe(200);
    const users = (await list.json())?.data ?? [];
    userId = users.find((u: any) => u.email === email)?.id ?? '';
    expect(userId, `no se encontró ${email} en el padrón de admin`).toBeTruthy();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('antes de la concesión, el participante NO puede escribir en el portafolio', async () => {
    const token = await login(api, email, password);
    const res = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(token),
      data: { name: `Frente prohibido ${stamp}`, description: 'No debería existir' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });

  test('el admin concede el CONJUNTO y el JWT lleva los dos roles', async () => {
    const patch = await api.patch(`/api/v1/users/${userId}/role`, {
      headers: auth(adminToken),
      data: { roles: ['participante', 'portfolio_lead'] },
      failOnStatusCode: false,
    });
    expect(patch.status(), `conceder roles: ${await patch.text()}`).toBeLessThan(300);

    // Token NUEVO: el anterior se emitió antes de la concesión.
    dualToken = await login(api, email, password);
    const claims = jwtClaims(dualToken);
    expect(claims.roles, 'el JWT no lleva el conjunto de roles').toEqual(
      expect.arrayContaining(['participante', 'portfolio_lead']),
    );
  });

  test('con los dos roles GANA el portafolio: frente → reto', async () => {
    const front = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(dualToken),
      data: { name: `Frente dual ${stamp}`, description: 'Creado por el usuario de doble rol' },
      failOnStatusCode: false,
    });
    expect(front.status(), `crear frente: ${await front.text()}`).toBeLessThan(300);

    const frontBody = await front.json();
    const frontId = frontBody?.data?.id ?? frontBody?.id;
    expect(frontId, 'el frente creado no trae id').toBeTruthy();

    const challenge = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(dualToken),
      data: { title: `Reto dual ${stamp}`, description: 'Reto creado por el usuario de doble rol' },
      failOnStatusCode: false,
    });
    expect(challenge.status(), `crear reto: ${await challenge.text()}`).toBeLessThan(300);
  });

  test('y NO pierde su workspace: sigue pudiendo crear un proyecto', async () => {
    // El assert de la regresión. Antes de ADR-029 el escalar `role` había pasado a
    // `portfolio_lead` y esta llamada respondía 403: ganar una plataforma costaba la otra.
    const res = await api.post('/api/v1/projects', {
      headers: auth(dualToken),
      data: { name: `Iniciativa dual ${stamp}`, description: 'El participante conserva su workspace' },
      failOnStatusCode: false,
    });
    expect(res.status(), `crear proyecto con doble rol: ${await res.text()}`).toBeLessThan(300);
  });
});
