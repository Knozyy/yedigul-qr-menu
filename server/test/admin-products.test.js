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

test('PATCH sets and clears kcal', async () => {
  // is_available: 1 — an earlier test leaves fava hidden from the public menu
  let res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH', headers: auth(), body: JSON.stringify({ kcal: 310, is_available: 1 }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).kcal, 310);

  // public menu exposes it
  const pub = await (await fetch(`${base}/api/menu`)).json();
  assert.equal(pub.products.find((p) => p.id === 'fava').kcal, 310);

  // clearing works
  res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH', headers: auth(), body: JSON.stringify({ kcal: null }),
  });
  assert.equal((await res.json()).kcal, null);
});

test('PATCH to a non-existent category returns 400 not 500', async () => {
  const res = await fetch(`${base}/api/admin/products/fava`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ category_id: 'does-not-exist' }),
  });
  assert.equal(res.status, 400);
});

// ---- Kategori içi ürün sıralaması ----

const menuOku = async () => (await (await fetch(`${base}/api/admin/menu`, { headers: auth() })).json()).products;
const sirala = (body) => fetch(`${base}/api/admin/products/order`, {
  method: 'PUT', headers: auth(), body: JSON.stringify(body),
});

test('kategori içindeki ürünler yeniden sıralanır', async () => {
  const once = await menuOku();
  const fish = once.filter((p) => p.category_id === 'fish');
  assert.ok(fish.length >= 3, 'test için en az 3 balık ürünü gerekli');

  const yeni = [...fish].reverse().map((p) => p.id);
  const res = await sirala({ category_id: 'fish', ids: yeni });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, count: yeni.length });

  const sonra = await menuOku();
  assert.deepEqual(
    sonra.filter((p) => p.category_id === 'fish').map((p) => p.id), yeni,
    'GET /menu kategori içinde yeni sırayı vermeli',
  );
});

test('sıralama diğer kategorilerin sort değerlerine dokunmaz', async () => {
  const once = await menuOku();
  const digerleri = once.filter((p) => p.category_id !== 'hot')
    .map((p) => `${p.id}:${p.sort}`).join(',');
  const hot = once.filter((p) => p.category_id === 'hot');
  const yuvalarOnce = hot.map((p) => p.sort).sort((a, b) => a - b);

  await sirala({ category_id: 'hot', ids: [...hot].reverse().map((p) => p.id) });

  const sonra = await menuOku();
  assert.equal(
    sonra.filter((p) => p.category_id !== 'hot').map((p) => `${p.id}:${p.sort}`).join(','),
    digerleri, 'başka kategorilerin sort değeri değişmemeli',
  );
  assert.deepEqual(
    sonra.filter((p) => p.category_id === 'hot').map((p) => p.sort).sort((a, b) => a - b),
    yuvalarOnce, 'kategorinin sıra yuvaları aynı kalmalı (blok korunur)',
  );
});

test('bozuk ürün listesi reddedilir ve sıra korunur', async () => {
  const once = await menuOku();
  const cold = once.filter((p) => p.category_id === 'cold').map((p) => p.id);
  const baskaKategoriUrunu = once.find((p) => p.category_id === 'meat').id;
  const oncekiHal = once.map((p) => `${p.id}:${p.sort}`).join(',');

  const tekrarli = [...cold]; tekrarli[1] = tekrarli[0];
  const yabanci = [...cold]; yabanci[0] = baskaKategoriUrunu;

  assert.equal((await sirala({ category_id: 'cold', ids: cold.slice(1) })).status, 400, 'eksik');
  assert.equal((await sirala({ category_id: 'cold', ids: tekrarli })).status, 400, 'tekrarlı');
  assert.equal((await sirala({ category_id: 'cold', ids: yabanci })).status, 400, 'başka kategoriden');
  assert.equal((await sirala({ category_id: 'cold', ids: [...cold, 'uydurma'] })).status, 400, 'bilinmeyen');
  assert.equal((await sirala({ category_id: 'cold', ids: [] })).status, 400, 'boş');
  assert.equal((await sirala({ category_id: 'olmayan', ids: cold })).status, 400, 'bilinmeyen kategori');
  assert.equal((await sirala({ ids: cold })).status, 400, 'kategori yok');

  const sonra = await menuOku();
  assert.equal(sonra.map((p) => `${p.id}:${p.sort}`).join(','), oncekiHal, 'hiçbir şey değişmemeli');
});

test('ürün sıralaması denetim kaydına yazılır', async () => {
  const urunler = await menuOku();
  const salad = urunler.filter((p) => p.category_id === 'salad').map((p) => p.id);
  await sirala({ category_id: 'salad', ids: [...salad].reverse() });

  const log = await (await fetch(`${base}/api/admin/history`, { headers: auth() })).json();
  assert.ok(log.entries.some((e) => e.entity === 'product' && /sıra/i.test(e.detail)),
    'denetim kaydında ürün sıralaması olmalı');
});

test('ürün sıralaması oturumsuz yapılamaz', async () => {
  const res = await fetch(`${base}/api/admin/products/order`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ category_id: 'fish', ids: ['levrek'] }),
  });
  assert.equal(res.status, 401);
});
