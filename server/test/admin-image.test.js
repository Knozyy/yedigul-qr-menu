import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie, uploadsDir, db;

before(async () => {
  uploadsDir = mkdtempSync(join(tmpdir(), 'yedigul-up-'));
  db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 's', password: 'pw' });
  const app = createApp({ db, uploadsDir, auth });
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

// 1x1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

test('upload sets image_url and file is served', async () => {
  const form = new FormData();
  form.append('image', new Blob([PNG], { type: 'image/png' }), 'pic.png');
  const res = await fetch(`${base}/api/admin/products/fava/image`, {
    method: 'POST', headers: { cookie }, body: form,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.image_url.startsWith('/uploads/'), 'image_url set');

  const file = await fetch(`${base}${body.image_url}`);
  assert.equal(file.status, 200);
});

test('rejects non-image file type', async () => {
  const form = new FormData();
  form.append('image', new Blob([Buffer.from('hello')], { type: 'text/plain' }), 'x.txt');
  const res = await fetch(`${base}/api/admin/products/fava/image`, {
    method: 'POST', headers: { cookie }, body: form,
  });
  assert.equal(res.status, 400);
});

test('rejects non-image content masquerading as image/png', async () => {
  // istemci mimetype'ı image/png der ama içerik HTML — magic-byte reddetmeli
  const form = new FormData();
  form.append('image', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.png');
  const res = await fetch(`${base}/api/admin/products/fava/image`, {
    method: 'POST', headers: { cookie }, body: form,
  });
  assert.equal(res.status, 400);
});

test('DELETE image clears image_url', async () => {
  const res = await fetch(`${base}/api/admin/products/fava/image`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.image_url, null);
});

test('generic PATCH ignores image_url (only image routes may set it)', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ image_url: '/uploads/evil.png' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.notEqual(body.image_url, '/uploads/evil.png', 'PATCH must not set image_url');
});

test('image delete refuses to unlink files outside uploadsDir', async () => {
  const sentinel = join(tmpdir(), `yedigul-sentinel-${Date.now()}.txt`);
  writeFileSync(sentinel, 'keep me');
  const rel = relative(uploadsDir, sentinel).split(sep).join('/');
  // simulate a corrupted/malicious DB value pointing outside uploadsDir
  // (PATCH can no longer set image_url, so write it directly)
  db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(`/uploads/${rel}`, 'fava');
  // trigger removeImageFile through the delete-image route
  const res = await fetch(`${base}/api/admin/products/fava/image`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(res.status, 200);
  assert.ok(existsSync(sentinel), 'file outside uploadsDir must NOT be deleted');
  unlinkSync(sentinel);
});
