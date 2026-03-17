/**
 * main.js — Logique principale du portfolio
 * Gère : scroll reveal, smooth scroll
 */

import { translations } from './translations.js';

/* -------------------------------------------------------
   Constantes
------------------------------------------------------- */
const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANG = 'fr';

/* -------------------------------------------------------
   Langue
------------------------------------------------------- */

/**
 * Détecte la langue initiale :
 * 1. localStorage (persistance)
 * 2. navigator.language (langue navigateur)
 * 3. Défaut : français
 * @returns {'fr'|'en'}
 */
function detectInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fr' || stored === 'en') return stored;

  const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
  return nav.startsWith('en') ? 'en' : DEFAULT_LANG;
}

/**
 * Applique la langue à toute la page :
 * - Met à jour tous les éléments [data-i18n]
 * - Met à jour l'attribut lang sur <html>
 * - Persiste le choix dans localStorage
 * @param {'fr'|'en'} lang
 */
function setLanguage(lang) {
  if (lang !== 'fr' && lang !== 'en') return;

  const t = translations[lang];

  /* Met à jour le textContent de tous les éléments data-i18n */
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  /* Met à jour l'attribut lang HTML pour l'accessibilité */
  document.documentElement.setAttribute('lang', lang);

  /* Met à jour le title de la page */
  if (t.pageTitle) document.title = t.pageTitle;

  /* Highlighting des boutons de langue */
  document.querySelectorAll('.lang-bar__btn').forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  /* Persistance */
  localStorage.setItem(STORAGE_KEY, lang);
}

/* -------------------------------------------------------
   Smooth scroll pour les ancres de navigation
------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* -------------------------------------------------------
   Scroll Reveal — IntersectionObserver
------------------------------------------------------- */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  /* Préférence d'accessibilité : désactive les animations si demandé */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------
   Initialisation globale
------------------------------------------------------- */
function init() {
  /* 1. Détection et application de la langue */
  const lang = detectInitialLang();
  setLanguage(lang);

  /* 2. Écouteurs sur les boutons de langue */
  document.querySelectorAll('.lang-bar__btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  /* 3. Smooth scroll */
  initSmoothScroll();

  /* 3. Scroll reveal */
  initScrollReveal();
}

/* Lance l'initialisation quand le DOM est prêt */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
