console.log('LOADER CHARGE');
import { cleanDataset } from './data.js';
import { renderVisualizations } from './visualization.js';

const boutonURL = document.getElementById('btnRechercheURL');
const boutonTexte = document.getElementById('btnAnalyserTexte');
const boutonRecherche = document.getElementById('btnRecherche');
const btnGenerateReport = document.getElementById('btnGenerateReport');
const btnExportFilteredJSON = document.getElementById('btnExportFilteredJSON');
const btnExportAnalysisJSON = document.getElementById('btnExportAnalysisJSON');
const btnExportStatsCSV = document.getElementById('btnExportStatsCSV');

const sortieURL = document.getElementById('resultURL') || document.getElementById('test');
const sortieTexte = document.getElementById('resultTexte') || document.getElementById('test2');
const sortieFichier = document.getElementById('resultFichier') || document.getElementById('testfile');
const affichageURL = sortieURL;
const affichageTexte = sortieTexte;
const affichageFichier = sortieFichier;
const topActionBar = document.getElementById('topActionBar');
const topStatsBar = document.getElementById('topStatsBar');
const statTotalFilms = document.getElementById('statTotalFilms');
const statAverageRating = document.getElementById('statAverageRating');
const statStdRating = document.getElementById('statStdRating');
const statAverageBudget = document.getElementById('statAverageBudget');
const loadingWrap = document.getElementById('loadingWrap');
const loadingLabel = document.getElementById('loadingLabel');
const loadingPercent = document.getElementById('loadingPercent');
const loadingBar = document.getElementById('loadingBar');
const messageBox = document.getElementById('messageBox');

const listeFilms = document.getElementById('display-films');
const sortieRecoTitre = document.getElementById('display-title');
const sortieRecoCategorie = document.getElementById('display-catégorie');
const sortieRecoKnnResults = document.getElementById('display-knn-results');
const inputValeurK = document.getElementById('valeurK');
const resultatRecherche = document.getElementById('resultatRecherche');

let currentDataset = [];
let currentFilteredDataset = [];
let currentAnalysis = null;
let dataset = [];
let currentSelectedMovie = null;

function getRecommendationK() {
  const raw = Number(inputValeurK?.value || 5);
  const maxAllowed = Math.max(1, currentDataset.length - 1);
  return Math.max(1, Math.min(maxAllowed, Number.isFinite(raw) ? Math.floor(raw) : 5));
}

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

function loadFromFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const ratio = (event.loaded / event.total) * 100;
        onProgress(ratio);
      }
    };
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

function parserCSV(csv) {
  return parseCSV(csv);
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

function loadFromText(rawText) {
  return parseTextInput(rawText);
}

function isURL(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

function estUneURL(texte) {
  try {
    const url = new URL(texte);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function setLoading(isLoading, label = 'Chargement...', progress = null) {
  if (!loadingWrap || !loadingLabel || !loadingPercent || !loadingBar) return;

  loadingWrap.hidden = !isLoading;
  if (!isLoading) {
    loadingBar.classList.remove('indeterminate');
    loadingBar.style.width = '0%';
    loadingPercent.textContent = '0%';
    return;
  }

  loadingLabel.textContent = label;
  if (typeof progress === 'number') {
    const pct = Math.max(0, Math.min(100, Math.round(progress)));
    loadingBar.classList.remove('indeterminate');
    loadingBar.style.width = `${pct}%`;
    loadingPercent.textContent = `${pct}%`;
  } else {
    loadingBar.classList.add('indeterminate');
    loadingPercent.textContent = '...';
  }
}

function showMessage(type, text) {
  if (!messageBox) return;
  if (!text) {
    messageBox.hidden = true;
    messageBox.textContent = '';
    messageBox.className = 'message-box';
    return;
  }

  messageBox.hidden = false;
  messageBox.className = `message-box ${type}`;
  messageBox.textContent = text;
}

function handleError(context, error) {
  const detail = error?.message || 'Erreur inconnue';
  showMessage('error', `${context}: ${detail}`);
}

function computeTopGenres(data, limit = 5) {
  const counts = new Map();
  data.forEach((movie) => {
    const genre = String(movie.genre || 'Inconnu').trim() || 'Inconnu';
    counts.set(genre, (counts.get(genre) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, count]) => ({ genre, count }));
}

function buildAnalysis(data) {
  const stats = calculerStatsFilms(data);
  return {
    generatedAt: new Date().toISOString(),
    totalFilms: data.length,
    topGenres: computeTopGenres(data, 10),
    stats,
  };
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toStatsCsv(stats) {
  if (!stats) return '';
  const rows = [
    ['metric', 'min', 'max', 'mean', 'median', 'stdDev'],
    ['rating', stats.rating.min, stats.rating.max, stats.rating.mean, stats.rating.median, stats.rating.stdDev],
    ['year', stats.year.min, stats.year.max, stats.year.mean, stats.year.median, stats.year.stdDev],
    ['duration', stats.duration.min, stats.duration.max, stats.duration.mean, stats.duration.median, stats.duration.stdDev],
    ['budget', stats.budget.min, stats.budget.max, stats.budget.mean, stats.budget.median, stats.budget.stdDev],
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function buildNarrativeReportHtml(analysis, data) {
  const topGenresList = analysis.topGenres
    .map((item) => `<li><strong>${item.genre}</strong>: ${item.count} films</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport DataMind</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.5; color: #1e293b; }
    h1, h2 { color: #0f172a; }
    .meta { color: #475569; margin-bottom: 16px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin: 10px 0; background: #f8fafc; }
    ul { margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    th { background: #e2e8f0; }
  </style>
</head>
<body>
  <h1>Rapport d'analyse DataMind</h1>
  <p class="meta">Genere le ${new Date(analysis.generatedAt).toLocaleString('fr-FR')} | ${analysis.totalFilms} films analyses.</p>

  <div class="card">
    <h2>Synthese narrative</h2>
    <p>Le dataset contient ${analysis.totalFilms} films. La note moyenne est de ${analysis.stats.rating.mean.toFixed(2)} avec une dispersion (ecart-type) de ${analysis.stats.rating.stdDev.toFixed(2)}. Les durees varient entre ${analysis.stats.duration.min} et ${analysis.stats.duration.max} minutes, pour une moyenne de ${analysis.stats.duration.mean.toFixed(0)} minutes.</p>
    <p>Du point de vue budgetaire, la mediane est de $${(analysis.stats.budget.median / 1000000).toFixed(1)}M, ce qui donne un ordre de grandeur realiste du cout type d'une production dans ce jeu de donnees.</p>
  </div>

  <div class="card">
    <h2>Top genres</h2>
    <ul>${topGenresList}</ul>
  </div>

  <div class="card">
    <h2>Statistiques principales</h2>
    <table>
      <thead><tr><th>Mesure</th><th>Min</th><th>Max</th><th>Moyenne</th><th>Mediane</th><th>Ecart-type</th></tr></thead>
      <tbody>
        <tr><td>Note</td><td>${analysis.stats.rating.min.toFixed(2)}</td><td>${analysis.stats.rating.max.toFixed(2)}</td><td>${analysis.stats.rating.mean.toFixed(2)}</td><td>${analysis.stats.rating.median.toFixed(2)}</td><td>${analysis.stats.rating.stdDev.toFixed(2)}</td></tr>
        <tr><td>Annee</td><td>${analysis.stats.year.min}</td><td>${analysis.stats.year.max}</td><td>${analysis.stats.year.mean.toFixed(1)}</td><td>${analysis.stats.year.median.toFixed(1)}</td><td>${analysis.stats.year.stdDev.toFixed(2)}</td></tr>
        <tr><td>Duree (min)</td><td>${analysis.stats.duration.min}</td><td>${analysis.stats.duration.max}</td><td>${analysis.stats.duration.mean.toFixed(1)}</td><td>${analysis.stats.duration.median.toFixed(1)}</td><td>${analysis.stats.duration.stdDev.toFixed(2)}</td></tr>
        <tr><td>Budget (USD)</td><td>${analysis.stats.budget.min}</td><td>${analysis.stats.budget.max}</td><td>${analysis.stats.budget.mean.toFixed(0)}</td><td>${analysis.stats.budget.median.toFixed(0)}</td><td>${analysis.stats.budget.stdDev.toFixed(0)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Echantillon des donnees</h2>
    <pre>${JSON.stringify(data.slice(0, 8), null, 2)}</pre>
  </div>
</body>
</html>`;
}

function applyThemeFromStorage() {
  const saved = localStorage.getItem('datamind-theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
  }
}

function computeFeatureRanges(data, features) {
  const ranges = {};

  features.forEach((feature) => {
    const values = data
      .map((movie) => Number(movie?.[feature]))
      .filter((value) => Number.isFinite(value));

    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    ranges[feature] = { min, max };
  });

  return ranges;
}

function computeNormalizedDistance(movieA, movieB, ranges, features) {
  let sum = 0;

  features.forEach((feature) => {
    const aRaw = Number(movieA?.[feature]);
    const bRaw = Number(movieB?.[feature]);
    const a = Number.isFinite(aRaw) ? aRaw : 0;
    const b = Number.isFinite(bRaw) ? bRaw : 0;
    const { min, max } = ranges[feature] || { min: 0, max: 0 };
    const denom = max - min;

    if (denom <= 0) return;

    const aNorm = (a - min) / denom;
    const bNorm = (b - min) / denom;
    const diff = aNorm - bNorm;
    sum += diff * diff;
  });

  return Math.sqrt(sum);
}

function updateRecommendations(data) {
  currentDataset = Array.isArray(data) ? data : [];
  currentFilteredDataset = [...currentDataset];
  currentSelectedMovie = null;

  if (!listeFilms || !sortieRecoTitre || !sortieRecoCategorie || !sortieRecoKnnResults) return;

  if (inputValeurK) {
    inputValeurK.classList.remove('cache');
    inputValeurK.max = String(Math.max(1, currentDataset.length - 1));
    inputValeurK.value = String(Math.min(getRecommendationK(), Math.max(1, currentDataset.length - 1)));
  }

  listeFilms.innerHTML = '';
  
  const statsAllFilms = calculerStatsFilms(currentDataset);
  const statsHTML = renderStatsBlock(statsAllFilms, `Statistiques globales (${currentDataset.length} films)`, 'global-stats');
  sortieRecoTitre.innerHTML = statsHTML + '<p>Selectionne un film pour voir des recommandations.</p>';
  sortieRecoCategorie.innerHTML = '';
  sortieRecoKnnResults.innerHTML = '';

  currentDataset.slice(0, 30).forEach((movie) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'movie-chip';
    btn.textContent = movie.title;
    btn.addEventListener('click', () => showRecommendationsFor(movie));
    listeFilms.appendChild(btn);
  });
}

function showRecommendationsFor(selectedMovie) {
  if (!sortieRecoTitre || !sortieRecoCategorie || !sortieRecoKnnResults) return;
  currentSelectedMovie = selectedMovie;
  const k = getRecommendationK();
  const knnFeatures = ['rating', 'duration', 'year', 'budget'];
  const featureRanges = computeFeatureRanges(currentDataset, knnFeatures);

  const byGenre = currentDataset
    .filter((movie) => movie.title !== selectedMovie.title && movie.genre === selectedMovie.genre)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, k);

  const nearestByDistance = currentDataset
    .filter((movie) => movie.title !== selectedMovie.title)
    .map((movie) => ({
      movie,
      distance: computeNormalizedDistance(selectedMovie, movie, featureRanges, knnFeatures),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);

  sortieRecoTitre.innerHTML = `<h4>Film choisi: ${selectedMovie.title}</h4>`;

  const genreList = byGenre.length
    ? byGenre.map((m) => `<li>${m.title} (${m.genre}, note ${m.rating})</li>`).join('')
    : '<li>Aucune recommandation de meme genre.</li>';

  const knnList = nearestByDistance.length
    ? nearestByDistance
      .map((item) => `<li>${item.movie.title} (${item.movie.genre}, note ${item.movie.rating}) - distance ${item.distance.toFixed(3)}</li>`)
      .join('')
    : '<li>Aucune recommandation KNN disponible.</li>';

  sortieRecoCategorie.innerHTML = `
    <h4>Suggestions par genre</h4>
    <ul>${genreList}</ul>
  `;

  sortieRecoKnnResults.innerHTML = `
    <h4>Suggestions de film similaire</h4>
    <ul>${knnList}</ul>
  `;

}

function afficherDonneesFilms(films) {
  if (!films || films.length === 0) {
    resultatRecherche.innerHTML = '';
    return;
  }

  resultatRecherche.innerHTML = `<pre class="output">${JSON.stringify(films, null, 2)}</pre>`;
}

function renderStatsBlock(stats, title, variantClass) {
  if (!stats) return '';

  return `
    <div class="${variantClass}">
      <div class="stats-title">${title}</div>
      <div class="stats-grid">
        <div><strong>Note:</strong> min=${stats.rating.min.toFixed(1)} | max=${stats.rating.max.toFixed(1)} | moy=${stats.rating.mean.toFixed(2)} | med=${stats.rating.median.toFixed(1)} | et=${stats.rating.stdDev.toFixed(2)}</div>
        <div><strong>Annee:</strong> min=${stats.year.min} | max=${stats.year.max} | moy=${stats.year.mean.toFixed(0)} | med=${stats.year.median.toFixed(0)} | et=${stats.year.stdDev.toFixed(1)}</div>
        <div><strong>Duree:</strong> min=${stats.duration.min}min | max=${stats.duration.max}min | moy=${stats.duration.mean.toFixed(0)}min | med=${stats.duration.median.toFixed(0)}min | et=${stats.duration.stdDev.toFixed(1)}</div>
        <div><strong>Budget:</strong> min=$${(stats.budget.min / 1000000).toFixed(1)}M | max=$${(stats.budget.max / 1000000).toFixed(1)}M | moy=$${(stats.budget.mean / 1000000).toFixed(1)}M | med=$${(stats.budget.median / 1000000).toFixed(1)}M</div>
      </div>
    </div>
  `;
}

function renderSearchButtons(resultats, limit) {
  return resultats
    .slice(0, limit)
    .map(
      (movie) =>
        `<button type="button" class="movie-result-btn" data-title="${encodeURIComponent(movie.title)}">${movie.title} (${movie.genre}, ${movie.rating}/10)</button>`
    )
    .join('');
}

function renderTopStats(films) {
  if (!topStatsBar) return;

  if (!films || films.length === 0) {
    topStatsBar.hidden = true;
    return;
  }

  const stats = calculerStatsFilms(films);
  if (!stats) {
    topStatsBar.hidden = true;
    return;
  }

  statTotalFilms.textContent = String(films.length);
  statAverageRating.textContent = stats.rating.mean.toFixed(2);
  statStdRating.textContent = stats.rating.stdDev.toFixed(2);
  statAverageBudget.textContent = `$${(stats.budget.mean / 1000000).toFixed(1)}M`;
  topStatsBar.hidden = false;
}

function setTopActionBarForFile(fileName) {
  if (!topActionBar) return;
  const normalized = String(fileName || '').trim().toLowerCase();
  topActionBar.hidden = !/^films?\.json$/.test(normalized);
}

if (topActionBar) {
  topActionBar.addEventListener('click', (event) => {
    const button = event.target.closest('.top-action-btn');
    if (!button) return;

    const targetId = button.dataset.scrollId;
    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

if (btnGenerateReport) {
  btnGenerateReport.addEventListener('click', () => {
    if (!currentAnalysis || !currentDataset.length) {
      showMessage('error', 'Aucune donnee disponible pour generer un rapport.');
      return;
    }

    const html = buildNarrativeReportHtml(currentAnalysis, currentDataset);
    downloadFile(`rapport_datamind_${Date.now()}.html`, html, 'text/html;charset=utf-8');
    showMessage('success', 'Rapport HTML genere et telecharge.');
  });
}

if (btnExportFilteredJSON) {
  btnExportFilteredJSON.addEventListener('click', () => {
    if (!currentFilteredDataset.length) {
      showMessage('error', 'Aucune donnee filtree a exporter.');
      return;
    }

    const payload = JSON.stringify(currentFilteredDataset, null, 2);
    downloadFile(`films_filtres_${Date.now()}.json`, payload, 'application/json;charset=utf-8');
    showMessage('success', 'Export JSON filtre termine.');
  });
}

if (btnExportAnalysisJSON) {
  btnExportAnalysisJSON.addEventListener('click', () => {
    if (!currentAnalysis) {
      showMessage('error', 'Aucune analyse disponible a exporter.');
      return;
    }

    const payload = JSON.stringify(currentAnalysis, null, 2);
    downloadFile(`analyse_complete_${Date.now()}.json`, payload, 'application/json;charset=utf-8');
    showMessage('success', 'Export JSON de l\'analyse termine.');
  });
}

if (btnExportStatsCSV) {
  btnExportStatsCSV.addEventListener('click', () => {
    if (!currentAnalysis?.stats) {
      showMessage('error', 'Aucune statistique disponible pour export CSV.');
      return;
    }

    const csv = toStatsCsv(currentAnalysis.stats);
    downloadFile(`stats_${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
    showMessage('success', 'Export CSV des statistiques termine.');
  });
}

applyThemeFromStorage();

function calculerStatsFilms(films) {
  if (!films || films.length === 0) {
    return null;
  }

  const ratings = films.map((f) => Number(f.rating || 0)).filter((r) => r > 0);
  const years = films.map((f) => Number(f.year || 0)).filter((y) => y > 0);
  const budgets = films.map((f) => Number(f.budget || 0)).filter((b) => b > 0);
  const durations = films.map((f) => Number(f.duration || 0)).filter((d) => d > 0);

  const calcMediane = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const calcMoyenne = (arr) => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const calcEcartType = (arr) => {
    if (arr.length === 0) return 0;
    const moy = calcMoyenne(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - moy, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const calcMin = (arr) => (arr.length > 0 ? Math.min(...arr) : 0);
  const calcMax = (arr) => (arr.length > 0 ? Math.max(...arr) : 0);

  return {
    rating: {
      min: calcMin(ratings),
      max: calcMax(ratings),
      median: calcMediane(ratings),
      mean: calcMoyenne(ratings),
      stdDev: calcEcartType(ratings),
    },
    year: {
      min: calcMin(years),
      max: calcMax(years),
      median: calcMediane(years),
      mean: calcMoyenne(years),
      stdDev: calcEcartType(years),
    },
    budget: {
      min: calcMin(budgets),
      max: calcMax(budgets),
      median: calcMediane(budgets),
      mean: calcMoyenne(budgets),
      stdDev: calcEcartType(budgets),
    },
    duration: {
      min: calcMin(durations),
      max: calcMax(durations),
      median: calcMediane(durations),
      mean: calcMoyenne(durations),
      stdDev: calcEcartType(durations),
    },
  };
}

function applyDataset(rawData, outputElement) {
  const cleanData = cleanDataset(rawData);
  outputElement.textContent = JSON.stringify(cleanData, null, 2);
  dataset = cleanData;
  window.dataset = cleanData;
  window.currentDataset = cleanData;
  window.filmCibleActuel = null;
  currentAnalysis = buildAnalysis(cleanData);
  currentFilteredDataset = [...cleanData];
  renderTopStats(cleanData);
  renderVisualizations(cleanData);
  updateRecommendations(cleanData);
  showMessage('success', `Dataset charge avec succes: ${cleanData.length} films.`);
}

boutonURL.addEventListener('click', async () => {
  setTopActionBarForFile('');
  const valueURL = document.getElementById('URL_finder').value.trim();

  if (!isURL(valueURL)) {
    sortieURL.textContent = "Il ne s'agit pas d'une URL valide";
    showMessage('error', "URL invalide. Merci d'entrer une URL complete.");
    return;
  }

  try {
    showMessage('', '');
    setLoading(true, 'Chargement depuis URL...', null);
    const data = await loadFromURL(valueURL);
    setLoading(true, 'Nettoyage des donnees...', 88);
    applyDataset(data, sortieURL);
  } catch (error) {
    sortieURL.textContent = `Erreur URL: ${error.message}`;
    handleError('Erreur URL', error);
  } finally {
    setLoading(false);
  }
});

document.getElementById('monFichier').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  if (!file) {
    setTopActionBarForFile('');
    sortieFichier.textContent = 'Aucun fichier selectionne';
    showMessage('error', 'Aucun fichier selectionne.');
    return;
  }

  if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
    setTopActionBarForFile('');
    sortieFichier.textContent = 'Fichier non supporte (.csv ou .json)';
    showMessage('error', 'Fichier non supporte. Utilise .csv ou .json.');
    return;
  }

  try {
    showMessage('', '');
    setLoading(true, `Lecture de ${file.name}...`, 5);
    const rawText = await loadFromFile(file, (pct) => setLoading(true, `Lecture de ${file.name}...`, Math.max(5, Math.round(pct * 0.6))));
    setLoading(true, 'Parsing du fichier...', 70);
    const data = file.name.endsWith('.csv') ? parseCSV(rawText) : JSON.parse(rawText);
    setTopActionBarForFile(file.name);
    setLoading(true, 'Nettoyage des donnees...', 90);
    applyDataset(data, sortieFichier);
  } catch (error) {
    setTopActionBarForFile('');
    sortieFichier.textContent = `Erreur fichier: ${error.message}`;
    handleError('Erreur fichier', error);
  } finally {
    setLoading(false);
  }
});

boutonTexte.addEventListener('click', () => {
  setTopActionBarForFile('');
  const rawText = document.getElementById('texte_brut').value;

  try {
    showMessage('', '');
    setLoading(true, 'Analyse du texte...', 35);
    const data = parseTextInput(rawText);
    setLoading(true, 'Nettoyage des donnees...', 85);
    applyDataset(data, sortieTexte);
  } catch (error) {
    sortieTexte.textContent = `Erreur d'analyse: ${error.message}`;
    handleError('Erreur analyse texte', error);
  } finally {
    setLoading(false);
  }
});

const inputRecherche = document.getElementById('rechercheFilm');
if (inputRecherche) {
  inputRecherche.addEventListener('input', () => {
    const query = String(inputRecherche.value || '').trim().toLowerCase();

    if (!query) {
      sortieRecoTitre.innerHTML = '<p>Tape un titre de film pour voir les resultats.</p>';
      sortieRecoCategorie.innerHTML = '';
      resultatRecherche.innerHTML = '';
      currentFilteredDataset = [...currentDataset];
      return;
    }

    const resultats = currentDataset
      .filter((movie) => {
        const titleNorm = String(movie.title || '').trim().toLowerCase();
        return titleNorm.length > 0 && titleNorm.startsWith(query);
      });

    if (!resultats.length) {
      sortieRecoTitre.innerHTML = `<p>Aucun film ne commence par "${query}".</p>`;
      sortieRecoCategorie.innerHTML = '';
      afficherDonneesFilms([]);
      currentFilteredDataset = [];
      return;
    }

    currentFilteredDataset = [...resultats];
    afficherDonneesFilms(resultats);

    sortieURL.textContent = '';
    sortieTexte.textContent = '';
    sortieFichier.textContent = '';

    const stats = calculerStatsFilms(resultats);
    const statsHTML = renderStatsBlock(stats, `Statistiques recherche (${resultats.length} films)`, 'search-stats');
    const listeHTML = renderSearchButtons(resultats, 20);

    sortieRecoTitre.innerHTML = `<h4>Films trouves (${resultats.length})</h4>${statsHTML}<div class="choice">${listeHTML}</div>`;
    sortieRecoCategorie.innerHTML = '';
  });
}

sortieRecoTitre.addEventListener('click', (event) => {
  const target = event.target.closest('.movie-result-btn');
  if (!target) return;

  const title = decodeURIComponent(target.dataset.title || '');
  const movie = currentDataset.find((m) => m.title === title);
  if (movie) {
    showRecommendationsFor(movie);
  }
});

if (boutonRecherche) {
  boutonRecherche.addEventListener('click', () => {
    const query = String(document.getElementById('rechercheFilm')?.value || '').trim().toLowerCase();
    if (!query) {
      sortieRecoTitre.innerHTML = '<p>Entre un titre de film.</p>';
      afficherDonneesFilms([]);
      currentFilteredDataset = [...currentDataset];
      return;
    }

    const resultats = currentDataset
      .filter((movie) => {
        const titleNorm = String(movie.title || '').trim().toLowerCase();
        return titleNorm.length > 0 && titleNorm.startsWith(query);
      });

    if (!resultats.length) {
      sortieRecoTitre.innerHTML = `<p>Aucun film ne commence par "${query}".</p>`;
      sortieRecoCategorie.innerHTML = '';
      afficherDonneesFilms([]);
      currentFilteredDataset = [];
      sortieURL.textContent = '';
      sortieTexte.textContent = '';
      sortieFichier.textContent = '';
      return;
    }

    currentFilteredDataset = [...resultats];
    afficherDonneesFilms(resultats);

    sortieURL.textContent = '';
    sortieTexte.textContent = '';
    sortieFichier.textContent = '';

    if (resultats.length === 1) {
      showRecommendationsFor(resultats[0]);
      return;
    }

    const stats = calculerStatsFilms(resultats);
    const statsHTML = renderStatsBlock(stats, `Statistiques recherche (${resultats.length} films)`, 'search-stats');
    const listeHTML = renderSearchButtons(resultats, resultats.length);

    sortieRecoTitre.innerHTML = `<h4>Films trouves (${resultats.length})</h4>${statsHTML}<div class="choice">${listeHTML}</div>`;
    sortieRecoCategorie.innerHTML = '';
  });
}

if (inputValeurK) {
  inputValeurK.addEventListener('input', () => {
    if (currentSelectedMovie) {
      showRecommendationsFor(currentSelectedMovie);
    }
  });
}