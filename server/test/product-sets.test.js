import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie, db;

before(async () => {
  db = openDb(':memory:');
  seed(db);
  const app = createApp({ db, auth: createAuth({ secret: 's', password: 'pw' }) });
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
const post = (body) => fetch(`${base}/api/admin/sets`, { method: 'POST', headers: h(), body: JSON.stringify(body) });
const patch = (id, body) => fetch(`${base}/api/admin/sets/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(body) });
const sets = async () => (await (await fetch(`${base}/api/admin/sets`, { headers: h() })).json()).sets;

const ORNEK = {
  id: 'fix1', name_tr: 'Fix Menü 1', name_en: 'Set Menu 1', price: 850,
  items: [{ product_id: 'levrek', qty: 1 }, { product_id: 'aciliezme', qty: 2 }],
};

test('şema: product_sets ve product_set_items oluşur', () => {
  const fresh = openDb(':memory:');
  const tablolar = fresh.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  assert.ok(tablolar.includes('product_sets'));
  assert.ok(tablolar.includes('product_set_items'));
});

test('set oluşturulur ve içeriğiyle okunur', async () => {
  const res = await post(ORNEK);
  assert.equal(res.status, 201);

  const liste = await sets();
  const fix1 = liste.find((s) => s.id === 'fix1');
  assert.ok(fix1, 'set listede olmalı');
  assert.equal(fix1.name_tr, 'Fix Menü 1');
  assert.equal(fix1.price, 850);
  assert.equal(fix1.kind, 'fix_menu', 'varsayılan kind fix_menu olmalı');
  assert.deepEqual(
    fix1.items.map((i) => `${i.product_id}x${i.qty}`).sort(),
    ['aciliezmex2', 'levrekx1'],
  );
});

test('içerik güncellenince eski satırlar tamamen değişir', async () => {
  await patch('fix1', { items: [{ product_id: 'cipura', qty: 3 }] });
  const fix1 = (await sets()).find((s) => s.id === 'fix1');
  assert.deepEqual(fix1.items.map((i) => `${i.product_id}x${i.qty}`), ['cipurax3']);
});

test('geçersiz set reddedilir', async () => {
  assert.equal((await post({ ...ORNEK, id: 'a', name_tr: '' })).status, 400, 'ad zorunlu');
  assert.equal((await post({ ...ORNEK, id: 'b', price: -5 })).status, 400, 'negatif fiyat');
  assert.equal((await post({ ...ORNEK, id: 'geçersiz id!' })).status, 400, 'bozuk id');
  assert.equal((await post({ ...ORNEK, id: 'c', items: [{ product_id: 'yok', qty: 1 }] })).status, 400, 'olmayan ürün');
  assert.equal((await post({ ...ORNEK, id: 'd', items: [{ product_id: 'levrek', qty: 0 }] })).status, 400, 'qty < 1');
});

test('fix menüde kullanılan ürün silinemez', async () => {
  const res = await fetch(`${base}/api/admin/products/cipura`, { method: 'DELETE', headers: h() });
  assert.equal(res.status, 409, 'kullanımdaki ürün korunmalı');
  const fix1 = (await sets()).find((s) => s.id === 'fix1');
  assert.ok(fix1.items.length, 'set bozulmamalı');
});

test('set silinince içerik satırları da gider', async () => {
  await post({ ...ORNEK, id: 'gecici', items: [{ product_id: 'lufer', qty: 1 }] });
  const res = await fetch(`${base}/api/admin/sets/gecici`, { method: 'DELETE', headers: h() });
  assert.equal(res.status, 204);

  const kalan = db.prepare('SELECT COUNT(*) n FROM product_set_items WHERE set_id = ?').get('gecici').n;
  assert.equal(kalan, 0, 'cascade ile satırlar silinmeli');
  // Ürün artık serbest: silinebilmeli
  assert.equal((await fetch(`${base}/api/admin/products/lufer`, { method: 'DELETE', headers: h() })).status, 204);
});

test('genel menüde yalnız aktif fix menüler 4 dille görünür', async () => {
  await post({
    id: 'fix2', name_tr: 'Fix Menü 2', name_en: 'Set Menu 2', name_ar: 'قائمة 2',
    price: 1200, is_active: 0, items: [{ product_id: 'hamsi', qty: 1 }],
  });

  const menu = await (await fetch(`${base}/api/menu`)).json();
  assert.ok(Array.isArray(menu.sets), 'genel menüde sets olmalı');
  assert.equal(menu.sets.some((s) => s.id === 'fix2'), false, 'pasif set görünmemeli');

  const fix1 = menu.sets.find((s) => s.id === 'fix1');
  assert.ok(fix1, 'aktif set görünmeli');
  assert.equal(fix1.price, 850);
  assert.equal(fix1.name.tr, 'Fix Menü 1');
  assert.equal(fix1.name.en, 'Set Menu 1');
  assert.ok(fix1.name.ar, 'boş çeviri geri düşmeli, boş kalmamalı');
  assert.ok(fix1.items[0].name.tr, 'içerik adı çözülmeli');
  assert.equal(fix1.items[0].qty, 3);
});

test('setler toplu sıralanır', async () => {
  await patch('fix2', { is_active: 1 });
  const once = (await sets()).map((s) => s.id);
  assert.ok(once.length >= 2);

  const yeni = [...once].reverse();
  const res = await fetch(`${base}/api/admin/sets/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: yeni }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual((await sets()).map((s) => s.id), yeni);

  const eksik = await fetch(`${base}/api/admin/sets/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: yeni.slice(1) }),
  });
  assert.equal(eksik.status, 400, 'eksik liste reddedilmeli');
});

test('setlere oturumsuz erişilemez', async () => {
  assert.equal((await fetch(`${base}/api/admin/sets`)).status, 401);
  const yazma = await fetch(`${base}/api/admin/sets`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ORNEK),
  });
  assert.equal(yazma.status, 401);
});

// ---- Fix menü kategorisi (kind='sets') ----

test('fix menü kategorisi otomatik oluşur ve sıralanabilir', async () => {
  const menu = await (await fetch(`${base}/api/admin/menu`, { headers: h() })).json();
  const setCat = menu.categories.find((c) => c.kind === 'sets');
  assert.ok(setCat, 'kind=sets kategorisi olmalı');
  assert.equal(setCat.id, 'fix-menus');

  // Kategori sıralamasına normal bir satır gibi katılır
  const ids = menu.categories.map((c) => c.id);
  const yeni = [setCat.id, ...ids.filter((id) => id !== setCat.id)];
  const res = await fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: yeni }),
  });
  assert.equal(res.status, 200);

  const sonra = await (await fetch(`${base}/api/admin/menu`, { headers: h() })).json();
  assert.equal(sonra.categories[0].id, setCat.id, 'başa taşınabilmeli');

  // Sona taşı ve genel menüde de sıranın yansıdığını doğrula
  const sona = [...ids.filter((id) => id !== setCat.id), setCat.id];
  await fetch(`${base}/api/admin/categories/order`, {
    method: 'PUT', headers: h(), body: JSON.stringify({ ids: sona }),
  });
  const genel = await (await fetch(`${base}/api/menu`)).json();
  assert.equal(genel.categories.at(-1).id, setCat.id, 'genel menüde de sonda olmalı');
  assert.equal(genel.categories.at(-1).kind, 'sets', 'kind genel menüde açığa çıkmalı');
});

test('fix menü kategorisi silinemez', async () => {
  const res = await fetch(`${base}/api/admin/categories/fix-menus`, { method: 'DELETE', headers: h() });
  assert.equal(res.status, 409);
  const menu = await (await fetch(`${base}/api/admin/menu`, { headers: h() })).json();
  assert.ok(menu.categories.some((c) => c.kind === 'sets'), 'satır yerinde kalmalı');
});

test('fix menü kategorisine ürün eklenemez veya taşınamaz', async () => {
  const olustur = await fetch(`${base}/api/admin/products`, {
    method: 'POST', headers: h(),
    body: JSON.stringify({ id: 'sizinti', category_id: 'fix-menus', name_tr: 'Sızıntı', name_en: 'Leak' }),
  });
  assert.equal(olustur.status, 400, 'yeni ürün fix menü bölümüne konulamaz');

  const tasi = await fetch(`${base}/api/admin/products/levrek`, {
    method: 'PATCH', headers: h(), body: JSON.stringify({ category_id: 'fix-menus' }),
  });
  assert.equal(tasi.status, 400, 'mevcut ürün fix menü bölümüne taşınamaz');
});

test('fix menü kategorisi pasife alınınca setler menüden kalkar', async () => {
  await fetch(`${base}/api/admin/categories/fix-menus`, {
    method: 'PATCH', headers: h(), body: JSON.stringify({ is_active: 0 }),
  });
  const gizli = await (await fetch(`${base}/api/menu`)).json();
  assert.equal(gizli.categories.some((c) => c.kind === 'sets'), false, 'pasif kategori görünmemeli');

  await fetch(`${base}/api/admin/categories/fix-menus`, {
    method: 'PATCH', headers: h(), body: JSON.stringify({ is_active: 1 }),
  });
});
