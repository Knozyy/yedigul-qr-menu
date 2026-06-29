import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';

let server, base, db;

before(async () => {
  db = openDb(':memory:');
  seed(db);
  const app = createApp({ db });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET /api/menu returns categories and products', async () => {
  const res = await fetch(`${base}/api/menu`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.categories) && body.categories.length >= 7);
  assert.ok(Array.isArray(body.products) && body.products.length > 0);
});

test('GET /api/menu hides unavailable products', async () => {
  db.prepare('UPDATE products SET is_available = 0 WHERE id = ?').run('fava');
  const res = await fetch(`${base}/api/menu`);
  const body = await res.json();
  assert.ok(!body.products.some((p) => p.id === 'fava'), 'fava is hidden');
  db.prepare('UPDATE products SET is_available = 1 WHERE id = ?').run('fava');
});

test('public item shape matches menu.js (price null when market)', async () => {
  db.prepare('UPDATE products SET is_market_price = 1, price = NULL WHERE id = ?').run('fava');
  const res = await fetch(`${base}/api/menu`);
  const body = await res.json();
  const fava = body.products.find((p) => p.id === 'fava');
  assert.equal(fava.price, null);
  assert.equal(typeof fava.name.tr, 'string');
  assert.ok(Array.isArray(fava.diet));
});
