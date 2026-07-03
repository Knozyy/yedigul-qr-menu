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
  return db;
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
