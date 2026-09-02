/*
 * main.js — page behaviour: language switching, navigation, scroll effects.
 *
 * The document ships with its Spanish copy already in the markup, so the page
 * is complete before this file runs and a crawler with no JavaScript still
 * sees real content. Switching to English swaps text nodes in place from the
 * dictionary in i18n.js; switching back restores the strings captured on load.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'oo-lang';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ language */

  var original = null; // Spanish strings captured from the DOM on first switch.

  function nodes() { return document.querySelectorAll('[data-i18n], [data-i18n-attr]'); }

  function capture() {
    if (original) return;
    original = new Map();
    nodes().forEach(function (el) {
      var record = { html: el.innerHTML, attrs: {} };
      var spec = el.getAttribute('data-i18n-attr');
      if (spec) {
        spec.split(';').forEach(function (pair) {
          var name = pair.split(':')[0].trim();
          if (name) record.attrs[name] = el.getAttribute(name);
        });
      }
      original.set(el, record);
    });
  }

  function applyLang(lang) {
    capture();
    var dict = (window.I18N && window.I18N[lang]) || null;

    nodes().forEach(function (el) {
      var base = original.get(el);
      var key = el.getAttribute('data-i18n');

      if (key) {
        if (dict && dict[key] !== undefined) el.innerHTML = dict[key];
        else if (base) el.innerHTML = base.html;
      }

      var spec = el.getAttribute('data-i18n-attr');
      if (spec) {
        spec.split(';').forEach(function (pair) {
          var parts = pair.split(':');
          var name = (parts[0] || '').trim();
          var akey = (parts[1] || '').trim();
          if (!name || !akey) return;
          if (dict && dict[akey] !== undefined) el.setAttribute(name, dict[akey]);
          else if (base && base.attrs[name] != null) el.setAttribute(name, base.attrs[name]);
        });
      }
    });

    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
  }

  function initLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    // Spanish is the document's own language; only switch away from it when the
    // visitor asked, or when their browser clearly is not Spanish-speaking.
    var guess = stored || ((navigator.language || 'es').toLowerCase().indexOf('es') === 0 ? 'es' : 'en');
    if (guess === 'en') applyLang('en'); else applyLang('es');

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
    });
  }

  /* ---------------------------------------------------------- navigation */

  function initNav() {
    var nav = document.querySelector('.nav');
    var burger = document.querySelector('.burger');
    var links = document.querySelector('.nav-links');
    var progress = document.querySelector('.progress');
    var toTop = document.querySelector('.to-top');

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle('is-stuck', y > 12);
      if (toTop) toTop.classList.toggle('is-on', y > 700);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          links.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && links.classList.contains('is-open')) {
          links.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          burger.focus();
        }
      });
    }

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }

    // Highlight the section currently occupying the upper half of the viewport.
    var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    if (sections.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* -------------------------------------------------------------- reveal */

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    // Stagger siblings so a grid animates as a wave rather than a slab.
    var groups = {};
    items.forEach(function (el) {
      var parentKey = el.parentNode.getAttribute && el.parentNode.getAttribute('data-stagger');
      if (parentKey !== null && parentKey !== undefined) {
        groups[parentKey] = groups[parentKey] || 0;
        el.style.setProperty('--delay', (groups[parentKey] * 70) + 'ms');
        groups[parentKey]++;
      }
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------- copy mail */

  function initCopyMail() {
    var btn = document.querySelector('.copy-mail');
    if (!btn || !navigator.clipboard) return;
    var label = btn.querySelector('[data-mail-label]');
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(btn.getAttribute('data-mail')).then(function () {
        var was = label.textContent;
        label.textContent = btn.getAttribute('data-copied') || 'Copiado';
        btn.setAttribute('aria-live', 'polite');
        setTimeout(function () { label.textContent = was; }, 1800);
      }).catch(function () { /* clipboard denied — the address is visible anyway */ });
    });
  }

  /* ---------------------------------------------------------------- boot */

  function boot() {
    initLang();
    initNav();
    initReveal();
    initCopyMail();
    document.documentElement.classList.add('js-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
