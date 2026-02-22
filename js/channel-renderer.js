/* Rendering of channel cards */

import { playChannel, getCurrentChannel } from './player-logic.js';
import { toggleFavorite, isFavorite } from './favorites.js';

let allChannels = [];
let filteredChannels = [];
let activeCategory = 'All';
let searchTerm = '';

const gridEl = document.getElementById('channels-grid');
const emptyEl = document.getElementById('empty-state');
const countBadgeEl = document.getElementById('badge-count');
const filterBadgeEl = document.getElementById('badge-filter');
const categoryBadgeEl = document.getElementById('status-category');

function applyFilters() {
  const term = searchTerm.trim().toLowerCase();
  filteredChannels = allChannels.filter((c) => {
    const fav = isFavorite(c.name);
    const matchCategory =
      activeCategory === 'All'
        ? true
        : activeCategory === 'Favorites'
          ? fav
          : c.category === activeCategory;
    const matchSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      (c.category || '').toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });
  renderGrid();
}

function updateCounts() {
  if (countBadgeEl) {
    countBadgeEl.textContent = `${filteredChannels.length} ch`;
  }
  if (filterBadgeEl) {
    filterBadgeEl.textContent = activeCategory;
  }
  if (categoryBadgeEl) {
    categoryBadgeEl.textContent = activeCategory;
  }
}

function createCard(channel) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'channel-card';
  card.dataset.name = channel.name;

  const logoWrap = document.createElement('div');
  logoWrap.className = 'channel-logo-wrap';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = channel.logo || '';
  img.alt = channel.name;
  logoWrap.appendChild(img);

  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = 'favorite-toggle';
  const updateFavVisual = () => {
    const active = isFavorite(channel.name);
    favBtn.classList.toggle('active', active);
    favBtn.textContent = active ? '★' : '☆';
  };
  updateFavVisual();
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(channel.name);
    updateFavVisual();
    applyFilters();
  });
  logoWrap.appendChild(favBtn);

  const info = document.createElement('div');
  info.className = 'channel-info';

  const nameSpan = document.createElement('div');
  nameSpan.className = 'channel-name';
  nameSpan.textContent = channel.name;

  const meta = document.createElement('div');
  meta.className = 'channel-meta';

  const liveDot = document.createElement('div');
  liveDot.className = 'channel-live-dot';

  const cat = document.createElement('div');
  cat.className = 'channel-meta-pill';
  cat.textContent = channel.category || 'Other';

  meta.appendChild(liveDot);
  meta.appendChild(cat);

  info.appendChild(nameSpan);
  info.appendChild(meta);

  card.appendChild(logoWrap);
  card.appendChild(info);

  card.addEventListener('click', () => {
    document
      .querySelectorAll('.channel-card.active')
      .forEach((el) => el.classList.remove('active'));
    card.classList.add('active');
    playChannel(channel);
  });

  const current = getCurrentChannel();
  if (current && current.name === channel.name) card.classList.add('active');

  return card;
}

function renderGrid() {
  if (!gridEl) return;

  gridEl.innerHTML = '';
  if (!filteredChannels.length) {
    if (emptyEl) emptyEl.style.display = 'block';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    for (const ch of filteredChannels) {
      gridEl.appendChild(createCard(ch));
    }
  }
  updateCounts();
}

export function setChannels(list) {
  allChannels = list || [];
  filteredChannels = [...allChannels];
  renderGrid();
}

export function setCategory(category) {
  activeCategory = category;
  applyFilters();
}

export function setSearch(term) {
  searchTerm = term;
  applyFilters();
}

export function getCategories(list) {
  const set = new Set();
  for (const c of list) {
    if (c.category) set.add(c.category);
  }
  return ['All', 'Favorites', ...Array.from(set)];
}