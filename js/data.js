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