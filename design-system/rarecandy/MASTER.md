# RareCandy : système de design (référence)

Source de vérité pour l'app iPhone (SwiftUI) et le prototype web (`prototype/index.html`).
Établi avec le skill UI UX Pro Max (`.claude/skills/ui-ux-pro-max`), en gardant les choix
explicites du propriétaire : palette Ocean Breeze, style minimaliste en verre dépoli,
mise en page inspirée de Hevy. La proposition générique du skill pour une app de fitness
(orange vif, Barlow Condensed) a été écartée volontairement.

## Couleurs

Palette : `#0B3D91` marine, `#3BA7F2` bleu, `#7FE7D6` menthe, `#E8F6FF` fond.
Dosage en thème clair : 35 % fond, 30 % menthe, 25 % bleu, 10 % marine.

| Jeton | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `bg` | `#E8F6FF` | `#061B40` | Fond de l'app (+ taches floues menthe et bleu) |
| `ink` | `#0B3D91` | `#E8F6FF` | Texte principal, icônes |
| `ink-2` | marine 90 % | fond clair 86 % | Texte secondaire |
| `surface` | verre teinté (E8F6FF 64 % vers menthe 24 %) | verre (E8F6FF 11 % vers menthe 6 %) | Cartes |
| `surface-solid` | E8F6FF + 12 % bleu | `#0A2754` | Feuilles, dialogues, minuteur |
| `cta-bg` / `cta-fg` | bleu / marine | menthe / marine | Grand bouton principal (un seul par écran) |
| `pill-bg` / `pill-fg` | marine / fond clair | menthe / marine | Petits boutons principaux, segment actif, toast |
| `up-bg` / `up-fg` | marine / menthe | menthe / marine | « Monte la charge » |
| `tab-bg` | marine 92 % | `#0A2754` 94 % | Barre d'onglets flottante (onglet actif en menthe) |
| `data` / `data-now` | marine / bleu | bleu / menthe | Barres et courbes / semaine en cours |
| `danger` | `#B4232B` | `#FF8A8F` | Actions destructives |
| `warn` | `#9A4A06` | `#FFB86B` | Alerte de stagnation |
| `ok-text` | `#0B6B57` | menthe | Objectif atteint |

### Contraste (règle du skill : texte 4,5:1, éléments non textuels 3:1)

- Marine sur bleu `#3BA7F2` = 3,8:1. Autorisé seulement pour le grand texte
  (19 px gras minimum, ex. « Commencer »). Jamais pour un petit libellé.
- Marine sur menthe = 6,8:1 et marine sur fond = 9,1:1 : utilisables partout.
- Les graphiques utilisent le marine (clair) ou le bleu (sombre) pour rester à 3:1 minimum.
- Le texte secondaire ne descend pas sous 82 % d'opacité du marine en thème clair.

## Typographie

Manrope (une seule famille). Échelle : 12 / 13 / 15 / 16-17 / 19 / 22 / 32 px.
Poids : 600 texte, 700 libellés, 800 titres et chiffres. Chiffres tabulaires pour toutes les
valeurs (charges, reps, minuteurs). Aucun texte sous 12 px.
SwiftUI : Manrope embarquée, ou SF Pro en repli ; respecter Dynamic Type.

## Formes, espacements, cibles

- Rayons : cartes 22, boutons 16, champs 12, puces et barres en pilule.
- Espacements sur une grille de 4/8 px ; marges latérales 16-20 px.
- Toute cible tactile fait au moins 44 x 44 px (cases KG/RÉPS, coches, menus ⋮, pas +/-).

## Composants clés

- **Tableau de séries** (inspiré de Hevy) : SÉRIE | PRÉCÉDENT | KG | RÉPS | coche.
  Pré-rempli avec l'objectif ; la colonne Précédent montre la dernière perf.
  Série validée : fond menthe + coche (couleur et icône, jamais la couleur seule).
  Saisie invalide : bordure rouge + message sous la ligne (« Entre un nombre »).
- **Minuteur de repos** : pilule en bas, démarre à la validation d'une série, -15 / +15 / Passer.
- **Toast** : en bas, au-dessus du minuteur et des onglets, 3 s (5 s s'il propose Annuler).
- **Bouton principal** : un seul par écran (Accueil : Commencer ; Entraînement : la routine suivante).

## Comportements (règles UX du skill)

- Confirmer avant une action destructive ; proposer Annuler quand c'est possible
  (retirer une série).
- Terminer une séance incomplète demande confirmation (séries non validées non enregistrées).
- Quitter l'éditeur de routine avec des changements demande confirmation.
- Libellé visible pour chaque champ (pas de placeholder seul).

## Mouvement

- Durées : appui 120 ms, état 240 ms, changement d'écran 380 ms ; ressort pour les éléments qui arrivent.
- Animer uniquement transform et opacity.
- Chaque animation répond à une action (validation, navigation, bilan). Pas de mouvement décoratif
  permanent (le fond est fixe).
- `prefers-reduced-motion` / Réduire les animations : tout devient instantané.
- SwiftUI : `.sensoryFeedback(.success, trigger:)` à la validation d'une série.

## Anti-patterns à éviter

- Bleu `#3BA7F2` derrière du petit texte.
- Verre trop transparent derrière du texte (barre d'onglets sombre opaque à 94 %).
- Plusieurs boutons principaux sur un même écran.
- Emojis comme icônes : utiliser une seule famille (Phosphor sur le web, SF Symbols sur iOS).
