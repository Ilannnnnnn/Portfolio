/**
 * admin.js — Logique du panel d'administration du portfolio
 *
 * Fonctionnement :
 *   1. Charge le contenu actuel depuis GitHub API (locales/fr.json)
 *   2. Peuple les formulaires avec les données existantes
 *   3. Sur "Sauvegarder" → commit direct sur GitHub via l'API
 *   4. Fallback : export JSON local si pas de token
 *
 * Authentification :
 *   - Token GitHub Personal Access Token (scope: repo)
 *   - Stocké en localStorage (clé : 'admin-gh-token')
 */

(function () {
  'use strict';

  var GITHUB_OWNER = 'Ilannnnnnn';
  var GITHUB_REPO  = 'Portfolio';
  var FR_PATH      = 'locales/fr.json';
  var STORAGE_KEY  = 'admin-gh-token';

  var state = {
    token: '',
    frData: null,
    fileSha: '',
    dirty: false
  };

  /* --------------------------------------------------------
     Utilitaires DOM
  -------------------------------------------------------- */
  function $id(id) { return document.getElementById(id); }
  function $qs(sel, ctx) { return (ctx || document).querySelector(sel); }

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
    if (!state.token) {
      setStatus('Entrez un token GitHub pour charger le contenu en direct.', '');
      loadFallback();
      return;
    }

    setStatus('Chargement depuis GitHub…', 'loading');
    $id('btn-save').disabled = true;

    fetch('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + FR_PATH, {
      headers: ghHeaders()
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (fileInfo) {
        state.fileSha = fileInfo.sha;
        var decoded = decodeURIComponent(escape(atob(fileInfo.content.replace(/\n/g, ''))));
        state.frData = JSON.parse(decoded);
        populateForms(state.frData);
        setStatus('Contenu chargé depuis GitHub.', 'success');
        $id('btn-save').disabled = false;
        updateAuthStatus(true);
      })
      .catch(function (err) {
        console.error('[admin] Erreur GitHub:', err);
        setStatus('Impossible de charger depuis GitHub (token invalide ?). Chargement local.', 'error');
        updateAuthStatus(false);
        loadFallback();
      });
  }

  function loadFallback() {
    fetch('locales/fr.json?v=1')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.frData = data;
        populateForms(data);
        if (!state.token) setStatus('Mode aperçu local (pas de token GitHub).', '');
      })
      .catch(function (err) {
        console.error('[admin] Impossible de charger fr.json:', err);
        setStatus('Erreur de chargement du fichier JSON.', 'error');
      });
  }

  function saveToGitHub() {
    if (!state.token) {
      alert('Entrez un token GitHub pour sauvegarder.');
      return;
    }

    var updated = collectFormData();
    if (!updated) return;

    setStatus('', 'loading');
    var statusEl = $id('save-status');
    statusEl.innerHTML = '<span class="spinner"></span> Sauvegarde en cours…';
    statusEl.className = 'admin-save-bar__status loading';
    $id('btn-save').disabled = true;

    var jsonStr = JSON.stringify(updated, null, 2);
    var encoded = btoa(unescape(encodeURIComponent(jsonStr)));

    var body = {
      message: 'admin: mise à jour du contenu du portfolio',
      content: encoded
    };
    if (state.fileSha) body.sha = state.fileSha;

    fetch('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + FR_PATH, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify(body)
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function(e) { throw new Error(e.message || 'HTTP ' + r.status); });
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
        console.error('[admin] Erreur save:', err);
        setStatus('Erreur : ' + err.message, 'error');
        $id('btn-save').disabled = false;
      });
  }

  function exportJson() {
    var data = collectFormData();
    if (!data) return;
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'fr.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* --------------------------------------------------------
     Formulaires → collecte des données
  -------------------------------------------------------- */
  function collectFormData() {
    if (!state.frData) return null;
    var d = JSON.parse(JSON.stringify(state.frData)); /* deep clone */

    /* — Projets — */
    d.index.fitiaDesc    = val('proj-fitia-desc');
    d.index.llmDesc      = val('proj-llm-desc');
    d.index.motowestDesc = val('proj-motowest-desc');

    /* Descriptions détaillées projets */
    d.fitia.subtitle  = val('fitia-subtitle');
    d.fitia.context1  = val('fitia-context1');
    d.fitia.context2  = val('fitia-context2');
    d.llm.subtitle    = val('llm-subtitle');
    d.llm.context1    = val('llm-context1');
    d.llm.context2    = val('llm-context2');
    d.motowest.subtitle = val('motowest-subtitle');
    d.motowest.context  = val('motowest-context');

    /* — Compétences — */
    d.index.skillsData = {
      ai:      collectSkillTags('skills-tags-ai'),
      data:    collectSkillTags('skills-tags-data'),
      network: collectSkillTags('skills-tags-network'),
      web:     collectSkillTags('skills-tags-web')
    };

    /* — Expériences — */
    d.index.exp1Title    = val('exp1-title');
    d.index.exp1Company  = val('exp1-company');
    d.index.exp1Location = val('exp1-location');
    d.index.exp1Initials = val('exp1-initials');
    d.index.exp1Dates    = val('exp1-dates');
    d.index.exp1Desc     = val('exp1-desc');

    d.index.exp2Title    = val('exp2-title');
    d.index.exp2Company  = val('exp2-company');
    d.index.exp2Location = val('exp2-location');
    d.index.exp2Initials = val('exp2-initials');
    d.index.exp2Dates    = val('exp2-dates');
    d.index.exp2Desc     = val('exp2-desc');

    d.index.exp3Title    = val('exp3-title');
    d.index.exp3Company  = val('exp3-company');
    d.index.exp3Location = val('exp3-location');
    d.index.exp3Initials = val('exp3-initials');
    d.index.exp3Dates    = val('exp3-dates');
    d.index.exp3Desc     = val('exp3-desc');

    return d;
  }

  function val(id) {
    var el = $id(id);
    return el ? el.value.trim() : '';
  }

  function collectSkillTags(containerId) {
    var container = $id(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.skill-tag[data-skill]'))
      .map(function (t) { return t.getAttribute('data-skill'); });
  }

  /* --------------------------------------------------------
     Formulaires → peuplement
  -------------------------------------------------------- */
  function populateForms(d) {
    /* Projets */
    setVal('proj-fitia-desc',    d.index.fitiaDesc);
    setVal('proj-llm-desc',      d.index.llmDesc);
    setVal('proj-motowest-desc', d.index.motowestDesc);

    setVal('fitia-subtitle',  d.fitia.subtitle);
    setVal('fitia-context1',  d.fitia.context1);
    setVal('fitia-context2',  d.fitia.context2);
    setVal('llm-subtitle',    d.llm.subtitle);
    setVal('llm-context1',    d.llm.context1);
    setVal('llm-context2',    d.llm.context2);
    setVal('motowest-subtitle', d.motowest.subtitle);
    setVal('motowest-context',  d.motowest.context);

    /* Compétences */
    if (d.index.skillsData) {
      renderSkillTagsEditor('skills-tags-ai',      d.index.skillsData.ai      || []);
      renderSkillTagsEditor('skills-tags-data',    d.index.skillsData.data    || []);
      renderSkillTagsEditor('skills-tags-network', d.index.skillsData.network || []);
      renderSkillTagsEditor('skills-tags-web',     d.index.skillsData.web     || []);
    }

    /* Expériences */
    setVal('exp1-title',    d.index.exp1Title);
    setVal('exp1-company',  d.index.exp1Company);
    setVal('exp1-location', d.index.exp1Location);
    setVal('exp1-initials', d.index.exp1Initials);
    setVal('exp1-dates',    d.index.exp1Dates);
    setVal('exp1-desc',     d.index.exp1Desc);

    setVal('exp2-title',    d.index.exp2Title);
    setVal('exp2-company',  d.index.exp2Company);
    setVal('exp2-location', d.index.exp2Location);
    setVal('exp2-initials', d.index.exp2Initials);
    setVal('exp2-dates',    d.index.exp2Dates);
    setVal('exp2-desc',     d.index.exp2Desc);

    setVal('exp3-title',    d.index.exp3Title);
    setVal('exp3-company',  d.index.exp3Company);
    setVal('exp3-location', d.index.exp3Location);
    setVal('exp3-initials', d.index.exp3Initials);
    setVal('exp3-dates',    d.index.exp3Dates);
    setVal('exp3-desc',     d.index.exp3Desc);
  }

  function setVal(id, value) {
    var el = $id(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }

  /* --------------------------------------------------------
     Éditeur de tags de compétences
  -------------------------------------------------------- */
  function renderSkillTagsEditor(containerId, skills) {
    var container = $id(containerId);
    if (!container) return;
    /* Vide seulement les tags existants, pas l'input */
    container.querySelectorAll('.skill-tag').forEach(function (t) { t.remove(); });

    skills.forEach(function (skill) {
      addSkillTag(container, skill);
    });
  }

  function addSkillTag(container, skill) {
    if (!skill.trim()) return;
    var tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.setAttribute('data-skill', skill.trim());
    tag.innerHTML =
      skill.trim() +
      '<button class="skill-tag__remove" title="Supprimer" aria-label="Supprimer ' + skill + '">×</button>';
    tag.querySelector('button').addEventListener('click', function (e) {
      e.stopPropagation();
      tag.remove();
      markDirty();
    });
    container.appendChild(tag);
  }

  function initSkillsAddRow(catId) {
    var input  = $id('skills-input-' + catId);
    var btn    = $id('skills-add-' + catId);
    var tagsEl = $id('skills-tags-' + catId);

    if (!input || !btn || !tagsEl) return;

    function addCurrent() {
      var v = input.value.trim();
      if (!v) return;
      addSkillTag(tagsEl, v);
      input.value = '';
      markDirty();
    }

    btn.addEventListener('click', addCurrent);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCurrent(); }
    });
  }

  /* --------------------------------------------------------
     Auth
  -------------------------------------------------------- */
  function updateAuthStatus(connected) {
    var statusEl = $id('auth-status');
    if (!statusEl) return;
    if (connected) {
      statusEl.textContent = '● Connecté';
      statusEl.className = 'admin-auth__status admin-auth__status--connected';
    } else {
      statusEl.textContent = '○ Déconnecté';
      statusEl.className = 'admin-auth__status admin-auth__status--disconnected';
    }
  }

  function initAuth() {
    var savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
      state.token = savedToken;
      var input = $id('token-input');
      if (input) input.value = savedToken;
      updateAuthStatus(false); /* sera mis à jour après le fetch */
    }

    var connectBtn = $id('btn-connect');
    if (connectBtn) {
      connectBtn.addEventListener('click', function () {
        var input = $id('token-input');
        var token = input ? input.value.trim() : '';
        if (!token) return;
        state.token = token;
        localStorage.setItem(STORAGE_KEY, token);
        loadFromGitHub();
      });
    }

    var disconnectBtn = $id('btn-disconnect');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', function () {
        state.token = '';
        localStorage.removeItem(STORAGE_KEY);
        var input = $id('token-input');
        if (input) input.value = '';
        updateAuthStatus(false);
        setStatus('Token supprimé.', '');
      });
    }
  }

  /* --------------------------------------------------------
     Tabs
  -------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.admin-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        document.querySelectorAll('.admin-section').forEach(function (s) {
          s.classList.add('hidden');
        });
        tab.classList.add('active');
        var target = $id('tab-' + tab.getAttribute('data-tab'));
        if (target) target.classList.remove('hidden');
      });
    });
  }

  /* --------------------------------------------------------
     Init global
  -------------------------------------------------------- */
  function init() {
    initAuth();
    initTabs();

    /* Skills add rows */
    ['ai', 'data', 'network', 'web'].forEach(initSkillsAddRow);

    /* Save & export buttons */
    $id('btn-save').addEventListener('click', saveToGitHub);
    $id('btn-export').addEventListener('click', exportJson);

    /* Marquer dirty sur tout changement */
    document.querySelectorAll('.admin-field__input, .admin-field__textarea').forEach(function (el) {
      el.addEventListener('input', markDirty);
    });

    /* Chargement initial */
    loadFromGitHub();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
