console.log("LOADER CHARGÉ");
import { cleanDataset } from './data.js';
import { renderVisualizations } from './visualization.js';

const boutonurl = document.getElementById('btnRechercheURL');
const boutonTexte = document.getElementById('btnAnalyserTexte');
test = document.getElementById('test');
test2 = document.getElementById('test2')
testfile = document.getElementById('testfile')

async function loadFromURL (url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error ( 'HTTP $ {response. status}');
        const contentType = response.headers.get ('Content-Type') ;
        if (contentType.includes ('json') ) {
            return await response.json();
        } else {
            const text = await response.text();
            return parseCSV(text); // Voir ci-dessous
        }
    } catch (error) {
        console.error("Erreur de chargement :", error);
    }
}

// =======================
// 🔹 Chargement fichier local
// =======================
function loadFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsText(file, 'UTF-8');
  });
}

function loadFromText (rawText) { /* parser directement */ }


function parserCSV (csv) {
  const res = []
  const lignes = csv.split('\n')
  const names = lignes[0].split(',')
  for (let i = 1; i < lignes.length ; i++) {
    const Obj = {}
    const categories = lignes[i].split(',')
    for (let y in names) {
      Obj[names[y]] = categories[y]
    }

    res.push(obj);
  }

  return res;
}

function GetStaticData (file) {
  const res = []
  const parserFile = parserCSV(file)
  for (let i = 0; i < parserFile.length; i++) {
    if (typeof parserFile[i] == "number") {

    }
  }

}

// Va vérifier si il s'agit d'une URL
function estUneURL(texte) {
  try {
    new URL(texte);
    return true;
  } catch (e) {
    return false;
  }
}


boutonurl.addEventListener('click', async () => { 
  const valeururl = document.getElementById('URL_finder').value;
  
  if (estUneURL(valeururl)) {
    const resulturl = await loadFromURL(valeururl);
    test.textContent = JSON.stringify(resulturl);
  } else {
    test.textContent = "Il ne s'agit pas d'une URL";
  }
});

document.getElementById('monFichier').addEventListener('change', async (e) => {
  const file = e.target.files[0];

  if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
    console.error("Fichier non supporté");
    return;
  }
  const resfile = await loadFromFile(file);
  if (file.name.endsWith('.csv')){
    testfile.textContent = JSON.stringify(parserCSV(resfile), null, 2)
  }
  else {
    testfile.textContent = resfile
  }
});



boutonTexte.addEventListener('click', () => {
  const texteColle = document.getElementById('texte_brut').value;

  try {
    const data = parseTextInput(texteColle);
    const cleanData = cleanDataset(data);
    test2.textContent = JSON.stringify(cleanData, null, 2);
    renderVisualizations(cleanData);
  } catch (error) {
    test2.textContent = `Erreur d'analyse: ${error.message}`;
  }
});