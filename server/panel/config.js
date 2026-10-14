import { BlockList, isIP } from 'node:net';
import { resolve } from 'node:path';

function isLoopback(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]' || hostname === '::1';
}

function parseAllowedIps(value) {
  const entries = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!entries.length) return null;
  const list = new BlockList();
  for (const entry of entries) {
    const [address, prefix] = entry.split('/');
    const family = isIP(address);
    if (!family) throw new Error(`ALLOWED_IPS içinde geçersiz adres: ${entry}`);
    const type = family === 6 ? 'ipv6' : 'ipv4';
    if (prefix === undefined) {
      list.addAddress(address, type);
    } else {
      const bits = Number(prefix);
      if (!Number.isInteger(bits) || bits < 0 || bits > (family === 6 ? 128 : 32)) {
        throw new Error(`ALLOWED_IPS içinde geçersiz ağ: ${entry}`);
      }
      list.addSubnet(address, bits, type);
    }
  }
  return list;
}

// Yönetim paneli her zaman bu yol altında yayınlanır (www.yedigulrestorant.com/admin/).
export const PANEL_BASE = '/admin';

/**
 * Panel ayarları. Panel, admin API'siyle (/api/auth, /api/admin) AYNI süreçte
 * çalışır ve ona loopback üzerinden HTTP ile bağlanır; `selfPort` o sürecin
 * portudur. REMOTE_ADMIN_BASE_URL yalnız testler içindir.
 */
export function loadConfig(env = process.env, { selfPort = 3001 } = {}) {
  const remoteAdminBaseUrl = new URL(env.REMOTE_ADMIN_BASE_URL || `http://127.0.0.1:${selfPort}`);
  if (!isLoopback(remoteAdminBaseUrl.hostname)) {
    throw new Error('REMOTE_ADMIN_BASE_URL güvenlik gereği yalnızca loopback adresi olabilir.');
  }

  // Sunucuda nginx arkasında barındırma (www.yedigulrestorant.com/admin/).
  // Boşsa panel yalnızca localhost'tan açılır (lokal geliştirme).
  const publicHost = String(env.PUBLIC_HOST || '').trim().toLowerCase();
  if (publicHost && !/^[a-z0-9.-]+$/.test(publicHost)) {
    throw new Error('PUBLIC_HOST yalnızca alan adı olmalı (ör. www.yedigulrestorant.com).');
  }

  // nginx'teki IP listesinin ikinci kopyası: nginx ayarı yanlışlıkla
  // düşerse panel yine kapalı kalır. Barındırmada boş liste kabul edilmez.
  const allowedIps = parseAllowedIps(env.ALLOWED_IPS);
  if (publicHost && !allowedIps) {
    throw new Error('PUBLIC_HOST doluyken ALLOWED_IPS zorunludur (ör. ALLOWED_IPS=88.1.2.3,88.1.2.0/24).');
  }

  return Object.freeze({
    publicHost,
    basePath: PANEL_BASE,
    allowedIps,
    remoteAdminBaseUrl: remoteAdminBaseUrl.toString().replace(/\/$/, ''),
    remoteAuthPath: '/api/auth',
    remoteAdminPath: '/api/admin',
    publicMenuUrl: String(env.PUBLIC_MENU_URL || 'https://www.yedigulrestorant.com/menu/'),
    sessionTtlMs: 8 * 60 * 60 * 1000,
    maxProxyBodyBytes: 8 * 1024 * 1024,

    // ---- Pano ----
    // Site sağlığı konektörü bu adresi ve aynı köken altındaki /api/health'i yoklar.
    publicSiteUrl: String(env.PUBLIC_SITE_URL || 'https://www.yedigulrestorant.com/'),
    // Konektör önbelleği ve günlük anlık görüntüler. Boşsa bellek içi çalışır.
    dbPath: env.PANO_DB_PATH ? resolve(env.PANO_DB_PATH) : '',
    // Boş kalırsa ilgili panel "bağlı değil" durumunda görünür, pano çalışır.
    instagram: Object.freeze({
      userId: String(env.IG_USER_ID || '').trim(),
      accessToken: String(env.IG_ACCESS_TOKEN || '').trim(),
    }),
    ga4: Object.freeze({
      propertyId: String(env.GA4_PROPERTY_ID || '').trim(),
      credentialsPath: env.GA4_CREDENTIALS_PATH ? resolve(env.GA4_CREDENTIALS_PATH) : '',
    }),
    places: Object.freeze({
      apiKey: String(env.PLACES_API_KEY || '').trim(),
      placeId: String(env.PLACES_PLACE_ID || '').trim(),
    }),
    // Ürün formundaki "Çevir" düğmeleri. Anahtar boşsa düğmeler hiç görünmez;
    // panelin geri kalanı etkilenmez.
    gemini: Object.freeze({
      apiKey: String(env.GEMINI_API_KEY || '').trim(),
      // Sürüm numaralı model adları emekliye ayrılıyor ("no longer available to
      // new users") — bu yüzden varsayılan bir TAKMA AD: Google güncelini
      // gösterdikçe kendiliğinden taşınır. Sabitlemek isteyen .env'den geçer.
      model: String(env.GEMINI_MODEL || '').trim() || 'gemini-flash-lite-latest',
    }),
  });
}

