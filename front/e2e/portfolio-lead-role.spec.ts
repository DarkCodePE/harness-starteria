/**
 * E2E: `portfolio_lead` autoriza en el servidor (ADR-028) — API-level, real stack.
 *
 * Antes de ADR-028 el rol se sintetizaba en el FRONT comparando el correo del usuario.
 * El JWT decía `viewer`, así que la UI dejaba entrar al portfolio lead a /portfolio y
 * el backend le devolvía 403 en las 19 rutas de escritura de su propia sección.
 *
 * Esta spec verifica la cadena completa contra el stack real:
 *   1. El portfolio lead sembrado obtiene un JWT cuyo claim `role` es `portfolio_lead`
 *      (antes: `mentor`/`viewer`).
 *   2. Con ese token PUEDE escribir: crea un frente estratégico y un reto (2xx).
 *   3. Un participante recién registrado NO puede escribir en el portafolio (403).
 *   4. Las lecturas siguen abiertas a cualquier autenticado — deuda declarada en el
 *      scope_out de la feature, fijada aquí para que cerrarla sea explícito.
 *
 * Usa el usuario del seed e2e (E2E_USER_EMAIL, `portfolio.e2e@starteria.test`), que
 * `prisma/seed.e2e.ts` siembra con `Role.portfolio_lead`. NO usa `admin@starteria.io`:
 * ese lo siembra el seed de DESARROLLO y no existe en el stack e2e aislado.
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const PORTFOLIO_LEAD_EMAIL = process.env.E2E_USER_EMAIL || 'portfolio.e2e@starteria.test';
const PORTFOLIO_LEAD_PASSWORD = process.env.E2E_USER_PASSWORD || 'demo123';

/** Lee el claim `role` del JWT sin verificarlo: es lo que ADR-028 hace viajar. */
function jwtRole(token: string): string {
  const part = token.split('.')[1];
  const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return (JSON.parse(json) as { role?: string }).role ?? '';
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

async function registerParticipant(api: APIRequestContext): Promise<string> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-plrole-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E participante ${stamp}`, role: 'participante' },
    failOnStatusCode: false,
  });
  expect([200, 201, 409], `register ${email}: ${reg.status()}`).toContain(reg.status());
  return login(api, email, password);
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('portfolio_lead autoriza en el servidor (ADR-028, real stack)', () => {
  let api: APIRequestContext;
  let leadToken: string;

  test.beforeAll(async () => {
    api = await pwRequest.newContext({ baseURL: BASE });
    leadToken = await login(api, PORTFOLIO_LEAD_EMAIL, PORTFOLIO_LEAD_PASSWORD);
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('el JWT del portfolio lead lleva role=portfolio_lead', async () => {
    // La aserción raíz: si esto falla, todo lo demás es teatro del front.
    expect(jwtRole(leadToken)).toBe('portfolio_lead');
  });

  test('con ese token PUEDE escribir en el portafolio: frente → reto', async () => {
    const stamp = Date.now();

    const front = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(leadToken),
      data: { name: `Frente ADR-028 ${stamp}`, description: 'Creado por el portfolio lead en e2e' },
      failOnStatusCode: false,
    });
    expect(front.status(), `crear frente: ${await front.text()}`).toBeLessThan(300);

    const frontBody = await front.json();
    const frontId = frontBody?.data?.id ?? frontBody?.id;
    expect(frontId, 'el frente creado no trae id').toBeTruthy();

    const challenge = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(leadToken),
      data: { title: `Reto ADR-028 ${stamp}`, description: 'Reto creado por el portfolio lead en e2e' },
      failOnStatusCode: false,
    });
    expect(challenge.status(), `crear reto: ${await challenge.text()}`).toBeLessThan(300);
  });

  test('un participante NO puede escribir en el portafolio', async () => {
    const participantToken = await registerParticipant(api);

    const res = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(participantToken),
      data: { name: `Frente prohibido ${Date.now()}`, description: 'No debería existir' },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(403);
  });

  test('las lecturas siguen abiertas a cualquier autenticado', async () => {
    // Deuda declarada: AppLayout consulta portafolio para TODO usuario autenticado.
    const participantToken = await registerParticipant(api);

    const res = await api.get('/api/v1/portfolio/strategic-fronts', {
      headers: auth(participantToken),
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
  });
});
