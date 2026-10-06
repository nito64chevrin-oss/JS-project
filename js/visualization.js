const tableState = {
  data: [],
  page: 1,
  pageSize: 8,
  sortKey: 'rating',
  sortDirection: 'desc'
};

const preferredColumns = ['title', 'year', 'rating', 'duration', 'genre', 'director', 'budget'];
let controlsBound = false;

function formatLabel(text) {
  return String(text || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getColumns(data) {
  if (!data.length) return preferredColumns;

  const keys = new Set();
  data.forEach((item) => Object.keys(item).forEach((k) => keys.add(k)));

  const sorted = [...keys].sort((a, b) => a.localeCompare(b));
  const preferred = preferredColumns.filter((k) => keys.has(k));
  const extra = sorted.filter((k) => !preferred.includes(k));

  return [...preferred, ...extra];
}

function sortData(rows, key, direction) {
  const factor = direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * factor;
    }

    return String(aValue).localeCompare(String(bValue), 'fr', { sensitivity: 'base' }) * factor;
  });
}

function createHistogram(data) {
  const container = document.getElementById('histogramChart');
  if (!container) return;

  const values = data
    .map((movie) => Number(movie.rating))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 10);

  if (!values.length) {
    container.innerHTML = '<p class="chart-empty">Pas assez de notes pour afficher un histogramme.</p>';
    return;
  }

  const bins = Array(10).fill(0);
  values.forEach((value) => {
    const index = Math.min(9, Math.floor(value));
    bins[index] += 1;
  });

  const maxCount = Math.max(...bins, 1);

  container.innerHTML = bins
    .map((count, idx) => {
      const ratio = (count / maxCount) * 100;
      const height = count === 0 ? 0 : Math.max(10, Math.round(ratio));
      const label = `${idx}-${idx + 1}`;

      return `
        <div class="hist-bin">
          <span class="hist-count">${count}</span>
          <div class="hist-track" title="${label} : ${count} films">
            <div class="hist-bar ${count === 0 ? 'is-zero' : ''}" style="height: ${height}%"></div>
          </div>
          <span class="hist-label">${label}</span>
        </div>
      `;
    })
    .join('');
}

function createHorizontalBars(data) {
  const container = document.getElementById('genreChart');
  if (!container) return;

  const counts = new Map();

  data.forEach((movie) => {
    const key = String(movie.genre || 'Inconnu').trim();
    const normalized = key.toLowerCase();

    if (!counts.has(normalized)) {
      counts.set(normalized, { label: key, count: 0 });
    }

    counts.get(normalized).count += 1;
  });

  const topGenres = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (!topGenres.length) {
    container.innerHTML = '<p class="chart-empty">Aucune catégorie disponible.</p>';
    return;
  }

  const maxCount = Math.max(...topGenres.map((item) => item.count), 1);

  container.innerHTML = topGenres
    .map((item) => {
      const width = Math.round((item.count / maxCount) * 100);
      return `
        <div class="hbar-row">
          <span class="hbar-label">${item.label}</span>
          <div class="hbar-track">
            <div class="hbar-fill" style="width: ${width}%"></div>
          </div>
          <span class="hbar-value">${item.count}</span>
        </div>
      `;
    })
    .join('');
}

function renderTable() {
  const table = document.getElementById('moviesTable');
  const pageInfo = document.getElementById('pageInfo');
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');

  if (!table || !pageInfo || !prevButton || !nextButton) return;

  const columns = getColumns(tableState.data);
  const sorted = sortData(tableState.data, tableState.sortKey, tableState.sortDirection);

  const totalPages = Math.max(1, Math.ceil(sorted.length / tableState.pageSize));
  tableState.page = Math.min(tableState.page, totalPages);

  const start = (tableState.page - 1) * tableState.pageSize;
  const rows = sorted.slice(start, start + tableState.pageSize);

  const thead = `
    <thead>
      <tr>
        ${columns
          .map((column) => {
            const isActive = tableState.sortKey === column;
            const direction = isActive ? (tableState.sortDirection === 'asc' ? '↑' : '↓') : '';
            return `<th><button class="sort-btn" data-key="${column}">${formatLabel(column)} ${direction}</button></th>`;
          })
          .join('')}
      </tr>
    </thead>
  `;

  const tbody = `
    <tbody>
      ${rows
        .map((movie) => {
          const cells = columns.map((column) => `<td>${movie[column] ?? ''}</td>`).join('');
          return `<tr>${cells}</tr>`;
        })
        .join('')}
    </tbody>
  `;

  table.innerHTML = `${thead}${tbody}`;
  pageInfo.textContent = `Page ${tableState.page}/${totalPages}`;
  prevButton.disabled = tableState.page === 1;
  nextButton.disabled = tableState.page === totalPages;
}

function bindControls() {
  if (controlsBound) return;

  const tableWrapper = document.getElementById('tableWrapper');
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');

  if (!tableWrapper || !prevButton || !nextButton) return;

  tableWrapper.addEventListener('click', (event) => {
    const button = event.target.closest('.sort-btn');
    if (!button) return;

    const key = button.dataset.key;

    if (tableState.sortKey === key) {
      tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      tableState.sortKey = key;
      tableState.sortDirection = 'asc';
    }

    tableState.page = 1;
    renderTable();
  });

  prevButton.addEventListener('click', () => {
    tableState.page = Math.max(1, tableState.page - 1);
    renderTable();
  });

  nextButton.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(tableState.data.length / tableState.pageSize));
    tableState.page = Math.min(totalPages, tableState.page + 1);
    renderTable();
  });

  controlsBound = true;
}

export function renderVisualizations(data) {
  const section = document.getElementById('vizSection');
  if (!section) return;

  bindControls();

  const normalized = Array.isArray(data) ? data : [];
  tableState.data = normalized;
  tableState.page = 1;

  section.hidden = normalized.length === 0;

  createHistogram(normalized);
  createHorizontalBars(normalized);
  renderTable();
}
