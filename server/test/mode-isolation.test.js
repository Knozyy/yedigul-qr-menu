import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';
import { openDb } from '../db.js';
import { loadRuntimeConfig } from '../runtime-config.js';
import { seed } from '../seed.js';

async function listen(app) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function fixture() {
  const uploadsDir = mkdtempSync(join(tmpdir(), 'yedigul-mode-'));
  const db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 'mode-test-secret', password: 'dogru-sifre' });
  return { db, auth, uploadsDir };
}

test('public mod menüyü sunar, auth ve admin API yollarını kapatır', async () => {
  const { db, auth, uploadsDir } = fixture();
  const server = await listen(createApp({ db, auth, uploadsDir, mode: 'public' }));
  try {
    assert.equal((await fetch(`${server.base}/api/menu`)).status, 200);
    assert.equal((await fetch(`${server.base}/api/health`)).status, 200);
    assert.equal((await fetch(`${server.base}/api/auth/login`, { method: 'POST' })).status, 404);
    assert.equal((await fetch(`${server.base}/api/admin/menu`)).status, 404);
  } finally {
    await server.close();
    db.close();
    rmSync(uploadsDir, { recursive: true, force: true });
  }
});

test('private mod yalnız auth/admin sunar ve uploads dosyalarını servis etmez', async () => {
  const { db, auth, uploadsDir } = fixture();
  writeFileSync(join(uploadsDir, 'probe.txt'), 'private');
  const server = await listen(createApp({ db, auth, uploadsDir, mode: 'private' }));
  try {
    assert.equal((await fetch(`${server.base}/api/menu`)).status, 404);
    assert.equal((await fetch(`${server.base}/q`)).status, 404);
    assert.equal((await fetch(`${server.base}/uploads/probe.txt`)).status, 404);

    const login = await fetch(`${server.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'dogru-sifre' }),
    });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    assert.ok(token);

    const menu = await fetch(`${server.base}/api/admin/menu`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(menu.status, 200);
  } finally {
    await server.close();
    db.close();
    rmSync(uploadsDir, { recursive: true, force: true });
  }
});

test('private çalışma ayarı loopback dışındaki hostları reddeder', () => {
  const defaults = loadRuntimeConfig({ APP_MODE: 'private' });
  assert.equal(defaults.host, '127.0.0.1');
  assert.equal(defaults.port, 3002);
  assert.throws(
    () => loadRuntimeConfig({ APP_MODE: 'private', HOST: '0.0.0.0' }),
    /yalnızca loopback/,
  );
  assert.throws(() => loadRuntimeConfig({ APP_MODE: 'yanlis' }), /Geçersiz APP_MODE/);
});

test('private mod auth olmadan oluşturulamaz', () => {
  const db = openDb(':memory:');
  assert.throws(() => createApp({ db, mode: 'private' }), /kimlik doğrulaması zorunludur/);
  db.close();
});
