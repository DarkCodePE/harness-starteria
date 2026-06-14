/**
 * E2E: reto-scoped team model (ADR-023 #111 + ADR-024 #114) — API-level, real stack.
 *
 * Validates end-to-end against the docker compose stack (postgres + backend) that:
 *   1. A reto's unified team (ChallengeTeamMember) is created/listed (#109).
 *   2. Creating an iniciativa from that reto MATERIALIZES the reto's team members (real
 *      Users) into the iniciativa's team as inheritedFromChallenge=true, deduping the
 *      owner (#111) — resolved via GET /portfolio/initiatives/:projectId/team (#110).
 *   3. Initiative tracking-field edits persist via PUT .../meta, and client-sent DERIVED
 *      team-cache fields are ignored (#113/#114).
 *
 * Requires: docker compose up + `prisma db push` + `prisma db seed` (seeds admin@starteria.io).
 *   docker compose up -d && npm run db:push && npm run db:seed && npm run test:e2e -- team-inheritance
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';

/** Decode the `sub` (user id) claim from a JWT without verifying it. */
function jwtSub(token: string): string {
  const part = token.split('.')[1];
  const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const payload = JSON.parse(json) as { sub?: string; userId?: string; id?: string };
  return payload.sub ?? payload.userId ?? payload.id ?? '';
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

async function login(api: APIRequestContext, email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(res.status(), `login ${email}: ${await res.text()}`).toBe(200);
  const token = extractToken(await res.json());
  expect(token, `no access token for ${email}`).toBeTruthy();
  return { token, userId: jwtSub(token) };
}

async function registerAndLogin(api: APIRequestContext, tag: string): Promise<{ token: string; userId: string; email: string }> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-team-${tag}-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E ${tag} ${stamp}`, role: 'participante' },
    failOnStatusCode: false,
  });
  expect([200, 201, 409], `register ${email}: ${reg.status()}`).toContain(reg.status());
  const { token, userId } = await login(api, email, password);
  return { token, userId, email };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('ADR-023/024 reto-scoped team (real stack)', () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await pwRequest.newContext({ baseURL: BASE });
  });
  test.afterAll(async () => {
    await api.dispose();
  });

  test('reto team materializes into the iniciativa on create (#109/#110/#111)', async () => {
    const admin = await login(api, 'admin@starteria.io', 'demo123');
    const creator = await registerAndLogin(api, 'creator');
    const member = await registerAndLogin(api, 'member');

    // Admin builds the frente → reto.
    const stamp = Date.now();
    const fRes = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(admin.token),
      data: { name: `E2E Frente ${stamp}` },
      failOnStatusCode: false,
    });
    expect(fRes.ok(), `create front: ${await fRes.text()}`).toBeTruthy();
    const frontId = (await fRes.json()).data.id as string;

    const cRes = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(admin.token),
      data: { title: `E2E Reto ${stamp}` },
      failOnStatusCode: false,
    });
    expect(cRes.ok(), `create reto: ${await cRes.text()}`).toBeTruthy();
    const challengeId = (await cRes.json()).data.id as string;

    // Admin assigns the member to the reto's unified team (#109).
    const tRes = await api.post(`/api/v1/portfolio/challenges/${challengeId}/team`, {
      headers: auth(admin.token),
      data: { userId: member.userId, role: 'EDITOR' },
      failOnStatusCode: false,
    });
    expect(tRes.status(), `add team member: ${await tRes.text()}`).toBe(201);

    // Uniqueness guard: adding the same user again is a conflict.
    const dup = await api.post(`/api/v1/portfolio/challenges/${challengeId}/team`, {
      headers: auth(admin.token),
      data: { userId: member.userId, role: 'VIEWER' },
      failOnStatusCode: false,
    });
    expect(dup.status()).toBe(409);

    const listRes = await api.get(`/api/v1/portfolio/challenges/${challengeId}/team`, { headers: auth(admin.token) });
    expect(listRes.ok()).toBeTruthy();
    expect(((await listRes.json()).data as any[]).some((m) => m.userId === member.userId)).toBe(true);

    // The CREATOR (≠ member) creates the iniciativa from the reto → materialization (#111).
    const pRes = await api.post('/api/v1/projects', {
      headers: auth(creator.token),
      data: { name: `E2E Iniciativa ${stamp}`, challengeId },
      failOnStatusCode: false,
    });
    expect(pRes.ok(), `create iniciativa: ${await pRes.text()}`).toBeTruthy();
    const projectId = (await pRes.json()).data.id as string;

    // Resolve the iniciativa team (#110): creator OWNER + member inherited EDITOR.
    const teamRes = await api.get(`/api/v1/portfolio/initiatives/${projectId}/team`, { headers: auth(admin.token) });
    expect(teamRes.ok(), `resolve team: ${await teamRes.text()}`).toBeTruthy();
    const team = (await teamRes.json()).data as {
      members: Array<{ userId: string; role: string; inheritedFromChallenge: boolean }>;
      owner: string;
      inheritedCount: number;
      label: string;
    };

    const ids = team.members.map((m) => m.userId);
    expect(ids).toContain(creator.userId);
    expect(ids).toContain(member.userId);

    expect(team.owner).toBe(creator.userId);
    const memberRow = team.members.find((m) => m.userId === member.userId)!;
    expect(memberRow.role).toBe('EDITOR');
    expect(memberRow.inheritedFromChallenge).toBe(true);

    const creatorRow = team.members.find((m) => m.userId === creator.userId)!;
    expect(creatorRow.role).toBe('OWNER');
    expect(creatorRow.inheritedFromChallenge).toBe(false); // owner is NOT an inherited row (deduped)

    expect(team.inheritedCount).toBe(1);
  });

  test('initiative meta edit persists; derived team-cache fields are ignored (#113/#114)', async () => {
    const admin = await login(api, 'admin@starteria.io', 'demo123');
    const creator = await registerAndLogin(api, 'metacreator');
    const stamp = Date.now();

    const frontId = (await (await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(admin.token), data: { name: `E2E Frente Meta ${stamp}` }, failOnStatusCode: false,
    })).json()).data.id as string;
    const challengeId = (await (await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(admin.token), data: { title: `E2E Reto Meta ${stamp}` }, failOnStatusCode: false,
    })).json()).data.id as string;
    const projectId = (await (await api.post('/api/v1/projects', {
      headers: auth(creator.token), data: { name: `E2E Iniciativa Meta ${stamp}`, challengeId }, failOnStatusCode: false,
    })).json()).data.id as string;

    // PUT meta with an editable field + a spoofed derived team field.
    const putRes = await api.put(`/api/v1/portfolio/initiatives/${projectId}/meta`, {
      headers: auth(admin.token),
      data: { challengeId, mentor: 'Ana Mentora', teamOwner: 'SPOOFED', teamLabel: 'SPOOFED' },
      failOnStatusCode: false,
    });
    expect(putRes.ok(), `put meta: ${await putRes.text()}`).toBeTruthy();

    const meta = (await (await api.get(`/api/v1/portfolio/initiatives/${projectId}/meta`, { headers: auth(admin.token) })).json()).data;
    expect(meta.mentor).toBe('Ana Mentora');           // editable field persisted
    expect(meta.teamOwner).not.toBe('SPOOFED');         // derived field NOT overwritten by client
    expect(meta.teamLabel).not.toBe('SPOOFED');
  });
});
