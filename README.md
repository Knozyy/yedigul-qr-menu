# Yedigül — QR Menü & Yönetim Paneli

Anadolukavağı'ndaki **Yedigül Balık Lokantası** için tek statik QR menü, TR/EN/AR/RU dil desteği
ve ürün/fiyat/kalori yönetimi yapılan bir admin paneli.

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env   # ADMIN_PASSWORD ve JWT_SECRET'ı doldur
./run.sh               # Windows: run.bat — her şeyi tek seferde başlatır
```

Lokal geliştirmede her şey tek port üzerinden çalışır:

| Adres | Ne |
|-------|----|
| `http://localhost:3001` | Ana site |
| `http://localhost:3001/menu/` | QR menü |
| `http://localhost:3001/admin/` | Yönetim paneli |

Canlıda iki süreç vardır: public süreç (`127.0.0.1:3001`) site ve menüyü,
private süreç (`127.0.0.1:3002`) admin API'sini ve `www.yedigulrestorant.com/admin/`
yönetim panelini sunar. Panel nginx IP listesi ve istek sınırıyla korunur.
Ayrıntı: **[deploy/YONETIM-PANELI.md](deploy/YONETIM-PANELI.md)**

## Mimari (kısaca)

*   **Menü:** React 19 + Vite + Tailwind v4 (`src/`)
*   **Yönetim paneli:** React 19 + Vite, düz CSS (`panel/` arayüz, `server/panel/` sunucu katmanı);
    ayrı derlenir (`dist-panel/`), menü paketine girmez
*   **API:** Node + Express 5 + SQLite (`server/`, veri: `server/data.db`, görseller: `server/uploads/`)
*   **Canlı site:** Statik paylaşımlı hosting (`www/` FTP ile yüklenir). Node çalıştıramadığı için
    menü statik export edilir:

```bash
npm run export:menu    # www/menu/ güncellenir → 'menu' klasörünü FTP ile yükle
```

Menünün tek gerçek kaynağı veritabanıdır; ürünler **yönetim panelinden** düzenlenir.
`server/seed-data.js` yalnızca ilk kurulumda boş veritabanını doldurur.

## Testler

```bash
npm run test:server    # backend (node --test)
npm run test:e2e       # Playwright, iPhone 12 + masaüstü dil/RTL akışları
```

## Sunucu Kurulumu

Kendi sunucusuna (Linux + Node 20+) kurulum, iki systemd servisi ve güncelleme
akışı için: **[SUNUCU-KURULUM.md](SUNUCU-KURULUM.md)** — yönetim paneli için:
**[deploy/YONETIM-PANELI.md](deploy/YONETIM-PANELI.md)**

Proje kuralları ve ayrıntılı mimari notları: **[CLAUDE.md](CLAUDE.md)**
