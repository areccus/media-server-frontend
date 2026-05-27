// Helper utility functions

export function hexA(hex, a) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function landscapeUrl(item) {
  return item.backdrop || item.poster || `https://via.placeholder.com/400x225/1a1d29/5BB7FF?text=${encodeURIComponent(item.title)}`;
}

export function posterUrl(item) {
  return item.poster || `https://via.placeholder.com/300x450/1a1d29/5BB7FF?text=${encodeURIComponent(item.title)}`;
}

export function backdropUrl(item) {
  return item.backdrop || item.poster || `https://via.placeholder.com/1920x1080/1a1d29/5BB7FF?text=${encodeURIComponent(item.title)}`;
}

// Route navigation helper
export function navigate(path) {
  window.location.hash = path;
}
