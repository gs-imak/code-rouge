# Assaut — médias à fournir par le/la graphiste

Les écrans sont reproduits **1-to-1** sur la maquette Figma (`App_Assaut`, fichier
`k0i1WhiVTUIIt4PRgQWjQa`). Le typographie (Roboto) et tout l'habillage vectoriel
(fond tactique, en-tête, brackets HUD, boutons) sont intégrés. Restent les médias
**raster** (photos, vidéos) : ils sont aujourd'hui des **placeholders neutres**
(règle immuable #3 — aucun fetch réseau, aucun raster sous licence embarqué tant
que le définitif n'est pas livré, comme on l'a fait pour le fond istock remplacé
par un vecteur).

Merci de livrer les fichiers ci-dessous (PNG/JPG pour les photos, MP4 H.264 pour
les vidéos), nommés tels quels, à déposer dans `apps/assaut/assets/media/`.

## Photos

| Fichier attendu | Dimensions (px) | Écran / nœud Figma | Placeholder actuel |
|---|---|---|---|
| `choix-frontale.jpg` | 420×251 | Choix Approche, carte « Assaut frontal » (`29:3485` › Rectangle 9239) | dégradé bleu-gris |
| `choix-furtive.jpg` | 420×251 | Choix Approche, carte « Assaut furtif » (`29:3485` › Rectangle 9240) | dégradé bleu-gris |
| `point-acces-toits.jpg` | 494×370 | Validation point d'accès, photo de droite (« 3.1 trappe désenfumage 1 », `29:3449`) | carré sombre « toits » |
| `mcgyver-photo-*.jpg` | ~788×573 | Mc Gyver Photo, popin reçue (`20`, variantes 1 & 2 : fenêtre brisée + sacoche d'outils) | popin sombre |

> Les photos « breach » (frontale/furtive), la photo toits et les photos Mc Gyver
> apparaissent dans la maquette comme des rasters **sous licence/stock** : on ne les
> embarque pas tant qu'on n'a pas le fichier source libre de droits. Merci de fournir
> les définitifs (ou de confirmer la licence).

## Vidéos (étapes d'assaut)

Chaque étape « Assaut lancé » (Début, Général, Interaction, Perdus, Patrouille,
Perdus 2, Mc Gyver, RDV Indic, Couper le fil, Épilogue) joue une vidéo locale dans
le cadre média (HUD brackets). En attendant : forme d'onde animée (placeholder).

| Fichier attendu | Cadre média (px) | Étape |
|---|---|---|
| `etape-debut.mp4` … | ~1280×720, cadré dans 728×344 (interactif) ou plein cadre (passif) | une par étape, voir `assets/config/sequence.json` |

Format : MP4 H.264, muet ou avec piste audio locale, lecture en boucle. Pas de
flux réseau (règle #3). Chemins définis dans `sequence.json` (`mediaPath`).

## Fond plein-cadre (affichage hors-format) — TODO

Les écrans sont une **toile fixe 1440×1024** (aspect 1.406), centrée + letterboxée
sur un affichage d'un autre ratio. Le fond Figma (`Layer_1`, 1803×970) ne déborde
le cadre que de ~360px à droite : **insuffisant pour remplir les barres** d'un
écran 16:9 (mallette ≈ 1920×1080 → ~200px de barres latérales). Aujourd'hui les
barres prennent `#080d1a` (la teinte de bord du fond Figma).

À fournir : un **fond tactique plein-cadre** dessiné pour la résolution réelle de
la mallette (contour jusqu'aux bords, brackets HUD aux vrais coins). Bloquant :
**confirmer la résolution native de l'écran mallette**. Vu avec le client le
2026-06-03, laissé en TODO.

## Icône application

| Fichier | Format | Usage |
|---|---|---|
| `app-icon` | `.ico` (256×256) + `.png` | Icône de l'exécutable Windows (electron-builder) |

## Contenu (Nathanaël — pas graphiste)

- **Mc Gyver, sélection d'objets** (écran 20, fond) : liste des 7 outils + règle
  « Sélectionnez 2 éléments ». C'est du **contenu** (CDC), à mettre dans
  `sequence.json`, pas un asset graphique. Le style de puce est déjà conforme
  (`.step__response`).
- Textes d'accueil, sous-titres d'étapes, libellés de réponses : contenu CDC.

## Coquilles maquette à confirmer (on a livré la version corrigée)

| Maquette | Livré |
|---|---|
| « Choisisser l'approche… » | « Choisir l'approche… » |
| « Assault frontal / furtif » | « Assaut frontal / furtif » |
| « C'est partie ! » | « C'est parti ! » |
| « Saisisser le point d'entrée… » | « Saisir le point d'entrée… » |

Merci de valider ces corrections orthographiques (ou de nous dire si la maquette
fait foi).
