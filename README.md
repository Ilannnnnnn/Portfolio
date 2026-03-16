# Portfolio — Ilan

**FR** : Portfolio personnel d'Ilan, Ingénieur IA en 5ème année à ISEN Brest, alternant chez Orange.
**EN** : Personal portfolio of Ilan, 5th-year AI Engineer student at ISEN Brest, apprentice at Orange.

🔗 **Live** : [https://ilannnnnnn.github.io/Portfolio](https://ilannnnnnn.github.io/Portfolio)

---

## Arborescence du projet

```
Portfolio/
├── index.html          # Page principale du portfolio
├── cv-fr.html          # CV en français (imprimable / export PDF)
├── cv-en.html          # CV en anglais (imprimable / export PDF)
├── css/
│   ├── style.css       # Styles principaux + variables CSS globales
│   ├── animations.css  # Scroll reveal (IntersectionObserver)
│   └── particles.css   # Styles du canvas de particules
├── js/
│   ├── main.js         # i18n, navbar scroll, hamburger, scroll reveal
│   ├── particles.js    # Système de particules canvas (brownien + lignes)
│   └── translations.js # Toutes les chaînes FR/EN
├── assets/
│   ├── icons/          # Icônes supplémentaires (optionnel)
│   └── img/            # Images (og-image.png, favicon.ico, cv.pdf…)
└── README.md
```

---

## Déploiement GitHub Pages

1. Aller dans **Settings → Pages**
2. Sélectionner **Branch: `main`**, dossier **`/ (root)`**
3. Cliquer **Save**
4. Le site sera accessible à : `https://ilannnnnnn.github.io/Portfolio`

---

## 📋 Placeholders à remplacer

### `index.html`
| Emplacement | Placeholder | À remplacer par |
|---|---|---|
| `<h1 class="hero__name">` | `[NOM]` | Ton nom de famille |
| `<a href="mailto:...">` | `[placeholder]@email.com` | Ton adresse email |
| `<a href="https://linkedin.com/in/...">` | `[placeholder]` | Ton identifiant LinkedIn |
| Projet 3 — titre | `[Projet 3]` | Nom du projet |
| Projet 3 — description | `[Description du projet à compléter]` | Description FR + EN dans `translations.js` |
| Projet 3 — tags | `[Tag 1]`, `[Tag 2]`, `[Tag 3]` | Technologies utilisées |
| Projet 3 — GitHub | `#` | URL du dépôt GitHub |
| Expérience 3 — titre | `[Titre du poste]` | Intitulé du poste |
| Expérience 3 — entreprise | `[Entreprise]` | Nom de l'entreprise |
| Expérience 3 — dates | `[Dates]` | Période (ex: Jan. 2023 – Juin 2023) |
| Expérience 3 — lieu | `[Ville, Pays]` | Localisation |
| Expérience 3 — description | `[Description...]` | Description dans `translations.js` |
| Héro — lien CV | `assets/cv.pdf` | Mettre le PDF dans `assets/` et vérifier le lien |
| FitIA — GitHub | `https://github.com/Ilannnnnnn` | URL exacte du repo FitIA |

### `cv-fr.html` et `cv-en.html`
| Emplacement | Placeholder | À remplacer par |
|---|---|---|
| `<h1 class="cv-header__name">` | `[NOM]` / `[SURNAME]` | Ton nom de famille |
| Email | `[placeholder]@email.com` | Ton adresse email |
| LinkedIn | `[placeholder]` | Ton identifiant LinkedIn |
| Expérience 2 — tout | `[Titre]`, `[Entreprise]`, `[Dates]`, `[Desc]` | Expérience précédente |
| Formation 2 — tout | `[Titre diplôme]`, `[Établissement]`, `[Dates]` | Autre formation |
| Langues | `[Autre langue]`, `[Niveau]` | Troisième langue si applicable |

### `js/translations.js`
| Clé | À remplacer par |
|---|---|
| `proj3Title` | Nom du 3ème projet (FR + EN) |
| `proj3Desc` | Description du 3ème projet (FR + EN) |
| `exp3Title`, `exp3Dates`, `exp3Desc` | 3ème expérience (FR + EN) |

---

## 📄 CVs HTML

### Système cv-fr / cv-en

Les deux CVs (`cv-fr.html` et `cv-en.html`) partagent exactement les mêmes styles via `css/style.css`.
Ils héritent automatiquement des variables CSS (couleurs, typographie, espacements) — **ne pas redéfinir les variables dans les pages CV**.

La navigation entre les deux versions se fait via le toggle FR | EN dans la navbar de chaque page CV :
- Sur `cv-fr.html` : FR est highlighted, cliquer EN redirige vers `cv-en.html`
- Sur `cv-en.html` : EN est highlighted, cliquer FR redirige vers `cv-fr.html`

### Export PDF via window.print()

Chaque page CV dispose d'un bouton **"Imprimer / PDF"** qui déclenche `window.print()`.

Pour exporter en PDF proprement :
1. Cliquer le bouton ou faire `Ctrl+P` / `Cmd+P`
2. Sélectionner **"Enregistrer en PDF"** / **"Save as PDF"**
3. Format recommandé : **A4**, marges **Minimum** ou **Aucune**
4. Activer les **arrière-plans graphiques** si les couleurs ne s'affichent pas

> Les `@media print` dans chaque CV masquent la navbar et le bouton d'impression, et basculent vers un fond blanc avec texte noir pour une impression propre.

---

## Crédits & Licence

Développé par **Ilan** avec HTML/CSS/JS vanilla pur.
Aucun framework, aucun build step — fonctionne directement via `file://`.

Fonts : [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), [Inter](https://fonts.google.com/specimen/Inter), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — Google Fonts.

Licence : **MIT**
