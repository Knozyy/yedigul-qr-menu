# Yönetim Paneli Yeniden Tasarımı — Tasarım Dokümanı (Faz 1)

**Tarih:** 2026-07-12
**Kaynak tasarım:** Claude Design → `Yedigül Admin.dc.html`
(proje `0b65feda-d0a0-417b-b9c3-fc6866004bd6`)
**Durum:** Onaylandı (kullanıcı), uygulamaya hazır

## 1. Amaç

Mevcut React yönetim panelini (`src/pages/admin/`, `src/components/admin/`) Claude
Design mockup'ının editoryal "Boğaz" diline getirmek — menüde zaten kullanılan
lacivert/krem/altın paleti, Cormorant + Jost tipografisi, yuvarlak kartlar ve hap
butonlar. İşlevsellik gerçek SQLite/API omurgasında (`src/lib/api.js`,
`MenuContext`) kalır; mockup'ın `localStorage` deposu yalnızca referans mantığıdır.

## 2. Kapsam

**Faz 1 (bu doküman) — panel yenileme, public etkisi minimum:**
- Tasarım token katmanı + responsive kabuk (masaüstü yan menü / mobil üst bar + alt gezinme)
- 5 bölüm: Genel Bakış · Ürünler · Kategoriler · Ayarlar · QR Kod
- Ürün düzenleme sheet'i, Toplu Zam modalı (istemci tarafı)
- Yeni backend: `is_hidden` kolonu + menüde hariç tutma
- **Geçmiş (audit log) ekranı panelden kaldırılır** (veri DB'de kalır)

**Faz 2 (ayrı spec, sonra):** ürün başına görüntülenme takibi (menü tarafı olay +
istatistik) ve Genel Bakış "En Çok Görüntülenen" bölümünün gerçek veriye bağlanması.

**Kapsam dışı (yapılmayacak):**
- "Örnek Verilere Dön" / reset-to-seed özelliği — **çıkarıldı**
- Mockup'ın masaüstü "üst sekme" varyantı — tek masaüstü düzeni (yan menü)
- Mockup'ın 3 renkli aksan seçicisi — sabit marka altını `#C8902F`

## 3. Yaklaşım & ilkeler

Mevcut admin bileşenlerini **yerinde** yeniden şekillendir; test edilmiş API/auth'u
koru. Mockup'ın `DCLogic` sınıfı her handler'ın referans mantığını verir (toplu zam
yuvarlama, varyant→fiyat aralığı, tükendi metinleri) — bu mantığı gerçek API'ye
çeviririz, yeniden türetmeyiz. Bileşenler atomik ve tek sorumluluklu kalır.

## 4. Tasarım token'ları

`src/lib/theme.js` içindeki admin tema fonksiyonu (`getThemeVars`) mockup değerlerine
güncellenir (menü `getMenuThemeVars`'a dokunulmaz):

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--ink` / navy | `#0A1F35` | yan menü, giriş arka planı |
| `--ink-2` | `#0F2A46` | yükseltilmiş lacivert panel |
| `--cream` | `#FBF7ED` | sayfa arka planı |
| `--card` | `#FFFDF6` | kartlar |
| `--card-2` | `#FDFAF2` | modal |
| `--text` | `#16293D` | gövde metni |
| `--muted` | `#8A94A0` | ikincil metin |
| `--muted-2` | `#5D6C7B` | üçüncül metin |
| `--gold` (`ac`) | `#C8902F` | aksan, birincil buton |
| `--gold-dk` (`acDk`) | `#8F6318` | koyu altın |
| `--gold-lt` (`acLt`) | `#E2B45C` | açık altın (lacivert üzerinde) |
| `--gold-soft` (`acSoft`) | `#C8902F26` | yumuşak altın dolgu |
| `--danger` | `#A33B2E` | sil/tehlike |
| serif | Cormorant Garamond | başlıklar |
| sans | Jost | gövde |

Yarıçaplar: kart 16px, giriş/modal 18–20px, buton 999px (hap). Gölge:
`0 1px 2px rgba(10,31,53,0.04)`.

## 5. Kabuk & gezinme (responsive)

`src/components/admin/AdminShell.jsx` yeniden yazılır. Kırılım: `width < 780` = mobil.

- **Masaüstü (≥780):** sabit lacivert **yan menü** (238px) — logo + 5 bağlantı +
  altta "Menüyü Görüntüle" ve "Çıkış".
- **Mobil (<780):** lacivert **üst bar** (logo + menü/çıkış ikonları) + sabit
  **alt gezinme** (5 ikon). Ana içerik `padding-bottom` ile alt bara yer açar.
- Aktif bölüm: yan menüde sol altın çubuk + açık altın metin; alt gezinmede açık
  altın ikon.

Nav öğeleri (id → başlık): `home` → Genel Bakış · `items` → Ürünler ·
`cats` → Kategoriler · `settings` → Ayarlar · `qr` → QR Kod.
SVG ikon path'leri mockup'ın `NAVD` sözlüğünden alınır.

## 6. Ekranlar

Tüm veriler `GET /api/admin/menu` (`{categories, products}`) ve
`GET /api/admin/settings`'ten gelir. Yazma işlemleri mevcut endpoint'lere gider.

### 6.1 Giriş (`LoginPage.jsx`)
Mevcut JWT/cookie auth (`AuthContext`) korunur; yalnızca görünüm mockup'ın giriş
ekranına getirilir (lacivert zemin, "Y" monogram, dalga SVG, hap buton, hata satırı).

### 6.2 Genel Bakış (`home` — YENİ ekran)
Yeni bileşen `OverviewView.jsx`.
- **Hızlı işlemler** (hap butonlar): Yeni Ürün (→ items + editör), Toplu Zam
  (→ bulk modal), Duyuruyu Düzenle (→ settings), QR Kod (→ qr).
- **3 istatistik kartı:** Bugün (menü görüntülenme), Son 7 gün (toplam), Menüde
  (görünür ürün sayısı + "N ürün gizli"). İlk ikisi `GET /api/admin/stats`
  (`today.menu_view`, `week.menu_view`, `days`); üçüncüsü ürün listesinden.
- **Günün Fiyatları:** `is_market_price` ürünleri; her satır bugünkü fiyat input'u.
  Kaydet → her ürün için `PATCH /products/:id` (price alanı) ya da mevcut market-price
  akışı. Not: mockup `dailyPrices`'ı ayrı tutuyor; gerçek modelde piyasa ürününün
  `price`'ı bugünkü değere yazılır ve `price_updated_at` güncellenir (mevcut davranış).
- **7 günlük görüntülenme grafiği:** `stats.days` bar grafiği (bugün altın, diğer
  günler yumuşak altın).
- **En Çok Görüntülenen:** Faz 2'ye kadar **gizlenir** (per-item veri yok). Faz 1'de
  bu kart render edilmez.

### 6.3 Ürünler (`items` — `ProductsView.jsx` yeniden yazılır)
- Arama input'u (ad/açıklama, TR locale) + temizle.
- Kategori çipleri (Tümü + kategoriler), yatay kaydırılır.
- "Toplu Zam" ve "Yeni Ürün" butonları.
- Ürün sayısı satırı ("N ürün · M gizli").
- Liste kartı; her satır: küçük görsel (yoksa kategori placeholder — mevcut
  `src/lib/placeholder.js`), ad, **Gizli**/**Popüler** çipleri, meta (kategori · fiyat
  metni), **Tükendi** anahtarı (`is_available` tersine PATCH), Düzenle butonu.
  Gizli/tükendi satırlar `opacity:0.5`.
- Tükendi anahtarı → `PATCH /products/:id { is_available }`, toast.

### 6.4 Ürün Düzenle (sheet — `ProductForm.jsx` yeniden yazılır)
Mobilde alttan çıkan sheet, masaüstünde ortada modal. Alanlar (mockup `openEditor`/
`saveItem` mantığı):
- Ad (TR), Açıklama (TR), Kategori (select).
- Fiyat modu çipleri: **Sabit fiyat** / **Piyasa fiyatı (günlük)**.
  - Sabit: fiyat input'u (varyant varsa min varyanttan türetilir).
  - Piyasa: `is_market_price=1`, bugünkü fiyat opsiyonel.
- Porsiyon (metin), Kkal (sayı).
- **Porsiyon Seçenekleri (variants):** ad + fiyat satırları, ekle/sil. API'ye
  `variants:[{name_tr,name_en,price}]` olarak gider (EN boşsa TR'ye düşer — mevcut
  `normalizeVariants` uyumlu).
- **Rozetler:** Popüler (`popular`), Şefin Önerisi (`chef`), Glutensiz/Vejetaryen
  (`diet:['gf','veg']`).
- **Anahtarlar:** Bugün tükendi (`is_available` tersi), Menüde gizle (`is_hidden`).
- Kaydet → yeni: `POST /products`; düzenle: `PATCH /products/:id`. Sil → iki adımlı
  onay → `DELETE /products/:id`.
- Görsel yükleme mevcut `ImageUploader.jsx` ile korunur (mockup'ta yok ama işlev
  kaybedilmez — sheet içine yerleştirilir).

### 6.5 Kategoriler (`cats` — `CategoryForm.jsx` yeniden şekillendirilir)
Satırlar: sürükleme tutamağı ikonu, ad, ürün sayısı rozeti, yukarı/aşağı taşı,
yeniden adlandır (inline input), sil (yalnızca boş kategori). Ekle butonu (kesikli
hap). Mevcut endpoint'ler: `POST/PATCH/DELETE /categories`. Sıralama `sort` alanıyla.

### 6.6 Ayarlar (`settings` — `InfoPanel.jsx` yeniden şekillendirilir; `HistoryPanel` kaldırılır)
- **Duyuru** kartı: TR + EN textarea → `PUT /settings { announcement_tr, announcement_en }`
  (AR/RU mevcut değerleri korunur; panelde gösterilmez — mockup TR/EN gösteriyor).
- **İşletme Bilgileri** kartı: Wi-Fi, Telefon, Açılış, Kapanış, Instagram. Açılış+Kapanış
  → tek `info_hours` = "HH:MM – HH:MM" olarak birleştirilir (menü tek alan bekliyor).
  → `PUT /settings { info_wifi, info_phone, info_hours, info_instagram }`.
- Reset kartı **yok**.

### 6.7 QR Kod (`qr` — `QrPanel.jsx` görünümü güncellenir)
Mevcut QR üretimi/indirme korunur; kart mockup görünümüne getirilir (Yedigül başlığı +
dalga, "PNG İndir" hap butonu). Statik build'de (`VITE_STATIC`) zaten devre dışı.

### 6.8 Toplu Zam (modal — YENİ `BulkPriceModal.jsx`)
Yüzde (±, hızlı çipler %5/10/15/25), Kapsam (Tüm menü / kategori), Yuvarlama
(1/5/10/25 TL), canlı önizleme (ilk 3 + "N ürün daha"). Uygula → etkilenen her ürün
için `PATCH /products/:id { price }` (mockup formülü:
`max(1, round(p*(1+pct/100)/rd)*rd)`; varyantlı ürünlerde her varyant fiyatı da
güncellenir). Piyasa fiyatlı (price=null) ürünler etkilenmez.

## 7. Backend değişiklikleri (Faz 1)

### 7.1 `is_hidden` kolonu
- **`server/db.js`:** `products` tablosuna `is_hidden INTEGER NOT NULL DEFAULT 0`
  + `kcal`/`portion` gibi idempotent migration (`ALTER TABLE ... ADD COLUMN`).
- **`server/routes/admin.js`:**
  - `PRODUCT_FIELDS` dizisine `'is_hidden'` eklenir (PATCH kabulü).
  - INSERT kolon/değer listelerine `is_hidden` eklenir (varsayılan 0).
  - Boolean coercion listesine (`['is_market_price','is_available','popular','chef']`)
    `'is_hidden'` eklenir.
  - Audit etiket haritasına `is_hidden: 'gizli'` eklenir.
  - `GET /admin/menu` → `hydrate` tüm satır alanlarını döndürdüğü için `is_hidden`
    otomatik gelir.
- **`server/routes/menu.js`:** public sorguya `AND p.is_hidden = 0` eklenir (gizli
  ürünler menüden düşer). Tükendi (`is_available=0`) davranışı değişmez — menüde kalır.

### 7.2 Toplu zam
Yeni endpoint gerekmez; istemci tarafı ardışık `PATCH /products/:id`. (İleride tek
işlemli endpoint'e taşınabilir; Faz 1 için gerekmez.)

## 8. Dosya planı

**Yeni:**
- `src/components/admin/OverviewView.jsx` — Genel Bakış
- `src/components/admin/BulkPriceModal.jsx` — Toplu Zam
- (gerekirse) `src/components/admin/StatCard.jsx`, `src/components/admin/ViewsChart.jsx`

**Yeniden yazılır/şekillendirilir:**
- `src/pages/admin/DashboardPage.jsx` — 5 bölüm yönlendirme, Geçmiş kaldırılır
- `src/pages/admin/LoginPage.jsx`
- `src/components/admin/AdminShell.jsx` + `AdminNav.jsx` — responsive kabuk
- `src/components/admin/ProductsView.jsx`, `ProductForm.jsx`, `CategoryForm.jsx`,
  `InfoPanel.jsx`, `QrPanel.jsx`, `Section.jsx`
- `src/lib/theme.js` — `getThemeVars` token güncellemesi

**Silinir:**
- `src/components/admin/HistoryPanel.jsx` (ve import'ları)

**Backend:**
- `server/db.js`, `server/routes/admin.js`, `server/routes/menu.js`

## 9. Test & doğrulama

- **Backend testleri** (`npm run test:server`): `is_hidden` için yeni test —
  gizli ürün `PATCH` ile ayarlanır, `GET /admin/menu`'de görünür, public
  `GET /api/menu`'de görünmez. Mevcut testler geçmeye devam etmeli.
- **Build:** `npm run build` hatasız.
- **El ile doğrulama** (`npm run panel` → `:3001/menu/admin`): her ekran, editör
  sheet, toplu zam önizleme/uygula, tükendi/gizli anahtarları, mobil genişlikte
  kabuk + alt gezinme.
- **`verify` skill**: admin akışı gerçek API'de sürülür.

## 10. Riskler

- **Canlı menü:** `menu.js` sorgu değişikliği public menüyü etkiler — `is_hidden=0`
  varsayılanı sayesinde mevcut ürünler etkilenmez; test şart.
- **Statik export:** `npm run export:menu` akışı `is_hidden` filtresini de
  uygulamalı (menu.js paylaşıldığı için otomatik, doğrulanacak).
- **Toplu zam** ardışık PATCH'ler: kısmi hata durumunda toast ile bilgi; tek tek
  idempotent olduğundan tekrar denenebilir.
