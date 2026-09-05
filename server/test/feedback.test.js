import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, canSubmitFeedback, insertFeedback, localDay } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';
import { RATING_COOLDOWN_MS } from '../../shared/rating-policy.js';

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

test('aynı cihaz beş saat dolmadan ikinci yorum gönderemez', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1800000000000 });
  const db = openDb(':memory:');
  const dev = cihaz('limit');
  assert.equal(canSubmitFeedback(db, dev), true);
  insertFeedback(db, { rating: 1, message: 'ilk yorum', lang: 'tr', deviceId: dev });
  assert.equal(canSubmitFeedback(db, dev), false);
  t.mock.timers.tick(RATING_COOLDOWN_MS - 1);
  assert.equal(canSubmitFeedback(db, dev), false, 'beş saatten bir ms önce hâlâ engellenmeli');
  assert.equal(canSubmitFeedback(db, cihaz('baska')), true, 'başka cihaz etkilenmemeli');
  db.close();
});

test('tam beş saatte yeniden gönderilebilir, yeni yorum süreyi başlatır ve kayıtlar silinmez', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1800000000000 });
  const db = openDb(':memory:');
  const dev = cihaz('pencere');
  insertFeedback(db, { rating: 1, message: 'ilk yorum', lang: 'tr', deviceId: dev });
  t.mock.timers.tick(RATING_COOLDOWN_MS);
  assert.equal(canSubmitFeedback(db, dev), true);
  insertFeedback(db, { rating: 2, message: 'ikinci yorum', lang: 'tr', deviceId: dev });
  assert.equal(canSubmitFeedback(db, dev), false);
  assert.equal(
    db.prepare('SELECT COUNT(*) c FROM feedback WHERE device_id = ?').get(dev).c,
    2,
    'geri bildirim veridir; pencere dışı kayıtlar sayaç gibi budanmaz',
  );
  db.close();
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

test('aynı cihazdan ikinci gönderim kalan süreyle 429 döner; beş saat sonra API kabul eder', async () => {
  const dev = cihaz('cok');
  assert.equal((await gonder(gecerli({ id: dev }))).status, 200);
  const second = await gonder(gecerli({ id: dev }));
  assert.equal(second.status, 429);
  const body = await second.json();
  assert.equal(body.error, 'limit');
  assert.ok(body.retryAfterMs > 0 && body.retryAfterMs <= RATING_COOLDOWN_MS);
  assert.equal(Number(second.headers.get('retry-after')), Math.ceil(body.retryAfterMs / 1000));
  assert.equal((await gonder(gecerli({ id: cihaz('temiz') }))).status, 200);
  apiDb.prepare('UPDATE feedback SET created_at = ? WHERE device_id = ?').run(Date.now() - RATING_COOLDOWN_MS, dev);
  assert.equal((await gonder(gecerli({ id: dev }))).status, 200);
  assert.equal(apiDb.prepare('SELECT COUNT(*) c FROM feedback WHERE device_id = ?').get(dev).c, 2);
});

test('geri bildirim denetim kaydını doldurmaz', async () => {
  const once = apiDb.prepare('SELECT COUNT(*) c FROM audit_log').get().c;
  await gonder(gecerli({ id: cihaz('denetim') }));
  assert.equal(apiDb.prepare('SELECT COUNT(*) c FROM audit_log').get().c, once);
});

const ayarKaydet = (body) =>
  fetch(`${base}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });

const menuMeta = async () => (await (await fetch(`${base}/api/menu/`)).json()).meta;

test('google yorum bağlantısı varsayılan olarak boştur ve menüde görünür', async () => {
  assert.equal((await menuMeta()).info.google_review_url, '');
});

test('https bağlantısı kaydedilir ve menü metasında döner', async () => {
  const res = await ayarKaydet({ info_google_review_url: 'https://g.page/r/ORNEK/review' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).info_google_review_url, 'https://g.page/r/ORNEK/review');
  assert.equal((await menuMeta()).info.google_review_url, 'https://g.page/r/ORNEK/review');
});

// javascript: bir değer menüde çalıştırılabilir bir bağlantıya dönüşürdü.
test('https dışındaki şemalar 400 ile reddedilir ve kayıt değişmez', async () => {
  await ayarKaydet({ info_google_review_url: 'https://g.page/r/ORNEK/review' });
  for (const kotu of ['javascript:alert(1)', 'http://g.page/r/x', 'data:text/html,x', '//g.page/r/x']) {
    const res = await ayarKaydet({ info_google_review_url: kotu });
    assert.equal(res.status, 400, `reddedilmeli: ${kotu}`);
  }
  assert.equal((await menuMeta()).info.google_review_url, 'https://g.page/r/ORNEK/review');
});

test('boş dize kabul edilir; özellik böyle kapatılır', async () => {
  assert.equal((await ayarKaydet({ info_google_review_url: '' })).status, 200);
  assert.equal((await menuMeta()).info.google_review_url, '');
});

const panelListe = async (qs = '') =>
  (await fetch(`${base}/api/admin/feedback${qs}`, { headers: { cookie } })).json();

test('panel listesi oturum ister', async () => {
  assert.equal((await fetch(`${base}/api/admin/feedback`)).status, 401);
  assert.equal((await fetch(`${base}/api/admin/feedback/1/read`, { method: 'PATCH' })).status, 401);
  assert.equal((await fetch(`${base}/api/admin/feedback/1`, { method: 'DELETE' })).status, 401);
});

test('liste yeniden eskiye sıralı döner ve cihaz kimliğini sızdırmaz', async () => {
  apiDb.exec('DELETE FROM feedback');
  insertFeedback(apiDb, { rating: 1, message: 'eski', lang: 'tr', deviceId: 'c1' });
  insertFeedback(apiDb, { rating: 3, message: 'yeni', lang: 'en', deviceId: 'c2' });

  const { items, unread } = await panelListe();
  assert.deepEqual(items.map((r) => r.message), ['yeni', 'eski']);
  assert.equal(unread, 2);
  assert.equal('device_id' in items[0], false, 'cihaz kimliği panele gönderilmez');
});

test('tarih aralığı süzer; parametresiz çağrı son 30 günü verir', async () => {
  apiDb.exec('DELETE FROM feedback');
  const eskiId = insertFeedback(apiDb, { rating: 1, message: 'çok eski', lang: 'tr', deviceId: 'c1' });
  apiDb.prepare('UPDATE feedback SET created_at = ? WHERE id = ?')
    .run(Date.now() - 40 * 24 * 60 * 60 * 1000, eskiId);
  insertFeedback(apiDb, { rating: 2, message: 'bugün', lang: 'tr', deviceId: 'c2' });

  assert.deepEqual((await panelListe()).items.map((r) => r.message), ['bugün']);

  const gun = (offset) => localDay(new Date(Date.now() - offset * 86400000));
  const genis = await panelListe(`?from=${gun(60)}&to=${gun(0)}`);
  assert.equal(genis.items.length, 2);
});

test('okundu işaretlenir ve geri alınır; okunmamış sayısı düşer', async () => {
  apiDb.exec('DELETE FROM feedback');
  const id = insertFeedback(apiDb, { rating: 2, message: 'okunacak', lang: 'tr', deviceId: 'c1' });

  const isaretle = (is_read) =>
    fetch(`${base}/api/admin/feedback/${id}/read`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ is_read }),
    });

  assert.equal((await isaretle(true)).status, 200);
  assert.equal((await panelListe()).unread, 0);
  assert.equal((await isaretle(false)).status, 200);
  assert.equal((await panelListe()).unread, 1);
});

test('silme 204 döner ve denetim kaydına yazılır', async () => {
  apiDb.exec('DELETE FROM feedback');
  const id = insertFeedback(apiDb, { rating: 1, message: 'silinecek', lang: 'tr', deviceId: 'c1' });
  const once = apiDb.prepare('SELECT COUNT(*) c FROM audit_log').get().c;

  const res = await fetch(`${base}/api/admin/feedback/${id}`, { method: 'DELETE', headers: { cookie } });
  assert.equal(res.status, 204);
  assert.equal((await panelListe()).items.length, 0);
  assert.equal(apiDb.prepare('SELECT COUNT(*) c FROM audit_log').get().c, once + 1);
});

test('olmayan kayıt 404 döner', async () => {
  assert.equal(
    (await fetch(`${base}/api/admin/feedback/999999`, { method: 'DELETE', headers: { cookie } })).status,
    404,
  );
  assert.equal(
    (await fetch(`${base}/api/admin/feedback/999999/read`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ is_read: true }),
    })).status,
    404,
  );
});

test('sayısal olmayan id 404 döner (abc gibi)', async () => {
  assert.equal(
    (await fetch(`${base}/api/admin/feedback/abc`, { method: 'DELETE', headers: { cookie } })).status,
    404,
  );
  assert.equal(
    (await fetch(`${base}/api/admin/feedback/abc/read`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ is_read: true }),
    })).status,
    404,
  );
});
