#!/usr/bin/env node
// jev-clasificar.mjs: paso 1 de /hu. Clasifica un pedido en pregunta | acotado | grande con Jev.
//
// Sigue la regla de docs/analisis-jev/99-donde-no-aplica.md: si el resultado se ELIGE entre
// opciones cerradas es Jev; si se DERIVA de otros resultados es código. Por eso a Jev no se le
// pregunta "¿es grande?": se le hacen preguntas atómicas (una cosa cada una, juicio de segundos)
// y la clase se deriva acá, en código, donde el criterio se lee y se cambia sin tocar un prompt.
//
// Jev sólo ve el TEXTO del pedido. No ve el repo: "toca un flujo que ya existe" es lo que el
// texto sugiere, y el agente lo verifica con Grep/Glob antes de la entrevista.
//
// Seguridad: la clasificación es una PROPUESTA que se anuncia en voz alta y la persona corrige.
// Si hay duda (confianza baja o un sí/no cerca de 0.5) se toma la clase más pesada, que es la
// regla de /hu. Si Jev falla, sale 2 y /hu clasifica a mano: nunca bloquea el flujo.
//
// Uso:   node jev-clasificar.mjs "<el pedido>"      (o por stdin)   [--json]
// Clave: JEV_API_KEY (o TYPESAFE_API_KEY), del entorno o del .env ($JIRA_ENV_FILE, junto al
//        script, o subiendo desde el cwd; lo exportado gana).
// Salida: 0 clasificado · 1 sin pedido · 2 sin clave, red o respuesta inválida.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.typesafe.ai/v1/systemone';
const MODELO = process.env.JEV_MODEL || 'jev-latest';

// Cortes sin calibrar, igual que ai-service/harness/jev.py (ADR-031: 0.50 es provisional).
// Cambian cuando haya pedidos reales etiquetados contra la clase que la persona terminó eligiendo.
const CONF_MIN = 0.5;        // por debajo, la respuesta Choice/Score no decide nada
const NOUL_SI = 0.65;        // un sí/no entre NOUL_NO y NOUL_SI es "no sabe"
const NOUL_NO = 0.35;

// ── clave ────────────────────────────────────────────────────────────────────
function cargarClave() {
  if (process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY) return;
  const cands = [process.env.JIRA_ENV_FILE, join(dirname(fileURLToPath(import.meta.url)), '.env')];
  let d = process.cwd();
  for (let i = 0; i < 6; i++) { cands.push(join(d, '.env')); const p = dirname(d); if (p === d) break; d = p; }
  for (const f of cands.filter(Boolean)) {
    if (!existsSync(f)) continue;
    for (const l of readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*(?:export\s+)?(JEV_API_KEY|TYPESAFE_API_KEY)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
    if (process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY) return;
  }
}

// ── las preguntas atómicas ───────────────────────────────────────────────────
// Redactadas para que un sí alto signifique lo que se nombra (recomendación de la doc de Noul, docs.typesafe.ai/primitives/noul).
const PREGUNTAS = {
  es_pregunta: {
    type: 'noul',
    instructions: 'El pedido busca una respuesta o una averiguación (si se puede, cuánto cuesta, cómo funciona), no un cambio que quede en el producto',
  },
  flujo_existente: {
    type: 'noul',
    instructions: 'El pedido modifica una pantalla, flujo o comportamiento que ya existe en el producto',
  },
  capacidad_nueva: {
    type: 'noul',
    instructions: 'El pedido introduce una capacidad, módulo o subsistema que hoy no existe en el producto',
  },
  interfaz_compartida: {
    type: 'noul',
    instructions: 'El pedido cambia algo de lo que dependen otras partes: un contrato, una API, un esquema de datos o una regla central del producto',
  },
  capas: {
    type: 'choice',
    instructions: 'Cuántas capas del sistema tiene que tocar el pedido',
    criteria: {
      una: 'Una sola capa: solo interfaz, solo backend, solo IA, o solo documentación',
      dos: 'Dos capas, por ejemplo interfaz y backend',
      tres_o_mas: 'Tres o más capas a la vez: interfaz, backend, datos e IA',
    },
  },
  frente: {
    type: 'choice',
    instructions: 'Qué frente domina el pedido',
    criteria: {
      funcional: 'Producto: qué debe pasar para el usuario, reglas de negocio, criterios',
      tecnica: 'Desarrollo: cómo está construido, rendimiento, infraestructura, deuda técnica',
      ambos: 'Los dos pesan parecido',
    },
  },
  claridad: {
    type: 'score',
    instructions: 'Qué tan claro está el pedido para escribir su historia de usuario',
    criteria: [
      'vago: no se sabe quién lo necesita ni para qué',
      'parcial: se sabe qué se quiere pero faltan actor, alcance o cómo se sabría que está bien',
      'claro: tiene actor, objetivo y algo verificable',
    ],
  },
};

// ── pedido ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const comoJson = args.includes('--json');
let pedido = args.filter((a) => !a.startsWith('--')).join(' ').trim();
if (!pedido && !process.stdin.isTTY) pedido = readFileSync(0, 'utf8').trim();
if (!pedido) { console.error('uso: node jev-clasificar.mjs "<el pedido>" [--json]'); process.exit(1); }

cargarClave();
const clave = process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY;
if (!clave) { console.error('falta JEV_API_KEY: /hu sigue clasificando a mano.'); process.exit(2); }

let body;
try {
  const r = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: `Pedido para el equipo de Starteria:\n${pedido}`, model: MODELO, questions: PREGUNTAS }),
    signal: AbortSignal.timeout(30000),
  });
  body = await r.json().catch(() => null);
  if (r.status !== 200) { console.error(`Jev devolvió HTTP ${r.status}: ${JSON.stringify(body).slice(0, 300)}`); process.exit(2); }
} catch (e) {
  console.error(`Jev no respondió (${e.message}): /hu sigue clasificando a mano.`);
  process.exit(2);
}
const a = body?.answers;
if (!a || typeof a !== 'object') { console.error('Jev respondió sin `answers`.'); process.exit(2); }

// ── derivar en código ────────────────────────────────────────────────────────
const si = (k) => Number(a[k]?.noul ?? 0.5);
const incierto = (k) => si(k) > NOUL_NO && si(k) < NOUL_SI;
const eleccion = (k) => ({ v: a[k]?.choice ?? null, c: Number(a[k]?.confidence ?? 0) });
const capas = eleccion('capas');
const frente = eleccion('frente');
const claridadIdx = Math.round(Number(a.claridad?.score ?? 0));
const claridad = ['vago', 'parcial', 'claro'][Math.max(0, Math.min(2, claridadIdx))];

const motivos = [];
const dudas = [];
let clase;
const grandePor = [];
if (si('capacidad_nueva') >= NOUL_SI) grandePor.push('introduce una capacidad nueva');
if (si('interfaz_compartida') >= NOUL_SI) grandePor.push('cambia algo de lo que dependen otras partes');
if (capas.v === 'tres_o_mas' && capas.c >= CONF_MIN) grandePor.push('toca tres o más capas');

if (grandePor.length) {
  clase = 'grande';
  motivos.push(...grandePor);
} else if (si('es_pregunta') >= NOUL_SI) {
  clase = 'pregunta';
  motivos.push('busca una respuesta, no un cambio que quede');
} else {
  clase = 'acotado';
  if (si('flujo_existente') >= NOUL_SI) motivos.push('modifica algo que ya existe');
  else dudas.push('el texto no deja claro que el flujo ya exista: si no existe, no es acotado');
}
for (const k of ['capacidad_nueva', 'interfaz_compartida', 'es_pregunta', 'flujo_existente']) {
  if (incierto(k)) dudas.push(`${k} = ${si(k).toFixed(2)} (ni sí ni no)`);
}
if (capas.c < CONF_MIN) dudas.push(`capas incierta (confianza ${capas.c.toFixed(2)})`);

// Regla de /hu: si hay duda, el más pesado. Una duda nunca baja la clase.
const orden = ['pregunta', 'acotado', 'grande'];
let propuesta = clase;
if (dudas.length && clase !== 'grande') propuesta = orden[orden.indexOf(clase) + 1];

const salida = {
  pedido,
  clase: propuesta,
  clase_sin_ajuste: clase,
  subio_por_duda: propuesta !== clase,
  motivos,
  dudas,
  frente: frente.c >= CONF_MIN ? frente.v : 'ambos',
  claridad,
  respuestas: Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v?.noul ?? v?.choice ?? v?.score ?? null])),
  confianzas: { capas: capas.c, frente: frente.c, claridad: Number(a.claridad?.confidence ?? 0) },
  modelo: body.model ?? MODELO,
};

if (comoJson) {
  console.log(JSON.stringify(salida, null, 2));
} else {
  console.log(`clase propuesta: ${salida.clase}${salida.subio_por_duda ? ` (subida desde ${clase} por duda)` : ''}`);
  if (motivos.length) console.log(`  por qué: ${motivos.join('; ')}`);
  for (const d of dudas) console.log(`  duda: ${d}`);
  console.log(`frente dominante: ${salida.frente} · claridad: ${claridad}`);
  console.log(`\nrespuestas crudas: ${JSON.stringify(salida.respuestas)}`);
  console.log('Es una propuesta: anunciala y dejá que la persona la corrija.');
}
process.exit(0);
