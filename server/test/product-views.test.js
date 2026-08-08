import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, localDay } from '../db.js';
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

/** Ürün detayı açıldı sinyali. Yanıt: { counted } */
const bak = (id, product) =>
  fetch(`${base}/api/menu/product-view`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, product }),
  });

const bakJson = (id, product) => bak(id, product).then((r) => r.json());

const enCok = async () =>
  (await fetch(`${base}/api/admin/stats/products`, { headers: { cookie } })).json();

const sayac = (productId) =>
  db.prepare('SELECT n FROM product_views_daily WHERE day = ? AND product_id = ?')
    .get(localDay(), productId)?.n ?? 0;

const cihaz = (etiket) => `${etiket}-${Math.random()}`;

test('şema: product_views_daily ve product_views oluşur', () => {
  const fresh = openDb(':memory:');
  const tablolar = fresh.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  assert.ok(tablolar.includes('product_views_daily'));
  assert.ok(tablolar.includes('product_views'));
});

test('ürün detayı açılınca sayılır', async () => {
  const once = sayac('levrek');
  const res = await bakJson(cihaz('tekil'), 'levrek');
  assert.equal(res.counted, true);
  assert.equal(sayac('levrek'), once + 1);
});

test('aynı cihaz aynı ürüne 6 saat içinde tekrar bakarsa sayılmaz', async () => {
  const dev = cihaz('tekrar');
  const once = sayac('levrek');
  const ilk = await bakJson(dev, 'levrek');
  const ikinci = await bakJson(dev, 'levrek');
  assert.equal(ilk.counted, true);
  assert.equal(ikinci.counted, false);
  assert.equal(sayac('levrek'), once + 1, 'yalnız bir kez artmalı');
});

// Pencerenin kilit noktası: anahtar cihaz DEĞİL, (cihaz, ürün) ikilisi.
// Cihaz başına olsaydı bir misafirin baktığı ikinci ürün hiç sayılmazdı.
test('aynı cihaz farklı ürüne bakınca ikisi de sayılır', async () => {
  const dev = cihaz('cok-urun');
  const levrekOnce = sayac('levrek');
  const ezmeOnce = sayac('aciliezme');

  const ilk = await bakJson(dev, 'levrek');
  const ikinci = await bakJson(dev, 'aciliezme');

  assert.equal(ilk.counted, true);
  assert.equal(ikinci.counted, true);
  assert.equal(sayac('levrek'), levrekOnce + 1);
  assert.equal(sayac('aciliezme'), ezmeOnce + 1);
});

test('pencere dolunca tekrar sayılır ve eski satırlar temizlenir', async () => {
  const dev = cihaz('pencere');
  const once = sayac('levrek');
  await bakJson(dev, 'levrek');

  // 6 saati beklemek yerine son görülmeyi geriye alıyoruz.
  db.prepare('UPDATE product_views SET last_at = ? WHERE device_id = ?')
    .run(Date.now() - 7 * 60 * 60 * 1000, dev);

  const sonra = await bakJson(dev, 'levrek');
  assert.equal(sonra.counted, true);
  assert.equal(sayac('levrek'), once + 2);

  const bayat = db
    .prepare('SELECT COUNT(*) c FROM product_views WHERE last_at < ?')
    .get(Date.now() - 6 * 60 * 60 * 1000).c;
  assert.equal(bayat, 0, 'pencere dışı satırlar her çağrıda silinir');
});

test('eksik cihaz kimliği veya ürün 400 döner', async () => {
  assert.equal((await bak('', 'levrek')).status, 400);
  assert.equal((await bak(cihaz('eksik'), '')).status, 400);
});

// İzleme çağrısıdır: menü yenilenirken silinmiş bir ürüne tıklamak müşteriye
// hata göstermemeli. 404 yerine sessizce sayılmamış sayılır.
test('olmayan ürün sessizce yoksayılır, tabloya satır yazılmaz', async () => {
  const res = await bak(cihaz('hayalet'), 'boyle-bir-urun-yok');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).counted, false);
  const satir = db
    .prepare('SELECT COUNT(*) c FROM product_views_daily WHERE product_id = ?')
    .get('boyle-bir-urun-yok').c;
  assert.equal(satir, 0);
});

test('izleme çağrısı denetim kaydını doldurmaz', async () => {
  const once = db.prepare('SELECT COUNT(*) c FROM audit_log').get().c;
  await bakJson(cihaz('denetim'), 'levrek');
  assert.equal(db.prepare('SELECT COUNT(*) c FROM audit_log').get().c, once);
});

test('en çok bakılanlar azalan sırada, iki pencerede birden döner', async () => {
  // Temiz bir zemin: bu testin kendi ürünleri kendi sayılarıyla.
  db.exec('DELETE FROM product_views_daily');
  const gun = localDay();
  const yaz = db.prepare('INSERT INTO product_views_daily (day, product_id, n) VALUES (?, ?, ?)');
  yaz.run(gun, 'levrek', 30);
  yaz.run(gun, 'aciliezme', 12);
  yaz.run(gun, 'kalamar', 21);

  const { week, month } = await enCok();
  assert.deepEqual(week.map((r) => r.id), ['levrek', 'kalamar', 'aciliezme']);
  assert.deepEqual(week.map((r) => r.views), [30, 21, 12]);
  assert.equal(week[0].name_tr, 'Izgara Levrek');
  assert.deepEqual(month.map((r) => r.id), week.map((r) => r.id));
});

test('liste ilk 10 ürünle sınırlıdır', async () => {
  db.exec('DELETE FROM product_views_daily');
  const gun = localDay();
  const urunler = db.prepare('SELECT id FROM products LIMIT 14').all();
  assert.ok(urunler.length >= 12, 'test 10dan fazla ürün ister');
  const yaz = db.prepare('INSERT INTO product_views_daily (day, product_id, n) VALUES (?, ?, ?)');
  urunler.forEach((u, i) => yaz.run(gun, u.id, urunler.length - i));

  const { week } = await enCok();
  assert.equal(week.length, 10);
});

test('haftalık pencere aylık pencereden dar: 10 gün önceki bakılma yalnız ayda görünür', async () => {
  db.exec('DELETE FROM product_views_daily');
  const eski = new Date();
  eski.setDate(eski.getDate() - 10);
  db.prepare('INSERT INTO product_views_daily (day, product_id, n) VALUES (?, ?, 9)')
    .run(localDay(eski), 'levrek');

  const { week, month } = await enCok();
  assert.deepEqual(week, []);
  assert.deepEqual(month.map((r) => r.id), ['levrek']);
});

// Fix menüdeki RESTRICT'in bilinçli tersi: geçmişte bakılmış olmak ürünü
// silinemez yapmamalı. Silinince geçmişi de gider, listeden kendiliğinden düşer.
test('ürün silinince görüntülenme geçmişi de gider', async () => {
  db.exec('DELETE FROM product_views_daily');
  const dev = cihaz('silinen');
  const hedef = db
    .prepare('SELECT id FROM products WHERE id NOT IN (SELECT product_id FROM product_set_items) LIMIT 1')
    .get().id;
  await bakJson(dev, hedef);
  assert.equal(sayac(hedef), 1);

  const res = await fetch(`${base}/api/admin/products/${hedef}`, { method: 'DELETE', headers: { cookie } });
  assert.equal(res.status, 204);

  assert.equal(sayac(hedef), 0);
  assert.equal(
    db.prepare('SELECT COUNT(*) c FROM product_views WHERE product_id = ?').get(hedef).c,
    0,
  );
  const { week } = await enCok();
  assert.ok(!week.some((r) => r.id === hedef));
});

test('en çok bakılanlara oturumsuz erişilemez', async () => {
  const res = await fetch(`${base}/api/admin/stats/products`);
  assert.equal(res.status, 401);
});
