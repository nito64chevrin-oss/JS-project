// Nettoyer un film
export function cleanMovie(movie) {
  const rawTitle = movie.title ?? movie.titre;
  const rawYear = movie.year ?? movie.annee;
  const rawRating = movie.rating ?? movie.note;
  const rawDuration = movie.duration ?? movie.duree;
  const rawDirector = movie.director ?? movie.realisateur;
  const rawBudget = movie.budget;

  return {
    title: String(rawTitle || '').trim() || "Titre inconnu",
    year: parseInt(rawYear, 10) || null,
    rating: parseFloat(rawRating) || 0,
    duration: parseInt(rawDuration, 10) || 0,
    genre: String(movie.genre || '').trim() || "Inconnu",
    director: String(rawDirector || '').trim() || "Inconnu",
    budget: parseInt(rawBudget, 10) || 0
  };
}

// Vérifier un film
export function isValidMovie(movie) {
  if (!movie.title) return false;
  if (movie.year && (movie.year < 1888 || movie.year > 2100)) return false;
  if (movie.rating && (movie.rating < 0 || movie.rating > 10)) return false;
  return true;
}

// Nettoyer tout le dataset
export function cleanDataset(data) {
  return data
    .map(cleanMovie)
    .filter(isValidMovie);
}

// Valider et nettoyer les données (alternative)
export function validateAndClean(data) {
  return data
    .filter(obj => Object.keys(obj).length > 1)
    .map(obj => {
      const objPropre = {}
      for (let cle in obj) {
        const valeur = obj[cle] !== undefined ? obj[cle].trim() : ''
        if (!isNaN(valeur) && valeur !== '') {
          objPropre[cle] = parseFloat(valeur)
        } else {
          objPropre[cle] = valeur
        }
      }
      return objPropre
    })
}

// Extraire les colonnes numériques
export function GetStaticData(parserFile) {
  const res = {}
  for (let colonne in parserFile[0]) {
    if (typeof parserFile[0][colonne] == "number") {
      res[colonne] = []
      for (let i = 0; i < parserFile.length; i++) {
        res[colonne].push(parserFile[i][colonne])
      }
    }
  }
  return res
}

export function moyTableau(arr) {
  let somme = 0
  for (let i = 0; i < arr.length; i++) somme += arr[i]
  return somme / arr.length
}

export function moyenne(colonnes) {
  const res = {}
  for (let colonne in colonnes) {
    const diviseur = colonnes[colonne].length
    let dividende = 0
    for (let i = 0; i < diviseur; i++) {
      dividende += colonnes[colonne][i]
    }
    res[colonne] = dividende / diviseur
  }
  return res
}

export function minimum(colonnes) {
  const res = {}
  for (let colonne in colonnes) {
    let min = colonnes[colonne][0]
    for (let i = 0; i < colonnes[colonne].length; i++) {
      if (colonnes[colonne][i] <= min) {
        min = colonnes[colonne][i]
      }
    }
    res[colonne] = min
  }
  return res
}

export function maximum(colonnes) {
  const res = {}
  for (let colonne in colonnes) {
    let max = colonnes[colonne][0]
    for (let i = 1; i < colonnes[colonne].length; i++) {
      if (colonnes[colonne][i] >= max) {
        max = colonnes[colonne][i]
      }
    }
    res[colonne] = max
  }
  return res
}

export function mediane(colonnes) {
  const res = {}
  for (let colonne in colonnes) {
    const trie = [...colonnes[colonne]].sort((a, b) => a - b)
    const milieu = Math.floor(trie.length / 2)
    if (trie.length % 2 == 0) {
      res[colonne] = (trie[milieu - 1] + trie[milieu]) / 2
    } else {
      res[colonne] = trie[milieu]
    }
  }
  return res
}

export function ecart_type(colonnes) {
  const res = {}
  for (let colonne in colonnes) {
    const moyColonne = moyTableau(colonnes[colonne])
    const carres = []
    for (let i = 0; i < colonnes[colonne].length; i++) {
      const diff = colonnes[colonne][i] - moyColonne
      carres.push(diff ** 2)
    }
    res[colonne] = Math.sqrt(moyTableau(carres))
  }
  return res
}

export function normaliser(valeur, min, max) {
  return (valeur - min) / (max - min)
}

export function distanceEuclidienne(filmA, filmB, features) {
  let somme = 0
  for (let feature of features) {
    const diff = filmA[feature] - filmB[feature]
    somme += diff ** 2
  }
  return Math.sqrt(somme)
}

export function distanceNormalisee(filmA, filmB, features, min, max) {
  let somme = 0
  for (let feature of features) {
    const a = normaliser(filmA[feature], min[feature], max[feature])
    const b = normaliser(filmB[feature], min[feature], max[feature])
    somme += (a - b) ** 2
  }
  return Math.sqrt(somme)
}

export function kNN(dataset, filmCible, k, features) {
  const colonnes = GetStaticData(dataset)
  const min = minimum(colonnes)
  const max = maximum(colonnes)
  const tab = []

  for (let i = 0; i < dataset.length; i++) {
    const display = {}
    display["film"] = dataset[i]
    display["distance"] = distanceNormalisee(filmCible, dataset[i], features, min, max)
    tab.push(display)
  }

  tab.sort((a, b) => a["distance"] - b["distance"])
  return tab.slice(1, k + 1) 
}

function getMovieTitle(movie) {
  return String(movie?.titre ?? movie?.title ?? '').trim()
}

function getFeatureValue(movie, feature) {
  const aliases = {
    note: ['note', 'rating'],
    rating: ['rating', 'note'],
    duree: ['duree', 'duration'],
    duration: ['duration', 'duree'],
    annee: ['annee', 'year'],
    year: ['year', 'annee'],
    budget: ['budget']
  }

  const keys = aliases[feature] || [feature]
  for (const key of keys) {
    const value = Number(movie?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }

  return 0
}

function toLegacyNumericMovie(movie) {
  return {
    titre: getMovieTitle(movie),
    note: getFeatureValue(movie, 'note'),
    duree: getFeatureValue(movie, 'duree'),
    annee: getFeatureValue(movie, 'annee'),
    budget: getFeatureValue(movie, 'budget')
  }
}

export function rechercherFilms(dataset, recherche) {
  return dataset.filter(film =>
    getMovieTitle(film).toLowerCase().startsWith(recherche.toLowerCase())
  )
}

export function formaterNombre(colonne, valeur) {
  if (colonne === 'annee') {
    return Math.round(valeur)
  }
  return parseFloat(valeur.toFixed(2))
}

export function filtrerStat(colonne, colonnes) {
  for (let col in colonnes) {
    document.getElementById(`stat-${col}`).classList.add('cache')
  }
  document.getElementById(`stat-${colonne}`).classList.remove('cache')
}

export function afficherStat(colonnes) {
  for (let colonne in colonnes) {
    document.getElementById(`stat-${colonne}`).classList.remove('cache')
  }
}

export function ExhibitStat(file) {
  const colonnes = GetStaticData(file)
  const statFile = document.getElementById('statFile')
  statFile.innerHTML = ''
  document.getElementById('filtre-File').innerHTML = ''

  const moy      = moyenne(colonnes)
  const min      = minimum(colonnes)
  const max      = maximum(colonnes)
  const median   = mediane(colonnes)
  const ecarttype = ecart_type(colonnes)

  const boutonTout = document.createElement('button')
  boutonTout.textContent = "Tout afficher"
  boutonTout.id = "btn-toutAfficher"
  boutonTout.addEventListener('click', () => afficherStat(colonnes))
  document.getElementById('filtre-File').appendChild(boutonTout)

  for (let colonne in colonnes) {
    const bouton = document.createElement('button')
    bouton.textContent = `${colonne}`
    bouton.id = `btn-${colonne}`
    bouton.addEventListener('click', () => filtrerStat(colonne, colonnes))
    document.getElementById('filtre-File').appendChild(bouton)

    statFile.innerHTML += `
      <p id="stat-${colonne}">${colonne} → 
        Moyenne : ${formaterNombre(colonne, moy[colonne])} | 
        Minimum : ${formaterNombre(colonne, min[colonne])} | 
        Maximum : ${formaterNombre(colonne, max[colonne])} |
        Mediane : ${formaterNombre(colonne, median[colonne])} |
        Ecart-type : ${formaterNombre(colonne, ecarttype[colonne])}
      </p>
    `
  }
}

export function DisplayAllMovies(dataset) {
  document.getElementById('display-films').innerHTML = ''
  for (let i = 0; i < dataset.length; i++) {
    const bouton = document.createElement('button')
    bouton.textContent = getMovieTitle(dataset[i])
    bouton.id = `btn-film-${i}`
    bouton.addEventListener('click', () => {
      window.filmCibleActuel = dataset[i]
      document.getElementById('display-title').innerHTML = `<h3>Film sélectionné : ${getMovieTitle(window.filmCibleActuel)}</h3>`
      ExhibitKNN(dataset, window.filmCibleActuel)
    })
    document.getElementById('display-films').appendChild(bouton)
  }
}

export function ExhibitKNN(dataset, filmCible) {
  if (!Array.isArray(dataset) || dataset.length < 2 || !filmCible) {
    document.getElementById('display-knn').innerHTML = '<p>Pas assez de donnees pour le KNN.</p>'
    return
  }

  document.getElementById('display-knn').innerHTML = ''
  document.getElementById('valeurK').classList.remove('cache')
  document.getElementById('valeurK').max = dataset.length - 1

  const k        = parseInt(document.getElementById('valeurK').value)
  const features = ["note", "duree", "annee", "budget"]
  const normalizedDataset = dataset.map(toLegacyNumericMovie)
  const normalizedTarget = toLegacyNumericMovie(filmCible)
  const resultats = kNN(normalizedDataset, normalizedTarget, k, features)

  document.getElementById('display-knn').innerHTML = `<h3>Films similaires à ${getMovieTitle(filmCible)}</h3>`
  for (let res of resultats) {
    document.getElementById('display-knn').innerHTML += `
      <p>${getMovieTitle(res["film"])} — distance : ${res["distance"].toFixed(2)}</p>
    `
  }
}

// Initialiser le listener pour valeurK
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const inputK = document.getElementById('valeurK')
    if (inputK) {
      inputK.addEventListener('input', () => {
        if (window.filmCibleActuel) {
          ExhibitKNN(window.currentDataset || [], window.filmCibleActuel)
        }
      })
    }
  })
} else {
  const inputK = document.getElementById('valeurK')
  if (inputK) {
    inputK.addEventListener('input', () => {
      if (window.filmCibleActuel) {
        ExhibitKNN(window.currentDataset || [], window.filmCibleActuel)
      }
    })
  }
}