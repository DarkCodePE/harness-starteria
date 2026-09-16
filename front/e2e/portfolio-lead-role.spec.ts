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

  // MVP-P0-02: la autoría de la activación (los 9 ejes, la nota y el borrador) se editaba
  // en /portfolio y se PERDÍA al recargar, porque no existía columna donde guardarla. Esta
  // prueba es la versión de contrato de "sobrevive a una recarga": se escribe con PATCH y
  // se vuelve a LEER en una petición nueva, que es lo que hace el navegador al recargar.
  test('la autoría de la activación del reto sobrevive a una lectura nueva', async () => {
    const stamp = Date.now();
    const front = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(leadToken),
      data: { name: `Frente activacion ${stamp}` },
      failOnStatusCode: false,
    });
    expect(front.status(), `crear frente: ${await front.text()}`).toBeLessThan(300);
    const frontId = (await front.json())?.data?.id;

    const challenge = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(leadToken),
      data: { title: `Reto activacion ${stamp}` },
      failOnStatusCode: false,
    });
    expect(challenge.status(), `crear reto: ${await challenge.text()}`).toBeLessThan(300);
    const challengeId = (await challenge.json())?.data?.id;

    const activationInputs = {
      urgency: 'alta',
      timeAvailable: 'acotado',
      estimatedEffort: 'medio',
      challengeClarity: 'baja',
      informationSensitivity: 'alta',
      internalCapacity: 'media',
      technicalNeed: 'alta',
      sponsorStatus: 'confirmado',
      dependency: 'legal',
    };
    const patch = await api.patch(`/api/v1/portfolio/challenges/${challengeId}`, {
      headers: auth(leadToken),
      data: {
        activationInputs,
        activationRecommendationNote: `Squad asignado ${stamp}`,
        activationMessageDraft: `Equipo, abrimos el reto ${stamp}`,
      },
      failOnStatusCode: false,
    });
    expect(patch.status(), `guardar activacion: ${await patch.text()}`).toBeLessThan(300);

    // Lectura NUEVA: es aquí donde antes reaparecían los defaults.
    const reread = await api.get(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(leadToken),
      failOnStatusCode: false,
    });
    expect(reread.status()).toBe(200);
    const saved = ((await reread.json())?.data ?? []).find((c: any) => c.id === challengeId);
    expect(saved, 'el reto no volvio en la lectura').toBeTruthy();
    expect(saved.activationInputs).toEqual(activationInputs);
    expect(saved.activationRecommendationNote).toBe(`Squad asignado ${stamp}`);
    expect(saved.activationMessageDraft).toBe(`Equipo, abrimos el reto ${stamp}`);
  });

  test('un activationInputs incompleto es rechazado en el borde', async () => {
    // La columna es Json y Postgres no la valida: si zod se relajara, el front acabaría
    // leyendo un objeto sin ejes y pintando selects vacíos sin que nada hubiera fallado.
    const front = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(leadToken),
      data: { name: `Frente validacion ${Date.now()}` },
      failOnStatusCode: false,
    });
    const frontId = (await front.json())?.data?.id;
    const challenge = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(leadToken),
      data: { title: `Reto validacion ${Date.now()}` },
      failOnStatusCode: false,
    });
    const challengeId = (await challenge.json())?.data?.id;

    const bad = await api.patch(`/api/v1/portfolio/challenges/${challengeId}`, {
      headers: auth(leadToken),
      data: { activationInputs: { urgency: 'alta' } },
      failOnStatusCode: false,
    });
    expect(bad.status()).toBe(400);
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
