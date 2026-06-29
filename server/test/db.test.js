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
