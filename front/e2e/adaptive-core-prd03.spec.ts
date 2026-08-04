import { test, expect, request as pwRequest, type APIRequestContext, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'portfolio-admin.e2e@starteria.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD || 'demo123';

function extractToken(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.tokens?.accessToken ?? body?.accessToken ?? '';
}

function jwtSub(token: string): string {
  const part = token.split('.')[1];
  const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const payload = JSON.parse(json) as { sub?: string; userId?: string; id?: string };
  return payload.sub ?? payload.userId ?? payload.id ?? '';
}

async function login(api: APIRequestContext, email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(res.status(), `login ${email}: ${await res.text()}`).toBe(200);
  const token = extractToken(await res.json());
  expect(token).toBeTruthy();
  return { token, userId: jwtSub(token) };
}

async function registerAndLogin(api: APIRequestContext, tag: string): Promise<{ token: string; userId: string; email: string; password: string }> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-adaptive-${tag}-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E Adaptive ${tag} ${stamp}`, role: 'participante' },
    failOnStatusCode: false,
  });
  expect([200, 201, 409], `register ${email}: ${await reg.text()}`).toContain(reg.status());
  const { token, userId } = await login(api, email, password);
  return { token, userId, email, password };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function browserLogin(page: Page, email: string, password: string) {
  await page.goto('/auth');
  const result = await page.evaluate(
    async ({ email, password }) => {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    { email, password },
  );
  expect(result.status, `browser login ${email}: ${JSON.stringify(result.body)}`).toBe(200);
}

async function postOk(api: APIRequestContext, token: string, url: string, data: Record<string, unknown>) {
  const res = await api.post(url, { headers: auth(token), data, failOnStatusCode: false });
  expect(res.ok(), `${url}: ${await res.text()}`).toBeTruthy();
  return (await res.json()).data;
}

async function patchOk(api: APIRequestContext, token: string, url: string, data: Record<string, unknown>) {
  const res = await api.patch(url, { headers: auth(token), data, failOnStatusCode: false });
  expect(res.ok(), `${url}: ${await res.text()}`).toBeTruthy();
  return (await res.json()).data;
}

async function getOk(api: APIRequestContext, token: string, url: string) {
  const res = await api.get(url, { headers: auth(token), failOnStatusCode: false });
  expect(res.ok(), `${url}: ${await res.text()}`).toBeTruthy();
  return (await res.json()).data;
}

async function createFromInitialReview(api: APIRequestContext, token: string, originalInput: string, companyContext?: Record<string, unknown>) {
  const review = await postOk(api, token, '/api/v1/initial-reviews', {
    originalInput,
    ...(companyContext ? { companyContext } : {}),
  });
  const confirmed = await postOk(api, token, `/api/v1/initial-reviews/${review.id}/confirm-route`, {});
  return confirmed.initiativeId as string;
}

async function createCompany(api: APIRequestContext, token: string, name: string) {
  const res = await api.post('/api/v1/companies', {
    headers: auth(token),
    data: { name, sector: 'Servicios', country: 'Peru', areaName: 'Operaciones' },
    failOnStatusCode: false,
  });
  expect(res.status(), `create company: ${await res.text()}`).toBe(201);
  return (await res.json()).data;
}

async function createChallengeInitiative(api: APIRequestContext, adminToken: string, ownerToken: string, name: string) {
  const front = await postOk(api, adminToken, '/api/v1/portfolio/strategic-fronts', { name: `${name} Frente` });
  const challenge = await postOk(api, adminToken, `/api/v1/portfolio/strategic-fronts/${front.id}/challenges`, { title: `${name} Reto` });
  const project = await postOk(api, ownerToken, '/api/v1/projects', { name: `${name} Iniciativa`, challengeId: challenge.id });
  return { frontId: front.id as string, challengeId: challenge.id as string, projectId: project.id as string };
}

async function confirmCheckpoint(api: APIRequestContext, token: string, projectId: string, checkpointKey: string, responses: Record<string, unknown>, suffix: string) {
  return postOk(api, token, `/api/v1/projects/${projectId}/adaptive-core/checkpoints/confirm`, {
    idempotencyKey: `${projectId}-${suffix}`,
    checkpointKey,
    responses,
  });
}

async function completeStep0(api: APIRequestContext, token: string, projectId: string) {
  await getOk(api, token, `/api/v1/projects/${projectId}/adaptive-core`);
  await confirmCheckpoint(api, token, projectId, 'CP-0.1', { objective: 'Reducir retrabajo', challengeType: 'growth' }, 'cp01');
  await confirmCheckpoint(api, token, projectId, 'CP-0.2', { scope: 'Equipo comercial', owner_and_actor_required: 'Owner comercial' }, 'cp02');
  const state = await confirmCheckpoint(api, token, projectId, 'CP-0.3', {
    priorityHypothesis: 'Si damos visibilidad temprana, baja el retrabajo.',
    decisionCriteria: 'Baja 20% del retrabajo semanal.',
  }, 'cp03');
  const draft = state.stepOutputs.find((output: any) => output.step === 0)?.output;
  return postOk(api, token, `/api/v1/projects/${projectId}/adaptive-core/step0/brief/confirm`, {
    idempotencyKey: `${projectId}-brief-confirm`,
    brief: draft,
    confirmed: true,
  });
}

async function completeStep1(api: APIRequestContext, token: string, projectId: string, contradictory = false) {
  await confirmCheckpoint(api, token, projectId, 'CP-1.1', {
    mainHypothesis: 'Usuarios adoptan el tablero si reduce retrabajo.',
    criticalAssumption: 'El retrabajo nace por falta de visibilidad.',
    learningQuestion: 'Que evidencia muestra retrabajo evitable?',
    riskOfBeingWrong: 'Disenar la solucion equivocada.',
    dependentDecision: 'Definir apuesta de Step 2.',
  }, 'cp11');
  await confirmCheckpoint(api, token, projectId, 'CP-1.2', {
    methods: ['entrevistas', 'revision de metricas'],
    sourcesAndActors: ['Usuarios comerciales', 'Reporte CRM'],
    responsibleAndDates: ['Owner comercial - 2026-08-05'],
    expectedEvidenceAndSufficiency: 'Tres entrevistas y una metrica base.',
  }, 'cp12');
  await confirmCheckpoint(api, token, projectId, 'CP-1.3', {
    evidenceItems: [
      { id: 'ev-support', summary: '8 de 10 casos tienen retrabajo por visibilidad', classification: 'supports', sourceRefs: ['crm-report'] },
      ...(contradictory ? [{ id: 'ev-contradicts', summary: 'La metrica agregada no muestra demoras', classification: 'contradicts', sourceRefs: ['metric-aggregate'] }] : []),
    ],
    evidenceClassifications: contradictory ? ['supports', 'contradicts'] : ['supports'],
    sourceRefs: contradictory ? ['crm-report', 'metric-aggregate'] : ['crm-report'],
  }, 'cp13');
  const state = await confirmCheckpoint(api, token, projectId, 'CP-1.4', {
    synthesis: contradictory ? 'La evidencia es parcial porque hay una contradiccion metrica.' : 'La evidencia apoya enfocar visibilidad de retrabajo.',
    updatedFocusAndHypothesis: 'Reducir retrabajo comercial con visibilidad temprana.',
    continuityDecision: contradictory ? 'avanzar con observaciones' : 'mantener',
  }, 'cp14');
  const output = state.stepOutputs.find((item: any) => item.step === 1)?.output;
  return postOk(api, token, `/api/v1/projects/${projectId}/adaptive-core/step1/output/confirm`, {
    idempotencyKey: `${projectId}-step1-confirm`,
    brief: output,
    confirmed: true,
  });
}

async function completeStep2(api: APIRequestContext, token: string, projectId: string) {
  await confirmCheckpoint(api, token, projectId, 'CP-2.1', {
    expectedOutcome: 'Reducir retrabajo validando visibilidad temprana.',
    successCriteria: ['Uso semanal', 'Menos retrabajo'],
    constraintsGuardrails: ['No usar datos productivos sin permiso'],
    reversibilityLevel: 'alta',
  }, 'cp21');
  await confirmCheckpoint(api, token, projectId, 'CP-2.2', {
    alternatives: [
      { name: 'Prototipo manual', mode: 'experiment', evidenceRefs: ['crm-report'] },
      { name: 'No hacer nada', mode: 'do_nothing', evidenceRefs: ['risk-log'] },
    ],
    implementationModes: ['experiment', 'do_nothing'],
    alternativeEvidenceRefs: ['crm-report', 'risk-log'],
  }, 'cp22');
  await confirmCheckpoint(api, token, projectId, 'CP-2.3', {
    comparison: { valor: 'alto', factibilidad: 'media', reversibilidad: 'alta' },
    selectedBet: { primary: 'Prototipo manual', backup: 'No hacer nada', justification: 'Mayor aprendizaje con bajo costo.', evidenceRefs: ['crm-report'] },
    selectedBetEvidenceRefs: ['crm-report'],
  }, 'cp23');
  let state = await confirmCheckpoint(api, token, projectId, 'CP-2.4', {
    executionDesign: {
      testOrExecution: 'Prueba con 5 usuarios',
      scope: 'Equipo comercial',
      participants: ['5 usuarios'],
      baseline: '500 horas',
      metric: 'Horas de retrabajo',
      threshold: '20% reduccion',
      duration: '2 semanas',
    },
    ownersResourcesEvidence: ['Owner comercial', 'Tablero de seguimiento'],
    goNoGoCriteria: 'Go si baja 20% el retrabajo.',
  }, 'cp24');
  if (state.activeCheckpoint?.checkpointKey === 'CP-2.5') {
    state = await confirmCheckpoint(api, token, projectId, 'CP-2.5', {
      readinessChecklist: ['Owner confirmado', 'Permisos confirmados', 'Datos disponibles'],
      dependenciesAndFallback: ['Plan alternativo: encuesta manual'],
    }, 'cp25');
  }
  const output = state.stepOutputs.find((item: any) => item.step === 2)?.output;
  return { state, output };
}

async function confirmStep2(api: APIRequestContext, token: string, projectId: string, output: Record<string, unknown>, suffix = 'step2-ok') {
  return postOk(api, token, `/api/v1/projects/${projectId}/adaptive-core/step2/output/confirm`, {
    idempotencyKey: `${projectId}-${suffix}`,
    brief: output,
    confirmed: true,
  });
}

async function completeStep3(api: APIRequestContext, token: string, projectId: string, options: {
  decision?: string;
  mixedSignal?: boolean;
  criticalChange?: boolean;
  suffix?: string;
} = {}) {
  const suffix = options.suffix ?? options.decision ?? 'iterate';
  await confirmCheckpoint(api, token, projectId, 'CP-3.1', {
    step3TransferConfirmation: 'Transferencia Step 2 confirmada.',
    executionReadinessChecklist: ['Owner confirmado', 'Metrica lista', options.decision === 'scale_pilot' ? 'Soporte pendiente de confirmar' : 'Sin faltantes'],
    executionDependencies: options.decision === 'scale_pilot'
      ? ['Permiso de sponsor confirmado', 'Plan alternativo: rollback manual']
      : ['Plan alternativo: medicion manual'],
  }, `cp31-${suffix}`);
  await confirmCheckpoint(api, token, projectId, 'CP-3.2', {
    executionRecords: [
      { type: 'measurement', title: 'Medicion piloto', description: options.mixedSignal ? 'Mejora 12%, bajo umbral' : 'Resultado supero umbral', occurredAt: '2026-08-01T00:00:00.000Z', actor: 'Owner comercial', evidenceRefs: ['result-1'], sourceRefs: ['result-1'], impact: options.mixedSignal ? 'parcial' : 'positivo', configurationVersion: 1, checkpointKey: 'CP-3.2' },
      ...(options.mixedSignal ? [{ type: 'interview', title: 'Entrevista contradice', description: 'Usuarios reportan mayor carga operativa', occurredAt: '2026-08-02T00:00:00.000Z', actor: 'Owner comercial', evidenceRefs: ['interview-mixed'], sourceRefs: ['interview-mixed'], impact: 'contradictorio', configurationVersion: 1, checkpointKey: 'CP-3.2' }] : []),
    ],
    executionSourceRefs: options.mixedSignal ? ['result-1', 'interview-mixed'] : ['result-1'],
    criticalExecutionChanges: options.criticalChange ? ['Cambio de alcance durante ejecucion'] : undefined,
  }, `cp32-${suffix}`);
  await confirmCheckpoint(api, token, projectId, 'CP-3.3', {
    resultComparison: options.mixedSignal
      ? { baseline: '500 horas', result: '440 horas y mayor carga', threshold: '20% reduccion', supportingEvidenceRefs: ['result-1'], contradictingEvidenceRefs: ['interview-mixed'], limitations: ['Muestra pequena'], unexpectedEffects: ['Mayor carga operativa'] }
      : { baseline: '500 horas', result: '350 horas', threshold: '20% reduccion', supportingEvidenceRefs: ['result-1'], contradictingEvidenceRefs: [], interpretation: 'La prueba apoya la hipotesis.' },
    hypothesisClassification: options.mixedSignal ? 'mixed_signal' : 'supported',
    confirmedInterpretation: options.mixedSignal ? 'La evidencia es mixta por mejora parcial y carga operativa.' : 'La prueba apoya la hipotesis.',
  }, `cp33-${suffix}`);
  let state = await confirmCheckpoint(api, token, projectId, 'CP-3.4', {
    decision: options.decision ?? 'iterate',
    decisionDetails: {
      rationale: options.mixedSignal ? 'Escalar no es prudente con senal mixta.' : 'Resultado suficiente para decidir.',
      nextAction: options.decision === 'close_with_learning' ? 'Cerrar con aprendizaje documentado.' : options.decision === 'scale_pilot' ? 'Escalar piloto a siguiente muestra.' : 'Iterar diseno.',
      owner: 'Owner comercial',
      dueDate: '2026-08-15',
      requiredApprover: options.decision === 'scale_pilot' ? 'Sponsor' : 'Owner comercial',
    },
    decisionEvidenceRefs: options.mixedSignal ? ['result-1', 'interview-mixed'] : ['result-1'],
  }, `cp34-${suffix}`);
  if (state.activeCheckpoint?.checkpointKey === 'CP-3.5') {
    state = await confirmCheckpoint(api, token, projectId, 'CP-3.5', {
      operationalReadinessChecklist: ['Owner futuro confirmado', 'Soporte definido', 'Rollback documentado', 'Aceptacion area receptora'],
      operationalBlockers: ['Sin bloqueos operativos'],
    }, `cp35-${suffix}`);
  }
  const output = state.stepOutputs.find((item: any) => item.step === 3)?.output;
  return { state, output };
}

async function confirmStep3(api: APIRequestContext, token: string, projectId: string, output: Record<string, unknown>, suffix = 'step3-ok') {
  return postOk(api, token, `/api/v1/projects/${projectId}/adaptive-core/step3/output/confirm`, {
    idempotencyKey: `${projectId}-${suffix}`,
    brief: output,
    confirmed: true,
  });
}

async function completeStep4(api: APIRequestContext, token: string, projectId: string, options: {
  finalState?: string;
  preferredFormat?: string;
  receiverOwner?: string;
  mixedEvidence?: boolean;
  suffix?: string;
} = {}) {
  const suffix = options.suffix ?? options.finalState ?? 'closed';
  await confirmCheckpoint(api, token, projectId, 'CP-4.1', {
    step4TransferConfirmation: 'Transferencia Step 3 confirmada.',
    decisionAudience: { primaryAudience: 'Comite ejecutivo', decisionMaker: 'Sponsor', secondaryAudiences: ['Challenge Owner'], deadline: '2026-08-30' },
    audienceDecisionNeeds: { requestedDecision: 'Aprobar siguiente horizonte', audienceNeeds: ['Evidencia', 'Riesgos'], objections: ['Carga operativa'], preferredFormat: options.preferredFormat ?? 'memo', requiredEvidenceRefs: options.mixedEvidence ? ['result-1', 'interview-mixed'] : ['result-1'] },
  }, `cp41-${suffix}`);
  await confirmCheckpoint(api, token, projectId, 'CP-4.2', {
    evidenceNarrative: { recommendation: 'Continuar con cierre organizacional trazable.', results: 'Resultado validado.', contradictions: options.mixedEvidence ? 'Entrevista contradice la metrica.' : '' },
    narrativeEvidenceRefs: options.mixedEvidence ? ['result-1', 'interview-mixed'] : ['result-1'],
  }, `cp42-${suffix}`);
  await confirmCheckpoint(api, token, projectId, 'CP-4.3', {
    nextHorizonPlan: { phases: ['Fase 1'], owner: options.receiverOwner ?? 'Owner comercial', metrics: ['Horas de retrabajo'] },
    nextHorizonDetails: { resources: ['Equipo comercial'], milestones: ['Decision 2026-08-30'], rollback: 'Volver a proceso manual' },
  }, `cp43-${suffix}`);
  await confirmCheckpoint(api, token, projectId, 'CP-4.4', {
    decisionArtifacts: [options.preferredFormat ?? 'memo'],
    artifactTraceability: { version: 1, author: 'Owner comercial', date: '2026-08-20', evidenceRefs: options.mixedEvidence ? ['result-1', 'interview-mixed'] : ['result-1'], limitations: ['Muestra pequena'] },
  }, `cp44-${suffix}`);
  const state = await confirmCheckpoint(api, token, projectId, 'CP-4.5', {
    transferOrClosure: { finalDecision: 'Decision organizacional confirmada', owner: 'Owner comercial', receiverOwner: options.receiverOwner, nextStep: 'Ejecutar siguiente horizonte', evidenceRefs: options.mixedEvidence ? ['result-1', 'interview-mixed'] : ['result-1'] },
    finalState: options.finalState ?? 'closed_with_learning',
    challengeCoverageUpdate: { status: options.finalState === 'scaled' ? 'ready_for_decision' : 'partial', metrics: ['Horas de retrabajo'] },
  }, `cp45-${suffix}`);
  const output = state.stepOutputs.find((item: any) => item.step === 4)?.output;
  return { state, output };
}

async function confirmStep4(api: APIRequestContext, token: string, projectId: string, output: Record<string, unknown>, suffix = 'step4-ok') {
  return postOk(api, token, `/api/v1/projects/${projectId}/adaptive-core/step4/output/confirm`, {
    idempotencyKey: `${projectId}-${suffix}`,
    brief: output,
    confirmed: true,
  });
}

test.describe('PRD-03 adaptive flow with real browser stack', () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await pwRequest.newContext({ baseURL: BASE });
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('Revision inicial -> Step 0 -> Step 1 -> Step 2 -> Step 3 -> Step 4 -> cierre across scenarios', async ({ page, context }) => {
    const admin = await login(api, ADMIN_EMAIL, ADMIN_PASSWORD);
    const owner = await registerAndLogin(api, 'owner');
    const stranger = await registerAndLogin(api, 'stranger');

    await browserLogin(page, owner.email, owner.password);

    const quickProjectId = await createFromInitialReview(
      api,
      owner.token,
      'Quiero validar rapido si un tablero simple reduce retrabajo semanal del equipo comercial.',
    );
    await completeStep0(api, owner.token, quickProjectId);
    await completeStep1(api, owner.token, quickProjectId);
    const quickBeforeConfirm = await completeStep2(api, owner.token, quickProjectId);
    expect(quickBeforeConfirm.state.activeCheckpoint).toBeNull();
    expect(quickBeforeConfirm.output.readiness.required).toBe(false);

    await page.goto(`/initiatives/${quickProjectId}/overview`);
    await expect(page).not.toHaveURL(/\/auth/);
    await page.reload();
    await expect(page).not.toHaveURL(/\/auth/);

    const recovered = await getOk(api, owner.token, `/api/v1/projects/${quickProjectId}/adaptive-core`);
    expect(recovered.activeCheckpoint).toBeNull();
    expect(recovered.stepOutputs.find((item: any) => item.step === 0)?.status).toBe('confirmed');
    expect(recovered.stepOutputs.find((item: any) => item.step === 1)?.status).toBe('confirmed');
    expect(recovered.stepOutputs.find((item: any) => item.step === 2)?.status).toBe('draft');
    expect(recovered.stepOutputs.find((item: any) => item.step === 2)?.output.selectedBet.evidenceRefs).toContain('crm-report');

    const noConfirm = await api.post(`/api/v1/projects/${quickProjectId}/adaptive-core/step2/output/confirm`, {
      headers: auth(owner.token),
      data: { idempotencyKey: `${quickProjectId}-step2-no`, brief: quickBeforeConfirm.output, confirmed: false },
      failOnStatusCode: false,
    });
    expect(noConfirm.status()).toBe(400);

    await confirmStep2(api, owner.token, quickProjectId, quickBeforeConfirm.output);
    await confirmStep2(api, owner.token, quickProjectId, quickBeforeConfirm.output);
    const quickFinal = await getOk(api, owner.token, `/api/v1/projects/${quickProjectId}/adaptive-core`);
    expect(quickFinal.stepConfigurations.filter((config: any) => config.step === 3)).toHaveLength(1);
    expect(quickFinal.activeCheckpoint?.checkpointKey).toBe('CP-3.1');
    expect(quickFinal.progressSignal.step).toBe(3);

    const quickStep3 = await completeStep3(api, owner.token, quickProjectId, { decision: 'iterate' });
    expect(quickStep3.state.checkpointInstances.map((cp: any) => cp.checkpointKey)).not.toContain('CP-3.5');
    expect([
      'ExperimentResultsLearningDecision',
      'ExecutionReviewUpdatedDecision',
      'LightweightResultsBrief',
    ]).toContain(quickStep3.output.outputKey);
    expect(quickStep3.output.resultAnalysis.classification).toBe('supported');
    const quickNoConfirm = await api.post(`/api/v1/projects/${quickProjectId}/adaptive-core/step3/output/confirm`, {
      headers: auth(owner.token),
      data: { idempotencyKey: `${quickProjectId}-step3-no`, brief: quickStep3.output, confirmed: false },
      failOnStatusCode: false,
    });
    expect(quickNoConfirm.status()).toBe(400);
    await confirmStep3(api, owner.token, quickProjectId, quickStep3.output);
    await confirmStep3(api, owner.token, quickProjectId, quickStep3.output);
    const quickStep4 = await getOk(api, owner.token, `/api/v1/projects/${quickProjectId}/adaptive-core`);
    expect(quickStep4.stepConfigurations.filter((config: any) => config.step === 4)).toHaveLength(1);
    expect(quickStep4.activeCheckpoint?.checkpointKey).toBe('CP-4.1');
    const quickClosed = await completeStep4(api, owner.token, quickProjectId, { finalState: 'closed_with_learning', preferredFormat: 'one-pager', suffix: 'quick' });
    expect(quickClosed.output.outputKey).toBe('LightweightDecisionBrief');
    expect(quickClosed.output.decisionPackage.artifacts).toHaveLength(1);
    const step4NoConfirm = await api.post(`/api/v1/projects/${quickProjectId}/adaptive-core/step4/output/confirm`, {
      headers: auth(owner.token),
      data: { idempotencyKey: `${quickProjectId}-step4-no`, brief: quickClosed.output, confirmed: false },
      failOnStatusCode: false,
    });
    expect(step4NoConfirm.status()).toBe(400);
    await confirmStep4(api, owner.token, quickProjectId, quickClosed.output, 'quick-final');
    await confirmStep4(api, owner.token, quickProjectId, quickClosed.output, 'quick-final');
    const quickClosedState = await getOk(api, owner.token, `/api/v1/projects/${quickProjectId}/adaptive-core`);
    expect(quickClosedState.progressSignal.finalState).toBe('closed_with_learning');
    expect(quickClosedState.progressSignal.challengeCoverage.autoResolved).toBe(false);

    const company = await createCompany(api, owner.token, 'Empresa Adaptiva E2E');
    const complexProjectId = await createFromInitialReview(
      api,
      owner.token,
      'Quiero implementar un cambio transversal con restricciones de datos y seguridad antes de escalarlo.',
      { companyId: company.id, ...(company.areas?.[0]?.id ? { areaId: company.areas[0].id } : {}) },
    );
    await completeStep0(api, owner.token, complexProjectId);
    await completeStep1(api, owner.token, complexProjectId, true);
    const complexState = await getOk(api, owner.token, `/api/v1/projects/${complexProjectId}/adaptive-core`);
    const step1Output = complexState.stepOutputs.find((item: any) => item.step === 1)?.output;
    expect(step1Output.evidenceMap.items.some((item: any) => item.classification === 'contradicts')).toBe(true);
    expect(JSON.stringify(step1Output.evidenceMap.items)).toContain('metric-aggregate');
    const complexStep2 = complexState.stepConfigurations.find((config: any) => config.step === 2);
    expect(JSON.stringify(complexStep2.companyInfluences ?? complexStep2)).toContain('CompanyContextSnapshot');

    const complexStep2Done = await completeStep2(api, owner.token, complexProjectId);
    await confirmStep2(api, owner.token, complexProjectId, complexStep2Done.output);
    const mixedStep3 = await completeStep3(api, owner.token, complexProjectId, { decision: 'pause', mixedSignal: true, criticalChange: true, suffix: 'mixed' });
    expect(mixedStep3.output.resultAnalysis.classification).toBe('mixed_signal');
    expect(mixedStep3.output.resultAnalysis.contradictingEvidenceRefs).toContain('interview-mixed');
    expect(mixedStep3.output.executionLog.criticalChanges[0].affectedCheckpoints).toContain('CP-0.2');
    await confirmStep3(api, owner.token, complexProjectId, mixedStep3.output, 'complex-step3');
    const mixedStep4 = await completeStep4(api, owner.token, complexProjectId, { finalState: 'paused', preferredFormat: 'learning report', mixedEvidence: true, suffix: 'mixed' });
    expect(mixedStep4.output.narrative.contradictions.sourceRefs).toContain('interview-mixed');
    expect(mixedStep4.output.challengeCoverage.status).toBe('no_coverage');

    const linked = await createChallengeInitiative(api, admin.token, owner.token, `Adaptive ${Date.now()}`);
    await completeStep0(api, owner.token, linked.projectId);
    await completeStep1(api, owner.token, linked.projectId);
    const linkedStep2 = await completeStep2(api, owner.token, linked.projectId);
    await confirmStep2(api, owner.token, linked.projectId, linkedStep2.output);
    const meta = await getOk(api, admin.token, `/api/v1/portfolio/initiatives/${linked.projectId}/meta`);
    expect(meta.status).toBe('en_step_3');
    expect(JSON.stringify(meta)).toContain('CP-3.1');
    const challengeInitiatives = await getOk(api, admin.token, `/api/v1/portfolio/challenges/${linked.challengeId}/initiatives`);
    expect(JSON.stringify(challengeInitiatives)).toContain(linked.projectId);

    const forbiddenMeta = await api.put(`/api/v1/portfolio/initiatives/${linked.projectId}/meta`, {
      headers: auth(stranger.token),
      data: { nextActionRecommended: 'No autorizado' },
      failOnStatusCode: false,
    });
    expect([403, 404]).toContain(forbiddenMeta.status());

    const linkedStep3 = await completeStep3(api, owner.token, linked.projectId, { decision: 'scale_pilot', suffix: 'linked-scale' });
    await confirmStep3(api, owner.token, linked.projectId, linkedStep3.output, 'linked-step3');
    const linkedStep4 = await completeStep4(api, owner.token, linked.projectId, { finalState: 'scaled', preferredFormat: 'business case', receiverOwner: 'Area receptora', suffix: 'linked-scale' });
    await confirmStep4(api, owner.token, linked.projectId, linkedStep4.output, 'linked-step4');
    const linkedMetaFinal = await getOk(api, admin.token, `/api/v1/portfolio/initiatives/${linked.projectId}/meta`);
    expect(linkedMetaFinal.status).toBe('cerrada');
    expect(linkedMetaFinal.progressSignal.challengeCoverage.status).toBe('ready_for_decision');
    expect(linkedMetaFinal.progressSignal.challengeCoverage.autoResolved).toBe(false);
    await page.goto(`/initiatives/${linked.projectId}/overview`);
    await page.reload();
    await expect(page).not.toHaveURL(/\/auth/);
    const linkedReloadedState = await getOk(api, owner.token, `/api/v1/projects/${linked.projectId}/adaptive-core`);
    expect(linkedReloadedState.activeCheckpoint).toBeNull();
    expect(linkedReloadedState.progressSignal.step).toBe(4);
    expect(linkedReloadedState.progressSignal.finalState).toBe('scaled');
    expect(linkedReloadedState.progressSignal.checkpointKey).not.toBe('CP-3.1');
    const linkedReloadedMeta = await getOk(api, admin.token, `/api/v1/portfolio/initiatives/${linked.projectId}/meta`);
    expect(linkedReloadedMeta.status).toBe('cerrada');
    expect(JSON.stringify(linkedReloadedMeta)).not.toContain('CP-3.1');

    const critical = await postOk(api, owner.token, `/api/v1/projects/${linked.projectId}/adaptive-core/critical-change`, {
      idempotencyKey: `${linked.projectId}-bet-change`,
      field: 'selected_bet',
      previousValue: 'Prototipo manual',
      nextValue: 'Piloto asistido',
      reason: 'La evidencia nueva muestra mejor compatibilidad empresarial.',
      confirmed: true,
      action: 'update_route',
    });
    expect(critical.stepConfigurations.filter((config: any) => config.step === 2).map((config: any) => config.version)).toEqual([1, 2]);
    expect(critical.stepOutputs.some((output: any) => output.step >= 2 && output.requiresReview === true)).toBe(true);
    expect(critical.events.some((event: any) => event.eventType === 'step_reconfigured')).toBe(true);

    const scaleProjectId = await createFromInitialReview(
      api,
      owner.token,
      'Quiero escalar un piloto con resultado positivo y transferirlo al area receptora.',
    );
    await completeStep0(api, owner.token, scaleProjectId);
    await completeStep1(api, owner.token, scaleProjectId);
    const scaleStep2 = await completeStep2(api, owner.token, scaleProjectId);
    await confirmStep2(api, owner.token, scaleProjectId, scaleStep2.output);
    const scaleStep3 = await completeStep3(api, owner.token, scaleProjectId, { decision: 'scale_pilot' });
    expect(scaleStep3.state.activeCheckpoint).toBeNull();
    expect(scaleStep3.state.checkpointInstances.map((cp: any) => cp.checkpointKey)).toContain('CP-3.5');
    expect(scaleStep3.output.operationalReadiness.required).toBe(true);
    expect(scaleStep3.output.decision.decision).toBe('scale_pilot');
    await confirmStep3(api, owner.token, scaleProjectId, scaleStep3.output, 'scale-step3');
    const scaleStep4 = await completeStep4(api, owner.token, scaleProjectId, { finalState: 'scaled', preferredFormat: 'business case', receiverOwner: 'Area receptora', suffix: 'scale' });
    expect(scaleStep4.output.outputKey).toBe('BusinessCaseRoadmap');
    expect(scaleStep4.output.transferOrClosure.receiverOwner).toBe('Area receptora');

    const closeProjectId = await createFromInitialReview(
      api,
      owner.token,
      'Quiero cerrar una prueba pequena con aprendizaje porque el resultado no justifica escalar.',
    );
    await completeStep0(api, owner.token, closeProjectId);
    await completeStep1(api, owner.token, closeProjectId, true);
    const closeStep2 = await completeStep2(api, owner.token, closeProjectId);
    await confirmStep2(api, owner.token, closeProjectId, closeStep2.output);
    const closeStep3 = await completeStep3(api, owner.token, closeProjectId, { decision: 'close_with_learning', mixedSignal: true, suffix: 'close' });
    expect(closeStep3.state.checkpointInstances.map((cp: any) => cp.checkpointKey)).not.toContain('CP-3.5');
    expect(closeStep3.output.decision.decision).toBe('close_with_learning');
    await confirmStep3(api, owner.token, closeProjectId, closeStep3.output, 'close-step3');
    const closeStep4 = await completeStep4(api, owner.token, closeProjectId, { finalState: 'closed_with_learning', preferredFormat: 'closure report', mixedEvidence: true, suffix: 'close' });
    await confirmStep4(api, owner.token, closeProjectId, closeStep4.output, 'close-step4');
    const closeFinal = await getOk(api, owner.token, `/api/v1/projects/${closeProjectId}/adaptive-core`);
    expect(closeFinal.progressSignal.finalState).toBe('closed_with_learning');

    const transferProjectId = await createFromInitialReview(api, owner.token, 'Quiero transferir una implementacion validada a otra area sin convertirla en pitch.');
    await completeStep0(api, owner.token, transferProjectId);
    await completeStep1(api, owner.token, transferProjectId);
    const transferStep2 = await completeStep2(api, owner.token, transferProjectId);
    await confirmStep2(api, owner.token, transferProjectId, transferStep2.output);
    const transferStep3 = await completeStep3(api, owner.token, transferProjectId, { decision: 'transfer', suffix: 'transfer' });
    await confirmStep3(api, owner.token, transferProjectId, transferStep3.output, 'transfer-step3');
    const transferStep4 = await completeStep4(api, owner.token, transferProjectId, { finalState: 'transferred', preferredFormat: 'handoff package', receiverOwner: 'Area Operaciones', suffix: 'transfer' });
    expect(transferStep4.output.outputKey).toBe('OperationalHandoffPackage');
    expect(transferStep4.output.transferOrClosure.receiverOwner).toBe('Area Operaciones');

    const iterationProjectId = await createFromInitialReview(api, owner.token, 'Quiero iterar la ruta porque el aprendizaje muestra que el alcance debe cambiar.');
    await completeStep0(api, owner.token, iterationProjectId);
    await completeStep1(api, owner.token, iterationProjectId, true);
    const iterationStep2 = await completeStep2(api, owner.token, iterationProjectId);
    await confirmStep2(api, owner.token, iterationProjectId, iterationStep2.output);
    const iterationStep3 = await completeStep3(api, owner.token, iterationProjectId, { decision: 'iterate', mixedSignal: true, suffix: 'iteration' });
    await confirmStep3(api, owner.token, iterationProjectId, iterationStep3.output, 'iteration-step3');
    const iterationStep4 = await completeStep4(api, owner.token, iterationProjectId, { finalState: 'new_iteration_required', preferredFormat: 'one-pager', suffix: 'iteration' });
    await confirmStep4(api, owner.token, iterationProjectId, iterationStep4.output, 'iteration-step4');
    const iterationFinal = await getOk(api, owner.token, `/api/v1/projects/${iterationProjectId}/adaptive-core`);
    expect(iterationFinal.progressSignal.finalState).toBe('new_iteration_required');

    const legacyProject = await postOk(api, owner.token, '/api/v1/projects', { name: `Legacy Adaptive ${Date.now()}` });
    await patchOk(api, owner.token, `/api/v1/projects/${legacyProject.id}/step0`, {
      quePasaQueQuieres: 'Legacy text',
      status: 'En progreso',
    });
    const legacyState = await getOk(api, owner.token, `/api/v1/projects/${legacyProject.id}/adaptive-core`);
    expect(legacyState.legacyFallback).toBe(true);
    expect(legacyState.activeCheckpoint?.checkpointKey).toBe('CP-0.1');
    await completeStep0(api, owner.token, legacyProject.id);
    await completeStep1(api, owner.token, legacyProject.id);
    const legacyStep2 = await completeStep2(api, owner.token, legacyProject.id);
    await confirmStep2(api, owner.token, legacyProject.id, legacyStep2.output);
    const legacyStep3 = await completeStep3(api, owner.token, legacyProject.id, { decision: 'close_with_learning', suffix: 'legacy' });
    await confirmStep3(api, owner.token, legacyProject.id, legacyStep3.output, 'legacy-step3');
    const legacyStep4 = await completeStep4(api, owner.token, legacyProject.id, { finalState: 'closed_with_learning', preferredFormat: 'closure report', suffix: 'legacy' });
    await confirmStep4(api, owner.token, legacyProject.id, legacyStep4.output, 'legacy-step4');
    const legacyClosed = await getOk(api, owner.token, `/api/v1/projects/${legacyProject.id}/adaptive-core`);
    expect(legacyClosed.legacyFallback).toBe(true);
    expect(legacyClosed.progressSignal.finalState).toBe('closed_with_learning');

    await context.clearCookies();
    await page.goto(`/initiatives/${quickProjectId}/overview`);
    await expect(page).toHaveURL(/\/auth/);
    await browserLogin(page, owner.email, owner.password);
    await page.goto(`/initiatives/${quickProjectId}/overview`);
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
