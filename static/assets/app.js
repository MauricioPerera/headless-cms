/* Headless CMS — Static Theme JS */
(function () {
  'use strict';

  // === Theme toggle ===
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  function updateIcon() {
    const isDark = document.documentElement.classList.contains('theme-dark');
    themeIcon.textContent = isDark ? '\u2600' : '\u263d';
    themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a claro' : 'Cambiar a oscuro');
  }

  if (themeToggle) {
    updateIcon();
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('theme-dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateIcon();
    });
  }

  // === Search ===
  const searchInput = document.getElementById('site-search');
  if (!searchInput) return;

  let index = [];
  let resultsContainer = null;

  async function loadIndex() {
    try {
      const base = document.querySelector('base')?.getAttribute('href') || '';
      const res = await fetch(base + 'api/search.json');
      if (!res.ok) return;
      index = await res.json();
    } catch (e) {
      console.warn('Search index not available');
    }
  }

  function createResultsContainer() {
    if (resultsContainer) return resultsContainer;
    resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    searchInput.parentElement.style.position = 'relative';
    searchInput.parentElement.appendChild(resultsContainer);
    return resultsContainer;
  }

  function renderResults(matches) {
    const container = createResultsContainer();
    container.innerHTML = '';
    if (!matches.length) {
      container.style.display = 'none';
      return;
    }
    matches.slice(0, 8).forEach(item => {
      const a = document.createElement('a');
      a.href = item.url;
      a.className = 'search-result-item';
      a.innerHTML = `
        <div class="search-result-title">${escapeHtml(item.title)}</div>
        <div class="search-result-excerpt">${escapeHtml(item.excerpt)}</div>
      `;
      container.appendChild(a);
    });
    container.style.display = 'block';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    if (!q || !index.length) {
      if (resultsContainer) resultsContainer.style.display = 'none';
      return;
    }
    const matches = index.filter(item => {
      const haystack = (item.title + ' ' + item.excerpt + ' ' + (item.tags || '')).toLowerCase();
      return haystack.includes(q);
    });
    renderResults(matches);
  }

  let debounce;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => search(e.target.value), 150);
  });

  document.addEventListener('click', (e) => {
    if (resultsContainer && !searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) search(searchInput.value);
  });

  loadIndex();
})();
