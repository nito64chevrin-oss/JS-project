# DataMind

## Présentation du projet

**DataMind** est un site web de data / IA écrit en JavaScript, sans framework. Il charge un jeu de données au format CSV ou JSON, le nettoie, en calcule les statistiques descriptives et propose des recommandations grâce à un algorithme **k-NN** (k plus proches voisins).

Le projet est pensé autour d'un jeu de données de films : à partir d'un film choisi, DataMind retrouve les films qui lui ressemblent le plus.

### Fonctionnalités principales

**Chargement des données**

- Import d'un fichier local `.csv` ou `.json`
- Chargement depuis une URL, avec détection automatique du format (JSON ou CSV)
- Zone de texte pour coller des données brutes (affichage ; l'analyse du texte collé est en cours de développement)

**Nettoyage et tri**

- Parseur CSV maison (pas de bibliothèque externe)
- Suppression des lignes vides ou incomplètes
- Suppression des espaces superflus et conversion automatique des valeurs numériques
- Recherche de films par titre

**Statistiques**

Pour chaque colonne numérique du jeu de données :

- Moyenne
- Minimum et maximum
- Médiane
- Écart-type

Un bouton par colonne permet de filtrer l'affichage, et un bouton « Tout afficher » de revenir à la vue complète.

**k-NN (k plus proches voisins)**

- Sélection d'un film cible dans la liste
- Calcul de la distance euclidienne sur les critères `note`, `duree`, `annee` et `budget`
- Normalisation min-max des valeurs, pour qu'aucun critère n'écrase les autres (le budget face à la note, par exemple)
- Valeur de `k` réglable, avec mise à jour instantanée des résultats

### Format de données attendu

Le k-NN et la recherche s'appuient sur les colonnes suivantes :

```csv
titre,note,duree,annee,budget
Inception,8.8,148,2010,160
Interstellar,8.6,169,2014,165
```

Un fichier JSON doit contenir un tableau d'objets avec les mêmes clés.

## Prérequis

- Un navigateur récent (Chrome, Firefox ou Edge)
- [Visual Studio Code](https://code.visualstudio.com/)
- L'extension VS Code [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- [Git](https://git-scm.com/) pour cloner le dépôt

**Node.js n'est pas nécessaire** : le projet tourne entièrement dans le navigateur et n'a aucune dépendance à installer. Node.js 18 ou plus récent est utile uniquement si vous préférez lancer un serveur local en ligne de commande plutôt qu'avec Live Server.

## Installation et lancement

1. Cloner le dépôt :

   ```bash
   git clone https://github.com/nito64chevrin-oss/JS-project.git
   cd datamind
   ```

2. Ouvrir le dossier dans VS Code :

   ```bash
   code .
   ```

3. Lancer le site : clic droit sur `index.html`, puis **Open with Live Server**. Le site s'ouvre dans le navigateur, en général sur `http://127.0.0.1:5500`.

Alternative sans Live Server, avec Node.js :

```bash
npx serve .
```

### Utilisation

1. Importer un fichier CSV ou JSON avec le sélecteur de fichier, ou saisir une URL.
2. Consulter les statistiques calculées pour chaque colonne numérique.
3. Cliquer sur un film pour afficher ses plus proches voisins.
4. Ajuster la valeur de `k` pour afficher plus ou moins de films similaires.

> Le chargement par URL ne fonctionne que si le serveur distant autorise les requêtes externes (CORS).

## Arborescence du projet

```
datamind/
├── index.html        # Structure de la page
├── style.css         # Mise en forme
├── js/
│   ├── loader.js     # Chargement (fichier, URL, texte) et parseur CSV
│   └── stats.js      # Nettoyage, statistiques, k-NN et affichage
├── data/
│   └── films.csv     # Jeu de données d'exemple
└── README.md
```

## Équipe

- Baptiste Chevrin
- Ethan Leglise
