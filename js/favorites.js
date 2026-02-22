// Minimal favorites stub (extendable)

const KEY = 'nt_favorites_v1';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavorite(name) {
  const list = new Set(getFavorites());
  if (list.has(name)) list.delete(name);
  else list.add(name);
  localStorage.setItem(KEY, JSON.stringify(Array.from(list)));
}

export function isFavorite(name) {
  return getFavorites().includes(name);
}