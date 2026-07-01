import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie;

before(async () => {
  const db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 's', password: 'pw' });
  const app = createApp({ db, auth });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'pw' }),
  });
  cookie = login.headers.get('set-cookie');
});

after(() => server.close());

const auth = (extra = {}) => ({ cookie, 'content-type': 'application/json', ...extra });

test('admin routes reject unauthenticated requests', async () => {
  const res = await fetch(`${base}/api/admin/menu`);
  assert.equal(res.status, 401);
});

test('GET /api/admin/menu returns all products including hidden', async () => {
  const res = await fetch(`${base}/api/admin/menu`, { headers: { cookie } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.products.length > 0);
});

test('PATCH updates price and is_market_price', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ price: 999, is_market_price: 0 }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.price, 999);
  assert.equal(body.is_market_price, 0);
});

test('PATCH toggles availability', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ is_available: 0 }),
  });
  const body = await res.json();
  assert.equal(body.is_available, 0);
});

test('POST creates and DELETE removes a product', async () => {
  const create = await fetch(`${base}/api/admin/products`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({
      category_id: 'cold', name_tr: 'Test', name_en: 'Test', price: 50,
    }),
  });
  assert.equal(create.status, 201);
  const prod = await create.json();
  assert.ok(prod.id);

  const del = await fetch(`${base}/api/admin/products/${prod.id}`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(del.status, 204);
});

test('PATCH unknown product returns 404', async () => {
  const res = await fetch(`${base}/api/admin/products/nope`, {
    method: 'PATCH', headers: auth(), body: JSON.stringify({ price: 1 }),
  });
  assert.equal(res.status, 404);
});

test('PATCH with price and is_market_price together nulls the price', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ price: 999, is_market_price: 1 }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.is_market_price, 1);
  assert.equal(body.price, null);
});

test('PATCH turning market price off restores a numeric price', async () => {
  // fava is market-priced from the previous test; switch back with a price
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ is_market_price: 0, price: 300 }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.is_market_price, 0);
  assert.equal(body.price, 300);
});

test('PATCH to a non-existent category returns 400 not 500', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ category_id: 'does-not-exist' }),
  });
  assert.equal(res.status, 400);
});
