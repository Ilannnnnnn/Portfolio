/**
 * i18n.js — Moteur de traduction FR/EN
 *
 * - Charge les traductions depuis locales/{lang}.json (fetch async)
 * - Supporte data-i18n  → textContent  (texte brut)
 * - Supporte data-i18n-html → innerHTML  (texte avec balises HTML)
 * - Clés imbriquées via notation pointée : "common.backToPortfolio"
 * - Cache en mémoire : la 2e langue ne re-fetche pas
 * - Persiste le choix dans localStorage
 *
 * ⚠️  Nécessite un serveur HTTP pour fonctionner (GitHub Pages, Live Server…).
 *     L'ouverture directe en file:// bloquera le fetch — utilise Live Server en local.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'portfolio-lang';
  var cache = {};

  /* --------------------------------------------------
     Résolution d'une clé imbriquée
     ex : "fitia.context1" → obj["fitia"]["context1"]
  -------------------------------------------------- */
  function resolve(obj, dotKey) {
    return dotKey.split('.').reduce(function (o, k) {
      return o != null && o[k] !== undefined ? o[k] : undefined;
    }, obj);
  }

  /* --------------------------------------------------
     Injection des traductions dans le DOM
  -------------------------------------------------- */
  function applyTranslations(data) {
    /* Texte brut — data-i18n */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = resolve(data, el.getAttribute('data-i18n'));
      if (val === undefined) return;
      if (el.tagName === 'TITLE') {
        document.title = val;
      } else {
        el.textContent = val;
      }
    });

    /* HTML riche — data-i18n-html (pour les éléments avec <strong>, etc.) */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var val = resolve(data, el.getAttribute('data-i18n-html'));
      if (val !== undefined) el.innerHTML = val;
    });
  }

  /* --------------------------------------------------
     Mise à jour de l'UI (boutons, attribut lang, storage)
  -------------------------------------------------- */
  function updateUI(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('.lang-bar__btn').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    localStorage.setItem(STORAGE_KEY, lang);
  }

  /* --------------------------------------------------
     Changement de langue (public)
  -------------------------------------------------- */
  function setLanguage(lang) {
    if (lang !== 'fr' && lang !== 'en') lang = 'fr';

    /* Cache hit → application immédiate */
    if (cache[lang]) {
      applyTranslations(cache[lang]);
      updateUI(lang);
      return;
    }

    /* Fetch du fichier JSON */
    fetch('locales/' + lang + '.json?v=1')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        cache[lang] = data;
        applyTranslations(data);
        updateUI(lang);
      })
      .catch(function (err) {
        console.warn('[i18n] Impossible de charger la langue "' + lang + '" :', err);
      });
  }

  /* --------------------------------------------------
     Détection de la langue initiale
  -------------------------------------------------- */
  function detectLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.startsWith('en') ? 'en' : 'fr';
  }

  /* --------------------------------------------------
     Initialisation
  -------------------------------------------------- */
  function init() {
    setLanguage(detectLang());

    document.querySelectorAll('.lang-bar__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLanguage(btn.getAttribute('data-lang'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Exposition publique pour usage externe éventuel */
  window.i18n = { setLanguage: setLanguage };

})();
