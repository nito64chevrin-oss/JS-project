console.log('LOADER CHARGE');
import { cleanDataset } from './data.js';
import { renderVisualizations } from './visualization.js';

const boutonURL = document.getElementById('btnRechercheURL');
const boutonTexte = document.getElementById('btnAnalyserTexte');
const boutonRecherche = document.getElementById('btnRecherche');

const sortieURL = document.getElementById('test');
const sortieTexte = document.getElementById('test2');
const sortieFichier = document.getElementById('testfile');

const listeFilms = document.getElementById('display-films');
const sortieRecoTitre = document.getElementById('display-title');
const sortieRecoCategorie = document.getElementById('display-catégorie');

let currentDataset = [];

async function loadFromURL(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('json')) {
    return await response.json();
  }

  const text = await response.text();
  return parseCSV(text);
}

function loadFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsText(file, 'UTF-8');
  });
}

function parseCSV(csv) {
  const rows = csv.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!rows.length) return [];

  const headers = rows[0].split(',').map((h) => h.trim());
  const result = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i].split(',');
    const obj = {};

    for (let j = 0; j < headers.length; j += 1) {
      obj[headers[j]] = values[j]?.trim() ?? '';
    }

    result.push(obj);
  }

  return result;
}

function parseTextInput(rawText) {
  const input = rawText.trim();
  if (!input) throw new Error('Aucun texte fourni');

  try {
    const json = JSON.parse(input);
    return Array.isArray(json) ? json : [json];
  } catch {
    return parseCSV(input);
  }
}

function isURL(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

function updateRecommendations(data) {
  currentDataset = Array.isArray(data) ? data : [];

  if (!listeFilms || !sortieRecoTitre || !sortieRecoCategorie) return;

  listeFilms.innerHTML = '';
  sortieRecoTitre.innerHTML = '<p>Selectionne un film pour voir des recommandations.</p>';
  sortieRecoCategorie.innerHTML = '';

  currentDataset.slice(0, 30).forEach((movie) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = movie.title;
    btn.addEventListener('click', () => showRecommendationsFor(movie));
    listeFilms.appendChild(btn);
  });
}

function showRecommendationsFor(selectedMovie) {
  if (!sortieRecoTitre || !sortieRecoCategorie) return;

  const byGenre = currentDataset
    .filter((movie) => movie.title !== selectedMovie.title && movie.genre === selectedMovie.genre)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const closeInRating = currentDataset
    .filter((movie) => movie.title !== selectedMovie.title)
    .sort((a, b) => Math.abs(a.rating - selectedMovie.rating) - Math.abs(b.rating - selectedMovie.rating))
    .slice(0, 5);

  sortieRecoTitre.innerHTML = `<h4>Film choisi: ${selectedMovie.title}</h4>`;

  const genreList = byGenre.length
    ? byGenre.map((m) => `<li>${m.title} (${m.genre}, note ${m.rating})</li>`).join('')
    : '<li>Aucune recommandation de meme genre.</li>';

  const ratingList = closeInRating.length
    ? closeInRating.map((m) => `<li>${m.title} (note ${m.rating})</li>`).join('')
    : '<li>Aucune recommandation proche en note.</li>';

  sortieRecoCategorie.innerHTML = `
    <h4>Suggestions par genre</h4>
    <ul>${genreList}</ul>
    <h4>Suggestions par note proche</h4>
    <ul>${ratingList}</ul>
  `;
}

function applyDataset(rawData, outputElement) {
  const cleanData = cleanDataset(rawData);
  outputElement.textContent = JSON.stringify(cleanData, null, 2);
  renderVisualizations(cleanData);
  updateRecommendations(cleanData);
}

boutonURL.addEventListener('click', async () => {
  const valueURL = document.getElementById('URL_finder').value.trim();

  if (!isURL(valueURL)) {
    sortieURL.textContent = "Il ne s'agit pas d'une URL valide";
    return;
  }

  try {
    const data = await loadFromURL(valueURL);
    applyDataset(data, sortieURL);
  } catch (error) {
    sortieURL.textContent = `Erreur URL: ${error.message}`;
  }
});

document.getElementById('monFichier').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  if (!file) {
    sortieFichier.textContent = 'Aucun fichier selectionne';
    return;
  }

  if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
    sortieFichier.textContent = 'Fichier non supporte (.csv ou .json)';
    return;
  }

  try {
    const rawText = await loadFromFile(file);
    const data = file.name.endsWith('.csv') ? parseCSV(rawText) : JSON.parse(rawText);
    applyDataset(data, sortieFichier);
  } catch (error) {
    sortieFichier.textContent = `Erreur fichier: ${error.message}`;
  }
});

boutonTexte.addEventListener('click', () => {
  const rawText = document.getElementById('texte_brut').value;

  try {
    const data = parseTextInput(rawText);
    applyDataset(data, sortieTexte);
  } catch (error) {
    sortieTexte.textContent = `Erreur d'analyse: ${error.message}`;
  }
});

if (boutonRecherche) {
  boutonRecherche.addEventListener('click', () => {
    const query = String(document.getElementById('rechercheFilm')?.value || '').trim().toLowerCase();
    if (!query) {
      sortieRecoTitre.innerHTML = '<p>Entre un titre de film.</p>';
      return;
    }

    const found = currentDataset.find((movie) => movie.title.toLowerCase().includes(query));
    if (!found) {
      sortieRecoTitre.innerHTML = '<p>Aucun film trouve avec cette recherche.</p>';
      sortieRecoCategorie.innerHTML = '';
      return;
    }

    showRecommendationsFor(found);
  });
}