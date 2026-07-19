const MODES = new Set(['full', 'public', 'private']);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

function port(value, fallback) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Geçersiz PORT: ${value}`);
  }
  return parsed;
}

export function loadRuntimeConfig(env = process.env) {
  const mode = String(env.APP_MODE || 'full').trim().toLowerCase();
  if (!MODES.has(mode)) {
    throw new Error(`Geçersiz APP_MODE: ${mode}. full, public veya private olmalı.`);
  }

  const host = String(env.HOST || (mode === 'private' ? '127.0.0.1' : '0.0.0.0')).trim();
  if (mode === 'private' && !LOOPBACK_HOSTS.has(host)) {
    throw new Error('Private admin süreci yalnızca loopback adresine bağlanabilir. HOST=127.0.0.1 kullanın.');
  }

  return Object.freeze({
    mode,
    host,
    port: port(env.PORT, mode === 'private' ? 3002 : 3001),
    publicEnabled: mode !== 'private',
    adminEnabled: mode !== 'public',
  });
}
