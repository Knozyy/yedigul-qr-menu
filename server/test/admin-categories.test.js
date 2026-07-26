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

test('PATCH is_active=0 hides the category and its products from the public menu', async () => {
  const before = await (await fetch(`${base}/api/menu`)).json();
  assert.ok(before.categories.some((c) => c.id === 'cold'), 'cold is visible initially');

  const patch = await fetch(`${base}/api/admin/categories/cold`, {
    method: 'PATCH', headers: h(),
    body: JSON.stringify({ is_active: 0 }),
  });
  assert.equal(patch.status, 200);

  const after = await (await fetch(`${base}/api/menu`)).json();
  assert.ok(!after.categories.some((c) => c.id === 'cold'), 'cold category hidden');
  assert.ok(!after.products.some((p) => p.cat === 'cold'), 'cold products hidden');

  // reactivate so other tests are unaffected
  await fetch(`${base}/api/admin/categories/cold`, {
    method: 'PATCH', headers: h(), body: JSON.stringify({ is_active: 1 }),
  });
});

test('kategoriler toplu olarak yeniden sıralanır', async () => {
  const before = await fetch(`${base}/api/admin/menu`, { headers: h() });
  const ids = (await before.json()).categories.map((c) => c.id);
  const yeni = [...ids].reverse();

  const res = await fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: yeni }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, count: yeni.length });

  const after = await fetch(`${base}/api/admin/menu`, { headers: h() });
  const sonra = (await after.json()).categories;
  assert.deepEqual(sonra.map((c) => c.id), yeni, 'GET /menu yeni sırayı vermeli');
  assert.deepEqual(sonra.map((c) => c.sort), yeni.map((_, i) => i), 'sort 0dan ardışık olmalı');
});

test('eksik id ile sıralama reddedilir ve hiçbir şey değişmez', async () => {
  const before = await fetch(`${base}/api/admin/menu`, { headers: h() });
  const ids = (await before.json()).categories.map((c) => c.id);

  const res = await fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: ids.slice(1) }),
  });
  assert.equal(res.status, 400);

  const after = await fetch(`${base}/api/admin/menu`, { headers: h() });
  assert.deepEqual((await after.json()).categories.map((c) => c.id), ids, 'sıra bozulmamalı');
});

test('tekrarlı, bilinmeyen veya boş id listesi reddedilir', async () => {
  const before = await fetch(`${base}/api/admin/menu`, { headers: h() });
  const ids = (await before.json()).categories.map((c) => c.id);

  const gonder = (body) => fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify(body),
  });

  const tekrarli = [...ids]; tekrarli[1] = tekrarli[0];
  assert.equal((await gonder({ ids: tekrarli })).status, 400);

  const uydurma = [...ids]; uydurma[0] = 'olmayan-kategori';
  assert.equal((await gonder({ ids: uydurma })).status, 400);

  assert.equal((await gonder({ ids: [] })).status, 400);
  assert.equal((await gonder({})).status, 400);
});

test('sıralama denetim kaydına yazılır', async () => {
  const before = await fetch(`${base}/api/admin/menu`, { headers: h() });
  const ids = (await before.json()).categories.map((c) => c.id);

  await fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: [...ids].reverse() }),
  });

  const log = await fetch(`${base}/api/admin/history`, { headers: h() });
  const entries = (await log.json()).entries;
  assert.ok(entries.some((e) => e.entity === 'category' && /sıra/i.test(e.detail)),
    'denetim kaydında sıralama girişi olmalı');
});

test('sıralama oturumsuz yapılamaz', async () => {
  const res = await fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids: ['fish'] }),
  });
  assert.equal(res.status, 401);
});
