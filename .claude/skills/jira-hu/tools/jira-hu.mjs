#!/usr/bin/env node
// jira-hu.mjs — ubica una HU en Jira a partir de una referencia informal, y trae su contenido
// como contexto previo a planificar (F3).
//
// El problema que resuelve: el equipo dice "HU-15875", pero en Jira NO existe un proyecto `HU`.
// Ese número es el PEDIDO, que vive como una épica ("Mejoras Operativas - Pedido - 15875") con
// las HUs reales como hijas. Pedir /issue/HU-15875 da 404 y no significa "no existe".
//
// Escalera de resolución (verificada en vivo el 19-ago-2026 contra la instancia real):
//   1. Si la referencia parece clave Jira (PROJ-123) → GET directo del issue.
//   2. Si da 404 o es solo un número → JQL `summary ~ "<n>"` para hallar la épica del pedido.
//   3. De cada épica candidata se traen TODAS las hijas, con descripción en texto plano.
//      Todas, porque la trampa ya ocurrió: la HU [BCR/Murex] (MDC2026-873) tenía descripción
//      vacía y el contenido funcional estaba en la hermana (MDC2026-929).
//
// Solo lectura. Nunca imprime credenciales. Salida: 0 encontrado · 1 no encontrado · 2 config/red.
//
// Uso:  node jira-hu.mjs <referencia> [--json] [--a-fecha <ISO-8601>]
//       <referencia> = "HU-nnnn" informal · número de pedido a secas · clave Jira real (PROJ-123)
//       node jira-hu.mjs --sonda   → ¿contesta Jira, AHORA? Solo /myself, JSON, sin buscar nada.
//
// `--a-fecha <ISO>` (o la variable `JIRA_A_FECHA`) devuelve la HU COMO ESTABA ESE DÍA, no como
// está hoy (ADR-030 § 2.3). Jira guarda el changelog completo de cada issue: se parte del estado
// vigente y se deshacen, de atrás hacia adelante, los cambios posteriores a la fecha — resumen,
// descripción, estado, asignado, prioridad, etiquetas y padre —, y se omiten los comentarios
// posteriores. Lo que NO se puede deshacer (campos custom: Sprint, Rank, enlaces…) se lista en
// `reconstruido.campos_no_reconstruidos`, porque un contexto «a fecha» que calla lo que no
// reconstruyó se lee como completo. Una HU creada DESPUÉS de la fecha no se devuelve: no existía.
// Sin la bandera ni la variable, nada de esto corre y el comportamiento es el de siempre.

import { VARS, origenVar, cargarEnv, api, explicarRechazo, origenesMezclados } from './jira-comun.mjs';

const CAMPOS = 'summary,status,issuetype,priority,assignee,reporter,created,updated,labels,parent,project,description';

// Credenciales y `api()` viven en jira-comun.mjs, compartidas con jira-hu-crear.mjs.

// ── ADF → texto plano ────────────────────────────────────────────────────────
function adfATexto(nodo) {
  if (!nodo || typeof nodo !== 'object') return '';
  if (nodo.type === 'text') return nodo.text ?? '';
  if (nodo.type === 'hardBreak') return '\n';
  const hijos = (nodo.content ?? []).map(adfATexto).join('');
  switch (nodo.type) {
    case 'paragraph':
    case 'heading':
      return `${hijos}\n`;
    case 'listItem':
      return `- ${hijos.trimEnd()}\n`;
    case 'tableRow':
      return `${(nodo.content ?? []).map((c) => adfATexto(c).trim()).join(' | ')}\n`;
    default:
      return hijos;
  }
}

// ── wiki markup → texto plano ────────────────────────────────────────────────
// El changelog guarda `fromString`/`toString` de la descripción en wiki markup de Jira, NO en
// ADF. Al reconstruir a fecha, la descripción vuelve en ese formato; acá se aplana lo justo para
// que se lea (paneles, colores, h1..h6, negritas, listas). No es un conversor completo: lo que
// no reconoce lo deja tal cual, que es mejor que perderlo.
function wikiATexto(s) {
  return String(s ?? '')
    .replace(/\{panel[^}]*\}|\{panel\}|\{color[^}]*\}|\{color\}|\{noformat\}|\{code[^}]*\}|\{code\}/g, '')
    .replace(/^h[1-6]\.\s*/gm, '')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1$2')
    .replace(/\[([^\]|]+)\|([^\]]+)\]/g, '$1 ($2)')
    .replace(/^\s*[#*]+\s+/gm, '- ')
    // Las barras invertidas se dejan tal cual: en estas HU son rutas UNC (`\\servidor\sda\...`),
    // no el salto de línea del wiki markup. Medido en MDC2026-63 el 03-sep-2026.
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── reconstrucción a fecha (ADR-030 § 2.3) ───────────────────────────────────
// Pura: recibe el issue CON `changelog.histories` completo y `fields.comment`, y devuelve el
// issue como estaba en `fecha`. Se recorre el changelog de atrás hacia adelante y cada cambio
// posterior a la fecha se deshace poniendo `fromString`. Sólo los campos de la lista se
// reconstruyen; el resto se REPORTA como no reconstruido, nunca se calla.
const CAMPOS_RECONSTRUIBLES = ['summary', 'description', 'status', 'assignee', 'priority', 'labels', 'IssueParentAssociation', 'Parent'];
function reconstruirAFecha(issue, fecha) {
  const corte = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(corte.getTime())) throw new Error(`fecha inválida: ${fecha}`);
  const creado = new Date(issue.fields?.created ?? 0);
  if (creado > corte) return { existia: false, creado: issue.fields?.created ?? null };

  const f = { ...issue.fields };
  const posteriores = (issue.changelog?.histories ?? [])
    .filter((h) => new Date(h.created) > corte)
    .sort((a, b) => new Date(b.created) - new Date(a.created));   // del más reciente al más viejo

  const revertidos = {};
  const noReconstruidos = new Set();
  let descripcionFormato = f.description ? 'adf' : 'vacia';
  for (const h of posteriores) {
    for (const it of h.items ?? []) {
      const campo = it.field;
      if (!CAMPOS_RECONSTRUIBLES.includes(campo)) { noReconstruidos.add(campo); continue; }
      revertidos[campo] = (revertidos[campo] ?? 0) + 1;
      const de = it.fromString ?? null;
      switch (campo) {
        case 'summary': f.summary = de; break;
        case 'description': f.description = de || null; descripcionFormato = de ? 'wiki' : 'vacia'; break;
        case 'status': f.status = de ? { name: de } : null; break;
        case 'assignee': f.assignee = de ? { displayName: de } : null; break;
        case 'priority': f.priority = de ? { name: de } : null; break;
        case 'labels': f.labels = de ? de.split(/\s+/).filter(Boolean) : []; break;
        case 'IssueParentAssociation':
        case 'Parent': f.parent = de ? { key: de.match(/[A-Z][A-Z0-9]*-\d+/)?.[0] ?? de } : null; break;
      }
    }
  }
  const comentarios = f.comment?.comments ?? [];
  const vigentes = comentarios.filter((c) => new Date(c.created) <= corte);
  f.comment = { comments: vigentes };
  f.updated = posteriores.length ? posteriores[posteriores.length - 1].created : f.updated;

  return {
    existia: true,
    issue: { ...issue, fields: f },
    reconstruido: {
      fecha: corte.toISOString(),
      cambios_posteriores: posteriores.length,
      campos_revertidos: revertidos,
      campos_no_reconstruidos: [...noReconstruidos].sort(),
      comentarios_omitidos: comentarios.length - vigentes.length,
      descripcion_formato: descripcionFormato,
      // Si el changelog vino paginado y no se trajo entero, la reconstrucción es PARCIAL y hay
      // que decirlo: quien llama compara `changelog.total` con lo que tiene.
      changelog_completo: (issue.changelog?.histories?.length ?? 0) >= (issue.changelog?.total ?? 0),
    },
  };
}

// ── formato ──────────────────────────────────────────────────────────────────
const textoDescripcion = (d) => {
  if (!d) return null;
  const t = typeof d === 'string' ? wikiATexto(d) : adfATexto(d);
  return t.replace(/\n{3,}/g, '\n\n').trim() || null;
};
const planoIssue = (i) => ({
  key: i.key,
  tipo: i.fields.issuetype?.name ?? null,
  estado: i.fields.status?.name ?? null,
  prioridad: i.fields.priority?.name ?? null,
  asignado: i.fields.assignee?.displayName ?? null,
  reporter: i.fields.reporter?.displayName ?? null,
  proyecto: i.fields.project ? { key: i.fields.project.key, id: i.fields.project.id, nombre: i.fields.project.name } : null,
  padre: i.fields.parent?.key ?? null,
  creado: i.fields.created ?? null,
  actualizado: i.fields.updated ?? null,
  labels: i.fields.labels ?? [],
  resumen: i.fields.summary ?? null,
  descripcion: textoDescripcion(i.fields.description),
  ...(i.reconstruido ? { reconstruido: i.reconstruido } : {}),
});

function imprimirIssue(p, sangria = '') {
  const s = (t) => console.log(sangria + t);
  s(`${p.key} · ${p.tipo} · ${p.estado}${p.asignado ? ` · ${p.asignado}` : ' · sin asignar'}`);
  s(`  ${p.resumen}`);
  if (p.reconstruido) {
    const r = p.reconstruido;
    s(`  [a fecha ${r.fecha}: ${r.cambios_posteriores} cambio(s) posterior(es) deshechos · descripción ${r.descripcion_formato}`
      + (r.comentarios_omitidos ? ` · ${r.comentarios_omitidos} comentario(s) omitido(s)` : '')
      + (r.campos_no_reconstruidos.length ? ` · NO reconstruidos: ${r.campos_no_reconstruidos.join(', ')}` : '')
      + (r.changelog_completo ? '' : ' · CHANGELOG INCOMPLETO') + ']');
  }
  if (p.descripcion) {
    s('  --- descripción ---');
    for (const l of p.descripcion.split('\n')) s(`  ${l}`);
  } else {
    s('  (sin descripción cargada — el contenido funcional puede vivir en una HU hermana)');
  }
}

// ── flujo principal ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const comoJson = args.includes('--json');
const iFecha = args.indexOf('--a-fecha');
const fechaCruda = iFecha >= 0 ? args[iFecha + 1] : (process.env.JIRA_A_FECHA || null);
const ref = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--a-fecha');
let aFecha = null;
if (fechaCruda) {
  aFecha = new Date(fechaCruda);
  if (Number.isNaN(aFecha.getTime())) {
    console.error(`--a-fecha / JIRA_A_FECHA no es una fecha ISO-8601: '${fechaCruda}'`);
    process.exit(2);
  }
}
// ── sonda de conexión (--sonda) ──────────────────────────────────────────────
// Solo `/myself`: ni JQL, ni issues, ni salida humana. Existe para que `conexion.mjs` pueda
// preguntar "¿contesta Jira?" SIN duplicar el login — el header Basic, la precedencia
// entorno > `.env` y el registro de origen de cada variable viven acá, en un solo lugar. Una
// segunda copia de la autenticación en el sondeador sería una que se queda atrás el día que
// ésta cambie, y las dos seguirían imprimiendo verde. Es el mismo argumento con el que
// `conexion.mjs` delega Oracle en `preflight.mjs`.
//
// `origenesMezclados` es el dato que no se puede reconstruir desde afuera: si el hostname sale
// del `.env` y el token del entorno, un token viejo exportado en el perfil del shell está
// pisando al vigente. Ese 401 se lee como "la HU no existe" y costó una sesión entera de
// diagnóstico el 19-ago-2026.
//
// Salida: JSON por stdout · 0 = responde · 1 = no responde · 2 = faltan credenciales.
// Nunca imprime valores de credenciales: de cada variable se dice de DÓNDE salió, no qué vale.
if (args.includes('--sonda')) {
  if (!cargarEnv()) {
    console.log(JSON.stringify({
      ok: false, motivo: 'faltan-credenciales',
      faltan: VARS.filter((v) => !process.env[v]), origen: origenVar,
    }));
    process.exit(2);
  }
  const yo = await api('/rest/api/3/myself');   // error de red → api() sale 2 con su mensaje
  console.log(JSON.stringify({
    ok: yo.status === 200,
    status: yo.status,
    usuario: yo.status === 200 ? (yo.body?.displayName ?? null) : null,
    hostname: process.env.JIRA_HOSTNAME ?? null,
    origen: origenVar,
    origenesMezclados: origenesMezclados(),
  }));
  process.exit(yo.status === 200 ? 0 : 1);
}

if (!ref) {
  console.error('uso: node jira-hu.mjs <referencia: HU-nnnn | nnnn | CLAVE-nnn> [--json]');
  process.exit(2);
}
if (!cargarEnv()) {
  console.error(`faltan credenciales: exportá ${VARS.join(', ')} o dejalas en un .env (ver env.example).`);
  process.exit(2);
}

// Preflight de credenciales — imprescindible, no cortesía. Con un token inválido, Jira Cloud
// responde a la búsqueda JQL con 200 y cero resultados, y al GET directo con 404 (comportamiento
// anónimo): sin este chequeo, "token malo" se reporta como "la HU no existe", que es el falso
// negativo exacto que esta skill vino a eliminar. Visto en vivo el 19-ago-2026: un token viejo
// exportado en el perfil del shell pisaba al vigente del .env.
const yo = await api('/rest/api/3/myself');
if (yo.status === 401 || yo.status === 403) {
  explicarRechazo(yo.status);
  process.exit(2);
}
if (yo.status !== 200) {
  console.error(`Jira devolvió HTTP ${yo.status} al validar credenciales — no se puede afirmar nada del contenido.`);
  process.exit(2);
}
const conectado = yo.body?.displayName ?? '(desconocido)';

const salida = { referencia: ref, resolucion: null, epicas: [], issue: null, hermanas: [], ...(aFecha ? { a_fecha: aFecha.toISOString() } : {}) };

// Trae UN issue. Sin `--a-fecha` es el GET de siempre. Con ella pide además el changelog —
// paginado si hace falta: `expand=changelog` devuelve hasta 100 entradas y `total` dice si hay
// más— y los comentarios, y devuelve el issue reconstruido. Si el issue no existía a esa fecha
// devuelve `{ status: 'no-existia' }`: quien llama decide qué hacer con eso, pero no lo inventa.
async function traerIssue(key) {
  if (!aFecha) return api(`/rest/api/3/issue/${key}`, { fields: CAMPOS });
  const r = await api(`/rest/api/3/issue/${key}`, { fields: `${CAMPOS},comment`, expand: 'changelog' });
  if (r.status !== 200) return r;
  const cl = r.body.changelog ?? { histories: [], total: 0 };
  let startAt = cl.histories.length;
  while (startAt < (cl.total ?? 0)) {
    const p = await api(`/rest/api/3/issue/${key}/changelog`, { startAt: String(startAt), maxResults: '100' });
    const vals = p.body?.values ?? [];
    if (p.status !== 200 || !vals.length) break;   // se corta: `changelog_completo` lo va a decir
    cl.histories.push(...vals);
    startAt += vals.length;
  }
  r.body.changelog = cl;
  const rec = reconstruirAFecha(r.body, aFecha);
  if (!rec.existia) return { status: 'no-existia', body: r.body, creado: rec.creado };
  return { status: 200, body: { ...rec.issue, reconstruido: rec.reconstruido } };
}
// Con `--a-fecha`, una lista de issues (hermanas, hijas) se re-trae una por una para
// reconstruir cada una; las que no existían a la fecha se descartan y se cuentan.
async function reconstruirLista(issues) {
  if (!aFecha) return issues.map(planoIssue);
  const out = [];
  for (const i of issues) {
    const r = await traerIssue(i.key);
    if (r.status === 200) out.push(planoIssue(r.body));
    else if (r.status === 'no-existia') salida.omitidas_por_fecha = (salida.omitidas_por_fecha ?? 0) + 1;
  }
  return out;
}

// Paso 1 — ¿es una clave Jira real?
if (/^[A-Za-z][A-Za-z0-9]*-\d+$/.test(ref)) {
  const r = await traerIssue(ref.toUpperCase());
  if (r.status === 'no-existia') {
    salida.resolucion = 'no-existia-a-fecha';
    salida.creado = r.creado;
    if (comoJson) console.log(JSON.stringify(salida, null, 2));
    else console.log(`${ref.toUpperCase()} no existía el ${salida.a_fecha}: fue creada el ${r.creado}. No hay contexto que reconstruir.`);
    process.exit(1);
  }
  if (r.status === 200) {
    salida.resolucion = 'clave-directa';
    salida.issue = planoIssue(r.body);
    // La trampa MDC2026-873: descripción vacía con el contenido en una hermana. Si pasa,
    // se traen las demás hijas del mismo padre para no planificar sobre un hueco.
    if (!salida.issue.descripcion && salida.issue.padre) {
      const h = await api('/rest/api/3/search/jql', {
        jql: `parent = ${salida.issue.padre} AND key != ${salida.issue.key}`,
        fields: CAMPOS,
        maxResults: '20',
      });
      salida.hermanas = await reconstruirLista(h.body?.issues ?? []);
    }
    // La OTRA trampa, medida el 03-sep-2026 (ADR-030 § 1.4): dos HU con el MISMO resumen en el
    // mismo proyecto — MDC2026-64 y MDC2026-267, «[BCR] Generar Conciliación de R3 vs
    // TradeQuery»—, y sólo una tiene código. Buscar por texto encuentra las dos; quien planifica
    // tiene que saber que existe la otra, sobre todo si la suya viene sin descripción. Una JQL
    // por frase, filtrada acá por igualdad exacta del resumen (la búsqueda `~` es difusa).
    const resumen = salida.issue.resumen ?? '';
    const frase = resumen.replace(/\[[^\]]*\]/g, ' ').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
    if (frase && salida.issue.proyecto?.key) {
      const q = await api('/rest/api/3/search/jql', {
        jql: `project = ${salida.issue.proyecto.key} AND summary ~ "\\"${frase}\\"" AND key != ${salida.issue.key}`,
        fields: CAMPOS,
        maxResults: '20',
      });
      const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
      const iguales = (q.body?.issues ?? []).filter((i) => norm(i.fields?.summary) === norm(resumen));
      salida.homonimas = await reconstruirLista(iguales);
    }
  } else if (r.status !== 404) {
    console.error(`Jira devolvió HTTP ${r.status} para ${ref}: ${JSON.stringify(r.body?.errorMessages ?? r.body)}`);
    process.exit(2);
  }
}

// Paso 2 — no era clave (o dio 404): buscar el PEDIDO por número en los resúmenes.
if (!salida.issue) {
  const n = ref.match(/\d+/)?.[0];
  if (!n) {
    console.error(`'${ref}' no es clave Jira ni contiene un número de pedido.`);
    process.exit(1);
  }
  const b = await api('/rest/api/3/search/jql', {
    jql: `summary ~ "${n}" ORDER BY created DESC`,
    fields: 'summary,issuetype,status,project',
    maxResults: '20',
  });
  if (b.status !== 200) {
    // Un error de búsqueda NO es "no hay resultados": tragarlo produce el mismo falso
    // negativo que el preflight de credenciales vino a matar.
    console.error(`la búsqueda JQL devolvió HTTP ${b.status}: ${JSON.stringify(b.body?.errorMessages ?? b.body)}`);
    process.exit(2);
  }
  const candidatos = b.body?.issues ?? [];
  const epicas = candidatos.filter((i) => i.fields.issuetype?.name === 'Epic');
  const base = epicas.length ? epicas : candidatos;
  if (!base.length) {
    console.error(`nada en Jira menciona "${n}" en su resumen. No inventar: si el pedido existe con otro nombre, es UNRESOLVED.`);
    process.exit(1);
  }
  salida.resolucion = epicas.length ? 'pedido→epica' : 'coincidencia-en-resumen';
  for (const e of base) {
    const det = await traerIssue(e.key);
    if (det.status === 'no-existia') { salida.omitidas_por_fecha = (salida.omitidas_por_fecha ?? 0) + 1; continue; }
    const epica = { ...planoIssue(det.status === 200 ? det.body : e), hijas: [] };
    const h = await api('/rest/api/3/search/jql', {
      jql: `parent = ${e.key} ORDER BY created ASC`,
      fields: CAMPOS,
      maxResults: '50',
    });
    epica.hijas = await reconstruirLista(h.body?.issues ?? []);
    salida.epicas.push(epica);
  }
}

// ── salida ───────────────────────────────────────────────────────────────────
if (comoJson) {
  console.log(JSON.stringify(salida, null, 2));
} else if (salida.issue) {
  console.log(`resolución: ${salida.resolucion} (conectado como ${conectado})\n`);
  imprimirIssue(salida.issue);
  if (salida.hermanas.length) {
    console.log('\nHUs hermanas (mismo padre) — revisar acá el contenido que a esta le falta:');
    for (const p of salida.hermanas) {
      console.log('');
      imprimirIssue(p, '  ');
    }
  }
  if (salida.homonimas?.length) {
    console.log('\nHUs HOMÓNIMAS (mismo resumen, mismo proyecto) — dos tickets para un trabajo; decí cuál manda:');
    for (const p of salida.homonimas) {
      console.log('');
      imprimirIssue(p, '  ');
    }
  }
} else {
  console.log(`resolución: ${salida.resolucion} (conectado como ${conectado})\n`);
  for (const e of salida.epicas) {
    console.log(`ÉPICA ${e.key} · ${e.estado} · proyecto ${e.proyecto?.key} (${e.proyecto?.nombre})`);
    console.log(`  ${e.resumen}`);
    console.log(`  hijas: ${e.hijas.length}`);
    for (const p of e.hijas) {
      console.log('');
      imprimirIssue(p, '  ');
    }
    console.log('');
  }
}
process.exit(salida.issue || salida.epicas.length ? 0 : 1);
