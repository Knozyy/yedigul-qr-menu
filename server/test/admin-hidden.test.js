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
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'pw' }),
  });
  cookie = login.headers.get('set-cookie');
});
after(() => server.close());

test('PATCH sets is_hidden on a product', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ is_hidden: 1 }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.is_hidden, 1);
});

test('GET /api/admin/menu still includes the hidden product', async () => {
  const res = await fetch(`${base}/api/admin/menu`, { headers: { cookie } });
  assert.equal(res.status, 200);
  const body = await res.json();
  const fava = body.products.find((p) => p.id === 'fava');
  assert.ok(fava);
  assert.equal(fava.is_hidden, 1);
});

test('GET /api/menu excludes the hidden product from every category', async () => {
  const res = await fetch(`${base}/api/menu`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(!body.products.some((p) => p.id === 'fava'));
});

test('GET /api/menu still includes a non-hidden product', async () => {
  const res = await fetch(`${base}/api/menu`);
  const body = await res.json();
  assert.ok(body.products.length > 0);
  assert.ok(body.products.some((p) => p.id !== 'fava'));
});
