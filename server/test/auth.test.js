import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base;

before(async () => {
  const db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 'test-secret', password: 'hunter2' });
  const app = createApp({ db, auth });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('login with wrong password returns 401', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'nope' }),
  });
  assert.equal(res.status, 401);
});

test('login with correct password sets cookie and /me succeeds', async () => {
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'hunter2' }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie');
  assert.ok(cookie && cookie.includes('token='), 'token cookie set');

  const me = await fetch(`${base}/api/auth/me`, { headers: { cookie } });
  assert.equal(me.status, 200);
});

test('/me without cookie returns 401', async () => {
  const me = await fetch(`${base}/api/auth/me`);
  assert.equal(me.status, 401);
});
