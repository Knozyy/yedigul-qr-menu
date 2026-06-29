const PREFIX = 'yedigul:';

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode / quota) — ignore
  }
}

export function getTableNumber(fallback = '12') {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('masa') || params.get('table') || params.get('t');
    if (!raw) return fallback;
    const cleaned = raw.replace(/[^0-9A-Za-z]/g, '').slice(0, 4);
    return cleaned || fallback;
  } catch {
    return fallback;
  }
}
