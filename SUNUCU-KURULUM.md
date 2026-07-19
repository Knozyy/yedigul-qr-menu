# Yedigül — Sunucu Kurulumu

> **Üretim sağlamlık kontrolü:** yedek cron'u, SSL yenileme, systemd, firewall,
> Nginx 301 + güvenlik header'ları için `deploy/SUNUCU-CHECKLIST.md`'yi izle
> (hazır dosyalar: `deploy/db-backup.sh`, `deploy/yedigul.service`,
> `deploy/nginx-yedigul.conf`).

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

## Lokal çalıştırma
- **Linux/Mac:** `./run.sh`   (gerekirse önce: `chmod +x run.sh`)
- **Windows:**   `run.bat`

Lokal geliştirmede `full` mod kullanılır:
| Adres | Ne |
|---|---|
| `http://SUNUCU_IP:3001` | Ana sayfa (site) |
| `http://SUNUCU_IP:3001/menu/` | QR menü |
| `http://SUNUCU_IP:3001/menu/admin` | Yönetim paneli (`/admin` da buraya yönlenir) |

## Canlı çalışma: iki izole süreç

Canlıda web admin yayınlanmaz. Aynı kod ve SQLite dosyası iki süreç tarafından
kullanılır:

| Süreç | Bind | İçerik |
|---|---|---|
| `yedigul` | `127.0.0.1:3001` | Site, QR menü, `/api/menu`, `/uploads` |
| `yedigul-admin` | `127.0.0.1:3002` | Yalnız `/api/auth` ve `/api/admin` |

```bash
sudo cp deploy/yedigul.service /etc/systemd/system/yedigul.service
sudo cp deploy/yedigul-admin.service /etc/systemd/system/yedigul-admin.service
sudo systemctl daemon-reload
sudo systemctl enable --now yedigul yedigul-admin
```

`3001` ve `3002` firewall'da açılmaz. Nginx yalnız `127.0.0.1:3001` hedefine
proxy yapar; `3002` portuna yalnız kısıtlı SSH tüneli erişir.

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

Üretimde yukarıdaki iki systemd servisini kullan. Her iki servis de çökme veya
sunucu yeniden başlatma sonrasında otomatik kalkar.

## Güncelleme (deploy)
Kod GitHub'a push'landıktan sonra sunucuda tek komut:
```
cd /root/yedigul && ./update.sh
```
Sırasıyla: `git pull` → `npm ci` → `npm run build` (yalnız public menü) →
`yedigul` ve `yedigul-admin` restart → `:3001` ve `:3002` sağlık kontrolü.
İlk sefer gerekirse: `chmod +x update.sh`.

> Neden restart şart? `server/` değişiklikleri (ör. erişim modu) yalnızca
> süreç yeniden başlayınca geçerli olur; `www/` (ana sayfa + rehber sayfaları)
> statik servis edildiği için pull sonrası anında yansır, `/menu/` ise `dist/`
> derlemesini gerektirir.

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
