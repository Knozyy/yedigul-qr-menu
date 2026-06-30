import { test } from 'node:test';
import assert from 'node:assert/strict';
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
