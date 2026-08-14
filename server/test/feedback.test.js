import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, canSubmitFeedback, insertFeedback } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

const cihaz = (etiket) => `${etiket}-${Math.random()}`;

let server, base, cookie, apiDb;

before(async () => {
  apiDb = openDb(':memory:');
  seed(apiDb);
  const app = createApp({ db: apiDb, auth: createAuth({ secret: 's', password: 'pw' }) });
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

/** Geri bildirim gönderir. Yanıt: { ok } */
const gonder = (body) =>
  fetch(`${base}/api/menu/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const gecerli = (over = {}) => ({ id: cihaz('gecerli'), rating: 2, message: 'servis yavaştı', lang: 'tr', ...over });

test('şema: feedback tablosu oluşur', () => {
  const db = openDb(':memory:');
  const tablolar = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  assert.ok(tablolar.includes('feedback'));
});

test('insertFeedback kaydı yazar, varsayılan okunmamıştır', () => {
  const db = openDb(':memory:');
  const id = insertFeedback(db, { rating: 2, message: 'servis yavaştı', lang: 'tr', deviceId: cihaz('yaz') });
  const satir = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
  assert.equal(satir.rating, 2);
  assert.equal(satir.message, 'servis yavaştı');
  assert.equal(satir.lang, 'tr');
  assert.equal(satir.is_read, 0);
  assert.ok(satir.created_at > 0);
});

test('cihaz başına 24 saatte 3 kayıt sınırı', () => {
  const db = openDb(':memory:');
  const dev = cihaz('limit');
  for (let i = 0; i < 3; i += 1) {
    assert.equal(canSubmitFeedback(db, dev), true, `${i}. gönderim serbest olmalı`);
    insertFeedback(db, { rating: 1, message: `not ${i}`, lang: 'tr', deviceId: dev });
  }
  assert.equal(canSubmitFeedback(db, dev), false, '4. gönderim engellenmeli');
  assert.equal(canSubmitFeedback(db, cihaz('baska')), true, 'başka cihaz etkilenmemeli');
});

test('pencere dolunca cihaz yeniden gönderebilir, eski kayıtlar SİLİNMEZ', () => {
  const db = openDb(':memory:');
  const dev = cihaz('pencere');
  for (let i = 0; i < 3; i += 1) {
    insertFeedback(db, { rating: 1, message: `not ${i}`, lang: 'tr', deviceId: dev });
  }
  db.prepare('UPDATE feedback SET created_at = ? WHERE device_id = ?')
    .run(Date.now() - 25 * 60 * 60 * 1000, dev);

  assert.equal(canSubmitFeedback(db, dev), true);
  assert.equal(
    db.prepare('SELECT COUNT(*) c FROM feedback WHERE device_id = ?').get(dev).c,
    3,
    'geri bildirim veridir; pencere dışı kayıtlar sayaç gibi budanmaz',
  );
});

test('geçerli gönderim 200 ve ok:true döner, kayıt yazılır', async () => {
  const dev = cihaz('mutlu');
  const res = await gonder(gecerli({ id: dev }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  const satir = apiDb.prepare('SELECT * FROM feedback WHERE device_id = ?').get(dev);
  assert.equal(satir.rating, 2);
  assert.equal(satir.message, 'servis yavaştı');
});

// 4 ve 5 istemcide Maps'e gider; sunucuya gelmesi bir sözleşme ihlalidir.
test('rating 1-3 dışındaki her değer 400 döner', async () => {
  for (const rating of [0, 4, 5, 6, -1, 2.5, '2', null, undefined]) {
    const res = await gonder(gecerli({ rating }));
    assert.equal(res.status, 400, `rating=${String(rating)} reddedilmeli`);
    assert.equal((await res.json()).error, 'rating');
  }
});

test('mesaj boş, yalnız boşluk veya 1000 karakterden uzunsa 400', async () => {
  for (const message of ['', '   ', '\n\t ', 'x'.repeat(1001), 42, null]) {
    const res = await gonder(gecerli({ message }));
    assert.equal(res.status, 400, `mesaj reddedilmeli: ${String(message).slice(0, 12)}`);
    assert.equal((await res.json()).error, 'message');
  }
});

test('tam 1000 karakterlik mesaj kabul edilir', async () => {
  const res = await gonder(gecerli({ id: cihaz('sinir'), message: 'x'.repeat(1000) }));
  assert.equal(res.status, 200);
});

test('cihaz kimliği eksikse 400', async () => {
  const res = await gonder(gecerli({ id: '' }));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'device');
});

test('bilinmeyen dil hata değildir, tr olarak yazılır', async () => {
  const dev = cihaz('dil');
  const res = await gonder(gecerli({ id: dev, lang: 'de' }));
  assert.equal(res.status, 200);
  assert.equal(apiDb.prepare('SELECT lang FROM feedback WHERE device_id = ?').get(dev).lang, 'tr');
});

test('aynı cihazdan 4. gönderim 429 döner, farklı cihaz etkilenmez', async () => {
  const dev = cihaz('cok');
  for (let i = 0; i < 3; i += 1) {
    assert.equal((await gonder(gecerli({ id: dev, message: `not ${i}` }))).status, 200);
  }
  const dorduncu = await gonder(gecerli({ id: dev, message: 'dördüncü' }));
  assert.equal(dorduncu.status, 429);
  assert.equal((await dorduncu.json()).error, 'limit');
  assert.equal((await gonder(gecerli({ id: cihaz('temiz') }))).status, 200);
});

test('geri bildirim denetim kaydını doldurmaz', async () => {
  const once = apiDb.prepare('SELECT COUNT(*) c FROM audit_log').get().c;
  await gonder(gecerli({ id: cihaz('denetim') }));
  assert.equal(apiDb.prepare('SELECT COUNT(*) c FROM audit_log').get().c, once);
});
