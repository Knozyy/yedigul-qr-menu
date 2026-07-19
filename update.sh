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
#   3) npm run build       → yalnız public menüyü dist/ içine derler
#   4) servis restart      → public + private süreçleri yeniden başlatır
#   5) sağlık kontrolü     → :3001 ve :3002 izolasyonunu doğrular
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

PUBLIC_SERVICE="yedigul"
PRIVATE_SERVICE="yedigul-admin"
PUBLIC_PORT="${PUBLIC_PORT:-3001}"
PRIVATE_PORT="${PRIVATE_PORT:-3002}"

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

# 4) İki izole servisi yeniden başlat --------------------------------------
echo "▶ [4/4] public ve private servisler yeniden başlatılıyor …"
if ! command -v systemctl >/dev/null 2>&1 \
  || ! systemctl list-unit-files 2>/dev/null | grep -q "^${PUBLIC_SERVICE}\.service" \
  || ! systemctl list-unit-files 2>/dev/null | grep -q "^${PRIVATE_SERVICE}\.service"; then
  echo "  ⚠ İki systemd servisi de kurulu olmalı: $PUBLIC_SERVICE ve $PRIVATE_SERVICE"
  echo "    deploy/yedigul*.service dosyalarını /etc/systemd/system/ altına kurun."
  exit 1
fi
$SUDO systemctl restart "$PUBLIC_SERVICE" "$PRIVATE_SERVICE"
echo "  ✔ systemd: iki servis yeniden başlatıldı"

# 5) Sağlık kontrolü -------------------------------------------------------
echo "▶ Sağlık kontrolü — public :$PUBLIC_PORT + private :$PRIVATE_PORT …"
sleep 2
public_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PUBLIC_PORT/api/health" || echo 000)"
private_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PRIVATE_PORT/api/health" || echo 000)"
public_auth_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PUBLIC_PORT/api/auth/me" || echo 000)"
if [ "$public_code" = "200" ] && [ "$private_code" = "200" ] && [ "$public_auth_code" = "404" ]; then
  echo "  ✔ Public ve private servisler ayakta; public auth kapalı"
else
  echo "  ⚠ Beklenmeyen yanıt: public=$public_code private=$private_code public-auth=$public_auth_code"
  echo "    $SUDO journalctl -u $PUBLIC_SERVICE -u $PRIVATE_SERVICE -n 60 --no-pager"
  exit 1
fi

echo "════════════════════════════════════════════════"
echo "  ✅ Güncelleme tamamlandı — sürüm $after"
echo "════════════════════════════════════════════════"
