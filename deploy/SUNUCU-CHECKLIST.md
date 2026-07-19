# Sunucuda Çalıştırılacaklar — Üretim Sağlamlık Kontrolü

Kaynak: `files/yedigulrestorant-production-checklist.md` + frontend audit.
Repo tarafında yapılabilecek her şey yapıldı; bu dosyadaki adımlar **sunucuda
(SSH)** çalıştırılmalı. Sırayla ilerle, her adımın "Kabul" satırını doğrula.

> Yol varsayımı: repo sunucuda `/root/yedigul` altında. Farklıysa
> `deploy/db-backup.sh` ve `deploy/yedigul.service` içindeki `<< DÜZENLE >>`
> satırlarını kendi yoluna göre değiştir.

---

## A1. Günlük SQLite yedeği (EN YÜKSEK ÖNCELİK)

```bash
sudo apt-get install -y sqlite3
sudo mkdir -p /opt/backups
sudo cp /root/yedigul/deploy/db-backup.sh /opt/backups/db-backup.sh
sudo nano /opt/backups/db-backup.sh      # APP_DIR yolunu doğrula
sudo chmod +x /opt/backups/db-backup.sh
/opt/backups/db-backup.sh                # elle bir kez çalıştır, çıktıyı gör
( crontab -l 2>/dev/null; echo "0 4 * * * /opt/backups/db-backup.sh" ) | crontab -
```

**Kabul:** `/opt/backups/yedigul/` içinde `.db.gz` oluştu; `crontab -l` girdiyi
gösteriyor. **Ayrıca** script sonundaki rsync satırını açıp yedeği sunucu
DIŞINA da kopyala (başka makine / object storage) — sunucu ölürse yedek ölmesin.

## A2. SSL otomatik yenileme

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep -i certbot
```

**Kabul:** dry-run başarılı + certbot timer aktif.
Cloudflare Origin Certificate kullanıyorsan certbot yoktur — o sertifika 15 yıl
geçerlidir, bu adımı "geçerli" olarak işaretle.

## A3. Node süreci yönetici altında

Şu an ne kullanıldığını bul: `pm2 list` veya `systemctl status yedigul`.
Canlı yönetim izolasyonu için iki systemd servisine geçir:

```bash
sudo cp /root/yedigul/deploy/yedigul.service /etc/systemd/system/yedigul.service
sudo cp /root/yedigul/deploy/yedigul-admin.service /etc/systemd/system/yedigul-admin.service
sudo systemctl daemon-reload
sudo systemctl enable --now yedigul yedigul-admin
systemctl status yedigul yedigul-admin
```

Eski pm2 `yedigul` süreci varsa iki systemd servisi aktif olduktan sonra
`pm2 delete yedigul && pm2 save` ile kaldır; aynı portta ikinci süreç bırakma.

**Kabul:** iki servis de `enabled` + `active (running)`; `sudo reboot` sonrası
kendiliğinden kalkıyor. `ss -ltnp` çıktısında `3001` ve `3002` yalnız
`127.0.0.1` üzerinde dinliyor.

## A4. Disk doluluğu

```bash
df -h                       # kök disk < %85 olmalı
du -sh /* 2>/dev/null | sort -h | tail    # en büyükler (Minecraft/AI pipeline'a dikkat)
journalctl --disk-usage
sudo journalctl --vacuum-size=500M        # loglar şiştiyse
```

**Kabul:** kök disk < %85, log rotation aktif (`/etc/logrotate.d/` mevcut).

## B2. Firewall — yalnız 22/80/443

Node artık `.env`'de `HOST=127.0.0.1` ile localhost'a bağlanabiliyor
(repo'da destek eklendi). Nginx kurulumundan SONRA:

```bash
# .env'e TRUST_PROXY=1 ekle; systemd servisleri HOST'u loopback'e sabitler
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
# dışarıdan test (başka makineden): curl http://SUNUCU-IP:3001  → bağlanamamalı
```

**Kabul:** yalnız 22/80/443 açık; 3001 dışarıdan erişilemiyor.
⚠️ Şu an QR kodlar `http://IP:3001` yerine `https://www.yedigulrestorant.com`
üretiyor (panel ayarı düzeltildi) — 3001'i kapatmadan önce Nginx'in
çalıştığından emin ol, yoksa site erişilmez olur.

## B3 + Nginx 301 (audit Görev 2)

```bash
sudo cp /root/yedigul/deploy/nginx-yedigul.conf /etc/nginx/sites-available/yedigulrestorant.com
sudo nano /etc/nginx/sites-available/yedigulrestorant.com   # sertifika yollarını doğrula
sudo ln -sf /etc/nginx/sites-available/yedigulrestorant.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://yedigulrestorant.com/ | grep -i location   # → https://www... (301)
```

**Kabul:** www'suz adres 301 ile www'ya gidiyor; https://securityheaders.com
taramasında HSTS/nosniff/XFO/Referrer-Policy görünüyor.
⚠️ Cloudflare'de "Always Use HTTPS" / redirect kuralı zaten varsa çifte 301
zinciri kurma — birini seç.

## D5. Uptime izleme (5 dk, ücretsiz)

https://uptimerobot.com → hesap aç → HTTP(s) monitor:
`https://www.yedigulrestorant.com/menu/` (5 dk aralık, e-posta bildirimi).

---

## Deploy sonrası hızlı doğrulama

```bash
cd /root/yedigul && git pull && npm ci && npm run build   # public build
sudo systemctl restart yedigul yedigul-admin
curl -s https://www.yedigulrestorant.com/api/menu | head -c 200   # JSON gelmeli
curl -s http://127.0.0.1:3002/api/health                         # {"ok":true}
test "$(curl -s -o /dev/null -w '%{http_code}' https://www.yedigulrestorant.com/api/auth/me)" = "404"
```

Tarayıcıdan: `/menu/` yeni tasarım + fotoğraflar, ana sayfa `/` değişen head
etiketleri (`view-source:` ile `og:image` tam URL mi bak).
