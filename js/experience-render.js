/**
 * experience-render.js — Rendu dynamique de la timeline d'expériences
 * Lit index.experiences (array) depuis la locale active et injecte
 * les entrées dans #timeline-container.
 */
(function () {
  'use strict';

  var PIN_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  function renderExperiences(data) {
    var container = document.getElementById('timeline-container');
    if (!container) return;
    var exps = data && data.index && data.index.experiences;
    if (!Array.isArray(exps)) return;

    container.innerHTML = exps.map(function (exp, i) {
      /* Note: reveal class added — initScrollReveal() called after */
      var delay = (i * 0.15).toFixed(2) + 's';
      return (
        '<article class="timeline-item reveal" style="--delay:' + delay + '">' +
          '<div class="timeline-item__dot" aria-hidden="true">' +
            '<span class="timeline-item__initials">' + (exp.initials || '') + '</span>' +
          '</div>' +
          '<div class="timeline-item__content">' +
            '<div class="timeline-item__header">' +
              '<h3 class="timeline-item__title">' + (exp.title || '') + '</h3>' +
              '<span class="timeline-item__company">' + (exp.company || '') + '</span>' +
            '</div>' +
            '<div class="timeline-item__meta">' +
              '<span class="timeline-item__location">' +
                PIN_SVG +
                (exp.location || '') +
              '</span>' +
              '<span class="timeline-item__dates">' + (exp.dates || '') + '</span>' +
            '</div>' +
            '<p class="timeline-item__desc">' + (exp.desc || '') + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function loadAndRender(lang) {
    fetch('locales/' + lang + '.json?v=3')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderExperiences(data);
        /* Re-register newly added .reveal elements with the scroll observer */
        if (typeof initScrollReveal === 'function') initScrollReveal();
      })
      .catch(function (err) {
        console.warn('[experience-render] Erreur de chargement :', err);
      });
  }

  function init() {
    loadAndRender(document.documentElement.getAttribute('lang') || 'fr');
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'lang') {
          loadAndRender(document.documentElement.getAttribute('lang') || 'fr');
        }
      });
    }).observe(document.documentElement, { attributes: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
