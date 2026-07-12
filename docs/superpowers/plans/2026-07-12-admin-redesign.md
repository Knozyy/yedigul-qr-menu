# Yönetim Paneli Yeniden Tasarımı (Faz 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut React yönetim panelini Claude Design `Yedigül Admin.dc.html` mockup'ının "Boğaz" editoryal görünümüne getir; `is_hidden` alanı ekle; Genel Bakış ve Toplu Zam ekranlarını kur.

**Architecture:** Mevcut admin bileşenleri yerinde yeniden şekillendirilir; gerçek SQLite/API (`src/lib/api.js`, `AuthContext`) korunur. Görsel kaynak-doğrusu: `docs/superpowers/specs/reference-admin-mockup.dc.html` (mockup birebir markup + `DCLogic` referans mantığı). Mockup `localStorage` kullanır; biz her handler'ı gerçek API'ye bağlarız.

**Tech Stack:** React 19 + Vite + Tailwind v4, Express 5 + better-sqlite3, Node `--test`.

## Global Constraints

- Marka aksanı sabit: `#C8902F` (mockup'ın 3-renk seçicisi kullanılmaz).
- Tipografi: başlık **Cormorant Garamond**, gövde **Jost** (menüyle aynı; `index.html` font linki zaten var, admin sayfası da yükler).
- Renkler (mockup): navy `#0A1F35`, raised `#0F2A46`, page `#FBF7ED`, card `#FFFDF6`, modal `#FDFAF2`, text `#16293D`, muted `#8A94A0`, muted-2 `#5D6C7B`, gold-dk `#8F6318`, gold-lt `#E2B45C`, danger `#A33B2E`.
- Mobil kırılımı `width < 780px`.
- **Reset / "Örnek Verilere Dön" özelliği EKLENMEZ.**
- **Geçmiş (audit log) ekranı panelden kaldırılır** (backend `/admin/history` dokunulmaz).
- Görsel markup için her UI task'ı `reference-admin-mockup.dc.html` içindeki ilgili `data-screen-label` bloğunu ve `DCLogic` metodunu kaynak alır; API bağlama bu plandaki koddur.
- Tüm yazma işlemleri mevcut endpoint'lere gider; yeni endpoint sadece gerekmiyor (toplu zam istemci tarafı).
- Her task sonunda `npm run build` hatasız olmalı.

---

## Task 1: Backend — `is_hidden` alanı + menüde hariç tutma

**Files:**
- Modify: `server/db.js` (products şeması + migration)
- Modify: `server/routes/admin.js` (`PRODUCT_FIELDS`, INSERT, boolean coercion, etiket)
- Modify: `server/routes/menu.js` (public sorgu WHERE)
- Test: `server/test/admin-hidden.test.js` (yeni)

**Interfaces:**
- Produces: `products.is_hidden` (0/1) — `GET /api/admin/menu` her üründe döndürür; `PATCH /api/admin/products/:id { is_hidden: 0|1 }` kabul eder; `POST /api/admin/products` `is_hidden` (varsayılan 0) kabul eder. Public `GET /api/menu` `is_hidden=1` ürünleri **döndürmez**.

- [ ] **Step 1: Failing test yaz** — `server/test/admin-hidden.test.js`. Mevcut testlerin kurulum desenini kopyala (`server/test/admin-categories.test.js`'e bak: app'i nasıl ayağa kaldırıyor, auth cookie'yi nasıl alıyor).

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeTestApp } from './helpers.js'; // helpers yoksa admin-categories.test.js'teki setup'ı birebir uyarla

test('is_hidden: gizli ürün adminde görünür, public menüde görünmez', async (t) => {
  const { request, seedProductId } = await makeTestApp(); // mevcut helper deseni
  // ürünü gizle
  const patch = await request('PATCH', `/api/admin/products/${seedProductId}`, { is_hidden: 1 });
  assert.equal(patch.status, 200);
  // admin menüsünde hâlâ görünür ve is_hidden=1
  const adminMenu = await request('GET', '/api/admin/menu');
  const prodAdmin = adminMenu.body.products.find((p) => p.id === seedProductId);
  assert.equal(prodAdmin.is_hidden, 1);
  // public menüde YOK
  const pub = await request('GET', '/api/menu');
  const found = pub.body.categories.some((c) => c.items.some((i) => i.id === seedProductId));
  assert.equal(found, false);
});
```

> Not: `server/test/` içinde ortak helper yoksa, `admin-categories.test.js`'in app+cookie kurulumunu bu dosyanın başına birebir kopyala (DRY'ı test kurulumuna feda etme; mevcut desen neyse onu izle).

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm run test:server`
Expected: FAIL — `is_hidden` kolonu yok / PATCH alanı reddediliyor.

- [ ] **Step 3: DB şeması + migration** — `server/db.js`. `products` CREATE TABLE'a kolon ekle (satır ~34, `portion TEXT`'ten sonra):

```js
      portion         TEXT,
      is_hidden       INTEGER NOT NULL DEFAULT 0
```

Ve mevcut migration bloğuna (kcal/portion/variants deseni, ~satır 59-66) ekle:

```js
  if (!cols.includes('is_hidden')) {
    db.exec('ALTER TABLE products ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0');
  }
```

- [ ] **Step 4: admin.js — alan kabulü** — `server/routes/admin.js`:

`PRODUCT_FIELDS` dizisine (satır 25-31) `'is_hidden'` ekle:

```js
  'is_market_price', 'is_available', 'popular', 'chef', 'is_hidden',
```

Boolean coercion listesine (PATCH içinde, ~satır 278) ekle:

```js
      else if (['is_market_price', 'is_available', 'popular', 'chef', 'is_hidden'].includes(f)) v = v ? 1 : 0;
```

INSERT kolon listesine ve VALUES'a `is_hidden` ekle (satır 211-220 civarı); create body coercion'ında (satır 236 civarı, `is_available` deseni) ekle:

```js
        is_hidden: b.is_hidden ? 1 : 0,
```

Audit etiket haritasına (satır 74) ekle: `is_hidden: 'gizli'`. `is_available` etiket satırına (satır 89) benzer bir "gizlendi/görünür" satırı istersen ekle (opsiyonel).

- [ ] **Step 5: menu.js — public hariç tutma** — `server/routes/menu.js`, public ürün sorgusundaki WHERE'e (satır ~95, `WHERE p.is_available = 1 AND c.is_active = 1`) ekle:

```sql
         WHERE p.is_available = 1 AND p.is_hidden = 0 AND c.is_active = 1
```

- [ ] **Step 6: Testleri çalıştır, geçtiğini gör**

Run: `npm run test:server`
Expected: PASS (yeni test + tüm mevcut testler).

- [ ] **Step 7: Commit**

```bash
git add server/db.js server/routes/admin.js server/routes/menu.js server/test/admin-hidden.test.js
git commit -m "feat(admin): urunlere is_hidden alani + menude haric tutma"
```

---

## Task 2: Admin tasarım token'ları

**Files:**
- Modify: `src/lib/theme.js` (yeni `getAdminThemeVars`)

**Interfaces:**
- Produces: `getAdminThemeVars(): Record<string,string>` — mockup token seti. Kabuk bu değişkenleri kök admin sarmalayıcıya uygular. Değişkenler: `--ink`, `--ink-2`, `--cream`, `--card`, `--card-2`, `--text`, `--muted`, `--muted-2`, `--gold`, `--gold-dk`, `--gold-lt`, `--gold-soft`, `--danger`.

- [ ] **Step 1: `getAdminThemeVars` ekle** — `src/lib/theme.js` sonuna:

```js
// Yönetim paneli ("Boğaz" editoryal) token'ları — tek mod (krem sayfa + lacivert kabuk).
// Menü getMenuThemeVars ve eski getThemeVars'a dokunulmaz.
export function getAdminThemeVars() {
  const gold = '#C8902F';
  return {
    '--ink': '#0A1F35',
    '--ink-2': '#0F2A46',
    '--cream': '#FBF7ED',
    '--card': '#FFFDF6',
    '--card-2': '#FDFAF2',
    '--text': '#16293D',
    '--muted': '#8A94A0',
    '--muted-2': '#5D6C7B',
    '--gold': gold,
    '--gold-dk': '#8F6318',
    '--gold-lt': '#E2B45C',
    '--gold-soft': `${gold}26`,
    '--danger': '#A33B2E',
  };
}
```

- [ ] **Step 2: Build** — Run: `npm run build`. Expected: hatasız (fonksiyon henüz kullanılmıyor, sadece export).

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.js
git commit -m "feat(admin): getAdminThemeVars tasarim token'lari"
```

---

## Task 3: Kabuk & gezinme (AdminShell + AdminNav)

**Files:**
- Modify: `src/components/admin/AdminShell.jsx`
- Modify: `src/components/admin/AdminNav.jsx`

**Interfaces:**
- Consumes: `getAdminThemeVars()` (Task 2). Auth: `onLogout` prop.
- Produces: `<AdminShell view onSelectView onLogout children />` — masaüstü lacivert yan menü (238px), mobil (<780px) lacivert üst bar + sabit alt gezinme. `NAV_ITEMS` = `[{id:'home',label:'Genel Bakış',d}, {id:'items',label:'Ürünler',d}, {id:'cats',label:'Kategoriler',d}, {id:'settings',label:'Ayarlar',d}, {id:'qr',label:'QR Kod',d}]` — SVG path `d` değerleri mockup `NAVD` sözlüğünden (reference dosyasında `const NAVD = {...}`).

- [ ] **Step 1: `NAV_ITEMS` güncelle** — `AdminNav.jsx`. Referans dosyadaki `NAVD` sözlüğünü (grep `const NAVD`) kopyala; `NAV_ITEMS`'ı 5 öğeye getir (home/items/cats/settings/qr), her birine `d` (SVG path) ekle. `history` ve `info` eski id'lerini kaldır; `info`→`settings`, yeni `home`.

- [ ] **Step 2: `AdminNav` görünüm** — aktif durum stilleri mockup'tan (yan menü: sol `3px` altın çubuk + `--gold-lt` metin + `rgba(255,255,255,0.06)` zemin; alt gezinme: `--gold-lt` ikon). Referans: `data-screen-label="Yan Menü"` ve `data-screen-label="Alt Gezinme"` blokları.

- [ ] **Step 3: `AdminShell` yeniden yaz** — kök sarmalayıcıya `style={getAdminThemeVars()}` uygula; `background:'var(--cream)'; color:'var(--text)'`. Masaüstü: `flex` satır, lacivert `<aside>` (238px, `var(--ink)`), logo (Y monogram + "Yedigül / Yönetim Paneli"), `AdminNav variant="side"`, altta "Menüyü Görüntüle" (`href="/menu/"`) + "Çıkış" (`onLogout`). Mobil: lacivert üst bar + `main` (padding-bottom 110px) + sabit alt gezinme (`AdminNav variant="bottom"`). Kırılım: `useState(window.innerWidth)` + `resize` dinleyici, `isMobile = width < 780`. Başlık/alt başlık `pageTitle`/`pageSub` mockup `TITLES` sözlüğünden gelir — bunu `AdminShell` yerine `DashboardPage`'in içerik başlığında göster (Task 5). Şimdilik `AdminShell` sadece kabuk + nav.

> Markup birebir: referans dosyadaki `data-screen-label="Yan Menü"`, `"Mobil Üst Bar"`, `"Alt Gezinme"` blokları. Inline `style-hover`/`{{ }}` yer tutucularını gerçek React className/style'a çevir; `{{ n.d }}` → `item.d`, `{{ acLt }}` → `var(--gold-lt)` vb.

- [ ] **Step 4: Build + el ile bak** — Run: `npm run build` (hatasız). Sonra `npm run panel` → `http://localhost:3001/menu/admin` → masaüstünde yan menü, tarayıcıyı daraltınca alt gezinme görünmeli. (İçerik henüz eski; bu task sadece kabuk.)

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminShell.jsx src/components/admin/AdminNav.jsx
git commit -m "feat(admin): mockup lacivert yan menu + mobil alt gezinme kabugu"
```

---

## Task 4: Giriş ekranı (LoginPage)

**Files:**
- Modify: `src/pages/admin/LoginPage.jsx`

**Interfaces:**
- Consumes: `useAuth().login(password)` (mevcut), `getAdminThemeVars()`.

- [ ] **Step 1: Yeniden şekillendir** — lacivert (`#0A1F35`) tam ekran, ortalanmış: "Y" monogram dairesi, "Yedigül" (Cormorant) + "YÖNETİM PANELİ" etiketi, dalga SVG, `#0F2A46` kart içinde şifre input'u (hap buton "Giriş Yap"), hata satırı (`Şifre hatalı, tekrar deneyin.`). `login(pw)` başarısızsa hata göster. Referans: `data-screen-label="Giriş"`. **Demo şifre satırını ("Demo şifresi: 2180") EKLEME** — gerçek panel.

- [ ] **Step 2: Build + doğrula** — Run: `npm run build`. `npm run panel` → çıkış yap → giriş ekranı mockup görünümünde; yanlış şifre hata, doğru şifre panele girer.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/LoginPage.jsx
git commit -m "feat(admin): giris ekrani mockup gorunumu"
```

---

## Task 5: DashboardPage — 5 bölüm yönlendirme, Geçmiş kaldırma

**Files:**
- Modify: `src/pages/admin/DashboardPage.jsx`
- Delete: `src/components/admin/HistoryPanel.jsx`

**Interfaces:**
- Consumes: `AdminShell` (Task 3), `getAdminThemeVars`. Veri: `api.get('/admin/menu')` → `{categories, products}`.
- Produces: `view ∈ {'home','items','cats','settings','qr'}`; içerik başlığı `pageTitle`/`pageSub` (mockup `TITLES`). `home` → `OverviewView` (Task 6), `items` → `ProductsView`, `cats` → `CategoryForm`, `settings` → `SettingsView`(InfoPanel, Task 11), `qr` → `QrPanel`. Editör (`ProductForm`) ve `BulkPriceModal` overlay olarak açılır.

- [ ] **Step 1: Yönlendirmeyi güncelle** — `view` başlangıcı `'home'`. `TITLES` sözlüğünü mockup'tan ekle. İçerik üstüne başlık bloğu (`h2` Cormorant + alt başlık) ekle. `history` view'ini ve `HistoryPanel` import'unu kaldır. `info`→`settings`. Editör açma: `editing` state (ürün | 'new' | null) → `<ProductForm>` overlay. `bulk` state → `<BulkPriceModal>` overlay. `getAdminThemeVars()` uygula (AdminShell zaten uyguluyorsa tekrarlama).

- [ ] **Step 2: HistoryPanel sil** — `git rm src/components/admin/HistoryPanel.jsx`; kalan import referansı olmadığını doğrula (`grep -rn HistoryPanel src/`).

- [ ] **Step 3: Build** — Run: `npm run build`. Expected: hatasız (OverviewView/BulkPriceModal/SettingsView henüz basit stub olabilir; sonraki task'lar doldurur — stub'lar minimal `<div>` döndürsün ki build kırılmasın).

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/DashboardPage.jsx
git rm src/components/admin/HistoryPanel.jsx
git commit -m "feat(admin): 5 bolum yonlendirme, Gecmis ekrani kaldirildi"
```

---

## Task 6: Genel Bakış (OverviewView)

**Files:**
- Create: `src/components/admin/OverviewView.jsx`

**Interfaces:**
- Consumes: `products`, `categories` (props), `api.get('/admin/stats')` → `{today:{menu_view}, week:{menu_view}, days:[{day,menu_view,qr_scan}]}`. `onQuick(action)` (parent: 'newItem'|'bulk'|'settings'|'qr'). `onSaveDaily(map)`.
- Produces: Genel Bakış ekranı. **"En Çok Görüntülenen" kartı Faz 1'de render edilmez** (per-item veri yok).

- [ ] **Step 1: Bileşeni oluştur** — Referans: `data-screen-label="Genel Bakış"` + `DCLogic` `if (s.page === 'home')` bloğu.
  - **Hızlı işlemler:** 4 hap buton (Yeni Ürün→`onQuick('newItem')`, Toplu Zam→`onQuick('bulk')`, Duyuruyu Düzenle→`onQuick('settings')`, QR Kod→`onQuick('qr')`).
  - **3 istatistik kartı:** `stats.today.menu_view` (Bugün), `stats.week.menu_view` (Son 7 gün), görünür ürün sayısı `products.filter(p=>!p.is_hidden).length` + "N ürün gizli". `useEffect` ile `api.get('/admin/stats')`.
  - **Günün Fiyatları:** `products.filter(p => p.is_market_price)` satırları; her satırda bugünkü fiyat input'u (kontrollü, local `draft` state). "Fiyatları Kaydet" → `onSaveDaily(draft)` (parent her ürün için `PATCH /admin/products/:id { price }`; boş → market fiyatı kalır).
  - **7 günlük grafik:** `stats.days` son 7 gün bar grafiği (bugün `--gold`, diğerleri `--gold-soft`). Gün etiketi kısaltmaları mockup `GUNK`.
  - Stats yüklenmediyse kartlarda `—` göster.

- [ ] **Step 2: Parent bağla** — `DashboardPage`'de `onQuick`, `onSaveDaily` uygula. `onSaveDaily`: `for (id,val) of draft: if val>0: await api.patch('/admin/products/'+id, { price: Number(val) })`; sonra `reload()` + toast "Günün fiyatları kaydedildi".

- [ ] **Step 3: Build + doğrula** — Run: `npm run build`. `npm run panel` → Genel Bakış: kartlar, grafik, piyasa ürünleri fiyat girişi çalışır.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/OverviewView.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(admin): Genel Bakis ekrani (istatistik + gunun fiyatlari + grafik)"
```

---

## Task 7: Toplu Zam (BulkPriceModal)

**Files:**
- Create: `src/components/admin/BulkPriceModal.jsx`

**Interfaces:**
- Consumes: `products`, `categories` (props), `onClose()`, `onApplied()` (parent reload+toast).
- Produces: overlay modal (mobilde alttan sheet, masaüstünde ortada). Uygula → istemci tarafı ardışık PATCH.

- [ ] **Step 1: Bileşeni oluştur** — Referans: `data-screen-label="Toplu Zam"` + `DCLogic` `applyBulk`/`if (s.bulk)` blokları.
  - State: `pct` ('10'), `scope` ('all' | categoryId), `round` ('5').
  - Yüzde ± butonları, hızlı çipler %5/10/15/25, Kapsam select (Tüm menü + kategoriler), Yuvarlama select (1/5/10/25 TL).
  - Etkilenen ürünler: `price != null` olan (piyasa/`is_market_price` hariç) ve kapsama uyanlar. Varyantlı ürünlerde her varyant fiyatı da güncellenir.
  - Formül (mockup birebir): `next = Math.max(1, Math.round(p*(1+pct/100)/rd)*rd)`.
  - Canlı önizleme: ilk 3 ürün (eski→yeni) + "+N ürün daha".
  - "Uygula · N ürün" → etkilenen her ürün için `await api.patch('/admin/products/'+it.id, { price: next, ...(it.variants? {variants: newVariants}:{}) })`; sonra `onApplied()`.
  - Hata durumunda kalanları dene, sonda toast'ta kaç ürün güncellendiğini bildir.

- [ ] **Step 2: Parent bağla** — `DashboardPage` `bulk` state; `onApplied` → `reload()` + toast "N ürünün fiyatı güncellendi".

- [ ] **Step 3: Build + doğrula** — Run: `npm run build`. `npm run panel` → Ürünler/Genel Bakış'tan Toplu Zam aç, önizleme doğru, uygula fiyatları değiştirir.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/BulkPriceModal.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(admin): Toplu Zam modali (istemci tarafi yuzde + yuvarlama)"
```

---

## Task 8: Ürünler ekranı (ProductsView)

**Files:**
- Modify: `src/components/admin/ProductsView.jsx`

**Interfaces:**
- Consumes: `categories`, `products` (props), `onEdit(product|'new')`, `onReload`, `onError`, `onBulk()`. `api.patch`, `src/lib/placeholder.js` (kategori placeholder görseli).
- Produces: arama + kategori çipleri + Toplu Zam/Yeni Ürün butonları + ürün listesi (sold-out toggle, hidden/popular çipleri).

- [ ] **Step 1: Yeniden şekillendir** — Referans: `data-screen-label="Ürünler"` + `DCLogic` `if (s.page === 'items')`.
  - Arama input'u (hap, TR locale filtre: ad+açıklama), temizle butonu.
  - Kategori çipleri: Tümü + kategoriler, yatay kaydırma, aktif altın.
  - "Toplu Zam" (→`onBulk()`) ve "Yeni Ürün" (→`onEdit('new')`) butonları.
  - Sayaç: "N ürün · M gizli".
  - Liste kartı satırları: görsel (`p.image_url || placeholderFor(p.category_id)`), ad, **Gizli** çipi (`p.is_hidden`), **Popüler** çipi (`p.popular`), meta (kategori adı · fiyat metni), **Tükendi** toggle (`!p.is_available` gösterimi; tıkla → `api.patch('/admin/products/'+p.id,{is_available: p.is_available?0:1})` → `onReload()`), Düzenle butonu (→`onEdit(p)`). Gizli/tükendi satır `opacity:0.5`.
  - Fiyat metni: varyant varsa min–max; `is_market_price` ise "Piyasa fiyatı"; yoksa "N TL".

- [ ] **Step 2: Build + doğrula** — Run: `npm run build`. `npm run panel` → arama/çip filtre, tükendi toggle anında yansır, gizli/popüler çipleri doğru.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ProductsView.jsx
git commit -m "feat(admin): Urunler ekrani (arama, cipler, tukendi/gizli/populer)"
```

---

## Task 9: Ürün Düzenle sheet (ProductForm)

**Files:**
- Modify: `src/components/admin/ProductForm.jsx`

**Interfaces:**
- Consumes: `product` (null=yeni), `categories`, `onSaved`, `onCancel`. `api.post/patch/del`, `ImageUploader.jsx`.
- Produces: mobilde alttan sheet / masaüstünde ortada modal; tüm ürün alanları + `is_hidden` toggle.

- [ ] **Step 1: Yeniden şekillendir** — Referans: `data-screen-label="Ürün Düzenleme"` + `DCLogic` `openEditor`/`saveItem`.
  - Alanlar: Ad (TR), Açıklama (TR), Kategori select, fiyat modu çipleri (Sabit / Piyasa), fiyat input'u (sabit) / bugünkü fiyat (piyasa), Porsiyon, Kkal.
  - **Porsiyon Seçenekleri (variants):** ad+fiyat satırları ekle/sil. API'ye `variants:[{name_tr, name_en:name_tr, price:Number}]`.
  - **Rozetler:** Popüler (`popular`), Şefin Önerisi (`chef`), Glutensiz/Vejetaryen (`diet:['gf','veg']`).
  - **Anahtarlar:** Bugün tükendi (`is_available` tersi), Menüde gizle (`is_hidden`).
  - **Görsel:** mevcut `ImageUploader` sheet içinde (mockup'ta yok ama işlev korunur — Ad'ın üstüne veya altına yerleştir).
  - Kaydet: yeni → `api.post('/admin/products', body)`; düzenle → `api.patch('/admin/products/'+id, body)`. Body EN alanları: EN boşsa TR'ye eşitle (mockup deseni). Sil: iki adımlı onay → `api.del('/admin/products/'+id)`.
  - `onSaved()` → parent reload + toast.

- [ ] **Step 2: Build + doğrula** — Run: `npm run build`. `npm run panel` → yeni ürün ekle, düzenle, varyant ekle/sil, gizle toggle, sil onayı; menüde gizli ürün görünmemeli (public `/menu/`).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ProductForm.jsx
git commit -m "feat(admin): Urun duzenle sheet (varyant, rozet, tukendi/gizle)"
```

---

## Task 10: Kategoriler (CategoryForm)

**Files:**
- Modify: `src/components/admin/CategoryForm.jsx`

**Interfaces:**
- Consumes: `categories`, `products` (sayım için), `onChanged`. `api.post/patch/del`.

- [ ] **Step 1: Yeniden şekillendir** — Referans: `data-screen-label="Kategoriler"` + `DCLogic` `if (s.page === 'cats')`/`moveCat`/`commitCatName`.
  - Satır: tutamak ikonu, ad, ürün sayısı rozeti, yukarı/aşağı (`sort` güncelle → `api.patch`), yeniden adlandır (inline input → `api.patch`), sil (yalnızca boş kategori → `api.del`; dolu ise toast "Yalnızca boş kategoriler silinebilir").
  - "Yeni Kategori" kesikli hap → `api.post('/admin/categories', {...})` + inline rename moduna gir.
  - Uç durum: ilk/son satırda taşıma butonu `opacity:0.3`.

- [ ] **Step 2: Build + doğrula** — Run: `npm run build`. `npm run panel` → ekle/adlandır/sırala/sil çalışır, menü sıralaması yansır.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/CategoryForm.jsx
git commit -m "feat(admin): Kategoriler ekrani mockup gorunumu"
```

---

## Task 11: Ayarlar (SettingsView / InfoPanel)

**Files:**
- Modify: `src/components/admin/InfoPanel.jsx` (Ayarlar'a dönüşür)

**Interfaces:**
- Consumes: `api.get('/admin/settings')`, `api.put('/admin/settings', {...})`.

- [ ] **Step 1: Yeniden şekillendir** — Referans: `data-screen-label="Ayarlar"` (reset kartı HARİÇ) + `DCLogic` `saveAnn`/`saveInfo`.
  - **Duyuru kartı:** TR + EN textarea → `api.put('/admin/settings', { announcement_tr, announcement_en })`. AR/RU değerlerine dokunma (PUT'a dahil etme; sunucu sadece gönderilen anahtarları günceller).
  - **İşletme Bilgileri kartı:** Wi-Fi, Telefon, Açılış, Kapanış, Instagram. Açılış+Kapanış → tek `info_hours = "HH:MM – HH:MM"` birleştir → `api.put('/admin/settings', { info_wifi, info_phone, info_hours, info_instagram })`. Yükleme: `info_hours`'u " – " ile ayırıp açılış/kapanışa doldur.
  - **Reset kartı EKLENMEZ.**
  - Kaydet butonları toast gösterir.

- [ ] **Step 2: Build + doğrula** — Run: `npm run build`. `npm run panel` → duyuru + bilgiler kaydedilir; menüde duyuru şeridi ve iletişim bilgileri yansır.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/InfoPanel.jsx
git commit -m "feat(admin): Ayarlar ekrani (duyuru + isletme bilgileri)"
```

---

## Task 12: QR Kod (QrPanel) görünümü

**Files:**
- Modify: `src/components/admin/QrPanel.jsx`

**Interfaces:**
- Consumes: mevcut QR üretim/indirme mantığı (dokunma). `getAdminThemeVars`.

- [ ] **Step 1: Yeniden şekillendir** — Referans: `data-screen-label="QR Kod"`. Kart: Yedigül başlığı + dalga SVG, "Menü için okutun", QR görseli, URL, "PNG İndir" hap butonu. QR üretim/indirme fonksiyonlarını değiştirme, yalnızca sarmalayıcı görünümü.

- [ ] **Step 2: Build + doğrula** — Run: `npm run build`. `npm run panel` → QR ekranı mockup görünümü, indirme çalışır.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/QrPanel.jsx
git commit -m "feat(admin): QR Kod ekrani mockup gorunumu"
```

---

## Task 13: Uçtan uca doğrulama + toast + kapanış

**Files:**
- Modify: `src/components/Toast.jsx` (gerekiyorsa mockup toast görünümü), `src/components/admin/Section.jsx` (artık kullanılmıyorsa sil)

- [ ] **Step 1: Toast görünümü** — Referans: `data-screen-label` yok ama `DCLogic` toast bloğu (`hasToast`): lacivert hap, altın onay ikonu, alttan ortalanmış (mobilde 86px, masaüstünde 28px). Mevcut `Toast.jsx`'i buna getir.

- [ ] **Step 2: Ölü kod temizliği** — `grep -rn "Section\b\|ProductCard" src/components/admin` ile artık kullanılmayan admin bileşenlerini tespit et; kullanılmıyorsa sil (yalnızca gerçekten referanssızsa).

- [ ] **Step 3: Backend testleri + build** — Run: `npm run test:server` (PASS) ve `npm run build` (hatasız).

- [ ] **Step 4: `verify` skill ile uçtan uca** — `npm run panel` → giriş → 5 ekran → ürün ekle/düzenle/gizle/tükendi → toplu zam → kategori sırala → ayar kaydet → QR indir. Mobil genişlikte kabuk + alt gezinme. Public `/menu/`'de gizli ürün YOK, tükendi ürün soluk görünür.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(admin): toast gorunumu + olu kod temizligi, Faz 1 kapanis"
```

---

## Self-Review Notları
- Spec kapsam maddeleri karşılandı: token (T2), kabuk (T3), giriş (T4), 5 ekran (T5-12), editör (T9), toplu zam (T7), is_hidden (T1), Geçmiş kaldırma (T5), reset yok (hiçbir task'ta yok). ✓
- Faz 2 (per-item görüntülenme) bilinçli olarak dışarıda; Genel Bakış "En Çok Görüntülenen" T6'da render edilmiyor. ✓
- Görsel markup DRY: her UI task'ı tek kaynağı (`reference-admin-mockup.dc.html`) işaret eder; plan yalnızca API bağlama kodunu içerir. ✓
