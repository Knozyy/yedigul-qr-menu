import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';

test('seed populates categories and products from menu.js', () => {
  const db = openDb(':memory:');
  seed(db);
  const catCount = db.prepare('SELECT COUNT(*) n FROM categories').get().n;
  const prodCount = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  assert.ok(catCount >= 7, 'at least 7 categories seeded');
  assert.ok(prodCount > 0, 'products seeded');
});

test('seed marks null-price items as market price', () => {
  const db = openDb(':memory:');
  seed(db);
  const marketRows = db.prepare('SELECT id FROM products WHERE is_market_price = 1').all();
  for (const row of marketRows) {
    const p = db.prepare('SELECT price FROM products WHERE id = ?').get(row.id);
    assert.equal(p.price, null, `${row.id} market price has null price`);
  }
});

test('seed is idempotent', () => {
  const db = openDb(':memory:');
  seed(db);
  const first = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  seed(db);
  const second = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  assert.equal(first, second, 'second seed does not duplicate');
});

test('seed maps a known product row field-for-field', () => {
  const db = openDb(':memory:');
  seed(db);
  const fava = db.prepare('SELECT * FROM products WHERE id = ?').get('fava');
  assert.equal(fava.category_id, 'cold');
  assert.equal(fava.name_tr, 'Fava');
  assert.equal(fava.name_en, 'Broad Bean Purée');
  assert.equal(fava.price, 300);
  assert.equal(fava.is_market_price, 0);
  assert.equal(fava.is_available, 1);
  assert.equal(fava.popular, 1);
  assert.deepEqual(JSON.parse(fava.diet), ['gf', 'veg']);
});
