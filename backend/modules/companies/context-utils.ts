import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { AppError } from '../../shared/errors/AppError';

const inflateRaw = promisify(zlib.inflateRaw);

export const CONTEXT_EXTRACTOR_VERSION = 'company-context-v1';
export const MAX_CONTEXT_FILE_BYTES = Number(process.env.CONTEXT_SOURCE_MAX_BYTES ?? 20 * 1024 * 1024);
export const MAX_WEB_BYTES = Number(process.env.CONTEXT_WEB_MAX_BYTES ?? 1_500_000);
export const WEB_TIMEOUT_MS = Number(process.env.CONTEXT_WEB_TIMEOUT_MS ?? 10_000);
export const WEB_MAX_REDIRECTS = Number(process.env.CONTEXT_WEB_MAX_REDIRECTS ?? 3);

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'empresa';
}

export function sha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function normalizeDomain(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isPrivateIp(ip: string): boolean {
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1') return true;
  if (ip === '169.254.169.254') return true;
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return true;
}

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw AppError.badRequest('URL invalida.', 'CONTEXT_URL_INVALID');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw AppError.badRequest('Solo se permiten URLs http o https.', 'CONTEXT_URL_SCHEME');
  }
  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw AppError.badRequest('La URL no puede apuntar a redes privadas.', 'CONTEXT_URL_BLOCKED');
  }
  return url;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function pageTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? stripHtml(match[1]).slice(0, 200) : null;
}

function candidateInternalLinks(base: URL, html: string): string[] {
  const keywords = /(about|nosotros|cultura|innovacion|innovaci[oó]n|servicios|empresa|quienes|quienes-somos)/i;
  const links = new Set<string>();
  const re = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const next = new URL(match[1], base);
      if (next.hostname !== base.hostname) continue;
      if (!keywords.test(next.pathname)) continue;
      next.hash = '';
      links.add(next.toString());
      if (links.size >= 4) break;
    } catch {
      // Ignore invalid links.
    }
  }
  return [...links];
}

async function fetchOne(url: URL): Promise<{ finalUrl: string; raw: string; title: string | null; contentType: string | null }> {
  let current = url;
  for (let redirects = 0; redirects <= WEB_MAX_REDIRECTS; redirects += 1) {
    await assertPublicHttpUrl(current.toString());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEB_TIMEOUT_MS);
    const response = await fetch(current, { redirect: 'manual', signal: controller.signal });
    clearTimeout(timer);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) break;
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) {
      throw AppError.badRequest('No fue posible analizar automaticamente esta fuente.', 'CONTEXT_WEB_FETCH_FAILED', {
        hint: `HTTP ${response.status}`,
      });
    }

    const contentType = response.headers.get('content-type');
    const reader = response.body?.getReader();
    if (!reader) {
      throw AppError.badRequest('La fuente no entrego contenido legible.', 'CONTEXT_WEB_EMPTY');
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_WEB_BYTES) {
        throw AppError.badRequest('La pagina excede el limite de tamano.', 'CONTEXT_WEB_TOO_LARGE');
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    return { finalUrl: current.toString(), raw, title: pageTitle(raw), contentType };
  }
  throw AppError.badRequest('La URL redirige demasiadas veces.', 'CONTEXT_WEB_REDIRECT_LIMIT');
}

export async function fetchPublicWebsite(rawUrl: string): Promise<{
  rawContent: string;
  cleanContent: string;
  metadata: Record<string, unknown>;
}> {
  const start = await assertPublicHttpUrl(rawUrl);
  const first = await fetchOne(start);
  const links = candidateInternalLinks(new URL(first.finalUrl), first.raw);
  const pages = [first];
  for (const link of links) {
    try {
      pages.push(await fetchOne(new URL(link)));
    } catch {
      // Controlled best effort: homepage remains useful when an internal page fails.
    }
  }
  const cleanPages = pages.map((page) => stripHtml(page.raw)).filter(Boolean);
  return {
    rawContent: pages.map((page) => page.raw).join('\n\n--- PAGE ---\n\n').slice(0, MAX_WEB_BYTES),
    cleanContent: cleanPages.join('\n\n').slice(0, MAX_WEB_BYTES),
    metadata: {
      fetchedAt: new Date().toISOString(),
      finalUrl: first.finalUrl,
      title: first.title,
      contentType: first.contentType,
      pages: pages.map((page) => ({ url: page.finalUrl, title: page.title })),
    },
  };
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!base || base === '.' || base === '..') return 'context-source';
  return base.slice(0, 180);
}

export function detectContextMime(fileName: string, declared: string | undefined, bytes: Buffer): string {
  const lower = fileName.toLowerCase();
  const declaredMime = (declared ?? '').split(';')[0].trim().toLowerCase();
  if (bytes.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (lower.endsWith('.md') || declaredMime === 'text/markdown' || declaredMime === 'text/plain') return 'text/markdown';
  if (lower.endsWith('.docx') && bytes.subarray(0, 2).toString('latin1') === 'PK') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.doc')) {
    throw AppError.badRequest('DOC binario no esta soportado sin conversion segura. Sube DOCX, PDF o Markdown.', 'CONTEXT_DOC_UNSUPPORTED');
  }
  throw AppError.badRequest('Formato no soportado. Sube PDF, DOCX o Markdown.', 'CONTEXT_FILE_TYPE_UNSUPPORTED');
}

function readZipEntries(bytes: Buffer): Array<{ name: string; data: Buffer }> {
  const entries: Array<{ name: string; data: Buffer }> = [];
  let offset = 0;
  while (offset < bytes.length - 30) {
    const signature = bytes.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = bytes.readUInt16LE(offset + 8);
    const compressedSize = bytes.readUInt32LE(offset + 18);
    const fileNameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = bytes.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    const data = bytes.subarray(dataStart, dataStart + compressedSize);
    entries.push({ name, data: method === 0 ? data : data });
    offset = dataStart + compressedSize;
  }
  return entries;
}

export async function extractDocxText(bytes: Buffer): Promise<string> {
  const entry = readZipEntries(bytes).find((item) => item.name === 'word/document.xml');
  if (!entry) return '';
  let xml: Buffer;
  try {
    xml = await inflateRaw(entry.data);
  } catch {
    xml = entry.data;
  }
  return xml
    .toString('utf8')
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export async function saveContextFile(rootDir: string, companyId: string, sourceId: string, fileName: string, bytes: Buffer): Promise<string> {
  const safeCompany = companyId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeSource = sourceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFile = sanitizeFileName(fileName);
  const key = path.posix.join('context-sources', safeCompany, safeSource, safeFile);
  const absRoot = path.resolve(rootDir);
  const abs = path.resolve(absRoot, key);
  if (!abs.startsWith(absRoot + path.sep) && abs !== absRoot) {
    throw AppError.badRequest('Ruta de archivo invalida.', 'CONTEXT_FILE_PATH_INVALID');
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, bytes);
  return key;
}

export async function readContextFile(rootDir: string, storageKey: string): Promise<Buffer> {
  const absRoot = path.resolve(rootDir);
  const abs = path.resolve(absRoot, storageKey);
  if (!abs.startsWith(absRoot + path.sep) && abs !== absRoot) {
    throw AppError.badRequest('Ruta de archivo invalida.', 'CONTEXT_FILE_PATH_INVALID');
  }
  return fs.readFile(abs);
}
