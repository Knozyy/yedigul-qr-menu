# Yedigül Restaurant QR Menü Projesi

Anadolukavağı'ndaki Yedigül Balık Lokantası için QR menü + yönetim paneli.
Tek statik menü vardır: masaya özel QR, garson çağırma veya sipariş özelliği YOKTUR ve eklenmeyecektir.

## Komutlar
*   **Bağımlılıklar:** `npm install`
*   **Geliştirme (tek komut, API dahil):** `npm run dev` → tarayıcı `:5173/menu/`te açılır; API :3001'de birlikte kalkar
*   **Panel + API (build dahil):** `npm run panel` (:3001)
*   **Backend testleri:** `npm run test:server` — **E2E:** `npm run test:e2e`
*   **Statik menü export'u:** `npm run export:menu` → `www/menu/` güncellenir
*   **Hepsini tek seferde başlat:** `run.bat` (Windows) / `run.sh` (Linux)
*   **Lint:** `npm run lint`

## Teknoloji Yığını (güncel — 2026-07)
*   **Frontend:** React 19 + Vite + TailwindCSS v4 (Marin/Boğaz paleti: lacivert, krem, altın)
*   **Backend & DB:** Node.js + Express 5 + better-sqlite3 (`server/`). Firebase KULLANILMIYOR — eski plandı, vazgeçildi.
*   **Auth:** Tek şifre (`.env` → `ADMIN_PASSWORD`) + httpOnly cookie'de JWT; IP başına giriş kilidi.
*   **Görseller:** multer ile sunucuya yüklenir (`server/uploads/`).

## Veri Akışı (önemli)
*   Menünün tek gerçek kaynağı `server/data.db`; değişiklikler YÖNETİM PANELİNDEN yapılır.
*   `server/seed-data.js` yalnızca ilk kurulum tohumudur — sonradan düzenlemek hiçbir şeyi değiştirmez.
*   Canlı hosting (Classic ASP/IIS, `www/` kopyası repoda) Node çalıştıramaz; menü `npm run export:menu`
    ile statik dosyaya dökülür (`menu-data.json` + görseller) ve `menu/` klasörü FTP ile yüklenir.

## Kurallar
*   **Mobil öncelikli:** Tasarım önce telefonda doğrulanır; menü ve ana site masaüstünde de düzgün görünmelidir
    (menüde ≥1024px iki sütun). "Sadece mobil" kuralı kaldırıldı.
*   **Çok dillilik:** Menüdeki tüm içerik TR/EN destekler (kategori, ürün adı, açıklama, rozetler).
*   **Fiyatlandırma:** `is_market_price` işaretli ürünlerde fiyat yerine "Piyasa Fiyatı / Market Price" gösterilir.
*   **Kalori:** Ürünlerde `kcal` alanı vardır (yasal zorunluluk); panelde düzenlenir, menüde ve detayda gösterilir.
*   UI bileşenlerinde atomik yapı (`src/components/`), state için React Context (`src/context/`).

## Adresler (tek domain, tek port: 3001)
| Yol | Ne |
|-----|----|
| `/` | Ana site (`www/`) |
| `/menu/` | QR menü (canlı, API'den) |
| `/menu/admin` | Yönetim paneli (`/admin` buraya yönlenir) |
| `/api`, `/uploads` | API + ürün görselleri |

Uygulama her ortamda `/menu/` base'i ile build edilir (`vite.config.js`).
Geliştirmede Vite dev adresi: `http://localhost:5173/menu/`.

## Dokümanlar
*   Sunucu kurulumu / deploy: `SUNUCU-KURULUM.md`
