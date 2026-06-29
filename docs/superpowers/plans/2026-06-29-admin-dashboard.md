# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yedigül QR menüsüne, fiyat/Piyasa Fiyatı düzenleme, görsel ekleme-kaldırma, aktif-pasif yapma ve ürün/kategori CRUD içeren, tek-şifre korumalı bir admin paneli eklemek.

**Architecture:** `server/` altında Node.js + Express + `better-sqlite3` API; mevcut React (Vite) frontend'i `react-router-dom` ile `/` (müşteri menüsü) ve `/admin` (panel) olarak ikiye ayırmak. Müşteri menüsü statik `src/data/menu.js` yerine `GET /api/menu`'den okur. Express test edilebilirlik için `createApp({ db, uploadsDir })` fabrikasıyla kurulur.

**Tech Stack:** Node.js (ESM), Express 5, better-sqlite3, multer, jsonwebtoken, cookie-parser, dotenv; React 19 + Vite + react-router-dom; testler `node:test` (backend) ve `@playwright/test` (e2e).

## Global Constraints

- **Sadece mobil/tablet** — admin paneli dahil tüm UI mobil/tablet boyutlarında (≥320px) doğrulanır; masaüstü stili yok.
- **i18n (TR/EN)** — kategori adı, ürün adı, açıklama ve "Piyasa Fiyatı / Market Price" rozeti her iki dilde tutulur.
- **Renk paleti** — Marin: lacivert `#1E3A8A`, altın vurgu `#C8902F`, beyaz/açık gri zemin. Yeni UI mevcut `--bg/--surface/--text/--gold` CSS değişkenlerini kullanır (bkz. `src/lib/theme.js`).
- **Piyasa Fiyatı** — ürünler hem sayısal `price` hem `is_market_price` boolean tutar; `is_market_price=1` iken müşteri tarafında para yerine "Piyasa Fiyatı/Market Price" gösterilir.
- **Masa parametresi** — `/masa/:id` ve `?masa=X` davranışı korunur.
- **ESM** — `package.json` `"type": "module"`; tüm yeni `.js` dosyaları ESM (`import`/`export`).
- **Tek admin şifresi** — `.env` içindeki `ADMIN_PASSWORD`; oturum httpOnly cookie'de JWT (`JWT_SECRET`).

---

## File Structure

**Backend (yeni):**
- `server/db.js` — `openDb(path)` (şema kurar) + `seed(db)` (menu.js'ten aktarır).
- `server/auth.js` — `createAuth({ secret, password })` → login/logout/me handler + `requireAuth` middleware.
- `server/routes/menu.js` — `createMenuRouter(db)` (public).
- `server/routes/admin.js` — `createAdminRouter({ db, uploadsDir })` (korumalı CRUD + görsel).
- `server/app.js` — `createApp({ db, uploadsDir, auth })` → express app.
- `server/index.js` — gerçek db açar, dinler.
- `server/uploads/` — yüklenen görseller (gitignore).
- `server/data.db` — SQLite (gitignore).
- `server/test/*.test.js` — `node:test` testleri.

**Frontend (yeni/değişen):**
- `src/main.jsx` — `BrowserRouter` ile sarmalama (değişir).
- `src/AppRouter.jsx` — rota tanımları (yeni).
- `src/pages/MenuPage.jsx` — mevcut `src/App.jsx` mantığı (taşınır).
- `src/pages/admin/LoginPage.jsx`, `src/pages/admin/DashboardPage.jsx` (yeni).
- `src/components/admin/ProductRow.jsx`, `ProductForm.jsx`, `CategoryForm.jsx`, `ImageUploader.jsx` (yeni).
- `src/context/MenuContext.jsx`, `src/context/AuthContext.jsx` (yeni).
- `src/lib/api.js` (yeni).
- `src/components/ProductCard.jsx`, `src/components/BottomSheet.jsx` — `image_url` render (değişir).
- `vite.config.js` — `/api` ve `/uploads` proxy (değişir).
- `package.json` — bağımlılıklar + `dev:server`/`dev:all` scriptleri (değişir).

**Test stratejisi:** Backend testleri `createApp` fabrikasını geçici bir DB ile kurar (`openDb(tmpfile)`), Express'i `app.listen(0)` ile rastgele portta dinletir, `fetch` ile çağırır. E2e Playwright müşteri+admin akışını sürer.

---

### Task 1: Backend bağımlılıkları + SQLite şeması

**Files:**
- Modify: `package.json` (dependencies + devDependencies)
- Create: `server/db.js`
- Create: `server/test/db.test.js`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `openDb(path: string) => Database` — şemayı (categories, products) kurar, foreign_keys açık döner. `:memory:` veya dosya yolu kabul eder.

- [ ] **Step 1: Bağımlılıkları kur**

```bash
npm install express@^5 better-sqlite3 multer jsonwebtoken cookie-parser dotenv
npm install -D @playwright/test
```

- [ ] **Step 2: .gitignore'a ekle**

`.gitignore` sonuna ekle:

```
# backend
server/data.db
server/uploads/
.env
```

- [ ] **Step 3: Failing test yaz**

Create `server/test/db.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';

test('openDb creates categories and products tables', () => {
  const db = openDb(':memory:');
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);
  assert.ok(tables.includes('categories'), 'categories table exists');
  assert.ok(tables.includes('products'), 'products table exists');
});

test('products table has is_market_price and is_available columns', () => {
  const db = openDb(':memory:');
  const cols = db.prepare('PRAGMA table_info(products)').all().map((c) => c.name);
  for (const name of ['is_market_price', 'is_available', 'image_url', 'category_id']) {
    assert.ok(cols.includes(name), `column ${name} exists`);
  }
});

test('foreign keys are enabled', () => {
  const db = openDb(':memory:');
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --test server/test/db.test.js`
Expected: FAIL — `Cannot find module '../db.js'`.

- [ ] **Step 5: db.js yaz**

Create `server/db.js`:

```js
import Database from 'better-sqlite3';

export function openDb(path) {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id        TEXT PRIMARY KEY,
      name_tr   TEXT NOT NULL,
      name_en   TEXT NOT NULL,
      sort      INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS products (
      id              TEXT PRIMARY KEY,
      category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name_tr         TEXT NOT NULL,
      name_en         TEXT NOT NULL,
      desc_tr         TEXT NOT NULL DEFAULT '',
      desc_en         TEXT NOT NULL DEFAULT '',
      price           REAL,
      is_market_price INTEGER NOT NULL DEFAULT 0,
      image_url       TEXT,
      is_available    INTEGER NOT NULL DEFAULT 1,
      popular         INTEGER NOT NULL DEFAULT 0,
      chef            INTEGER NOT NULL DEFAULT 0,
      diet            TEXT NOT NULL DEFAULT '[]',
      ing_tr          TEXT NOT NULL DEFAULT '[]',
      ing_en          TEXT NOT NULL DEFAULT '[]',
      alg_tr          TEXT NOT NULL DEFAULT '[]',
      alg_en          TEXT NOT NULL DEFAULT '[]',
      sort            INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test server/test/db.test.js`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git init   # yalnızca depo henüz yoksa
git add package.json package-lock.json .gitignore server/db.js server/test/db.test.js
git commit -m "feat(server): add sqlite schema and openDb"
```

---

### Task 2: menu.js verisini DB'ye seed et

**Files:**
- Create: `server/seed.js`
- Create: `server/test/seed.test.js`

**Interfaces:**
- Consumes: `openDb` (Task 1); `CATEGORIES`, `ITEMS` from `src/data/menu.js`.
- Produces: `seed(db) => void` — tablolar boşsa `src/data/menu.js` verisini ekler; doluysa hiçbir şey yapmaz (idempotent). `price == null` olan ürünler `is_market_price = 1` olarak girilir.

- [ ] **Step 1: Failing test yaz**

Create `server/test/seed.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';

test('seed populates categories and products from menu.js', () => {
  const db = openDb(':memory:');
  seed(db);
  const catCount = db.prepare('SELECT COUNT(*) n FROM categories').get().n;
  const prodCount = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  assert.ok(catCount >= 7, 'at least 7 categories seeded');
  assert.ok(prodCount > 0, 'products seeded');
});

test('seed marks null-price items as market price', () => {
  const db = openDb(':memory:');
  seed(db);
  const marketRows = db.prepare('SELECT id FROM products WHERE is_market_price = 1').all();
  for (const row of marketRows) {
    const p = db.prepare('SELECT price FROM products WHERE id = ?').get(row.id);
    assert.equal(p.price, null, `${row.id} market price has null price`);
  }
});

test('seed is idempotent', () => {
  const db = openDb(':memory:');
  seed(db);
  const first = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  seed(db);
  const second = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  assert.equal(first, second, 'second seed does not duplicate');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/seed.test.js`
Expected: FAIL — `Cannot find module '../seed.js'`.

- [ ] **Step 3: seed.js yaz**

Create `server/seed.js`:

```js
import { CATEGORIES, ITEMS } from '../src/data/menu.js';

export function seed(db) {
  const existing = db.prepare('SELECT COUNT(*) n FROM categories').get().n;
  if (existing > 0) return;

  const insertCat = db.prepare(
    `INSERT INTO categories (id, name_tr, name_en, sort, is_active)
     VALUES (@id, @name_tr, @name_en, @sort, 1)`
  );
  const insertProd = db.prepare(
    `INSERT INTO products
      (id, category_id, name_tr, name_en, desc_tr, desc_en, price, is_market_price,
       image_url, is_available, popular, chef, diet, ing_tr, ing_en, alg_tr, alg_en, sort)
     VALUES
      (@id, @category_id, @name_tr, @name_en, @desc_tr, @desc_en, @price, @is_market_price,
       NULL, 1, @popular, @chef, @diet, @ing_tr, @ing_en, @alg_tr, @alg_en, @sort)`
  );

  const tx = db.transaction(() => {
    CATEGORIES.forEach((c, i) => {
      insertCat.run({ id: c.id, name_tr: c.tr, name_en: c.en, sort: i });
    });
    ITEMS.forEach((it, i) => {
      insertProd.run({
        id: it.id,
        category_id: it.cat,
        name_tr: it.name.tr,
        name_en: it.name.en,
        desc_tr: it.desc?.tr ?? '',
        desc_en: it.desc?.en ?? '',
        price: it.price ?? null,
        is_market_price: it.price == null ? 1 : 0,
        popular: it.popular ? 1 : 0,
        chef: it.chef ? 1 : 0,
        diet: JSON.stringify(it.diet ?? []),
        ing_tr: JSON.stringify(it.ing?.tr ?? []),
        ing_en: JSON.stringify(it.ing?.en ?? []),
        alg_tr: JSON.stringify(it.alg?.tr ?? []),
        alg_en: JSON.stringify(it.alg?.en ?? []),
        sort: i,
      });
    });
  });
  tx();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/test/seed.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/seed.js server/test/seed.test.js
git commit -m "feat(server): seed database from menu.js"
```

---

### Task 3: Public menü route + createApp fabrikası

**Files:**
- Create: `server/routes/menu.js`
- Create: `server/app.js`
- Create: `server/test/menu.test.js`

**Interfaces:**
- Consumes: `openDb`, `seed`.
- Produces:
  - `rowToPublicItem(row) => { id, cat, thumb, price, diet, popular, chef, image_url, name:{tr,en}, desc:{tr,en}, ing:{tr,en}, alg:{tr,en} }` — `price` market ise `null`. `thumb` = `name_en` büyük harf (placeholder).
  - `createMenuRouter(db) => Router` (`GET /` → `{ categories, products }`, yalnız aktif/görünür).
  - `createApp({ db, uploadsDir, auth }) => express.App` — `/api/menu` mount eder; `auth`/`uploadsDir` opsiyonel (sonraki task'larda kullanılacak). JSON body parser açık.

- [ ] **Step 1: Failing test yaz**

Create `server/test/menu.test.js`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';

let server, base, db;

before(async () => {
  db = openDb(':memory:');
  seed(db);
  const app = createApp({ db });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET /api/menu returns categories and products', async () => {
  const res = await fetch(`${base}/api/menu`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.categories) && body.categories.length >= 7);
  assert.ok(Array.isArray(body.products) && body.products.length > 0);
});

test('GET /api/menu hides unavailable products', async () => {
  db.prepare('UPDATE products SET is_available = 0 WHERE id = ?').run('fava');
  const res = await fetch(`${base}/api/menu`);
  const body = await res.json();
  assert.ok(!body.products.some((p) => p.id === 'fava'), 'fava is hidden');
  db.prepare('UPDATE products SET is_available = 1 WHERE id = ?').run('fava');
});

test('public item shape matches menu.js (price null when market)', async () => {
  db.prepare('UPDATE products SET is_market_price = 1, price = NULL WHERE id = ?').run('fava');
  const res = await fetch(`${base}/api/menu`);
  const body = await res.json();
  const fava = body.products.find((p) => p.id === 'fava');
  assert.equal(fava.price, null);
  assert.equal(typeof fava.name.tr, 'string');
  assert.ok(Array.isArray(fava.diet));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/menu.test.js`
Expected: FAIL — `Cannot find module '../app.js'`.

- [ ] **Step 3: menu route yaz**

Create `server/routes/menu.js`:

```js
import { Router } from 'express';

export function rowToPublicItem(row) {
  return {
    id: row.id,
    cat: row.category_id,
    thumb: row.name_en.toUpperCase(),
    price: row.is_market_price ? null : row.price,
    image_url: row.image_url,
    diet: JSON.parse(row.diet),
    popular: !!row.popular,
    chef: !!row.chef,
    name: { tr: row.name_tr, en: row.name_en },
    desc: { tr: row.desc_tr, en: row.desc_en },
    ing: { tr: JSON.parse(row.ing_tr), en: JSON.parse(row.ing_en) },
    alg: { tr: JSON.parse(row.alg_tr), en: JSON.parse(row.alg_en) },
  };
}

export function createMenuRouter(db) {
  const router = Router();
  router.get('/', (req, res) => {
    const categories = db
      .prepare('SELECT id, name_tr AS tr, name_en AS en FROM categories WHERE is_active = 1 ORDER BY sort')
      .all();
    const rows = db
      .prepare(
        `SELECT p.* FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.is_available = 1 AND c.is_active = 1
         ORDER BY p.sort`
      )
      .all();
    res.json({ categories, products: rows.map(rowToPublicItem) });
  });
  return router;
}
```

- [ ] **Step 4: app.js yaz**

Create `server/app.js`:

```js
import express from 'express';
import cookieParser from 'cookie-parser';
import { createMenuRouter } from './routes/menu.js';

export function createApp({ db, uploadsDir, auth }) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/menu', createMenuRouter(db));
  // auth ve admin route'ları sonraki task'larda eklenir
  app.set('appDeps', { db, uploadsDir, auth });
  return app;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test server/test/menu.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/routes/menu.js server/app.js server/test/menu.test.js
git commit -m "feat(server): public menu route and createApp factory"
```

---

### Task 4: Auth (tek şifre + JWT cookie)

**Files:**
- Create: `server/auth.js`
- Modify: `server/app.js`
- Create: `server/test/auth.test.js`

**Interfaces:**
- Consumes: `createApp`.
- Produces: `createAuth({ secret, password }) => { router, requireAuth }`.
  - `router`: `POST /login {password}` → 200 + httpOnly cookie `token`; yanlışsa 401. `POST /logout` → cookie temizler. `GET /me` → `{ authenticated: true }` (token geçerliyse) / 401.
  - `requireAuth`: cookie'deki JWT geçersizse 401 döndüren middleware.
- `createApp` artık `auth` verilirse `/api/auth` mount eder ve `auth`'u deps'e koyar.

- [ ] **Step 1: Failing test yaz**

Create `server/test/auth.test.js`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base;

before(async () => {
  const db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 'test-secret', password: 'hunter2' });
  const app = createApp({ db, auth });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('login with wrong password returns 401', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'nope' }),
  });
  assert.equal(res.status, 401);
});

test('login with correct password sets cookie and /me succeeds', async () => {
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'hunter2' }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie');
  assert.ok(cookie && cookie.includes('token='), 'token cookie set');

  const me = await fetch(`${base}/api/auth/me`, { headers: { cookie } });
  assert.equal(me.status, 200);
});

test('/me without cookie returns 401', async () => {
  const me = await fetch(`${base}/api/auth/me`);
  assert.equal(me.status, 401);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/auth.test.js`
Expected: FAIL — `Cannot find module '../auth.js'`.

- [ ] **Step 3: auth.js yaz**

Create `server/auth.js`:

```js
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const COOKIE = 'token';
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createAuth({ secret, password }) {
  function requireAuth(req, res, next) {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Yetkisiz' });
    try {
      jwt.verify(token, secret);
      next();
    } catch {
      res.status(401).json({ error: 'Oturum geçersiz' });
    }
  }

  const router = Router();
  router.post('/login', (req, res) => {
    if (!password || req.body?.password !== password) {
      return res.status(401).json({ error: 'Hatalı şifre' });
    }
    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '7d' });
    res.cookie(COOKIE, token, cookieOpts);
    res.json({ authenticated: true });
  });
  router.post('/logout', (req, res) => {
    res.clearCookie(COOKIE, cookieOpts);
    res.json({ authenticated: false });
  });
  router.get('/me', requireAuth, (req, res) => {
    res.json({ authenticated: true });
  });

  return { router, requireAuth };
}
```

- [ ] **Step 4: createApp'i auth'u mount edecek şekilde güncelle**

`server/app.js` içinde menü mount satırından sonra ekle:

```js
  if (auth) app.use('/api/auth', auth.router);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test server/test/auth.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/auth.js server/app.js server/test/auth.test.js
git commit -m "feat(server): single-password auth with jwt cookie"
```

---

### Task 5: Admin ürün CRUD route'ları

**Files:**
- Create: `server/routes/admin.js`
- Modify: `server/app.js`
- Create: `server/test/admin-products.test.js`

**Interfaces:**
- Consumes: `requireAuth` (auth.router üzerinden gelen middleware), `db`.
- Produces: `createAdminRouter({ db, uploadsDir, requireAuth }) => Router`. Tüm route'lar `requireAuth` ile korunur. Bu task'ta:
  - `GET /menu` → `{ categories, products }` (pasifler dahil; ürünler ham DB satırı + `diet/ing/alg` JSON parse edilmiş).
  - `POST /products` → body'den ürün ekler, id verilmezse üretir; 201 + ürün.
  - `PATCH /products/:id` → izinli alanları kısmi günceller; 200 + ürün; yoksa 404.
  - `DELETE /products/:id` → siler; 204; yoksa 404.
- `createApp` artık `auth` varsa `/api/admin` altına `createAdminRouter` mount eder.

- [ ] **Step 1: Failing test yaz**

Create `server/test/admin-products.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/admin-products.test.js`
Expected: FAIL — `Cannot find module '../routes/admin.js'`.

- [ ] **Step 3: admin.js (ürün kısmı) yaz**

Create `server/routes/admin.js`:

```js
import { Router } from 'express';
import { randomUUID } from 'node:crypto';

const JSON_FIELDS = ['diet', 'ing_tr', 'ing_en', 'alg_tr', 'alg_en'];
const PRODUCT_FIELDS = [
  'category_id', 'name_tr', 'name_en', 'desc_tr', 'desc_en', 'price',
  'is_market_price', 'image_url', 'is_available', 'popular', 'chef',
  'diet', 'ing_tr', 'ing_en', 'alg_tr', 'alg_en', 'sort',
];

function hydrate(row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS) out[f] = JSON.parse(row[f]);
  return out;
}

function getProduct(db, id) {
  return hydrate(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
}

export function createAdminRouter({ db, uploadsDir, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/menu', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort').all();
    const products = db.prepare('SELECT * FROM products ORDER BY sort').all().map(hydrate);
    res.json({ categories, products });
  });

  router.post('/products', (req, res) => {
    const b = req.body ?? {};
    if (!b.category_id || !b.name_tr || !b.name_en) {
      return res.status(400).json({ error: 'category_id, name_tr, name_en zorunlu' });
    }
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.category_id);
    if (!cat) return res.status(400).json({ error: 'Geçersiz kategori' });
    const id = b.id || randomUUID().slice(0, 8);
    db.prepare(
      `INSERT INTO products
        (id, category_id, name_tr, name_en, desc_tr, desc_en, price, is_market_price,
         image_url, is_available, popular, chef, diet, ing_tr, ing_en, alg_tr, alg_en, sort)
       VALUES
        (@id, @category_id, @name_tr, @name_en, @desc_tr, @desc_en, @price, @is_market_price,
         NULL, @is_available, @popular, @chef, @diet, @ing_tr, @ing_en, @alg_tr, @alg_en, @sort)`
    ).run({
      id,
      category_id: b.category_id,
      name_tr: b.name_tr,
      name_en: b.name_en,
      desc_tr: b.desc_tr ?? '',
      desc_en: b.desc_en ?? '',
      price: b.is_market_price ? null : (b.price ?? null),
      is_market_price: b.is_market_price ? 1 : 0,
      is_available: b.is_available === 0 ? 0 : 1,
      popular: b.popular ? 1 : 0,
      chef: b.chef ? 1 : 0,
      diet: JSON.stringify(b.diet ?? []),
      ing_tr: JSON.stringify(b.ing_tr ?? []),
      ing_en: JSON.stringify(b.ing_en ?? []),
      alg_tr: JSON.stringify(b.alg_tr ?? []),
      alg_en: JSON.stringify(b.alg_en ?? []),
      sort: b.sort ?? 0,
    });
    res.status(201).json(getProduct(db, id));
  });

  router.patch('/products/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    const b = req.body ?? {};
    const sets = [];
    const params = { id: req.params.id };
    for (const f of PRODUCT_FIELDS) {
      if (!(f in b)) continue;
      let v = b[f];
      if (JSON_FIELDS.includes(f)) v = JSON.stringify(v ?? []);
      else if (['is_market_price', 'is_available', 'popular', 'chef'].includes(f)) v = v ? 1 : 0;
      sets.push(`${f} = @${f}`);
      params[f] = v;
    }
    if ('is_market_price' in b && b.is_market_price) {
      sets.push('price = NULL');
    }
    if (sets.length) {
      db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = @id`).run(params);
    }
    res.json(getProduct(db, req.params.id));
  });

  router.delete('/products/:id', (req, res) => {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
    res.status(204).end();
  });

  return router;
}
```

- [ ] **Step 4: createApp'e admin mount ekle**

`server/app.js` içinde import ekle ve auth bloğunu güncelle:

```js
import { createAdminRouter } from './routes/admin.js';
```

`if (auth) app.use('/api/auth', auth.router);` satırını şununla değiştir:

```js
  if (auth) {
    app.use('/api/auth', auth.router);
    app.use('/api/admin', createAdminRouter({ db, uploadsDir, requireAuth: auth.requireAuth }));
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test server/test/admin-products.test.js`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add server/routes/admin.js server/app.js server/test/admin-products.test.js
git commit -m "feat(server): admin product CRUD routes"
```

---

### Task 6: Admin kategori CRUD route'ları

**Files:**
- Modify: `server/routes/admin.js`
- Create: `server/test/admin-categories.test.js`

**Interfaces:**
- Produces (admin router'a eklenir):
  - `POST /categories` `{ id, name_tr, name_en, sort?, is_active? }` → 201 + kategori.
  - `PATCH /categories/:id` → kısmi güncelle; 200; yoksa 404.
  - `DELETE /categories/:id` → içinde ürün varsa 409; yoksa siler 204; yoksa 404.

- [ ] **Step 1: Failing test yaz**

Create `server/test/admin-categories.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/admin-categories.test.js`
Expected: FAIL — 404 (route yok), assertion hataları.

- [ ] **Step 3: Kategori route'larını ekle**

`server/routes/admin.js` içinde `return router;` satırından ÖNCE ekle:

```js
  router.post('/categories', (req, res) => {
    const b = req.body ?? {};
    if (!b.id || !b.name_tr || !b.name_en) {
      return res.status(400).json({ error: 'id, name_tr, name_en zorunlu' });
    }
    const exists = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.id);
    if (exists) return res.status(409).json({ error: 'Bu id zaten var' });
    db.prepare(
      `INSERT INTO categories (id, name_tr, name_en, sort, is_active)
       VALUES (@id, @name_tr, @name_en, @sort, @is_active)`
    ).run({
      id: b.id, name_tr: b.name_tr, name_en: b.name_en,
      sort: b.sort ?? 0, is_active: b.is_active === 0 ? 0 : 1,
    });
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(b.id));
  });

  router.patch('/categories/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });
    const b = req.body ?? {};
    const sets = [];
    const params = { id: req.params.id };
    for (const f of ['name_tr', 'name_en', 'sort', 'is_active']) {
      if (!(f in b)) continue;
      sets.push(`${f} = @${f}`);
      params[f] = f === 'is_active' ? (b[f] ? 1 : 0) : b[f];
    }
    if (sets.length) {
      db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = @id`).run(params);
    }
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
  });

  router.delete('/categories/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });
    const count = db.prepare('SELECT COUNT(*) n FROM products WHERE category_id = ?').get(req.params.id).n;
    if (count > 0) return res.status(409).json({ error: 'Kategoride ürün var, önce ürünleri taşı/sil' });
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.status(204).end();
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/test/admin-categories.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/routes/admin.js server/test/admin-categories.test.js
git commit -m "feat(server): admin category CRUD routes"
```

---

### Task 7: Görsel yükleme / kaldırma (multer)

**Files:**
- Modify: `server/routes/admin.js`
- Modify: `server/app.js` (uploads statik servis)
- Create: `server/test/admin-image.test.js`

**Interfaces:**
- Consumes: `uploadsDir` (createApp'ten gelir).
- Produces (admin router'a eklenir):
  - `POST /products/:id/image` (multipart, alan adı `image`) → görseli `uploadsDir`'e kaydeder, eski görsel dosyasını siler, `image_url = /uploads/<dosya>` günceller; 200 + ürün. Tür jpg/png/webp değilse veya >5MB ise 400.
  - `DELETE /products/:id/image` → dosyayı ve `image_url`'i kaldırır; 200 + ürün.
- `createApp`: `uploadsDir` verilirse `app.use('/uploads', express.static(uploadsDir))`.

- [ ] **Step 1: Failing test yaz**

Create `server/test/admin-image.test.js`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie, uploadsDir;

before(async () => {
  uploadsDir = mkdtempSync(join(tmpdir(), 'yedigul-up-'));
  const db = openDb(':memory:');
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

test('DELETE image clears image_url', async () => {
  const res = await fetch(`${base}/api/admin/products/fava/image`, {
    method: 'DELETE', headers: { cookie },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.image_url, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/test/admin-image.test.js`
Expected: FAIL — image route yok (404/400 beklenmeyen).

- [ ] **Step 3: multer + görsel route'ları ekle**

`server/routes/admin.js` başına importları ekle:

```js
import multer from 'multer';
import { extname, join } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
```

`createAdminRouter` gövdesinde, `router.use(requireAuth);` satırından sonra ekle:

```js
  const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) =>
        cb(null, `${req.params.id}-${Date.now()}${ALLOWED[file.mimetype] || extname(file.originalname)}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, !!ALLOWED[file.mimetype]),
  });

  function removeImageFile(url) {
    if (!url) return;
    const p = join(uploadsDir, url.replace('/uploads/', ''));
    if (existsSync(p)) {
      try { unlinkSync(p); } catch { /* dosya yoksa yok say */ }
    }
  }
```

`return router;` satırından ÖNCE ekle:

```js
  router.post('/products/:id/image', (req, res) => {
    const existing = db.prepare('SELECT image_url FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: 'Yükleme hatası: ' + err.message });
      if (!req.file) return res.status(400).json({ error: 'Geçersiz dosya (jpg/png/webp, ≤5MB)' });
      removeImageFile(existing.image_url);
      const url = `/uploads/${req.file.filename}`;
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(url, req.params.id);
      res.json(getProduct(db, req.params.id));
    });
  });

  router.delete('/products/:id/image', (req, res) => {
    const existing = db.prepare('SELECT image_url FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    removeImageFile(existing.image_url);
    db.prepare('UPDATE products SET image_url = NULL WHERE id = ?').run(req.params.id);
    res.json(getProduct(db, req.params.id));
  });
```

- [ ] **Step 4: app.js'e uploads statik servisini ekle**

`server/app.js` içinde `app.use(cookieParser());` satırından sonra ekle:

```js
  if (uploadsDir) app.use('/uploads', express.static(uploadsDir));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test server/test/admin-image.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/routes/admin.js server/app.js server/test/admin-image.test.js
git commit -m "feat(server): product image upload and delete"
```

---

### Task 8: Sunucu giriş noktası + Vite proxy + scriptler

**Files:**
- Create: `server/index.js`
- Create: `.env.example`
- Modify: `vite.config.js`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `openDb`, `seed`, `createApp`, `createAuth`.
- Produces: çalışan sunucu (`node server/index.js`) — `.env`'den `PORT` (vars. 3001), `DB_PATH` (vars. `server/data.db`), `UPLOADS_DIR` (vars. `server/uploads`), `JWT_SECRET`, `ADMIN_PASSWORD` okur; prod'da `dist/`'i statik servis eder ve SPA fallback yapar.

- [ ] **Step 1: index.js yaz**

Create `server/index.js`:

```js
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import express from 'express';
import { openDb } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';
import { createAuth } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || join(__dirname, 'uploads');
const SECRET = process.env.JWT_SECRET || 'change-me-in-env';
const PASSWORD = process.env.ADMIN_PASSWORD || '';

mkdirSync(UPLOADS_DIR, { recursive: true });

const db = openDb(DB_PATH);
seed(db);
const auth = createAuth({ secret: SECRET, password: PASSWORD });
const app = createApp({ db, uploadsDir: UPLOADS_DIR, auth });

// production: serve built frontend
const distDir = resolve(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  if (!PASSWORD) console.warn('UYARI: ADMIN_PASSWORD boş — admin girişi devre dışı.');
  console.log(`Yedigül API http://localhost:${PORT}`);
});
```

- [ ] **Step 2: .env.example yaz**

Create `.env.example`:

```
PORT=3001
JWT_SECRET=replace-with-long-random-string
ADMIN_PASSWORD=replace-with-strong-password
```

- [ ] **Step 3: Vite proxy ekle**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 4: package.json scriptlerini güncelle**

`package.json` `scripts` bloğunu şu hale getir:

```json
  "scripts": {
    "dev": "vite",
    "dev:server": "node --watch server/index.js",
    "build": "vite build",
    "start": "node server/index.js",
    "lint": "oxlint",
    "preview": "vite preview",
    "test:server": "node --test server/test/"
  },
```

- [ ] **Step 5: Manuel doğrulama**

`.env.example`'ı `.env` olarak kopyala ve bir şifre gir. İki ayrı terminalde:

Run: `npm run dev:server` → "Yedigül API http://localhost:3001" görünür.
Run: `curl http://localhost:3001/api/menu` → JSON `{ "categories": [...], "products": [...] }`.

- [ ] **Step 6: Tüm backend testlerini çalıştır**

Run: `npm run test:server`
Expected: tüm test dosyaları PASS.

- [ ] **Step 7: Commit**

```bash
git add server/index.js .env.example vite.config.js package.json
git commit -m "feat(server): entrypoint, env config, vite proxy and scripts"
```

---

### Task 9: react-router kurulumu + MenuPage'e taşıma

**Files:**
- Modify: `package.json` (react-router-dom)
- Create: `src/pages/MenuPage.jsx`
- Create: `src/AppRouter.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Produces:
  - `MenuPage` — mevcut `src/App.jsx`'in aynısı (default export), bir sonraki task'ta veri kaynağı değişecek.
  - `AppRouter` — rota tablosu: `/` ve `/masa/:id` → `MenuPage`; `/admin/login` ve `/admin` placeholder (Task 12'de doldurulur).

- [ ] **Step 1: react-router-dom kur**

```bash
npm install react-router-dom
```

- [ ] **Step 2: App.jsx'i MenuPage.jsx olarak kopyala**

`src/App.jsx` içeriğini birebir `src/pages/MenuPage.jsx`'e taşı; importların yolunu bir üst dizine göre düzelt:

```js
// src/pages/MenuPage.jsx — üst kısımdaki importlar:
import { CATEGORIES, ITEMS, UI } from '../data/menu';
import { getThemeVars } from '../lib/theme';
import { getTableNumber, readStorage, writeStorage } from '../lib/storage';
import useScrollSpy from '../lib/useScrollSpy';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import SearchFilters from '../components/SearchFilters';
import ProductList from '../components/ProductList';
import MenuSections from '../components/MenuSections';
import BottomSheet from '../components/BottomSheet';
```

Fonksiyon adını `export default function MenuPage(...)` yap; gövde aynı kalır. Eski `src/App.jsx`'i sil.

- [ ] **Step 3: AppRouter.jsx yaz**

Create `src/AppRouter.jsx`:

```js
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/masa/:id" element={<MenuPage />} />
      {/* admin rotaları Task 12'de eklenir */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 4: main.jsx'i güncelle**

Replace `src/main.jsx` with:

```js
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRouter from './AppRouter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 5: getTableNumber'ı route param'a duyarlı yap**

`src/lib/storage.js` içindeki `getTableNumber` query string okuyor; `/masa/:id` de desteklensin diye `src/pages/MenuPage.jsx` içinde `useParams` ile birleştir. MenuPage importlarına ekle:

```js
import { useParams } from 'react-router-dom';
```

`const tableNumber = useMemo(() => getTableNumber(), []);` satırını şununla değiştir:

```js
  const { id: routeTable } = useParams();
  const tableNumber = useMemo(() => routeTable || getTableNumber(), [routeTable]);
```

- [ ] **Step 6: Doğrulama**

Run: `npm run dev` → tarayıcıda `http://localhost:5173/` menü açılır; `http://localhost:5173/masa/7` menü açılır ve masa no 7 görünür.
Run: `npm run lint` → hata yok.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/main.jsx src/AppRouter.jsx src/pages/MenuPage.jsx
git rm src/App.jsx
git commit -m "feat(web): add react-router and move menu to MenuPage"
```

---

### Task 10: API katmanı + MenuContext (veriyi API'den çek + polling)

**Files:**
- Create: `src/lib/api.js`
- Create: `src/context/MenuContext.jsx`
- Modify: `src/pages/MenuPage.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Produces:
  - `api.get(path)`, `api.post(path, body)`, `api.patch(path, body)`, `api.del(path)`, `api.upload(path, formData)` — `credentials: 'include'`, hata durumunda `Error(message)` fırlatır.
  - `MenuProvider` + `useMenu() => { categories, items, loading, error, reload }`. `categories` = `[{id,tr,en}]`, `items` = public ITEMS şekli. Mount'ta yükler ve 30 sn'de bir sessiz reload yapar.
- Consumes: `GET /api/menu`.

- [ ] **Step 1: api.js yaz**

Create `src/lib/api.js`:

```js
async function request(method, path, body, isForm = false) {
  const opts = { method, credentials: 'include', headers: {} };
  if (body != null) {
    if (isForm) opts.body = body;
    else {
      opts.headers['content-type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`/api${path}`, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Hata (${res.status})`);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
  upload: (p, form) => request('POST', p, form, true),
};
```

- [ ] **Step 2: MenuContext yaz**

Create `src/context/MenuContext.jsx`:

```js
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const MenuContext = createContext(null);
const POLL_MS = 30000;

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firstLoad = useRef(true);

  const reload = useCallback(async () => {
    try {
      const data = await api.get('/menu');
      setCategories(data.categories);
      setItems(data.products);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      if (firstLoad.current) {
        firstLoad.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <MenuContext.Provider value={{ categories, items, loading, error, reload }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
```

- [ ] **Step 3: MenuPage'i context'ten okuyacak şekilde değiştir**

`src/pages/MenuPage.jsx`:

1. Importu değiştir — `import { CATEGORIES, ITEMS, UI } from '../data/menu';` yerine:

```js
import { UI } from '../data/menu';
import { useMenu } from '../context/MenuContext';
```

2. Bileşen gövdesinin başında (diğer hook'lardan önce) ekle:

```js
  const { categories: CATEGORIES, items: ITEMS, loading } = useMenu();
```

3. Yüklenme durumu için, `const ui = UI[lang];` satırından sonra ekle:

```js
  // not: erken return JSX'i, tüm hook'lar tanımlandıktan SONRA yapılmalı (aşağıya bakın)
```

Hook kurallarını bozmamak için erken return'ü en sona, `return (...)`'dan hemen önce koy:

```js
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1422', color: '#92A3C0' }}>
        {ui.loading}
      </div>
    );
  }
```

(`UI` sözlüğüne `loading` anahtarı Step 4'te eklenir.)

- [ ] **Step 4: UI sözlüğüne loading metni ekle**

`src/data/menu.js` içindeki `UI` nesnesinde TR ve EN bloklarına ekle:

```js
// UI.tr içine:
    loading: 'Menü yükleniyor…',
// UI.en içine:
    loading: 'Loading menu…',
```

(Mevcut anahtarların yanına virgülle ekle.)

- [ ] **Step 5: main.jsx'i MenuProvider ile sar**

`src/main.jsx` import ve render'ı güncelle:

```js
import { MenuProvider } from './context/MenuContext.jsx'
```

`<BrowserRouter>` içini `<MenuProvider>` ile sar:

```js
    <BrowserRouter>
      <MenuProvider>
        <AppRouter />
      </MenuProvider>
    </BrowserRouter>
```

- [ ] **Step 6: Doğrulama**

İki terminal: `npm run dev:server` ve `npm run dev`. Tarayıcıda `http://localhost:5173/` — menü artık API'den gelir (DB'deki veriler). Sunucuda bir ürünü `is_available=0` yapıp (örn. başka bir admin PATCH'i veya SQLite ile) 30 sn içinde kaybolduğunu gör.
Run: `npm run lint` → hata yok.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api.js src/context/MenuContext.jsx src/pages/MenuPage.jsx src/data/menu.js src/main.jsx
git commit -m "feat(web): load menu from API via MenuContext with polling"
```

---

### Task 11: Ürün görselini müşteri menüsünde göster

**Files:**
- Modify: `src/pages/MenuPage.jsx` (mapItem + sheet)
- Modify: `src/components/ProductCard.jsx`
- Modify: `src/components/BottomSheet.jsx`

**Interfaces:**
- Produces: ürün nesnesine `image` alanı eklenir (= `image_url` veya null). `ProductCard` ve `BottomSheet`, `image` varsa gerçek görseli, yoksa mevcut `thumb` placeholder'ı render eder.

- [ ] **Step 1: mapItem ve sheet'e image ekle**

`src/pages/MenuPage.jsx` içindeki `mapItem` dönüşüne `image` ekle:

```js
const mapItem = (it, lang, ui) => ({
  id: it.id,
  name: localize(it.name, lang),
  desc: localize(it.desc, lang),
  thumb: it.thumb,
  image: it.image_url || null,
  isMarket: it.price == null,
  priceText: it.price == null ? ui.market : `${it.price} TL`,
  badges: it.diet.map((d) => (d === 'gf' ? ui.gfShort : ui.vegShort)),
  tags: buildTags(it, ui),
});
```

`sheet` useMemo dönüşüne de ekle (`thumb: sel.thumb,` satırının yanına):

```js
      image: sel.image_url || null,
```

- [ ] **Step 2: ProductCard'da görseli render et**

`src/components/ProductCard.jsx` içindeki thumb `<div>` bloğunu (placeholder gösteren) şu koşullu yapıyla değiştir:

```jsx
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full rounded-[13px] object-cover border"
            style={{ borderColor: 'var(--border)' }}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full rounded-[13px] flex items-center justify-center text-center p-1 border"
            style={{
              background:
                'repeating-linear-gradient(135deg, var(--thumb-a) 0 6px, var(--thumb-b) 6px 12px)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="font-outfit text-[8.5px] font-semibold tracking-[.18em]" style={{ color: 'var(--thumb-ink)' }}>
              {item.thumb}
            </span>
          </div>
        )}
```

- [ ] **Step 3: BottomSheet'te görseli render et**

`src/components/BottomSheet.jsx`'i aç; büyük thumb/placeholder gösteren bloğu bul ve `sheet.image` varsa `<img src={sheet.image} ... object-cover />`, yoksa mevcut placeholder'ı gösterecek şekilde aynı koşullu kalıbı uygula (Step 2'deki gibi, BottomSheet'in mevcut boyut sınıflarını koru).

- [ ] **Step 4: Doğrulama**

`npm run dev:server` + `npm run dev`. Bir ürüne görsel yükle (geçici olarak SQLite'a `image_url='/uploads/x.png'` yazıp dosyayı koy ya da Task 14 sonrası panelden) ve kartta + alt sayfada göründüğünü, görselsiz ürünlerde placeholder'ın korunduğunu doğrula.
Run: `npm run lint` → hata yok.

- [ ] **Step 5: Commit**

```bash
git add src/pages/MenuPage.jsx src/components/ProductCard.jsx src/components/BottomSheet.jsx
git commit -m "feat(web): render product image when present"
```

---

### Task 12: AuthContext + LoginPage + korumalı admin rotası

**Files:**
- Create: `src/context/AuthContext.jsx`
- Create: `src/pages/admin/LoginPage.jsx`
- Create: `src/pages/admin/DashboardPage.jsx` (iskelet)
- Modify: `src/AppRouter.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Produces:
  - `AuthProvider` + `useAuth() => { authed, ready, login(password), logout }`. Mount'ta `GET /api/auth/me` ile durumu belirler (`ready` true olunca).
  - `LoginPage` — şifre formu; başarıda `/admin`'e yönlendirir.
  - `RequireAuth` sarmalayıcı — `ready` değilse boş, `authed` değilse `/admin/login`'e yönlendirir.
  - `DashboardPage` iskeleti — "Yönetim" başlığı + çıkış butonu (içerik Task 13-15).

- [ ] **Step 1: AuthContext yaz**

Create `src/context/AuthContext.jsx`:

```js
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (password) => {
    await api.post('/auth/login', { password });
    setAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authed, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: LoginPage yaz**

Create `src/pages/admin/LoginPage.jsx`:

```js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const vars = getThemeVars(true, '#C8902F');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ ...vars, background: 'var(--bg)' }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[360px] flex flex-col gap-4 p-6 rounded-2xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <h1 className="font-outfit text-xl font-semibold">Yedigül · Yönetim</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          autoFocus
          className="px-4 py-3 rounded-xl border bg-transparent outline-none"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}
        />
        {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-3 rounded-xl font-semibold disabled:opacity-60"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: DashboardPage iskeleti yaz**

Create `src/pages/admin/DashboardPage.jsx`:

```js
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const vars = getThemeVars(true, '#C8902F');

  async function onLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen" style={{ ...vars, background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-[640px] mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <h1 className="font-outfit text-lg font-semibold">Yönetim Paneli</h1>
          <button onClick={onLogout} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
            Çıkış
          </button>
        </header>
        {/* ürün/kategori yönetimi Task 13-15'te eklenir */}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: AppRouter'a admin rotaları + RequireAuth ekle**

Replace `src/AppRouter.jsx` with:

```js
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const { authed, ready } = useAuth();
  if (!ready) return null;
  if (!authed) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/masa/:id" element={<MenuPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 5: main.jsx'i AuthProvider ile sar**

`src/main.jsx`'e import ekle ve `<MenuProvider>`'ın içini (ya da dışını) `<AuthProvider>` ile sar:

```js
import { AuthProvider } from './context/AuthContext.jsx'
```

```js
    <BrowserRouter>
      <AuthProvider>
        <MenuProvider>
          <AppRouter />
        </MenuProvider>
      </AuthProvider>
    </BrowserRouter>
```

- [ ] **Step 6: Doğrulama**

`npm run dev:server` + `npm run dev`. `http://localhost:5173/admin` → login'e yönlenir. Yanlış şifre → hata. Doğru şifre (.env'deki) → panel açılır, yenileyince oturum korunur (cookie). Çıkış → login'e döner.
Run: `npm run lint` → hata yok.

- [ ] **Step 7: Commit**

```bash
git add src/context/AuthContext.jsx src/pages/admin/LoginPage.jsx src/pages/admin/DashboardPage.jsx src/AppRouter.jsx src/main.jsx
git commit -m "feat(web): admin auth context, login page and protected route"
```

---

### Task 13: Dashboard ürün listesi + satır işlemleri (fiyat görünümü, aktif/pasif)

**Files:**
- Create: `src/components/admin/ProductRow.jsx`
- Modify: `src/pages/admin/DashboardPage.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/menu`, `PATCH /api/admin/products/:id`.
- Produces:
  - DashboardPage admin menüsünü yükler, kategoriye göre gruplar, her ürün için `ProductRow` render eder; bir `reload()` ve `onEdit(product)` sağlar.
  - `ProductRow({ product, onToggleAvailable, onEdit })` — ad, fiyat/Piyasa rozeti, aktif/pasif anahtarı, "Düzenle" butonu. Anahtar `onToggleAvailable(product, nextValue)` çağırır.

- [ ] **Step 1: ProductRow yaz**

Create `src/components/admin/ProductRow.jsx`:

```js
export default function ProductRow({ product, onToggleAvailable, onEdit }) {
  const priceLabel = product.is_market_price ? 'Piyasa Fiyatı' : `${product.price ?? '—'} TL`;
  const active = product.is_available === 1;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', opacity: active ? 1 : 0.55 }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-outfit text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
          {product.name_tr}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--gold)' }}>{priceLabel}</div>
      </div>
      <button
        onClick={() => onToggleAvailable(product, active ? 0 : 1)}
        className="text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap"
        style={{ borderColor: 'var(--border-strong)', color: active ? 'var(--gold)' : 'var(--muted)' }}
      >
        {active ? 'Aktif' : 'Pasif'}
      </button>
      <button
        onClick={() => onEdit(product)}
        className="text-[12px] px-3 py-1.5 rounded-lg font-medium"
        style={{ background: 'var(--gold-tint)', color: 'var(--gold)' }}
      >
        Düzenle
      </button>
    </div>
  );
}
```

- [ ] **Step 2: DashboardPage'e liste + veri yükleme ekle**

`src/pages/admin/DashboardPage.jsx`'i güncelle — importlar:

```js
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';
import { api } from '../../lib/api';
import ProductRow from '../../components/admin/ProductRow';
```

Bileşen gövdesine state + yükleme ekle (mevcut `const vars = ...` satırından sonra):

```js
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const data = await api.get('/admin/menu');
      setCategories(data.categories);
      setProducts(data.products);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const onToggleAvailable = useCallback(async (product, next) => {
    await api.patch(`/admin/products/${product.id}`, { is_available: next });
    reload();
  }, [reload]);

  const onEdit = useCallback((product) => {
    // Task 14'te form açılır
    console.log('edit', product.id);
  }, []);
```

`{/* ürün/kategori yönetimi ... */}` yorumunu kategori-gruplu liste ile değiştir:

```jsx
        {error && <p className="text-sm mb-2" style={{ color: '#ef6b6b' }}>{error}</p>}
        {categories.map((cat) => (
          <section key={cat.id} className="mb-5">
            <h2 className="font-outfit text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              {cat.name_tr}
            </h2>
            <div className="flex flex-col gap-2">
              {products.filter((p) => p.category_id === cat.id).map((p) => (
                <ProductRow key={p.id} product={p} onToggleAvailable={onToggleAvailable} onEdit={onEdit} />
              ))}
            </div>
          </section>
        ))}
```

- [ ] **Step 3: Doğrulama**

`npm run dev:server` + `npm run dev`. Panele gir → tüm ürünler kategoriye göre listelenir. Bir ürünün "Aktif/Pasif" anahtarına bas → durum değişir; müşteri menüsünde (başka sekme) 30 sn içinde yansır.
Run: `npm run lint` → hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ProductRow.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(admin): product list with availability toggle"
```

---

### Task 14: Ürün ekleme/düzenleme formu + görsel yükleyici

**Files:**
- Create: `src/components/admin/ImageUploader.jsx`
- Create: `src/components/admin/ProductForm.jsx`
- Modify: `src/pages/admin/DashboardPage.jsx`

**Interfaces:**
- Consumes: `POST/PATCH/DELETE /api/admin/products`, `POST/DELETE /api/admin/products/:id/image`.
- Produces:
  - `ImageUploader({ product, onChange })` — mevcut görseli gösterir; dosya seç → `api.upload`; "Kaldır" → `api.del`. Başarıda `onChange(updatedProduct)`. Yalnızca kayıtlı ürün (id'li) için aktif.
  - `ProductForm({ product, categories, onSaved, onCancel, onDeleted })` — ad/açıklama (TR/EN), fiyat + Piyasa Fiyatı checkbox, kategori, görünürlük, diyet (gf/veg), popular/chef ve `ImageUploader`. Kaydet → yeni ise POST, varsa PATCH; `onSaved()`. Sil → DELETE + `onDeleted()`.
  - DashboardPage: "+ Yeni ürün" butonu ve `onEdit` formu modal/inline açar; kaydetince `reload()`.

- [ ] **Step 1: ImageUploader yaz**

Create `src/components/admin/ImageUploader.jsx`:

```js
import { useRef, useState } from 'react';
import { api } from '../../lib/api';

export default function ImageUploader({ product, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!product?.id) {
    return <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Görsel eklemek için önce ürünü kaydedin.</p>;
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const updated = await api.upload(`/admin/products/${product.id}/image`, form);
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    setBusy(true); setError('');
    try {
      const updated = await api.del(`/admin/products/${product.id}/image`);
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {product.image_url ? (
        <img src={product.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
      ) : (
        <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          Görsel yok
        </div>
      )}
      <div className="flex flex-col gap-1">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} className="text-[12px]" />
        {product.image_url && (
          <button type="button" onClick={onRemove} disabled={busy} className="text-[12px] text-left" style={{ color: '#ef6b6b' }}>
            Görseli kaldır
          </button>
        )}
        {error && <span className="text-[11px]" style={{ color: '#ef6b6b' }}>{error}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ProductForm yaz**

Create `src/components/admin/ProductForm.jsx`:

```js
import { useState } from 'react';
import { api } from '../../lib/api';
import ImageUploader from './ImageUploader';

const empty = {
  category_id: '', name_tr: '', name_en: '', desc_tr: '', desc_en: '',
  price: '', is_market_price: 0, is_available: 1, popular: 0, chef: 0, diet: [],
};

export default function ProductForm({ product, categories, onSaved, onCancel, onDeleted }) {
  const [form, setForm] = useState(() => ({ ...empty, ...product, diet: product?.diet ?? [] }));
  const [saved, setSaved] = useState(product ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDiet = (d) =>
    setForm((f) => ({ ...f, diet: f.diet.includes(d) ? f.diet.filter((x) => x !== d) : [...f.diet, d] }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const payload = {
      ...form,
      price: form.is_market_price ? null : (form.price === '' ? null : Number(form.price)),
    };
    try {
      const res = saved?.id
        ? await api.patch(`/admin/products/${saved.id}`, payload)
        : await api.post('/admin/products', payload);
      setSaved(res);
      onSaved(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!saved?.id || !confirm('Ürün silinsin mi?')) return;
    await api.del(`/admin/products/${saved.id}`);
    onDeleted(saved.id);
  }

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none w-full';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <select className={field} style={fieldStyle} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
        <option value="">Kategori seç…</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
      </select>
      <input className={field} style={fieldStyle} placeholder="Ad (TR)" value={form.name_tr} onChange={(e) => set('name_tr', e.target.value)} required />
      <input className={field} style={fieldStyle} placeholder="Ad (EN)" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} required />
      <textarea className={field} style={fieldStyle} placeholder="Açıklama (TR)" value={form.desc_tr} onChange={(e) => set('desc_tr', e.target.value)} />
      <textarea className={field} style={fieldStyle} placeholder="Açıklama (EN)" value={form.desc_en} onChange={(e) => set('desc_en', e.target.value)} />
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
        <input type="checkbox" checked={!!form.is_market_price} onChange={(e) => set('is_market_price', e.target.checked ? 1 : 0)} />
        Piyasa Fiyatı
      </label>
      {!form.is_market_price && (
        <input className={field} style={fieldStyle} type="number" placeholder="Fiyat (TL)" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} />
      )}
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
        <input type="checkbox" checked={form.is_available === 1} onChange={(e) => set('is_available', e.target.checked ? 1 : 0)} />
        Menüde görünür (aktif)
      </label>
      <div className="flex gap-4 text-sm" style={{ color: 'var(--text)' }}>
        <label className="flex items-center gap-1"><input type="checkbox" checked={form.diet.includes('gf')} onChange={() => toggleDiet('gf')} /> Glütensiz</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={form.diet.includes('veg')} onChange={() => toggleDiet('veg')} /> Vejetaryen</label>
      </div>
      <div className="flex gap-4 text-sm" style={{ color: 'var(--text)' }}>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.popular} onChange={(e) => set('popular', e.target.checked ? 1 : 0)} /> Popüler</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.chef} onChange={(e) => set('chef', e.target.checked ? 1 : 0)} /> Şef önerisi</label>
      </div>

      <ImageUploader product={saved} onChange={(p) => { setSaved(p); onSaved(p); }} />

      {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
      <div className="flex gap-2 mt-1">
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
          Kapat
        </button>
        {saved?.id && (
          <button type="button" onClick={onDelete} className="px-4 py-2 rounded-lg ml-auto" style={{ color: '#ef6b6b' }}>
            Sil
          </button>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: DashboardPage'e formu bağla**

`src/pages/admin/DashboardPage.jsx`:

Import ekle:

```js
import ProductForm from '../../components/admin/ProductForm';
```

State ekle (`const [error...]` yakınında):

```js
  const [editing, setEditing] = useState(null); // ürün objesi | 'new' | null
```

`onEdit`'i güncelle:

```js
  const onEdit = useCallback((product) => setEditing(product), []);
```

`<header>`'ın hemen altına "yeni ürün" butonu + form alanı ekle:

```jsx
        {editing ? (
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onSaved={() => reload()}
            onCancel={() => setEditing(null)}
            onDeleted={() => { setEditing(null); reload(); }}
          />
        ) : (
          <button
            onClick={() => setEditing('new')}
            className="mb-4 px-4 py-2 rounded-lg font-semibold"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            + Yeni ürün
          </button>
        )}
```

(Liste bloğunu `editing` null iken göster: kategori `map`'ini `{!editing && (...)}` ile sar.)

- [ ] **Step 4: Doğrulama**

`npm run dev:server` + `npm run dev`. Panelde: "+ Yeni ürün" → form → kaydet → listede görünür. Bir ürünü "Düzenle" → fiyat değiştir + Piyasa Fiyatı aç/kapa → kaydet → müşteri menüsüne yansır. Görsel yükle → kart/alt sayfada görünür. Görsel kaldır → placeholder döner. Sil → listeden kalkar.
Run: `npm run lint` → hata yok.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ImageUploader.jsx src/components/admin/ProductForm.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(admin): product create/edit form with image upload"
```

---

### Task 15: Kategori yönetimi (ekle/düzenle/sil)

**Files:**
- Create: `src/components/admin/CategoryForm.jsx`
- Modify: `src/pages/admin/DashboardPage.jsx`

**Interfaces:**
- Consumes: `POST/PATCH/DELETE /api/admin/categories`.
- Produces:
  - `CategoryForm({ categories, onChanged })` — yeni kategori ekleme (id + ad TR/EN) ve mevcut kategorileri silme. 409 (içinde ürün var) hatasını kullanıcıya gösterir. Değişimde `onChanged()`.
  - DashboardPage'de "Kategoriler" bölümünü açıp/kapatan bir buton.

- [ ] **Step 1: CategoryForm yaz**

Create `src/components/admin/CategoryForm.jsx`:

```js
import { useState } from 'react';
import { api } from '../../lib/api';

export default function CategoryForm({ categories, onChanged }) {
  const [id, setId] = useState('');
  const [nameTr, setNameTr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [error, setError] = useState('');

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  async function onAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/categories', { id: id.trim(), name_tr: nameTr, name_en: nameEn });
      setId(''); setNameTr(''); setNameEn('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(catId) {
    if (!confirm('Kategori silinsin mi?')) return;
    setError('');
    try {
      await api.del(`/admin/categories/${catId}`);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border mb-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <form onSubmit={onAdd} className="flex flex-col gap-2">
        <input className={field} style={fieldStyle} placeholder="ID (örn. wine)" value={id} onChange={(e) => setId(e.target.value)} required />
        <input className={field} style={fieldStyle} placeholder="Ad (TR)" value={nameTr} onChange={(e) => setNameTr(e.target.value)} required />
        <input className={field} style={fieldStyle} placeholder="Ad (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
        <button type="submit" className="px-4 py-2 rounded-lg font-semibold self-start" style={{ background: 'var(--gold)', color: '#fff' }}>
          Kategori ekle
        </button>
      </form>
      {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
      <ul className="flex flex-col gap-1">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-sm" style={{ color: 'var(--text)' }}>
            <span>{c.name_tr} <span style={{ color: 'var(--muted)' }}>({c.id})</span></span>
            <button onClick={() => onDelete(c.id)} style={{ color: '#ef6b6b' }} className="text-[12px]">Sil</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: DashboardPage'e kategori bölümünü ekle**

`src/pages/admin/DashboardPage.jsx`:

Import ekle:

```js
import CategoryForm from '../../components/admin/CategoryForm';
```

State ekle:

```js
  const [showCategories, setShowCategories] = useState(false);
```

`<header>`'daki "Çıkış" butonunun yanına bir buton ekle (header'ın `div`'ine):

```jsx
          <button onClick={() => setShowCategories((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg border mr-2" style={{ borderColor: 'var(--border-strong)' }}>
            Kategoriler
          </button>
```

Liste bloğundan önce (form/buton bloğunun ardından) ekle:

```jsx
        {showCategories && !editing && (
          <CategoryForm categories={categories} onChanged={reload} />
        )}
```

- [ ] **Step 3: Doğrulama**

`npm run dev:server` + `npm run dev`. "Kategoriler" → yeni kategori ekle → ürün formunun kategori listesinde çıkar. İçinde ürün olan kategoriyi sil → uyarı (409 mesajı). Boş kategoriyi sil → kalkar.
Run: `npm run lint` → hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/CategoryForm.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(admin): category management"
```

---

### Task 16: Uçtan uca (e2e) Playwright testi

**Files:**
- Create: `playwright.config.js`
- Create: `e2e/admin.spec.js`
- Modify: `package.json` (test:e2e scripti)

**Interfaces:**
- Consumes: çalışan dev sunucuları (Vite + API).
- Produces: bir e2e senaryosu — admin giriş → ürün fiyatı değiştir → müşteri menüsünde yeni fiyatı doğrula; ürünü pasifle → menüden kalktığını doğrula.

- [ ] **Step 1: playwright.config.js yaz**

Create `playwright.config.js`:

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: { baseURL: 'http://localhost:5173', ...devices['iPhone 12'] },
  webServer: [
    {
      command: 'npm run dev:server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: { ADMIN_PASSWORD: 'e2e-pass', JWT_SECRET: 'e2e-secret', DB_PATH: ':memory:', UPLOADS_DIR: 'server/uploads' },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

> Not: `DB_PATH=:memory:` her sunucu başlangıcında temiz seed verir; e2e tekrar çalıştırılabilir olur.

- [ ] **Step 2: e2e testi yaz**

Create `e2e/admin.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('admin can change a price and customer sees it', async ({ page }) => {
  // admin login
  await page.goto('/admin/login');
  await page.getByPlaceholder('Şifre').fill('e2e-pass');
  await page.getByRole('button', { name: 'Giriş' }).click();
  await expect(page.getByText('Yönetim Paneli')).toBeVisible();

  // edit first product "Fava"
  await page.getByText('Fava', { exact: true }).first().locator('..').getByRole('button', { name: 'Düzenle' }).click();
  const priceInput = page.getByPlaceholder('Fiyat (TL)');
  await priceInput.fill('1234');
  await page.getByRole('button', { name: 'Kaydet' }).click();

  // customer menu shows new price
  await page.goto('/');
  await expect(page.getByText('1234 TL')).toBeVisible({ timeout: 5000 });
});

test('admin can deactivate a product and it disappears from menu', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByPlaceholder('Şifre').fill('e2e-pass');
  await page.getByRole('button', { name: 'Giriş' }).click();
  await expect(page.getByText('Yönetim Paneli')).toBeVisible();

  // toggle "Ahtapot Salatası" to passive via its row button
  const row = page.getByText('Ahtapot Salatası').first().locator('..').locator('..');
  await row.getByRole('button', { name: 'Aktif' }).click();
  await expect(row.getByRole('button', { name: 'Pasif' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByText('Ahtapot Salatası')).toHaveCount(0);
});
```

> Not: DOM yapısı nedeniyle `locator('..')` derinliği uygulamadaki gerçek sarmalayıcılara göre ayarlanmalı; test ilk çalıştırmada `npx playwright test --debug` ile doğrulanır ve seçiciler gerekiyorsa düzeltilir.

- [ ] **Step 3: Playwright tarayıcılarını kur + scripti ekle**

```bash
npx playwright install chromium
```

`package.json` scripts'e ekle:

```json
    "test:e2e": "playwright test",
```

- [ ] **Step 4: Run e2e**

Run: `npm run test:e2e`
Expected: 2 test PASS. (Seçici hataları çıkarsa Step 2 notuna göre düzelt ve tekrar çalıştır.)

- [ ] **Step 5: Commit**

```bash
git add playwright.config.js e2e/admin.spec.js package.json
git commit -m "test(e2e): admin price change and deactivate flows"
```

---

## Self-Review Notları

- **Spec kapsamı:** Fiyat+Piyasa Fiyatı (Task 5, 14), görsel ekle/kaldır (Task 7, 11, 14), aktif/pasif (Task 5, 13), ürün CRUD (Task 5, 14), kategori CRUD (Task 6, 15), auth (Task 4, 12), public API + polling (Task 3, 10), seed (Task 2), deploy notu (spec'te kapsam dışı/ileri faz). Tümü karşılandı.
- **Tip tutarlılığı:** `is_available`/`is_market_price`/`popular`/`chef` her yerde 0/1 integer; public API `price`'ı market iken `null` döndürür ve frontend `mapItem` bunu `isMarket` olarak kullanır; admin API ham 0/1 değerleri döndürür ve formlar bunları boolean checkbox'a çevirir.
- **DB enjeksiyonu:** tüm route fabrikaları `db`/`uploadsDir`/`requireAuth` parametre alır; testler `:memory:` + geçici uploads dizini kullanır.
