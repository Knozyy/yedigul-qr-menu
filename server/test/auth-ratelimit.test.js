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
  const auth = createAuth({ secret: 's', password: 'pw', maxAttempts: 3, lockoutMs: 60_000 });
  const app = createApp({ db, auth });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const tryLogin = (password) =>
  fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });

test('login is locked out after repeated failures, even with the right password', async () => {
  for (let i = 0; i < 3; i++) {
    const res = await tryLogin('wrong');
    assert.equal(res.status, 401, `attempt ${i + 1} rejected`);
  }
  // locked now: correct password must also be refused with 429
  const locked = await tryLogin('pw');
  assert.equal(locked.status, 429, 'locked out after max failures');
});
