import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { esc, safeUrl, filtered, card, render, LABELS } = createRequire(import.meta.url)('./hub.js');

const base = (o) => ({
  id: 'x', name: 'X', kind: 'web', status: 'playable',
  tagline: { es: 'es-t', en: 'en-t' }, description: { es: 'es-d', en: 'en-d' },
  stack: ['A', 'B'], url: 'https://x.dev/', year: 2026, order: 1, ...o,
});

test('esc neutralises markup and quotes', () => {
  assert.equal(esc('<b a="1">&\'</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&#39;&lt;/b&gt;');
});

test('safeUrl only lets https through', () => {
  assert.equal(safeUrl('https://a.dev/'), 'https://a.dev/');
  assert.equal(safeUrl('http://a.dev/'), '');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl(undefined), '');
});

test('filtered sorts by order and filters by status', () => {
  const list = [base({ id: 'b', order: 2, status: 'store' }), base({ id: 'a', order: 1 })];
  assert.deepEqual(filtered(list, 'all').map((p) => p.id), ['a', 'b']);
  assert.deepEqual(filtered(list, 'store').map((p) => p.id), ['b']);
});

test('card renders the language asked for and falls back to Spanish', () => {
  assert.match(card(base({}), 'en', ''), /en-t/);
  assert.match(card(base({ tagline: { es: 'solo-es' } }), 'en', ''), /solo-es/);
});

test('card escapes names and descriptions', () => {
  const html = card(base({ name: '<img src=x onerror=1>', description: { es: 'a & b', en: 'a & b' } }), 'es', '');
  assert.ok(!html.includes('<img src=x'));
  assert.match(html, /a &amp; b/);
});

test('card for a playable project links out safely', () => {
  const html = card(base({}), 'es', '');
  assert.match(html, /href="https:\/\/x\.dev\/"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, new RegExp(LABELS.es.cta.playable));
});

test('card drops an unsafe url instead of linking it', () => {
  const html = card(base({ url: 'javascript:alert(1)' }), 'es', '');
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('<a '));
});

test('coming-soon card has no link at all', () => {
  const html = card(base({ status: 'coming-soon', url: undefined }), 'en', '');
  assert.ok(!html.includes('<a '));
  assert.match(html, /Coming soon/);
});

test('card uses the thumbnail with the base prefix, or a blank tile', () => {
  assert.match(card(base({ thumb: 'assets/img/projects/x.webp' }), 'es', '../'), /src="\.\.\/assets\/img\/projects\/x\.webp"/);
  assert.match(card(base({}), 'es', '../'), /hub-thumb--blank/);
});

test('render shows a message when the filter matches nothing', () => {
  assert.match(render([base({})], 'en', 'store', ''), /No projects in this category/);
});

test('the card badge is singular, unlike the plural filter label', () => {
  assert.match(card(base({}), 'es', ''), />Jugable</);
  assert.match(card(base({}), 'en', ''), />Playable</);
  assert.equal(LABELS.es.status.playable, 'Jugables');
});

test('errorItem is localised and escaped', () => {
  const { errorItem } = createRequire(import.meta.url)('./hub.js');
  assert.match(errorItem('en'), /could not be loaded/);
  assert.match(errorItem('es'), /No se pudo cargar/);
  assert.match(errorItem('xx'), /No se pudo cargar/);
});

test('countText announces how many projects match', () => {
  const { countText } = createRequire(import.meta.url)('./hub.js');
  assert.equal(countText(3, 'es'), '3 proyectos');
  assert.equal(countText(1, 'es'), '1 proyecto');
  assert.equal(countText(2, 'en'), '2 projects');
  assert.equal(countText(1, 'en'), '1 project');
});
