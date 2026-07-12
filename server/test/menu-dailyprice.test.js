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

test('PATCH sets a daily price on a market product without touching is_market_price', async () => {
  const res = await fetch(`${base}/api/admin/products/palamut`, {
    method: 'PATCH',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ price: 850 }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.price, 850);
  assert.equal(body.is_market_price, 1);
});

test('GET /api/menu shows the daily price for the market product just updated', async () => {
  const res = await fetch(`${base}/api/menu`);
  assert.equal(res.status, 200);
  const body = await res.json();
  const palamut = body.products.find((p) => p.id === 'palamut');
  assert.ok(palamut);
  assert.equal(palamut.price, 850);
});

test('GET /api/menu still shows null price for an untouched market product', async () => {
  const res = await fetch(`${base}/api/menu`);
  const body = await res.json();
  const kalkan = body.products.find((p) => p.id === 'kalkan');
  assert.ok(kalkan);
  assert.equal(kalkan.price, null);
});
