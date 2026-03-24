/**
 * skills-render.js — Rendu dynamique des compétences
 * Lit index.skillsCategories (array) depuis la locale active et injecte
 * les catégories + badges dans #skills-grid.
 */
(function () {
  'use strict';

  var PIN_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  function renderSkillsFromData(data) {
    var grid = document.getElementById('skills-grid');
    if (!grid) return;
    var cats = data && data.index && data.index.skillsCategories;
    if (!Array.isArray(cats)) return;

    var catDelay = 0;
    grid.innerHTML = cats.map(function (cat, i) {
      var delay = (i * 0.1).toFixed(1) + 's';
      var badges = (cat.skills || []).map(function (s) {
        return '<span class="badge badge--' + (cat.type || 'ai') + '">' + s + '</span>';
      }).join('');
      return (
        '<div class="skill-category">' +
          '<h3 class="skill-category__title skill-category__title--' + (cat.type || 'ai') + '">' + cat.label + '</h3>' +
          '<div class="skill-badges">' + badges + '</div>' +
        '</div>'
      );
    }).join('');

    /* Extra projects (projets ajoutés via admin) */
    renderExtraProjects(data);
  }

  function renderExtraProjects(data) {
    var grid = document.getElementById('extra-projects-grid');
    if (!grid) return;
    var projects = data && data.index && data.index.extraProjects;
    if (!Array.isArray(projects) || !projects.length) return;

    grid.innerHTML = projects.map(function (p, i) {
      var delay = (i * 0.15).toFixed(2) + 's';
      var tags  = (p.tags || []).map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('');
      var links = '';
      if (p.github) {
        links += '<a href="' + p.github + '" class="project-link project-link--github" target="_blank" rel="noopener">GitHub</a>';
      }
      if (p.demo) {
        links += '<a href="' + p.demo + '" class="project-link project-link--demo" target="_blank" rel="noopener">Démo</a>';
      }
      return (
        '<article class="project-card">' +
          '<div class="project-card__header">' +
            '<span class="project-card__icon" aria-hidden="true">' + (p.icon || '🚀') + '</span>' +
            '<h3 class="project-card__title">' + (p.title || '') + '</h3>' +
          '</div>' +
          '<p class="project-card__desc">' + (p.desc || '') + '</p>' +
          '<div class="project-card__tags" aria-label="Technologies">' + tags + '</div>' +
          (links ? '<div class="project-card__links">' + links + '</div>' : '') +
        '</article>'
      );
    }).join('');
  }

  function loadAndRender(lang) {
    fetch('locales/' + lang + '.json?v=3')
      .then(function (r) { return r.json(); })
      .then(function (data) { renderSkillsFromData(data); })
      .catch(function (err) {
        console.warn('[skills-render] Erreur de chargement :', err);
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
