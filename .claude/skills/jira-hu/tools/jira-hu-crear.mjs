#!/usr/bin/env node
// jira-hu-crear.mjs: crea en Jira una HU con sus subtareas separadas en FUNCIONAL y TÉCNICA.
//
// Por qué existe: el equipo son dos personas con dos frentes. La parte funcional (historia,
// criterios de aceptación, reglas de negocio, contratos de doc/) la lleva quien hace producto; la
// técnica (front/, backend/, ai-service/, tests) la lleva quien desarrolla. Una HU sin esa
// separación deja a los dos trabajando sobre el mismo ticket sin saber qué le toca a cada uno.
//
// Forma en Jira (proyecto team-managed, sin tipo "Historia"):
//   [Epic opcional]                              ← si el pedido agrupa varias HU
//     └─ HU        tipo Tarea,   label `hu`
//          ├─ [Funcional] ...  tipo Subtask, label `funcional`, asignada a JIRA_FUNCIONAL_ACCOUNT_ID
//          └─ [Técnica] ...    tipo Subtask, label `tecnica`,   asignada a JIRA_TECNICO_ACCOUNT_ID
//
// Seguridad: SIN `--aplicar` no escribe nada (dry-run): valida credenciales, resuelve tipos y
// responsables, busca HU parecidas ya existentes e imprime lo que crearía. Con `--aplicar` crea y
// anota las claves en el mismo JSON (`creado`); un JSON que ya tiene `creado` se rechaza, porque
// correrlo dos veces duplica tickets.
//
// Uso:
//   node jira-hu-crear.mjs <plan.json>              → dry-run
//   node jira-hu-crear.mjs <plan.json> --aplicar    → crea en Jira
//   node jira-hu-crear.mjs --usuarios               → lista usuarios asignables (para el .env)
//
// Salida: 0 ok · 1 plan inválido o duplicado · 2 credenciales/red/Jira.
//
// Esquema del plan (lo escribe el agente delivery-planner):
// {
//   "proyecto": "KAN",                 // opcional; si no, $JIRA_PROJECT
//   "epica": "KAN-10",                 // opcional; padre de la HU
//   "hu":        { "resumen": "...", "descripcion": "...", "labels": ["..."] },
//   "funcional": [ { "resumen": "...", "descripcion": "..." } ],   // al menos una
//   "tecnica":   [ { "resumen": "...", "descripcion": "...", "bloqueadaPor": ["funcional#0"] } ]
// }
// `bloqueadaPor` (opcional, en cualquier subtarea): referencias "funcional#i" / "tecnica#i" a otras
// subtareas del mismo plan. Se crean como enlaces `Blocks` de Jira después de crear todo.
// `descripcion` en markdown mínimo: `## título`, `- viñeta`, párrafos separados por línea vacía.

import { readFileSync, writeFileSync } from 'node:fs';
import { VARS, cargarEnv, api, explicarRechazo } from './jira-comun.mjs';

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const rutaPlan = args.find((a) => !a.startsWith('--'));

if (!cargarEnv()) {
  console.error(`faltan credenciales: exportá ${VARS.join(', ')} o dejalas en un .env (ver env.example).`);
  process.exit(2);
}
const yo = await api('/rest/api/3/myself');
if (yo.status === 401 || yo.status === 403) { explicarRechazo(yo.status); process.exit(2); }
if (yo.status !== 200) { console.error(`Jira devolvió HTTP ${yo.status} en /myself.`); process.exit(2); }

// ── --usuarios ───────────────────────────────────────────────────────────────
if (args.includes('--usuarios')) {
  const proyecto = process.env.JIRA_PROJECT;
  if (!proyecto) { console.error('definí JIRA_PROJECT para listar sus usuarios asignables.'); process.exit(1); }
  const u = await api('/rest/api/3/user/assignable/search', { project: proyecto, maxResults: '100' });
  for (const x of u.body ?? []) console.log(`${x.accountId}\t${x.displayName}`);
  if ((u.body ?? []).length < 2) {
    console.error(`\naviso: ${proyecto} tiene ${(u.body ?? []).length} usuario(s) asignable(s). Quien lleva lo funcional\n` +
      'tiene que estar invitado al proyecto antes de poder asignarle nada.');
  }
  process.exit(0);
}

if (!rutaPlan) {
  console.error('uso: node jira-hu-crear.mjs <plan.json> [--aplicar] | --usuarios');
  process.exit(1);
}

// ── validar el plan ──────────────────────────────────────────────────────────
let plan;
try {
  plan = JSON.parse(readFileSync(rutaPlan, 'utf8'));
} catch (e) {
  console.error(`no se pudo leer ${rutaPlan}: ${e.message}`);
  process.exit(1);
}
const errores = [];
const tieneTexto = (o) => o && typeof o.resumen === 'string' && o.resumen.trim() && typeof o.descripcion === 'string';
if (!tieneTexto(plan.hu)) errores.push('falta hu.resumen / hu.descripcion');
for (const lado of ['funcional', 'tecnica']) {
  if (!Array.isArray(plan[lado]) || !plan[lado].length) errores.push(`falta al menos una subtarea en "${lado}"`);
  else plan[lado].forEach((s, i) => { if (!tieneTexto(s)) errores.push(`${lado}[${i}] sin resumen/descripcion`); });
}
const proyecto = plan.proyecto || process.env.JIRA_PROJECT;
if (!proyecto) errores.push('sin proyecto: poné "proyecto" en el plan o JIRA_PROJECT en el .env');
const refs = new Set(['funcional', 'tecnica'].flatMap((l) => (plan[l] ?? []).map((_, i) => `${l}#${i}`)));
for (const lado of ['funcional', 'tecnica']) {
  (plan[lado] ?? []).forEach((s, i) => {
    for (const b of s?.bloqueadaPor ?? []) {
      if (!refs.has(b)) errores.push(`${lado}[${i}].bloqueadaPor: "${b}" no es una subtarea del plan (usá "funcional#n" o "tecnica#n")`);
      else if (b === `${lado}#${i}`) errores.push(`${lado}[${i}] no puede bloquearse a sí misma`);
    }
  });
}
if (plan.creado && aplicar) errores.push(`este plan ya se aplicó (${plan.creado.hu}); correrlo otra vez duplica tickets`);
if (errores.length) {
  for (const e of errores) console.error(`plan inválido: ${e}`);
  process.exit(1);
}

// ── resolver tipos del proyecto ──────────────────────────────────────────────
const pr = await api(`/rest/api/3/project/${proyecto}`);
if (pr.status !== 200) {
  console.error(`no se pudo leer el proyecto ${proyecto} (HTTP ${pr.status}).`);
  process.exit(2);
}
const tipos = pr.body.issueTypes ?? [];
const porNombre = (n) => tipos.find((t) => t.name.toLowerCase() === String(n).toLowerCase());
const tipoHU = porNombre(process.env.JIRA_TIPO_HU || 'Tarea') ?? tipos.find((t) => !t.subtask && t.hierarchyLevel === 0);
const tipoSub = porNombre(process.env.JIRA_TIPO_SUBTAREA || 'Subtask') ?? tipos.find((t) => t.subtask);
if (!tipoHU || !tipoSub) {
  console.error(`${proyecto} no tiene tipo para la HU y/o para subtareas. Tipos: ${tipos.map((t) => t.name).join(', ')}`);
  process.exit(2);
}

// ── responsables ─────────────────────────────────────────────────────────────
const responsable = {
  funcional: process.env.JIRA_FUNCIONAL_ACCOUNT_ID || null,
  tecnica: process.env.JIRA_TECNICO_ACCOUNT_ID || null,
};
const avisos = [];
for (const [lado, id] of Object.entries(responsable)) {
  if (!id) avisos.push(`sin responsable para "${lado}" (${lado === 'funcional' ? 'JIRA_FUNCIONAL_ACCOUNT_ID' : 'JIRA_TECNICO_ACCOUNT_ID'}): se crea sin asignar, con label "${lado}"`);
}

// ── HU parecidas ya existentes ───────────────────────────────────────────────
// Antes de crear, buscar por texto: un pedido repetido en la daily no merece un segundo ticket.
const frase = plan.hu.resumen.replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const parecidas = [];
if (frase) {
  const q = await api('/rest/api/3/search/jql', {
    jql: `project = ${proyecto} AND labels = hu AND summary ~ "${frase.replace(/"/g, '')}" ORDER BY created DESC`,
    fields: 'summary,status',
    maxResults: '5',
  });
  for (const i of q.body?.issues ?? []) parecidas.push(`${i.key} · ${i.fields.status?.name} · ${i.fields.summary}`);
}

// ── markdown mínimo → ADF ────────────────────────────────────────────────────
function aADF(md) {
  const content = [];
  let lista = null;
  const texto = (t) => [{ type: 'text', text: t }];
  for (const cruda of String(md ?? '').split(/\r?\n/)) {
    const l = cruda.trimEnd();
    const vin = l.match(/^\s*[-*]\s+(.*)$/);
    if (vin) {
      if (!lista) { lista = { type: 'bulletList', content: [] }; content.push(lista); }
      lista.content.push({ type: 'listItem', content: [{ type: 'paragraph', content: texto(vin[1]) }] });
      continue;
    }
    lista = null;
    if (!l.trim()) continue;
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) content.push({ type: 'heading', attrs: { level: Math.min(h[1].length + 1, 6) }, content: texto(h[2]) });
    else content.push({ type: 'paragraph', content: texto(l) });
  }
  return { type: 'doc', version: 1, content: content.length ? content : [{ type: 'paragraph', content: [] }] };
}

const prefijo = { funcional: '[Funcional] ', tecnica: '[Técnica] ' };
const conPrefijo = (lado, r) => (r.startsWith(prefijo[lado].trim()) ? r : prefijo[lado] + r);

// ── dry-run ──────────────────────────────────────────────────────────────────
console.log(`${aplicar ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} en ${proyecto} · conectado como ${yo.body.displayName}\n`);
console.log(`HU  (${tipoHU.name}${plan.epica ? `, hija de ${plan.epica}` : ''}) ${plan.hu.resumen}`);
for (const lado of ['funcional', 'tecnica']) {
  for (const s of plan[lado]) {
    const bl = s.bloqueadaPor?.length ? `  ⟵ bloqueada por ${s.bloqueadaPor.join(', ')}` : '';
    console.log(`  └─ ${lado}#${plan[lado].indexOf(s)} (${tipoSub.name}, ${responsable[lado] ? 'asignada' : 'sin asignar'}) ${conPrefijo(lado, s.resumen)}${bl}`);
  }
}
for (const a of avisos) console.log(`\naviso: ${a}`);
if (parecidas.length) {
  console.log('\nHU PARECIDAS YA EXISTENTES (revisá antes de aplicar, puede ser la misma):');
  for (const p of parecidas) console.log(`  ${p}`);
}
if (!aplicar) {
  console.log('\nNada se creó. Para crear: agregá --aplicar.');
  process.exit(0);
}

// ── crear ────────────────────────────────────────────────────────────────────
async function crear(fields) {
  const r = await api('/rest/api/3/issue', {}, { method: 'POST', body: { fields } });
  if (r.status !== 201) {
    console.error(`Jira rechazó la creación (HTTP ${r.status}): ${JSON.stringify(r.body?.errors ?? r.body?.errorMessages ?? r.body)}`);
    return null;
  }
  return r.body.key;
}

const creado = { hu: null, funcional: [], tecnica: [], fecha: new Date().toISOString() };
creado.hu = await crear({
  project: { key: proyecto },
  issuetype: { id: tipoHU.id },
  summary: plan.hu.resumen,
  description: aADF(plan.hu.descripcion),
  labels: [...new Set(['hu', ...(plan.hu.labels ?? [])])],
  ...(plan.epica ? { parent: { key: plan.epica } } : {}),
});
if (!creado.hu) process.exit(2);
console.log(`\ncreada ${creado.hu}`);

let fallas = 0;
for (const lado of ['funcional', 'tecnica']) {
  for (const s of plan[lado]) {
    const key = await crear({
      project: { key: proyecto },
      issuetype: { id: tipoSub.id },
      parent: { key: creado.hu },
      summary: conPrefijo(lado, s.resumen),
      description: aADF(s.descripcion),
      labels: [lado],
      ...(responsable[lado] ? { assignee: { accountId: responsable[lado] } } : {}),
    });
    if (key) { creado[lado].push(key); console.log(`  creada ${key} (${lado})`); } else fallas++;
  }
}

// Bloqueos: después de crear todo, porque el enlace necesita las dos claves.
const clave = (ref) => { const [l, i] = ref.split('#'); return creado[l][Number(i)] ?? null; };
creado.bloqueos = [];
for (const lado of ['funcional', 'tecnica']) {
  for (const [i, s] of plan[lado].entries()) {
    for (const ref of s.bloqueadaPor ?? []) {
      const bloqueada = creado[lado][i], bloqueante = clave(ref);
      if (!bloqueada || !bloqueante) { fallas++; console.error(`  bloqueo ${ref} → ${lado}#${i} no se creó: falta una de las dos subtareas`); continue; }
      const r = await api('/rest/api/3/issueLink', {}, { method: 'POST', body: {
        type: { name: 'Blocks' }, outwardIssue: { key: bloqueante }, inwardIssue: { key: bloqueada },
      } });
      if (r.status === 201) { creado.bloqueos.push(`${bloqueante} bloquea ${bloqueada}`); console.log(`  ${bloqueante} bloquea ${bloqueada}`); }
      else { fallas++; console.error(`  bloqueo ${bloqueante} → ${bloqueada} rechazado (HTTP ${r.status})`); }
    }
  }
}

// Se escribe aunque haya fallas parciales: sin `creado` en el JSON, el próximo `--aplicar`
// volvería a crear la HU que sí se creó.
plan.creado = creado;
writeFileSync(rutaPlan, `${JSON.stringify(plan, null, 2)}\n`);
console.log(`\nclaves anotadas en ${rutaPlan}`);
console.log(`https://${process.env.JIRA_HOSTNAME}/browse/${creado.hu}`);
if (fallas) {
  console.error(`\n${fallas} subtarea(s) o bloqueo(s) no se crearon: completalos a mano bajo ${creado.hu}.`);
  process.exit(2);
}
process.exit(0);
