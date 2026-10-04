// Verificador del sitio. Sin dependencias: `node tools/check.mjs`.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const KINDS = ['web', 'android', 'pc'];
const STATUSES = ['playable', 'store', 'source', 'coming-soon'];
const ALLOWED_EMAILS = ['13odob27@gmail.com'];

// The private patterns are assembled at run time so this file does not contain the very
// strings it forbids (the checker also scans tools/).
const j = (...parts) => parts.join('');
const FORBIDDEN = [
  { re: new RegExp(j('C:\\\\', 'Users'), 'i'), why: 'ruta local de Windows' },
  { re: /Documents[\\/]/, why: 'carpeta local de Documents' },
  { re: new RegExp(j('local', 'Path', '|registry\\.', 'local')), why: 'referencia al registro local' },
  { re: new RegExp(j('oordon', 'ezb')), why: 'correo antiguo del CV' },
  { re: new RegExp(j('PASW', 'ORD|secretos\\.', 'env|dian\\.', 'env|\\.cred', 'entials'), 'i'), why: 'nombre de archivo de credenciales' },
];

export function htmlKeys(html) {
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) keys.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) {
      const key = pair.split(':')[1];
      if (key && key.trim()) keys.add(key.trim());
    }
  }
  return keys;
}

export function dictKeys(js) {
  const keys = new Set();
  for (const m of js.matchAll(/^\s*'([^']+)'\s*:/gm)) keys.add(m[1]);
  return keys;
}

export function parity(used, defined) {
  return {
    missing: [...used].filter((k) => !defined.has(k)).sort(),
    orphan: [...defined].filter((k) => !used.has(k)).sort(),
  };
}

export function validateProjects(data) {
  if (!data || !Array.isArray(data.projects)) return ['projects debe ser un arreglo'];
  const errors = [];
  const ids = new Set();
  data.projects.forEach((p, i) => {
    const at = `projects[${i}] (${p && p.id})`;
    if (!p || typeof p !== 'object') { errors.push(`${at}: no es un objeto`); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id || '')) errors.push(`${at}: id inválido`);
    if (ids.has(p.id)) errors.push(`${at}: id repetido`);
    ids.add(p.id);
    if (!p.name || typeof p.name !== 'string') errors.push(`${at}: falta name`);
    if (!KINDS.includes(p.kind)) errors.push(`${at}: kind inválido`);
    if (!STATUSES.includes(p.status)) errors.push(`${at}: status inválido`);
    for (const field of ['tagline', 'description']) {
      for (const lang of ['es', 'en']) {
        const v = p[field] && p[field][lang];
        if (typeof v !== 'string' || !v.trim()) errors.push(`${at}: falta ${field}.${lang}`);
      }
    }
    if (!Array.isArray(p.stack) || p.stack.length === 0) errors.push(`${at}: stack vacío`);
    if (p.status === 'coming-soon') {
      if (p.url) errors.push(`${at}: coming-soon no puede tener url`);
    } else if (!/^https:\/\//.test(p.url || '')) {
      errors.push(`${at}: url https obligatoria`);
    }
    if (p.thumb && !/^assets\/img\/projects\/[a-z0-9-]+\.webp$/.test(p.thumb)) {
      errors.push(`${at}: thumb inválido`);
    }
    if (!Number.isInteger(p.order)) errors.push(`${at}: order debe ser entero`);
  });
  return errors;
}

export function findForbidden(files) {
  const hits = [];
  for (const f of files) {
    for (const rule of FORBIDDEN) {
      const m = rule.re.exec(f.text);
      if (m) hits.push({ path: f.path, why: rule.why, match: m[0] });
    }
  }
  return hits;
}

export function findEmails(files, allowed) {
  const hits = [];
  for (const f of files) {
    for (const m of f.text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
      if (!allowed.includes(m[0])) hits.push({ path: f.path, email: m[0] });
    }
  }
  return hits;
}

/* ------------------------------------------------------------------- CLI -- */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', '.hub', '.wrangler', '.claude', 'node_modules'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(html|js|mjs|css|json|xml|txt|md|webmanifest|tex)$/.test(name)) out.push(full);
  }
  return out;
}

function main() {
  const root = join(fileURLToPath(import.meta.url), '..', '..');
  const read = (p) => readFileSync(join(root, p), 'utf8');
  const problems = [];

  const pages = ['index.html', 'juegos/index.html'].filter((p) => existsSync(join(root, p)));
  const used = new Set();
  for (const p of pages) for (const k of htmlKeys(read(p))) used.add(k);
  const { missing, orphan } = parity(used, dictKeys(read('assets/js/i18n.js')));
  missing.forEach((k) => problems.push(`i18n: falta en inglés la clave "${k}"`));
  orphan.forEach((k) => problems.push(`i18n: clave sin uso "${k}"`));

  if (existsSync(join(root, 'data/projects.json'))) {
    const data = JSON.parse(read('data/projects.json'));
    validateProjects(data).forEach((e) => problems.push(`projects.json: ${e}`));
    for (const p of data.projects || []) {
      if (p.thumb && !existsSync(join(root, p.thumb))) problems.push(`projects.json: no existe ${p.thumb}`);
    }
  }

  const files = walk(root).map((f) => ({ path: relative(root, f), text: readFileSync(f, 'utf8') }));
  findForbidden(files).forEach((h) => problems.push(`${h.path}: ${h.why} ("${h.match}")`));
  findEmails(files, ALLOWED_EMAILS).forEach((h) => problems.push(`${h.path}: correo no permitido ${h.email}`));

  if (problems.length) {
    console.error(problems.join('\n'));
    console.error(`\n${problems.length} problema(s).`);
    process.exit(1);
  }
  console.log('check: todo en orden.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
