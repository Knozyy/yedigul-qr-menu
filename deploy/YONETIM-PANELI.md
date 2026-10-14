# Yönetim Paneli — www.yedigulrestorant.com/admin/

Yönetim paneli bu reponun parçasıdır: arayüz `panel/`, sunucu katmanı
`server/panel/`. Canlıda admin API'siyle **aynı süreçte** (`yedigul-admin`,
`127.0.0.1:3002`) çalışır. Ayrı bir uygulama, kurulum ya da SSH tüneli yoktur.

## Genel yapı

```
        İNTERNET
           │
    ┌──────┴───────┐
    │  Cloudflare  │  www.yedigulrestorant.com
    └──────┬───────┘
           │
    ┌──────┴────────────────────── SUNUCU ───────────────────────────┐
    │  nginx                                                         │
    │   ├─ /admin/ → [IP listesi + istek sınırı]                     │
    │   │             → yedigul-admin 127.0.0.1:3002                 │
    │   │                 ├─ /admin/     yönetim paneli              │
    │   │                 └─ /api/admin  admin API (dışarıya kapalı) │
    │   │                        │                                   │
    │   └─ diğer   → yedigul 127.0.0.1:3001 (site + menü)            │
    │                        │                                       │
    │                server/data.db + uploads/ (ikisi de kullanır)   │
    └────────────────────────────────────────────────────────────────┘
```

| Servis | Port | Ne sunar |
|---|---|---|
| `yedigul` | 3001 | Ana site, QR menü, `/api/menu`, `/uploads`. Sadece okur. |
| `yedigul-admin` | 3002 | Yönetim paneli (`/admin/`) ve admin API'si. Veritabanına yazan tek servis. |

nginx bu sürece sadece `/admin/` yolunu iletir. Aynı süreçteki `/api/auth` ve
`/api/admin` dışarıdan erişilemez; panel onlara süreç içinden, loopback
üzerinden bağlanır.

## Koruma katmanları

Bir istek panele ulaşana kadar sırayla şunlardan geçer:

| # | Nerede | Ne yapar | Geçemezse |
|---|---|---|---|
| 1 | nginx | IP izinli listede mi? | 403 |
| 2 | nginx | IP başına istek sınırı: genel 10/sn (anlık 40), giriş 5/dk | 429 |
| 3 | panel | IP'yi bir kez daha kontrol eder (`ALLOWED_IPS`) | 403 |
| 4 | panel | Host, Origin ve CSRF anahtarı doğru mu? | 403 |
| 5 | panel | Şifre doğru mu? 5 hatalı denemede IP 15 dakika kilitlenir | 401 / 429 |

IP kontrolünün iki yerde yapılmasının sebebi şu: nginx ayarı yanlışlıkla
silinse ya da bozulsa bile panel kapalı kalır. `PUBLIC_HOST` dolu ama
`ALLOWED_IPS` boşsa süreç bilerek başlamaz.

## Panele girerken ne oluyor

1. Tarayıcıda `www.yedigulrestorant.com/admin/` adresi açılır.
2. **Cloudflare**, ziyaretçinin gerçek IP'sini nginx'e iletir. nginx bu bilgiye
   sadece Cloudflare'in kendi adreslerinden gelen isteklerde güvenir.
3. **nginx IP'ye bakar.** Restoran ya da ev IP'si değilse sayfa hiç açılmaz ve
   403 verir. Mobil veriden girmeye çalışan biri giriş ekranını bile göremez.
4. IP izinliyse **giriş ekranı** açılır ve `.env` dosyasındaki
   `ADMIN_PASSWORD` şifresi girilir.
5. Panel şifreyi admin API'ye gönderir. Şifre doğruysa API bir anahtar (JWT)
   döner. Panel bu anahtarı **sunucu belleğinde tutar ve tarayıcıya hiç
   göndermez.** Tarayıcıda sadece rastgele bir oturum çerezi kalır. Bu çerez
   yalnız `/admin` yoluna gönderilir, ana siteye ve menüye gitmez.

## Ürün düzenlerken ne oluyor

```
Fiyatı değiştir → panel (CSRF ve köken kontrolü) → admin API → data.db + audit_log
```

- Kaydedilen değişiklik **anında canlıya çıkar**, çünkü menü aynı
  veritabanından okur. Ekstra bir yayınlama adımı yok.
- Her değişiklik geçmiş kaydına (`audit_log`) yazılır.
- Yüklenen görseller `server/uploads/` klasörüne gider ve menüde hemen görünür.

## Kurulum

### 1. `.env`

`/root/yedigul/.env` dosyasına (iki servis de bu dosyayı okur) ekle:

```dotenv
PUBLIC_HOST=www.yedigulrestorant.com
ALLOWED_IPS=88.1.2.3,95.4.5.6
PANO_DB_PATH=/var/lib/yedigul/pano.db
```

İzinli IP'leri öğrenmek için restoranın ve evin internetinden (Wi-Fi'ye
bağlıyken): `curl -4 https://ifconfig.me`

İsteğe bağlı pano ve çeviri anahtarları (`IG_*`, `GA4_*`, `PLACES_*`,
`GEMINI_*`) için `.env.example` dosyasına bak. Boş kalırsa ilgili kart "bağlı
değil" görünür, panelin geri kalanı çalışır.

```bash
mkdir -p /var/lib/yedigul
```

### 2. Derle ve yeniden başlat

```bash
cd /root/yedigul && ./update.sh
```

`update.sh` menüyü ve paneli derler, iki servisi yeniden başlatır ve
`127.0.0.1:3002/admin/` adresinin 200 döndüğünü kontrol eder.

### 3. nginx

`/admin/` bloğu, istek sınırları ve Cloudflare gerçek-IP ayarı
`deploy/nginx-yedigul.conf` içinde:

```bash
cp /root/yedigul/deploy/nginx-yedigul.conf /etc/nginx/sites-available/yedigulrestorant.com
nano /etc/nginx/sites-available/yedigulrestorant.com
#   - sertifika yollarını doğrula
#   - location /admin/ içindeki "allow" satırlarına 1. adımdaki IP'leri yaz
nginx -t && systemctl reload nginx
```

`nginx -t` hata verirse **reload yapma**; çalışan ayar bozulmaz.

## IP eklemek / çıkarmak

İki yerde de değiştir:

1. `/etc/nginx/sites-available/yedigulrestorant.com` → `allow` satırı →
   `nginx -t && systemctl reload nginx`
2. `/root/yedigul/.env` → `ALLOWED_IPS` → `systemctl restart yedigul-admin`

Ev ya da restoran internetinin IP'si değişkense (çoğu ev hattında değişir)
panel o gün 403 verir; yeni IP'yi ekle ya da servis sağlayıcıdan sabit IP iste.

## Doğrulama

1. İzinli ağdan `https://www.yedigulrestorant.com/admin/` açılıyor, şifreyle giriş yapılıyor.
2. Mobil veriden (izinsiz IP) aynı adres **403** veriyor.
3. Sunucu IP'sine doğrudan, sahte başlıkla deneme de 403:
   `curl -sk -o /dev/null -w '%{http_code}' -H 'Host: www.yedigulrestorant.com' -H 'CF-Connecting-IP: <izinli-ip>' https://SUNUCU_IP/admin/` → `403`
4. `https://www.yedigulrestorant.com/api/admin/menu` → 404 (public süreç), `/menu/` eskisi gibi açılıyor.
5. `ss -ltnp | grep -E '3001|3002'` → yalnız `127.0.0.1`.
6. Test ürünü ekle → düzenle → görsel yükle → sil; canlı menüde ve geçmişte görünüyor.

## Lokal geliştirme

```bash
npm run dev      # menü :5173/menu/, panel :5174/admin/, API :3001
npm run panel    # her şey derlenmiş halde: http://localhost:3001/admin/
```

Lokal geliştirmede `PUBLIC_HOST` ve `ALLOWED_IPS` boş bırakılır; panel
yalnız `localhost`'tan açılır.

## Bilinmesi gerekenler

- **Panel ana siteyle aynı adreste.** Ana sitede ya da menüde bir güvenlik
  açığı (XSS) çıkarsa, o açık panelle aynı kökende çalışır. Site ve menüye
  dışarıdan içerik eklenmediği için risk düşük, ama bu sayfalara üçüncü parti
  script eklerken dikkatli olunmalı.
- **Oturum** 8 saat işlem yapılmazsa kapanır. `yedigul-admin` servisi yeniden
  başlarsa (ör. `update.sh` sonrası) tekrar giriş yapmak gerekir.
