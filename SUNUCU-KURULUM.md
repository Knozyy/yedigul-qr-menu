# Yedigül — Sunucu Kurulumu

## Gereksinim
- **Node.js 20+** (https://nodejs.org) — Linux örneği:
  ```
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
  ```

## Kurulum
1. Bu klasörü sunucuya kopyala (örn. `/opt/yedigul`).
2. Klasörün içinde:
   ```
   npm install
   cp .env.example .env
   nano .env        # ADMIN_PASSWORD ve JWT_SECRET'a GERÇEK değerler yaz!
   ```

## Çalıştırma
- **Linux/Mac:** `./run.sh`   (gerekirse önce: `chmod +x run.sh`)
- **Windows:**   `run.bat`

Açılan adresler:
| Adres | Ne |
|---|---|
| `http://SUNUCU_IP:3001` | Canlı menü |
| `http://SUNUCU_IP:3001/admin` | Yönetim paneli |
| `http://SUNUCU_IP:8090` | Ana sayfa (site önizlemesi) |

Güvenlik duvarında portları aç: `sudo ufw allow 3001` (ve istersen 8090).

## Kapanmadan sürekli çalışsın (Linux)
```
npm i -g pm2
npm run build
pm2 start server/index.js --name yedigul
pm2 save && pm2 startup
```

## Veri nerede?
- Menü/fiyatlar: `server/data.db` (ilk açılışta örnek menüyle kendiliğinden oluşur)
- Ürün görselleri: `server/uploads/`
- Yedek almak için bu ikisini kopyalamak yeterli.

## Paylaşımlı hosting'e (asıl site) aktarma
Panelde değişiklik yaptıktan sonra:
```
npm run export:menu
```
Sonra `public_html/` içindekileri FTP ile hosting'e yükle
(ana sayfa: `index.html`, `css/site.css`, `js/site.js`; menü: `menu/` klasörü).

## Notlar
- `.env` içinde `NODE_ENV=production` yazarsan `JWT_SECRET` boş bırakılamaz
  (güvenlik koruması — sunucu bilerek açılmaz).
- Panel şifresi `.env` içindeki `ADMIN_PASSWORD`'dür.
