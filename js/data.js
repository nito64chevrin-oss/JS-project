test = document.getElementById('statFile');

// Va créer un obj de chaque valeur des colonnes qui contiennent des typeof = à "number"
function GetStaticData(file) {
  const res = {}
  const parserFile = parserCSV(file)

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
    const moyColonne = moyenne(colonnes[colonne])
    const carres = []
    for (let i = 0; i < colonnes[colonne].length; i++) {
      const diff = colonnes[colonne][i] - moyColonne
      carres.push(diff ** 2)
    }
    res[colonne] = Math.sqrt(moyenne(carres))
  }
  return res
}

function ExhibitStat(file) {
    const colonnes = GetStaticData(file)
    for (let colonne in colonnes) {
        const moy = moyenne(colonnes)
        const min = minimum(colonnes)
        const max = maximum(colonnes)
        const median = mediane(colonnes)
        const ecarttype = ecart_type(colonnes)
    }
    for (let colonne in colonnes) {
        test.innerHTML += `
        <p>${colonne} → 
            moy: ${moy[colonne]} | 
            min: ${min[colonne]} | 
            max: ${max[colonne]}
            mediane: ${median[colonne]}
            écart-type: ${ecarttype[colonne]}
        </p>
        `
  }
}