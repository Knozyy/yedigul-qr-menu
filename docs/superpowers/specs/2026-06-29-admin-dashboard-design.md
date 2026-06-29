# Yedigül QR Menü — Admin Dashboard Tasarımı

**Tarih:** 2026-06-29
**Durum:** Onaylandı (brainstorming)

## Amaç

Yedigül Restaurant QR menü sistemine, işletmenin menüyü kendi yönetebileceği
bir admin paneli eklemek. Çekirdek özellikler:

- Ürün fiyatı değiştirme + "Piyasa Fiyatı" (is_market_price) işaretini aç/kapa
- Ürün görseli ekleme / kaldırma (sunucuya dosya yükleme)
- Ürünü aktif/pasif yapma (menüde görünür/gizli)
- Ürün ve kategori ekleme/silme (tam CRUD)

## Mimari Kararlar

- **Backend:** Node.js + Express + `better-sqlite3` (senkron, ORM yok).
- **Veritabanı:** SQLite (`server/data.db`).
- **Auth:** Tek admin şifresi (`.env`), girişte httpOnly cookie içinde JWT.
- **Görsel:** Sunucuya dosya yükleme (`multer`), diske kaydedilir, yol DB'ye yazılır.
- **Frontend:** Mevcut React (Vite) korunur; `react-router-dom` eklenir.
- **Dev:** Vite (5173) `/api` ve `/uploads` isteklerini backend'e (3001) proxy'ler.
- **Prod:** Express hem API'yi hem build edilmiş frontend'i (`dist/`) servis eder.

### Stack sapması notu
CLAUDE.md / plan Firebase'i (Firestore + Storage + Auth + Hosting) kilitliyordu.
Kullanıcı talebiyle SQLite + Node.js backend'e geçildi. Sonuç: canlı deploy için
statik Firebase Hosting tek başına yetmez; Node çalıştıran bir ortam (Render /
Railway / VPS) gerekir. Bu, ileriki bir faz.

## Klasör Yapısı

```
server/
  index.js          # Express app; statik frontend (prod) + /uploads servis
  db.js             # better-sqlite3 bağlantısı + şema oluşturma + seed
  seed.js           # src/data/menu.js verisini DB'ye aktarır (ilk açılış)
  auth.js           # tek-şifre login, JWT doğrulama middleware
  routes/
    menu.js         # GET /api/menu (public)
    admin.js        # ürün/kategori CRUD + görsel yükleme (korumalı)
  uploads/          # yüklenen görseller (gitignore)
  data.db           # SQLite dosyası (gitignore)
src/
  pages/MenuPage.jsx          # mevcut App.jsx mantığı buraya taşınır
  pages/admin/LoginPage.jsx
  pages/admin/DashboardPage.jsx
  components/admin/
    ProductRow.jsx
    ProductForm.jsx
    CategoryForm.jsx
    ImageUploader.jsx
  context/MenuContext.jsx      # public menüyü API'den çeker (+ polling)
  context/AuthContext.jsx      # admin oturum durumu
  lib/api.js                   # fetch yardımcıları (hata + cookie yönetimi)
```

## Veritabanı Şeması (SQLite)

**categories**
| sütun | tip | not |
|-------|-----|-----|
| id | TEXT PK | mevcut id'ler (cold, hot, ...) |
| name_tr | TEXT | |
| name_en | TEXT | |
| sort | INTEGER | sıralama |
| is_active | INTEGER | 0/1 |

**products**
| sütun | tip | not |
|-------|-----|-----|
| id | TEXT PK | mevcut id'ler (fava, ...) |
| category_id | TEXT FK → categories.id | |
| name_tr | TEXT | |
| name_en | TEXT | |
| desc_tr | TEXT | |
| desc_en | TEXT | |
| price | REAL NULL | NULL veya is_market_price=1 → Piyasa Fiyatı |
| is_market_price | INTEGER | 0/1 |
| image_url | TEXT NULL | /uploads/... yolu; yoksa thumb placeholder |
| is_available | INTEGER | 0/1 (pasif = menüde gizli) |
| popular | INTEGER | 0/1 |
| chef | INTEGER | 0/1 |
| diet | TEXT (JSON) | ["gf","veg"] |
| ing_tr | TEXT (JSON) | malzemeler |
| ing_en | TEXT (JSON) | |
| alg_tr | TEXT (JSON) | alerjenler |
| alg_en | TEXT (JSON) | |
| sort | INTEGER | kategori içi sıralama |

### Seed
İlk açılışta (tablolar boşsa) `src/data/menu.js` içindeki `CATEGORIES` ve `ITEMS`
DB'ye aktarılır. Böylece menü birebir korunur, hiçbir ürün kaybolmaz.
`price == null` olan ürünler `is_market_price = 1` olarak işaretlenir.

## API Uçları

### Public
- `GET /api/menu` → `{ categories, products }`
  - Sadece `is_active=1` kategoriler ve `is_available=1` ürünler, `sort` sırasıyla.

### Auth
- `POST /api/auth/login` `{ password }` → doğruysa httpOnly cookie'de JWT, `200`.
- `POST /api/auth/logout` → cookie temizlenir.
- `GET /api/auth/me` → oturum geçerli mi (frontend guard için).

### Admin (JWT middleware ile korumalı)
- `GET /api/admin/menu` → tüm kategoriler + ürünler (pasifler dahil).
- `POST /api/admin/products` → yeni ürün.
- `PATCH /api/admin/products/:id` → fiyat, is_market_price, is_available, ad,
  açıklama, kategori, diyet, popular, chef vb. kısmi güncelleme.
- `DELETE /api/admin/products/:id` → ürünü sil (varsa görsel dosyasını da sil).
- `POST /api/admin/products/:id/image` → multipart görsel yükle; eski varsa değiştir.
- `DELETE /api/admin/products/:id/image` → görseli kaldır (dosya + image_url NULL).
- `POST /api/admin/categories`, `PATCH /api/admin/categories/:id`,
  `DELETE /api/admin/categories/:id` (içinde ürün varsa engelle / uyarı).

Tüm hatalar tutarlı JSON: `{ error: "mesaj" }` + uygun HTTP kodu.

## Frontend Akışı

### Müşteri menüsü (`MenuPage`)
- Mevcut `App.jsx` mantığı taşınır; statik `import { CATEGORIES, ITEMS }` yerine
  `MenuContext` verir (API'den `GET /api/menu`).
- Mevcut tüm bileşenler (ProductCard, BottomSheet, CategoryBar, vb.) aynı kalır;
  yalnızca veri kaynağı değişir.
- `image_url` varsa gerçek görsel render edilir; yoksa mevcut `thumb` placeholder.
- **Polling:** ~30 sn'de bir `GET /api/menu` ile sessiz yeniden çekme; fiyat/aktiflik
  değişiklikleri sayfa yenilenmeden yansır (Firebase realtime'ın sade karşılığı).
- Masa parametresi (`/masa/:id`, `?masa=`) mevcut davranışıyla korunur.

### Admin paneli (mobil & tablet öncelikli — proje kuralı)
- `/admin/login`: şifre alanı → başarılıysa `/admin`.
- `AuthContext` + route guard: cookie geçersizse login'e yönlendir.
- `DashboardPage`: kategoriye göre gruplu ürün listesi. Her satır (`ProductRow`):
  ad, fiyat / Piyasa rozeti, aktif/pasif anahtarı (anında PATCH), düzenle butonu.
- `ProductForm` (ekle/düzenle): ad + açıklama (TR/EN), fiyat + Piyasa Fiyatı
  checkbox, kategori seçimi, görünürlük, diyet/popular/chef (opsiyonel), görsel
  yükle/kaldır (`ImageUploader`).
- `CategoryForm`: kategori ekle/düzenle/sil.
- Silme işlemleri onay ister.

## Hata Yönetimi
- Görsel yüklemede tür (jpg/png/webp) ve boyut (≤ 5MB) doğrulaması; geçersizse 400.
- Frontend hataları mevcut `Toast` bileşeniyle gösterilir.
- İçinde ürün olan kategori silinmek istenirse engellenir, kullanıcı uyarılır.

## Test
- Playwright (zaten kurulu) ile temel e2e: admin giriş → ürün fiyatı değiştir →
  müşteri menüsünde yeni fiyatı gör; ürünü pasif yap → menüde kaybolduğunu gör.
- Birkaç API testi: login akışı, korumalı uçların auth'suz reddi, ürün PATCH.

## Kapsam Dışı (YAGNI)
- Çoklu admin kullanıcısı / rol yönetimi.
- Sipariş, garson çağırma, hesap isteme (ileri faz, altyapı uyumlu bırakılır).
- WebSocket/SSE ile gerçek anlık push (polling yeterli kabul edildi).
- Masaüstü responsive (proje kuralı: yalnızca mobil/tablet).
