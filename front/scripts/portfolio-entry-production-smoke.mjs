// Run only against an explicitly selected deployment. Never print access tokens.
const baseUrl = process.argv[2] ?? process.env.PORTFOLIO_ENTRY_SMOKE_BASE_URL;
if (!baseUrl) throw new Error('PORTFOLIO_ENTRY_SMOKE_BASE_URL is required');
const endpoint = `${baseUrl.replace(/\/$/, '')}/api/v1/public/portfolio-entry`;
const request = async (path, init) => {
  const response = await fetch(`${endpoint}${path}`, { ...init, signal: AbortSignal.timeout(30000) });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, data: body.data, code: body.error?.code ?? body.code };
};

const created = await request('/sessions', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});
if (created.status !== 201 || !created.data?.session?.id || !created.data?.publicAccessToken) {
  console.log(JSON.stringify({ phase: 'create', status: created.status, code: created.code }));
  process.exit(1);
}
const sessionId = created.data.session.id;
const token = created.data.publicAccessToken;
const headers = {
  'Content-Type': 'application/json',
  'X-Starteria-Entry-Token': token,
  'Idempotency-Key': crypto.randomUUID(),
};
const analyzed = await request(`/sessions/${sessionId}/messages`, {
  method: 'POST', headers,
  body: JSON.stringify({ expectedRevision: 0, message: 'Quiero generar 200 ventas de un nuevo producto hasta diciembre.' }),
});
if (analyzed.status !== 200) {
  const read = await request(`/sessions/${sessionId}`, { headers: { 'X-Starteria-Entry-Token': token } });
  console.log(JSON.stringify({ phase: 'analysis', status: analyzed.status, code: analyzed.code,
    persistedRevision: read.data?.revision, lifecycleStatus: read.data?.lifecycleStatus }));
  process.exit(1);
}
const data = analyzed.data;
const summary = {
  phase: 'analysis', status: analyzed.status, revision: data.revision,
  lifecycleStatus: data.lifecycleStatus, nextAction: data.nextAction,
  initialEntryState: data.semanticProjection?.initialEntryState,
  currentFrame: data.semanticProjection?.currentFrame,
  questionCount: data.conversation?.at(-1)?.emittedQuestions?.length,
};
const read = await request(`/sessions/${sessionId}`, { headers: { 'X-Starteria-Entry-Token': token } });
summary.persistedRevision = read.data?.revision;
summary.persistedLifecycleStatus = read.data?.lifecycleStatus;
let latest = data;
if (data.nextAction === 'answer_clarification') {
  const questions = data.conversation?.at(-1)?.emittedQuestions ?? [];
  const followUp = await request(`/sessions/${sessionId}/messages`, {
    method: 'POST', headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({
      expectedRevision: data.revision,
      message: 'Es un objetivo comercial para un producto nuevo. Aun no tenemos validacion de demanda ni canal confirmado; necesitamos decidir si invertir en el lanzamiento. Las 200 ventas antes de diciembre son una meta propuesta, no ventas comprometidas.',
      matchedQuestionIds: questions.map((question) => question.id),
      respondedResolves: [...new Set(questions.flatMap((question) => question.resolves ?? []))],
    }),
  });
  summary.followUpStatus = followUp.status;
  summary.followUpCode = followUp.code;
  if (followUp.status === 200) latest = followUp.data;
  summary.followUpNextAction = latest.nextAction;
}
if (latest.nextAction === 'offer_guided_exploration') {
  const choice = await request(`/sessions/${sessionId}/guided-exploration`, {
    method: 'POST', headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ expectedRevision: latest.revision, choice: 'accept' }),
  });
  summary.guidedChoiceStatus = choice.status;
  summary.guidedChoiceCode = choice.code;
  if (choice.status === 200) latest = choice.data;
  summary.guidedChoiceNextAction = latest.nextAction;
}
if (latest.nextAction === 'answer_clarification') {
  const questions = latest.conversation?.at(-1)?.emittedQuestions ?? [];
  if (questions.length) {
    const answer = await request(`/sessions/${sessionId}/messages`, {
      method: 'POST', headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        expectedRevision: latest.revision,
        message: 'Aun no hay evidencia de demanda ni un canal de venta validado. La decision pendiente es si realizar un piloto comercial antes de comprometer recursos al lanzamiento.',
        matchedQuestionIds: questions.map((question) => question.id),
        respondedResolves: [...new Set(questions.flatMap((question) => question.resolves ?? []))],
      }),
    });
    summary.guidedAnswerStatus = answer.status;
    summary.guidedAnswerCode = answer.code;
    if (answer.status === 200) latest = answer.data;
    summary.guidedAnswerNextAction = latest.nextAction;
  }
}
if (latest.nextAction === 'generate_handoff') {
  const handoff = await request(`/sessions/${sessionId}/handoff`, {
    method: 'POST', headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ expectedRevision: latest.revision }),
  });
  summary.handoffStatus = handoff.status;
  summary.handoffCode = handoff.code;
  summary.handoffGenerated = Boolean(handoff.data?.handoff);
}
console.log(JSON.stringify(summary));
if (summary.persistedRevision !== summary.revision || summary.currentFrame === 'portfolio_first' && summary.initialEntryState !== 'portfolio_first') process.exitCode = 1;
