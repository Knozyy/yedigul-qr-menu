import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, localDay, migratePanoSnapshots } from '../db.js';
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

const post = (items) =>
  fetch(`${base}/api/admin/snapshots`, { method: 'POST', headers: h(), body: JSON.stringify({ items }) });

test('pano_snapshots tablosu entity sütunuyla oluşur', () => {
  const db = openDb(':memory:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  assert.ok(tables.includes('pano_snapshots'));

  const cols = db.prepare('PRAGMA table_info(pano_snapshots)').all();
  const entity = cols.find((c) => c.name === 'entity');
  assert.ok(entity, 'entity sütunu olmalı');
  assert.equal(entity.pk, 3, 'entity birincil anahtarın 3. parçası olmalı');
  assert.equal(cols.find((c) => c.name === 'day').pk, 1);
  assert.equal(cols.find((c) => c.name === 'metric').pk, 2);
});

test('eski şemadaki satırlar migration ile korunur', () => {
  const db = openDb(':memory:');
  // Eski hâli taklit et: entity'siz tablo + bir satır
  db.exec(`
    DROP TABLE pano_snapshots;
    CREATE TABLE pano_snapshots (
      day TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL,
      PRIMARY KEY (day, metric)
    );
    INSERT INTO pano_snapshots (day, metric, value) VALUES ('2026-07-01', 'ig.followers', 4000);
  `);
  migratePanoSnapshots(db);

  const rows = db.prepare('SELECT day, metric, entity, value FROM pano_snapshots').all();
  assert.deepEqual(rows, [{ day: '2026-07-01', metric: 'ig.followers', entity: '', value: 4000 }]);
});

test('anlık görüntü yazılır ve geri okunur', async () => {
  const res = await post([
    { day: '2026-07-20', metric: 'ig.followers', value: 4100 },
    { day: '2026-07-21', metric: 'ig.followers', value: 4118 },
  ]);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { written: 2, skipped: 0, unknown: [] });

  const read = await fetch(`${base}/api/admin/snapshots?metric=ig.followers`, { headers: h() });
  const data = await read.json();
  assert.deepEqual(data.rows, [
    { day: '2026-07-20', entity: '', value: 4100 },
    { day: '2026-07-21', entity: '', value: 4118 },
  ], 'eskiden yeniye sıralı dönmeli');
});

test('aynı gün tekrar gönderilirse üzerine yazar, çoğaltmaz', async () => {
  await post([{ day: '2026-07-22', metric: 'ig.followers', value: 4200 }]);
  await post([{ day: '2026-07-22', metric: 'ig.followers', value: 4222 }]);

  const read = await fetch(`${base}/api/admin/snapshots?metric=ig.followers`, { headers: h() });
  const rows = (await read.json()).rows.filter((r) => r.day === '2026-07-22');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, 4222, 'son değer kalmalı — iki bilgisayar da aynı güne yazabilir');
});

test('gelecek tarih reddedilir', async () => {
  const ileri = new Date();
  ileri.setDate(ileri.getDate() + 3);
  const gun = localDay(ileri);

  // Saati yanlış kurulmus bir istemci seriyi ileri tasiyip grafigi kalici
  // olarak bozabilirdi.
  const res = await post([{ day: gun, metric: 'ig.followers', value: 9999 }]);
  assert.deepEqual(await res.json(), { written: 0, skipped: 1, unknown: [] });

  const read = await fetch(`${base}/api/admin/snapshots?metric=ig.followers`, { headers: h() });
  assert.equal((await read.json()).rows.some((r) => r.day === gun), false);
});

test('bilinmeyen ölçüt ve bozuk kayıt atlanır, geçerliler yazılır', async () => {
  const res = await post([
    { day: '2026-07-23', metric: 'ig.followers', value: 4300 },
    { day: '2026-07-23', metric: 'uydurma.olcut', value: 5 },
    { day: 'bozuk-tarih', metric: 'ig.followers', value: 5 },
    { day: '2026-07-23', metric: 'ig.followers', value: 'sayi-degil' },
  ]);
  const body = await res.json();
  assert.equal(body.written, 1);
  assert.equal(body.skipped, 3);
  assert.deepEqual(body.unknown, ['uydurma.olcut']);
});

test('entity ile yazılır; aynı gün farklı entity çakışmaz', async () => {
  const res = await post([
    { day: '2026-07-25', metric: 'menu.price', entity: 'levrek', value: 850 },
    { day: '2026-07-25', metric: 'menu.price', entity: 'cipura', value: 780 },
    { day: '2026-07-25', metric: 'menu.price', entity: 'levrek-0', value: 850 },
  ]);
  assert.equal((await res.json()).written, 3);

  const read = await fetch(`${base}/api/admin/snapshots?metric=menu.price&from=2026-07-25&to=2026-07-25`, { headers: h() });
  const rows = (await read.json()).rows;
  assert.equal(rows.length, 3, 'üç varlık üç ayrı satır');
  assert.deepEqual(rows.map((r) => r.entity).sort(), ['cipura', 'levrek', 'levrek-0']);
});

test('entity kuralı çiğnenirse kayıt atlanır', async () => {
  const res = await post([
    { day: '2026-07-25', metric: 'menu.price', value: 100 },                      // entity eksik
    { day: '2026-07-25', metric: 'ig.followers', entity: 'levrek', value: 100 },  // olmaması gereken entity
    { day: '2026-07-25', metric: 'menu.price', entity: 'boşluk var', value: 100 },// geçersiz biçim
    { day: '2026-07-25', metric: 'menu.price', entity: 'a'.repeat(81), value: 1 },// çok uzun
  ]);
  const body = await res.json();
  assert.equal(body.written, 0);
  assert.equal(body.skipped, 4);
  assert.deepEqual(body.unknown, [], 'bunlar bilinmeyen ölçüt değil, kural ihlali');
});

test('global ölçüt entity olmadan yazılmaya devam eder', async () => {
  const res = await post([{ day: '2026-07-25', metric: 'ig.reach', value: 12000 }]);
  assert.equal((await res.json()).written, 1);
});

test('gün aralığıyla okunur', async () => {
  await post([
    { day: '2026-01-05', metric: 'ig.reach', value: 100 },
    { day: '2026-03-05', metric: 'ig.reach', value: 200 },
    { day: '2026-06-05', metric: 'ig.reach', value: 300 },
  ]);

  const read = await fetch(`${base}/api/admin/snapshots?metric=ig.reach&from=2026-02-01&to=2026-04-01`, { headers: h() });
  const data = await read.json();
  assert.deepEqual(data.rows.map((r) => r.day), ['2026-03-05'], 'yalnız aralıktakiler');
  assert.equal(data.from, '2026-02-01');
  assert.equal(data.to, '2026-04-01');
});

test('entity verilirse yalnız o varlık, verilmezse hepsi döner', async () => {
  await post([
    { day: '2026-07-24', metric: 'menu.price', entity: 'levrek', value: 800 },
    { day: '2026-07-24', metric: 'menu.price', entity: 'cipura', value: 700 },
  ]);
  const aralik = 'from=2026-07-24&to=2026-07-24';

  const tek = await fetch(`${base}/api/admin/snapshots?metric=menu.price&entity=levrek&${aralik}`, { headers: h() });
  assert.deepEqual((await tek.json()).rows, [{ day: '2026-07-24', entity: 'levrek', value: 800 }]);

  const hepsi = await fetch(`${base}/api/admin/snapshots?metric=menu.price&${aralik}`, { headers: h() });
  assert.equal((await hepsi.json()).rows.length, 2);
});

test('aralık verilmezse son 90 gün kullanılır', async () => {
  const eski = localDay(new Date(Date.now() - 200 * 86400000));
  const yakin = localDay(new Date(Date.now() - 5 * 86400000));
  await post([
    { day: eski, metric: 'reviews.count', value: 10 },
    { day: yakin, metric: 'reviews.count', value: 20 },
  ]);

  const read = await fetch(`${base}/api/admin/snapshots?metric=reviews.count`, { headers: h() });
  const days = (await read.json()).rows.map((r) => r.day);
  assert.ok(days.includes(yakin), '5 gün öncesi görünmeli');
  assert.equal(days.includes(eski), false, '200 gün öncesi varsayılan pencerede olmamalı');
});

test('okumada bilinmeyen ölçüt 400 döner', async () => {
  const res = await fetch(`${base}/api/admin/snapshots?metric=uydurma`, { headers: h() });
  assert.equal(res.status, 400);
});

test('oturumsuz erişilemez', async () => {
  const okuma = await fetch(`${base}/api/admin/snapshots?metric=ig.followers`);
  assert.equal(okuma.status, 401);

  const yazma = await fetch(`${base}/api/admin/snapshots`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ day: '2026-07-24', metric: 'ig.followers', value: 1 }] }),
  });
  assert.equal(yazma.status, 401);
});
