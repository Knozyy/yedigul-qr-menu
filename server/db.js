import Database from 'better-sqlite3';
import { backfillMenuTranslations } from './translation-backfill.js';

export function openDb(path) {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.exec(`
    -- kind: 'products' normal kategori, 'sets' fix menü bölümü. Fix menü de
    -- bir kategori satırı olduğu için sıralama, aktiflik ve çeviri kuralları
    -- hiç değişmeden ona da uygulanır; ayrı bir yerleştirme mekanizması yok.
    CREATE TABLE IF NOT EXISTS categories (
      id        TEXT PRIMARY KEY,
      kind      TEXT NOT NULL DEFAULT 'products',
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
      portion         TEXT,
      is_hidden       INTEGER NOT NULL DEFAULT 0
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
    -- Pano anlık görüntüleri: Instagram takipçi sayısı, Google puanı, ürün
    -- fiyatı gibi API'nin yalnızca "şu an"ını verdiği, geçmişi ALINAMAYAN
    -- ölçütler. Panelden gönderilir; burada tutulmasının sebebi tek bir geçmiş
    -- olması ve db-backup.sh'ın data.db ile birlikte yedeklemesi.
    -- entity: varlık başına ölçütler için (ör. ürün fiyatı). '' = global ölçüt.
    CREATE TABLE IF NOT EXISTS pano_snapshots (
      day    TEXT NOT NULL,
      metric TEXT NOT NULL,
      entity TEXT NOT NULL DEFAULT '',
      value  REAL NOT NULL,
      PRIMARY KEY (day, metric, entity)
    );
    CREATE INDEX IF NOT EXISTS idx_pano_snapshots_seri
      ON pano_snapshots(metric, entity, day);
    -- Ürün setleri: adetli ürün listesi. Bugün fix menü (müşteriye açık, kendi
    -- satış fiyatı), ileride masa senaryosu (içeride, fiyatlardan toplanır).
    -- İkisi aynı ilkeli paylaştığı için tek şema; kind sütunu ayırır.
    CREATE TABLE IF NOT EXISTS product_sets (
      id        TEXT PRIMARY KEY,
      kind      TEXT NOT NULL DEFAULT 'fix_menu',
      name_tr   TEXT NOT NULL,
      name_en   TEXT NOT NULL,
      name_ar   TEXT NOT NULL DEFAULT '',
      name_ru   TEXT NOT NULL DEFAULT '',
      desc_tr   TEXT NOT NULL DEFAULT '',
      desc_en   TEXT NOT NULL DEFAULT '',
      desc_ar   TEXT NOT NULL DEFAULT '',
      desc_ru   TEXT NOT NULL DEFAULT '',
      price     REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort      INTEGER NOT NULL DEFAULT 0
    );
    -- Ürün sette BİR KEZ bulunur; "2 acılı ezme" ikinci satır değil, qty = 2.
    -- RESTRICT: fix menüde kullanılan ürün silinemez (kategorilerdeki desen).
    CREATE TABLE IF NOT EXISTS product_set_items (
      set_id     TEXT NOT NULL REFERENCES product_sets(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id)     ON DELETE RESTRICT,
      qty        INTEGER NOT NULL DEFAULT 1,
      sort       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (set_id, product_id)
    );
    -- Cihaz başına menü görüntülenme tekrarsızlığı: son görülme zamanı tutulur.
    -- Yalnız pencere içindeki (son 6 saat) cihazlar kalır; eskiler temizlenir.
    CREATE TABLE IF NOT EXISTS menu_views (
      device_id TEXT PRIMARY KEY,
      last_at   INTEGER NOT NULL
    );
    -- Ürün detayının açılması. menu_views menüye girişi sayar, bu ürün ilgisini;
    -- iki farklı olay, iki ayrı tablo.
    -- CASCADE, fix menüdeki RESTRICT'in bilinçli tersi: geçmişte bakılmış olmak
    -- ürünü silinemez yapmamalı. Silinince geçmişi de gider ve listeden düşer.
    CREATE TABLE IF NOT EXISTS product_views_daily (
      day        TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      n          INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_product_views_daily_gun ON product_views_daily(day);
    -- Tekrarsızlık anahtarı cihaz DEĞİL (cihaz, ürün): bir misafirin baktığı
    -- ikinci ürün de sayılmalı, yalnız aynı ürünü tekrar açması sayılmamalı.
    CREATE TABLE IF NOT EXISTS product_views (
      device_id  TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      last_at    INTEGER NOT NULL,
      PRIMARY KEY (device_id, product_id)
    );
  `);
  migratePanoSnapshots(db);
  // migration: CREATE TABLE IF NOT EXISTS mevcut tabloyu değiştirmez;
  // eski data.db'lere eksik kolonları veri kaybı olmadan ekle
  const cols = db.prepare('PRAGMA table_info(products)').all().map((c) => c.name);
  if (!cols.includes('kcal')) {
    db.exec('ALTER TABLE products ADD COLUMN kcal INTEGER');
  }
  if (!cols.includes('portion')) {
    db.exec('ALTER TABLE products ADD COLUMN portion TEXT');
  }
  if (!cols.includes('is_hidden')) {
    db.exec('ALTER TABLE products ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0');
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
  if (!catCols.includes('kind')) {
    db.exec("ALTER TABLE categories ADD COLUMN kind TEXT NOT NULL DEFAULT 'products'");
  }
  ensureSetsCategory(db);
  backfillMenuTranslations(db);
  return db;
}

/** Fix menü bölümünün kategori satırı. Sıralaması buradan yönetilir. */
export const SETS_CATEGORY_ID = 'fix-menus';

/**
 * Fix menü kategorisini garanti eder.
 *
 * Fix menüler ayrı bir yerleştirme mekanizmasıyla değil, normal bir kategori
 * satırıyla konumlanır: sürükleyerek sıralama, aktiflik ve çeviri kuralları
 * hiç değişmeden ona da uygular. Satır silinemez (rota engeller) ve ürün
 * atanamaz; yalnız kind='sets' olduğu için menüde setleri gösterir.
 */
export function ensureSetsCategory(db) {
  const existing = db.prepare("SELECT id FROM categories WHERE kind = 'sets'").get();
  if (existing) return existing.id;

  // Boş veritabanında bu satır seed'den ÖNCE kurulur; MAX(sort)+1 kullanılsaydı
  // 0 alır ve menünün başına geçerdi. Yüksek bir başlangıç değeri, gerçek
  // kategoriler yüklendiğinde sona düşmesini sağlar. Kullanıcı sürükleyince
  // sıralama ucu zaten hepsini 0..N olarak yeniden numaralar.
  const varOlan = db.prepare('SELECT COALESCE(MAX(sort), -1) AS n FROM categories').get().n;
  const sort = varOlan < 0 ? 1000 : varOlan + 1;
  db.prepare(
    `INSERT INTO categories (id, kind, name_tr, name_en, name_ar, name_ru, sort, is_active)
     VALUES (?, 'sets', 'Fix Menüler', 'Set Menus', 'قوائم ثابتة', 'Комплексные меню', ?, 1)`
  ).run(SETS_CATEGORY_ID, sort);
  return SETS_CATEGORY_ID;
}

/**
 * pano_snapshots'a entity sütununu ekler.
 *
 * ALTER TABLE birincil anahtarı genişletemez, CREATE TABLE IF NOT EXISTS de
 * mevcut tabloyu değiştirmez. Bu yüzden tablo yeniden kurulur: satırlar
 * entity='' ile kopyalanır, sonra eskisi düşürülür. Kopyalayarak yapılır —
 * bu verinin geri getirilme yolu yok, DROP ile atılamaz.
 */
export function migratePanoSnapshots(db) {
  const cols = db.prepare('PRAGMA table_info(pano_snapshots)').all().map((c) => c.name);
  if (cols.includes('entity')) return;

  db.exec(`
    CREATE TABLE pano_snapshots_yeni (
      day    TEXT NOT NULL,
      metric TEXT NOT NULL,
      entity TEXT NOT NULL DEFAULT '',
      value  REAL NOT NULL,
      PRIMARY KEY (day, metric, entity)
    );
    INSERT INTO pano_snapshots_yeni (day, metric, entity, value)
      SELECT day, metric, '', value FROM pano_snapshots;
    DROP TABLE pano_snapshots;
    ALTER TABLE pano_snapshots_yeni RENAME TO pano_snapshots;
    CREATE INDEX IF NOT EXISTS idx_pano_snapshots_seri
      ON pano_snapshots(metric, entity, day);
  `);
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

// Aynı cihaz 6 saat içinde tekrar girerse görüntülenme sayılmaz; 6 saat
// geçince yeniden sayılır. Karar sunucuda verilir (istemci saatine güvenilmez).
// Pencere dışı kayıtlar her çağrıda temizlenir → tablo sınırsız büyümez.
// deviceId: istemcinin localStorage'ında tuttuğu rastgele, anonim token.
const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000;

export function countMenuView(db, deviceId) {
  const now = Date.now();
  db.prepare('DELETE FROM menu_views WHERE last_at < ?').run(now - VIEW_WINDOW_MS);
  const seen = db.prepare('SELECT 1 FROM menu_views WHERE device_id = ?').get(deviceId);
  if (seen) return false; // 6 saat içinde zaten sayıldı
  db.prepare(
    `INSERT INTO menu_views (device_id, last_at) VALUES (?, ?)
     ON CONFLICT(device_id) DO UPDATE SET last_at = excluded.last_at`
  ).run(deviceId, now);
  bumpStat(db, 'menu_view');
  return true;
}

// Ürün detayının açılması. countMenuView ile aynı 6 saatlik pencere, ama
// anahtar (cihaz, ürün) ikilisi — aynı misafirin baktığı her AYRI ürün sayılır,
// yalnız aynı ürünü tekrar açması sayılmaz.
//
// Olmayan ürün sessizce yoksayılır (false döner): bu bir izleme çağrısıdır,
// menü yenilenirken silinmiş bir ürüne tıklamak misafire hata göstermemeli.
// Kontrol açıkça yapılır; foreign_keys = ON olduğu için yoksa anlaşılmaz bir
// SQLite hatası ve 500 dönerdi.
export function countProductView(db, deviceId, productId) {
  const urunVar = db.prepare('SELECT 1 FROM products WHERE id = ?').get(productId);
  if (!urunVar) return false;

  const now = Date.now();
  db.prepare('DELETE FROM product_views WHERE last_at < ?').run(now - VIEW_WINDOW_MS);
  const seen = db
    .prepare('SELECT 1 FROM product_views WHERE device_id = ? AND product_id = ?')
    .get(deviceId, productId);
  if (seen) return false; // 6 saat içinde bu ürün zaten sayıldı

  db.prepare(
    `INSERT INTO product_views (device_id, product_id, last_at) VALUES (?, ?, ?)
     ON CONFLICT(device_id, product_id) DO UPDATE SET last_at = excluded.last_at`
  ).run(deviceId, productId, now);
  db.prepare(
    `INSERT INTO product_views_daily (day, product_id, n) VALUES (?, ?, 1)
     ON CONFLICT(day, product_id) DO UPDATE SET n = n + 1`
  ).run(localDay(), productId);
  return true;
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
