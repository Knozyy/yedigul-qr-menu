# Yedigül — QR Menü & Yönetim Paneli

Anadolukavağı'ndaki **Yedigül Balık Lokantası** için tek statik QR menü, TR/EN dil desteği
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
| `http://localhost:3001/menu/admin` | Yönetim paneli |

Canlı ortamda yönetim paneli internete sunulmaz. Public süreç yalnızca
`127.0.0.1:3001` üzerinde site/menü API'sini, private süreç yalnızca
`127.0.0.1:3002` üzerinde auth/admin API'sini çalıştırır. Private porta
`Yediguladmin` uygulamasının kısıtlı SSH tüneli üzerinden erişilir.

## Mimari (kısaca)

*   **Menü:** React 19 + Vite + Tailwind v4 (`src/`); üretim build'inde eski web admin pakete girmez
*   **API:** Node + Express 5 + SQLite (`server/`, veri: `server/data.db`, görseller: `server/uploads/`)
*   **Lokal yönetim:** `C:\Users\kanad\Desktop\Yediguladmin` → SSH tüneli → private API
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
npm run test:e2e       # Playwright, iPhone 12 viewport
```

## Sunucu Kurulumu

Kendi sunucusuna (Linux + Node 20+) kurulum, iki systemd servisi ve güncelleme
akışı için: **[SUNUCU-KURULUM.md](SUNUCU-KURULUM.md)**

Proje kuralları ve ayrıntılı mimari notları: **[CLAUDE.md](CLAUDE.md)**
