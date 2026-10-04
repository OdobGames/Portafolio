/*
 * hub.js — renders data/projects.json as the project hub.
 *
 * The render functions are pure so they can be tested in Node; the DOM wiring at
 * the bottom only runs in a browser. Text comes from the JSON in both languages
 * and is escaped, URLs are accepted only when they are https.
 */
(function (root) {
  'use strict';

  var STATUS_ORDER = ['all', 'playable', 'store', 'source', 'coming-soon'];

  var LABELS = {
    es: {
      filters: 'Filtrar proyectos',
      status: { all: 'Todos', playable: 'Jugables', store: 'Google Play', source: 'Código', 'coming-soon': 'Próximamente' },
      badge: { playable: 'Jugable', store: 'Google Play', source: 'Código', 'coming-soon': 'Próximamente' },
      count: ['proyecto', 'proyectos'],
      cta: { playable: 'Jugar ahora', store: 'Ver en Google Play', source: 'Ver el código', 'coming-soon': 'Próximamente' },
      empty: 'No hay proyectos en esta categoría.',
      error: 'No se pudo cargar la lista de proyectos. Recarga la página.',
      thumbAlt: 'Captura de '
    },
    en: {
      filters: 'Filter projects',
      status: { all: 'All', playable: 'Playable', store: 'Google Play', source: 'Source', 'coming-soon': 'Coming soon' },
      badge: { playable: 'Playable', store: 'Google Play', source: 'Source', 'coming-soon': 'Coming soon' },
      count: ['project', 'projects'],
      cta: { playable: 'Play now', store: 'View on Google Play', source: 'View the code', 'coming-soon': 'Coming soon' },
      empty: 'No projects in this category.',
      error: 'The project list could not be loaded. Reload the page.',
      thumbAlt: 'Screenshot of '
    }
  };

  var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESCAPES[c]; });
  }

  function safeUrl(u) {
    return typeof u === 'string' && /^https:\/\//.test(u) ? u : '';
  }

  function pick(obj, lang) {
    if (!obj) return '';
    return obj[lang] || obj.es || '';
  }

  function labels(lang) { return LABELS[lang] || LABELS.es; }

  function sorted(list) {
    return list.slice().sort(function (a, b) { return a.order - b.order; });
  }

  function filtered(list, filter) {
    var all = sorted(list);
    if (!filter || filter === 'all') return all;
    return all.filter(function (p) { return p.status === filter; });
  }

  function initials(name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  function card(p, lang, base) {
    var L = labels(lang);
    var url = safeUrl(p.url);
    var thumb = p.thumb
      ? '<img class="hub-thumb" src="' + esc((base || '') + p.thumb) + '" alt="' + esc(L.thumbAlt + p.name) +
        '" width="960" height="540" loading="lazy" decoding="async">'
      : '<div class="hub-thumb hub-thumb--blank" aria-hidden="true"><span>' + esc(initials(p.name)) + '</span></div>';

    var action = (url && p.status !== 'coming-soon')
      ? '<a class="btn btn-primary btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
        '<span>' + esc(L.cta[p.status] || L.cta.playable) + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>'
      : (p.status === 'coming-soon' ? '<span class="hub-soon">' + esc(L.cta['coming-soon']) + '</span>' : '');

    var tags = (p.stack || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');

    return '<li class="hub-item" data-status="' + esc(p.status) + '">' +
      '<article class="hub-card">' + thumb +
      '<div class="hub-body">' +
      '<p class="hub-status hub-status--' + esc(p.status) + '">' + esc(L.badge[p.status] || p.status) + '</p>' +
      '<h2>' + esc(p.name) + '</h2>' +
      '<p class="hub-tagline">' + esc(pick(p.tagline, lang)) + '</p>' +
      '<p class="hub-desc">' + esc(pick(p.description, lang)) + '</p>' +
      '<div class="tags">' + tags + '</div>' +
      '<div class="hub-actions">' + action + '</div>' +
      '</div></article></li>';
  }

  function errorItem(lang) {
    return '<li class="hub-empty">' + esc(labels(lang).error) + '</li>';
  }

  function countText(n, lang) {
    var w = labels(lang).count;
    return n + ' ' + (n === 1 ? w[0] : w[1]);
  }

  function render(list, lang, filter, base) {
    var items = filtered(list, filter);
    if (!items.length) return '<li class="hub-empty">' + esc(labels(lang).empty) + '</li>';
    return items.map(function (p) { return card(p, lang, base); }).join('');
  }

  var api = { LABELS: LABELS, STATUS_ORDER: STATUS_ORDER, esc: esc, safeUrl: safeUrl, filtered: filtered, card: card, render: render, errorItem: errorItem, countText: countText };

  /* ---------------------------------------------------------------- browser */

  function boot() {
    var grid = document.getElementById('hub-grid');
    var bar = document.getElementById('hub-filters');
    if (!grid || !bar) return;

    var count = document.getElementById('hub-count');
    var fallback = document.getElementById('hub-fallback');
    var state = {
      list: null,
      failed: false,
      filter: 'all',
      lang: document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'es'
    };

    function paintFilters() {
      var L = labels(state.lang);
      bar.setAttribute('aria-label', L.filters);
      Array.prototype.forEach.call(bar.querySelectorAll('[data-filter]'), function (btn) {
        var f = btn.getAttribute('data-filter');
        btn.textContent = L.status[f] || f;
        btn.setAttribute('aria-pressed', String(f === state.filter));
      });
    }

    function paint() {
      paintFilters();
      if (state.failed) {
        grid.innerHTML = errorItem(state.lang);
        if (fallback) fallback.hidden = false;
        if (count) count.textContent = '';
        return;
      }
      if (state.list === null) return;
      grid.innerHTML = render(state.list, state.lang, state.filter, '../');
      if (count) count.textContent = countText(filtered(state.list, state.filter).length, state.lang);
    }

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-filter]') : null;
      if (!btn) return;
      state.filter = btn.getAttribute('data-filter');
      paint();
    });

    document.addEventListener('langchange', function (e) {
      state.lang = e.detail && e.detail.lang === 'en' ? 'en' : 'es';
      paint();
    });

    paintFilters();
    fetch('../data/projects.json')
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (data) { state.list = data.projects || []; paint(); })
      .catch(function () { state.failed = true; paint(); });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.HubUI = api;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
