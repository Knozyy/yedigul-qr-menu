import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../db.js';

test('openDb creates categories and products tables', () => {
  const db = openDb(':memory:');
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);
  assert.ok(tables.includes('categories'), 'categories table exists');
  assert.ok(tables.includes('products'), 'products table exists');
});

test('products table has is_market_price and is_available columns', () => {
  const db = openDb(':memory:');
  const cols = db.prepare('PRAGMA table_info(products)').all().map((c) => c.name);
  for (const name of ['is_market_price', 'is_available', 'image_url', 'category_id']) {
    assert.ok(cols.includes(name), `column ${name} exists`);
  }
});

test('foreign keys are enabled', () => {
  const db = openDb(':memory:');
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
});

test('concurrent public/private processes wait briefly for SQLite writes', () => {
  const db = openDb(':memory:');
  assert.equal(db.pragma('busy_timeout', { simple: true }), 5000);
});

test('openDb migrates a pre-kcal database without losing data', () => {
  const file = join(tmpdir(), `yedigul-mig-${Date.now()}.db`);
  // simulate an old database created before the kcal column existed
  const old = new Database(file);
  old.exec(`CREATE TABLE categories (
    id TEXT PRIMARY KEY, name_tr TEXT NOT NULL, name_en TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name_tr TEXT NOT NULL, name_en TEXT NOT NULL,
    desc_tr TEXT NOT NULL DEFAULT '', desc_en TEXT NOT NULL DEFAULT '',
    price REAL, is_market_price INTEGER NOT NULL DEFAULT 0,
    image_url TEXT, is_available INTEGER NOT NULL DEFAULT 1,
    popular INTEGER NOT NULL DEFAULT 0, chef INTEGER NOT NULL DEFAULT 0,
    diet TEXT NOT NULL DEFAULT '[]', ing_tr TEXT NOT NULL DEFAULT '[]',
    ing_en TEXT NOT NULL DEFAULT '[]', alg_tr TEXT NOT NULL DEFAULT '[]',
    alg_en TEXT NOT NULL DEFAULT '[]', sort INTEGER NOT NULL DEFAULT 0
  )`);
  old.prepare("INSERT INTO categories (id, name_tr, name_en) VALUES ('c1','Test','Test')").run();
  old.prepare("INSERT INTO products (id, category_id, name_tr, name_en, price) VALUES ('p1','c1','Ürün','Item', 100)").run();
  old.close();

  const db = openDb(file);
  const cols = db.prepare('PRAGMA table_info(products)').all().map((c) => c.name);
  assert.ok(cols.includes('kcal'), 'kcal column added by migration');
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get('p1');
  assert.equal(row.price, 100, 'existing data preserved');
  assert.equal(row.kcal, null, 'kcal defaults to null');
  db.close();
  rmSync(file, { force: true });
  rmSync(`${file}-wal`, { force: true });
  rmSync(`${file}-shm`, { force: true });
});

test('deleting a category that still has products is refused at the DB level (ON DELETE RESTRICT)', () => {
  const db = openDb(':memory:');
  db.prepare('INSERT INTO categories (id, name_tr, name_en) VALUES (?, ?, ?)').run('c1', 'Test', 'Test');
  db.prepare('INSERT INTO products (id, category_id, name_tr, name_en) VALUES (?, ?, ?, ?)').run('p1', 'c1', 'Ürün', 'Item');
  assert.throws(
    () => db.prepare('DELETE FROM categories WHERE id = ?').run('c1'),
    /FOREIGN KEY/i,
    'DB should reject deleting a category with products'
  );
  // and the products must survive the refused delete
  assert.equal(db.prepare('SELECT COUNT(*) n FROM products').get().n, 1);
});
