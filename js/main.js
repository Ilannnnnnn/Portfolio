/**
 * main.js — Logique principale du portfolio
 * Gère : i18n FR/EN, navbar (scroll + hamburger), scroll reveal
 */

import { translations } from './translations.js';

/* -------------------------------------------------------
   Constantes
------------------------------------------------------- */
const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANG = 'fr';
const SCROLL_THRESHOLD = 30; /* px avant que la navbar devienne semi-opaque */

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
 * - Met à jour le highlighting des boutons lang + CV pills
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

  /* Highlighting des boutons de langue (desktop + mobile) */
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  /* Highlighting du CV pill correspondant à la langue active */
  const cvFrPills = document.querySelectorAll('#cv-pill-fr, #cv-pill-fr-mobile');
  const cvEnPills = document.querySelectorAll('#cv-pill-en, #cv-pill-en-mobile');

  cvFrPills.forEach((el) => el.classList.toggle('active', lang === 'fr'));
  cvEnPills.forEach((el) => el.classList.toggle('active', lang === 'en'));

  /* Persistance */
  localStorage.setItem(STORAGE_KEY, lang);
}

/* -------------------------------------------------------
   Navbar — effet au scroll
------------------------------------------------------- */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  /* Applique immédiatement au cas où la page est déjà scrollée */
  onScroll();
}

/* -------------------------------------------------------
   Hamburger & Drawer mobile
------------------------------------------------------- */
function initHamburger() {
  const btn    = document.getElementById('hamburger');
  const drawer = document.getElementById('mobile-drawer');
  if (!btn || !drawer) return;

  /** Ouvre ou ferme le drawer */
  function toggleDrawer(force) {
    const isOpen = force !== undefined ? force : !btn.classList.contains('open');

    btn.classList.toggle('open', isOpen);
    drawer.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    drawer.setAttribute('aria-hidden', String(!isOpen));

    /* Empêche le scroll du body quand le drawer est ouvert */
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  btn.addEventListener('click', () => toggleDrawer());

  /* Ferme le drawer quand on clique sur un lien */
  drawer.querySelectorAll('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => toggleDrawer(false));
  });

  /* Ferme le drawer avec la touche Échap */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleDrawer(false);
  });
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
          /* Une fois visible, on arrête d'observer l'élément */
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,   /* 15% de l'élément visible pour déclencher */
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

  /* 2. Écouteurs sur les boutons de langue (desktop + mobile) */
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  /* 3. Navbar scroll */
  initNavbarScroll();

  /* 4. Hamburger mobile */
  initHamburger();

  /* 5. Smooth scroll */
  initSmoothScroll();

  /* 6. Scroll reveal */
  initScrollReveal();
}

/* Lance l'initialisation quand le DOM est prêt */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
