Test = document.getElementById('statFile');

function filtrerStat(colonne, colonnes) {
  for (let col in colonnes) {
    document.getElementById(`stat-${col}`).classList.add('cache')
  }
  document.getElementById(`stat-${colonne}`).classList.remove('cache')
}

function afficherStat(colonnes) {
  for (let colonne in colonnes) {
    document.getElementById(`stat-${colonne}`).classList.remove('cache')
  }
}



// Va créer un obj de chaque valeur des colonnes qui contiennent des typeof = à "number"
function GetStaticData(parserFile) {
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

function moyenne(colonnes) {
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

function minimum(colonnes) {
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

function maximum(colonnes) {
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

function mediane(colonnes) {
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

function ecart_type(colonnes) {
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

function moyTableau(arr) {
  let somme = 0
  for (let i = 0; i < arr.length; i++) somme += arr[i]
  return somme / arr.length
}

function validateAndClean(data) {
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

function rechercherFilms(dataset, recherche) {
  return dataset.filter(film => 
    film.titre.toLowerCase().startsWith(recherche.toLowerCase())
  )
}

function formaterNombre(colonne, valeur) {
  if (colonne === 'annee') {
    return Math.round(valeur)
  }
  return parseFloat(valeur.toFixed(2))
}

function DisplayAllMovies(colonnes) {
  for (let i = 0; i < dataset.length; i++) {
    const bouton = document.createElement('button')
    bouton.textContent = dataset[i].titre
    bouton.id = `btn-${i}`
    bouton.addEventListener('click', () => {
    })
    document.getElementById('display-films').appendChild(bouton)
  }
}

function DisplayAllCategories(colonnes) {
  for (let colonne in colonnes) {
    const bouton = document.createElement('button')
    bouton.textContent = `${colonne}`
    bouton.id = `btn-${colonne}`
    document.getElementById('display-catégorie').appendChild(bouton)
}
  }

function ExhibitStat(file) {
  const colonnes = GetStaticData(file)
  Test.innerHTML = ''
  document.getElementById('filtre-File').innerHTML = ''
  const moy = moyenne(colonnes)
  const min = minimum(colonnes)
  const max = maximum(colonnes)
  const median = mediane(colonnes)
  const ecarttype = ecart_type(colonnes)
  const boutonTout = document.createElement('button')
  boutonTout.textContent = "Tout afficher"
  boutonTout.id = "btn-toutAfficher"
  boutonTout.addEventListener('click', () => afficherStat(colonnes))
  document.getElementById('filtre-File').appendChild(boutonTout)
  DisplayAllCategories(colonnes)
  for (let colonne in colonnes) {
    const bouton = document.createElement('button')
    bouton.textContent = `${colonne}`
    bouton.id = `btn-${colonne}`
    bouton.addEventListener('click', () => filtrerStat(colonne, colonnes))
    document.getElementById('filtre-File').appendChild(bouton)

    Test.innerHTML += `
      <p id="stat-${colonne}">${colonne} → 
        Moyenne : ${formaterNombre(colonne, moy[colonne])} | 
        Minimum : ${formaterNombre(colonne, min[colonne])} | 
        Maximum : ${formaterNombre(colonne, max[colonne])} |
        Mediane: ${formaterNombre(colonne, median[colonne])} |
        Ecart-type: ${formaterNombre(colonne, ecarttype[colonne])}
      </p>
    `
  }
}