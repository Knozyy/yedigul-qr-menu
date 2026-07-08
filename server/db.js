import Database from 'better-sqlite3';

export function openDb(path) {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id        TEXT PRIMARY KEY,
      name_tr   TEXT NOT NULL,
      name_en   TEXT NOT NULL,
      sort      INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS products (
      id              TEXT PRIMARY KEY,
      category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name_tr         TEXT NOT NULL,
      name_en         TEXT NOT NULL,
      desc_tr         TEXT NOT NULL DEFAULT '',
      desc_en         TEXT NOT NULL DEFAULT '',
      price           REAL,
      is_market_price INTEGER NOT NULL DEFAULT 0,
      image_url       TEXT,
      is_available    INTEGER NOT NULL DEFAULT 1,
      popular         INTEGER NOT NULL DEFAULT 0,
      chef            INTEGER NOT NULL DEFAULT 0,
      diet            TEXT NOT NULL DEFAULT '[]',
      ing_tr          TEXT NOT NULL DEFAULT '[]',
      ing_en          TEXT NOT NULL DEFAULT '[]',
      alg_tr          TEXT NOT NULL DEFAULT '[]',
      alg_en          TEXT NOT NULL DEFAULT '[]',
      sort            INTEGER NOT NULL DEFAULT 0,
      kcal            INTEGER,
      portion         TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      ts        INTEGER NOT NULL,
      action    TEXT NOT NULL,
      entity    TEXT NOT NULL,
      entity_id TEXT,
      detail    TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS stats_daily (
      day TEXT NOT NULL,
      key TEXT NOT NULL,
      n   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, key)
    );
  `);
  // migration: CREATE TABLE IF NOT EXISTS mevcut tabloyu değiştirmez;
  // eski data.db'lere eksik kolonları veri kaybı olmadan ekle
  const cols = db.prepare('PRAGMA table_info(products)').all().map((c) => c.name);
  if (!cols.includes('kcal')) {
    db.exec('ALTER TABLE products ADD COLUMN kcal INTEGER');
  }
  if (!cols.includes('portion')) {
    db.exec('ALTER TABLE products ADD COLUMN portion TEXT');
  }
  if (!cols.includes('variants')) {
    db.exec("ALTER TABLE products ADD COLUMN variants TEXT NOT NULL DEFAULT '[]'");
  }
  if (!cols.includes('images')) {
    db.exec("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'");
    // tek görselli eski kayıtlar: kapak görselini listeye taşı
    db.exec(`UPDATE products SET images = json_array(image_url) WHERE image_url IS NOT NULL`);
  }
  // Arapça/Rusça çeviriler: boş bırakılan alan menüde EN→TR sırasıyla geri düşer
  if (!cols.includes('name_ar')) {
    db.exec(`
      ALTER TABLE products ADD COLUMN name_ar TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN name_ru TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN desc_ar TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN desc_ru TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN ing_ar TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE products ADD COLUMN ing_ru TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE products ADD COLUMN alg_ar TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE products ADD COLUMN alg_ru TEXT NOT NULL DEFAULT '[]';
    `);
  }
  const catCols = db.prepare('PRAGMA table_info(categories)').all().map((c) => c.name);
  if (!catCols.includes('name_ar')) {
    db.exec(`
      ALTER TABLE categories ADD COLUMN name_ar TEXT NOT NULL DEFAULT '';
      ALTER TABLE categories ADD COLUMN name_ru TEXT NOT NULL DEFAULT '';
    `);
  }
  return db;
}

// ---------------------------------------------------------------------------
// Denetim kaydı: yönetim mutasyonlarının kısa geçmişi (tek kullanıcılı sistem,
// "ne, ne zaman, neydi → ne oldu" sorusuna yanıt). Tablo son 500 kayıtla sınırlı.
// ---------------------------------------------------------------------------
export function logChange(db, { action, entity, entityId = null, detail = '' }) {
  db.prepare(
    'INSERT INTO audit_log (ts, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(Date.now(), action, entity, entityId, detail);
  db.prepare(
    'DELETE FROM audit_log WHERE id NOT IN (SELECT id FROM audit_log ORDER BY id DESC LIMIT 500)'
  ).run();
}

// ---------------------------------------------------------------------------
// Günlük sayaçlar (menü görüntülenme, QR tarama). Gün sunucu yerel saatine göre.
// ---------------------------------------------------------------------------
export function localDay(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function bumpStat(db, key) {
  db.prepare(
    `INSERT INTO stats_daily (day, key, n) VALUES (?, ?, 1)
     ON CONFLICT(day, key) DO UPDATE SET n = n + 1`
  ).run(localDay(), key);
}

// Basit key/value ayar deposu (QR yönlendirmesi, genel adres vb.)
export function getSetting(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function setSetting(db, key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run({ key, value: value == null ? null : String(value) });
}
