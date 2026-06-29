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

const h = () => ({ cookie, 'content-type': 'application/json' });

test('POST creates a category', async () => {
  const res = await fetch(`${base}/api/admin/categories`, {
    method: 'POST', headers: h(),
    body: JSON.stringify({ id: 'wine', name_tr: 'Şaraplar', name_en: 'Wines' }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.id, 'wine');
});

test('DELETE non-empty category returns 409', async () => {
  const res = await fetch(`${base}/api/admin/categories/cold`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(res.status, 409);
});

test('DELETE empty category succeeds', async () => {
  const res = await fetch(`${base}/api/admin/categories/wine`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(res.status, 204);
});
