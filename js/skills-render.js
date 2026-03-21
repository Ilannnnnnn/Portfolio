/**
 * skills-render.js — Rendu dynamique des badges de compétences
 *
 * Lit index.skillsData depuis le fichier de locale actif et injecte
 * les badges dans les conteneurs [data-skill-cat="..."] de la page.
 *
 * Réagit aux changements de langue via MutationObserver sur <html lang>.
 */

(function () {
  'use strict';

  var BADGE_TYPES = {
    ai: 'badge--ai',
    data: 'badge--data',
    network: 'badge--network',
    web: 'badge--web'
  };

  function renderSkillsFromData(data) {
    if (!data || !data.index || !data.index.skillsData) return;
    var skillsData = data.index.skillsData;

    Object.keys(BADGE_TYPES).forEach(function (cat) {
      var container = document.querySelector('[data-skill-cat="' + cat + '"]');
      if (!container || !Array.isArray(skillsData[cat])) return;
      container.innerHTML = skillsData[cat]
        .map(function (skill) {
          return '<span class="badge ' + BADGE_TYPES[cat] + '">' + skill + '</span>';
        })
        .join('');
    });
  }

  function loadAndRender(lang) {
    fetch('locales/' + lang + '.json?v=1')
      .then(function (r) { return r.json(); })
      .then(function (data) { renderSkillsFromData(data); })
      .catch(function (err) {
        console.warn('[skills-render] Impossible de charger les compétences :', err);
      });
  }

  function getCurrentLang() {
    return document.documentElement.getAttribute('lang') || 'fr';
  }

  /* Rendu initial après chargement du DOM */
  function init() {
    loadAndRender(getCurrentLang());

    /* Re-rendu quand la langue change (i18n.js met à jour l'attribut lang) */
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'lang') {
          loadAndRender(getCurrentLang());
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
