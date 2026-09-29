#!/usr/bin/env node
// jira-hu-comentar.mjs: deja un comentario en una HU o subtarea y, opcionalmente, la mueve de estado.
//
// Por qué existe: el ciclo de AGENTS.md termina cada sesión en un estado explícito (lista para
// review, bloqueada, terminada) y cierra cada HU con el PR y la evidencia. Sin una forma de
// escribirlo en Jira, ese cierre queda sólo en el chat y el equipo no lo ve.
//
// Seguridad: igual que jira-hu-crear. SIN `--aplicar` no escribe nada: valida credenciales, trae la
// issue, lista las transiciones posibles e imprime el comentario y el cambio de estado que haría.
// `--aplicar` sólo con el sí explícito de una persona sobre ESE dry-run.
//
// Uso:
//   node jira-hu-comentar.mjs KAN-nnn --archivo <comentario.md>                        → dry-run
//   node jira-hu-comentar.mjs KAN-nnn --archivo <comentario.md> --estado "En revisión" → dry-run
//   node jira-hu-comentar.mjs KAN-nnn --archivo <comentario.md> [--estado "..."] --aplicar
//   node jira-hu-comentar.mjs KAN-nnn --transiciones                                   → lista estados
//
// `--estado` acepta el nombre de la transición o el del estado destino (sin distinguir mayúsculas).
// El comentario en markdown mínimo (`## título`, `- viñeta`, párrafos), como las descripciones.
//
// Salida: 0 ok · 1 argumentos, issue o estado inválidos · 2 credenciales/red/Jira.

import { readFileSync } from 'node:fs';
import { VARS, cargarEnv, api, explicarRechazo, aADF } from './jira-comun.mjs';

const args = process.argv.slice(2);
const valor = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const aplicar = args.includes('--aplicar');
const soloTransiciones = args.includes('--transiciones');
const clave = args.find((a) => /^[A-Z][A-Z0-9]+-\d+$/.test(a));
const rutaComentario = valor('--archivo');
const estado = valor('--estado');

if (!clave) { console.error('uso: jira-hu-comentar.mjs KAN-nnn --archivo <comentario.md> [--estado "<estado>"] [--aplicar]'); process.exit(1); }
if (!soloTransiciones && !rutaComentario && !estado) { console.error('nada que hacer: pasá --archivo, --estado o --transiciones.'); process.exit(1); }

if (!cargarEnv()) {
  console.error(`faltan credenciales: exportá ${VARS.join(', ')} o dejalas en un .env (ver env.example).`);
  process.exit(2);
}
const yo = await api('/rest/api/3/myself');
if (yo.status === 401 || yo.status === 403) { explicarRechazo(yo.status); process.exit(2); }
if (yo.status !== 200) { console.error(`Jira devolvió HTTP ${yo.status} en /myself.`); process.exit(2); }

const issue = await api(`/rest/api/3/issue/${clave}`, { fields: 'summary,status,issuetype' });
if (issue.status === 404) { console.error(`${clave} no existe o no tenés permiso para verla.`); process.exit(1); }
if (issue.status !== 200) { console.error(`Jira devolvió HTTP ${issue.status} al leer ${clave}.`); process.exit(2); }
const f = issue.body.fields;
console.log(`${clave} · ${f.issuetype?.name} · ${f.status?.name} · ${f.summary}`);

const tr = await api(`/rest/api/3/issue/${clave}/transitions`);
if (tr.status !== 200) { console.error(`Jira devolvió HTTP ${tr.status} al listar transiciones.`); process.exit(2); }
const transiciones = tr.body?.transitions ?? [];

if (soloTransiciones) {
  for (const t of transiciones) console.log(`  "${t.name}" → ${t.to?.name}`);
  process.exit(0);
}

let destino = null;
if (estado) {
  const n = estado.toLowerCase();
  destino = transiciones.find((t) => t.name.toLowerCase() === n || t.to?.name?.toLowerCase() === n);
  if (!destino) {
    console.error(`no hay transición a "${estado}" desde "${f.status?.name}". Posibles:`);
    for (const t of transiciones) console.error(`  "${t.name}" → ${t.to?.name}`);
    process.exit(1);
  }
}

const texto = rutaComentario ? readFileSync(rutaComentario, 'utf8').trim() : '';
if (rutaComentario && !texto) { console.error(`${rutaComentario} está vacío.`); process.exit(1); }

console.log(aplicar ? '\nAPLICANDO:' : '\nDRY-RUN (no se escribió nada; --aplicar sólo con el sí de la persona):');
if (texto) console.log(`\n--- comentario en ${clave} ---\n${texto}\n---`);
if (destino) console.log(`estado: "${f.status?.name}" → "${destino.to?.name}" (transición "${destino.name}")`);
if (!aplicar) process.exit(0);

if (texto) {
  const c = await api(`/rest/api/3/issue/${clave}/comment`, {}, { method: 'POST', body: { body: aADF(texto) } });
  if (c.status !== 201) { console.error(`no se pudo comentar: HTTP ${c.status} ${JSON.stringify(c.body?.errorMessages ?? c.body?.errors ?? '')}`); process.exit(2); }
  console.log(`comentario creado (id ${c.body?.id}).`);
}
if (destino) {
  const t = await api(`/rest/api/3/issue/${clave}/transitions`, {}, { method: 'POST', body: { transition: { id: destino.id } } });
  if (t.status !== 204) { console.error(`no se pudo mover el estado: HTTP ${t.status} ${JSON.stringify(t.body?.errorMessages ?? t.body?.errors ?? '')}`); process.exit(2); }
  console.log(`${clave} → ${destino.to?.name}.`);
}
