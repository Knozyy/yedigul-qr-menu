import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, localDay } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie, db;

const gunOnce = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDay(d);
};

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

  // 400 gün geriye kadar veri: aralık süzmesi 30 günlük pencerenin dışına
  // çıkabildiğini kanıtlasın.
  const yaz = db.prepare(
    `INSERT INTO stats_daily (day, key, n) VALUES (?, ?, ?)
     ON CONFLICT(day, key) DO UPDATE SET n = excluded.n`
  );
  for (const gun of [400, 200, 100, 40, 20, 5, 1]) {
    yaz.run(gunOnce(gun), 'menu_view', gun);
    yaz.run(gunOnce(gun), 'qr_scan', Math.floor(gun / 2));
  }
});
after(() => server.close());

const stats = async (query = '') =>
  (await fetch(`${base}/api/admin/stats${query}`, { headers: { cookie } })).json();

const durum = async (query) =>
  (await fetch(`${base}/api/admin/stats${query}`, { headers: { cookie } })).status;

// Panonun siteStats konektörü bu ucu PARAMETRESİZ çağırıyor; aralık desteği
// onun davranışını değiştirmemeli.
test('parametresiz çağrı son 30 günde kalır ve today/week/month yerinde durur', async () => {
  const data = await stats();
  assert.ok(data.today, 'today alanı korunmalı');
  assert.ok(data.week && data.month, 'week/month alanları korunmalı');
  assert.ok(data.days.every((d) => d.day >= gunOnce(29)), '30 günden eski gün gelmemeli');
  assert.ok(!data.days.some((d) => d.day === gunOnce(40)), '40 gün öncesi pencerede değil');
});

test('from/to yalnızca days[] süzgecini değiştirir', async () => {
  const data = await stats(`?from=${gunOnce(250)}&to=${gunOnce(150)}`);
  assert.deepEqual(data.days.map((d) => d.day), [gunOnce(200)]);
  assert.equal(data.days[0].menu_view, 200);
  assert.equal(data.days[0].qr_scan, 100);
  // today/week/month aralıktan bağımsız: anlamları "bugün/bu hafta/bu ay"
  assert.ok(data.today);
  assert.ok(data.week && data.month);
});

test('30 günlük pencerenin dışına çıkabilir', async () => {
  const data = await stats(`?from=${gunOnce(420)}&to=${gunOnce(380)}`);
  assert.deepEqual(data.days.map((d) => d.day), [gunOnce(400)]);
});

test('yalnız from verilince to bugüne düşer', async () => {
  const data = await stats(`?from=${gunOnce(6)}`);
  assert.ok(data.days.every((d) => d.day >= gunOnce(6)));
  assert.ok(data.days.some((d) => d.day === gunOnce(5)));
  assert.ok(!data.days.some((d) => d.day === gunOnce(20)));
});

test('firstDay en eski günü döner', async () => {
  const data = await stats();
  assert.equal(data.firstDay, gunOnce(400));
});

test('kayıt yokken firstDay null olur', async () => {
  const bos = openDb(':memory:');
  seed(bos);
  const app = createApp({ db: bos, auth: createAuth({ secret: 's', password: 'pw' }) });
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const url = `http://127.0.0.1:${srv.address().port}`;
  const giris = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'pw' }),
  });
  const data = await (await fetch(`${url}/api/admin/stats`, {
    headers: { cookie: giris.headers.get('set-cookie') },
  })).json();
  assert.equal(data.firstDay, null);
  srv.close();
});

test('bozuk tarih biçimi 400 döner', async () => {
  assert.equal(await durum('?from=2026-7-1'), 400);
  assert.equal(await durum('?to=dun'), 400);
  assert.equal(await durum('?from=2026-07-01&to='), 400);
});

test('from to dan büyükse 400 döner', async () => {
  assert.equal(await durum('?from=2026-07-20&to=2026-07-10'), 400);
});

// Üst sınır olmadan tek istek yıllarca satır çekebilir; tünelin ucunda
// tek çekirdekli bir sunucu var.
test('730 günden uzun aralık 400 döner', async () => {
  assert.equal(await durum('?from=2024-01-01&to=2026-07-27'), 400);
  assert.equal(await durum(`?from=${gunOnce(729)}&to=${gunOnce(0)}`), 200);
});

test('aynı gün from ve to geçerlidir', async () => {
  const data = await stats(`?from=${gunOnce(100)}&to=${gunOnce(100)}`);
  assert.deepEqual(data.days.map((d) => d.day), [gunOnce(100)]);
});

test('oturumsuz 401', async () => {
  const res = await fetch(`${base}/api/admin/stats?from=2026-07-01&to=2026-07-10`);
  assert.equal(res.status, 401);
});
