#!/usr/bin/env bash
# =============================================================================
# Yedigül — sunucuda tek komutla güncelleme.
#
#   Kullanım (sunucuda):   cd /root/yedigul && ./update.sh
#   (ilk sefer gerekirse:  chmod +x update.sh)
#
# Yaptığı iş sırasıyla:
#   1) git pull            → en güncel kodu çeker
#   2) npm ci              → bağımlılıkları lockfile'a birebir kurar
#   3) npm run build       → menü + admin (React) uygulamasını dist/ içine derler
#   4) servis restart      → server/ (CSP vb.) değişikliklerinin geçerli olması için
#   5) sağlık kontrolü     → :3001 ayakta mı, doğrular
#
# Not: www/ (ana sayfa + rehber sayfaları) statik servis edilir; teknik olarak
# restart gerekmez ama /menu/ derlemesi ve sunucu değişiklikleri için tüm
# adımlar her seferinde çalıştırılır (deterministik, güvenli).
# =============================================================================
set -euo pipefail

# Betiğin bulunduğu klasöre geç (nereden çağrılırsa çağrılsın doğru dizin).
cd "$(dirname "$0")"

# systemctl için: kök değilsek başına sudo koy.
SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

SERVICE="yedigul"          # systemd servis adı / pm2 süreç adı
PORT="${PORT:-3001}"

echo "════════════════════════════════════════════════"
echo "  Yedigül güncelleme başlıyor — $(pwd)"
echo "════════════════════════════════════════════════"

# 1) Kodu çek --------------------------------------------------------------
before="$(git rev-parse --short HEAD)"
echo "▶ [1/4] git pull …"
git pull --ff-only
after="$(git rev-parse --short HEAD)"

if [ "$before" = "$after" ]; then
  echo "  ℹ Zaten güncel ($after) — yine de derleyip yeniden başlatılıyor."
else
  echo "  ✔ $before → $after"
  git --no-pager log --oneline "$before..$after" | sed 's/^/     /'
fi

# 2) Bağımlılıklar ---------------------------------------------------------
echo "▶ [2/4] npm ci …"
npm ci

# 3) Ön yüz derle ----------------------------------------------------------
# Build başarısız olursa set -e ile burada durur; eski dist/ ve çalışan
# servis olduğu gibi kalır (site bozulmaz).
echo "▶ [3/4] npm run build …"
npm run build

# 4) Servisi yeniden başlat -----------------------------------------------
echo "▶ [4/4] servis yeniden başlatılıyor ($SERVICE) …"
if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE}\.service"; then
  $SUDO systemctl restart "$SERVICE"
  echo "  ✔ systemd: $SERVICE yeniden başlatıldı"
elif command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "$SERVICE"; then
  pm2 restart "$SERVICE"
  echo "  ✔ pm2: $SERVICE yeniden başlatıldı"
else
  echo "  ⚠ '$SERVICE' systemd servisi veya pm2 süreci bulunamadı."
  echo "    Node sürecini elle yeniden başlatın (ör. systemctl restart $SERVICE)."
  exit 1
fi

# 5) Sağlık kontrolü -------------------------------------------------------
echo "▶ Sağlık kontrolü — http://localhost:$PORT …"
sleep 2
code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || echo 000)"
if [ "$code" = "200" ]; then
  echo "  ✔ Site ayakta (HTTP $code)"
else
  echo "  ⚠ Beklenmeyen yanıt: HTTP $code — servis günlüğüne bakın:"
  echo "    $SUDO journalctl -u $SERVICE -n 40 --no-pager"
  exit 1
fi

echo "════════════════════════════════════════════════"
echo "  ✅ Güncelleme tamamlandı — sürüm $after"
echo "════════════════════════════════════════════════"
