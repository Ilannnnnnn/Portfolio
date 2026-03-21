/**
 * admin.js — Panel d'administration du portfolio
 * Gestion dynamique des projets, compétences et expériences.
 * Sauvegarde via GitHub API (PUT contents) ou export JSON local.
 */
(function () {
  'use strict';

  var GITHUB_OWNER = 'Ilannnnnnn';
  var GITHUB_REPO  = 'Portfolio';
  var FR_PATH      = 'locales/fr.json';
  var STORAGE_KEY  = 'admin-gh-token';

  var SKILL_TYPES = ['ai', 'data', 'network', 'web'];

  var state = {
    token:   '',
    frData:  null,
    fileSha: '',
    dirty:   false
  };

  /* --------------------------------------------------------
     Utilitaires
  -------------------------------------------------------- */
  function $id(id) { return document.getElementById(id); }

  function setStatus(msg, type) {
    var el = $id('save-status');
    el.textContent = msg;
    el.className = 'admin-save-bar__status ' + (type || '');
  }

  function markDirty() {
    if (!state.dirty) {
      state.dirty = true;
      setStatus('Modifications non sauvegardées', 'warning');
    }
  }

  function onInput(el) { el.addEventListener('input', markDirty); }

  /* --------------------------------------------------------
     GitHub API
  -------------------------------------------------------- */
  function ghHeaders() {
    return {
      'Authorization': 'token ' + state.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  function loadFromGitHub() {
    if (!state.token) { loadFallback(); return; }
    setStatus('Chargement depuis GitHub…', 'loading');
    $id('btn-save').disabled = true;

    fetch('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + FR_PATH, {
      headers: ghHeaders()
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (info) {
        state.fileSha = info.sha;
        var decoded = decodeURIComponent(escape(atob(info.content.replace(/\n/g, ''))));
        state.frData = JSON.parse(decoded);
        populateForms(state.frData);
        setStatus('Contenu chargé depuis GitHub.', 'success');
        $id('btn-save').disabled = false;
        updateAuthStatus(true);
      })
      .catch(function (err) {
        console.error('[admin]', err);
        setStatus('Token invalide ou erreur réseau — chargement local.', 'error');
        updateAuthStatus(false);
        loadFallback();
      });
  }

  function loadFallback() {
    fetch('locales/fr.json?v=2')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.frData = data;
        populateForms(data);
        if (!state.token) setStatus('Mode aperçu local (pas de token GitHub).', '');
      })
      .catch(function (err) {
        console.error('[admin]', err);
        setStatus('Erreur de chargement du fichier JSON.', 'error');
      });
  }

  function saveToGitHub() {
    if (!state.token) { alert('Entrez un token GitHub pour sauvegarder.'); return; }
    var updated = collectFormData();
    if (!updated) return;

    var statusEl = $id('save-status');
    statusEl.innerHTML = '<span class="spinner"></span> Sauvegarde…';
    statusEl.className = 'admin-save-bar__status loading';
    $id('btn-save').disabled = true;

    var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(updated, null, 2))));
    var body = { message: 'admin: mise à jour du contenu du portfolio', content: encoded };
    if (state.fileSha) body.sha = state.fileSha;

    fetch('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + FR_PATH, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify(body)
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (e) { throw new Error(e.message || 'HTTP ' + r.status); });
        return r.json();
      })
      .then(function (res) {
        state.frData = updated;
        state.fileSha = res.content.sha;
        state.dirty = false;
        setStatus('✓ Sauvegardé sur GitHub !', 'success');
        $id('btn-save').disabled = false;
      })
      .catch(function (err) {
        setStatus('Erreur : ' + err.message, 'error');
        $id('btn-save').disabled = false;
      });
  }

  function exportJson() {
    var data = collectFormData();
    if (!data) return;
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fr.json';
    a.click();
  }

  /* --------------------------------------------------------
     Collecte → JSON
  -------------------------------------------------------- */
  function collectFormData() {
    if (!state.frData) return null;
    var d = JSON.parse(JSON.stringify(state.frData));

    /* Projets fixes */
    d.index.fitiaDesc    = fieldVal('proj-fitia-desc');
    d.index.llmDesc      = fieldVal('proj-llm-desc');
    d.index.motowestDesc = fieldVal('proj-motowest-desc');
    d.fitia.subtitle     = fieldVal('fitia-subtitle');
    d.fitia.context1     = fieldVal('fitia-context1');
    d.fitia.context2     = fieldVal('fitia-context2');
    d.llm.subtitle       = fieldVal('llm-subtitle');
    d.llm.context1       = fieldVal('llm-context1');
    d.llm.context2       = fieldVal('llm-context2');
    d.motowest.subtitle  = fieldVal('motowest-subtitle');
    d.motowest.context   = fieldVal('motowest-context');

    /* Projets extra (dynamiques) */
    d.index.extraProjects = collectExtraProjects();

    /* Compétences (dynamiques) */
    d.index.skillsCategories = collectSkillCategories();

    /* Expériences (dynamiques) */
    d.index.experiences = collectExperiences();

    return d;
  }

  function fieldVal(id) {
    var el = $id(id);
    return el ? el.value.trim() : '';
  }

  /* --------------------------------------------------------
     EXPÉRIENCES — dynamique
  -------------------------------------------------------- */
  function collectExperiences() {
    return Array.from(document.querySelectorAll('.exp-card')).map(function (card) {
      return {
        title:    card.querySelector('[data-f="title"]').value.trim(),
        company:  card.querySelector('[data-f="company"]').value.trim(),
        location: card.querySelector('[data-f="location"]').value.trim(),
        initials: card.querySelector('[data-f="initials"]').value.trim(),
        dates:    card.querySelector('[data-f="dates"]').value.trim(),
        desc:     card.querySelector('[data-f="desc"]').value.trim()
      };
    });
  }

  function buildExpCard(exp) {
    exp = exp || {};
    var card = document.createElement('div');
    card.className = 'admin-card exp-card';
    card.innerHTML =
      '<div class="admin-card__header">' +
        '<span class="admin-card__icon">💼</span>' +
        '<span class="admin-card__title exp-card-label">' + (exp.company || 'Nouvelle expérience') + '</span>' +
        '<button class="btn-admin btn-admin--danger btn-admin--sm admin-card__delete" title="Supprimer">Supprimer</button>' +
      '</div>' +
      '<div class="admin-fields-row">' +
        '<div class="admin-field"><label class="admin-field__label">Poste / titre</label>' +
          '<input type="text" class="admin-field__input" data-f="title" value="' + esc(exp.title) + '" placeholder="Ingénieur IA…" /></div>' +
        '<div class="admin-field"><label class="admin-field__label">Entreprise</label>' +
          '<input type="text" class="admin-field__input" data-f="company" value="' + esc(exp.company) + '" placeholder="Orange" /></div>' +
      '</div>' +
      '<div class="admin-fields-row">' +
        '<div class="admin-field"><label class="admin-field__label">Lieu</label>' +
          '<input type="text" class="admin-field__input" data-f="location" value="' + esc(exp.location) + '" placeholder="Paris, France" /></div>' +
        '<div class="admin-field"><label class="admin-field__label">Période</label>' +
          '<input type="text" class="admin-field__input" data-f="dates" value="' + esc(exp.dates) + '" placeholder="Jan. 2024 – Présent" /></div>' +
      '</div>' +
      '<div class="admin-fields-row">' +
        '<div class="admin-field"><label class="admin-field__label">Initiales</label>' +
          '<input type="text" class="admin-field__input" data-f="initials" value="' + esc(exp.initials) + '" placeholder="OR" maxlength="3" style="max-width:70px" /></div>' +
      '</div>' +
      '<div class="admin-field"><label class="admin-field__label">Description</label>' +
        '<textarea class="admin-field__textarea" data-f="desc">' + esc(exp.desc) + '</textarea></div>';

    /* Live label update */
    var companyInput = card.querySelector('[data-f="company"]');
    var label = card.querySelector('.exp-card-label');
    companyInput.addEventListener('input', function () {
      label.textContent = companyInput.value.trim() || 'Nouvelle expérience';
    });

    /* Delete */
    card.querySelector('.admin-card__delete').addEventListener('click', function () {
      card.remove();
      markDirty();
    });

    /* Dirty tracking */
    card.querySelectorAll('input, textarea').forEach(onInput);
    return card;
  }

  function populateExperiences(experiences) {
    var list = $id('experiences-list');
    list.innerHTML = '';
    (experiences || []).forEach(function (exp) {
      list.appendChild(buildExpCard(exp));
    });
  }

  /* --------------------------------------------------------
     CATÉGORIES DE COMPÉTENCES — dynamique
  -------------------------------------------------------- */
  function collectSkillCategories() {
    return Array.from(document.querySelectorAll('.skill-cat-card-dyn')).map(function (card) {
      var tagsEl = card.querySelector('.skills-tags-editor');
      var skills = Array.from(tagsEl.querySelectorAll('.skill-tag[data-skill]'))
        .map(function (t) { return t.getAttribute('data-skill'); });
      return {
        id:     card.getAttribute('data-cat-id') || ('cat_' + Date.now()),
        label:  card.querySelector('[data-f="label"]').value.trim(),
        type:   card.querySelector('[data-f="type"]').value,
        skills: skills
      };
    });
  }

  function buildSkillCatCard(cat) {
    cat = cat || {};
    var id = cat.id || ('cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    var type = cat.type || 'ai';

    var card = document.createElement('div');
    card.className = 'skills-cat-card skills-cat-card-dyn skills-cat-card--' + type;
    card.setAttribute('data-cat-id', id);

    var typeOptions = SKILL_TYPES.map(function (t) {
      return '<option value="' + t + '"' + (t === type ? ' selected' : '') + '>' + t + '</option>';
    }).join('');

    card.innerHTML =
      '<div class="skill-cat-card__header">' +
        '<input type="text" class="skills-cat-label-input admin-field__input" data-f="label" value="' + esc(cat.label) + '" placeholder="Nom de la catégorie" />' +
        '<select class="skills-cat-type-select" data-f="type">' + typeOptions + '</select>' +
        '<button class="btn-admin btn-admin--danger btn-admin--sm skill-cat-delete" title="Supprimer catégorie">×</button>' +
      '</div>' +
      '<div class="skills-tags-editor" id="tags-' + id + '"></div>' +
      '<div class="skills-add-row">' +
        '<input type="text" class="skills-add-input" placeholder="Ajouter une compétence…" />' +
        '<button class="btn-admin btn-admin--primary btn-admin--sm skills-add-btn">+</button>' +
      '</div>';

    /* Render existing skills */
    var tagsEl = card.querySelector('.skills-tags-editor');
    (cat.skills || []).forEach(function (s) { addSkillTag(tagsEl, s); });

    /* Type change → update card color class */
    var typeSelect = card.querySelector('[data-f="type"]');
    typeSelect.addEventListener('change', function () {
      SKILL_TYPES.forEach(function (t) { card.classList.remove('skills-cat-card--' + t); });
      card.classList.add('skills-cat-card--' + typeSelect.value);
      markDirty();
    });

    /* Add skill */
    var addInput = card.querySelector('.skills-add-input');
    var addBtn   = card.querySelector('.skills-add-btn');
    function doAdd() {
      var v = addInput.value.trim();
      if (!v) return;
      addSkillTag(tagsEl, v);
      addInput.value = '';
      markDirty();
    }
    addBtn.addEventListener('click', doAdd);
    addInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
    });

    /* Delete card */
    card.querySelector('.skill-cat-delete').addEventListener('click', function () {
      card.remove();
      markDirty();
    });

    card.querySelector('[data-f="label"]').addEventListener('input', markDirty);
    return card;
  }

  function populateSkillCategories(cats) {
    var grid = $id('skills-cat-list');
    grid.innerHTML = '';
    (cats || []).forEach(function (cat) {
      grid.appendChild(buildSkillCatCard(cat));
    });
  }

  /* --------------------------------------------------------
     PROJETS EXTRA — dynamique
  -------------------------------------------------------- */
  function collectExtraProjects() {
    return Array.from(document.querySelectorAll('.extra-project-card')).map(function (card) {
      var tagsEl   = card.querySelector('.skills-tags-editor');
      var tags = Array.from(tagsEl.querySelectorAll('.skill-tag[data-skill]'))
        .map(function (t) { return t.getAttribute('data-skill'); });
      return {
        id:     card.getAttribute('data-proj-id') || ('proj_' + Date.now()),
        icon:   card.querySelector('[data-f="icon"]').value.trim() || '🚀',
        title:  card.querySelector('[data-f="title"]').value.trim(),
        desc:   card.querySelector('[data-f="desc"]').value.trim(),
        tags:   tags,
        github: card.querySelector('[data-f="github"]').value.trim(),
        demo:   card.querySelector('[data-f="demo"]').value.trim()
      };
    });
  }

  function buildExtraProjectCard(proj) {
    proj = proj || {};
    var id = proj.id || ('proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));

    var card = document.createElement('div');
    card.className = 'admin-card extra-project-card';
    card.setAttribute('data-proj-id', id);
    card.innerHTML =
      '<div class="admin-card__header">' +
        '<input type="text" class="admin-field__input proj-icon-input" data-f="icon" value="' + esc(proj.icon || '🚀') + '" style="width:3rem;text-align:center;font-size:1.2rem" maxlength="4" />' +
        '<input type="text" class="admin-field__input extra-proj-label" data-f="title" value="' + esc(proj.title) + '" placeholder="Nom du projet" style="flex:1" />' +
        '<button class="btn-admin btn-admin--danger btn-admin--sm admin-card__delete" title="Supprimer">Supprimer</button>' +
      '</div>' +
      '<div class="admin-field"><label class="admin-field__label">Description courte</label>' +
        '<input type="text" class="admin-field__input" data-f="desc" value="' + esc(proj.desc) + '" placeholder="Description visible sur la carte…" /></div>' +
      '<div class="admin-section-title" style="margin-top:.75rem">Tags</div>' +
      '<div class="skills-tags-editor" id="proj-tags-' + id + '" style="margin-bottom:.5rem"></div>' +
      '<div class="skills-add-row" style="margin-bottom:.75rem">' +
        '<input type="text" class="skills-add-input" placeholder="Ajouter un tag…" />' +
        '<button class="btn-admin btn-admin--primary btn-admin--sm proj-tag-add-btn">+</button>' +
      '</div>' +
      '<div class="admin-fields-row">' +
        '<div class="admin-field"><label class="admin-field__label">Lien GitHub (optionnel)</label>' +
          '<input type="url" class="admin-field__input" data-f="github" value="' + esc(proj.github) + '" placeholder="https://github.com/…" /></div>' +
        '<div class="admin-field"><label class="admin-field__label">Lien Démo (optionnel)</label>' +
          '<input type="url" class="admin-field__input" data-f="demo" value="' + esc(proj.demo) + '" placeholder="https://…" /></div>' +
      '</div>';

    /* Existing tags */
    var tagsEl = card.querySelector('.skills-tags-editor');
    (proj.tags || []).forEach(function (t) { addSkillTag(tagsEl, t); });

    /* Add tag */
    var addInput = card.querySelector('.skills-add-input');
    var addBtn   = card.querySelector('.proj-tag-add-btn');
    function doAdd() {
      var v = addInput.value.trim();
      if (!v) return;
      addSkillTag(tagsEl, v);
      addInput.value = '';
      markDirty();
    }
    addBtn.addEventListener('click', doAdd);
    addInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
    });

    /* Delete card */
    card.querySelector('.admin-card__delete').addEventListener('click', function () {
      card.remove();
      markDirty();
    });

    card.querySelectorAll('input, textarea').forEach(onInput);
    return card;
  }

  function populateExtraProjects(projects) {
    var list = $id('extra-projects-list');
    list.innerHTML = '';
    (projects || []).forEach(function (p) {
      list.appendChild(buildExtraProjectCard(p));
    });
  }

  /* --------------------------------------------------------
     Tags de compétences (partagé)
  -------------------------------------------------------- */
  function addSkillTag(container, skill) {
    if (!skill || !skill.trim()) return;
    var tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.setAttribute('data-skill', skill.trim());
    tag.innerHTML = skill.trim() +
      '<button class="skill-tag__remove" title="Supprimer">×</button>';
    tag.querySelector('button').addEventListener('click', function (e) {
      e.stopPropagation();
      tag.remove();
      markDirty();
    });
    container.appendChild(tag);
  }

  /* --------------------------------------------------------
     Peuplement des formulaires depuis le JSON
  -------------------------------------------------------- */
  function populateForms(d) {
    setVal('proj-fitia-desc',    d.index.fitiaDesc);
    setVal('proj-llm-desc',      d.index.llmDesc);
    setVal('proj-motowest-desc', d.index.motowestDesc);
    setVal('fitia-subtitle',     d.fitia.subtitle);
    setVal('fitia-context1',     d.fitia.context1);
    setVal('fitia-context2',     d.fitia.context2);
    setVal('llm-subtitle',       d.llm.subtitle);
    setVal('llm-context1',       d.llm.context1);
    setVal('llm-context2',       d.llm.context2);
    setVal('motowest-subtitle',  d.motowest.subtitle);
    setVal('motowest-context',   d.motowest.context);

    populateExtraProjects(d.index.extraProjects);
    populateSkillCategories(d.index.skillsCategories);
    populateExperiences(d.index.experiences);

    /* Dirty listeners sur champs fixes */
    document.querySelectorAll('.admin-field__input, .admin-field__textarea').forEach(function (el) {
      if (!el.__dirtyBound) { el.__dirtyBound = true; el.addEventListener('input', markDirty); }
    });
  }

  function setVal(id, value) {
    var el = $id(id);
    if (el && value !== undefined) el.value = value;
  }

  /* --------------------------------------------------------
     Echappement HTML minimal
  -------------------------------------------------------- */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* --------------------------------------------------------
     Auth
  -------------------------------------------------------- */
  function updateAuthStatus(ok) {
    var el = $id('auth-status');
    if (!el) return;
    el.textContent  = ok ? '● Connecté' : '○ Déconnecté';
    el.className    = 'admin-auth__status admin-auth__status--' + (ok ? 'connected' : 'disconnected');
  }

  function initAuth() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state.token = saved;
      var inp = $id('token-input');
      if (inp) inp.value = saved;
    }
    $id('btn-connect').addEventListener('click', function () {
      var token = $id('token-input').value.trim();
      if (!token) return;
      state.token = token;
      localStorage.setItem(STORAGE_KEY, token);
      loadFromGitHub();
    });
    $id('btn-disconnect').addEventListener('click', function () {
      state.token = '';
      localStorage.removeItem(STORAGE_KEY);
      $id('token-input').value = '';
      updateAuthStatus(false);
      setStatus('Token supprimé.', '');
    });
  }

  /* --------------------------------------------------------
     Tabs
  -------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.add('hidden'); });
        tab.classList.add('active');
        var target = $id('tab-' + tab.getAttribute('data-tab'));
        if (target) target.classList.remove('hidden');
      });
    });
  }

  /* --------------------------------------------------------
     Init
  -------------------------------------------------------- */
  function init() {
    initAuth();
    initTabs();

    $id('btn-save').addEventListener('click', saveToGitHub);
    $id('btn-export').addEventListener('click', exportJson);

    $id('btn-add-exp').addEventListener('click', function () {
      $id('experiences-list').appendChild(buildExpCard({}));
      markDirty();
    });

    $id('btn-add-skill-cat').addEventListener('click', function () {
      $id('skills-cat-list').appendChild(buildSkillCatCard({}));
      markDirty();
    });

    $id('btn-add-project').addEventListener('click', function () {
      $id('extra-projects-list').appendChild(buildExtraProjectCard({}));
      markDirty();
    });

    loadFromGitHub();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
