# RareCandy

App iOS de musculation qui suit la **surcharge progressive** à ta place.

Tu crées tes jours d'entraînement (Jour 1 : Pecs, Jour 2 : Dos…), tu notes tes séries,
et à la séance suivante du même jour l'app te donne ton objectif :

> Jour 1 (Pecs) : développé couché **3 × 10 @ 60 kg**
> → la prochaine séance Pecs, objectif **3 × 11 @ 60 kg**
> → … jusqu'à **3 × 15** → l'app te dit de **monter la charge** : **3 × 10 @ 62,5 kg**

## Fonctionnalités (v0.1, partie fonctionnelle)

- **Programme** : jours d'entraînement dans l'ordre de ta rotation, avec leurs exercices.
  Pour chaque exercice : nombre de séries, fourchette de répétitions (10–15 par défaut),
  charge à ajouter quand le haut de la fourchette est atteint (2,5 kg par défaut).
- **Prochaine séance** : l'app propose le jour qui suit ta dernière séance
  (Jour 1 → Jour 2 → Jour 3 → Jour 1…) et affiche les objectifs de chaque exercice.
- **Séance en cours** : les séries sont pré-remplies avec l'objectif ; tu ajustes la charge et
  les reps réellement faites et tu valides chaque série. La séance est sauvegardée en continu
  (rien n'est perdu si l'app se ferme à la salle).
- **Bilan** : objectif atteint / dépassé / raté pour chaque exercice, record personnel
  (1RM estimé) et objectif de la prochaine fois.
- **Historique** : toutes les séances, et une courbe de progression par exercice.
- **Alerte de stagnation** : après 3 séances sans progrès sur un exercice, l'app le signale.
- Export des données en JSON.

## Règles de progression (double progression)

Le moteur est dans [`ProgressionEngine.swift`](RareCandyKit/Sources/RareCandyKit/ProgressionEngine.swift).

| Dernière séance | Objectif suivant |
| --- | --- |
| Aucune | Trouve une charge pour faire `min` reps (ex. 10) |
| 3 × 10 @ 60 kg | 3 × 11 @ 60 kg (+1 rep **par série**) |
| 12 / 11 / 9 @ 60 kg | 13 / 12 / 10 @ 60 kg |
| 15 / 14 / 13 @ 60 kg | 15 / 15 / 14 (une série au max y reste) |
| 15 / 15 / 15 @ 60 kg | **Monte la charge** : 3 × 10 @ 62,5 kg |
| 15 / 15 (2 séries sur 3) | Pas de montée : il faut toutes les séries prévues |

- La progression est propre à **chaque exercice de chaque jour** : un développé couché
  le Jour 1 et un autre le Jour 4 ont chacun leur historique.
- L'objectif se base toujours sur ce que tu as **réellement fait** la dernière fois
  (si tu rates l'objectif, il reste le même ; si tu le dépasses, il monte d'autant).
- Incrément à 0 kg (poids du corps sans lest) : +1 rep par série, sans plafond.
- Seules les séries validées (✓) sont enregistrées.

## Architecture

```
RareCandyKit/   Package Swift : modèle de données, moteur de progression, sauvegarde JSON.
                Aucune dépendance à l'UI → réutilisable tel quel par un widget,
                une app Apple Watch ou l'intégration Santé. Testé (Swift Testing).
App/            App iOS SwiftUI (iOS 17+) : écrans Séance, Programme, Historique.
project.yml     Description du projet Xcode (XcodeGen).
```

Les données sont un simple fichier JSON (`training.json`). Quand l'App Group sera activé,
le fichier sera automatiquement déplacé dans le conteneur partagé pour que le widget
et la montre puissent le lire.

## Lancer l'app (Mac requis)

1. Installer Xcode (App Store) et [XcodeGen](https://github.com/yonaskolb/XcodeGen) :
   `brew install xcodegen`
2. À la racine du dépôt : `xcodegen generate`, puis ouvrir `RareCandy.xcodeproj`.
3. Dans Xcode, cible **RareCandy** → *Signing & Capabilities* : choisir ton équipe
   (un compte Apple gratuit suffit pour l'installer sur ton iPhone).
   Pour la publication sur l'App Store, il faut le programme Apple Developer (99 €/an)
   et un identifiant unique dans `project.yml` (`PRODUCT_BUNDLE_IDENTIFIER`).
4. Lancer sur le simulateur ou ton iPhone.

Tests du moteur : `cd RareCandyKit && swift test`.

## Prochaines étapes

- [ ] Design de l'app (icône, couleurs, écrans).
- [ ] Widget « prochaine séance » (WidgetKit) : activer l'App Group dans `project.yml`
      et ajouter une cible widget qui lit `training.json` via `RareCandyKit`.
- [ ] App Apple Watch : saisie des séries depuis la montre (même package `RareCandyKit`).
- [ ] Apple Santé (HealthKit) : enregistrer chaque séance comme entraînement
      « Musculation traditionnelle » à la fin de la séance.
- [ ] Minuteur de repos entre les séries.
- [ ] Modifier une séance passée, unité lb, synchronisation iCloud.
