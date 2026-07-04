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

Her şey **tek port** üzerinden çalışır:
| Adres | Ne |
|---|---|
| `http://SUNUCU_IP:3001` | Ana sayfa (site) |
| `http://SUNUCU_IP:3001/menu/` | QR menü |
| `http://SUNUCU_IP:3001/menu/admin` | Yönetim paneli (`/admin` da buraya yönlenir) |

Güvenlik duvarında portu aç: `sudo ufw allow 3001`

Alan adını bağlarken 80/443 → 3001 yönlendirmesi için nginx örneği:
```
server {
  listen 80;
  server_name yedigul.example.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```
> **Önemli:** nginx (veya herhangi bir ters vekil) arkasındaysan `.env` içinde
> `TRUST_PROXY=1` ayarla. Aksi halde tüm istekler `127.0.0.1`'den geliyormuş gibi
> görünür ve giriş hız-sınırı yanlış çalışır (bir ziyaretçi 5 hatalı denemeyle
> admin girişini herkese kapatabilir). Node'u doğrudan internete açıyorsan
> `TRUST_PROXY`'yi BOŞ bırak.

## E-posta (bülten formu) — sadece paylaşımlı hosting
Ana sitedeki bülten formu `mgonder2.asp` ile çalışır ve SMTP bilgilerini
`mail-config.asp` dosyasından okur. Bu dosya git'e girmez (parola korumak için):
1. `www/mail-config.example.asp`'yi `mail-config.asp` olarak kopyala.
2. İçine gerçek e-posta parolasını yaz (eski parola sızdıysa önce YENİLE).
3. FTP ile `www/`'e yükle. Node sunucusunda ASP çalışmaz; bu yalnız hosting içindir.

## Kapanmadan sürekli çalışsın (Linux)
```
npm i -g pm2
npm run build
pm2 start server/index.js --name yedigul
pm2 save && pm2 startup
```

## Bulut deploy (Render / Railway) — panel + API + menü
> **Netlify/Vercel/paylaşımlı ASP hosting BU SUNUCUYU çalıştıramaz.** Bu kalıcı bir
> Node/Express + SQLite servisidir; kalıcı disk ve ayakta kalan bir süreç ister.
> Statik site platformları yalnızca menünün **statik export**'unu barındırabilir
> (`npm run export:menu` → `www/menu/`), paneli değil.

Repoda `render.yaml` (Render Blueprint) ve `Procfile` (Railway/Heroku tarzı) hazır.

**Render (Blueprint):**
1. Render → **New → Blueprint**, bu GitHub reposunu seç. `render.yaml` otomatik okunur.
2. `ADMIN_PASSWORD`'ü panoda **Environment** altında elle gir (gizli; repoya yazılmaz).
   `JWT_SECRET` otomatik üretilir.
3. Deploy et. Tek URL'de her şey çalışır: `/` site, `/menu/` menü, `/menu/admin` panel.
   - **Önemli:** kalıcı disk (`/data`) **ücretli** instance ister; free tier'da disk
     yoktur ve `data.db` her deploy'da sıfırlanır (menü tohumdan yeniden kurulur,
     panel düzenlemelerin kaybolur). Kalıcı panel için `plan: starter` (veya üstü).

**Railway:**
1. New Project → Deploy from GitHub repo. Nixpacks `npm run build` + `npm start` (Procfile) çalıştırır.
2. Variables: `NODE_ENV=production`, `TRUST_PROXY=1`, `ADMIN_PASSWORD=…`, `JWT_SECRET=…`,
   `DB_PATH=/data/data.db`, `UPLOADS_DIR=/data/uploads`.
3. Bir **Volume** ekle, mount yolu `/data` (SQLite + görseller kalıcı olsun).

Her iki platform da `PORT`'u kendi verir; sunucu `process.env.PORT`'u okur. Node
kendi TLS/proxy'sinin arkasında olduğundan `TRUST_PROXY=1` gerekir (zaten ayarlı).

## Veri nerede?
- Menü/fiyatlar: `server/data.db` (ilk açılışta örnek menüyle kendiliğinden oluşur)
- Ürün görselleri: `server/uploads/`
- Yedek almak için bu ikisini kopyalamak yeterli.

## Paylaşımlı hosting'e (asıl site) aktarma
Panelde değişiklik yaptıktan sonra:
```
npm run export:menu
```
Sonra `www/` içindekileri FTP ile hosting'e yükle
(ana sayfa: `index.html`, `css/site.css`, `js/site.js`; menü: `menu/` klasörü).

## Notlar
- `.env` içinde `NODE_ENV=production` yazarsan `JWT_SECRET` boş bırakılamaz
  (güvenlik koruması — sunucu bilerek açılmaz).
- Panel şifresi `.env` içindeki `ADMIN_PASSWORD`'dür.
