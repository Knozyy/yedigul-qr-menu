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
  const app = createApp({ db, uploadsDir: null, auth });
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

test('/q redirects (relative) to the menu path', async () => {
  const res = await fetch(`${base}/q`, { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/menu/');
});

test('menu_path setting changes the /q redirect target', async () => {
  const put = await fetch(`${base}/api/admin/settings`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ menu_path: '/' }),
  });
  assert.equal(put.status, 200);
  const res = await fetch(`${base}/q`, { redirect: 'manual' });
  assert.equal(res.headers.get('location'), '/');
  // geri al
  await fetch(`${base}/api/admin/settings`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ menu_path: '/menu/' }),
  });
});

test('settings require auth and reject bad menu_path', async () => {
  const noAuth = await fetch(`${base}/api/admin/settings`);
  assert.equal(noAuth.status, 401);

  const bad = await fetch(`${base}/api/admin/settings`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ menu_path: 'menu' }),
  });
  assert.equal(bad.status, 400);
});

test('public_base_url persists and strips trailing slash', async () => {
  const put = await fetch(`${base}/api/admin/settings`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ public_base_url: 'https://yedigul.com/' }),
  });
  const body = await put.json();
  assert.equal(body.public_base_url, 'https://yedigul.com');
});
