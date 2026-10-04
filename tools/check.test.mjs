import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  htmlKeys, dictKeys, parity, validateProjects, findForbidden, findEmails,
} from './check.mjs';

test('htmlKeys reads data-i18n and data-i18n-attr pairs', () => {
  const html = '<p data-i18n="a.b">x</p><a data-i18n-attr="href:cv.file;aria-label:a11y.top"></a>';
  assert.deepEqual([...htmlKeys(html)].sort(), ['a.b', 'a11y.top', 'cv.file']);
});

test('dictKeys reads quoted keys at line start only', () => {
  const js = "window.I18N = { en: {\n  'a.b': 'x',\n  'c.d': \"it's 'e.f': no\",\n} };";
  assert.deepEqual([...dictKeys(js)].sort(), ['a.b', 'c.d']);
});

test('parity reports missing and orphan keys', () => {
  const r = parity(new Set(['a', 'b']), new Set(['b', 'c']));
  assert.deepEqual(r, { missing: ['a'], orphan: ['c'] });
});

const good = {
  id: 'lvl0', name: 'No Familiar Place', kind: 'web', status: 'playable',
  tagline: { es: 'a', en: 'b' }, description: { es: 'c', en: 'd' },
  stack: ['Three.js'], url: 'https://x.pages.dev/', thumb: 'assets/img/projects/lvl0.webp',
  year: 2026, order: 10,
};

test('validateProjects accepts a valid project', () => {
  assert.deepEqual(validateProjects({ projects: [good] }), []);
});

test('validateProjects flags each broken rule', () => {
  const bad = [
    { ...good, id: 'Bad Id' },
    { ...good, id: 'ok2', tagline: { es: 'a' } },
    { ...good, id: 'ok3', url: 'http://x.dev/' },
    { ...good, id: 'ok4', url: 'javascript:alert(1)' },
    { ...good, id: 'ok5', status: 'coming-soon' },
    { ...good, id: 'ok6', kind: 'ps5' },
    { ...good, id: 'ok7', stack: [] },
    { ...good, id: 'ok8', thumb: '../../secret.png' },
    { ...good, id: 'lvl0' },
  ];
  const errors = validateProjects({ projects: [good, ...bad] });
  for (const needle of ['id inválido', 'tagline.en', 'url https', 'coming-soon no puede tener url',
    'kind inválido', 'stack vacío', 'thumb inválido', 'id repetido']) {
    assert.ok(errors.some((e) => e.includes(needle)), `missing error: ${needle}\n${errors.join('\n')}`);
  }
});

test('validateProjects rejects a non-array root', () => {
  assert.equal(validateProjects({}).length, 1);
});

// Fixtures are assembled at run time: this file is scanned by the checker itself.
const j = (...parts) => parts.join('');

test('findForbidden catches local paths and the old email', () => {
  const hits = findForbidden([
    { path: 'a.html', text: j('ver C:\\', 'Users', '\\someone\\x') },
    { path: 'b.json', text: j('{"local', 'Path":"x"}') },
    { path: 'c.tex', text: j('oordon', 'ezb') },
    { path: 'd.html', text: 'https://unal.edu.co/ está bien' },
  ]);
  assert.deepEqual(hits.map((h) => h.path).sort(), ['a.html', 'b.json', 'c.tex']);
});

test('findEmails flags addresses outside the allowed list', () => {
  const other = j('otro', '@example.com');
  const hits = findEmails(
    [{ path: 'a', text: j('mailto:13odob27', '@gmail.com y ', other) }],
    [j('13odob27', '@gmail.com')],
  );
  assert.deepEqual(hits, [{ path: 'a', email: other }]);
});
