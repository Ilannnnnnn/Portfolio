/**
 * main.js — i18n FR/EN + scroll reveal + smooth scroll
 * Script classique (pas de module ES) pour fiabilité maximale.
 */

/* -------------------------------------------------------
   Traductions (inline — aucun import externe)
------------------------------------------------------- */
var TRANSLATIONS = {
  fr: {
    pageTitle: 'Ilan — Ingénieur IA',
    heroAvailable:   'Disponible',
    heroSubtitle:    'Ingénieur IA',
    heroDesc:        "Étudiant en 5ème année d'ingénierie IA à ISEN Brest, alternant chez Orange sur des sujets LLM et analyse de traces réseau.",
    heroCtaProjects: 'Voir mes projets',
    heroCtaDownload: 'Télécharger CV',
    sectionProjects:   'Projets',
    sectionSkills:     'Compétences',
    sectionExperience: 'Expériences',
    sectionContact:    'Contact',
    proj1Desc:  'Application de coaching fitness propulsée par IA',
    proj2Desc:  'Analyse de traces réseau avec des LLMs pour Orange',
    proj3Title: '[Projet 3]',
    proj3Desc:  '[Description du projet à compléter]',
    projectDemo:   'Démo',
    projectDetail: 'Détails →',
    skillsCatAI:      'IA & ML',
    skillsCatData:    'Data & Infra',
    skillsCatNetwork: 'Réseau',
    skillsCatWeb:     'Web & API',
    exp1Title: 'Ingénieur IA en alternance',
    exp1Dates: 'Sept. 2024 – Présent',
    exp1Desc:  'Fine-tuning LLM (LoRA/QLoRA), analyse de traces réseau Wireshark, développement de pipelines IA et API.',
    exp2Title: "Diplôme d'Ingénieur, spécialité IA",
    exp2Dates: '2020 – 2025',
    exp2Desc:  "Formation d'ingénieur en intelligence artificielle.",
    exp3Title: 'Stagiaire Recherche – Détection de l\'Apnée du Sommeil',
    exp3Dates: 'Mai 2025 – Sept. 2025',
    exp3Desc:  "[Description de l'expérience à compléter]",
    contactTagline: "Intéressé par une collaboration ou un échange ? N'hésitez pas à me contacter.",
    contactSub:     'Disponible pour des opportunités en IA, NLP et ingénierie logicielle.',
    contactEmail:   'Email',
    footerText:   'Fait avec ❤️ par Ilan · 2025',
    footerSource: 'Code source',

    /* Pages détail projet */
    backToPortfolio:    '← Retour au portfolio',
    viewDemo:           'Voir la démo',
    sectionContext:     'Contexte',
    sectionStack:       'Stack technique',
    sectionArchitecture:'Architecture & Fonctionnement',
    sectionApproach:    'Approche & Méthode',
    sectionResults:     'Résultats & Points clés',
  },
  en: {
    pageTitle: 'Ilan — AI Engineer',
    heroAvailable:   'Open to work',
    heroSubtitle:    'AI Engineer',
    heroDesc:        '5th-year AI engineering student at ISEN Brest, working at Orange on LLM topics and network trace analysis.',
    heroCtaProjects: 'See my projects',
    heroCtaDownload: 'Download CV',
    sectionProjects:   'Projects',
    sectionSkills:     'Skills',
    sectionExperience: 'Experience',
    sectionContact:    'Contact',
    proj1Desc:  'AI-powered fitness coaching application',
    proj2Desc:  'Network trace analysis using LLMs for Orange',
    proj3Title: '[Project 3]',
    proj3Desc:  '[Project description to be filled in]',
    projectDemo:   'Demo',
    projectDetail: 'Details →',
    skillsCatAI:      'AI & ML',
    skillsCatData:    'Data & Infra',
    skillsCatNetwork: 'Network',
    skillsCatWeb:     'Web & API',
    exp1Title: 'AI Engineer (Apprenticeship)',
    exp1Dates: 'Sept. 2024 – Present',
    exp1Desc:  'LLM fine-tuning (LoRA/QLoRA), network trace analysis with Wireshark, AI pipeline and API development.',
    exp2Title: 'Engineering Degree, AI specialization',
    exp2Dates: '2020 – 2025',
    exp2Desc:  'Engineering degree specializing in artificial intelligence.',
    exp3Title: 'Research Intern – Sleep Apnea Detection',
    exp3Dates: 'May 2025 – Sept. 2025',
    exp3Desc:  '[Experience description to be filled in]',
    contactTagline: 'Interested in a collaboration or just a chat? Feel free to reach out.',
    contactSub:     'Available for opportunities in AI, NLP, and software engineering.',
    contactEmail:   'Email',
    footerText:   'Made with ❤️ by Ilan · 2025',
    footerSource: 'Source code',

    /* Project detail pages */
    backToPortfolio:    '← Back to portfolio',
    viewDemo:           'View demo',
    sectionContext:     'Context',
    sectionStack:       'Tech stack',
    sectionArchitecture:'Architecture & How it works',
    sectionApproach:    'Approach & Method',
    sectionResults:     'Results & Key takeaways',
  }
};

/* -------------------------------------------------------
   Langue
------------------------------------------------------- */
var STORAGE_KEY = 'portfolio-lang';

function detectInitialLang() {
  var stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fr' || stored === 'en') return stored;
  var nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('en') ? 'en' : 'fr';
}

function setLanguage(lang) {
  if (lang !== 'fr' && lang !== 'en') return;
  var t = TRANSLATIONS[lang];

  /* Mise à jour des textes */
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  /* Attribut lang + title */
  document.documentElement.setAttribute('lang', lang);
  if (t.pageTitle) document.title = t.pageTitle;

  /* Boutons actifs */
  document.querySelectorAll('.lang-bar__btn').forEach(function(btn) {
    var active = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  localStorage.setItem(STORAGE_KEY, lang);
}

/* -------------------------------------------------------
   Scroll Reveal
------------------------------------------------------- */
function initScrollReveal() {
  var elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(function(el) { el.classList.add('visible'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(function(el) { observer.observe(el); });
}

/* -------------------------------------------------------
   Smooth Scroll
------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* -------------------------------------------------------
   Init
------------------------------------------------------- */
function init() {
  var lang = detectInitialLang();
  setLanguage(lang);

  document.querySelectorAll('.lang-bar__btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setLanguage(btn.getAttribute('data-lang'));
    });
  });

  initSmoothScroll();
  initScrollReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
