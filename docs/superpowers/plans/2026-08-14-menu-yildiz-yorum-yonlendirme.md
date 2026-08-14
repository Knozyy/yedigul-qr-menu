# Menüde Yıldız Değerlendirme ve Yorum Yönlendirme — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** QR menüde misafire yıldız sorulur; 4–5 yıldız Google Maps yorum kutusunu açar, 1–3 yıldız site içinde kalan ve yalnızca yönetim paneline düşen bir forma yazılır.

**Architecture:** Yeni katman veya bağımlılık yok. Sunucuda `server/db.js` şemasına idempotent bir `feedback` tablosu eklenir, açık uç nokta `server/routes/menu.js` içine mevcut `/view` ve `/product-view` deseniyle yazılır, panel uçları `server/routes/admin.js`'e eklenir. İstemcide iki yeni bileşen (`RatingPrompt`, `RatingStrip`) ve `MenuPage` içinde tek bir `rated` durumu vardır. Google yorum bağlantısı `settings` tablosunda `info_google_review_url` anahtarıyla durur ve panelden düzenlenir.

**Tech Stack:** Node.js + Express 5 + better-sqlite3 (sunucu), React 19 + Vite + TailwindCSS v4 (istemci), `node --test` (sunucu testleri), Playwright (E2E), oxlint.

## Global Constraints

- **Frontend'de yorum satırı YAZILMAZ.** Proje kuralı; `src/` altındaki tüm yorumlar bilinçli olarak temizlendi. Sunucu tarafında (`server/`) Türkçe açıklama yorumları mevcut desene uyarak yazılır.
- **Menü içeriği dört dillidir:** `tr`, `en`, `ar`, `ru`. Yeni her kullanıcıya görünen metin `src/data/ui.js` içindeki `UI` sözlüğüne dört dilde birden eklenir. `ar` için `dir="rtl"` geçerlidir.
- **Mobil öncelikli**, fakat masaüstünde de düzgün görünmelidir (≥768px). Playwright iki projede birden koşar: `chromium-iphone-12` ve `chromium-desktop`.
- **Dokunulacak fiyat/porsiyon/`is_hidden` mantığı yok.** Bu özellik menü verisini okumaz bile.
- `rating` değeri sunucuda **yalnızca 1, 2, 3** kabul edilir. 4 ve 5 sunucuya hiç gönderilmez ve gönderilirse **400** döner.
- `message` en fazla **1000** karakter, kırpıldıktan sonra boş olamaz.
- Cihaz başına **24 saatte 3** geri bildirim; aşımda **429**.
- `info_google_review_url` boş dize veya `https://` ile başlayan bir URL olabilir; başka hiçbir şema kabul edilmez.
- Playwright yapılandırması `workers: 1` ile seri koşar ve testler paylaşılan bir in-memory veritabanına vurur — **her E2E testi değiştirdiği ayarı geri almalıdır**.
- Komutlar: `npm run test:server`, `npm run test:e2e`, `npm run lint`.

## Dosya Yapısı

**Oluşturulacak:**
| Dosya | Sorumluluk |
|---|---|
| `server/test/feedback.test.js` | Geri bildirim şeması, uç nokta doğrulaması, hız sınırı, panel uçları |
| `src/components/RatingPrompt.jsx` | Yıldız durum makinesi: yıldız → (4–5) Maps / (1–3) form → teşekkür |
| `src/components/RatingStrip.jsx` | `RatingPrompt`'u saran, alttan kayan tek seferlik şerit |
| `src/components/admin/FeedbackView.jsx` | Panelde geri bildirim listesi, okundu, sil |
| `e2e/rating.spec.js` | Uçtan uca iki dal + şeridin tek seferliği |

**Değiştirilecek:**
| Dosya | Değişiklik |
|---|---|
| `server/db.js` | `feedback` tablosu, `canSubmitFeedback`, `insertFeedback` |
| `server/routes/menu.js` | `POST /feedback`, `publicMeta`'ya `google_review_url` |
| `server/routes/admin.js` | `info_google_review_url` ayarı + doğrulama, `GET/PATCH/DELETE /feedback` |
| `src/data/ui.js` | Dört dilde yıldız/form metinleri |
| `src/pages/MenuPage.jsx` | Footer bloğu, şerit, `rated` durumu |
| `src/components/admin/InfoPanel.jsx` | Google yorum bağlantısı alanı |
| `src/components/admin/AdminNav.jsx` | "Yorumlar" sekmesi + okunmamış rozeti |
| `src/components/admin/AdminShell.jsx` | Rozet sayısının `AdminNav`'a geçirilmesi |
| `src/pages/admin/DashboardPage.jsx` | `feedback` görünümü + okunmamış sayacı |

---

### Task 1: Veritabanı şeması ve yardımcılar

**Files:**
- Modify: `server/db.js`
- Test: `server/test/feedback.test.js` (yeni)

**Interfaces:**
- Consumes: `openDb(path)` — mevcut.
- Produces:
  - `canSubmitFeedback(db, deviceId) -> boolean` — son 24 saatte 3'ten az kayıt varsa `true`.
  - `insertFeedback(db, { rating, message, lang, deviceId }) -> number` (eklenen satırın `id`'si).

- [ ] **Step 1: Write the failing test**

`server/test/feedback.test.js` dosyasını oluştur:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, canSubmitFeedback, insertFeedback } from '../db.js';

const cihaz = (etiket) => `${etiket}-${Math.random()}`;

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/feedback.test.js`
Expected: FAIL — `canSubmitFeedback is not a function` (ve şema testi `feedback` tablosunu bulamaz).

- [ ] **Step 3: Add the table to the schema**

`server/db.js` içinde `openDb`'nin `db.exec(...)` bloğunda, `CREATE TABLE IF NOT EXISTS product_views` tanımından sonra ekle:

```sql
    -- Site içinde kalan geri bildirim. YALNIZ 1-3 yıldız buraya yazılır:
    -- 4-5 yıldız Google Maps'e gider ve bizde kaydı olmaz. Sözleşmenin bu
    -- şekilde daraltılması tablonun anlamını tek tutar.
    --
    -- device_id bir tabloya foreign key ile bağlanmaz: cihaz kimliği kalıcı
    -- bir varlık değil, yalnızca hız sınırı anahtarıdır.
    CREATE TABLE IF NOT EXISTS feedback (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      rating     INTEGER NOT NULL,
      message    TEXT NOT NULL,
      lang       TEXT NOT NULL DEFAULT 'tr',
      device_id  TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_read    INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
```

- [ ] **Step 4: Add the helpers**

`server/db.js` sonuna, `setSetting` tanımından sonra ekle:

```js
const FEEDBACK_WINDOW_MS = 24 * 60 * 60 * 1000;
const FEEDBACK_MAX_PER_DEVICE = 3;

// menu_views'taki pencere mantığının aynısı, tek farkla: eski satırlar
// SİLİNMEZ. Sayaç tablolarında satır bir tekrarsızlık işaretidir, burada
// misafirin yazdığı metnin kendisidir; pencere sorguyla hesaplanır.
export function canSubmitFeedback(db, deviceId) {
  const { c } = db
    .prepare('SELECT COUNT(*) c FROM feedback WHERE device_id = ? AND created_at >= ?')
    .get(deviceId, Date.now() - FEEDBACK_WINDOW_MS);
  return c < FEEDBACK_MAX_PER_DEVICE;
}

export function insertFeedback(db, { rating, message, lang, deviceId }) {
  const info = db
    .prepare(
      `INSERT INTO feedback (rating, message, lang, device_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(rating, message, lang, deviceId, Date.now());
  return Number(info.lastInsertRowid);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test server/test/feedback.test.js`
Expected: 4 test PASS.

- [ ] **Step 6: Run the full server suite to check for regressions**

Run: `npm run test:server`
Expected: hepsi PASS. (`db.test.js` şema listesini kontrol ediyorsa yeni tablo onu bozmamalı; bozarsa o testin beklentisine `feedback` eklenir.)

- [ ] **Step 7: Commit**

```bash
git add server/db.js server/test/feedback.test.js
git commit -m "feat(server): geri bildirim tablosu ve cihaz basina gonderim siniri"
```

---

### Task 2: `POST /api/menu/feedback` uç noktası

**Files:**
- Modify: `server/routes/menu.js`
- Test: `server/test/feedback.test.js`

**Interfaces:**
- Consumes: `canSubmitFeedback`, `insertFeedback` (Task 1).
- Produces: `POST /api/menu/feedback`, gövde `{ id, rating, message, lang }`, yanıt `{ ok: true }` veya `{ ok: false, error: 'device' | 'rating' | 'message' | 'limit' }`.

- [ ] **Step 1: Write the failing test**

`server/test/feedback.test.js` dosyasının **başına** sunucu kurulumunu ekle (mevcut `import`ların hemen altına):

```js
import { before, after } from 'node:test';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

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
```

Not: `import { test } from 'node:test';` satırını `import { test, before, after } from 'node:test';` olacak şekilde birleştir, çift import bırakma.

Dosyanın sonuna testleri ekle:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test server/test/feedback.test.js`
Expected: yeni testler FAIL — uç nokta yok, Express 404 döndürür (`status 404 !== 200`).

- [ ] **Step 3: Implement the endpoint**

`server/routes/menu.js` içinde import satırını genişlet:

```js
import { getSetting, countMenuView, countProductView, canSubmitFeedback, insertFeedback } from '../db.js';
```

Dosyanın üst kısmına, `cleanText` tanımının altına ekle:

```js
const FEEDBACK_LANGS = new Set(['tr', 'en', 'ar', 'ru']);
const FEEDBACK_MAX_LEN = 1000;
```

`createMenuRouter` içinde, `/product-view` route'undan sonra ekle:

```js
  // Site içinde kalan geri bildirim. Yalnız 1-3 yıldız: 4-5 yıldız istemcide
  // doğrudan Google Maps'e gider ve buraya hiç uğramaz. Aksi bir istek gelirse
  // 400'dür — tablonun "düşük puan" anlamı böyle korunur.
  router.post('/feedback', (req, res) => {
    const b = req.body ?? {};

    const deviceId = typeof b.id === 'string' ? b.id.trim().slice(0, 64) : '';
    if (!deviceId) return res.status(400).json({ ok: false, error: 'device' });

    if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 3) {
      return res.status(400).json({ ok: false, error: 'rating' });
    }

    const message = typeof b.message === 'string' ? b.message.trim() : '';
    if (!message || message.length > FEEDBACK_MAX_LEN) {
      return res.status(400).json({ ok: false, error: 'message' });
    }

    // Dil yalnızca panelde okumayı kolaylaştırır; tanınmayan değer hata değil,
    // varsayılana düşer. Misafirin yazdığı metin bir dil kodu yüzünden kaybolmaz.
    const lang = FEEDBACK_LANGS.has(b.lang) ? b.lang : 'tr';

    if (!canSubmitFeedback(db, deviceId)) {
      return res.status(429).json({ ok: false, error: 'limit' });
    }

    insertFeedback(db, { rating: b.rating, message, lang, deviceId });
    res.json({ ok: true });
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test server/test/feedback.test.js`
Expected: hepsi PASS.

- [ ] **Step 5: Commit**

```bash
git add server/routes/menu.js server/test/feedback.test.js
git commit -m "feat(api): dusuk puanli geri bildirim ucu"
```

---

### Task 3: `info_google_review_url` ayarı

**Files:**
- Modify: `server/routes/menu.js` (`publicMeta`)
- Modify: `server/routes/admin.js` (`settingsPayload`, `PUT /settings`)
- Test: `server/test/feedback.test.js`

**Interfaces:**
- Produces:
  - `GET /api/menu/` → `meta.info.google_review_url` (string, varsayılan `''`).
  - `GET/PUT /api/admin/settings` → `info_google_review_url` alanı.

- [ ] **Step 1: Write the failing test**

`server/test/feedback.test.js` sonuna ekle:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test server/test/feedback.test.js`
Expected: FAIL — `google_review_url` `undefined`, `javascript:` değeri 200 ile kaydediliyor.

- [ ] **Step 3: Expose the setting on the public menu**

`server/routes/menu.js` içinde `publicMeta`'nın `info` nesnesine ekle:

```js
      instagram: getSetting(db, 'info_instagram', '') || '',
      google_review_url: getSetting(db, 'info_google_review_url', '') || '',
```

- [ ] **Step 4: Add the setting to the admin router**

`server/routes/admin.js` içinde `TEXT_SETTINGS`'in **hemen altına** ekle (listeye ekleme — ayrı doğrulaması var):

```js
  // Serbest metin değil: menüde bir bağlantıya dönüştüğü için şeması
  // doğrulanır. TEXT_SETTINGS'e konsaydı genel döngü onu doğrulamadan yazardı.
  const REVIEW_URL_RE = /^https:\/\/[^\s]+$/i;
```

`settingsPayload` içine ekle:

```js
    out.info_google_review_url = getSetting(db, 'info_google_review_url', '') || '';
```

`PUT /settings` içinde, `public_base_url` bloğundan sonra, genel `TEXT_SETTINGS` döngüsünden **önce** ekle:

```js
    if ('info_google_review_url' in b) {
      const url = String(b.info_google_review_url ?? '').trim();
      if (url && !REVIEW_URL_RE.test(url)) {
        return res.status(400).json({ error: 'Google yorum bağlantısı https:// ile başlamalı' });
      }
      setSetting(db, 'info_google_review_url', url);
      changed.push('bilgi: google yorum bağlantısı');
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test server/test/feedback.test.js`
Expected: hepsi PASS.

- [ ] **Step 6: Run the full server suite**

Run: `npm run test:server`
Expected: hepsi PASS. `qr-settings.test.js` ayar yükünün alan listesini kontrol ediyorsa yeni alanı beklentisine ekle.

- [ ] **Step 7: Commit**

```bash
git add server/routes/menu.js server/routes/admin.js server/test/feedback.test.js
git commit -m "feat(api): google yorum baglantisi ayari ve sema dogrulamasi"
```

---

### Task 4: Panel geri bildirim uçları

**Files:**
- Modify: `server/routes/admin.js`
- Test: `server/test/feedback.test.js`

**Interfaces:**
- Produces:
  - `GET /api/admin/feedback?from=YYYY-MM-DD&to=YYYY-MM-DD` → `{ items: [{ id, rating, message, lang, created_at, is_read }], unread: number }`. Parametresiz çağrı son 30 günü verir. `device_id` **döndürülmez**.
  - `PATCH /api/admin/feedback/:id/read` gövde `{ is_read: boolean }` → `{ ok: true }` | 404.
  - `DELETE /api/admin/feedback/:id` → 204 | 404.

- [ ] **Step 1: Write the failing test**

`server/test/feedback.test.js` sonuna ekle:

```js
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

  const gun = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test server/test/feedback.test.js`
Expected: FAIL — uçlar yok; 401 testi bile geçmez çünkü rota tanımsız (404 döner).

- [ ] **Step 3: Implement the admin endpoints**

`server/routes/admin.js` içinde, ayarlar bölümünden sonra ekle:

```js
  // ---- Geri bildirim (yalnız düşük puanlı, site içinde kalan) ----
  const GUN_MS = 24 * 60 * 60 * 1000;

  // 'YYYY-MM-DD' -> yerel gün başı / gün sonu. Geçersizse null döner ve
  // varsayılan aralık kullanılır; bozuk parametre listeyi boşaltmaz.
  function gunBasi(deger) {
    if (typeof deger !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deger)) return null;
    const t = new Date(`${deger}T00:00:00`).getTime();
    return Number.isNaN(t) ? null : t;
  }

  router.get('/feedback', (req, res) => {
    const simdi = Date.now();
    const from = gunBasi(req.query.from) ?? simdi - 30 * GUN_MS;
    const toBasi = gunBasi(req.query.to);
    const to = toBasi == null ? simdi : toBasi + GUN_MS - 1;

    // device_id bilerek seçilmez: panelde hiçbir işe yaramaz, yalnız hız
    // sınırı anahtarıdır. Gönderilmeyen veri sızdırılamaz.
    const items = db
      .prepare(
        `SELECT id, rating, message, lang, created_at, is_read FROM feedback
         WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC`
      )
      .all(from, to);
    const unread = db.prepare('SELECT COUNT(*) c FROM feedback WHERE is_read = 0').get().c;
    res.json({ items, unread });
  });

  // Okundu işaretlemesi denetim kaydına yazılmaz: her açılışta tetiklenen
  // rutin bir işlem, audit_log'u gürültüyle doldururdu.
  router.patch('/feedback/:id/read', (req, res) => {
    const isRead = req.body?.is_read === false ? 0 : 1;
    const info = db.prepare('UPDATE feedback SET is_read = ? WHERE id = ?').run(isRead, Number(req.params.id));
    if (!info.changes) return res.status(404).json({ error: 'Geri bildirim bulunamadı' });
    res.json({ ok: true });
  });

  router.delete('/feedback/:id', (req, res) => {
    const id = Number(req.params.id);
    const info = db.prepare('DELETE FROM feedback WHERE id = ?').run(id);
    if (!info.changes) return res.status(404).json({ error: 'Geri bildirim bulunamadı' });
    log('delete', 'feedback', String(id), 'geri bildirim silindi');
    res.status(204).end();
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test server/test/feedback.test.js`
Expected: hepsi PASS.

- [ ] **Step 5: Run the full server suite and lint**

Run: `npm run test:server && npm run lint`
Expected: hepsi PASS, lint temiz.

- [ ] **Step 6: Commit**

```bash
git add server/routes/admin.js server/test/feedback.test.js
git commit -m "feat(api): panel geri bildirim listeleme, okundu ve silme uclari"
```

---

### Task 5: Menü metinleri (dört dil)

**Files:**
- Modify: `src/data/ui.js`

**Interfaces:**
- Produces: `UI[lang]` üzerinde yeni anahtarlar — `rateTitle`, `rateFormLabel`, `ratePlaceholder`, `rateSend`, `rateSending`, `rateThanks`, `rateError`, `rateStarLabel`. `rateStarLabel` içindeki `{n}` yıldız sayısıyla değiştirilir.

- [ ] **Step 1: Add the strings to all four languages**

`src/data/ui.js` içinde her dil nesnesine, `dishImage` satırından sonra ekle. **Dört dile de eklenmelidir** — eksik dil menüde `undefined` gösterir.

`tr`:
```js
    rateTitle: 'Deneyiminiz nasıldı?',
    rateFormLabel: 'Neyi daha iyi yapabiliriz?',
    ratePlaceholder: 'Görüşünüzü yazın…',
    rateSend: 'Gönder', rateSending: 'Gönderiliyor…',
    rateThanks: 'Teşekkür ederiz!',
    rateError: 'Gönderilemedi. Lütfen tekrar deneyin.',
    rateStarLabel: '{n} yıldız',
```

`en`:
```js
    rateTitle: 'How was your experience?',
    rateFormLabel: 'What could we do better?',
    ratePlaceholder: 'Write your feedback…',
    rateSend: 'Send', rateSending: 'Sending…',
    rateThanks: 'Thank you!',
    rateError: 'Could not send. Please try again.',
    rateStarLabel: '{n} stars',
```

`ar`:
```js
    rateTitle: 'كيف كانت تجربتك؟',
    rateFormLabel: 'ما الذي يمكننا تحسينه؟',
    ratePlaceholder: 'اكتب رأيك…',
    rateSend: 'إرسال', rateSending: 'جارٍ الإرسال…',
    rateThanks: 'شكراً لك!',
    rateError: 'تعذّر الإرسال. حاول مرة أخرى.',
    rateStarLabel: '{n} نجوم',
```

`ru`:
```js
    rateTitle: 'Как вам у нас?',
    rateFormLabel: 'Что мы можем улучшить?',
    ratePlaceholder: 'Напишите ваш отзыв…',
    rateSend: 'Отправить', rateSending: 'Отправка…',
    rateThanks: 'Спасибо!',
    rateError: 'Не удалось отправить. Попробуйте ещё раз.',
    rateStarLabel: '{n} звёзд',
```

- [ ] **Step 2: Verify every language has every key**

Run:
```bash
node -e "import('./src/data/ui.js').then(({UI})=>{const k=['rateTitle','rateFormLabel','ratePlaceholder','rateSend','rateSending','rateThanks','rateError','rateStarLabel'];for(const l of ['tr','en','ar','ru'])for(const key of k)if(!UI[l][key])throw new Error(l+'.'+key+' eksik');console.log('ok');})"
```
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add src/data/ui.js
git commit -m "feat(menu): yildiz degerlendirme metinleri dort dilde"
```

---

### Task 6: `RatingPrompt` bileşeni

**Files:**
- Create: `src/components/RatingPrompt.jsx`

**Interfaces:**
- Consumes: `UI` anahtarları (Task 5), `POST /api/menu/feedback` (Task 2), `api` (`src/lib/api.js`), `getDeviceId` (`src/lib/deviceId.js`).
- Produces: `<RatingPrompt ui lang reviewUrl done onDone />` varsayılan dışa aktarım.
  - `reviewUrl: string` — boş dizeyse bileşen `null` döner.
  - `done: boolean` — dışarıdan gelen "puan verildi" durumu; `true` ise teşekkür gösterilir.
  - `onDone: () => void` — puan verildiğinde bir kez çağrılır.

- [ ] **Step 1: Write the component**

`src/components/RatingPrompt.jsx` oluştur. **Yorum satırı yazma** (proje kuralı):

```jsx
import { useState } from 'react';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/deviceId';

const STARS = [1, 2, 3, 4, 5];
const IS_STATIC = import.meta.env.VITE_STATIC === '1';
const MAX_LEN = 1000;

function Star({ filled, label, onClick, onHover }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onHover}
      className="bg-transparent border-none cursor-pointer p-1 leading-none"
      style={{ color: filled ? 'var(--accent-text)' : 'var(--muted2)' }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.4 L14.6 9 L20.6 9.7 L16.2 13.9 L17.4 19.9 L12 16.9 L6.6 19.9 L7.8 13.9 L3.4 9.7 L9.4 9 Z"
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function RatingPrompt({ ui, lang, reviewUrl, done, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  if (!reviewUrl) return null;

  if (done) {
    return (
      <div className="yg-rating" data-state="done">
        <span className="yg-rating__thanks">{ui.rateThanks}</span>
      </div>
    );
  }

  const pick = (value) => {
    setRating(value);
    if (value >= 4) {
      window.open(reviewUrl, '_blank', 'noopener');
      onDone();
      return;
    }
    setState('form');
  };

  const submit = async () => {
    const text = message.trim();
    if (!text || state === 'sending') return;
    setState('sending');
    setError('');
    try {
      if (!IS_STATIC) {
        await api.post('/menu/feedback', { id: getDeviceId(), rating, message: text, lang });
      }
      onDone();
    } catch (e) {
      if (e.message === 'limit') {
        onDone();
        return;
      }
      setError(ui.rateError);
      setState('form');
    }
  };

  return (
    <div className="yg-rating" data-state={state}>
      <span className="yg-rating__title">{ui.rateTitle}</span>

      <div className="yg-rating__stars" role="group" aria-label={ui.rateTitle} onMouseLeave={() => setHover(0)}>
        {STARS.map((n) => (
          <Star
            key={n}
            filled={n <= (hover || rating)}
            label={ui.rateStarLabel.replace('{n}', n)}
            onClick={() => pick(n)}
            onHover={() => setHover(n)}
          />
        ))}
      </div>

      {state !== 'idle' && (
        <div className="yg-rating__form">
          <label className="yg-rating__label" htmlFor="yg-rating-message">{ui.rateFormLabel}</label>
          <textarea
            id="yg-rating-message"
            rows={3}
            maxLength={MAX_LEN}
            value={message}
            placeholder={ui.ratePlaceholder}
            onChange={(e) => setMessage(e.target.value)}
            className="yg-rating__input"
          />
          {error && <span className="yg-rating__error">{error}</span>}
          <button
            type="button"
            onClick={submit}
            disabled={!message.trim() || state === 'sending'}
            className="yg-rating__send"
          >
            {state === 'sending' ? ui.rateSending : ui.rateSend}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the styles**

`src/index.css` içine, diğer `yg-menu-*` kurallarının yanına ekle. **`@media` bloklarını temel kuraldan SONRA yaz** — `@media` özgüllük katmaz, önce yazılırsa temel kural onu ezer:

```css
.yg-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  border: 1px solid var(--ann-border);
  border-radius: 18px;
  background: var(--ann-bg);
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
}
.yg-rating__title { font-size: 15.5px; font-weight: 600; color: var(--text); }
.yg-rating__thanks { font-size: 15.5px; font-weight: 600; color: var(--accent-text); }
.yg-rating__stars { display: flex; gap: 2px; }
.yg-rating__form { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.yg-rating__label { font-size: 13px; color: var(--muted); }
.yg-rating__input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--ann-border);
  background: var(--card, #fff);
  color: var(--text);
  font: inherit;
  font-size: 14.5px;
  resize: vertical;
}
.yg-rating__error { font-size: 13px; color: #ef6b6b; }
.yg-rating__send {
  align-self: center;
  min-height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: var(--accent-text);
  color: var(--bg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.yg-rating__send:disabled { opacity: 0.5; cursor: default; }
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: lint temiz, build başarılı.

- [ ] **Step 4: Commit**

```bash
git add src/components/RatingPrompt.jsx src/index.css
git commit -m "feat(menu): yildiz degerlendirme bileseni"
```

---

### Task 7: `RatingStrip` bileşeni

**Files:**
- Create: `src/components/RatingStrip.jsx`

**Interfaces:**
- Consumes: `RatingPrompt` (Task 6), `readStorage`/`writeStorage` (`src/lib/storage.js`).
- Produces: `<RatingStrip ui lang reviewUrl done onDone hidden />` varsayılan dışa aktarım. `hidden: boolean` — ürün detayı açıkken şerit çizilmez.

- [ ] **Step 1: Write the component**

`src/components/RatingStrip.jsx` oluştur (yorumsuz):

```jsx
import { useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import RatingPrompt from './RatingPrompt';

const DELAY_MS = 60000;
const SCROLL_RATIO = 0.4;

export default function RatingStrip({ ui, lang, reviewUrl, done, onDone, hidden }) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!reviewUrl || done || readStorage('rating_strip_seen', false)) return undefined;

    let elapsed = false;
    let scrolled = false;
    const show = () => {
      if (!elapsed || !scrolled) return;
      writeStorage('rating_strip_seen', true);
      setVisible(true);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_RATIO) {
        scrolled = true;
        show();
      }
    };
    const timer = setTimeout(() => {
      elapsed = true;
      show();
    }, DELAY_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reviewUrl, done]);

  if (!visible || closed || hidden) return null;

  return (
    <div className="yg-rating-strip" role="region" aria-label={ui.rateTitle}>
      <button type="button" className="yg-rating-strip__close" aria-label={ui.close} onClick={() => setClosed(true)}>
        ×
      </button>
      <RatingPrompt ui={ui} lang={lang} reviewUrl={reviewUrl} done={done} onDone={onDone} />
    </div>
  );
}
```

- [ ] **Step 2: Add the styles**

`src/index.css` içine, `.yg-rating` kurallarından sonra ekle:

```css
.yg-rating-strip {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 40;
  padding: 12px 14px calc(14px + env(safe-area-inset-bottom));
  background: var(--bg);
  border-top: 1px solid var(--ann-border);
  box-shadow: 0 -6px 24px rgba(10, 31, 53, 0.18);
}
.yg-rating-strip__close {
  position: absolute;
  inset-inline-end: 10px;
  top: 6px;
  min-width: 36px;
  min-height: 36px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: temiz.

- [ ] **Step 4: Commit**

```bash
git add src/components/RatingStrip.jsx src/index.css
git commit -m "feat(menu): tek seferlik yildiz seridi"
```

---

### Task 8: `MenuPage` entegrasyonu ve E2E doğrulaması

**Files:**
- Modify: `src/pages/MenuPage.jsx`
- Create: `e2e/rating.spec.js`

**Interfaces:**
- Consumes: `RatingPrompt` (Task 6), `RatingStrip` (Task 7), `meta.info.google_review_url` (Task 3).
- Produces: menüde `.yg-rating` bloğu — footer'da kalıcı, şeritte tek seferlik. "Puan verildi" durumunun **tek kaynağı** `MenuPage`'deki `rated` state'idir.

- [ ] **Step 1: Wire the components into MenuPage**

`src/pages/MenuPage.jsx` importlarına ekle:

```jsx
import RatingPrompt from '../components/RatingPrompt';
import RatingStrip from '../components/RatingStrip';
```

Diğer `useState` çağrılarının yanına ekle:

```jsx
  const [rated, setRated] = useState(() => readStorage('rating_done', false));
```

`clearAll` tanımının yanına ekle:

```jsx
  const markRated = useCallback(() => {
    writeStorage('rating_done', true);
    setRated(true);
  }, []);
```

`instagram` değişkeninin yanına ekle:

```jsx
  const reviewUrl = (meta.info.google_review_url || '').trim();
```

Footer içinde, `<span className="font-outfit text-[21px] font-semibold">Yedigül</span>` satırının **üstüne** ekle:

```jsx
          <RatingPrompt ui={ui} lang={lang} reviewUrl={reviewUrl} done={rated} onDone={markRated} />
```

`<ScrollTopButton label={ui.toTop} />` satırının üstüne ekle:

```jsx
      <RatingStrip
        ui={ui}
        lang={lang}
        reviewUrl={reviewUrl}
        done={rated}
        onDone={markRated}
        hidden={!!selectedId}
      />
```

Tek kaynak kuralı: iki bileşen de `rated`/`markRated` alır. Kendi başlarına `localStorage` okumazlar — `RatingStrip` yalnızca kendi "gösterildi mi" bayrağını (`rating_strip_seen`) okur, "puan verildi mi" bilgisini okumaz.

- [ ] **Step 2: Write the E2E test**

`e2e/rating.spec.js` oluştur:

```js
import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const REVIEW_URL = 'https://example.com/yedigul-review';

async function token(request) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { password: 'e2e-test-parolasi' },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

const setReviewUrl = (request, auth, url) =>
  request.put(`${API}/api/admin/settings`, { headers: auth, data: { info_google_review_url: url } });

const panelListe = async (request, auth) =>
  (await request.get(`${API}/api/admin/feedback`, { headers: auth })).json();

// Testler paylaşılan in-memory veritabanına vurar (workers: 1).
// Her test değiştirdiği ayarı geri alır.
test.afterEach(async ({ request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, '');
});

test('bağlantı boşken yıldız bloğu hiç çizilmez', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, '');

  await page.goto('/menu/');
  await expect(page.getByRole('heading', { name: 'Yedigül', level: 1 })).toBeVisible();
  await expect(page.locator('.yg-rating')).toHaveCount(0);
});

test('5 yıldız Google bağlantısını yeni sekmede açar ve sunucuya kayıt bırakmaz', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);
  const once = (await panelListe(request, auth)).items.length;

  await page.goto('/menu/');
  const blok = page.locator('.yg-rating').first();
  await blok.scrollIntoViewIfNeeded();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    blok.getByRole('button', { name: '5 yıldız' }).click(),
  ]);
  expect(popup.url()).toContain('yedigul-review');
  await popup.close();

  await expect(blok).toContainText('Teşekkür ederiz!');
  await page.waitForTimeout(300);
  expect((await panelListe(request, auth)).items.length).toBe(once);
});

test('2 yıldız site içi form açar, gönderilen yorum panele düşer', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);
  const mesaj = `e2e yorumu ${Date.now()}`;

  await page.goto('/menu/');
  const blok = page.locator('.yg-rating').first();
  await blok.scrollIntoViewIfNeeded();
  await blok.getByRole('button', { name: '2 yıldız' }).click();

  const alan = blok.getByRole('textbox');
  await expect(alan).toBeVisible();
  await alan.fill(mesaj);
  await blok.getByRole('button', { name: 'Gönder' }).click();

  await expect(blok).toContainText('Teşekkür ederiz!');

  await expect
    .poll(async () => (await panelListe(request, auth)).items.some((r) => r.message === mesaj))
    .toBe(true);

  const kayit = (await panelListe(request, auth)).items.find((r) => r.message === mesaj);
  expect(kayit.rating).toBe(2);
});

test('puan verildikten sonra sayfa yenilenince tekrar sorulmaz', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);

  await page.goto('/menu/');
  const blok = page.locator('.yg-rating').first();
  await blok.scrollIntoViewIfNeeded();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    blok.getByRole('button', { name: '4 yıldız' }).click(),
  ]);
  await popup.close();

  await page.reload();
  await expect(page.locator('.yg-rating').first()).toContainText('Teşekkür ederiz!');
  await expect(page.locator('.yg-rating').first().getByRole('button', { name: '4 yıldız' })).toHaveCount(0);
});
```

- [ ] **Step 3: Run the E2E suite**

Run: `npm run test:e2e -- rating.spec.js`
Expected: dört test, iki projede de (iPhone + masaüstü) PASS.

Not: CSS değişikliğinden şüphelenirsen HMR'a güvenme — Vite'ta bir kural stylesheet'te görünüp uygulanmayabilir. Tam sayfa yenilemesiyle doğrula.

- [ ] **Step 4: Run the whole E2E suite for regressions**

Run: `npm run test:e2e`
Expected: mevcut `fix-menu`, `menu-i18n`, `product-views` testleri de PASS. Yeni şerit `fixed` konumludur; başka testlerin tıkladığı bir öğeyi örtüyorsa `hidden` koşulunu gözden geçir.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/pages/MenuPage.jsx e2e/rating.spec.js
git commit -m "feat(menu): yildiz blogunu menuye bagla ve uctan uca dogrula"
```

---

### Task 9: Panelde Google bağlantısı alanı

**Files:**
- Modify: `src/components/admin/InfoPanel.jsx`

**Interfaces:**
- Consumes: `GET/PUT /api/admin/settings` → `info_google_review_url` (Task 3).

- [ ] **Step 1: Add state, load and save**

`src/components/admin/InfoPanel.jsx` içinde `const [sInsta, setSInsta] = useState('');` satırının altına ekle:

```jsx
  const [sReview, setSReview] = useState('');
```

`useEffect` içindeki yükleme bloğunda `setSInsta(s.info_instagram || '');` satırının altına ekle:

```jsx
        setSReview(s.info_google_review_url || '');
```

`saveInfo` içindeki `api.put` gövdesine ekle:

```jsx
        info_google_review_url: sReview.trim(),
```

ve yanıt geri yazımına ekle:

```jsx
      setSReview(res.info_google_review_url || '');
```

- [ ] **Step 2: Add the field to the form**

"İşletme Bilgileri" kartında, `Instagram` alanının bulunduğu `grid`'in **altına** (grid'in dışına, kapanış `</div>`'inden sonra) ekle:

```jsx
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Google Yorum Bağlantısı</span>
          <input
            style={inputStyle}
            placeholder="https://g.page/r/.../review"
            value={sReview}
            onChange={(e) => setSReview(e.target.value)}
          />
          <span style={smallHintStyle}>
            Google İşletme Profili → “Yorum iste” bağlantısını buraya yapıştırın.
            Boş bırakılırsa menüdeki yıldız değerlendirme bloğu hiç görünmez.
            Bağlantı https:// ile başlamalıdır.
          </span>
        </label>
```

Alan `grid` içine değil dışına konur: yardım metni iki sütunlu ızgarada sıkışır ve okunmaz olur.

- [ ] **Step 3: Verify manually**

Run: `npm run panel`
Tarayıcıda `http://localhost:3001/menu/admin` → Ayarlar. Doğrula:
1. Alan boş geliyor, `https://g.page/r/test/review` yazıp "Bilgileri Kaydet" → "Bilgiler kaydedildi".
2. Sayfayı yenile → değer duruyor.
3. `javascript:alert(1)` yazıp kaydet → kırmızı hata mesajı çıkıyor, değer değişmiyor.
4. Alanı boşaltıp kaydet → `/menu/` sayfasında yıldız bloğu kayboluyor.

- [ ] **Step 4: Lint and commit**

```bash
npm run lint
git add src/components/admin/InfoPanel.jsx
git commit -m "feat(panel): google yorum baglantisi alani"
```

---

### Task 10: Panelde geri bildirim görünümü

**Files:**
- Create: `src/components/admin/FeedbackView.jsx`
- Modify: `src/components/admin/AdminNav.jsx`
- Modify: `src/components/admin/AdminShell.jsx`
- Modify: `src/pages/admin/DashboardPage.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/feedback?from&to`, `PATCH /api/admin/feedback/:id/read`, `DELETE /api/admin/feedback/:id` (Task 4).
- Produces:
  - `<FeedbackView onError={(msg) => void} onUnread={(n) => void} />` varsayılan dışa aktarım. `onUnread` her yüklemeden sonra okunmamış sayısıyla çağrılır.
  - `AdminNav`: yeni `unread` prop'u (number); `feedback` kimlikli sekme.
  - `AdminShell`: yeni `unread` prop'u, doğrudan `AdminNav`'a geçer.

- [ ] **Step 1: Write the view component**

`src/components/admin/FeedbackView.jsx` oluştur (panel bileşenleri de yorumsuz yazılır):

```jsx
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const btnStyle = {
  height: 36,
  padding: '0 14px',
  border: '1px solid rgba(22,41,61,0.22)',
  borderRadius: 999,
  background: 'transparent',
  color: 'var(--text)',
  fontSize: 13,
  cursor: 'pointer',
};

const dateStyle = {
  height: 40,
  padding: '0 10px',
  background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)',
  borderRadius: 10,
  color: 'var(--text)',
  fontSize: 14,
};

const tarih = (ms) =>
  new Date(ms).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const yildiz = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const bugun = () => new Date().toISOString().slice(0, 10);
const gunOnce = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export default function FeedbackView({ onError, onUnread }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [from, setFrom] = useState(() => gunOnce(30));
  const [to, setTo] = useState(bugun);

  const reload = useCallback(async () => {
    try {
      const data = await api.get(`/admin/feedback?from=${from}&to=${to}`);
      setItems(data.items);
      onUnread(data.unread);
      setLoaded(true);
    } catch (e) {
      onError(e.message);
    }
  }, [from, to, onError, onUnread]);

  useEffect(() => { reload(); }, [reload]);

  async function toggleRead(item) {
    try {
      await api.patch(`/admin/feedback/${item.id}/read`, { is_read: !item.is_read });
      await reload();
    } catch (e) {
      onError(e.message);
    }
  }

  async function remove(item) {
    if (!window.confirm('Bu geri bildirim silinsin mi?')) return;
    try {
      await api.del(`/admin/feedback/${item.id}`);
      await reload();
    } catch (e) {
      onError(e.message);
    }
  }

  const filtre = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>Başlangıç</span>
        <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={dateStyle} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>Bitiş</span>
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={dateStyle} />
      </label>
    </div>
  );

  if (!loaded) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Yükleniyor…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
      {filtre}

      {!items.length && (
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Seçili aralıkta geri bildirim yok. Menüde 4 yıldızın altında puan veren misafirlerin
          yazdıkları burada birikir.
        </p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            ...cardStyle,
            borderInlineStart: `3px solid ${item.is_read ? 'transparent' : 'var(--gold)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--gold)', fontSize: 16, letterSpacing: 2 }}>{yildiz(item.rating)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{tarih(item.created_at)}</span>
            <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>
              {item.lang}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.message}</p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btnStyle} onClick={() => toggleRead(item)}>
              {item.is_read ? 'Okunmadı yap' : 'Okundu'}
            </button>
            <button type="button" style={{ ...btnStyle, color: '#ef6b6b' }} onClick={() => remove(item)}>
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add the nav entry and the unread badge**

`src/components/admin/AdminNav.jsx` içinde `NAVD`'ye ekle:

```js
  feedback: 'M20 4 H4 V16 H8 L12 20 L12 16 H20 Z M8 8.6 H16 M8 12 H13.5',
```

`NAV_ITEMS`'a, `settings` girdisinden **önce** ekle. Etiket `Yorumlar` — "Geri Bildirim" değil: alt gezinme mobilde 5 sekmeden 6'ya çıkıyor, 390px genişlikte sekme başına ~65px kalıyor ve uzun etiket 10px punto ile taşıyor:

```js
  { id: 'feedback', label: 'Yorumlar', d: NAVD.feedback },
```

`NAVD` tanımlarının altına rozet bileşenini ekle:

```jsx
function Badge({ n }) {
  if (!n) return null;
  return (
    <span
      aria-label={`${n} okunmamış`}
      style={{
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 999,
        background: 'var(--gold)',
        color: '#081726',
        fontSize: 10.5,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}
```

`AdminNavSideItem` imzasını `{ item, active, onSelect, badge }` yap ve `<span>{item.label}</span>` satırının altına ekle:

```jsx
      <Badge n={badge} />
```

`AdminNav` imzasını `{ view, onSelect, variant, unread }` yap. Yan menü dalında:

```jsx
          <AdminNavSideItem key={it.id} item={it} active={view === it.id} onSelect={onSelect} badge={it.id === 'feedback' ? unread : 0} />
```

Alt menü dalında, ikonu saran `<svg>` ile `<span>` arasına ekle (ikonun sağ üstüne oturur):

```jsx
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
                <path d={it.d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {it.id === 'feedback' && (
                <span style={{ position: 'absolute', top: -4, insetInlineEnd: -8 }}>
                  <Badge n={unread} />
                </span>
              )}
            </span>
```

(mevcut tek başına duran `<svg>` bloğunun yerine geçer)

- [ ] **Step 3: Pass the count through AdminShell**

`src/components/admin/AdminShell.jsx` imzasını genişlet:

```jsx
export default function AdminShell({ view, onSelectView, onLogout, unread, children }) {
```

Her iki `AdminNav` çağrısına `unread={unread}` ekle:

```jsx
            <AdminNav view={view} onSelect={onSelectView} variant="bottom" unread={unread} />
```

```jsx
            <AdminNav view={view} onSelect={onSelectView} variant="side" unread={unread} />
```

- [ ] **Step 4: Wire the view into the dashboard**

`src/pages/admin/DashboardPage.jsx` importlarına ekle:

```jsx
import FeedbackView from '../../components/admin/FeedbackView';
```

`TITLES`'a ekle (başlıkta uzun ad kullanılır; kısa olan yalnız gezinme etiketidir):

```jsx
  feedback: ['Geri Bildirim', 'Menüde düşük puan veren misafirlerin yazdıkları'],
```

`toast` state'inin yanına ekle:

```jsx
  const [unread, setUnread] = useState(0);
```

`AdminShell` çağrısına `unread={unread}` ekle:

```jsx
    <AdminShell view={view} onSelectView={(v) => { setView(v); setEditing(null); }} onLogout={onLogout} unread={unread}>
```

Görünüm zincirine, `view === 'settings'` dalından **önce** ekle:

```jsx
      ) : view === 'feedback' ? (
        <FeedbackView onError={setError} onUnread={setUnread} />
```

`onUnread` olarak doğrudan `setUnread` geçilir. `useState` setter'ları kimliği sabit fonksiyonlardır; sarmalayıcı bir ok fonksiyonu yazılırsa `FeedbackView`'daki `reload` her render'da yeniden oluşur ve `useEffect` sonsuz döngüye girer.

Rozet yalnızca panel açıldıktan sonra Yorumlar sekmesine bir kez girilince dolar. Bu bilinçli: her panel açılışında ekstra bir istek atmamak için sayaç, listeyi zaten çeken görünümden beslenir.

- [ ] **Step 5: Verify manually**

Run: `npm run panel`

`http://localhost:3001/menu/admin` → "Yorumlar". Doğrula:
1. Kayıt yokken tarih süzgeci görünüyor ve altında boş durum metni çıkıyor.
2. `/menu/` sayfasından 2 yıldızla bir yorum gönder → panelde altın çizgili (okunmamış) kart olarak görünüyor, sekmede rozet "1" yazıyor.
3. "Okundu" → çizgi kayboluyor, rozet düşüyor; "Okunmadı yap" → geri geliyor.
4. "Sil" → onay çıkıyor, onaylayınca kart gidiyor.
5. Başlangıç tarihini yarına al → liste boşalıyor, hata çıkmıyor.
6. **Mobil genişlikte (DevTools, 390px):** alt gezinmede altı sekme de yan yana sığıyor, "Yorumlar" etiketi taşmıyor, rozet ikonun sağ üstünde kırpılmadan duruyor. Kartlar ve tarih girdileri yatay taşma yapmıyor.

- [ ] **Step 6: Run everything**

Run: `npm run lint && npm run test:server && npm run test:e2e`
Expected: hepsi PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/FeedbackView.jsx src/components/admin/AdminNav.jsx src/components/admin/AdminShell.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(panel): geri bildirim listesi, tarih suzgeci ve okunmamis rozeti"
```

---

## Uygulama sonrası açık iş

`info_google_review_url` değeri kullanıcıdan gelecek (Google İşletme Profili → "Yorum iste" bağlantısı). Gelene kadar alan boş kalır ve özellik canlıda **kapalıdır** — tüm testler ve geliştirme bundan bağımsız tamamlanır. Link geldiğinde panelden yapıştırmak yeterlidir; kod değişikliği veya yeni deploy gerekmez.
